export function limparTexto(valor?: string | null): string | null {
  if (valor == null) return null;
  const texto = valor.trim();
  return texto.length ? texto : null;
}
