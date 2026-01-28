import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-muted/30">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Personal Finance OS</h1>
        <p className="text-muted-foreground max-w-md">
          Track income, expenses, savings, debts, and subscriptions. View
          analytics and optional AI insights.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
