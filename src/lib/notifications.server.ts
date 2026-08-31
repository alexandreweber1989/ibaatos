import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getLeaderContactsForMesa(mesaId: string) {
  // Busca os líderes da mesa específica
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("mesa_id", mesaId)
    .in("role", ["lider_mesa", "admin_geral"]);

  if (!roles || roles.length === 0) return [];

  const userIds = roles.map((r) => r.user_id);

  // Busca os perfis desses líderes
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone")
    .in("id", userIds);

  return profiles || [];
}

export async function getSocialAdmins() {
  // Busca administradores gerais (que gerenciam o Atos de Amor por padrão)
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin_geral");

  if (!roles || roles.length === 0) return [];

  const userIds = roles.map((r) => r.user_id);

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone")
    .in("id", userIds);

  return profiles || [];
}

export async function getAllMemberProfiles() {
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone")
    .not("email", "is", null);

  if (error) throw error;
  return profiles || [];
}
