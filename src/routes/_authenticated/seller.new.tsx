import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { calcEstimatedPrice, formatToman, SCRAP_TYPE_LABELS } from "@/lib/format";
import { Upload, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seller/new")({
  component: () => <AppShell><NewShipment /></AppShell>,
});

const PURITY_DEFAULT: Record<string, number> = {
  coated_cable: 55,
  burnt: 88,
  shavings: 92,
  body: 96,
  other: 70,
};

function NewShipment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pricing, setPricing] = useState<any>(null);
  const [scrapType, setScrapType] = useState("coated_cable");
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState(55);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("pricing_config").select("*").eq("id", 1).maybeSingle().then(({ data }) => setPricing(data));
  }, []);

  useEffect(() => {
    setPurity(PURITY_DEFAULT[scrapType] ?? 70);
  }, [scrapType]);

  const estimate = useMemo(() => {
    if (!pricing || !weight) return 0;
    return calcEstimatedPrice({
      weightKg: Number(weight),
      purityPercent: purity,
      copperUsd: Number(pricing.copper_price_usd),
      usdRate: Number(pricing.usd_rate),
      feePercent: Number(pricing.fee_percent ?? 0),
      deductionPercent: Number(pricing.deduction_percent ?? 0),
    });
  }, [pricing, weight, purity]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const path = `${user.id}/${Date.now()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("shipment-photos").upload(path, f);
        if (upErr) throw upErr;
        urls.push(path);
      }
      const { error } = await supabase.from("shipments").insert({
        seller_id: user.id,
        scrap_type: scrapType as any,
        estimated_weight: Number(weight),
        purity_percent: purity,
        address: address,
        description: notes,
        photos: urls,
        estimated_price: estimate,
        status: "awaiting_expert",
      });
      if (error) throw error;
      toast.success("محموله ثبت شد و در صف کارشناسی قرار گرفت.");
      navigate({ to: "/seller/orders" });
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-6">ثبت محموله جدید</h1>
      <form onSubmit={submit} className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>نوع ضایعات</Label>
              <Select value={scrapType} onValueChange={setScrapType}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SCRAP_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>وزن تقریبی (کیلوگرم)</Label>
              <Input type="number" min={1} step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1.5" dir="ltr" />
            </div>
          </div>
          <div>
            <Label>درصد خلوص تخمینی: {purity}٪</Label>
            <input type="range" min={30} max={99} value={purity} onChange={(e) => setPurity(Number(e.target.value))} className="w-full mt-2" />
          </div>
          <div>
            <Label>آدرس بارگیری</Label>
            <Input required value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" placeholder="تهران، ..." />
          </div>
          <div>
            <Label>توضیحات (اختیاری)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" rows={3} />
          </div>
          <div>
            <Label>تصاویر محموله</Label>
            <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">افزودن تصویر</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])} />
            </label>
            {files.length > 0 && (
              <div className="mt-3 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-secondary/50 rounded p-2">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 h-fit sticky top-6" style={{ boxShadow: "var(--shadow-copper)" }}>
          <div className="text-sm text-muted-foreground">قیمت تخمینی</div>
          <div className="text-3xl font-extrabold text-primary mt-2">{formatToman(estimate)}</div>
          <div className="text-xs text-muted-foreground mt-3 leading-6">
            بر پایه نرخ فعلی مس، دلار روز و درصد خلوص وارد شده. قیمت نهایی پس از کارشناسی اعلام می‌شود.
          </div>
          <Button type="submit" className="w-full mt-6" disabled={submitting || !weight}>
            {submitting ? "در حال ارسال..." : "ارسال برای کارشناسی"}
          </Button>
        </Card>
      </form>
    </div>
  );
}
