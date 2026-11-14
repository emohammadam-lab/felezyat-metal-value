import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Coins,
  Flame,
  Headset,
  Home,
  Layers,
  Cable,
  Scale,
  Sparkles,
  Truck,
  Wrench,
  Zap,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark, Wordmark } from "@/components/app/kit";
import { api, type PricingConfig } from "@/lib/api";
import { calcEstimatedPrice, formatToman, formatNumber, SCRAP_TYPE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Landing,
});

const PURITY_DEFAULT: Record<string, number> = {
  coated_cable: 55,
  burnt: 88,
  shavings: 92,
  body: 96,
  other: 70,
};

const SCRAP_ICONS: Record<string, any> = {
  coated_cable: Cable,
  burnt: Flame,
  shavings: Layers,
  body: Box,
  other: Wrench,
};

function Landing() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [scrapType, setScrapType] = useState("coated_cable");
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState(PURITY_DEFAULT.coated_cable);

  useEffect(() => {
    api.pricing
      .get()
      .then((data) => setPricing(data))
      .catch((err) => {
        console.warn("Could not fetch pricing from backend, using defaults", err);
        setPricing({
          id: 1,
          copper_price_usd: 9.5,
          usd_rate: 900000,
          fee_percent: 3.0,
          deduction_percent: 2.0,
          updated_at: new Date().toISOString(),
        });
      });
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

  // usd_rate is in Rials -> divide by 10 to get Tomans per kg
  const perKgAt100 = pricing ? Math.round(Number(pricing.copper_price_usd) * (Number(pricing.usd_rate) / 10)) : null;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* ───────────── Header ───────────── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/">
            <Wordmark />
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <a href="#calc" className="px-3 py-2 rounded-lg hover:text-foreground hover:bg-foreground/5 transition-colors">قیمت فوری</a>
            <a href="#how" className="px-3 py-2 rounded-lg hover:text-foreground hover:bg-foreground/5 transition-colors">چطور کار می‌کند</a>
            <a href="#why" className="px-3 py-2 rounded-lg hover:text-foreground hover:bg-foreground/5 transition-colors">چرا فلزیافت</a>
            <a href="#faq" className="px-3 py-2 rounded-lg hover:text-foreground hover:bg-foreground/5 transition-colors">سؤالات</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link to="/auth" className="hidden sm:block">
              <Button variant="ghost" size="sm">ورود</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="px-4">شروع فروش</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────── Hero ───────────── */}
      <section className="relative">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 pt-14 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 pl-3 pr-1.5 py-1 text-xs font-bold text-primary mb-7">
              <span className="rounded-full copper-fill px-2 py-0.5 text-[10px]">جدید</span>
              فاز پایلوت در تهران فعال شد
            </div>
            <h1 className="text-[2.35rem] sm:text-5xl lg:text-6xl font-black leading-[1.28] md:leading-[1.22]">
              ضایعات مس‌ات را
              <br />
              <span className="copper-text bg-[length:200%_auto] animate-shine">همین امروز نقد کن</span>
            </h1>
            <p className="lead mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              قیمت را همین‌جا ببین؛ ما رایگان می‌آییم درب منزل، کارگاه یا انبار، جلوی چشمت توزین می‌کنیم و پولت همان لحظه به حسابت می‌نشیند.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#calc">
                <Button size="lg" className="gap-2">
                  قیمت فوری بگیر
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </a>
              <Link to="/auth">
                <Button size="lg" variant="outline">ثبت‌نام رایگان</Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 max-w-md gap-2">
              <TrustBadge icon={BadgeCheck} label="کارشناسی رایگان" />
              <TrustBadge icon={Truck} label="حمل رایگان" />
              <TrustBadge icon={Coins} label="تسویه آنی" />
            </div>
          </div>

          {/* Live price card */}
          <div className="relative animate-rise [animation-delay:150ms]">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/10 to-transparent blur-xl pointer-events-none" />

            <div className="surface glow-ring relative rounded-3xl p-6 md:p-7 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(30rem_16rem_at_0%_0%,oklch(0.73_0.145_52/0.16),transparent)] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrandMark size={28} className="rounded-lg shadow-sm ring-1 ring-border" />
                    <span className="text-sm font-bold text-muted-foreground">نرخ زنده مرجع</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse-ring" />
                    آنلاین و لحظه‌ای
                  </div>
                </div>
                <div className="mt-6 text-xs text-muted-foreground">قیمت هر کیلو مس ۱۰۰٪ خلوص (تقریبی)</div>
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-4xl md:text-5xl font-black tracking-tight copper-text">
                    {perKgAt100 ? formatNumber(perKgAt100) : "…"}
                  </span>
                  <span className="text-sm text-muted-foreground font-semibold">تومان / کیلوگرم</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniStat label="قیمت جهانی مس" value={pricing ? `$${pricing.copper_price_usd}` : "…"} sub="هر کیلوگرم" />
                  <MiniStat label="نرخ دلار" value={pricing ? formatNumber(Number(pricing.usd_rate) / 10) : "…"} sub="تومان" />
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-border p-4 space-y-2.5 text-xs">
                  <Row label="کسورات پالایش" value={pricing ? `${formatNumber(Number(pricing.deduction_percent ?? 0), 1)}٪` : "…"} />
                  <Row label="کارمزد فلزیافت" value={pricing ? `${formatNumber(Number(pricing.fee_percent ?? 0), 1)}٪` : "…"} />
                  <Row label="هزینه حمل و کارشناسی" value={<span className="text-success font-bold">رایگان</span>} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Instant calculator ───────────── */}
      <section id="calc" className="mx-auto w-full max-w-6xl px-4 py-20 md:py-24 scroll-mt-16">
        <SectionTitle eyebrow="ماشین‌حساب" title="قیمت فوری، بدون ثبت‌نام" desc="نوع ضایعات و وزن تقریبی را بگو تا حدود قیمت را همین‌جا ببینی." />

        <div className="mt-12 surface rounded-3xl overflow-hidden grid lg:grid-cols-[1.4fr_1fr]">
          <div className="p-6 md:p-8 space-y-8">
            <div>
              <div className="text-sm font-bold mb-3">۱. نوع ضایعات</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(SCRAP_TYPE_LABELS).map(([k, v]) => {
                  const Icon = SCRAP_ICONS[k] ?? Wrench;
                  const active = scrapType === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setScrapType(k)}
                      className={cn(
                        "group flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition-all",
                        active
                          ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_10px_30px_-16px_var(--color-primary)]"
                          : "border-border hover:border-foreground/25 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          active ? "copper-fill" : "bg-foreground/5 group-hover:bg-foreground/10",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold mb-3 block" htmlFor="calc-weight">۲. وزن تقریبی</label>
                <div className="relative">
                  <Input
                    id="calc-weight"
                    type="number"
                    min={1}
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    dir="ltr"
                    placeholder="10"
                    className="h-14 text-xl font-bold pl-20"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">کیلوگرم</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[5, 20, 50, 100].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeight(String(w))}
                      className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    >
                      {formatNumber(w)} کیلو
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold">۳. خلوص تخمینی</span>
                  <span className="text-lg font-black copper-text">{formatNumber(purity)}٪</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={99}
                  value={purity}
                  onChange={(e) => setPurity(Number(e.target.value))}
                  className="w-full mt-4"
                  style={{
                    background: `linear-gradient(to left, var(--color-primary) ${((purity - 30) / 69) * 100}%, var(--color-secondary) 0)`,
                  }}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-3">
                  <span>۳۰٪</span>
                  <span>۹۹٪</span>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="relative p-6 md:p-8 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-t lg:border-t-0 lg:border-r border-border flex flex-col">
            <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
            <div className="relative flex-1">
              <div className="eyebrow">
                <Sparkles className="w-3.5 h-3.5" />
                تخمین فلزیافت
              </div>
              <div className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-tight break-words">
                {weight ? (
                  <>
                    {formatNumber(estimate)}
                    <span className="text-base font-bold text-muted-foreground mr-2">تومان</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>
              <div className="mt-6 space-y-2.5 text-sm">
                <Row label="نوع بار" value={SCRAP_TYPE_LABELS[scrapType]} />
                <Row label="وزن" value={weight ? `${formatNumber(Number(weight), 1)} کیلوگرم` : "—"} />
                <Row label="خلوص" value={`${formatNumber(purity)}٪`} />
              </div>
            </div>
            <div className="relative mt-8">
              <Link to="/auth">
                <Button size="lg" className="w-full gap-2">
                  ثبت سفارش فروش
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-[11px] text-muted-foreground mt-3 leading-5 text-center">
                قیمت دقیق بعد از کارشناسی رایگان اعلام می‌شود؛ هیچ تعهدی برای فروش نداری.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 3 steps ───────────── */}
      <section id="how" className="mx-auto w-full max-w-6xl px-4 pb-20 md:pb-24 scroll-mt-16">
        <SectionTitle eyebrow="فرآیند" title="سه قدم تا پول نقد" />
        <ol className="mt-12 relative grid md:grid-cols-3 gap-5">
          <div className="hidden md:block absolute top-9 right-[16%] left-[16%] h-px bg-gradient-to-l from-primary/0 via-primary/50 to-primary/0" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative text-center flex flex-col items-center">
              <div className="relative h-[72px] w-[72px] rounded-3xl copper-fill glow-ring flex items-center justify-center">
                <s.icon className="w-7 h-7" />
                <span className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-background border border-border text-xs font-black flex items-center justify-center text-foreground">
                  {formatNumber(i + 1)}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-black">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-7 max-w-xs">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── Features bento ───────────── */}
      <section id="why" className="mx-auto w-full max-w-6xl px-4 pb-20 md:pb-24 scroll-mt-16">
        <SectionTitle eyebrow="چرا فلزیافت" title="شفاف، سریع و بی‌دردسر" />
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Hero tile — spans two rows */}
          {(() => {
            const f = FEATURES[0];
            return (
              <div className="group relative overflow-hidden rounded-3xl p-7 md:row-span-2 flex flex-col justify-between min-h-[22rem] border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-card glow-ring transition-transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
                <div className="absolute -left-12 -top-10 h-44 w-44 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
                <div className="relative h-14 w-14 rounded-2xl copper-fill flex items-center justify-center shadow-lg">
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="relative">
                  <div className="eyebrow mb-2">بدون حداقل خرید سنگین</div>
                  <h3 className="font-black text-2xl mb-3">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-7">{f.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["خانه", "مغازه", "کارگاه", "پیمانکار"].map((t) => (
                      <span key={t} className="text-xs font-bold rounded-full bg-background/60 ring-1 ring-border px-3 py-1">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Four regular tiles */}
          {FEATURES.slice(1, 5).map((f) => (
            <div
              key={f.title}
              className="surface group relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-primary/0 blur-3xl transition-all group-hover:bg-primary/25" />
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-primary/12 ring-1 ring-primary/25 text-primary flex items-center justify-center mb-5 transition-all group-hover:copper-fill">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-7">{f.desc}</p>
              </div>
            </div>
          ))}

          {/* Full-width support banner */}
          {(() => {
            const f = FEATURES[5];
            return (
              <div className="surface group relative overflow-hidden rounded-3xl p-6 md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row sm:items-center gap-5 transition-all hover:border-primary/40">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
                <div className="relative h-14 w-14 shrink-0 rounded-2xl patina-fill flex items-center justify-center">
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="relative flex-1">
                  <h3 className="font-black text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-7">{f.desc}</p>
                </div>
                <Link to="/auth" className="relative">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    شروع گفتگو با ما
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="mx-auto w-full max-w-3xl px-4 pb-20 md:pb-24 scroll-mt-16">
        <SectionTitle eyebrow="پرسش و پاسخ" title="سؤال‌های پرتکرار" />
        <div className="mt-10 space-y-3">
          {FAQ.map((q, i) => (
            <details key={q.q} className="surface group rounded-2xl px-5 open:border-primary/40" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bold [&::-webkit-details-marker]:hidden">
                {q.q}
                <span className="h-8 w-8 shrink-0 rounded-full bg-foreground/5 flex items-center justify-center transition-transform group-open:rotate-180 group-open:bg-primary/15 group-open:text-primary">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </summary>
              <p className="pb-5 -mt-1 text-sm text-muted-foreground leading-7">{q.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────────── CTA band ───────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] copper-fill px-6 py-12 md:px-14 md:py-16 shadow-2xl">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-snug text-white drop-shadow-sm">ضایعاتت را دور نریز، پول است!</h2>
              <p className="mt-3 text-sm md:text-base font-medium text-white/90 max-w-lg leading-relaxed">
                ثبت‌نام کمتر از یک دقیقه طول می‌کشد. کارشناس ما هماهنگ می‌کند و بقیه کارها با ماست.
              </p>
            </div>
            <Link to="/auth">
              <Button size="lg" className="bg-[oklch(0.18_0.02_255)] bg-none text-white hover:bg-[oklch(0.24_0.02_255)] shadow-xl gap-2 font-bold px-6">
                همین الان شروع کن
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Wordmark sub="خرید نقدی ضایعات مس" />
          <span>© فلزیافت · felezyaft.ir</span>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="eyebrow justify-center mb-2">
        <span className="h-px w-6 bg-primary/60" />
        {eyebrow}
        <span className="h-px w-6 bg-primary/60" />
      </div>
      <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black leading-snug">{title}</h2>
      {desc && <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">{desc}</p>}
    </div>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card/40 backdrop-blur px-2 py-3 text-center">
      <Icon className="w-5 h-5 text-success" />
      <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] ring-1 ring-border p-3.5">
      <div className="text-[11px] text-muted-foreground font-semibold">{label}</div>
      <div className="font-black text-lg mt-1" dir="auto">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

const STEPS = [
  { icon: Zap, title: "قیمت فوری بگیر", desc: "نوع و وزن ضایعات را وارد کن و حدود قیمت را همان لحظه ببین؛ بدون ثبت‌نام و بدون تماس." },
  { icon: Truck, title: "ما می‌آییم سراغت", desc: "کارشناس فلزیافت رایگان به آدرس تو می‌آید؛ بار را بررسی و جلوی چشمت در باسکول توزین می‌کند." },
  { icon: Coins, title: "پولت را آنی بگیر", desc: "بلافاصله بعد از توزین، مبلغ به کیف پول یا حساب بانکی‌ات واریز می‌شود. تمام!" },
];

const FEATURES = [
  { icon: Home, title: "برای همه، نه فقط پیمانکاران", desc: "چند کیلو سیم قدیمی خانه یا ضایعات کارگاه؛ فرقی ندارد، ما از همه خریداریم." },
  { icon: Scale, title: "توزین شفاف", desc: "توزین در باسکول مرجع و جلوی چشم خودت انجام می‌شود؛ عدد ترازو را خودت می‌بینی." },
  { icon: Truck, title: "حمل رایگان", desc: "نیازی نیست بار را جابه‌جا کنی؛ وسیله نقلیه ما برای بارگیری به آدرس تو می‌آید." },
  { icon: Coins, title: "تسویه لحظه‌ای", desc: "هیچ چک و معطلی‌ای در کار نیست؛ پول همان لحظه به حسابت می‌نشیند." },
  { icon: BadgeCheck, title: "کارشناسی رایگان", desc: "بررسی و قیمت‌گذاری نهایی رایگان است و اگر راضی نبودی، هیچ هزینه‌ای نمی‌دهی." },
  { icon: Headset, title: "پشتیبانی واقعی", desc: "از ثبت سفارش تا واریز پول، یک انسان واقعی پاسخگوی توست." },
];

const FAQ = [
  { q: "حداقل مقدار برای فروش چقدر است؟", a: "در فاز پایلوت از چند کیلوگرم به بالا را می‌پذیریم؛ قیمت فوری را بگیر و سفارش را ثبت کن تا هماهنگ کنیم." },
  { q: "حمل و بارگیری هزینه دارد؟", a: "نه. اعزام وسیله نقلیه و بارگیری در فاز پایلوت کاملا رایگان است." },
  { q: "قیمت نهایی چطور تعیین می‌شود؟", a: "بر پایه نرخ زنده مس، درصد خلوص محموله و وزن دقیق باسکول؛ همه اعداد شفاف به تو نشان داده می‌شود." },
  { q: "پول را کی و کجا می‌گیرم؟", a: "بلافاصله پس از توزین، مبلغ به کیف پول فلزیافت می‌آید و می‌توانی همان لحظه به حساب بانکی‌ات برداشت کنی." },
];
