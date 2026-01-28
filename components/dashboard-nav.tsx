"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { MonthPicker } from "@/components/month-picker";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/income", label: "Income" },
  { href: "/dashboard/expenses", label: "Expenses" },
  { href: "/dashboard/savings", label: "Savings" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/subscriptions", label: "Subscriptions" },
  { href: "/dashboard/debts", label: "Debts" },
  { href: "/dashboard/changes", label: "Changes" },
  { href: "/dashboard/insights", label: "Insights" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { email, setUser, clear } = useUserStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user.id, user.email ?? null);
      else clear();
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(session.user.id, session.user.email ?? null);
      else clear();
    });
    return () => subscription.unsubscribe();
  }, [setUser, clear]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clear();
    router.push("/");
    router.refresh();
  }

  const initial = email ? email[0].toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <Link href="/dashboard" className="font-semibold">
          Finance OS
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {NAV.map(({ href, label }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/dashboard/overview"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <MonthPicker />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {email && (
                <DropdownMenuItem disabled className="font-normal">
                  {email}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <nav className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2 border-t border-border min-w-0">
        {NAV.map(({ href, label }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/dashboard/overview"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
