import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  createAiInsight,
  getOrCreateMonth,
  getIncomeForMonth,
  getAdditionalIncomeForMonth,
  getExpensesForMonth,
} from "@/db/queries";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok, remaining } = checkRateLimit(user.id);
  if (!ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", remaining: 0 },
      { status: 429 }
    );
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  if (!openai) {
    return NextResponse.json(
      { error: "AI insights are not configured. Set OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const m = await getOrCreateMonth(user.id, month, year);
  const [income, additionalIncome, expenses] = await Promise.all([
    getIncomeForMonth(user.id, m.id),
    getAdditionalIncomeForMonth(user.id, m.id),
    getExpensesForMonth(user.id, m.id),
  ]);

  let totalExpenses = 0;
  for (const ex of expenses) {
    totalExpenses += parseFloat(String(ex.amount) || "0");
  }
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    const name = (e as { categoryName?: string }).categoryName ?? "Other";
    byCategory[name] = (byCategory[name] ?? 0) + parseFloat(String(e.amount) || "0");
  }

  let incomeDesc =
    income
      ? `Primary net: ${income.netIncome}. Gross: ${income.grossIncome}, Tax: ${income.taxDeduction}, NIS: ${income.nisDeduction}, Other: ${income.otherDeductions}.`
      : "No primary income this month.";
  let additionalTotal = 0;
  for (const a of additionalIncome) {
    additionalTotal += parseFloat(String(a.amount) || "0");
  }
  if (additionalTotal > 0) {
    incomeDesc += ` Additional income: ${additionalTotal}.`;
  }

  const context = [
    income || additionalIncome.length > 0
      ? incomeDesc
      : "No income recorded this month.",
    `Total expenses this month: ${totalExpenses}.`,
    Object.keys(byCategory).length > 0
      ? `By category: ${Object.entries(byCategory)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const systemContent = `You are a helpful personal finance assistant. The user tracks income, expenses, savings, debts, and subscriptions. Answer briefly based on the following context. Be concise and actionable.

Context: ${context}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "No response.";
    await createAiInsight(user.id, { monthId: m.id, prompt, response: reply });

    return NextResponse.json({ response: reply, remaining });
  } catch (e) {
    console.error("AI route error:", e);
    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}
