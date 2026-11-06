import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Coins, Headset, Home, Scale, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, type PricingConfig } from "@/lib/api";
import { calcEstimatedPrice, formatToman, formatNumber, SCRAP_TYPE_LABELS } from "@/lib/format";

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

function Landing() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [scrapType, setScrapType] = useState("coated_cable");
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState(PURITY_DEFAULT.coated_cable);

  useEffect(() => {
    api.pricing.get()
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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-warm)" }}>
      <header className="border-b border-border/60 backdrop-blur bg-background/80 sticky top-0 z-40 transition-colors">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-sm" style={{ background: "var(--gradient-copper)" }}>
              ف
            </div>
            <div className="font-extrabold text-lg">فلزیافت</div>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth"><Button variant="ghost" size="sm">ورود</Button></Link>
            <Link to="/auth"><Button size="sm">شروع فروش</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-6">
            <Zap className="w-3.5 h-3.5" />
            فاز پایلوت — تهران
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
            ضایعات مس خانه‌ات را <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-copper)" }}>همین امروز نقد کن</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-8">
            فلزیافت ضایعات مس خانه، مغازه و کارگاه شما را با قیمت زنده می‌خرد. قیمت را همین‌جا ببین، ما رایگان می‌آییم درب منزل، جلوی چشمت توزین می‌کنیم و پول را همان لحظه می‌گیری.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#calc">
              <Button size="lg" className="gap-2">
                قیمت فوری بگیر
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </a>
            <Link to="/auth"><Button size="lg" variant="outline">ثبت‌نام رایگان</Button></Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-success" /> بدون هزینه کارشناسی</span>
            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-success" /> حمل رایگان</span>
            <span className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-success" /> تسویه آنی</span>
          </div>
        </div>

        <Card className="p-6 border-primary/20" style={{ boxShadow: "var(--shadow-copper)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">نرخ زنده مرجع</div>
            <div className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">آنلاین</div>
          </div>
          <div className="text-sm text-muted-foreground">قیمت مس ۱۰۰٪ خلوص (تقریبی)</div>
          <div className="mt-2 text-4xl font-extrabold text-primary">
            {perKgAt100 ? formatToman(perKgAt100) : "..."}
            <span className="text-base font-normal text-muted-foreground"> / کیلوگرم</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="قیمت جهانی مس" value={pricing ? `$${pricing.copper_price_usd}` : "..."} />
            <Stat label="نرخ دلار" value={pricing ? formatNumber(Number(pricing.usd_rate)) + " ﷼" : "..."} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground leading-6">
            قیمت نهایی پس از کارشناسی، اعمال درصد خلوص، کسورات پالایش و کارمزد محاسبه می‌شود.
          </p>
        </Card>
      </section>

      {/* Instant price calculator */}
      <section id="calc" className="mx-auto max-w-6xl px-4 pb-16">
        <Card className="p-6 md:p-8 border-primary/20" style={{ boxShadow: "var(--shadow-copper)" }}>
          <h2 className="text-2xl font-extrabold mb-1">قیمت فوری، بدون ثبت‌نام</h2>
          <p className="text-sm text-muted-foreground mb-6">نوع ضایعات و وزن تقریبی را بگو تا حدود قیمت را همین‌جا ببینی.</p>
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>نوع ضایعات</Label>
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
              <Label>وزن تقریبی (کیلوگرم)</Label>
              <Input type="number" min={1} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1.5" dir="ltr" placeholder="مثلا ۱۰" />
            </div>
            <div>
              <Label>درصد خلوص تخمینی: {purity}٪</Label>
              <input type="range" min={30} max={99} value={purity} onChange={(e) => setPurity(Number(e.target.value))} className="w-full mt-3" />
            </div>
            <div className="rounded-xl bg-secondary/60 p-4 text-center">
              <div className="text-xs text-muted-foreground">تخمین فلزیافت</div>
              <div className="text-2xl font-extrabold text-primary mt-1">{weight ? formatToman(estimate) : "—"}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/auth">
              <Button className="gap-2">
                ثبت سفارش فروش
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">قیمت دقیق بعد از کارشناسی رایگان اعلام می‌شود؛ هیچ تعهدی برای فروش نداری.</p>
          </div>
        </Card>
      </section>

      {/* 3 simple steps */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">سه قدم تا پول نقد</h2>
        <ol className="grid md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border/60 bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-primary font-bold text-sm mb-1">قدم {formatNumber(i + 1)}</div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-6">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16 grid md:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-6 border-border/60">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-6">{f.desc}</p>
          </Card>
        ))}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">سؤال‌های پرتکرار</h2>
        <div className="space-y-3">
          {FAQ.map((q) => (
            <Card key={q.q} className="p-5">
              <h3 className="font-bold mb-1.5">{q.q}</h3>
              <p className="text-sm text-muted-foreground leading-6">{q.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © فلزیافت — خرید نقدی ضایعات مس · felezyaft.ir
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-bold mt-1">{value}</div>
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
  { icon: Coins, title: "تسویه لحظه‌ای", desc: "هیچ چک و تماشایی در کار نیست؛ پول همان لحظه به حسابت می‌نشیند." },
  { icon: BadgeCheck, title: "کارشناسی رایگان", desc: "بررسی و قیمت‌گذاری نهایی رایگان است و اگر راضی نبودی، هیچ هزینه‌ای نمی‌دهی." },
  { icon: Headset, title: "پشتیبانی واقعی", desc: "از ثبت سفارش تا واریز پول، یک انسان واقعی پاسخگوی توست." },
];

const FAQ = [
  { q: "حداقل مقدار برای فروش چقدر است؟", a: "در فاز پایلوت از چند کیلوگرم به بالا را می‌پذیریم؛ قیمت فوری را بگیر و سفارش را ثبت کن تا هماهنگ کنیم." },
  { q: "حمل و بارگیری هزینه دارد؟", a: "نه. اعزام وسیله نقلیه و بارگیری در فاز پایلوت کاملا رایگان است." },
  { q: "قیمت نهایی چطور تعیین می‌شود؟", a: "بر پایه نرخ زنده مس، درصد خلوص محموله و وزن دقیق باسکول؛ همه اعداد شفاف به تو نشان داده می‌شود." },
  { q: "پول را کی و کجا می‌گیرم؟", a: "بلافاصله پس از توزین، مبلغ به کیف پول فلزیافت می‌آید و می‌توانی همان لحظه به حساب بانکی‌ات برداشت کنی." },
];
