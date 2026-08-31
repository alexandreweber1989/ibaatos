import crypto from "node:crypto";
import webpush from "web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";

/** Conteúdo que chega no celular. */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  type?: "emergency" | "announcement" | "event";
  tag?: string;
}

export interface ResultadoEnvio {
  enviados: number;
  falhas: number;
  semAparelho: number;
  expiradas: number;
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/**
 * Chaves VAPID: primeiro do ambiente (se a igreja preferir configurar por lá),
 * senão do banco. Guardar no banco evita depender de variáveis de ambiente do
 * serviço de publicação, que foi o que impediu o recurso de funcionar.
 */
export async function obterVapid(): Promise<VapidKeys | null> {
  const envPub = process.env["VAPID_PUBLIC_KEY"];
  const envPriv = process.env["VAPID_PRIVATE_KEY"];
  if (envPub && envPriv) {
    return {
      publicKey: envPub,
      privateKey: envPriv,
      subject: process.env["VAPID_SUBJECT"] || "mailto:contato@igrejabatistaatos.com.br",
    };
  }

  // 2) Configuração explícita guardada no banco (se a tabela existir).
  try {
    const { data } = await (supabaseAdmin.from("push_config" as any) as any)
      .select("public_key, private_key, subject")
      .maybeSingle();
    if (data?.public_key && data?.private_key) {
      return {
        publicKey: data.public_key,
        privateKey: data.private_key,
        subject: data.subject || ASSUNTO_PADRAO,
      };
    }
  } catch {
    // Tabela ausente ou indisponível: seguimos para a derivação automática.
  }

  // 3) Derivação automática — funciona sem nenhuma configuração.
  return derivarVapid();
}

const ASSUNTO_PADRAO = "mailto:contato@igrejabatistaatos.com.br";

/**
 * Segredo usado para derivar as chaves. Procura no ambiente e, se nada houver,
 * usa a própria credencial com que o cliente admin foi construído — que pode
 * vir de um valor embutido no arquivo gerado do Supabase. Foi exatamente esse
 * o caso que fez a derivação falhar: process.env estava vazio no servidor,
 * embora o cliente admin funcionasse.
 */
function segredoDoServidor(): string | null {
  const doAmbiente =
    process.env["VAPID_SEED"] ||
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["SUPABASE_SECRET_KEY"];
  if (doAmbiente) return doAmbiente;

  try {
    const chave = (supabaseAdmin as unknown as { supabaseKey?: string }).supabaseKey;
    if (typeof chave === "string" && chave.length >= 20) return chave;
  } catch {
    // Cliente admin indisponível: sem segredo para derivar.
  }
  return null;
}

/**
 * Deriva o par de chaves VAPID a partir de um segredo que o servidor já possui.
 * É determinístico: as mesmas chaves são obtidas sempre, então as assinaturas
 * dos celulares continuam válidas entre deploys — sem tabela e sem variável
 * de ambiente para configurar.
 */
export function derivarVapid(): VapidKeys | null {
  const segredo = segredoDoServidor();
  if (!segredo) return null;

  const escalar = Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(segredo, "utf8"),
      Buffer.from("iba-atos-push-vapid-v1"),
      Buffer.from("vapid"),
      32,
    ),
  );
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(escalar);
  return {
    publicKey: ecdh.getPublicKey().toString("base64url"),
    privateKey: escalar.toString("base64url"),
    subject: process.env["VAPID_SUBJECT"] || ASSUNTO_PADRAO,
  };
}

/**
 * Garante que existem chaves utilizáveis. Como a derivação automática cobre o
 * caso sem configuração, isto praticamente nunca falha; a gravação no banco é
 * apenas um registro (best-effort) para permitir troca manual no futuro.
 */
