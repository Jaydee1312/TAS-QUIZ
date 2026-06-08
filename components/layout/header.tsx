import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import { Zap } from "lucide-react";
import type { AppUser } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Trang chính" },
  { href: "/leaderboard", label: "Xếp hạng" },
  { href: "/profile", label: "Hồ sơ" },
];

export function Header({ user }: { user: AppUser }) {
  const isAdmin = user.role === "admin";

  return (
    <header className="glass sticky top-0 z-40 border-b border-hairline">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-9">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight-apple"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span>TAS GLOBAL QUIZ</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-[14px] text-primary transition-colors hover:text-primary-focus"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-border/60 sm:flex"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            {user.total_points}
          </Link>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
