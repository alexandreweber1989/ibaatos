import { describe, expect, it } from "vitest";
import { validateNewPassword } from "./password-reset";

describe("validateNewPassword", () => {
  it("rejeita senhas que não coincidem", () => {
    expect(validateNewPassword("senha-segura", "outra-senha")).toBe(
      "As senhas não coincidem.",
    );
  });
});
