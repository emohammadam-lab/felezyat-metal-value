import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/shell";
import { PageHeader } from "@/components/app/kit";
import { PlusCircle as PageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type PricingConfig } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { calcEstimatedPrice, formatToman, SCRAP_TYPE_LABELS } from "@/lib/format";
import { Upload, X, ShieldCheck, Image as ImageIcon } from "lucide-react";

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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [scrapType, setScrapType] = useState("coated_cable");
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState(55);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.pricing.get()
      .then(setPricing)
      .catch((err) => console.warn("Failed to fetch pricing config", err));
  }, []);

  useEffect(() => {
    if (profile?.default_address && !address) {
      setAddress(profile.default_address);
    }
  }, [profile, address]);

  useEffect(() => {
    setPurity(PURITY_DEFAULT[scrapType] ?? 70);
  }, [scrapType]);

  const handleFilesSelected = (selected: FileList | null) => {
    if (!selected) return;
    const newFiles = Array.from(selected);
    setFiles((prev) => [...prev, ...newFiles]);

    // Generate local previews
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

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
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const res = await api.shipments.uploadPhoto(f);
        uploadedUrls.push(res.url);
      }

      await api.shipments.create({
        scrap_type: scrapType,
        estimated_weight: Number(weight),
        purity_percent: purity,
        address,
        description: notes,
        photos: uploadedUrls,
      });

      toast.success("محموله با موفقیت ثبت شد و در صف کارشناسی قرار گرفت.");
      navigate({ to: "/seller/orders" });
    } catch (err: any) {
      toast.error("خطا در ثبت محموله: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader icon={PageIcon} eyebrow="محموله جدید" title="ثبت محموله جدید ضایعات مس" description="مشخصات بار را وارد کنید؛ کارشناس فلزیافت برای بازبینی و قیمت‌گذاری اولیه محموله را بررسی خواهد کرد." />

      <form onSubmit={submit} className="grid md:grid-cols-3 gap-6 items-start">
        <Card className="p-5 md:p-6 md:col-span-2 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>نوع ضایعات مس</Label>
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
              <Label>وزن تقریبی محموله (کیلوگرم)</Label>
              <Input
                type="number"
                min={1}
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1.5"
                dir="ltr"
                placeholder="مثلا: ۲۵"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm">
              <Label>درصد خلوص تقریبی</Label>
              <span className="font-extrabold text-primary">{purity}٪</span>
            </div>
            <input
              type="range"
              min={30}
              max={99}
              value={purity}
              onChange={(e) => setPurity(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>ناخالصی بالا (۳۰٪)</span>
              <span>روکش استاندارد ({PURITY_DEFAULT[scrapType]}٪)</span>
              <span>خالص درجه یک (۹۹٪)</span>
            </div>
          </div>

          <div>
            <Label>آدرس دقیق بارگیری و تحویل</Label>
            <Input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1.5"
              placeholder="شهر، خیابان، کوچه، پلاک، کارگاه یا انبار..."
            />
          </div>

          <div>
            <Label>توضیحات تکمیلی (اختیاری)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5"
              rows={3}
              placeholder="نکاتی درباره نوع بسته‌بندی، زمان مناسب اعزام کارشناس یا شرایط باسکول..."
            />
          </div>

          <div>
            <Label>تصاویر ضایعات (کمک به قیمت‌گذاری دقیق‌تر)</Label>
            <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors bg-secondary/20">
              <Upload className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium">انتخاب تصاویر از گالری / دوربین</span>
              <span className="text-xs text-muted-foreground mt-0.5">فرمت‌های JPG، PNG یا WEBP</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </label>

            {filePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-card">
                    <img src={src} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-destructive text-white rounded-full p-1 transition-colors"
                      title="حذف تصویر"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Pricing Estimate Sticky Sidebar Card */}
        <div className="space-y-4 md:sticky md:top-6">
          <Card className="p-6 border-primary/30" style={{ boxShadow: "var(--shadow-copper)" }}>
            <div className="text-xs text-muted-foreground font-medium">تخمین ارزش لحظه‌ای بار شما</div>
            <div className="text-3xl font-black text-primary mt-2">
              {weight ? formatToman(estimate) : "—"}
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-border/70 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>وزن اعلامی:</span>
                <span className="font-bold text-foreground">{weight || "۰"} کیلوگرم</span>
              </div>
              <div className="flex justify-between">
                <span>خلوص تقریبی:</span>
                <span className="font-bold text-foreground">{purity}٪</span>
              </div>
              <div className="flex justify-between">
                <span>هزینه کارشناسی و حمل:</span>
                <span className="font-bold text-success">کاملاً رایگان</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 py-5 text-base font-bold shadow-sm"
              disabled={submitting || !weight || !address}
            >
              {submitting ? "در حال ثبت محموله..." : "ثبت و ارسال به کارشناس"}
            </Button>
          </Card>

          <Card className="p-4 bg-secondary/30 text-xs space-y-2 leading-5 text-muted-foreground">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              ضمانت معامله فلزیافت
            </div>
            <p>توزین نهایی در باسکول استاندارد و تسویه حساب فوری پس از تایید نهایی شما انجام خواهد شد.</p>
          </Card>
        </div>
      </form>
    </div>
  );
}
