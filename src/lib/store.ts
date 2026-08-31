export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function field(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

function sanitize(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max);
}

export interface PixInput {
  key: string;
  name: string;
  city: string;
  amountCents: number;
  txid: string;
}

/**
 * Normaliza a chave PIX conforme o tipo:
 * - CPF/CNPJ e telefone: apenas dígitos (telefone recebe +55).
 * - E-mail e chave aleatória: texto original, sem espaços.
 * Bancos rejeitam BR Codes com CNPJ pontuado, por isso a limpeza é obrigatória.
 */
function normalizePixKey(raw: string): string {
  const key = raw.trim();
  if (key.includes("@")) return key.toLowerCase();

  const digits = key.replace(/\D/g, "");
  // Chave aleatória (EVP) tem 32 hex + hífens.
  if (/^[0-9a-fA-F-]{36}$/.test(key)) return key.toLowerCase();
  if (digits.length === 11 || digits.length === 14) return digits; // CPF ou CNPJ
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length === 12 || digits.length === 13) return `+${digits}`; // telefone com DDI
  return key;
}

/** Gera o payload "copia e cola" do PIX (BR Code EMV). */
export function pixPayload({ key, name, city, amountCents, txid }: PixInput): string {
  const merchant = field("00", "br.gov.bcb.pix") + field("01", normalizePixKey(key));
  const cleanTxid = sanitize(txid, 25).replace(/ /g, "") || "***";
  const base =
    field("00", "01") +
    // 11 = QR estático reutilizável; 12 seria de uso único.
    field("01", "11") +
    field("26", merchant) +
    field("52", "0000") +
    field("53", "986") +
    // O campo de valor deve ser omitido quando o pagador define o montante.
    (amountCents > 0 ? field("54", (amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", sanitize(name, 25) || "RECEBEDOR") +
    field("60", sanitize(city, 15) || "BRASIL") +
    field("62", field("05", cleanTxid));
  const partial = base + "6304";
  return partial + crc16(partial);
}

export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    className: "bg-muted text-muted-foreground",
  },
  pago: { label: "Pronto para retirada", className: "bg-primary text-primary-foreground" },
  entregue: { label: "Entregue", className: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};

export const RESERVATION_STATUS: Record<string, { label: string; className: string }> = {
  reservado: { label: "Reservado", className: "bg-primary text-primary-foreground" },
  retirado: { label: "Retirado", className: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};
