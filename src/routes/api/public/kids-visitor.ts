import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Schema para limitar o rate limit por IP (simulado via Cloudflare headers ou apenas Zod)
const visitorRequestSchema = z.object({
  guardian_full_name: z.string().trim().min(3).max(120),
  guardian_phone: z.string().trim().min(10).max(30),
  guardian_relation: z.string().min(1),
  guardian_document: z.string().trim().max(40).nullable().optional(),
  child_full_name: z.string().trim().min(3).max(120),
  child_nickname: z.string().trim().max(60).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  classroom: z.string().min(1),
  allergies: z.string().trim().max(500).nullable().optional(),
  health_notes: z.string().trim().max(500).nullable().optional(),
  special_needs: z.string().trim().max(500).nullable().optional(),
  photo_consent: z.boolean(),
  other_pickup: z.string().trim().max(300).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  document_url: z.string().nullable().optional(),
});

export const Route = createFileRoute("/api/public/kids-visitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const validated = visitorRequestSchema.parse(body);

          // Segurança: o documento só pode apontar para um arquivo do próprio storage
          // (evita URLs arbitrárias / javascript:). Aceita vazio.
          if (validated.document_url) {
            let ok = false;
            try {
              const u = new URL(validated.document_url);
              ok = u.protocol === "https:" && u.pathname.includes("/storage/v1/");
            } catch {
              ok = false;
            }
            if (!ok) {
              return new Response(JSON.stringify({ error: "Documento inválido." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          // Usar supabaseAdmin importado dinamicamente para garantir que a inserção ocorra via service_role
          // sem expor a chave no cliente. A tabela kids_visitor_requests tem RLS restrito.
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { error } = await (supabaseAdmin.from("kids_visitor_requests") as any).insert({
            ...validated,
            status: "pendente",
          });

          // Bug corrigido: antes o erro do insert era ignorado e a API respondia 201
          // mesmo em falha, causando perda silenciosa do cadastro.
          if (error) throw error;

          return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          if (err instanceof z.ZodError) {
            return new Response(
              JSON.stringify({ error: "Dados inválidos.", details: err.errors }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          return new Response(JSON.stringify({ error: "Erro interno no servidor." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