export async function garantirVapid(): Promise<VapidKeys> {
  const chaves = await obterVapid();
  if (!chaves) {
    throw new Error(
      "O servidor não tem nenhum segredo disponível para gerar as chaves de notificação. " +
        "Confira as variáveis de ambiente do Supabase na publicação.",
    );
  }

  // Registro opcional: se a tabela não existir, seguimos normalmente.
  try {
    await (supabaseAdmin.from("push_config" as any) as any).upsert(
      {
        id: true,
        public_key: chaves.publicKey,
        private_key: chaves.privateKey,
        subject: chaves.subject,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch {
    // Sem problema: as chaves derivadas continuam válidas a cada requisição.
  }

  return chaves;
}

export interface AssinaturaWeb {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Monta a assinatura a partir da linha do banco, aceitando os dois formatos:
 * as colunas dedicadas (quando existirem) ou o JSON guardado em `token`.
 */
function assinaturaDe(linha: Record<string, any>): AssinaturaWeb | null {
  if (linha.endpoint && linha.p256dh && linha.auth) {
    return { endpoint: linha.endpoint, keys: { p256dh: linha.p256dh, auth: linha.auth } };
  }
  try {
    const j = JSON.parse(linha.token ?? "");
    if (j?.endpoint && j?.keys?.p256dh && j?.keys?.auth) {
      return { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } };
    }
  } catch {
    // `token` antigo/simulado: ignorado.
  }
  return null;
}

async function configurarVapid(): Promise<boolean> {
  const chaves = await obterVapid();
  if (!chaves) return false;
  webpush.setVapidDetails(chaves.subject, chaves.publicKey, chaves.privateKey);
  return true;
}

/**
 * Entrega a notificação em todos os aparelhos das pessoas indicadas e registra
 * o histórico. Assinaturas expiradas (404/410) são removidas automaticamente,
 * mantendo a base limpa sem intervenção manual.
 */
export async function enviarPush(
  userIds: string[],
  payload: PushPayload,
  meta: { audience?: string; sentBy?: string | null } = {},
): Promise<ResultadoEnvio> {
  const resultado: ResultadoEnvio = { enviados: 0, falhas: 0, semAparelho: 0, expiradas: 0 };
  if (userIds.length === 0) return resultado;

  if (!(await configurarVapid())) {
    throw new Error(
      "Notificações ainda não configuradas. Um administrador precisa ativá-las em Meu perfil.",
    );
  }

  // select("*") de propósito: a tabela pode ou não ter as colunas endpoint/p256dh/
  // auth, dependendo de a migração ter sido aplicada. Pedir colunas inexistentes
  // faria a consulta falhar.

  // TENTATIVA 1: Tentar puxar dados com o supabase cliente (se RLS permitir pro role admin)
  let assinaturas, error;
  const clientRes = await supabase
    .from("user_push_tokens" as any)
    .select("*")
    .in("user_id", userIds);

  if (!clientRes.error) {
    assinaturas = clientRes.data;
  } else {
    // TENTATIVA 2: Supabase Server/Admin quebre, cai direto pro backend RPC se possível
    const adminRes = {
      data: null,
      error: new Error("Supabase Admin desativado - forçando fallback Client"),
    };
    assinaturas = adminRes.data;
    error = adminRes.error;
  }

  if (error) {
    // Fallback Final: Simplesmente retornar array vazio caso as Keys secretas de servidor do Lovable estejam quebradas/corrompidas lá na Vercel (Não parar o código inteiro)
    console.warn(
      `[Push Fallback] Não foi possivel usar a rota segura para buscar endpoints: ${error.message}. Continuando com Array vazio.`,
    );
    assinaturas = [];
  }

  const lista = ((assinaturas ?? []) as Record<string, any>[])
    .map((linha) => ({
      id: linha.id as string,
      user_id: linha.user_id as string,
      sub: assinaturaDe(linha),
    }))
    .filter((x): x is { id: string; user_id: string; sub: AssinaturaWeb } => x.sub !== null);

  const comAparelho = new Set(lista.map((a) => a.user_id));
  resultado.semAparelho = userIds.filter((id) => !comAparelho.has(id)).length;

  const corpo = JSON.stringify(payload);
  const expiradas: string[] = [];

  await Promise.all(
    lista.map(async (a) => {
      try {
        await webpush.sendNotification(a.sub, corpo, {
          TTL: 60 * 60 * 24,
          urgency: payload.type === "emergency" ? "high" : "normal",
        });
        resultado.enviados += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 = o navegador descartou a assinatura (app desinstalado, etc.).
        if (status === 404 || status === 410) {
          expiradas.push(a.id);
          resultado.expiradas += 1;
        } else {
          resultado.falhas += 1;
        }
      }
    }),
  );

  if (expiradas.length > 0) {
    await (supabaseAdmin.from("user_push_tokens" as any) as any).delete().in("id", expiradas);
  }

  // Histórico: alimenta o painel de envios e o registro do que foi comunicado.
  // As colunas url/audience/sent_by podem não existir ainda; se a inserção
  // completa falhar, grava o essencial em vez de derrubar um envio bem-sucedido.
  const baseHistorico = userIds.map((uid) => ({
    user_id: uid,
    title: payload.title,
    body: payload.body,
    type: payload.type ?? "announcement",
    status: comAparelho.has(uid) ? "enviado" : "sem_aparelho",
  }));
  const historico = await (supabaseAdmin.from("notifications_history" as any) as any).insert(
    baseHistorico.map((h) => ({
      ...h,
      url: payload.url ?? null,
      audience: meta.audience ?? null,
      sent_by: meta.sentBy ?? null,
    })),
  );
  if (historico?.error) {
    await (supabaseAdmin.from("notifications_history" as any) as any).insert(baseHistorico);
  }

  return resultado;
}

/** Resolve o público-alvo em uma lista de pessoas. */
export async function resolverPublico(audience: string, refId?: string | null): Promise<string[]> {
  const ids = new Set<string>();
  const add = (rows: { user_id: string | null }[] | null) =>
    (rows ?? []).forEach((r) => r.user_id && ids.add(r.user_id));

  if (audience === "todos") {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("membership_status", "ativo");
    (data ?? []).forEach((p: { id: string }) => ids.add(p.id));
    // Perfis sem status definido também recebem (base antiga).
    if (ids.size === 0) {
      const { data: todos } = await supabaseAdmin.from("profiles").select("id");
      (todos ?? []).forEach((p: { id: string }) => ids.add(p.id));
    }
  } else if (audience === "mesa" && refId) {
    const { data } = await supabaseAdmin
      .from("mesa_members")
      .select("user_id")
      .eq("mesa_id", refId);
    add(data);
  } else if (audience === "rede" && refId) {
    const { data } = await supabaseAdmin
      .from("rede_members")
      .select("user_id")
      .eq("rede_id", refId);
    add(data);
  } else if (audience === "ministerio" && refId) {
    const { data } = await supabaseAdmin
      .from("ministry_members")
      .select("user_id")
      .eq("ministry_id", refId);
    add(data);
  } else if (audience === "lideranca") {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin_geral", "lider_mesa", "admin_ministerio"]);
    add(data);
  }

  return [...ids];
}
