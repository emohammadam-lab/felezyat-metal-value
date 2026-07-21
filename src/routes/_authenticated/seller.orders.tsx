import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatToman, formatNumber, formatDate, SCRAP_TYPE_LABELS, STATUS_LABELS, STATUS_TONE } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/seller/orders")({
  component: () => <AppShell><Orders /></AppShell>,
});

function Orders() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("shipments").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [user]);

  async function approve(id: string) {
    const { error } = await supabase.from("shipments").update({ status: "seller_approved" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("قیمت تایید شد. کارشناس برای هماهنگی حمل تماس می‌گیرد.");
    load();
  }
  async function reject(id: string) {
    const { error } = await supabase.from("shipments").update({ status: "rejected" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast("محموله رد شد.");
    load();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">سفارش‌های من</h1>
      {items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">هنوز محموله‌ای ثبت نکرده‌اید.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{SCRAP_TYPE_LABELS[s.scrap_type]}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{formatNumber(Number(s.weight_kg))} کیلوگرم</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{formatNumber(s.estimated_purity_percent)}٪ خلوص</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(s.created_at)}</div>
                  {s.pickup_address && <div className="text-sm mt-2 text-muted-foreground">{s.pickup_address}</div>}
                </div>
                <div className="text-left">
                  <span className={"text-xs px-2 py-1 rounded-full inline-block mb-2 " + (STATUS_TONE[s.status] || "bg-secondary")}>{STATUS_LABELS[s.status] || s.status}</span>
                  <div className="text-lg font-bold text-primary">{formatToman(s.final_price_toman ?? s.estimated_price_toman)}</div>
                  {s.final_price_toman && !s.actual_weight_kg && (
                    <div className="text-xs text-success mt-1">قیمت نهایی اعلام شد</div>
                  )}
                </div>
              </div>
              {s.status === "price_offered" && (
                <div className="mt-4 flex gap-2 pt-4 border-t">
                  <Button size="sm" onClick={() => approve(s.id)}>تایید و ارسال بار</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(s.id)}>انصراف</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
