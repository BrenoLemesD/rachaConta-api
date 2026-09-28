import { describe, expect, it } from "vitest";
import { AppError } from "../src/lib/app-error";
import { calcularDespesa, dividirIgual, dividirPercentual } from "../src/services/divisao.service";

describe("divisão em centavos", () => {
  it("distribui o resto da divisão igual nos primeiros participantes", () => {
    expect(dividirIgual(100, 3)).toEqual([34, 33, 33]);
    expect(dividirIgual(100, 3).reduce((soma, valor) => soma + valor, 0)).toBe(100);
  });

  it("distribui o resto do percentual para quem tem a maior fração", () => {
    expect(dividirPercentual(101, [5000, 5000])).toEqual([51, 50]);
  });

  it("rejeita percentual que não soma 100%", () => {
    expect(() => dividirPercentual(1000, [3333, 3333, 3333])).toThrow(AppError);
  });

  it("aplica serviço e taxa extra sem usar float e divide o total", () => {
    const resultado = calcularDespesa({
      valorCentavos: 2000,
      percentualServico: 10,
      taxaExtraCentavos: 50,
      modoDivisao: "IGUAL",
      pagadores: [{ usuarioId: "a" }],
      participantes: [{ usuarioId: "a" }, { usuarioId: "b" }, { usuarioId: "c" }],
    });

    expect(resultado.valorServicoCentavos).toBe(200);
    expect(resultado.valorTotalCentavos).toBe(2250);
    expect(resultado.participantes.map((participante) => participante.valorCentavos)).toEqual([750, 750, 750]);
    expect(resultado.pagadores[0].valorCentavos).toBe(2250);
  });

  it("aceita divisão por valor quando a soma fecha o total com taxa", () => {
    const resultado = calcularDespesa({
      valorCentavos: 1000,
      percentualServico: 10,
      modoDivisao: "VALOR",
      pagadores: [
        { usuarioId: "a", valorCentavos: 700 },
        { usuarioId: "b", valorCentavos: 400 },
      ],
      participantes: [
        { usuarioId: "a", valorCentavos: 600 },
        { usuarioId: "b", valorCentavos: 500 },
      ],
    });

    expect(resultado.valorTotalCentavos).toBe(1100);
    expect(resultado.participantes.reduce((soma, participante) => soma + participante.valorCentavos, 0)).toBe(1100);
  });

  it("rejeita soma de pagadores diferente do total", () => {
    expect(() =>
      calcularDespesa({
        valorCentavos: 1000,
        modoDivisao: "IGUAL",
        pagadores: [
          { usuarioId: "a", valorCentavos: 400 },
          { usuarioId: "b", valorCentavos: 400 },
        ],
        participantes: [{ usuarioId: "a" }, { usuarioId: "b" }],
      }),
    ).toThrow(/soma dos pagadores/i);
  });

  it("usa a soma dos itens como base e valida o rateio do item", () => {
    const resultado = calcularDespesa({
      modoDivisao: "PERCENTUAL",
      percentualServico: 0,
      pagadores: [{ usuarioId: "a" }],
      participantes: [
        { usuarioId: "a", percentual: 50 },
        { usuarioId: "b", percentual: 50 },
      ],
      itens: [
        {
          descricao: "Pizza",
          valorCentavos: 1000,
          participantes: [
            { usuarioId: "a", valorCentavos: 400 },
            { usuarioId: "b", valorCentavos: 600 },
          ],
        },
      ],
    });

    expect(resultado.valorBaseCentavos).toBe(1000);
    expect(resultado.participantes.map((participante) => participante.valorCentavos)).toEqual([500, 500]);
  });
});
