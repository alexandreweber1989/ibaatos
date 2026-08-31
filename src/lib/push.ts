/* ---------------------------------------------------------------------------
 * Notificações no celular (Web Push) — lado do navegador.
 * Gratuito e sem serviço de terceiros: usa o próprio push do navegador
 * (Google/Mozilla/Apple) autenticado por chaves VAPID da igreja.
 * ------------------------------------------------------------------------- */
import { supabase } from "@/integrations/supabase/client";

export type PushStatus =
  | "indisponivel" // navegador não suporta (ou iOS fora da tela de início)
  | "bloqueado" // a pessoa negou a permissão no navegador
  | "desativado" // suportado, mas ainda não assinou
  | "ativo"; // recebendo notificações neste aparelho

/** O navegador suporta push? (iOS só suporta com o app na tela de início) */
export function pushSuportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** iOS exige que o app tenha sido adicionado à tela de início. */
export function precisaInstalarNoIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const instalado =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return ios && !instalado;
}

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSuportado()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function statusPush(): Promise<PushStatus> {
  if (!pushSuportado()) return "indisponivel";
  if (Notification.permission === "denied") return "bloqueado";
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return sub ? "ativo" : "desativado";
  } catch {
    return "desativado";
  }
}

/** A chave pública VAPID vem do servidor — assim trocar a chave não exige novo build. */
async function chavePublica(): Promise<string> {
  const res = await fetch("/api/push/vapid-key");
  const data = await res.json();
  if (!res.ok || !data.publicKey) {
    throw new Error(data.error || "As notificações ainda não foram configuradas pela igreja.");
  }
  return data.publicKey as string;
}

/** Converte a chave base64url do VAPID para o formato que o navegador exige. */
function base64UrlParaUint8(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const saida = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) saida[i] = raw.charCodeAt(i);
  return saida;
}

/**
 * Pede permissão, assina o push neste aparelho e guarda a assinatura.
 * Retorna o novo status para a interface reagir.
 */
export async function ativarPush(userId: string): Promise<PushStatus> {
  if (!pushSuportado()) return "indisponivel";

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return permissao === "denied" ? "bloqueado" : "desativado";

  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await registrarServiceWorker());
  if (!reg) return "indisponivel";
  await navigator.serviceWorker.ready;

  const existente = await reg.pushManager.getSubscription();
  const sub =
    existente ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlParaUint8(await chavePublica()) as BufferSource,
    }));

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("O navegador não forneceu as chaves de criptografia da assinatura.");
  }

  // A assinatura inteira é guardada na coluna `token`, que existe desde a criação
  // da tabela. Assim o recurso não depende de colunas novas (endpoint/p256dh/auth)
  // que só existiriam após uma migração ainda não aplicada no banco.
  const assinatura = JSON.stringify({
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });

  const { error } = await (supabase.from("user_push_tokens" as any) as any).upsert(
    {
      user_id: userId,
      token: assinatura,
      device_type: "web",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" },
  );
  // Detalhe do erro incluído de propósito: sem ele, diagnosticar falha de
  // gravação vira adivinhação.
  if (error)
    throw new Error(`Não foi possível salvar a assinatura deste aparelho: ${error.message}`);

  return "ativo";
}

/** Cancela as notificações neste aparelho (não afeta os outros da pessoa). */
export async function desativarPush(): Promise<PushStatus> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    // A assinatura pode estar guardada como JSON no `token` (formato atual) ou
    // na coluna `endpoint` (quando a migração tiver sido aplicada).
    const { data } = await (supabase.from("user_push_tokens" as any) as any).select("id, token");
    const alvos = ((data ?? []) as { id: string; token: string }[]).filter((linha) => {
      if (linha.token === endpoint) return true;
      try {
        return JSON.parse(linha.token)?.endpoint === endpoint;
      } catch {
        return false;
      }
    });
    if (alvos.length > 0) {
      await (supabase.from("user_push_tokens" as any) as any).delete().in(
        "id",
        alvos.map((a) => a.id),
      );
    }
  }
  return "desativado";
}
