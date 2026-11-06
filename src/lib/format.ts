export function formatToman(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

export function formatNumber(n: number | null | undefined, digits = 0): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: digits }).format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const SCRAP_TYPE_LABELS: Record<string, string> = {
  coated_cable: "کابل روکش‌دار",
  burnt: "بار سوخته",
  shavings: "مس براده",
  body: "مس بدنه",
  other: "سایر",
};

export const STATUS_LABELS: Record<string, string> = {
  registered: "ثبت شد",
  awaiting_expert: "در انتظار کارشناسی",
  price_offered: "قیمت نهایی اعلام شد",
  seller_approved: "تایید فروشنده / حمل",
  weighed: "توزین شد",
  settled: "تسویه شد",
  rejected: "رد شد",
};

export const STATUS_TONE: Record<string, string> = {
  registered: "bg-secondary text-secondary-foreground ring-1 ring-border",
  awaiting_expert: "bg-warning/12 text-warning ring-1 ring-warning/30",
  price_offered: "bg-accent/12 text-accent ring-1 ring-accent/30",
  seller_approved: "bg-primary/12 text-primary ring-1 ring-primary/30",
  weighed: "bg-primary/20 text-primary ring-1 ring-primary/40",
  settled: "bg-success/12 text-success ring-1 ring-success/30",
  rejected: "bg-destructive/12 text-destructive ring-1 ring-destructive/30",
};

export function calcEstimatedPrice(params: {
  weightKg: number;
  purityPercent: number;
  copperUsd: number;
  usdRate: number;
  feePercent: number;
  deductionPercent: number;
}): number {
  // usd_rate in pricing_config is stored in Rials; convert to Tomans (/ 10)
  const usdRateToman = params.usdRate / 10;
  const gross = params.weightKg * params.copperUsd * usdRateToman * (params.purityPercent / 100);
  const afterDeduction = gross * (1 - params.deductionPercent / 100);
  const afterFee = afterDeduction * (1 - params.feePercent / 100);
  return Math.max(0, Math.round(afterFee));
}