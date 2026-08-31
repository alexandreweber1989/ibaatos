import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const updateUserPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateUserPassword = createServerFn({ method: "POST" })
  .validator((data) => updateUserPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    console.log(`[Auth] Attempting to set password for ${data.email}`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Get the user ID by email
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();

    if (getUserError) {
      console.error("[Auth] Error listing users:", getUserError);
      throw new Error("Falha ao localizar usuário no sistema.");
    }

    let user = userData.users.find((u) => u.email === data.email);

    // 2. If user doesn't exist, create them
    if (!user) {
      console.log(`[Auth] User ${data.email} not found in auth.users, creating...`);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

      if (createError) {
        console.error("[Auth] Error creating user:", createError);
        throw new Error(`Erro ao criar conta: ${createError.message}`);
      }

      user = createData.user;
      console.log(`[Auth] User created successfully for ${data.email}`);
    } else {
      // 3. Update the existing user's password
      console.log(`[Auth] Updating password for existing user ${data.email}`);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: data.password,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, email_verified: true },
      });

      if (updateError) {
        console.error("[Auth] Error updating password:", updateError);
        throw new Error(`Erro ao definir senha: ${updateError.message}`);
      }
      console.log(`[Auth] Password updated successfully for ${data.email}`);
    }

    return { success: true, message: "Conta configurada e senha definida com sucesso!" };
  });
