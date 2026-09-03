type PasswordRecoveryResponse = {
  error: { message?: unknown } | null;
};

type PasswordRecoveryRequest = () => Promise<PasswordRecoveryResponse>;

type PasswordRecoveryResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

const FALLBACK_MESSAGE =
  "Não foi possível enviar o link de redefinição. Tente novamente em alguns minutos.";

function failedRecovery(message: unknown): PasswordRecoveryResult {
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const safeMessage = normalizedMessage && normalizedMessage !== "{}"
    ? normalizedMessage
    : FALLBACK_MESSAGE;

  if (safeMessage.includes("Email rate limit exceeded")) {
    return {
      ok: false,
      message:
        "Limite de envios atingido. Tente novamente em alguns minutos ou verifique sua caixa de spam.",
    };
  }

  return { ok: false, message: safeMessage };
}

export async function requestPasswordRecovery(
  sendRecoveryEmail: PasswordRecoveryRequest,
): Promise<PasswordRecoveryResult> {
  try {
    const { error } = await sendRecoveryEmail();

    if (!error) return { ok: true };

    return failedRecovery(error.message);
  } catch (error) {
    return failedRecovery(error instanceof Error ? error.message : undefined);
  }
}
