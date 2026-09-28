import { Prisma } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { fimDoDiaUtc, inicioDoDiaUtc } from "../lib/data";
import { bpsParaPercentual } from "../lib/dinheiro";
import { prisma } from "../lib/prisma";
import { usuarioResumoSelect } from "../lib/usuario-publico";
import { HistoricoQuery } from "../types/consulta.schema";
import { obterMembro } from "./grupo-acesso.service";

const includeHistorico = {
  grupo: { select: { id: true, nome: true, moeda: true } },
  categoria: { select: { id: true, nome: true, icone: true, cor: true } },
  pagadores: { include: { usuario: { select: usuarioResumoSelect } } },
  participantes: { include: { usuario: { select: usuarioResumoSelect } } },
} as const;

export const historicoService = {
  async listar(usuarioId: string, query: HistoricoQuery) {
    if (query.dataInicio && query.dataFim && query.dataInicio > query.dataFim) {
      throw new AppError(400, "A data inicial não pode ser maior que a data final");
    }

    if (
      query.valorMinCentavos != null &&
      query.valorMaxCentavos != null &&
      query.valorMinCentavos > query.valorMaxCentavos
    ) {
      throw new AppError(400, "O valor mínimo não pode ser maior que o valor máximo");
    }

    if (query.grupoId) {
      await obterMembro(query.grupoId, usuarioId);
    }

    const where: Prisma.DespesaWhereInput = {
      excluidoEm: null,
      grupo: { membros: { some: { usuarioId } } },
    };

    if (query.grupoId) where.grupoId = query.grupoId;
    if (query.categoriaId) where.categoriaId = query.categoriaId;

    if (query.valorMinCentavos != null || query.valorMaxCentavos != null) {
      where.valorTotalCentavos = {
        ...(query.valorMinCentavos != null ? { gte: query.valorMinCentavos } : {}),
        ...(query.valorMaxCentavos != null ? { lte: query.valorMaxCentavos } : {}),
      };
    }

    if (query.dataInicio || query.dataFim) {
      where.criadoEm = {
        ...(query.dataInicio ? { gte: inicioDoDiaUtc(query.dataInicio) } : {}),
        ...(query.dataFim ? { lte: fimDoDiaUtc(query.dataFim) } : {}),
      };
    }

    const despesas = await prisma.despesa.findMany({
      where,
      include: includeHistorico,
      orderBy: { criadoEm: "desc" },
    });

    let totalPagoCentavos = 0;

    const itens = despesas.map((despesa) => {
      const valorPagoCentavos = despesa.pagadores
        .filter((pagador) => pagador.usuarioId === usuarioId)
        .reduce((acumulado, pagador) => acumulado + pagador.valorCentavos, 0);
      const valorDevidoCentavos = despesa.participantes
        .filter((participante) => participante.usuarioId === usuarioId)
        .reduce((acumulado, participante) => acumulado + participante.valorCentavos, 0);

      totalPagoCentavos += valorPagoCentavos;

      return {
        id: despesa.id,
        descricao: despesa.descricao,
        grupo: despesa.grupo,
        categoria: despesa.categoria,
        valorTotalCentavos: despesa.valorTotalCentavos,
        modoDivisao: despesa.modoDivisao,
        percentualServico: bpsParaPercentual(despesa.percentualServicoBps),
        taxaExtraCentavos: despesa.taxaExtraCentavos,
        prazoPagamento: despesa.prazoPagamento,
        criadoEm: despesa.criadoEm,
        valorPagoCentavos,
        valorDevidoCentavos,
        pagadores: despesa.pagadores.map((pagador) => ({
          usuario: pagador.usuario,
          valorCentavos: pagador.valorCentavos,
        })),
        participantes: despesa.participantes.map((participante) => ({
          usuario: participante.usuario,
          percentual: participante.percentualBps == null ? null : bpsParaPercentual(participante.percentualBps),
          valorCentavos: participante.valorCentavos,
        })),
      };
    });

    const recebido = await prisma.divida.aggregate({
      _sum: { valorCentavos: true },
      where: {
        credorId: usuarioId,
        status: "QUITADA",
        grupo: { membros: { some: { usuarioId } } },
        ...(query.grupoId ? { grupoId: query.grupoId } : {}),
      },
    });

    return {
      despesas: itens,
      quantidade: itens.length,
      totais: {
        totalPagoCentavos,
        totalRecebidoCentavos: recebido._sum.valorCentavos ?? 0,
      },
    };
  },
};
