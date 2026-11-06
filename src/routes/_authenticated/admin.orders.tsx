import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type Shipment } from "@/lib/api";
import {
  formatToman,
  formatNumber,
  formatDate,
  SCRAP_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
} from "@/lib/format";
import { CheckCircle2, Phone, MapPin, User, Scale, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: () => <AppShell><AdminOrders /></AppShell>,
});

function AdminOrders() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [previewPhotos, setPreviewPhotos] = useState<string[] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.shipments.list({ status: filter });
      setItems(data);
    } catch (err: any) {
      toast.error("خطا در بارگذاری سفارش‌ها: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function handleSettle(s: Shipment) {
    if (!s.final_price) {
      return toast.error("قیمت نهایی مشخص نیست؛ محموله باید ابتدا وزن و کارشناسی شود.");
    }
    if (!confirm(`آیا از تسویه آنی مبلغ ${formatToman(s.final_price)} و شارژ کیف پول فروشنده اطمینان دارید؟`)) {
      return;
    }

    setSettlingId(s.id);
    try {
      await api.shipments.settle(s.id);
      toast.success("تسویه با موفقیت انجام شد و وجه به کیف پول فروشنده واریز گردید.");
      load();
    } catch (err: any) {
      toast.error("خطا در تسویه: " + err.message);
    } finally {
      setSettlingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">مدیریت سفارش‌ها و محموله‌ها</h1>
        <p className="text-sm text-muted-foreground mt-1">
          نظارت بر روند خرید مس، کنترل کارشناسی و اجرای تسویه حساب مالی
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs md:text-sm">
        {[
          { id: "all", label: "همه محموله‌ها" },
          { id: "weighed", label: "آماده تسویه مالی" },
          { id: "settled", label: "تسویه شده" },
          { id: "awaiting_expert", label: "در انتظار کارشناسی" },
          { id: "seller_approved", label: "در مسیر حمل و توزین" },
          { id: "rejected", label: "رد شده" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
          <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>در حال دریافت اطلاعات...</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          سفارشی در این وضعیت یافت نشد.
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <Card key={s.id} className="p-5 shadow-xs border-border/80">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base md:text-lg">{SCRAP_TYPE_LABELS[s.scrap_type] || s.scrap_type}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">
                      وزن: {formatNumber(s.final_weight || s.estimated_weight)} کیلوگرم
                    </span>
                    {s.final_weight && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                        توزین شده باسکول
                      </span>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      خلوص: {s.final_purity_percent || s.purity_percent}٪
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {s.seller_name || s.seller_email}
                    </span>
                    {s.seller_phone && (
                      <a href={`tel:${s.seller_phone}`} className="flex items-center gap-1 font-mono text-primary hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {s.seller_phone}
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {s.address}
                    </span>
                    <span>ثبت: {formatDate(s.created_at)}</span>
                  </div>

                  {s.expert_notes && (
                    <div className="text-xs text-primary bg-primary/10 p-2 rounded-lg">
                      <span className="font-bold">یادداشت کارشناس:</span> {s.expert_notes}
                    </div>
                  )}

                  {/* Photos */}
                  {s.photos && s.photos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">تصاویر:</span>
                      <div className="flex gap-1.5">
                        {s.photos.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewPhotos(s.photos)}
                            className="h-10 w-10 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity bg-secondary/30"
                          >
                            <img src={api.mediaUrl(p)} alt="ضایعات" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Settle Action & Price */}
                <div className="text-left flex flex-col justify-between items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                  <span className={"text-xs px-2.5 py-1 rounded-full font-bold " + (STATUS_TONE[s.status] || "bg-secondary")}>
                    {STATUS_LABELS[s.status] || s.status}
                  </span>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      {s.final_price ? "مبلغ قطعی تسویه:" : "مبلغ تخمینی:"}
                    </div>
                    <div className="text-xl md:text-2xl font-black text-primary">
                      {formatToman(s.final_price ?? s.estimated_price)}
                    </div>
                  </div>

                  {s.status === "weighed" && (
                    <Button
                      size="sm"
                      onClick={() => handleSettle(s)}
                      disabled={settlingId === s.id}
                      className="gap-1.5 bg-success hover:bg-success/90 text-white font-bold shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {settlingId === s.id ? "در حال تسویه..." : "تسویه و واریز آنی"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotos && (
        <Dialog open={!!previewPhotos} onOpenChange={() => setPreviewPhotos(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تصاویر محموله</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto p-1">
              {previewPhotos.map((url, i) => (
                <div key={i} className="aspect-video rounded-lg overflow-hidden border border-border bg-black/10">
                  <img src={api.mediaUrl(url)} alt={`عکس ${i + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
