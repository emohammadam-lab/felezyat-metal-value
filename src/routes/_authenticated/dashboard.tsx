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
} from "lucide-react";
import { api, type Shipment, type AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { formatToman, formatNumber, STATUS_LABELS, STATUS_TONE, SCRAP_TYPE_LABELS, formatDate } from "@/lib/format";

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
    return (
      <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>در حال بارگذاری اطلاعات پنل...</span>
      </div>
    );
  }

  const roleTitle = activeRole === "admin" ? "مدیریت کل سیستم" : activeRole === "expert" ? "کارتابل کارشناسی متالورژی" : "میز کار فروشنده";

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header & KYC Warning */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{roleTitle}</h1>
            {profile?.verified && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> احراز هویت تایید شده
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            خوش آمدید، {profile?.full_name || user?.email}
          </p>
        </div>

        {activeRole === "seller" && (
          <Link to="/seller/new">
            <Button className="gap-2 shadow-sm w-full sm:w-auto">
              <PlusCircle className="w-4 h-4" />
              ثبت محموله جدید
            </Button>
          </Link>
        )}
      </div>

      {/* KYC Warning if unverified seller */}
      {activeRole === "seller" && profile && !profile.verified && (
        <Card className="p-4 bg-warning/10 border-warning/30 flex items-start gap-3 text-warning-foreground">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm">
            <span className="font-bold">حساب شما هنوز احراز هویت نهایی نشده است:</span> برای تسویه حساب و برداشت وجه به حساب بانکی، لطفا کد ملی و شماره شبای خود را در بخش پروفایل وارد نمایید.
          </div>
        </Card>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {activeRole === "seller" && (
          <>
            <StatCard icon={Wallet} label="موجودی کیف پول" value={formatToman(balance)} color="primary" />
            <StatCard icon={Package} label="کل محموله‌های ثبت شده" value={formatNumber(recent.length)} />
            <StatCard icon={Clock} label="در انتظار کارشناسی" value={formatNumber(recent.filter((s) => s.status === "awaiting_expert").length)} />
            <StatCard icon={CheckCircle2} label="تسویه شده" value={formatNumber(recent.filter((s) => s.status === "settled").length)} color="success" />
          </>
        )}

        {activeRole === "expert" && (
          <>
            <StatCard icon={Clock} label="صف کارشناسی اولیه" value={formatNumber(recent.filter((s) => s.status === "awaiting_expert").length)} color="warning" />
            <StatCard icon={TrendingUp} label="منتظر تایید فروشنده" value={formatNumber(recent.filter((s) => s.status === "price_offered").length)} />
            <StatCard icon={Package} label="آماده هماهنگی و توزین" value={formatNumber(recent.filter((s) => s.status === "seller_approved").length)} color="primary" />
            <StatCard icon={CheckCircle2} label="توزین شده / آماده تسویه" value={formatNumber(recent.filter((s) => s.status === "weighed").length)} color="success" />
          </>
        )}

        {activeRole === "admin" && adminStats && (
          <>
            <StatCard icon={Users} label="کل کاربران سیستم" value={formatNumber(adminStats.total_users)} />
            <StatCard icon={Package} label="کل محموله‌ها" value={formatNumber(adminStats.total_shipments)} />
            <StatCard icon={Clock} label="نیاز به اقدام مدیر / تسویه" value={formatNumber(adminStats.ready_settle_shipments)} color="warning" />
            <StatCard icon={Wallet} label="حجم تسویه شده" value={formatToman(adminStats.total_volume_settled)} color="success" />
          </>
        )}
      </div>

      {/* Recent Activity Card */}
      <Card className="p-4 md:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base md:text-lg">
            {activeRole === "seller" ? "آخرین محموله‌های من" : activeRole === "expert" ? "محموله‌های نیازمند اقدام" : "سفارش‌های اخیر سامانه"}
          </h2>
          <Link
            to={activeRole === "seller" ? "/seller/orders" : activeRole === "expert" ? "/expert/queue" : "/admin/orders"}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            مشاهده همه
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            هنوز محموله‌ای در این بخش ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recent.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/70 hover:bg-secondary/40 gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{SCRAP_TYPE_LABELS[s.scrap_type] || s.scrap_type}</span>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-xs text-foreground/80">
                      وزن: {formatNumber(s.final_weight || s.estimated_weight)} کیلوگرم
                    </span>
                    {s.seller_name && activeRole !== "seller" && (
                      <>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-xs text-primary font-medium">{s.seller_name}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span>{formatDate(s.created_at)}</span>
                    <span className="truncate max-w-xs">{s.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">
                      {s.final_price ? "مبلغ نهایی" : "مبلغ تخمینی"}
                    </div>
                    <div className="text-sm font-extrabold text-primary">
                      {s.final_price ? formatToman(s.final_price) : formatToman(s.estimated_price)}
                    </div>
                  </div>
                  <span className={"text-xs px-2.5 py-1 rounded-full font-medium " + (STATUS_TONE[s.status] || "bg-secondary")}>
                    {STATUS_LABELS[s.status] || s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: "primary" | "success" | "warning" }) {
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div
          className={
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 " +
            (color === "success"
              ? "bg-success/15 text-success"
              : color === "warning"
              ? "bg-warning/15 text-warning"
              : "bg-primary/10 text-primary")
          }
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-lg md:text-xl font-extrabold tracking-tight truncate">{value}</div>
    </Card>
  );
}
