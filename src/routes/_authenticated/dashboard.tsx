import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  TrendingUp,
  Package,
  Wallet,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  ClipboardList,
  ListOrdered,
  DollarSign,
  Cable,
  Flame,
  Layers,
  Box,
  Wrench,
} from "lucide-react";
import { BrandMark, Spinner, StatCard, StatusPill } from "@/components/app/kit";
import { api, type Shipment, type AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { formatToman, formatNumber, SCRAP_TYPE_LABELS, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { user, profile, activeRole, loading } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [recent, setRecent] = useState<Shipment[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    setFetching(true);

    if (activeRole === "seller") {
      Promise.all([
        api.wallet.get().catch(() => ({ balance: 0 })),
        api.shipments.list().catch(() => []),
      ]).then(([w, shipments]) => {
        setBalance(w.balance);
        setRecent(shipments.slice(0, 5));
        setFetching(false);
      });
    } else if (activeRole === "expert") {
      api.shipments.list()
        .then((items) => {
          const queue = items.filter((s) => ["awaiting_expert", "price_offered", "seller_approved", "weighed"].includes(s.status));
          setRecent(queue.slice(0, 8));
          setFetching(false);
        })
        .catch(() => setFetching(false));
    } else {
      // Admin
      Promise.all([
        api.admin.getStats().catch(() => null),
        api.shipments.list().catch(() => []),
      ]).then(([stats, shipments]) => {
        setAdminStats(stats);
        setRecent(shipments.slice(0, 8));
        setFetching(false);
      });
    }
  }, [user, activeRole]);

  if (loading || fetching) {
    return <Spinner label="در حال بارگذاری اطلاعات پنل..." />;
  }

  const roleTitle = activeRole === "admin" ? "مدیریت کل سیستم" : activeRole === "expert" ? "کارتابل کارشناسی متالورژی" : "میز کار فروشنده";
  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0];
  const today = new Date().toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" });
  const listTo = activeRole === "seller" ? "/seller/orders" : activeRole === "expert" ? "/expert/queue" : "/admin/orders";

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome hero */}
      <section className="animate-rise relative overflow-hidden rounded-3xl surface p-6 md:p-8">
        <div className="absolute inset-0 bg-grid opacity-70 pointer-events-none" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/25 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-accent/10 blur-[80px] pointer-events-none" />
        <BrandMark size={150} className="absolute -left-6 -bottom-10 opacity-[0.12] rotate-12 hidden sm:inline-flex" />

        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {today}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-snug">
              سلام {firstName}، <span className="copper-text">خوش آمدی</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
              {roleTitle}
              {profile?.verified && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-success/12 text-success ring-1 ring-success/30 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> احراز هویت تایید شده
                </span>
              )}
            </p>
          </div>

          {activeRole === "seller" && (
            <Link to="/seller/new">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <PlusCircle className="w-5 h-5" />
                ثبت محموله جدید
              </Button>
            </Link>
          )}
          {activeRole === "expert" && (
            <Link to="/expert/queue">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <ClipboardList className="w-5 h-5" />
                ورود به صف کارشناسی
              </Button>
            </Link>
          )}
          {activeRole === "admin" && (
            <div className="flex gap-2">
              <Link to="/admin/orders"><Button variant="outline" className="gap-2"><ListOrdered className="w-4 h-4" />سفارش‌ها</Button></Link>
              <Link to="/admin/pricing"><Button className="gap-2"><DollarSign className="w-4 h-4" />تنظیم قیمت</Button></Link>
            </div>
          )}
        </div>
      </section>

      {/* KYC Warning if unverified seller */}
      {activeRole === "seller" && profile && !profile.verified && (
        <div className="animate-rise flex items-start gap-3 rounded-2xl p-4 bg-gradient-to-l from-warning/15 to-warning/5 ring-1 ring-warning/30">
          <div className="h-9 w-9 rounded-xl bg-warning/20 text-warning flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs md:text-sm leading-6">
            <div className="font-bold text-warning">حساب شما هنوز احراز هویت نهایی نشده است</div>
            <div className="text-muted-foreground">برای تسویه حساب و برداشت وجه به حساب بانکی، لطفا کد ملی و شماره شبای خود را در بخش پروفایل وارد نمایید.</div>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {activeRole === "seller" && (
          <>
            <StatCard icon={Wallet} label="موجودی کیف پول" value={formatToman(balance)} tone="primary" className="col-span-2 lg:col-span-1" />
            <StatCard icon={Package} label="محموله‌های اخیر" value={formatNumber(recent.length)} tone="neutral" />
            <StatCard icon={Clock} label="در انتظار کارشناسی" value={formatNumber(recent.filter((s) => s.status === "awaiting_expert").length)} tone="warning" />
            <StatCard icon={CheckCircle2} label="تسویه شده" value={formatNumber(recent.filter((s) => s.status === "settled").length)} tone="success" />
          </>
        )}

        {activeRole === "expert" && (
          <>
            <StatCard icon={Clock} label="صف کارشناسی اولیه" value={formatNumber(recent.filter((s) => s.status === "awaiting_expert").length)} tone="warning" />
            <StatCard icon={TrendingUp} label="منتظر تایید فروشنده" value={formatNumber(recent.filter((s) => s.status === "price_offered").length)} tone="accent" />
            <StatCard icon={Package} label="آماده هماهنگی و توزین" value={formatNumber(recent.filter((s) => s.status === "seller_approved").length)} tone="primary" />
            <StatCard icon={CheckCircle2} label="توزین شده / آماده تسویه" value={formatNumber(recent.filter((s) => s.status === "weighed").length)} tone="success" />
          </>
        )}

        {activeRole === "admin" && adminStats && (
          <>
            <StatCard icon={Users} label="کل کاربران سیستم" value={formatNumber(adminStats.total_users)} tone="accent" />
            <StatCard icon={Package} label="کل محموله‌ها" value={formatNumber(adminStats.total_shipments)} tone="primary" />
            <StatCard icon={Clock} label="نیاز به اقدام / تسویه" value={formatNumber(adminStats.ready_settle_shipments)} tone="warning" />
            <StatCard icon={Wallet} label="حجم تسویه شده" value={formatToman(adminStats.total_volume_settled)} tone="success" />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-black text-base md:text-lg">
              {activeRole === "seller" ? "آخرین محموله‌های من" : activeRole === "expert" ? "محموله‌های نیازمند اقدام" : "سفارش‌های اخیر سامانه"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">آخرین وضعیت هر محموله در یک نگاه</p>
          </div>
          <Link to={listTo}>
            <Button variant="outline" size="sm" className="gap-1">
              مشاهده همه
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground text-sm flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-foreground/5 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            هنوز محموله‌ای در این بخش ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {recent.map((s) => {
              const Icon = SCRAP_ICONS[s.scrap_type] ?? Package;
              return (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 ring-1 ring-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{SCRAP_TYPE_LABELS[s.scrap_type] || s.scrap_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(s.final_weight || s.estimated_weight)} کیلوگرم
                        </span>
                        {s.seller_name && activeRole !== "seller" && (
                          <span className="text-xs text-primary font-semibold">· {s.seller_name}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 min-w-0">
                        <span className="shrink-0">{formatDate(s.created_at)}</span>
                        <span className="truncate">{s.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pr-14 sm:pr-0">
                    <div className="text-left">
                      <div className="text-[11px] text-muted-foreground">{s.final_price ? "مبلغ نهایی" : "مبلغ تخمینی"}</div>
                      <div className="text-sm font-black">{formatToman(s.final_price ?? s.estimated_price)}</div>
                    </div>
                    <StatusPill status={s.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

const SCRAP_ICONS: Record<string, any> = {
  coated_cable: Cable,
  burnt: Flame,
  shavings: Layers,
  body: Box,
  other: Wrench,
};
