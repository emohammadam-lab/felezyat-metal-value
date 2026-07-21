import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("ورود ناموفق: " + error.message);
    toast.success("ورود موفق");
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);
    if (error) return toast.error("ثبت‌نام ناموفق: " + error.message);
    toast.success("ثبت‌نام موفق. وارد شدید.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-warm)" }}>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-primary-foreground font-bold" style={{ background: "var(--gradient-copper)" }}>م</div>
          <div className="font-bold text-xl">مسیار</div>
        </Link>
        <Card className="p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">ورود</TabsTrigger>
              <TabsTrigger value="signup">ثبت‌نام</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label>ایمیل</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" dir="ltr" />
                </div>
                <div>
                  <Label>رمز عبور</Label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" dir="ltr" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "ورود"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label>نام و نام خانوادگی</Label>
                  <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>شماره موبایل</Label>
                  <Input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" dir="ltr" placeholder="09xxxxxxxxx" />
                </div>
                <div>
                  <Label>ایمیل</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" dir="ltr" />
                </div>
                <div>
                  <Label>رمز عبور</Label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" dir="ltr" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "ایجاد حساب فروشنده"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          حساب کارشناس یا ادمین توسط مدیریت پلتفرم اعطا می‌شود.
        </p>
      </div>
    </div>
  );
}
