import { AppError } from "../lib/app-error";

export type SaldoUsuario = {
  usuarioId: string;
  saldoCentavos: number;
};

export type Transferencia = {
  devedorId: string;
  credorId: string;
  valorCentavos: number;
};

export function simplificarDividas(saldos: SaldoUsuario[]): Transferencia[] {
  const credores = saldos
    .filter((saldo) => saldo.saldoCentavos > 0)
    .map((saldo) => ({ ...saldo }))
    .sort((a, b) => b.saldoCentavos - a.saldoCentavos || a.usuarioId.localeCompare(b.usuarioId));

  const devedores = saldos
    .filter((saldo) => saldo.saldoCentavos < 0)
    .map((saldo) => ({ usuarioId: saldo.usuarioId, saldoCentavos: -saldo.saldoCentavos }))
    .sort((a, b) => b.saldoCentavos - a.saldoCentavos || a.usuarioId.localeCompare(b.usuarioId));

  const transferencias: Transferencia[] = [];
  let indiceDevedor = 0;
  let indiceCredor = 0;

  while (indiceDevedor < devedores.length && indiceCredor < credores.length) {
    const valor = Math.min(devedores[indiceDevedor].saldoCentavos, credores[indiceCredor].saldoCentavos);

    if (valor > 0) {
      transferencias.push({
        devedorId: devedores[indiceDevedor].usuarioId,
        credorId: credores[indiceCredor].usuarioId,
        valorCentavos: valor,
      });
    }

    devedores[indiceDevedor].saldoCentavos -= valor;
    credores[indiceCredor].saldoCentavos -= valor;

    if (devedores[indiceDevedor].saldoCentavos === 0) indiceDevedor += 1;
    if (credores[indiceCredor].saldoCentavos === 0) indiceCredor += 1;
  }

  const restoDevedor = devedores.slice(indiceDevedor).reduce((acumulado, saldo) => acumulado + saldo.saldoCentavos, 0);
  const restoCredor = credores.slice(indiceCredor).reduce((acumulado, saldo) => acumulado + saldo.saldoCentavos, 0);

  if (restoDevedor !== 0 || restoCredor !== 0) {
    throw new AppError(500, "Não foi possível simplificar as dívidas sem perda de centavos");
  }

  return transferencias;
}
