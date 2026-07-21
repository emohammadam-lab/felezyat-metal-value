import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatToman, formatNumber, formatDate, SCRAP_TYPE_LABELS, STATUS_LABELS, STATUS_TONE } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: () => <AppShell><AdminOrders /></AppShell>,
});

function AdminOrders() {
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function settle(s: any) {
    if (!s.final_price_toman) return toast.error("قیمت نهایی مشخص نیست.");
    const amount = Number(s.final_price_toman);
    const { error: uErr } = await supabase.from("shipments").update({ status: "settled" }).eq("id", s.id);
    if (uErr) return toast.error(uErr.message);
    const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", s.seller_id).maybeSingle();
    const newBal = Number(w?.balance ?? 0) + amount;
    await supabase.from("wallets").upsert({ user_id: s.seller_id, balance: newBal });
    await supabase.from("transactions").insert({
      user_id: s.seller_id,
      shipment_id: s.id,
      type: "credit",
      amount,
      description: `تسویه محموله ${SCRAP_TYPE_LABELS[s.scrap_type]}`,
    });
    toast.success("تسویه انجام شد و به کیف پول واریز گردید.");
    load();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">مدیریت سفارش‌ها</h1>
      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{SCRAP_TYPE_LABELS[s.scrap_type]}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{formatNumber(Number(s.actual_weight_kg ?? s.weight_kg))} کیلو</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{formatDate(s.created_at)}</div>
                {s.pickup_address && <div className="text-sm mt-2">{s.pickup_address}</div>}
              </div>
              <div className="text-left">
                <span className={"text-xs px-2 py-1 rounded-full inline-block mb-2 " + (STATUS_TONE[s.status] || "bg-secondary")}>{STATUS_LABELS[s.status]}</span>
                <div className="text-lg font-bold text-primary">{formatToman(s.final_price_toman ?? s.estimated_price_toman)}</div>
                {s.status === "weighed" && (
                  <Button size="sm" className="mt-2" onClick={() => settle(s)}>تسویه و واریز</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card className="p-10 text-center text-muted-foreground">سفارشی وجود ندارد.</Card>}
      </div>
    </div>
  );
}
