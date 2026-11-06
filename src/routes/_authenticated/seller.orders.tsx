import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { PageHeader, Spinner, StatusPill } from "@/components/app/kit";
import { ListOrdered as PageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type Shipment } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import {
  formatToman,
  formatNumber,
  formatDate,
  SCRAP_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
} from "@/lib/format";
import {
  Package,
  PlusCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Scale,
  Ban,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/seller/orders")({
  component: () => <AppShell><Orders /></AppShell>,
});

function Orders() {
  const { user } = useAuth();
  const [items, setItems] = useState<Shipment[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
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
    if (user) load();
  }, [user, filter]);

  async function approveOffer(id: string) {
    try {
      await api.shipments.sellerApprove(id);
      toast.success("قیمت پیشنهادی تایید شد. تیم لجستیک فلزیافت به زودی برای هماهنگی با شما تماس می‌گیرد.");
      load();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    }
  }

  async function rejectOffer(id: string) {
    try {
      await api.shipments.sellerReject(id);
      toast.info("پیشنهاد قیمت رد شد.");
      load();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    }
  }

  async function cancelOrder(id: string) {
    if (!confirm("آیا از لغو این محموله اطمینان دارید؟")) return;
    try {
      await api.shipments.cancel(id);
      toast.info("سفارش لغو شد.");
      load();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader icon={PageIcon} eyebrow="سفارش‌ها" title="سفارش‌ها و محموله‌های من" description="پیگیری وضعیت کارشناسی، تایید قیمت، بارگیری و تسویه مالی" />
        <Link to="/seller/new">
          <Button className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" />
            محموله جدید
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="segmented">
        {[
          { id: "all", label: "همه محموله‌ها" },
          { id: "awaiting_expert", label: "در انتظار کارشناسی" },
          { id: "price_offered", label: "نیاز به تایید شما" },
          { id: "seller_approved", label: "در مسیر حمل و باسکول" },
          { id: "weighed", label: "توزین شده" },
          { id: "settled", label: "تسویه شده" },
          { id: "rejected", label: "لغو یا رد شده" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
              filter === tab.id
                ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
                : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="در حال دریافت سفارش‌ها..." />
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground space-y-4">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <div>
            <div className="text-base font-bold text-foreground">هیچ سفارشی در این وضعیت یافت نشد.</div>
            <div className="text-xs text-muted-foreground mt-1">شما می‌توانید اولین محموله ضایعات خود را ثبت کنید.</div>
          </div>
          <Link to="/seller/new">
            <Button size="sm" className="mt-2">ثبت محموله</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <Card key={s.id} className="p-5 md:p-6 transition-all hover:border-primary/30">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base md:text-lg">{SCRAP_TYPE_LABELS[s.scrap_type] || s.scrap_type}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm font-medium">
                      وزن تخمینی: {formatNumber(s.estimated_weight)} کیلو
                    </span>
                    {s.final_weight && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm font-bold text-primary">
                          وزن باسکول: {formatNumber(s.final_weight)} کیلو
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      خلوص اعلامی: {formatNumber(s.purity_percent)}٪
                    </span>
                    {s.final_purity_percent && (
                      <span className="text-xs font-semibold text-accent">
                        (کارشناسی: {formatNumber(s.final_purity_percent)}٪)
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>ثبت: {formatDate(s.created_at)}</span>
                    <span className="truncate max-w-md">{s.address}</span>
                  </div>

                  {s.description && (
                    <div className="text-xs bg-secondary/40 p-2.5 rounded-lg text-muted-foreground">
                      <span className="font-semibold text-foreground">توضیحات شما:</span> {s.description}
                    </div>
                  )}

                  {s.expert_notes && (
                    <div className="text-xs bg-primary/10 border border-primary/20 p-2.5 rounded-lg text-primary">
                      <span className="font-bold">یادداشت کارشناس متالورژی:</span> {s.expert_notes}
                    </div>
                  )}

                  {s.reject_reason && (
                    <div className="text-xs bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg text-destructive">
                      <span className="font-bold">علت لغو / رد:</span> {s.reject_reason}
                    </div>
                  )}

                  {/* Uploaded Photos Thumbnails */}
                  {s.photos && s.photos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground font-medium">تصاویر بار:</span>
                      <div className="flex gap-1.5">
                        {s.photos.slice(0, 4).map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewPhotos(s.photos)}
                            className="h-10 w-10 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity bg-secondary/30"
                          >
                            <img src={api.mediaUrl(p)} alt="ضایعات" className="h-full w-full object-cover" />
                          </button>
                        ))}
                        {s.photos.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotos(s.photos)}
                            className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground"
                          >
                            +{s.photos.length - 4}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price and Status Box */}
                <div className="text-left flex flex-col justify-between items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                  <StatusPill status={s.status} />

                  <div>
                    <div className="text-xs text-muted-foreground">
                      {s.final_price ? "مبلغ نهایی معامله:" : "ارزش تخمینی اولیه:"}
                    </div>
                    <div className="text-xl md:text-2xl font-extrabold text-primary">
                      {formatToman(s.final_price ?? s.estimated_price)}
                    </div>
                  </div>

                  {/* Actions based on status */}
                  {s.status === "price_offered" && (
                    <div className="mt-2 flex gap-2 w-full sm:w-auto">
                      <Button size="sm" onClick={() => approveOffer(s.id)} className="gap-1.5 bg-success hover:bg-success/90 text-white">
                        <CheckCircle2 className="w-4 h-4" />
                        تایید قیمت و اعزام حمل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectOffer(s.id)} className="text-destructive hover:bg-destructive/10">
                        <XCircle className="w-4 h-4" />
                        انصراف
                      </Button>
                    </div>
                  )}

                  {["registered", "awaiting_expert"].includes(s.status) && (
                    <Button size="sm" variant="ghost" onClick={() => cancelOrder(s.id)} className="text-xs text-muted-foreground hover:text-destructive">
                      <Ban className="w-3.5 h-3.5 ml-1" />
                      لغو سفارش
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
              <DialogTitle>تصاویر ثبت شده برای این محموله</DialogTitle>
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
