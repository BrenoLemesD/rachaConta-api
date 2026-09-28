export function ateDuasCasasDecimais(valor: number): boolean {
  return Number.isFinite(valor) && Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6;
}

export function percentualParaBps(percentual: number): number {
  return Math.round(percentual * 100);
}

export function bpsParaPercentual(bps: number): number {
  return bps / 100;
}

export function formatarMoeda(centavos: number, moeda = "BRL"): string {
  try {
    return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: moeda });
  } catch {
    return `${(centavos / 100).toFixed(2)} ${moeda}`;
  }
}
