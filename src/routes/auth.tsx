import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, getStoredToken } from "@/lib/api";
import { Coins, Scale, ShieldCheck, Sparkles, UserCheck, Wrench } from "lucide-react";
import { BrandMark, Wordmark } from "@/components/app/kit";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredToken()) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.login({ email, password });
      toast.success("ورود با موفقیت انجام شد.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error("ورود ناموفق: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.signup({
        email,
        password,
        full_name: fullName,
        phone,
      });
      toast.success("حساب کاربری با موفقیت ایجاد شد. خوش آمدید.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error("ثبت‌نام ناموفق: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(demoEmail: string, demoPass: string) {
    setLoading(true);
    try {
      await api.auth.login({ email: demoEmail, password: demoPass });
      toast.success("ورود موفقیت‌آمیز");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error("خطا در ورود: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 xl:p-14 bg-sidebar text-sidebar-foreground">
        <div className="absolute inset-0 bg-grid opacity-70 pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-primary/25 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-[100px] pointer-events-none" />

        <Link to="/" className="relative">
          <Wordmark sub={<span className="text-sidebar-foreground/60">خرید نقدی ضایعات مس</span>} />
        </Link>

        <div className="relative">
          <div className="animate-float mb-10 w-fit">
            <BrandMark size={110} className="drop-shadow-[0_30px_50px_oklch(0.73_0.145_52/0.55)]" />
          </div>
          <h2 className="text-3xl xl:text-4xl font-black leading-snug">
            هر کیلو مس،
            <br />
            <span className="copper-text">یک قدم به پول نقد</span>
          </h2>
          <p className="mt-5 text-sidebar-foreground/75 text-sm sm:text-base leading-relaxed max-w-md">
            محموله‌ات را ثبت کن، کارشناس ما قیمت‌گذاری می‌کند و بعد از توزین شفاف، پولت آنی به کیف پولت می‌آید.
          </p>
          <div className="mt-10 space-y-3 max-w-sm">
            {[
              { icon: Sparkles, t: "قیمت‌گذاری بر پایه نرخ زنده مس و دلار" },
              { icon: Scale, t: "توزین در باسکول مرجع، جلوی چشم خودت" },
              { icon: Coins, t: "تسویه لحظه‌ای به شماره شبا" },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 px-4 py-3 text-sm font-semibold">
                <x.icon className="w-4 h-4 text-primary shrink-0" />
                {x.t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-sidebar-foreground/50">© فلزیافت · felezyaft.ir</div>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center px-4 py-12">
        <div className="absolute top-4 left-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-rise">
          <Link to="/" className="flex justify-center mb-8 lg:hidden">
            <Wordmark />
          </Link>

          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-black leading-snug">خوش آمدی</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">وارد حسابت شو یا در کمتر از یک دقیقه ثبت‌نام کن.</p>
          </div>

          <Card className="p-6 md:p-7">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">ورود به حساب</TabsTrigger>
              <TabsTrigger value="signup">ثبت‌نام فروشنده</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label>ایمیل</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    dir="ltr"
                    placeholder="example@mail.com"
                  />
                </div>
                <div>
                  <Label>رمز عبور</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                  {loading ? "در حال بررسی..." : "ورود به سامانه"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label>نام و نام خانوادگی</Label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5"
                    placeholder="مثلا: علی اکبری"
                  />
                </div>
                <div>
                  <Label>شماره موبایل</Label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5"
                    dir="ltr"
                    placeholder="0912xxxxxxx"
                  />
                </div>
                <div>
                  <Label>ایمیل</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    dir="ltr"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label>رمز عبور (حداقل ۶ کاراکتر)</Label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                  {loading ? "در حال ایجاد حساب..." : "ایجاد حساب کاربری"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Quick Demo Access Buttons */}
          <div className="mt-7">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="h-px flex-1 bg-border" />
              ورود سریع با حساب‌های آزمایشی
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-auto py-3 flex flex-col gap-1.5 items-center rounded-2xl"
                disabled={loading}
                onClick={() => quickLogin("admin@felezyaft.ir", "admin123456")}
              >
                <ShieldCheck className="!size-5 text-primary" />
                <span>مدیر کل</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-auto py-3 flex flex-col gap-1.5 items-center rounded-2xl"
                disabled={loading}
                onClick={() => quickLogin("expert@felezyaft.ir", "expert123456")}
              >
                <Wrench className="!size-5 text-accent" />
                <span>کارشناس</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-auto py-3 flex flex-col gap-1.5 items-center rounded-2xl"
                disabled={loading}
                onClick={() => quickLogin("seller@felezyaft.ir", "seller123456")}
              >
                <UserCheck className="!size-5 text-success" />
                <span>فروشنده</span>
              </Button>
            </div>
          </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
