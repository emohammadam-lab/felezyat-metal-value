import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { PageHeader, Spinner, StatusPill } from "@/components/app/kit";
import { ClipboardList as PageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type Shipment, type PricingConfig } from "@/lib/api";
import {
  formatToman,
  formatNumber,
  formatDate,
  SCRAP_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  calcEstimatedPrice,
} from "@/lib/format";
import { Scale, CheckCircle2, XCircle, Phone, MapPin, Eye, FileText, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/expert/queue")({
  component: () => <AppShell><ExpertQueue /></AppShell>,
});

function ExpertQueue() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [previewPhotos, setPreviewPhotos] = useState<string[] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [shipments, p] = await Promise.all([
        api.shipments.list({ status: statusFilter }),
        api.pricing.get(),
      ]);
      setItems(shipments);
      setPricing(p);
    } catch (err: any) {
      toast.error("خطا در دریافت صف کارشناسی: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader icon={PageIcon} eyebrow="کارشناسی" title="کارتابل کارشناسی و توزین متالورژی" description="بررسی درصد خلوص، تعیین کسورات پالایش، اعلام قیمت قطعی و ثبت وزن نهایی باسکول" />

      {/* Filter Tabs */}
      <div className="segmented">
        {[
          { id: "all", label: "تمام سفارش‌ها" },
          { id: "awaiting_expert", label: "نیازمند کارشناسی اولیه" },
          { id: "price_offered", label: "منتظر تایید فروشنده" },
          { id: "seller_approved", label: "تایید شده / آماده توزین" },
          { id: "weighed", label: "توزین شده (آماده تسویه)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
                : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="در حال دریافت لیست محموله‌ها..." />
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          محموله‌ای در این وضعیت وجود ندارد.
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <ExpertShipmentCard
              key={s.id}
              s={s}
              pricing={pricing}
              onDone={load}
              onPreviewPhotos={(photos) => setPreviewPhotos(photos)}
            />
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotos && (
        <Dialog open={!!previewPhotos} onOpenChange={() => setPreviewPhotos(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تصاویر ارسالی محموله توسط فروشنده</DialogTitle>
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

function ExpertShipmentCard({
  s,
  pricing,
  onDone,
  onPreviewPhotos,
}: {
  s: Shipment;
  pricing: PricingConfig | null;
  onDone: () => void;
  onPreviewPhotos: (photos: string[]) => void;
}) {
  const [valPurity, setValPurity] = useState(s.final_purity_percent || s.purity_percent || 70);
  const [valDeduction, setValDeduction] = useState(s.deduction_percent ?? pricing?.deduction_percent ?? 2.0);
  const [valNotes, setValNotes] = useState(s.expert_notes || "");
  const [weighValue, setWeighValue] = useState(String(s.final_weight || s.estimated_weight));
  const [weighNotes, setWeighNotes] = useState(s.expert_notes || "");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Valuation modal calculation
  const calculatedValuationPrice = pricing
    ? calcEstimatedPrice({
        weightKg: Number(s.final_weight || s.estimated_weight),
        purityPercent: valPurity,
        copperUsd: Number(pricing.copper_price_usd),
        usdRate: Number(pricing.usd_rate),
        feePercent: Number(pricing.fee_percent ?? 0),
        deductionPercent: valDeduction,
      })
    : 0;

  async function handleOfferValuation() {
    setSubmitting(true);
    try {
      await api.shipments.offer(s.id, {
        final_purity_percent: valPurity,
        deduction_percent: valDeduction,
        expert_notes: valNotes,
      });
      toast.success("قیمت نهایی کارشناسی به فروشنده اعلام شد.");
      onDone();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordWeigh() {
    const weight = Number(weighValue);
    if (!weight || weight <= 0) return toast.error("وزن باسکول نامعتبر است.");

    setSubmitting(true);
    try {
      await api.shipments.weigh(s.id, {
        final_weight: weight,
        expert_notes: weighNotes,
      });
      toast.success("وزن قطعی باسکول ثبت شد. سفارش به صف تسویه مالی ارسال گردید.");
      onDone();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return toast.error("علت رد سفارش الزامی است.");
    setSubmitting(true);
    try {
      await api.shipments.reject(s.id, rejectReason.trim());
      toast.info("سفارش رد شد.");
      onDone();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 transition-all hover:border-primary/30">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-base md:text-lg">{SCRAP_TYPE_LABELS[s.scrap_type] || s.scrap_type}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm">وزن تخمینی: {formatNumber(s.estimated_weight)} کیلو</span>
            {s.final_weight && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm font-extrabold text-primary">
                  وزن باسکول: {formatNumber(s.final_weight)} کیلو
                </span>
              </>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">خلوص اعلامی: {s.purity_percent}٪</span>
            {s.final_purity_percent && (
              <span className="text-xs font-bold text-accent">
                (خلوص کارشناسی: {s.final_purity_percent}٪ - کسورات: {s.deduction_percent}٪)
              </span>
            )}
          </div>

          {/* Seller Contact Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <User className="w-3.5 h-3.5 text-primary" />
              {s.seller_name || s.seller_email}
            </span>
            {s.seller_phone && (
              <a href={`tel:${s.seller_phone}`} className="flex items-center gap-1 text-primary hover:underline font-mono">
                <Phone className="w-3.5 h-3.5" />
                {s.seller_phone}
              </a>
            )}
            <span className="flex items-center gap-1 truncate max-w-sm">
              <MapPin className="w-3.5 h-3.5" />
              {s.address}
            </span>
          </div>

          {s.description && (
            <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg">
              <span className="font-semibold text-foreground">یادداشت فروشنده:</span> {s.description}
            </div>
          )}

          {s.expert_notes && (
            <div className="text-xs text-primary bg-primary/10 border border-primary/20 p-2 rounded-lg">
              <span className="font-bold">یادداشت شما:</span> {s.expert_notes}
            </div>
          )}

          {/* Photos */}
          {s.photos && s.photos.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">تصاویر ارسالی:</span>
              <div className="flex gap-1.5">
                {s.photos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onPreviewPhotos(s.photos)}
                    className="h-10 w-10 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity bg-secondary/30"
                  >
                    <img src={api.mediaUrl(p)} alt="ضایعات" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status and Price */}
        <div className="text-left flex flex-col justify-between items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
          <StatusPill status={s.status} />
          <div>
            <div className="text-xs text-muted-foreground">ارزش تخمینی اولیه: {formatToman(s.estimated_price)}</div>
            {s.final_price && (
              <div className="text-lg md:text-xl font-black text-primary">
                مبلغ نهایی: {formatToman(s.final_price)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Dialogs */}
      <div className="mt-4 pt-3 border-t border-border/80 flex flex-wrap gap-2">
        {s.status === "awaiting_expert" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <FileText className="w-4 h-4" />
                کارشناسی متالورژی و قیمت‌گذاری
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>کارشناسی متالورژی و تعیین درصد خلوص</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <div className="flex justify-between text-sm">
                    <Label>درصد خلوص کارشناسی مس</Label>
                    <span className="font-extrabold text-primary">{valPurity}٪</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={99}
                    value={valPurity}
                    onChange={(e) => setValPurity(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <Label>درصد کسورات ناخالصی و سرباره</Label>
                    <span className="font-extrabold text-warning">{valDeduction}٪</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={0.5}
                    value={valDeduction}
                    onChange={(e) => setValDeduction(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <Label>توضیحات و گزارش کارشناسی</Label>
                  <Textarea
                    value={valNotes}
                    onChange={(e) => setValNotes(e.target.value)}
                    className="mt-1"
                    rows={2}
                    placeholder="وضعیت سوختگی، اکسید، نوع روکش و..."
                  />
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="text-xs text-muted-foreground">قیمت قطعی محاسبه شده برای این محموله:</div>
                  <div className="text-2xl font-black text-primary mt-1">
                    {formatToman(calculatedValuationPrice)}
                  </div>
                </div>

                <Button onClick={handleOfferValuation} disabled={submitting} className="w-full">
                  {submitting ? "در حال ارسال..." : "اعلام قیمت به فروشنده"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {s.status === "seller_approved" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-white">
                <Scale className="w-4 h-4" />
                ثبت وزن قطعی باسکول
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ثبت توزین باسکول مرجع</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>وزن خالص باسکول (کیلوگرم)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={weighValue}
                    onChange={(e) => setWeighValue(e.target.value)}
                    dir="ltr"
                    className="mt-1.5 text-lg font-bold"
                  />
                </div>

                <div>
                  <Label>یادداشت باسکول / شماره قبض</Label>
                  <Input
                    value={weighNotes}
                    onChange={(e) => setWeighNotes(e.target.value)}
                    className="mt-1.5"
                    placeholder="شماره قبض باسکول، نام باسکول‌دار..."
                  />
                </div>

                <Button onClick={handleRecordWeigh} disabled={submitting} className="w-full">
                  {submitting ? "در حال ثبت..." : "تایید توزین و ارسال به حسابداری"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {["awaiting_expert", "price_offered", "seller_approved"].includes(s.status) && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">
                <XCircle className="w-4 h-4 ml-1" />
                رد سفارش
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>رد سفارش محموله</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>علت رد سفارش</Label>
                  <Textarea
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                    placeholder="مثال: عدم تطابق محموله با تصاویر، ناخالصی آهن غیرمجاز و..."
                  />
                </div>
                <Button onClick={handleReject} disabled={submitting} variant="destructive" className="w-full">
                  {submitting ? "در حال ثبت..." : "تایید رد سفارش"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Card>
  );
}
