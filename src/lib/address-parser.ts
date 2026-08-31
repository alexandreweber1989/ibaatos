/**
 * Utilitário para parsing de endereços brasileiros
 * Lida com casos como "Rua Itália 75A", "Ponta Grossa-PR", etc.
 */

export interface ParsedAddress {
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export function parseBrazilianAddress(input: string): ParsedAddress {
  if (!input) return { street: "" };

  // Remove caracteres especiais e normaliza espaços
  const normalized = input.trim().replace(/\s+/g, " ");

  // Tentar encontrar o número (geralmente segue a rua e precede cidade/bairro)
  // Casos: "Rua X, 123", "Rua X 123A", "Rua X 123 - Bairro"
  // Regex para número: opcional vírgula, espaço, seguido de dígitos e opcionalmente uma letra
  const numberRegex = /(?:,?\s+)(\d+[a-zA-Z]?)(?:\s+|,|-|$)/;
  const numberMatch = normalized.match(numberRegex);

  let street = normalized;
  let number = "";
  let rest = "";

  if (numberMatch) {
    number = numberMatch[1];
    const splitIndex = numberMatch.index || 0;
    street = normalized.substring(0, splitIndex).trim().replace(/,$/, "");
    rest = normalized.substring(splitIndex + numberMatch[0].length).trim();
  }

  // Tentar extrair UF (ex: "PR", "SP", "-PR")
  const stateRegex = /(?:-|\s|,)([A-Z]{2})(?:\s+|$)/;
  const stateMatch = rest.match(stateRegex) || street.match(stateRegex);
  let state = "";
  if (stateMatch) {
    state = stateMatch[1];
    // Se o state estava no "rest", removemos dele. Se estava no "street", removemos dele.
    if (rest.includes(stateMatch[0])) {
      rest = rest.replace(stateMatch[0], "").trim();
    } else {
      street = street.replace(stateMatch[0], "").trim();
    }
  }

  // CEP (ex: "84000-000", "84000000")
  const zipRegex = /(\d{5}-?\d{3})/;
  const zipMatch = normalized.match(zipRegex);
  let zipCode = "";
  if (zipMatch) {
    zipCode = zipMatch[1];
    street = street.replace(zipRegex, "").trim();
    rest = rest.replace(zipRegex, "").trim();
  }

  // O que sobrar no "rest" geralmente é Bairro/Cidade
  const segments = rest.split(/[,\s-]+/).filter((s) => s.length > 0);
  let neighborhood = "";
  let city = "";

  if (segments.length > 0) {
    neighborhood = segments[0];
    if (segments.length > 1) {
      city = segments.slice(1).join(" ");
    }
  }

  return {
    street: street.replace(/,$/, ""),
    number,
    neighborhood,
    city,
    state,
    zipCode,
  };
}

export function formatAddress(parsed: ParsedAddress): string {
  const parts = [
    parsed.street,
    parsed.number ? `, ${parsed.number}` : "",
    parsed.neighborhood ? ` - ${parsed.neighborhood}` : "",
    parsed.city ? `, ${parsed.city}` : "",
    parsed.state ? `-${parsed.state}` : "",
  ];
  return parts.filter(Boolean).join("").replace(/\s+,/, ",");
}
