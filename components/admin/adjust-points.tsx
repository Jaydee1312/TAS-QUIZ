"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, SlidersHorizontal } from "lucide-react";

export function AdjustPoints({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [delta, setDelta] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    const d = Number(delta);
    if (!d) {
      toast.error("Nhập số điểm (vd: 10 hoặc -5)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/user/${userId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: d, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Thất bại");
      toast.success("Đã cập nhật điểm");
      setOpen(false);
      setDelta("");
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <SlidersHorizontal className="h-4 w-4" /> Điểm
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Điều chỉnh điểm — {userName}</DialogTitle>
          <DialogDescription>
            Nhập số dương để cộng, số âm để trừ.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="delta">Số điểm</Label>
            <Input
              id="delta"
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="vd: 10 hoặc -5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do (tùy chọn)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="vd: Thưởng tham gia sự kiện"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
