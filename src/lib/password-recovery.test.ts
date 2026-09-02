import { describe, expect, it } from "vitest";
import { requestPasswordRecovery } from "./password-recovery";

describe("requestPasswordRecovery", () => {
  it("converte uma rejeição inesperada em uma mensagem compreensível", async () => {
    const result = await requestPasswordRecovery(async () => {
      throw {};
    });

    expect(result).toEqual({
      ok: false,
      message: "Não foi possível enviar o link de redefinição. Tente novamente em alguns minutos.",
    });
  });

  it("traduz o limite de envio mesmo quando a requisição é rejeitada", async () => {
    const result = await requestPasswordRecovery(async () => {
      throw new Error("Email rate limit exceeded");
    });

    expect(result).toEqual({
      ok: false,
      message:
        "Limite de envios atingido. Tente novamente em alguns minutos ou verifique sua caixa de spam.",
    });
  });
});
