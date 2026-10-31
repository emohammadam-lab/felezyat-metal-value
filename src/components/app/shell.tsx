import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, LayoutDashboard, PlusCircle, ListOrdered, Wallet, ClipboardList, Users, Settings, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const NAV: Record<AppRole, { to: string; label: string; icon: any }[]> = {
  seller: [
    { to: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
    { to: "/seller/new", label: "ثبت محموله جدید", icon: PlusCircle },
    { to: "/seller/orders", label: "سفارش‌های من", icon: ListOrdered },
    { to: "/seller/wallet", label: "کیف پول", icon: Wallet },
  ],
  expert: [
    { to: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
    { to: "/expert/queue", label: "صف کارشناسی", icon: ClipboardList },
  ],
  admin: [
    { to: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
    { to: "/admin/orders", label: "سفارش‌ها", icon: ListOrdered },
    { to: "/admin/users", label: "کاربران و نقش‌ها", icon: Users },
    { to: "/admin/pricing", label: "قیمت‌گذاری", icon: DollarSign },
    { to: "/admin/wallet", label: "تسویه و گزارش", icon: Wallet },
    { to: "/admin/roadmap", label: "نقشه راه", icon: Settings },
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, primaryRole, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = NAV[primaryRole];
  const roleLabel = primaryRole === "admin" ? "مدیر" : primaryRole === "expert" ? "کارشناس" : "فروشنده";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-warm)" }}>
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-5 border-b border-sidebar-border flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground font-bold" style={{ background: "var(--gradient-copper)" }}>م</div>
          <div>
            <div className="font-bold leading-tight">میسه فلزیافت</div>
            <div className="text-xs opacity-70">پنل {roleLabel}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent"
                )}
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="text-xs opacity-70 mb-2 px-1 truncate">{user?.email}</div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            خروج
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
