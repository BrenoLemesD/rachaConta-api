import { AppError } from "../lib/app-error";
import { ateDuasCasasDecimais, percentualParaBps } from "../lib/dinheiro";

export type ModoDivisao = "IGUAL" | "PERCENTUAL" | "VALOR";

export type EntradaPagador = {
  usuarioId: string;
  valorCentavos?: number;
};

export type EntradaParticipante = {
  usuarioId: string;
  percentual?: number;
  valorCentavos?: number;
};

export type EntradaItem = {
  descricao: string;
  valorCentavos: number;
  participantes?: { usuarioId: string; valorCentavos: number }[];
};

export type EntradaCalculo = {
  valorCentavos?: number;
  percentualServico?: number;
  taxaExtraCentavos?: number;
  modoDivisao: ModoDivisao;
  pagadores: EntradaPagador[];
  participantes: EntradaParticipante[];
  itens?: EntradaItem[];
};

export type DespesaCalculada = {
  valorBaseCentavos: number;
  percentualServicoBps: number;
  valorServicoCentavos: number;
  taxaExtraCentavos: number;
  valorTotalCentavos: number;
  modoDivisao: ModoDivisao;
  pagadores: { usuarioId: string; valorCentavos: number }[];
  participantes: { usuarioId: string; percentualBps: number | null; valorCentavos: number }[];
  itens: EntradaItem[];
};

function assertUnicos(ids: string[], mensagem: string) {
  if (new Set(ids).size !== ids.length) {
    throw new AppError(400, mensagem);
  }
}

export function calcularTotal(valorBaseCentavos: number, percentualServicoBps: number, taxaExtraCentavos: number) {
  const valorServicoCentavos = Math.round((valorBaseCentavos * percentualServicoBps) / 10000);
  return {
    valorServicoCentavos,
    valorTotalCentavos: valorBaseCentavos + valorServicoCentavos + taxaExtraCentavos,
  };
}

export function dividirIgual(total: number, quantidade: number): number[] {
  if (quantidade <= 0) {
    throw new AppError(400, "Informe ao menos um participante");
  }

  const base = Math.floor(total / quantidade);
  const resto = total - base * quantidade;
  return Array.from({ length: quantidade }, (_, indice) => base + (indice < resto ? 1 : 0));
}

export function dividirPercentual(total: number, bps: number[]): number[] {
  const soma = bps.reduce((acumulado, valor) => acumulado + valor, 0);

  if (soma !== 10000) {
    throw new AppError(400, "A soma dos percentuais deve ser exatamente 100%");
  }

  const partes = bps.map((pontos, indice) => {
    const numerador = total * pontos;
    return {
      indice,
      valor: Math.floor(numerador / 10000),
      fracao: numerador % 10000,
    };
  });

  const resto = total - partes.reduce((acumulado, parte) => acumulado + parte.valor, 0);
  const ordem = [...partes].sort((a, b) => b.fracao - a.fracao || a.indice - b.indice);

  for (let indice = 0; indice < resto; indice += 1) {
    ordem[indice].valor += 1;
  }

  return partes
    .sort((a, b) => a.indice - b.indice)
    .map((parte) => parte.valor);
}

