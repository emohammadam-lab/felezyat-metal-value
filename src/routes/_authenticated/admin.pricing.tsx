import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, type PricingConfig } from "@/lib/api";
import { formatToman, formatNumber, calcEstimatedPrice } from "@/lib/format";
import { DollarSign, RefreshCw, Calculator, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: () => <AppShell><PricingAdmin /></AppShell>,
});

function PricingAdmin() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [copperUsd, setCopperUsd] = useState<string>("9.50");
  const [usdRate, setUsdRate] = useState<string>("900000");
  const [feePercent, setFeePercent] = useState<string>("3.00");
  const [deductionPercent, setDeductionPercent] = useState<string>("2.00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.pricing.get();
      setConfig(data);
      setCopperUsd(String(data.copper_price_usd));
      setUsdRate(String(data.usd_rate));
      setFeePercent(String(data.fee_percent));
      setDeductionPercent(String(data.deduction_percent));
    } catch (err: any) {
      toast.error("خطا در دریافت قیمت‌گذاری: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.pricing.update({
        copper_price_usd: Number(copperUsd),
        usd_rate: Number(usdRate),
        fee_percent: Number(feePercent),
        deduction_percent: Number(deductionPercent),
      });
      toast.success("تنظیمات موتور قیمت‌گذاری با موفقیت در سیستم اعمال شد.");
      load();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Live Calculations Preview
  // usd_rate is in Rials -> divide by 10 to get Tomans per USD
  const usdRateToman = Number(usdRate) / 10;
  const rawCopperPerKgToman = Math.round(Number(copperUsd) * usdRateToman);

  const sampleCable = calcEstimatedPrice({
    weightKg: 10,
    purityPercent: 55,
    copperUsd: Number(copperUsd),
    usdRate: Number(usdRate),
    feePercent: Number(feePercent),
    deductionPercent: Number(deductionPercent),
  });

  const sampleBurnt = calcEstimatedPrice({
    weightKg: 10,
    purityPercent: 88,
    copperUsd: Number(copperUsd),
    usdRate: Number(usdRate),
    feePercent: Number(feePercent),
    deductionPercent: Number(deductionPercent),
  });

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
        <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>در حال بارگذاری تنظیمات...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">تنظیم موتور قیمت‌گذاری زنده</h1>
        <p className="text-sm text-muted-foreground mt-1">
          تنظیم قیمت جهانی مس، نرخ تسعیر دلار به ریال، کارمزد پلتفرم و کسورات ناخالصی
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Form Card */}
        <Card className="p-6 space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>قیمت جهانی مس (LME / دلار به ازای هر کیلوگرم)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={copperUsd}
                onChange={(e) => setCopperUsd(e.target.value)}
                className="mt-1.5 font-bold"
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground mt-1">مثال: 9.50 دلار در بورس فلزات لندن</p>
            </div>

            <div>
              <Label>نرخ برابری دلار به ریال (IRR)</Label>
              <Input
                type="number"
                step="1000"
                required
                value={usdRate}
                onChange={(e) => setUsdRate(e.target.value)}
                className="mt-1.5 font-bold"
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                معادل {formatNumber(usdRateToman)} تومان به ازای هر دلار
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>کارمزد پلتفرم (٪)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  className="mt-1.5"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>کسورات ناخالصی پیش‌فرض (٪)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={deductionPercent}
                  onChange={(e) => setDeductionPercent(e.target.value)}
                  className="mt-1.5"
                  dir="ltr"
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 py-5 text-base font-bold" disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره و اعمال در کل سامانه"}
            </Button>
          </form>
        </Card>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <Card className="p-6 border-primary/30" style={{ boxShadow: "var(--shadow-copper)" }}>
            <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
              <Calculator className="w-4 h-4" /> پیش‌نمایش آنی فرمول قیمت‌گذاری
            </div>

            <div className="text-xs text-muted-foreground">قیمت مرجع هر کیلوگرم مس ۱۰۰٪ خالص:</div>
            <div className="text-3xl font-black text-primary mt-1">
              {formatToman(rawCopperPerKgToman)}
            </div>

            <div className="mt-4 pt-4 border-t border-border/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">نمونه ۱۰ کیلو کابل روکش‌دار (خلوص ۵۵٪):</span>
                <span className="font-extrabold text-foreground">{formatToman(sampleCable)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">نمونه ۱۰ کیلو بار سوخته مس (خلوص ۸۸٪):</span>
                <span className="font-extrabold text-foreground">{formatToman(sampleBurnt)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 text-xs text-muted-foreground space-y-2 leading-5">
            <div className="font-bold text-foreground">درباره نحوه محاسبه:</div>
            <p>
              ارزش نهایی برابر است با: وزن × قیمت جهانی دلار × نرخ دلار به تومان × (درصد خلوص / ۱۰۰) منهای کسورات پالایش و کارمزد فلزیافت.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
