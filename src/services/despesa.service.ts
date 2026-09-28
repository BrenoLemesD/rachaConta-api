import { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { adicionarDiasUtc, fimDoDiaUtc } from "../lib/data";
import { bpsParaPercentual } from "../lib/dinheiro";
import { prisma } from "../lib/prisma";
import { usuarioResumoSelect } from "../lib/usuario-publico";
import { AtualizarDespesaInput, DespesaInput, ItemDespesaInput } from "../types/despesa.schema";
import { obterMembro } from "./grupo-acesso.service";
import { calcularDespesa, DespesaCalculada, EntradaCalculo } from "./divisao.service";
import { recalcularGrupo } from "./saldo.service";

const includeLista = {
  categoria: { select: { id: true, nome: true, icone: true, cor: true } },
  criadoPor: { select: { id: true, nome: true } },
  atualizadoPor: { select: { id: true, nome: true } },
  pagadores: { include: { usuario: { select: usuarioResumoSelect } } },
  participantes: { include: { usuario: { select: usuarioResumoSelect } } },
  itens: { include: { participantes: { include: { usuario: { select: usuarioResumoSelect } } } } },
} as const;

const includeCompleto = {
  ...includeLista,
  auditorias: {
    orderBy: { criadoEm: "desc" as const },
    take: 20,
    include: { usuario: { select: { id: true, nome: true } } },
  },
} as const;

type DespesaCompleta = Prisma.DespesaGetPayload<{ include: typeof includeCompleto }>;
type DespesaLista = Prisma.DespesaGetPayload<{ include: typeof includeLista }>;
type Banco = Prisma.TransactionClient | PrismaClient;

function apresentar(despesa: DespesaCompleta | Prisma.DespesaGetPayload<{ include: typeof includeLista }>) {
  const comAuditoria = "auditorias" in despesa ? despesa.auditorias : undefined;

  return {
    id: despesa.id,
    grupoId: despesa.grupoId,
    descricao: despesa.descricao,
    categoria: despesa.categoria,
    valorBaseCentavos: despesa.valorBaseCentavos,
    percentualServico: bpsParaPercentual(despesa.percentualServicoBps),
    valorServicoCentavos: despesa.valorTotalCentavos - despesa.valorBaseCentavos - despesa.taxaExtraCentavos,
    taxaExtraCentavos: despesa.taxaExtraCentavos,
    valorTotalCentavos: despesa.valorTotalCentavos,
    modoDivisao: despesa.modoDivisao,
    prazoPagamento: despesa.prazoPagamento,
    criadoPor: despesa.criadoPor,
    atualizadoPor: despesa.atualizadoPor,
    criadoEm: despesa.criadoEm,
    atualizadoEm: despesa.atualizadoEm,
    pagadores: despesa.pagadores.map((pagador) => ({
      usuario: pagador.usuario,
      valorCentavos: pagador.valorCentavos,
    })),
    participantes: despesa.participantes.map((participante) => ({
      usuario: participante.usuario,
      percentual: participante.percentualBps == null ? null : bpsParaPercentual(participante.percentualBps),
      valorCentavos: participante.valorCentavos,
    })),
    itens: despesa.itens.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      valorCentavos: item.valorCentavos,
      participantes: item.participantes.map((participante) => ({
        usuario: participante.usuario,
        valorCentavos: participante.valorCentavos,
      })),
    })),
    ...(comAuditoria
      ? {
          auditorias: comAuditoria.map((auditoria) => ({
            id: auditoria.id,
            acao: auditoria.acao,
            detalhes: auditoria.detalhes,
            criadoEm: auditoria.criadoEm,
            usuario: auditoria.usuario,
          })),
        }
      : {}),
  };
}

function itensDaDespesa(despesa: { itens: DespesaCompleta["itens"] }): ItemDespesaInput[] {
  return despesa.itens.map((item) => ({
    descricao: item.descricao,
    valorCentavos: item.valorCentavos,
    participantes: item.participantes.length
      ? item.participantes.map((participante) => ({
          usuarioId: participante.usuarioId,
          valorCentavos: participante.valorCentavos,
        }))
      : undefined,
  }));
}

