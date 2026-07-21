import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatToman, formatNumber, formatDate, SCRAP_TYPE_LABELS, STATUS_LABELS, STATUS_TONE, calcEstimatedPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/expert/queue")({
  component: () => <AppShell><Queue /></AppShell>,
});

function Queue() {
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);

  async function load() {
    const { data } = await supabase.from("shipments").select("*").in("status", ["awaiting_expert", "price_offered", "seller_approved", "weighed"]).order("created_at", { ascending: false });
    setItems(data ?? []);
    const { data: p } = await supabase.from("pricing_config").select("*").eq("id", 1).maybeSingle();
    setPricing(p);
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">صف کارشناسی</h1>
      {items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">صف خالی است.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <ShipmentCard key={s.id} s={s} pricing={pricing} onDone={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShipmentCard({ s, pricing, onDone }: any) {
  const [finalPurity, setFinalPurity] = useState(s.purity_percent || 70);
  const [deduction, setDeduction] = useState(Number(pricing?.deduction_percent ?? 8));
  const [actualWeight, setActualWeight] = useState(s.actual_estimated_weight || s.estimated_weight);
  const [loading, setLoading] = useState(false);

  const finalPrice = pricing ? calcEstimatedPrice({
    weightKg: Number(actualWeight || s.estimated_weight),
    purityPercent: Number(finalPurity),
    copperUsd: Number(pricing.copper_price_usd),
    usdRate: Number(pricing.usd_rate),
    feePercent: Number(pricing.fee_percent ?? 0),
    deductionPercent: Number(deduction),
  }) : 0;

  async function offer() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("shipments").update({
      purity_percent: finalPurity,
      final_price: finalPrice,
      expert_id: u.user?.id,
      status: "price_offered",
    }).eq("id", s.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("قیمت نهایی اعلام شد.");
    onDone();
  }

  async function markWeighed() {
    setLoading(true);
    const finalPriceReal = pricing ? calcEstimatedPrice({
      weightKg: Number(actualWeight),
      purityPercent: Number(s.purity_percent || finalPurity),
      copperUsd: Number(pricing.copper_price_usd),
      usdRate: Number(pricing.usd_rate),
      feePercent: Number(pricing.fee_percent ?? 0),
      deductionPercent: Number(deduction),
    }) : 0;
    const { error } = await supabase.from("shipments").update({
      actual_estimated_weight: actualWeight,
      final_price: finalPriceReal,
      status: "weighed",
    }).eq("id", s.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("توزین ثبت شد. آماده تسویه توسط مدیر.");
    onDone();
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">{SCRAP_TYPE_LABELS[s.scrap_type]}</span>
            <span className="text-muted-foreground">•</span>
            <span>{formatNumber(Number(s.estimated_weight))} کیلو تخمینی</span>
            <span className="text-muted-foreground">•</span>
            <span>خلوص اعلامی {formatNumber(s.purity_percent)}٪</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{formatDate(s.created_at)}</div>
          {s.address && <div className="text-sm mt-2">{s.address}</div>}
          {s.description && <div className="text-xs mt-1 text-muted-foreground">یادداشت: {s.description}</div>}
        </div>
        <div className="text-left">
          <span className={"text-xs px-2 py-1 rounded-full inline-block mb-2 " + (STATUS_TONE[s.status] || "bg-secondary")}>{STATUS_LABELS[s.status]}</span>
          <div className="text-sm text-muted-foreground">تخمین: {formatToman(s.estimated_price)}</div>
          {s.final_price && <div className="text-base font-bold text-primary">نهایی: {formatToman(s.final_price)}</div>}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
        {s.status === "awaiting_expert" && (
          <Dialog>
            <DialogTrigger asChild><Button size="sm">ثبت کارشناسی و قیمت نهایی</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>کارشناسی و قیمت‌گذاری</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>درصد خلوص نهایی: {finalPurity}٪</Label>
                  <input type="range" min={30} max={99} value={finalPurity} onChange={(e) => setFinalPurity(Number(e.target.value))} className="w-full mt-2" />
                </div>
                <div>
                  <Label>درصد کسورات: {deduction}٪</Label>
                  <input type="range" min={0} max={30} step={0.5} value={deduction} onChange={(e) => setDeduction(Number(e.target.value))} className="w-full mt-2" />
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="text-sm text-muted-foreground">قیمت نهایی پیشنهادی</div>
                  <div className="text-2xl font-extrabold text-primary mt-1">{formatToman(finalPrice)}</div>
                </div>
                <Button onClick={offer} disabled={loading} className="w-full">اعلام قیمت به فروشنده</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {s.status === "seller_approved" && (
          <Dialog>
            <DialogTrigger asChild><Button size="sm">ثبت توزین باسکول</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ثبت وزن واقعی</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>وزن واقعی (کیلوگرم)</Label>
                  <Input type="number" step="0.1" value={actualWeight} onChange={(e) => setActualWeight(e.target.value)} className="mt-1.5" dir="ltr" />
                </div>
                <Button onClick={markWeighed} disabled={loading} className="w-full">ثبت و ارسال برای تسویه</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Card>
  );
}
