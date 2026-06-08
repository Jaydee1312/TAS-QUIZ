import { createClient } from "@/lib/supabase/server";
import { getPointsConfig } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { Sliders } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const config = await getPointsConfig(supabase);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Sliders className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight-apple">
            Cấu hình điểm thưởng
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Đổi mức điểm cho cả hệ thống — áp dụng ngay, không cần deploy lại.
          </p>
        </div>
      </div>

      <SettingsForm initial={config} />
    </div>
  );
}
