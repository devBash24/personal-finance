import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/db/queries";
import { DashboardNav } from "@/components/dashboard-nav";
import { SWRProvider } from "@/components/swr-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureProfile(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-background min-w-0">
      <DashboardNav />
      <SWRProvider>
        <main className="flex-1 p-4 lg:p-6 min-w-0 max-w-full">{children}</main>
      </SWRProvider>
    </div>
  );
}
