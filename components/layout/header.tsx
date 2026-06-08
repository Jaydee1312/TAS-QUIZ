import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield } from "lucide-react";
import type { AppUser } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Trang chính" },
  { href: "/leaderboard", label: "Xếp hạng" },
  { href: "/profile", label: "Hồ sơ" },
];

export function Header({ user }: { user: AppUser }) {
  const isAdmin = user.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold tracking-tight text-transparent">
              TAS GLOBAL QUIZ
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-primary transition-colors hover:bg-secondary"
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden gap-1.5 sm:flex">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {user.total_points} điểm
          </Badge>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
