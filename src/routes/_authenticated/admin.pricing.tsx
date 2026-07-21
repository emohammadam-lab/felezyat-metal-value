import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: () => <AppShell><PricingAdmin /></AppShell>,
});

function PricingAdmin() {
  const [p, setP] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("pricing_config").select("*").eq("id", 1).maybeSingle().then(({ data }) => setP(data));
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("pricing_config").update({
      copper_price_usd: p.copper_price_usd,
      usd_rate: p.usd_rate,
      fee_percent: p.fee_percent,
      default_deduction_percent: p.default_deduction_percent,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("قیمت‌گذاری به‌روزرسانی شد.");
  }

  if (!p) return <div>در حال بارگذاری...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold mb-6">تنظیم موتور قیمت‌گذاری</h1>
      <Card className="p-6 space-y-4">
        <Field label="قیمت جهانی مس (دلار به ازای کیلوگرم)" value={p.copper_price_usd} onChange={(v) => setP({ ...p, copper_price_usd: v })} />
        <Field label="نرخ دلار (ریال)" value={p.usd_rate} onChange={(v) => setP({ ...p, usd_rate: v })} />
        <Field label="کارمزد پلتفرم (٪)" value={p.fee_percent} onChange={(v) => setP({ ...p, fee_percent: v })} />
        <Field label="کسورات پیش‌فرض (٪)" value={p.default_deduction_percent} onChange={(v) => setP({ ...p, default_deduction_percent: v })} />
        <Button onClick={save} disabled={saving} className="w-full">{saving ? "..." : "ذخیره تغییرات"}</Button>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" step="0.01" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5" dir="ltr" />
    </div>
  );
}
