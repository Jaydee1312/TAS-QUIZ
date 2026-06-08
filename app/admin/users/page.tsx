import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdjustPoints } from "@/components/admin/adjust-points";
import { formatDate, getInitials } from "@/lib/utils";
import type { AppUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("users")
    .select("*")
    .order("total_points", { ascending: false });
  const users = (rows ?? []) as AppUser[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quản lý người dùng ({users.length})</h1>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar>
                    {u.avatar_url ? (
                      <AvatarImage src={u.avatar_url} alt={u.name ?? u.email} />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(u.name, u.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {u.name ?? "Người dùng"}
                      </p>
                      {u.role === "admin" && <Badge>Admin</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email} · tham gia {formatDate(u.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-primary tabular-nums">
                    {u.total_points} điểm
                  </span>
                  <AdjustPoints userId={u.id} userName={u.name ?? u.email} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
