"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import { Loader2, UserPlus, ShieldCheck, Trash2, Clock } from "lucide-react";

export interface AdminEntry {
  email: string;
  name: string | null;
  avatar_url: string | null;
  isSuper: boolean;
  pending: boolean; // có trong allowlist nhưng chưa đăng nhập lần nào
  note: string | null;
}

export function AdminManager({ entries }: { entries: AdminEntry[] }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [note, setNote] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState(false);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Thất bại");
      toast.success(`Đã cấp quyền admin cho ${data.email}`);
      setEmail("");
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setAdding(false);
    }
  }

  async function removeAdmin() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: removeTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Thất bại");
      toast.success("Đã gỡ quyền admin");
      setRemoveTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Form thêm admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[19px]">
            <UserPlus className="h-5 w-5 text-primary" /> Cấp quyền admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={addAdmin}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="email">Email Google của người được cấp quyền</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nguoidung@gmail.com"
                required
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="vd: Giảng viên buổi 3"
              />
            </div>
            <Button type="submit" disabled={adding} className="gap-2">
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Thêm admin
            </Button>
          </form>
          <p className="mt-3 text-[13px] text-muted-foreground">
            Người được cấp quyền chỉ cần đăng nhập Google bằng đúng email này là
            có quyền admin (tạo / sửa bài, quản lý người dùng).
          </p>
        </CardContent>
      </Card>

      {/* Danh sách admin */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[19px]">
            Admin hiện tại ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-hairline">
            {entries.map((a) => (
              <div
                key={a.email}
                className="flex items-center justify-between gap-3 px-6 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar>
                    {a.avatar_url ? (
                      <AvatarImage src={a.avatar_url} alt={a.email} />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(a.name, a.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {a.name ?? a.email.split("@")[0]}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {a.email}
                      {a.note ? ` · ${a.note}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.isSuper ? (
                    <Badge className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Super admin
                    </Badge>
                  ) : a.pending ? (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> Chờ đăng nhập
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Admin</Badge>
                  )}
                  {!a.isSuper && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveTarget(a.email)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={removeTarget !== null}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gỡ quyền admin?</DialogTitle>
            <DialogDescription>
              {removeTarget} sẽ trở về quyền người dùng thường và không còn truy
              cập được khu vực admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={removeAdmin}
              disabled={removing}
              className="gap-2"
            >
              {removing && <Loader2 className="h-4 w-4 animate-spin" />}
              Gỡ quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
