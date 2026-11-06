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
import { ShieldCheck, UserCheck, Wrench } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: "var(--gradient-warm)" }}>
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm" style={{ background: "var(--gradient-copper)" }}>
            ف
          </div>
          <div className="font-extrabold text-2xl tracking-tight">فلزیافت</div>
        </Link>

        <Card className="p-6 md:p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
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
                <Button type="submit" className="w-full text-base py-5" disabled={loading}>
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
                <Button type="submit" className="w-full text-base py-5" disabled={loading}>
                  {loading ? "در حال ایجاد حساب..." : "ایجاد حساب کاربری"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Quick Demo Access Buttons */}
          <div className="mt-8 pt-6 border-t border-border/70">
            <div className="text-xs text-muted-foreground text-center mb-3">
              ورود سریع با حساب‌های آزمایشی:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-auto py-2 flex flex-col gap-1 items-center"
                disabled={loading}
                onClick={() => quickLogin("admin@felezyaft.ir", "admin123456")}
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>مدیر کل</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-auto py-2 flex flex-col gap-1 items-center"
                disabled={loading}
                onClick={() => quickLogin("expert@felezyaft.ir", "expert123456")}
              >
                <Wrench className="w-4 h-4 text-accent" />
                <span>کارشناس</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-auto py-2 flex flex-col gap-1 items-center"
                disabled={loading}
                onClick={() => quickLogin("seller@felezyaft.ir", "seller123456")}
              >
                <UserCheck className="w-4 h-4 text-success" />
                <span>فروشنده</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
