import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: () => <AppShell><UsersPage /></AppShell>,
});

function UsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, string[]>>({});

  async function load() {
    const { data: p } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(p ?? []);
    const { data: r } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, string[]> = {};
    (r ?? []).forEach((row: any) => { (map[row.user_id] ||= []).push(row.role); });
    setRoleMap(map);
  }
  useEffect(() => { load(); }, []);

  async function toggle(userId: string, role: "expert" | "admin") {
    const current = roleMap[userId] || [];
    if (current.includes(role)) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("نقش به‌روزرسانی شد.");
    load();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">کاربران و نقش‌ها</h1>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-right">
            <tr>
              <th className="p-3">نام</th>
              <th className="p-3">ایمیل / موبایل</th>
              <th className="p-3">نقش‌ها</th>
              <th className="p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const roles = roleMap[p.id] || ["seller"];
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.phone || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {roles.map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant={roles.includes("expert") ? "default" : "outline"} onClick={() => toggle(p.id, "expert")}>کارشناس</Button>
                      <Button size="sm" variant={roles.includes("admin") ? "default" : "outline"} onClick={() => toggle(p.id, "admin")}>مدیر</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
