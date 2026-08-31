import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const registerVisitor = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        full_name: z.string().min(3),
        whatsapp: z.string().min(10),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
    const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing credentials for admin operation");
    }

    console.log("Attempting RPC registration for:", data.full_name);

    // Prioritize the SECURITY DEFINER RPC to bypass RLS
    const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_public_visitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        _full_name: data.full_name,
        _whatsapp: data.whatsapp,
      }),
    });

    const resultText = await rpcResponse.text();

    if (rpcResponse.ok) {
      try {
        return JSON.parse(resultText);
      } catch (e) {
        return { success: true };
      }
    }

    console.error("RPC registration failed:", resultText);

    // Attempt fallback only if RPC is missing/fails, but RLS 42501 usually means the table policy is still blocking
    // Even if the RPC fails, we throw the specific error to avoid generic messages
    const errorData = JSON.parse(resultText || "{}");
    throw new Error(errorData.message || "Erro ao registrar visita. Por favor, tente novamente.");
  });

export const getVisitorStats = createServerFn({ method: "GET" }).handler(async () => {
  const SUPABASE_URL = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { pending: 0 };
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { count } = await admin
    .from("visitor_checkins")
    .select("*", { count: "exact", head: true })
    .eq("status", "novo");
  return { pending: count || 0 };
});
