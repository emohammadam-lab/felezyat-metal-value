import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/shell";
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
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">نقشه راه توسعه پلتفرم فلزیافت</h1>
        <p className="text-sm text-muted-foreground mt-1">
          روند پیشرفت امکانات توسعه‌یافته و اهداف فازهای بعدی پلتفرم
        </p>
      </div>

      <Card className="p-6 shadow-xs">
        <ul className="space-y-3.5">
          {ITEMS.map((it) => (
            <li key={it.title} className="flex items-start gap-3">
              {it.done ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${it.done ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                {it.title}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
