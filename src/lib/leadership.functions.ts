import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  user_id: z.string().uuid(),
  ministries: z.array(z.string().uuid()),
  redes: z.array(z.string().uuid()),
  mesas: z.array(z.string().uuid()),
});

/**
 * Sincroniza a liderança de um membro em diversos grupos (ministérios, redes, mesas).
 * Somente admin geral pode realizar essa alteração em lote.
 */
export const updateMemberLeadership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    if (roleError) throw new Error("Não foi possível validar suas permissões.");
    if (!isAdmin) throw new Error("Apenas o administrador geral pode alterar lideranças.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Ministérios
    const { data: currentMin } = await supabaseAdmin
      .from("ministry_members")
      .select("ministry_id")
      .eq("user_id", data.user_id);

    const prevMin = (currentMin ?? []).map((m) => m.ministry_id);
    const delMin = prevMin.filter((id) => !data.ministries.includes(id));
    const addMin = data.ministries.filter((id) => !prevMin.includes(id));

    if (delMin.length > 0) {
      await supabaseAdmin
        .from("ministry_members")
        .delete()
        .eq("user_id", data.user_id)
        .in("ministry_id", delMin);
    }
    if (addMin.length > 0) {
      await supabaseAdmin.from("ministry_members").insert(
        addMin.map((id) => ({
          user_id: data.user_id,
          ministry_id: id,
          function_name: "Responsável",
        })),
      );
    }

    // 2. Redes
    const { data: currentRede } = await supabaseAdmin
      .from("rede_members")
      .select("rede_id")
      .eq("user_id", data.user_id);

    const prevRede = (currentRede ?? []).map((r) => r.rede_id);
    const delRede = prevRede.filter((id) => !data.redes.includes(id));
    const addRede = data.redes.filter((id) => !prevRede.includes(id));

    if (delRede.length > 0) {
      await supabaseAdmin
        .from("rede_members")
        .delete()
        .eq("user_id", data.user_id)
        .in("rede_id", delRede);
    }
    if (addRede.length > 0) {
      // Pega a primeira função de liderança disponível ou 'lider'
      await supabaseAdmin
        .from("rede_members")
        .insert(addRede.map((id) => ({ user_id: data.user_id, rede_id: id, role: "lider" })));
    }

    // 3. Mesas
    const { data: currentMesa } = await supabaseAdmin
      .from("mesa_members")
      .select("mesa_id")
      .eq("user_id", data.user_id);

    const prevMesa = (currentMesa ?? []).map((m) => m.mesa_id);
    const delMesa = prevMesa.filter((id) => !data.mesas.includes(id));
    const addMesa = data.mesas.filter((id) => !prevMesa.includes(id));

    if (delMesa.length > 0) {
      await supabaseAdmin
        .from("mesa_members")
        .delete()
        .eq("user_id", data.user_id)
        .in("mesa_id", delMesa);
    }
    if (addMesa.length > 0) {
      await supabaseAdmin
        .from("mesa_members")
        .insert(addMesa.map((id) => ({ user_id: data.user_id, mesa_id: id, role: "lider" })));
    }

    return { ok: true };
  });
