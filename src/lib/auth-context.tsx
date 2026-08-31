import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin_geral"
  | "admin_ministerio"
  | "lider_mesa"
  | "membro"
  | "admin_livraria"
  | "admin_cantina"
  | "admin_kids";

export interface RoleRow {
  role: AppRole;
  ministry_id: string | null;
  mesa_id: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: RoleRow[];
  loading: boolean;
  profile: any;
  isAdmin: boolean;
  isMinistryAdmin: (ministryId: string) => boolean;
  isMesaLeader: (mesaId: string) => boolean;
  isLivrariaAdmin: boolean;
  isCantinaAdmin: boolean;
  /** Admin geral ou admin do Ministério Infantil. */
  isKidsAdmin: boolean;
  /** Equipe pastoral: admin geral, pastores e apascentadores. */
  isPastoral: boolean;
  /** Qualquer nível de liderança (equipe pastoral + líderes de mesa). */
  isLeadership: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) {
        setSession(data.session);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") {
          qc.invalidateQueries();
        } else {
          setLoading(false);
        }
      }
    });

    void init();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, qc]);

  useEffect(() => {
    if (!session?.user) {
      setRoles([]);
      if (!session) setLoading(false);
      return;
    }
    let active = true;

    const loadRolesAndProfile = async () => {
      setLoading(true);
      const [rolesRes, profileRes] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role, ministry_id, mesa_id")
          .eq("user_id", session.user.id),
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
      ]);

      if (!active) return;

      if (rolesRes.error) {
        console.error("Não foi possível carregar as permissões do usuário.", rolesRes.error);
        setRoles([]);
      } else {
        setRoles((rolesRes.data ?? []) as RoleRow[]);
      }

      if (profileRes.error) {
        console.error("Erro ao carregar perfil:", profileRes.error);
      } else {
        setProfile(profileRes.data);
      }

      if (active) setLoading(false);
    };

    void loadRolesAndProfile();
    window.addEventListener("focus", loadRolesAndProfile);
    return () => {
      active = false;
      window.removeEventListener("focus", loadRolesAndProfile);
    };
  }, [session?.user?.id]);

  const isAdmin = roles.some((r) => r.role === "admin_geral");
  const isKidsAdmin = isAdmin || roles.some((r) => r.role === "admin_kids");
  const churchFunction = (profile?.church_function ?? "") as string;
  const isPastoral = isAdmin || ["pastor", "apascentador"].includes(churchFunction);
  const isLeadership =
    isPastoral ||
    churchFunction === "lider" ||
    roles.some((r) => r.role === "lider_mesa" || r.role === "admin_ministerio");

  const value: AuthState = {
    user: session?.user ?? null,
    session,
    roles,
    profile,
    loading,
    isAdmin,
    isMinistryAdmin: (id) =>
      isAdmin || roles.some((r) => r.role === "admin_ministerio" && r.ministry_id === id),
    isMesaLeader: (id) => isAdmin || roles.some((r) => r.role === "lider_mesa" && r.mesa_id === id),
    isLivrariaAdmin: isAdmin || roles.some((r) => r.role === "admin_livraria"),
    isCantinaAdmin: isAdmin || roles.some((r) => r.role === "admin_cantina"),
    isKidsAdmin,
    isPastoral,
    isLeadership,

    signOut: async () => {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      router.navigate({ to: "/auth", replace: true });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
