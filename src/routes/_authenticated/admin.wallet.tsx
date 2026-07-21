import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatToman, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/wallet")({
  component: () => <AppShell><AdminWallet /></AppShell>,
});

function AdminWallet() {
  const [tx, setTx] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => {
      setTx(data ?? []);
      setTotal((data ?? []).filter((t) => t.type === "credit").reduce((a, t) => a + Number(t.amount), 0));
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">گزارش تسویه</h1>
      <Card className="p-8 mb-6" style={{ background: "var(--gradient-copper)", boxShadow: "var(--shadow-copper)" }}>
        <div className="text-primary-foreground/80">مجموع تسویه‌های ثبت شده</div>
        <div className="text-4xl font-extrabold text-primary-foreground mt-2">{formatToman(total)}</div>
      </Card>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-right">
            <tr>
              <th className="p-3">تاریخ</th>
              <th className="p-3">نوع</th>
              <th className="p-3">توضیحات</th>
              <th className="p-3">مبلغ</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                <td className="p-3">{t.type}</td>
                <td className="p-3">{t.description || "—"}</td>
                <td className="p-3 font-bold text-primary">{formatToman(Number(t.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
