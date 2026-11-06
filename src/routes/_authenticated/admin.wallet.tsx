import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { PageHeader, Spinner, StatCard } from "@/components/app/kit";
import { Wallet as PageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type WithdrawalRequest, type Transaction, type UserData } from "@/lib/api";
import { formatToman, formatDate } from "@/lib/format";
import {
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  SlidersHorizontal,
  FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/wallet")({
  component: () => <AppShell><AdminWalletPage /></AppShell>,
});

function AdminWalletPage() {
  const [activeTab, setActiveTab] = useState<"withdrawals" | "transactions">("withdrawals");
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Process Withdrawal State
  const [selectedWd, setSelectedWd] = useState<WithdrawalRequest | null>(null);
  const [processStatus, setProcessStatus] = useState<"approved" | "rejected">("approved");
  const [trackingCode, setTrackingCode] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  // Manual Adjust Balance State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [wList, tList] = await Promise.all([
        api.wallet.listWithdrawals(),
        api.wallet.getTransactions(),
      ]);
      setWithdrawals(wList);
      setTransactions(tList);
    } catch (err: any) {
      toast.error("خطا در بارگذاری مالی: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleProcessWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWd) return;

    if (processStatus === "approved" && !trackingCode.trim()) {
      return toast.error("ورود شماره پیگیری ساتنا/پایا برای تایید پرداخت الزامی است.");
    }

    setProcessing(true);
    try {
      await api.wallet.processWithdrawal(selectedWd.id, {
        status: processStatus,
        tracking_code: trackingCode.trim(),
        admin_note: adminNote.trim(),
      });
      toast.success(processStatus === "approved" ? "برداشت تایید و تسویه شد." : "درخواست برداشت رد و مبلغ به کیف پول عودت داده شد.");
      setSelectedWd(null);
      setTrackingCode("");
      setAdminNote("");
      loadData();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function openAdjustDialog() {
    setAdjustOpen(true);
    try {
      const users = await api.admin.listUsers();
      setUsersList(users);
      if (users.length > 0 && !adjustUserId) setAdjustUserId(users[0].id);
    } catch (err: any) {
      toast.error("خطا در دریافت لیست کاربران: " + err.message);
    }
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(adjustAmount);
    if (!amount) return toast.error("مبلغ وارد شده نامعتبر است.");
    if (!adjustUserId) return toast.error("انتخاب کاربر الزامی است.");
    if (!adjustDesc.trim()) return toast.error("علت تعدیل الزامی است.");

    setAdjusting(true);
    try {
      await api.wallet.adjust({
        user_id: adjustUserId,
        amount,
        description: adjustDesc.trim(),
      });
      toast.success("موجودی کاربر با موفقیت اصلاح شد.");
      setAdjustOpen(false);
      setAdjustAmount("");
      setAdjustDesc("");
      loadData();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setAdjusting(false);
    }
  }

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const totalPaid = withdrawals
    .filter((w) => w.status === "approved")
    .reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader icon={PageIcon} eyebrow="امور مالی" title="مدیریت مالی، تسویه و برداشت‌ها" description="بررسی و واریز درخواست‌های برداشت بانکی کاربران، تعدیل دستی موجودی و گزارش تراکنش‌ها" />

        {/* Adjust Balance Dialog Trigger */}
        <Button onClick={openAdjustDialog} variant="outline" className="gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          تعدیل موجودی کاربر
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard icon={Clock} tone="warning" label="درخواست‌های برداشت در انتظار پرداخت" value={`${pendingCount} مورد`} />
        <StatCard icon={CheckCircle2} tone="success" label="مجموع مبالغ واریز شده به شبا" value={formatToman(totalPaid)} />
        <StatCard icon={FileSpreadsheet} tone="primary" label="کل تراکنش‌های ثبت شده سیستم" value={`${transactions.length} تراکنش`} className="col-span-2 md:col-span-1" />
      </div>

      {/* Tabs */}
      <div className="segmented w-fit max-w-full">
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "withdrawals"
              ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
          }`}
        >
          <span>درخواست‌های تسویه بانکی</span>
          {pendingCount > 0 && (
            <span className="bg-warning text-black/80 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "transactions"
              ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
          }`}
        >
          دفتر کل تراکنش‌ها ({transactions.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "withdrawals" ? (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <Spinner label="در حال بارگذاری درخواست‌ها..." />
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">هیچ درخواست تسویه‌ای ثبت نشده است.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs md:text-sm">
                <thead className="bg-foreground/[0.03] text-muted-foreground text-[11px] md:text-xs font-bold border-b border-border">
                  <tr>
                    <th className="p-3 md:p-4">کاربر</th>
                    <th className="p-3 md:p-4">مبلغ درخواستی</th>
                    <th className="p-3 md:p-4">شماره شبا (IBAN)</th>
                    <th className="p-3 md:p-4">تاریخ ثبت</th>
                    <th className="p-3 md:p-4">وضعیت</th>
                    <th className="p-3 md:p-4">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-primary/[0.04] transition-colors">
                      <td className="p-3 md:p-4">
                        <div className="font-bold text-foreground">{w.user_name || "کاربر"}</div>
                        {w.user_phone && <div className="text-xs text-muted-foreground font-mono">{w.user_phone}</div>}
                      </td>

                      <td className="p-3 md:p-4 font-black text-primary text-sm md:text-base">
                        {formatToman(w.amount)}
                      </td>

                      <td className="p-3 md:p-4 font-mono text-xs">
                        {w.iban_sheba}
                      </td>

                      <td className="p-3 md:p-4 text-xs text-muted-foreground">
                        {formatDate(w.created_at)}
                      </td>

                      <td className="p-3 md:p-4">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            w.status === "approved"
                              ? "bg-success/15 text-success border border-success/30"
                              : w.status === "rejected"
                              ? "bg-destructive/15 text-destructive border border-destructive/30"
                              : "bg-warning/15 text-warning border border-warning/30"
                          }`}
                        >
                          {w.status === "approved" ? "واریز شد ✓" : w.status === "rejected" ? "رد شده" : "در انتظار واریز"}
                        </span>
                        {w.tracking_code && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            پیگیری: {w.tracking_code}
                          </div>
                        )}
                      </td>

                      <td className="p-3 md:p-4">
                        {w.status === "pending" ? (
                          <Button
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
                              setSelectedWd(w);
                              setProcessStatus("approved");
                            }}
                          >
                            پرداخت و تسویه
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs md:text-sm">
              <thead className="bg-foreground/[0.03] text-muted-foreground text-[11px] md:text-xs font-bold border-b border-border">
                <tr>
                  <th className="p-3 md:p-4">تاریخ</th>
                  <th className="p-3 md:p-4">نوع تراکنش</th>
                  <th className="p-3 md:p-4">شرح</th>
                  <th className="p-3 md:p-4">کد پیگیری</th>
                  <th className="p-3 md:p-4">مبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-primary/[0.04] transition-colors">
                    <td className="p-3 md:p-4 text-xs text-muted-foreground">{formatDate(t.created_at)}</td>
                    <td className="p-3 md:p-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.type === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {t.type === "credit" ? "واریز" : "برداشت"}
                      </span>
                    </td>
                    <td className="p-3 md:p-4">{t.description || "—"}</td>
                    <td className="p-3 md:p-4 font-mono text-xs text-muted-foreground">{t.reference_code || "—"}</td>
                    <td className={`p-3 md:p-4 font-black ${t.type === "credit" ? "text-success" : "text-foreground"}`}>
                      {t.type === "credit" ? "+" : "-"}
                      {formatToman(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Process Withdrawal Dialog */}
      {selectedWd && (
        <Dialog open={!!selectedWd} onOpenChange={() => setSelectedWd(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعیین وضعیت درخواست برداشت وجه</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProcessWithdrawal} className="space-y-4 mt-2">
              <div className="p-3 bg-secondary/50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نام دریافت‌کننده:</span>
                  <span className="font-bold text-foreground">{selectedWd.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مبلغ تسویه:</span>
                  <span className="font-extrabold text-primary text-sm">{formatToman(selectedWd.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">شماره شبا:</span>
                  <span className="font-mono text-foreground font-bold">{selectedWd.iban_sheba}</span>
                </div>
              </div>

              <div>
                <Label>وضعیت اقدام</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant={processStatus === "approved" ? "default" : "outline"}
                    className="gap-1.5"
                    onClick={() => setProcessStatus("approved")}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تایید واریز شد
                  </Button>
                  <Button
                    type="button"
                    variant={processStatus === "rejected" ? "destructive" : "outline"}
                    className="gap-1.5"
                    onClick={() => setProcessStatus("rejected")}
                  >
                    <XCircle className="w-4 h-4" />
                    رد درخواست (استرداد)
                  </Button>
                </div>
              </div>

              {processStatus === "approved" ? (
                <div>
                  <Label>شماره پیگیری تراکنش بانکی (کد پیگیری ساتنا / پایا)</Label>
                  <Input
                    required
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="mt-1"
                    dir="ltr"
                    placeholder="مثلا: 14030801987654"
                  />
                </div>
              ) : (
                <div>
                  <Label>علت رد درخواست (به کاربر نمایش داده می‌شود)</Label>
                  <Input
                    required
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="mt-1"
                    placeholder="مثلا: شماره شبا با نام دارنده حساب همخوانی ندارد..."
                  />
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={processing}>
                {processing ? "در حال ثبت..." : "ثبت نهایی وضعیت"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعدیل دستی موجودی کیف پول کاربر</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustBalance} className="space-y-4 mt-2">
            <div>
              <Label>انتخاب کاربر</Label>
              <select
                value={adjustUserId}
                onChange={(e) => setAdjustUserId(e.target.value)}
                className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm"
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.profile?.full_name ? `${u.profile.full_name} (${u.email})` : u.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>مبلغ تعدیل (تومان)</Label>
              <Input
                type="number"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                dir="ltr"
                placeholder="عدد مثبت برای شارژ (واریز)، عدد منفی برای کسر"
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                برای شارژ موجودی عدد مثبت (مثلا ۵۰۰۰۰۰) و برای کسر، علامت منفی (مثلا ۵۰۰۰۰۰-) بگذارید.
              </p>
            </div>

            <div>
              <Label>علت و شرح تعدیل</Label>
              <Input
                required
                value={adjustDesc}
                onChange={(e) => setAdjustDesc(e.target.value)}
                placeholder="مثلا: پاداش، اصلاح خطای توزین محموله، تسویه دستی..."
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={adjusting}>
              {adjusting ? "در حال اعمال..." : "اعمال تغییر در کیف پول"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
