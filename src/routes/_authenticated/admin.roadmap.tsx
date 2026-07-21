import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/roadmap")({
  component: () => <AppShell><Roadmap /></AppShell>,
});

const ITEMS = [
  { done: true, title: "نسخه اولیه پنل فروشنده / کارشناس / مدیر" },
  { done: true, title: "موتور قیمت‌گذاری زنده و کیف پول دیجیتال" },
  { done: false, title: "احراز هویت پیامکی و KYC" },
  { done: false, title: "درگاه پرداخت و برداشت به حساب" },
  { done: false, title: "خلوص‌سنجی تصویری با هوش مصنوعی" },
  { done: false, title: "پنل مزایده آنلاین محموله‌ها" },
  { done: false, title: "توسعه به مس مصرفی و سایر فلزات (آلومینیوم، آهن)" },
  { done: false, title: "شبکه ذوب امین و صدور شمش تایید شده" },
];

function Roadmap() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold mb-6">نقشه راه محصول</h1>
      <Card className="p-6">
        <ul className="space-y-3">
          {ITEMS.map((it) => (
            <li key={it.title} className="flex items-start gap-3">
              {it.done ? <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
              <span className={it.done ? "text-foreground" : "text-muted-foreground"}>{it.title}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
