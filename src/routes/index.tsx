import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Coins, Gauge, ShieldCheck, Truck, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatToman, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [pricing, setPricing] = useState<{ copper_price_usd: number; usd_rate: number } | null>(null);

  useEffect(() => {
    supabase
      .from("pricing_config")
      .select("copper_price_usd, usd_rate")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => data && setPricing(data as any));
  }, []);

  const perKgAt100 = pricing ? Math.round(Number(pricing.copper_price_usd) * Number(pricing.usd_rate)) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-warm)" }}>
      <header className="border-b border-border/60 backdrop-blur bg-background/70 sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground font-bold" style={{ background: "var(--gradient-copper)" }}>م</div>
            <div className="font-bold text-lg">فلزیافت</div>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">ورود</Button></Link>
            <Link to="/auth"><Button>ثبت‌نام فروشنده</Button></Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-6">
            <Zap className="w-3.5 h-3.5" />
            فاز پایلوت — تهران
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
            خرید نقدی ضایعات مس <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-copper)" }}>با قیمت زنده و تسویه لحظه‌ای</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-8">
            مسیار پلتفرم امن و شفاف خرید ضایعات مس از پیمانکاران مخابرات است. قیمت لحظه‌ای، کارشناسی حرفه‌ای، حمل و توزین در باسکول مرجع و واریز آنی به کیف پول شما.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                شروع فروش
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how"><Button size="lg" variant="outline">جریان کار</Button></a>
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
            قیمت نهایی پس از کارشناسی، اعمال درصد خلوص، کسورات پالایش و کارمزد پلتفرم محاسبه می‌شود.
          </p>
        </Card>
      </section>

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

      <section id="how" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">شش گام تا تسویه</h2>
        <ol className="grid md:grid-cols-6 gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-primary font-bold mb-2">{formatNumber(i + 1)}</div>
              <div className="text-sm text-foreground leading-6">{s}</div>
            </li>
          ))}
        </ol>
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

const FEATURES = [
  { icon: Gauge, title: "قیمت‌گذاری زنده", desc: "فرمول شفاف بر پایه نرخ جهانی مس، دلار روز و درصد خلوص محموله." },
  { icon: ShieldCheck, title: "کارشناسی حرفه‌ای", desc: "بررسی دیجیتال تصاویر و بازدید حضوری کارشناس پیش از قفل قیمت." },
  { icon: Truck, title: "حمل و توزین امن", desc: "اعزام وسیله نقلیه، توزین در باسکول مرجع و ثبت زنجیره حفاظت بار." },
  { icon: Coins, title: "تسویه آنی", desc: "پس از توزین، مبلغ به‌صورت لحظه‌ای به کیف پول دیجیتال شما واریز می‌شود." },
  { icon: Users, title: "سه پنل تخصصی", desc: "پنل‌های اختصاصی فروشنده، کارشناس و مدیر با دسترسی‌های امن." },
  { icon: Zap, title: "نقشه راه هوشمند", desc: "توسعه آینده: مزایده آنلاین، خلوص‌سنجی با هوش مصنوعی، شبکه ذوب امین." },
];

const STEPS = [
  "ثبت‌نام و احراز هویت",
  "ثبت مشخصات محموله و عکس",
  "دریافت قیمت تخمینی زنده",
  "کارشناسی و اعلام قیمت نهایی",
  "حمل و توزین در باسکول مرجع",
  "تسویه آنی به کیف پول",
];
