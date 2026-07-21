import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "seller" | "expert" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadRoles(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    async function loadRoles(uid: string) {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      setRoles((data ?? []).map((r) => r.role as AppRole));
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const isExpert = roles.includes("expert");
  const primaryRole: AppRole = isAdmin ? "admin" : isExpert ? "expert" : "seller";

  return { session, user, roles, isAdmin, isExpert, primaryRole, loading };
}