import { describe, expect, it } from "vitest";
import { simplificarDividas } from "../src/services/simplificacao.service";

describe("simplificação de dívidas", () => {
  it("quita dois devedores com um credor", () => {
    const transferencias = simplificarDividas([
      { usuarioId: "ana", saldoCentavos: 500 },
      { usuarioId: "bruno", saldoCentavos: -200 },
      { usuarioId: "caio", saldoCentavos: -300 },
    ]);

    expect(transferencias).toEqual([
      { devedorId: "caio", credorId: "ana", valorCentavos: 300 },
      { devedorId: "bruno", credorId: "ana", valorCentavos: 200 },
    ]);
  });

  it("conserva cada centavo do saldo positivo", () => {
    const saldos = [
      { usuarioId: "ana", saldoCentavos: 450 },
      { usuarioId: "bruno", saldoCentavos: -125 },
      { usuarioId: "caio", saldoCentavos: -325 },
      { usuarioId: "duda", saldoCentavos: 0 },
    ];
    const transferencias = simplificarDividas(saldos);
    const pago = new Map<string, number>();
    const recebido = new Map<string, number>();

    for (const transferencia of transferencias) {
      pago.set(transferencia.devedorId, (pago.get(transferencia.devedorId) ?? 0) + transferencia.valorCentavos);
      recebido.set(transferencia.credorId, (recebido.get(transferencia.credorId) ?? 0) + transferencia.valorCentavos);
    }

    for (const saldo of saldos) {
      const aberto = saldo.saldoCentavos + (pago.get(saldo.usuarioId) ?? 0) - (recebido.get(saldo.usuarioId) ?? 0);
      expect(aberto).toBe(0);
    }
  });

  it("não gera transferência quando todo mundo está zerado", () => {
    expect(
      simplificarDividas([
        { usuarioId: "ana", saldoCentavos: 0 },
        { usuarioId: "bruno", saldoCentavos: 0 },
      ]),
    ).toEqual([]);
  });
});