function paraEntrada(despesa: DespesaLista, patch?: AtualizarDespesaInput): EntradaCalculo {
  const modo = patch?.modoDivisao ?? despesa.modoDivisao;
  let valorCentavos: number | undefined;

  if (patch?.valorCentavos !== undefined) {
    valorCentavos = patch.valorCentavos;
  } else if (patch?.itens !== undefined) {
    valorCentavos = undefined;
  } else if (despesa.itens.length > 0) {
    valorCentavos = undefined;
  } else {
    valorCentavos = despesa.valorBaseCentavos;
  }

  return {
    valorCentavos,
    percentualServico: patch?.percentualServico ?? bpsParaPercentual(despesa.percentualServicoBps),
    taxaExtraCentavos: patch?.taxaExtraCentavos ?? despesa.taxaExtraCentavos,
    modoDivisao: modo,
    pagadores:
      patch?.pagadores ??
      (despesa.pagadores.length === 1
        ? [{ usuarioId: despesa.pagadores[0].usuarioId }]
        : despesa.pagadores.map((pagador) => ({
            usuarioId: pagador.usuarioId,
            valorCentavos: pagador.valorCentavos,
          }))),
    participantes:
      patch?.participantes ??
      despesa.participantes.map((participante) => ({
        usuarioId: participante.usuarioId,
        percentual: participante.percentualBps == null ? undefined : bpsParaPercentual(participante.percentualBps),
        valorCentavos: modo === "VALOR" ? participante.valorCentavos : undefined,
      })),
    itens: patch?.itens ?? (despesa.itens.length ? itensDaDespesa(despesa) : undefined),
  };
}

async function assertMembros(db: Banco, grupoId: string, ids: string[]) {
  const unicos = [...new Set(ids)];
  const encontrados = await db.grupoUsuario.count({
    where: { grupoId, usuarioId: { in: unicos } },
  });

  if (encontrados !== unicos.length) {
    throw new AppError(400, "Pagadores e participantes precisam ser membros do grupo");
  }
}

async function assertCategoria(db: Banco, usuarioId: string, categoriaId: string | null | undefined) {
  if (!categoriaId) return;

  const categoria = await db.categoria.findFirst({
    where: {
      id: categoriaId,
      arquivada: false,
      OR: [{ sistema: true }, { usuarioId }],
    },
  });

  if (!categoria) {
    throw new AppError(400, "Categoria inválida ou arquivada");
  }
}

async function resolverPrazo(grupoId: string, prazoPagamento?: string) {
  const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });

  if (!grupo) throw new AppError(404, "Grupo não encontrado");

  return prazoPagamento ? fimDoDiaUtc(prazoPagamento) : adicionarDiasUtc(grupo.prazoPagamentoDias);
}

async function substituirFilhos(tx: Prisma.TransactionClient, despesaId: string, calculada: DespesaCalculada) {
  await tx.despesaPagador.deleteMany({ where: { despesaId } });
  await tx.despesaParticipante.deleteMany({ where: { despesaId } });
  await tx.itemDespesa.deleteMany({ where: { despesaId } });
  await tx.despesaPagador.createMany({
    data: calculada.pagadores.map((pagador) => ({ despesaId, ...pagador })),
  });
  await tx.despesaParticipante.createMany({
    data: calculada.participantes.map((participante) => ({ despesaId, ...participante })),
  });

  for (const item of calculada.itens) {
    await tx.itemDespesa.create({
      data: {
        despesaId,
        descricao: item.descricao,
        valorCentavos: item.valorCentavos,
        participantes: {
          create: (item.participantes ?? []).map((participante) => ({
            usuarioId: participante.usuarioId,
            valorCentavos: participante.valorCentavos,
          })),
        },
      },
    });
  }
}

async function carregar(despesaId: string, completo: true): Promise<DespesaCompleta>;
async function carregar(despesaId: string, completo: false): Promise<DespesaLista>;
async function carregar(despesaId: string, completo: boolean) {
  const despesa = await prisma.despesa.findFirst({
    where: { id: despesaId, excluidoEm: null },
    include: completo ? includeCompleto : includeLista,
  });

  if (!despesa) throw new AppError(404, "Despesa não encontrada");

  return despesa;
}