export function calcularDespesa(entrada: EntradaCalculo): DespesaCalculada {
  const itens = (entrada.itens ?? []).map((item) => ({
    descricao: item.descricao.trim(),
    valorCentavos: item.valorCentavos,
    participantes: item.participantes?.map((participante) => ({ ...participante })),
  }));

  let valorBaseCentavos: number;

  if (itens.length > 0) {
    valorBaseCentavos = itens.reduce((acumulado, item) => acumulado + item.valorCentavos, 0);

    if (entrada.valorCentavos != null && entrada.valorCentavos !== valorBaseCentavos) {
      throw new AppError(400, "O valor da despesa deve ser igual à soma dos itens");
    }
  } else if (entrada.valorCentavos == null) {
    throw new AppError(400, "Informe o valor da despesa");
  } else {
    valorBaseCentavos = entrada.valorCentavos;
  }

  const percentualServico = entrada.percentualServico ?? 0;

  if (!ateDuasCasasDecimais(percentualServico) || percentualServico < 0 || percentualServico > 100) {
    throw new AppError(400, "Percentual de serviço inválido");
  }

  const taxaExtraCentavos = entrada.taxaExtraCentavos ?? 0;

  if (!Number.isInteger(taxaExtraCentavos) || taxaExtraCentavos < 0) {
    throw new AppError(400, "Taxa extra inválida");
  }

  const percentualServicoBps = percentualParaBps(percentualServico);
  const { valorServicoCentavos, valorTotalCentavos } = calcularTotal(
    valorBaseCentavos,
    percentualServicoBps,
    taxaExtraCentavos,
  );

  if (valorTotalCentavos <= 0) {
    throw new AppError(400, "O valor total da despesa precisa ser maior que zero");
  }

  assertUnicos(
    entrada.pagadores.map((pagador) => pagador.usuarioId),
    "Há pagadores repetidos",
  );
  assertUnicos(
    entrada.participantes.map((participante) => participante.usuarioId),
    "Há participantes repetidos",
  );

  const participantesIds = new Set(entrada.participantes.map((participante) => participante.usuarioId));

  for (const item of itens) {
    if (!item.participantes?.length) continue;

    assertUnicos(
      item.participantes.map((participante) => participante.usuarioId),
      `Há participantes repetidos no item "${item.descricao}"`,
    );

    const soma = item.participantes.reduce((acumulado, participante) => acumulado + participante.valorCentavos, 0);

    if (soma !== item.valorCentavos) {
      throw new AppError(400, `A soma dos participantes do item "${item.descricao}" deve ser igual ao valor do item`);
    }

    for (const participante of item.participantes) {
      if (!participantesIds.has(participante.usuarioId)) {
        throw new AppError(400, "Quem divide um item também precisa participar da despesa");
      }
    }
  }

  let participantes: DespesaCalculada["participantes"];

  if (entrada.modoDivisao === "IGUAL") {
    const valores = dividirIgual(valorTotalCentavos, entrada.participantes.length);
    participantes = entrada.participantes.map((participante, indice) => ({
      usuarioId: participante.usuarioId,
      percentualBps: null,
      valorCentavos: valores[indice],
    }));
  } else if (entrada.modoDivisao === "PERCENTUAL") {
    const bps = entrada.participantes.map((participante) => {
      if (participante.percentual == null || !ateDuasCasasDecimais(participante.percentual)) {
        throw new AppError(400, "Informe o percentual de cada participante");
      }

      return percentualParaBps(participante.percentual);
    });
    const valores = dividirPercentual(valorTotalCentavos, bps);
    participantes = entrada.participantes.map((participante, indice) => ({
      usuarioId: participante.usuarioId,
      percentualBps: bps[indice],
      valorCentavos: valores[indice],
    }));
  } else {
    if (entrada.participantes.some((participante) => participante.valorCentavos == null)) {
      throw new AppError(400, "Informe o valor de cada participante");
    }

    const valores = entrada.participantes.map((participante) => participante.valorCentavos ?? 0);
    const soma = valores.reduce((acumulado, valor) => acumulado + valor, 0);

    if (soma !== valorTotalCentavos) {
      throw new AppError(400, "A soma dos valores dos participantes deve ser igual ao total da despesa");
    }

    participantes = entrada.participantes.map((participante) => ({
      usuarioId: participante.usuarioId,
      percentualBps: null,
      valorCentavos: participante.valorCentavos ?? 0,
    }));
  }

  let pagadores: DespesaCalculada["pagadores"];

  if (entrada.pagadores.length === 1 && entrada.pagadores[0].valorCentavos == null) {
    pagadores = [{ usuarioId: entrada.pagadores[0].usuarioId, valorCentavos: valorTotalCentavos }];
  } else {
    if (entrada.pagadores.some((pagador) => pagador.valorCentavos == null)) {
      throw new AppError(400, "Informe o valor pago por cada pagador");
    }

    const soma = entrada.pagadores.reduce((acumulado, pagador) => acumulado + (pagador.valorCentavos ?? 0), 0);

    if (soma !== valorTotalCentavos) {
      throw new AppError(400, "A soma dos pagadores deve ser igual ao valor total da despesa");
    }

    pagadores = entrada.pagadores.map((pagador) => ({
      usuarioId: pagador.usuarioId,
      valorCentavos: pagador.valorCentavos ?? 0,
    }));
  }

  return {
    valorBaseCentavos,
    percentualServicoBps,
    valorServicoCentavos,
    taxaExtraCentavos,
    valorTotalCentavos,
    modoDivisao: entrada.modoDivisao,
    pagadores,
    participantes,
    itens,
  };
}
