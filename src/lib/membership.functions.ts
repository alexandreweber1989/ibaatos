import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const approveSchema = z.object({
  request_id: z.string().uuid(),
  password: z.string().min(8).max(72),
});

const deleteSchema = z.object({ user_id: z.string().uuid() });

/** Garante que o chamador é admin geral, usando o cliente autenticado dele. */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin_geral",
  });
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!isAdmin) throw new Error("Apenas o administrador geral pode fazer isso.");
}

/**
 * Aprova uma solicitação de cadastro: cria a conta de acesso, complementa o
 * perfil e marca a solicitação como aprovada.
 */
export const approveMembershipRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => approveSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: reqError } = await supabaseAdmin
      .from("membership_requests")
      .select("*")
      .eq("id", data.request_id)
      .maybeSingle();
    if (reqError) throw new Error(reqError.message);
    if (!req) throw new Error("Solicitação não encontrada.");
    if (req.status !== "pendente") throw new Error("Esta solicitação já foi tratada.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: req.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: req.full_name },
    });
    if (error) throw new Error(error.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("Conta criada sem identificador.");

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: req.full_name,
        email: req.email,
        phone: req.phone ?? null,
      } as never,
      { onConflict: "id" },
    );
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "membro" } as never, { onConflict: "user_id,role" });

    const { error: updError } = await supabaseAdmin
      .from("membership_requests")
      .update({
        status: "aprovado",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        profile_id: userId,
      })
      .eq("id", data.request_id);
    if (updError) throw new Error(updError.message);

    return { id: userId };
  });

/** Remove definitivamente um membro da plataforma (conta + ficha). */
export const deleteMemberAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("Você não pode excluir a própria conta.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
