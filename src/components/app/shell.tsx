import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Wallet,
  ClipboardList,
  Users,
  Map as MapIcon,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Menu,
  X,
  User as UserIcon,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark, Wordmark } from "@/components/app/kit";
import { useAuth, type AppRole } from "@/lib/use-auth";
import { api, type UserProfile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  to: string;
  label: string;
  icon: any;
}

const NAV: Record<AppRole, NavItem[]> = {
  seller: [
    { to: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
    { to: "/seller/new", label: "ثبت محموله جدید", icon: PlusCircle },
    { to: "/seller/orders", label: "سفارش‌های من", icon: ListOrdered },
    { to: "/seller/wallet", label: "کیف پول و تسویه", icon: Wallet },
  ],
  expert: [
    { to: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
    { to: "/expert/queue", label: "صف کارشناسی و توزین", icon: ClipboardList },
  ],
  admin: [
    { to: "/dashboard", label: "داشبورد جامع", icon: LayoutDashboard },
    { to: "/admin/orders", label: "مدیریت سفارش‌ها", icon: ListOrdered },
    { to: "/admin/users", label: "مدیریت کاربران و نقش‌ها", icon: Users },
    { to: "/admin/pricing", label: "تنظیم قیمت مس و دلار", icon: DollarSign },
    { to: "/admin/wallet", label: "تسویه و درخواست‌های برداشت", icon: Wallet },
    { to: "/admin/roadmap", label: "نقشه راه محصول", icon: MapIcon },
  ],
};

const ROLE_LABEL: Record<AppRole, string> = { admin: "مدیر کل", expert: "کارشناس", seller: "فروشنده" };

function isActive(pathname: string, to: string) {
  return pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, roles, activeRole, setActiveRole, loading, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  const items = NAV[activeRole] || NAV.seller;
  const roleLabel = ROLE_LABEL[activeRole] ?? "فروشنده";
  const current = items.find((it) => isActive(pathname, it.to));
  const initial = profile?.full_name ? profile.full_name[0] : user?.email?.[0]?.toUpperCase() || "U";

  const roleSwitcher = (onPick?: () => void) =>
    roles.length > 1 && (
      <div className="rounded-2xl bg-sidebar-accent/60 p-1 flex gap-1">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => {
              setActiveRole(r);
              onPick?.();
            }}
            className={cn(
              "flex-1 text-xs py-1.5 px-1.5 rounded-xl transition-all text-center font-bold",
              activeRole === r
                ? "copper-fill shadow-[0_6px_16px_-8px_var(--color-primary)]"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5",
            )}
          >
            {r === "admin" ? "مدیر" : r === "expert" ? "کارشناس" : "فروشنده"}
          </button>
        ))}
      </div>
    );

  const navList = (onPick?: () => void) => (
    <nav className="space-y-1">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">منوی اصلی</div>
      {items.map((it) => {
        const active = isActive(pathname, it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onPick}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              active
                ? "bg-gradient-to-l from-primary/20 to-primary/5 text-sidebar-foreground ring-1 ring-primary/30"
                : "text-sidebar-foreground/65 hover:bg-white/[0.05] hover:text-sidebar-foreground",
            )}
          >
            {active && <span className="absolute -right-3 top-2 bottom-2 w-1 rounded-l-full bg-primary" />}
            <span
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                active ? "copper-fill" : "bg-white/[0.04] group-hover:bg-white/[0.08]",
              )}
            >
              <it.icon className="w-4 h-4" />
            </span>
            <span className="truncate">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-foreground">
      {/* ---------------- Desktop Sidebar ---------------- */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen overflow-hidden border-l border-sidebar-border">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 blur-[90px] pointer-events-none" />

        <div className="relative px-5 pt-6 pb-5">
          <Link to="/">
            <Wordmark sub={<span className="text-sidebar-foreground/55">پنل {roleLabel}</span>} />
          </Link>
        </div>

        {roles.length > 1 && <div className="relative px-4 pb-4">{roleSwitcher()}</div>}

        <div className="relative flex-1 overflow-y-auto px-3 py-2">{navList()}</div>

        {activeRole === "seller" && profile && !profile.verified && (
          <button
            onClick={() => setProfileModalOpen(true)}
            className="relative mx-4 mb-3 rounded-2xl p-4 text-right bg-gradient-to-br from-warning/20 to-warning/5 ring-1 ring-warning/30 hover:ring-warning/60 transition-all"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-warning">
              <ShieldAlert className="w-4 h-4" />
              تکمیل احراز هویت
            </div>
            <p className="mt-1 text-[11px] leading-5 text-sidebar-foreground/70">برای برداشت وجه، کد ملی و شبا را ثبت کن.</p>
          </button>
        )}

        {/* User Profile Card & Sign Out */}
        <div className="relative p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex-1 min-w-0 flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.05] text-right transition-colors"
            >
              <div className="relative h-10 w-10 rounded-xl copper-fill flex items-center justify-center font-black text-sm shrink-0">
                {initial}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-sidebar",
                    profile?.verified ? "bg-success" : "bg-warning",
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{profile?.full_name || "پروفایل من"}</div>
                <div className="text-[11px] truncate text-sidebar-foreground/55" dir="ltr">{user?.email}</div>
              </div>
            </button>
            <button
              onClick={signOut}
              title="خروج از حساب"
              aria-label="خروج از حساب"
              className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- Mobile Header Bar ---------------- */}
      <header className="md:hidden border-b border-border/60 bg-background/75 backdrop-blur-xl sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark size={34} />
          <span className="font-black text-base">فلزیافت</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/12 ring-1 ring-primary/25 text-primary font-bold">{roleLabel}</span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setProfileModalOpen(true)} aria-label="پروفایل">
            <UserIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="منو">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* ---------------- Mobile Slide Drawer ---------------- */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-xs bg-sidebar text-sidebar-foreground h-full flex flex-col p-4 shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4">
              <Wordmark sub={<span className="text-sidebar-foreground/55">پنل {roleLabel}</span>} />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-sidebar-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {roles.length > 1 && <div className="pb-4">{roleSwitcher(() => setMobileMenuOpen(false))}</div>}

            <div className="flex-1 overflow-y-auto py-2 px-1">{navList(() => setMobileMenuOpen(false))}</div>

            <div className="pt-3 border-t border-sidebar-border space-y-1">
              <button
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-white/5"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileModalOpen(true);
                }}
              >
                <UserIcon className="w-4 h-4" />
                ویرایش پروفایل و کد شبا
              </button>
              <button
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                خروج از حساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Main Content ---------------- */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop top bar */}
        <div className="hidden md:flex sticky top-0 z-20 h-16 items-center justify-between px-8 border-b border-border/50 bg-background/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">پنل {roleLabel}</span>
            <ChevronLeft className="w-4 h-4 text-muted-foreground/60" />
            <span className="font-bold">{current?.label ?? "داشبورد"}</span>
          </div>
          <div className="flex items-center gap-2">
            {profile?.verified ? (
              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 ring-1 ring-success/25 px-2.5 py-1 rounded-full">
                <UserCheck className="w-3.5 h-3.5" /> احراز هویت شده
              </span>
            ) : (
              <button
                onClick={() => setProfileModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-warning bg-warning/10 ring-1 ring-warning/25 px-2.5 py-1 rounded-full hover:bg-warning/20"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> نیاز به تکمیل هویت
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={() => setProfileModalOpen(true)}
              className="h-9 w-9 rounded-xl copper-fill flex items-center justify-center font-black text-sm"
              aria-label="پروفایل"
            >
              {initial}
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>

      {/* ---------------- Mobile Bottom Navigation Bar ---------------- */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-20 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-2xl flex items-center justify-around p-1.5">
        {items.slice(0, 4).map((it) => {
          const active = isActive(pathname, it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 text-[10px] font-bold py-1.5 rounded-xl transition-all",
                active ? "copper-fill" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <it.icon className="w-5 h-5" />
              <span>{it.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* ---------------- Profile & KYC Modal ---------------- */}
      <ProfileDialog
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        profile={profile}
        onSaved={refreshUser}
      />
    </div>
  );
}

function ProfileDialog({
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"info" | "password">("info");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [iban, setIban] = useState("");
  const [card, setCard] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setNationalId(profile.national_id || "");
      setIban(profile.iban_sheba || "");
      setCard(profile.bank_card || "");
      setAddress(profile.default_address || "");
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.profile.update({
        full_name: fullName,
        phone,
        national_id: nationalId,
        iban_sheba: iban,
        bank_card: card,
        default_address: address,
      });
      toast.success("اطلاعات پروفایل با موفقیت ذخیره شد.");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("خطا در ذخیره پروفایل: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.auth.changePassword(oldPassword, newPassword);
      toast.success("کلمه عبور با موفقیت تغییر یافت.");
      setOldPassword("");
      setNewPassword("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("خطا در تغییر کلمه عبور: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 pl-8 text-right">
            <span>پروفایل و احراز هویت کاربر</span>
            {profile?.verified ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-medium">
                تایید هویت شده ✓
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                در انتظار احراز هویت
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex rounded-xl border border-border bg-background/50 p-1 mb-2">
          <button
            type="button"
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg text-center transition-all", tab === "info" ? "copper-fill" : "text-muted-foreground hover:text-foreground")}
            onClick={() => setTab("info")}
          >
            مشخصات فردی و بانکی
          </button>
          <button
            type="button"
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg text-center transition-all", tab === "password" ? "copper-fill" : "text-muted-foreground hover:text-foreground")}
            onClick={() => setTab("password")}
          >
            تغییر رمز عبور
          </button>
        </div>

        {tab === "info" ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <Label>نام و نام خانوادگی</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" placeholder="مثال: علی رضایی" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>شماره تماس</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" dir="ltr" placeholder="0912xxxxxxx" />
              </div>
              <div>
                <Label>کد ملی (برای تسویه حساب)</Label>
                <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} className="mt-1" dir="ltr" placeholder="00xxxxxxxx" maxLength={10} />
              </div>
            </div>

            <div>
              <Label>شماره شبا (IBAN برای واریز وجه)</Label>
              <Input
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="mt-1"
                dir="ltr"
                placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-[11px] text-muted-foreground mt-1">واریز وجوه تسویه به این شماره شبا انجام می‌شود.</p>
            </div>

            <div>
              <Label>شماره کارت بانکی (اختیاری)</Label>
              <Input value={card} onChange={(e) => setCard(e.target.value)} className="mt-1" dir="ltr" placeholder="6037xxxxxxxxxxxx" maxLength={16} />
            </div>

            <div>
              <Label>آدرس پیش‌فرض تحویل بار</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" placeholder="استان، شهر، خیابان، پلاک..." />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره مشخصات"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label>کلمه عبور فعلی</Label>
              <Input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label>کلمه عبور جدید (حداقل ۶ کاراکتر)</Label>
              <Input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" dir="ltr" />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={saving}>
              {saving ? "در حال تغییر..." : "ثبت کلمه عبور جدید"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
