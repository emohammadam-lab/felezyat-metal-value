import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/shell";
import { PageHeader } from "@/components/app/kit";
import { Map as PageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/roadmap")({
  component: () => <AppShell><Roadmap /></AppShell>,
});

const ITEMS = [
  { done: true, title: "مهاجرت کامل به بک‌اند پایتون (FastAPI + SQLAlchemy + JWT Auth)" },
  { done: true, title: "طراحی کاملاً واکنش‌گرا (Responsive) سازگار با موبایل و تبلت" },
  { done: true, title: "سامانه احراز هویت، پروفایل کاربری، کد ملی و مدیریت شماره شبا" },
  { done: true, title: "پنل اختصاصی فروشنده با پیگیری بصری مراحل سفارش و کیف پول" },
  { done: true, title: "پنل جامع مدیریت با کنترل کاربران، KYC، تعیین نقش و تسویه آنی" },
  { done: true, title: "پنل کارشناسی متالورژی با تعیین خلوص، کسورات و ثبت باسکول" },
  { done: true, title: "موتور قیمت‌گذاری زنده مس و ارز با پیش‌نمایش بلادرنگ محاسبات" },
  { done: true, title: "سیستم گردش حساب، تسویه مالی و ثبت شماره پیگیری بانکی (پایا/ساتنا)" },
  { done: false, title: "احراز هویت پیامکی دو مرحله‌ای (SMS OTP)" },
  { done: false, title: "خلوص‌سنجی هوشمند تصویری با هوش مصنوعی (AI Scrap Vision)" },
  { done: false, title: "تالار حراج و مزایده آنلاین محموله‌ها برای کارخانجات ذوب" },
  { done: false, title: "پشتیبانی از سایر فلزات بازیافتی (آلومینیوم، برنج، سرب و برنز)" },
];

function Roadmap() {
  const done = ITEMS.filter((i) => i.done).length;
  const pct = Math.round((done / ITEMS.length) * 100);
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader icon={PageIcon} eyebrow="نقشه راه" title="نقشه راه توسعه پلتفرم فلزیافت" description="روند پیشرفت امکانات توسعه‌یافته و اهداف فازهای بعدی پلتفرم" />

      <Card className="p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground font-semibold">پیشرفت کلی</div>
            <div className="text-3xl font-black mt-1 copper-text">{pct.toLocaleString("fa-IR")}٪</div>
          </div>
          <div className="text-xs text-muted-foreground">
            {done.toLocaleString("fa-IR")} از {ITEMS.length.toLocaleString("fa-IR")} مورد تکمیل شده
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full copper-fill" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <Card className="p-6">
        <ol className="relative">
          {ITEMS.map((it, i) => (
            <li key={it.title} className="relative flex items-start gap-4 pb-5 last:pb-0">
              {i < ITEMS.length - 1 && (
                <span className={`absolute right-[13px] top-8 bottom-0 w-px ${it.done ? "bg-primary/40" : "bg-border"}`} />
              )}
              <span
                className={`relative z-10 h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${
                  it.done ? "copper-fill" : "bg-background ring-1 ring-border text-muted-foreground"
                }`}
              >
                {it.done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
              </span>
              <div className="pt-0.5">
                <span className={`text-sm leading-6 ${it.done ? "text-foreground font-bold" : "text-muted-foreground"}`}>{it.title}</span>
                {!it.done && (
                  <span className="mr-2 text-[10px] font-bold rounded-full bg-accent/12 text-accent ring-1 ring-accent/25 px-2 py-0.5">به‌زودی</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
