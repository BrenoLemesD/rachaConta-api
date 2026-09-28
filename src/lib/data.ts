const FUSO_BRASILIA_HORAS = 3;

export function dataIsoValida(valor: string): boolean {
  const partes = valor.split("-").map(Number);
  if (partes.length !== 3 || partes.some((parte) => Number.isNaN(parte))) return false;

  const [ano, mes, dia] = partes;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

export function fimDoDiaUtc(isoDate: string): Date {
  const [ano, mes, dia] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, 23 + FUSO_BRASILIA_HORAS, 59, 59, 999));
}

export function inicioDoDiaUtc(isoDate: string): Date {
  const [ano, mes, dia] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, FUSO_BRASILIA_HORAS, 0, 0, 0));
}

export function adicionarDiasUtc(dias: number, base = new Date()): Date {
  const relogioBrasilia = new Date(base.getTime() - FUSO_BRASILIA_HORAS * 60 * 60 * 1000);

  return new Date(
    Date.UTC(
      relogioBrasilia.getUTCFullYear(),
      relogioBrasilia.getUTCMonth(),
      relogioBrasilia.getUTCDate() + dias,
      23 + FUSO_BRASILIA_HORAS,
      59,
      59,
      999,
    ),
  );
}
