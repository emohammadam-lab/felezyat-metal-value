import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, TrendingUp, Package, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const { user, primaryRole, loading } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (primaryRole === "seller") {
        const [w, s] = await Promise.all([
          supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
          supabase.from("shipments").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }).limit(5),
        ]);
        setStats({ balance: w.data?.balance ?? 0, count: s.data?.length ?? 0 });
        setRecent(s.data ?? []);
      } else if (primaryRole === "expert") {
        const { data } = await supabase.from("shipments").select("*").in("status", ["awaiting_expert", "price_offered"]).order("created_at", { ascending: false }).limit(8);
        setRecent(data ?? []);
        setStats({ queue: data?.length ?? 0 });
      } else {
        const [all, pending, settled] = await Promise.all([
          supabase.from("shipments").select("id", { count: "exact", head: true }),
          supabase.from("shipments").select("id", { count: "exact", head: true }).in("status", ["registered", "awaiting_expert"]),
          supabase.from("shipments").select("final_price_toman").eq("status", "settled"),
        ]);
        const total = (settled.data ?? []).reduce((a: number, r: any) => a + Number(r.final_price_toman ?? 0), 0);
        setStats({ total: all.count ?? 0, pending: pending.count ?? 0, volume: total });
        const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false }).limit(6);
        setRecent(data ?? []);
      }
    })();
  }, [user, primaryRole]);

  if (loading) return <div>در حال بارگذاری...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">
            {primaryRole === "seller" && "داشبورد فروشنده"}
            {primaryRole === "expert" && "داشبورد کارشناس"}
            {primaryRole === "admin" && "داشبورد مدیر"}
          </h1>
          <p className="text-muted-foreground mt-1">خوش آمدید {user?.email}</p>
        </div>
        {primaryRole === "seller" && (
          <Link to="/seller/new"><Button className="gap-2"><PlusCircle className="w-4 h-4" />محموله جدید</Button></Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {primaryRole === "seller" && (
          <>
            <StatCard icon={Wallet} label="موجودی کیف پول" value={formatToman(stats.balance ?? 0)} />
            <StatCard icon={Package} label="تعداد محموله‌ها" value={formatNumber(stats.count ?? 0)} />
            <StatCard icon={TrendingUp} label="وضعیت" value="فعال" />
          </>
        )}
        {primaryRole === "expert" && (
          <StatCard icon={Package} label="محموله‌های در انتظار" value={formatNumber(stats.queue ?? 0)} />
        )}
        {primaryRole === "admin" && (
          <>
            <StatCard icon={Package} label="کل محموله‌ها" value={formatNumber(stats.total ?? 0)} />
            <StatCard icon={TrendingUp} label="در حال بررسی" value={formatNumber(stats.pending ?? 0)} />
            <StatCard icon={Wallet} label="حجم تسویه" value={formatToman(stats.volume ?? 0)} />
          </>
        )}
      </div>

      <Card className="p-6">
        <h2 className="font-bold mb-4">آخرین محموله‌ها</h2>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">هنوز محموله‌ای ثبت نشده است.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-secondary/40">
                <div>
                  <div className="font-medium">{SCRAP_TYPE_LABELS[s.scrap_type] || s.scrap_type} — {formatNumber(Number(s.weight_kg))} کیلو</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(s.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-primary">
                    {s.final_price_toman ? formatToman(s.final_price_toman) : formatToman(s.estimated_price_toman ?? 0)}
                  </div>
                  <span className={"text-xs px-2 py-1 rounded-full " + (STATUS_TONE[s.status] || "bg-secondary")}>{STATUS_LABELS[s.status] || s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold mt-0.5">{value}</div>
        </div>
      </div>
    </Card>
  );
}