async function anexarUsuarios(calculada: DespesaCalculada, prazoPagamento: Date) {
  const ids = [
    ...calculada.pagadores.map((pagador) => pagador.usuarioId),
    ...calculada.participantes.map((participante) => participante.usuarioId),
  ];
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: usuarioResumoSelect,
  });
  const mapa = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  const usuarioDe = (usuarioId: string) =>
    mapa.get(usuarioId) ?? { id: usuarioId, nome: "Usuário", email: null, telefone: null, fotoUrl: null };

  return {
    valorBaseCentavos: calculada.valorBaseCentavos,
    percentualServico: bpsParaPercentual(calculada.percentualServicoBps),
    valorServicoCentavos: calculada.valorServicoCentavos,
    taxaExtraCentavos: calculada.taxaExtraCentavos,
    valorTotalCentavos: calculada.valorTotalCentavos,
    modoDivisao: calculada.modoDivisao,
    prazoPagamento,
    pagadores: calculada.pagadores.map((pagador) => ({
      usuario: usuarioDe(pagador.usuarioId),
      valorCentavos: pagador.valorCentavos,
    })),
    participantes: calculada.participantes.map((participante) => ({
      usuario: usuarioDe(participante.usuarioId),
      percentual: participante.percentualBps == null ? null : bpsParaPercentual(participante.percentualBps),
      valorCentavos: participante.valorCentavos,
    })),
    itens: calculada.itens,
  };
}

