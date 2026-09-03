export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (password !== confirmation) return "As senhas não coincidem.";
  return null;
}
