"use client";

import { useEffect, useState } from "react";
import { fetchInsightsAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Insight = {
  id: string;
  prompt: string;
  response: string;
  createdAt: Date | string;
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetchInsightsAction();
    setLoading(false);
    if (res.error) setError(res.error);
    else setInsights(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = prompt.trim();
    if (!p) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        if (json.remaining !== undefined) setRemaining(json.remaining);
        return;
      }
      setPrompt("");
      setRemaining(json.remaining ?? null);
      load();
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Ask questions about your finances. Rate-limited.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
          <CardDescription>
            e.g. &ldquo;Where am I overspending?&rdquo; or &ldquo;Can I increase
            savings safely?&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {remaining !== null && (
              <p className="text-sm text-muted-foreground">
                Requests remaining this hour: {remaining}
              </p>
            )}
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="prompt" className="sr-only">
                  Question
                </Label>
                <Input
                  id="prompt"
                  placeholder="Your question…"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Ask"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previous insights</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : insights.length === 0 ? (
            <p className="text-muted-foreground">
              No insights yet. Ask a question above.
            </p>
          ) : (
            <ul className="space-y-4">
              {insights.map((i) => (
                <li
                  key={i.id}
                  className="rounded-lg border border-border p-4 space-y-2"
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    {i.prompt}
                  </p>
                  <p className="text-sm">{i.response}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(i.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