export const despesaService = {
  async previsualizar(usuarioId: string, grupoId: string, dados: DespesaInput) {
    await obterMembro(grupoId, usuarioId);
    const calculada = calcularDespesa(dados);
    await assertMembros(prisma, grupoId, [
      ...calculada.pagadores.map((pagador) => pagador.usuarioId),
      ...calculada.participantes.map((participante) => participante.usuarioId),
    ]);
    await assertCategoria(prisma, usuarioId, dados.categoriaId);
    const prazoPagamento = await resolverPrazo(grupoId, dados.prazoPagamento);
    return anexarUsuarios(calculada, prazoPagamento);
  },

  async criar(usuarioId: string, grupoId: string, dados: DespesaInput) {
    await obterMembro(grupoId, usuarioId);
    const calculada = calcularDespesa(dados);
    const prazoPagamento = await resolverPrazo(grupoId, dados.prazoPagamento);

    const despesaId = await prisma.$transaction(async (tx) => {
      await assertMembros(tx, grupoId, [
        ...calculada.pagadores.map((pagador) => pagador.usuarioId),
        ...calculada.participantes.map((participante) => participante.usuarioId),
      ]);
      await assertCategoria(tx, usuarioId, dados.categoriaId);

      const despesa = await tx.despesa.create({
        data: {
          grupoId,
          categoriaId: dados.categoriaId ?? null,
          descricao: dados.descricao.trim(),
          valorBaseCentavos: calculada.valorBaseCentavos,
          percentualServicoBps: calculada.percentualServicoBps,
          taxaExtraCentavos: calculada.taxaExtraCentavos,
          valorTotalCentavos: calculada.valorTotalCentavos,
          modoDivisao: calculada.modoDivisao,
          prazoPagamento,
          criadoPorId: usuarioId,
        },
      });

      await substituirFilhos(tx, despesa.id, calculada);
      await tx.auditoriaDespesa.create({
        data: {
          despesaId: despesa.id,
          usuarioId,
          acao: "CRIACAO",
          detalhes: {
            descricao: despesa.descricao,
            valorTotalCentavos: calculada.valorTotalCentavos,
            modoDivisao: calculada.modoDivisao,
          },
        },
      });
      await recalcularGrupo(grupoId, tx);
      return despesa.id;
    });

    return apresentar(await carregar(despesaId, true));
  },

  async listar(usuarioId: string, grupoId: string) {
    await obterMembro(grupoId, usuarioId);
    const despesas = await prisma.despesa.findMany({
      where: { grupoId, excluidoEm: null },
      include: includeLista,
      orderBy: { criadoEm: "desc" },
    });

    return despesas.map((despesa) => apresentar(despesa));
  },

  async obter(usuarioId: string, despesaId: string) {
    const despesa = await carregar(despesaId, true);
    await obterMembro(despesa.grupoId, usuarioId);
    return apresentar(despesa);
  },

  async atualizar(usuarioId: string, despesaId: string, dados: AtualizarDespesaInput) {
    const atual = await carregar(despesaId, true);
    await obterMembro(atual.grupoId, usuarioId);

    const calculada = calcularDespesa(paraEntrada(atual, dados));
    const categoriaId = dados.categoriaId === undefined ? atual.categoriaId : dados.categoriaId;
    const prazoPagamento = dados.prazoPagamento ? fimDoDiaUtc(dados.prazoPagamento) : atual.prazoPagamento;

    if (categoriaId && categoriaId !== atual.categoriaId) {
      await assertCategoria(prisma, usuarioId, categoriaId);
    }

    await prisma.$transaction(async (tx) => {
      await assertMembros(tx, atual.grupoId, [
        ...calculada.pagadores.map((pagador) => pagador.usuarioId),
        ...calculada.participantes.map((participante) => participante.usuarioId),
      ]);

      await tx.despesa.update({
        where: { id: despesaId },
        data: {
          descricao: dados.descricao?.trim() ?? atual.descricao,
          categoriaId,
          valorBaseCentavos: calculada.valorBaseCentavos,
          percentualServicoBps: calculada.percentualServicoBps,
          taxaExtraCentavos: calculada.taxaExtraCentavos,
          valorTotalCentavos: calculada.valorTotalCentavos,
          modoDivisao: calculada.modoDivisao,
          prazoPagamento,
          atualizadoPorId: usuarioId,
        },
      });
      await substituirFilhos(tx, despesaId, calculada);
      await tx.auditoriaDespesa.create({
        data: {
          despesaId,
          usuarioId,
          acao: "EDICAO",
          detalhes: {
            antes: {
              descricao: atual.descricao,
              valorTotalCentavos: atual.valorTotalCentavos,
              modoDivisao: atual.modoDivisao,
            },
            depois: {
              descricao: dados.descricao?.trim() ?? atual.descricao,
              valorTotalCentavos: calculada.valorTotalCentavos,
              modoDivisao: calculada.modoDivisao,
            },
          },
        },
      });
      await recalcularGrupo(atual.grupoId, tx);
    });

    return apresentar(await carregar(despesaId, true));
  },

  async excluir(usuarioId: string, despesaId: string) {
    const atual = await carregar(despesaId, false);
    await obterMembro(atual.grupoId, usuarioId);

    await prisma.$transaction(async (tx) => {
      await tx.despesa.update({
        where: { id: despesaId },
        data: { excluidoEm: new Date(), excluidoPorId: usuarioId, atualizadoPorId: usuarioId },
      });
      await tx.auditoriaDespesa.create({
        data: {
          despesaId,
          usuarioId,
          acao: "EXCLUSAO",
          detalhes: { descricao: atual.descricao, valorTotalCentavos: atual.valorTotalCentavos },
        },
      });
      await recalcularGrupo(atual.grupoId, tx);
    });

    return { mensagem: "Despesa excluída" };
  },

  async adicionarItem(usuarioId: string, despesaId: string, item: ItemDespesaInput) {
    const atual = await carregar(despesaId, true);
    await obterMembro(atual.grupoId, usuarioId);
    return this.atualizar(usuarioId, despesaId, { itens: [...itensDaDespesa(atual), item] });
  },

  async atualizarItem(usuarioId: string, despesaId: string, itemId: string, dados: Partial<ItemDespesaInput>) {
    const atual = await carregar(despesaId, true);
    await obterMembro(atual.grupoId, usuarioId);

    if (!atual.itens.some((item) => item.id === itemId)) {
      throw new AppError(404, "Item não encontrado");
    }

    const itens = atual.itens.map((item) => {
      if (item.id !== itemId) {
        return itensDaDespesa({ itens: [item] })[0];
      }

      return {
        descricao: dados.descricao ?? item.descricao,
        valorCentavos: dados.valorCentavos ?? item.valorCentavos,
        participantes:
          dados.participantes ??
          (item.participantes.length
            ? item.participantes.map((participante) => ({
                usuarioId: participante.usuarioId,
                valorCentavos: participante.valorCentavos,
              }))
            : undefined),
      };
    });

    return this.atualizar(usuarioId, despesaId, { itens });
  },

  async removerItem(usuarioId: string, despesaId: string, itemId: string) {
    const atual = await carregar(despesaId, true);
    await obterMembro(atual.grupoId, usuarioId);

    if (!atual.itens.some((item) => item.id === itemId)) {
      throw new AppError(404, "Item não encontrado");
    }

    const itens = itensDaDespesa({
      itens: atual.itens.filter((item) => item.id !== itemId),
    });

    if (itens.length === 0) {
      return this.atualizar(usuarioId, despesaId, { itens, valorCentavos: atual.valorBaseCentavos });
    }

    return this.atualizar(usuarioId, despesaId, { itens });
  },
};
