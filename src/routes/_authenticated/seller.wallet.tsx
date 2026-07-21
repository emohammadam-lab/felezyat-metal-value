import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatToman, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/seller/wallet")({
  component: () => <AppShell><WalletPage /></AppShell>,
});

const TYPE_LABEL: Record<string, string> = {
  credit: "واریز",
  debit: "برداشت",
  hold: "بلوکه",
  release: "آزادسازی",
};

function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle().then(({ data }) => setBalance(Number(data?.balance ?? 0)));
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30).then(({ data }) => setTx(data ?? []));
  }, [user]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">کیف پول</h1>
      <Card className="p-8 mb-6" style={{ background: "var(--gradient-copper)", boxShadow: "var(--shadow-copper)" }}>
        <div className="flex items-center gap-3 text-primary-foreground/80">
          <Wallet className="w-5 h-5" /> موجودی قابل برداشت
        </div>
        <div className="text-4xl md:text-5xl font-extrabold text-primary-foreground mt-3">{formatToman(balance)}</div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> تراکنش‌های اخیر</h2>
        {tx.length === 0 ? (
          <p className="text-muted-foreground text-sm">تراکنشی ثبت نشده است.</p>
        ) : (
          <div className="divide-y">
            {tx.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{TYPE_LABEL[t.type] || t.type}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(t.created_at)} • {t.description || "—"}</div>
                </div>
                <div className={"font-bold " + (t.type === "credit" || t.type === "release" ? "text-success" : "text-muted-foreground")}>
                  {formatToman(Number(t.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
