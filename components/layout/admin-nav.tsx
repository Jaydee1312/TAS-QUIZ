"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Tổng quan", exact: true },
  { href: "/admin/quizzes", label: "Bài trắc nghiệm" },
  { href: "/admin/users", label: "Người dùng" },
];

export function AdminNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const items = isSuperAdmin
    ? [...ITEMS, { href: "/admin/admins", label: "Quản lý admin" }]
    : ITEMS;

  return (
    <div className="border-b border-hairline bg-surface/60">
      <div className="container flex h-12 items-center gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
