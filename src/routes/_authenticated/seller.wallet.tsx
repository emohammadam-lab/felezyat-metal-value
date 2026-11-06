import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { PageHeader } from "@/components/app/kit";
import { Wallet as PageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { api, type Transaction, type WithdrawalRequest } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { formatToman, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/seller/wallet")({
  component: () => <AppShell><WalletPage /></AppShell>,
});

const TYPE_LABEL: Record<string, string> = {
  credit: "واریز بابت تسویه محموله",
  debit: "برداشت و انتقال به حساب بانکی",
  hold: "بلوکه موقت",
  release: "آزادسازی وجه",
};

function WalletPage() {
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"tx" | "wd">("tx");
  const [loading, setLoading] = useState(true);

  // Withdrawal dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [sheba, setSheba] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [w, tList, wList] = await Promise.all([
        api.wallet.get(),
        api.wallet.getTransactions(),
        api.wallet.listWithdrawals(),
      ]);
      setBalance(w.balance);
      setTx(tList);
      setWithdrawals(wList);
    } catch (err: any) {
      toast.error("خطا در بارگذاری اطلاعات کیف پول: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  useEffect(() => {
    if (profile?.iban_sheba && !sheba) {
      setSheba(profile.iban_sheba);
    }
  }, [profile, sheba]);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      return toast.error("مبلغ برداشت نامعتبر است.");
    }
    if (amount > balance) {
      return toast.error("مبلغ درخواستی بیشتر از موجودی کیف پول است.");
    }
    if (!sheba.toUpperCase().startsWith("IR") || sheba.length < 24) {
      return toast.error("شماره شبا نامعتبر است. شماره شبا باید با IR شروع شود.");
    }

    setSubmitting(true);
    try {
      await api.wallet.requestWithdrawal({
        amount,
        iban_sheba: sheba.trim().toUpperCase(),
      });
      toast.success("درخواست برداشت ثبت شد و به زودی توسط حسابداری تسویه خواهد شد.");
      setDialogOpen(false);
      setWithdrawAmount("");
      loadData();
    } catch (err: any) {
      toast.error("خطا در ثبت درخواست: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader icon={PageIcon} eyebrow="کیف پول" title="کیف پول و تسویه حساب" description="مشاهده موجودی نقدی و ثبت درخواست تسویه به حساب بانکی" />

        {/* Withdrawal Dialog Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm" disabled={balance <= 0}>
              <ArrowUpRight className="w-4 h-4" />
              درخواست برداشت وجه
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ثبت درخواست برداشت وجه به شماره شبا</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleWithdraw} className="space-y-4 mt-2">
              <div className="p-3 bg-secondary/50 rounded-lg flex justify-between items-center text-sm">
                <span className="text-muted-foreground">موجودی قابل برداشت:</span>
                <span className="font-extrabold text-primary">{formatToman(balance)}</span>
              </div>

              <div>
                <Label>مبلغ برداشت (تومان)</Label>
                <div className="relative mt-1.5">
                  <Input
                    type="number"
                    min={10000}
                    max={balance}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    dir="ltr"
                    placeholder="مثلا: ۵۰۰۰۰۰۰"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(balance))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-primary font-bold rounded-lg bg-primary/10 px-2 py-1 hover:bg-primary/20"
                  >
                    کل موجودی
                  </button>
                </div>
              </div>

              <div>
                <Label>شماره شبا (IBAN)</Label>
                <Input
                  required
                  value={sheba}
                  onChange={(e) => setSheba(e.target.value)}
                  dir="ltr"
                  className="mt-1.5"
                  placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  تسویه از طریق حواله پایا / ساتنا به نام صاحب حساب انجام می‌شود.
                </p>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={submitting}>
                {submitting ? "در حال ثبت درخواست..." : "تایید و ارسال به حسابداری"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Hero Card */}
      <Card
        className="p-6 md:p-8 text-primary-foreground border-0 relative overflow-hidden rounded-3xl"
        style={{ background: "var(--gradient-copper)", boxShadow: "var(--shadow-copper)" }}
      >
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
        <div className="absolute -left-8 -bottom-12 h-48 w-48 rounded-full bg-white/25 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/90 font-medium">
              <Wallet className="w-5 h-5" /> موجودی نقدی قابل برداشت
            </div>
            <div className="text-3xl md:text-5xl font-black mt-2 tracking-tight">
              {formatToman(balance)}
            </div>
          </div>
          <div className="text-xs text-primary-foreground/80 max-w-xs leading-5">
            مبالغ فروش محموله‌ها بلافاصله پس از باسکول به این حساب منظور شده و بدون کارمزد قابل انتقال به حساب بانکی است.
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="segmented w-fit max-w-full">
        <button
          onClick={() => setActiveTab("tx")}
          className={`py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "tx"
              ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
          }`}
        >
          گردش حساب و تراکنش‌ها ({tx.length})
        </button>
        <button
          onClick={() => setActiveTab("wd")}
          className={`py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "wd"
              ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
          }`}
        >
          درخواست‌های برداشت ({withdrawals.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "tx" ? (
        <Card className="p-4 md:p-6">
          {tx.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              هنوز تراکنشی در این حساب ثبت نشده است.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {tx.map((t) => (
                <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        t.type === "credit" || t.type === "release"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {t.type === "credit" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{TYPE_LABEL[t.type] || t.type}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(t.created_at)} • {t.description || "—"}
                      </div>
                      {t.reference_code && (
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          کد پیگیری: {t.reference_code}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`font-black text-sm md:text-base shrink-0 ${
                      t.type === "credit" || t.type === "release" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {t.type === "credit" ? "+" : "-"}
                    {formatToman(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-4 md:p-6">
          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              هیچ درخواست برداشتی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-primary">{formatToman(w.amount)}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          w.status === "approved"
                            ? "bg-success/15 text-success border border-success/30"
                            : w.status === "rejected"
                            ? "bg-destructive/15 text-destructive border border-destructive/30"
                            : "bg-warning/15 text-warning border border-warning/30"
                        }`}
                      >
                        {w.status === "approved"
                          ? "واریز شد ✓"
                          : w.status === "rejected"
                          ? "رد شد"
                          : "در حال پردازش بانکی"}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>تاریخ ثبت: {formatDate(w.created_at)}</span>
                      <span className="font-mono">شبا: {w.iban_sheba}</span>
                    </div>

                    {w.tracking_code && (
                      <div className="text-xs text-success font-medium mt-1">
                        شماره پیگیری بانکی (ساتنا/پایا): {w.tracking_code}
                      </div>
                    )}
                    {w.admin_note && (
                      <div className="text-xs text-muted-foreground mt-1">
                        توضیحات حسابداری: {w.admin_note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
