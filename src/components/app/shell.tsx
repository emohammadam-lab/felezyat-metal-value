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
  Settings,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
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
    { to: "/admin/roadmap", label: "نقشه راه محصول", icon: Settings },
  ],
};

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
  const roleLabel = activeRole === "admin" ? "مدیر کل" : activeRole === "expert" ? "کارشناس" : "فروشنده";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors" style={{ background: "var(--gradient-warm)" }}>
      {/* ---------------- Desktop Sidebar ---------------- */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Brand */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-sm" style={{ background: "var(--gradient-copper)" }}>
              ف
            </div>
            <div>
              <div className="font-extrabold text-base leading-tight">فلزیافت</div>
              <div className="text-xs text-sidebar-foreground/70">پنل {roleLabel}</div>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        {/* Multi-role Switcher (If user has multiple roles) */}
        {roles.length > 1 && (
          <div className="p-3 border-b border-sidebar-border bg-sidebar-accent/30">
            <div className="text-[11px] text-sidebar-foreground/70 mb-1.5 font-medium">تغییر نمای نقش:</div>
            <div className="flex gap-1">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={cn(
                    "flex-1 text-xs py-1 px-1.5 rounded-md transition-colors text-center font-medium",
                    activeRole === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground/80"
                  )}
                >
                  {r === "admin" ? "مدیر" : r === "expert" ? "کارشناس" : "فروشنده"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                )}
              >
                <it.icon className="w-4 h-4 shrink-0" />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card & Sign Out */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/20">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent text-right transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {profile?.full_name ? profile.full_name[0] : user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate text-sidebar-foreground">
                {profile?.full_name || "پروفایل من"}
              </div>
              <div className="text-[11px] truncate text-sidebar-foreground/60">{user?.email}</div>
            </div>
            {profile?.verified ? (
              <UserCheck className="w-4 h-4 text-success shrink-0" title="احراز هویت شده" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-warning shrink-0" title="نیاز به تکمیل هویت" />
            )}
          </button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            onClick={signOut}
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج از حساب
          </Button>
        </div>
      </aside>

      {/* ---------------- Mobile Header Bar ---------------- */}
      <header className="md:hidden border-b border-border/70 bg-background/90 backdrop-blur sticky top-0 z-30 px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-sm" style={{ background: "var(--gradient-copper)" }}>
            ف
          </div>
          <span className="font-extrabold text-base">فلزیافت</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{roleLabel}</span>
        </Link>

        <div className="flex items-center gap-1.5">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-sidebar text-sidebar-foreground h-full flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold" style={{ background: "var(--gradient-copper)" }}>
                  ف
                </div>
                <div className="font-bold text-sm">منوی دسترسی</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {roles.length > 1 && (
              <div className="py-3 border-b border-sidebar-border">
                <div className="text-[11px] opacity-70 mb-1.5">تغییر نقش:</div>
                <div className="flex gap-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex-1 text-xs py-1 px-1.5 rounded text-center font-medium",
                        activeRole === r ? "bg-primary text-primary-foreground" : "bg-sidebar-accent"
                      )}
                    >
                      {r === "admin" ? "مدیر" : r === "expert" ? "کارشناس" : "فروشنده"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {items.map((it) => {
                const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
                    )}
                  >
                    <it.icon className="w-4 h-4" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-sidebar-border space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileModalOpen(true);
                }}
              >
                <UserIcon className="w-4 h-4" />
                ویرایش پروفایل و کد شبا
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 text-xs"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                خروج از حساب
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-6">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>

      {/* ---------------- Mobile Bottom Navigation Bar ---------------- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border/80 bg-background/95 backdrop-blur flex items-center justify-around py-2 px-1">
        {items.slice(0, 4).map((it) => {
          const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded-md transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
          <DialogTitle className="flex items-center justify-between">
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

        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            className={cn("flex-1 py-2 text-sm font-bold border-b-2 text-center", tab === "info" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            onClick={() => setTab("info")}
          >
            مشخصات فردی و بانکی
          </button>
          <button
            type="button"
            className={cn("flex-1 py-2 text-sm font-bold border-b-2 text-center", tab === "password" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
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
