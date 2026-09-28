import { Prisma, PrismaClient, StatusDivida } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { formatarMoeda } from "../lib/dinheiro";
import { prisma } from "../lib/prisma";
import { usuarioResumoSelect } from "../lib/usuario-publico";
import { CobrarDividaInput, QuitarDividaInput } from "../types/consulta.schema";
import { enviarEmail } from "./email.service";
import { obterMembro } from "./grupo-acesso.service";
import { simplificarDividas } from "./simplificacao.service";

type Banco = Prisma.TransactionClient | PrismaClient;

type Acumulado = {
  pago: number;
  devido: number;
  ajuste: number;
};

const includeDivida = {
  credor: { select: usuarioResumoSelect },
  devedor: { select: usuarioResumoSelect },
} as const;

function garantir(mapa: Map<string, Acumulado>, usuarioId: string) {
  const atual = mapa.get(usuarioId);

  if (atual) return atual;

  const criado = { pago: 0, devido: 0, ajuste: 0 };
  mapa.set(usuarioId, criado);
  return criado;
}

async function detalharAcumulado(grupoId: string, db: Banco) {
  const mapa = new Map<string, Acumulado>();
  const despesas = await db.despesa.findMany({
    where: { grupoId, excluidoEm: null },
    select: {
      pagadores: { select: { usuarioId: true, valorCentavos: true } },
      participantes: { select: { usuarioId: true, valorCentavos: true } },
    },
  });

  for (const despesa of despesas) {
    for (const pagador of despesa.pagadores) {
      garantir(mapa, pagador.usuarioId).pago += pagador.valorCentavos;
    }

    for (const participante of despesa.participantes) {
      garantir(mapa, participante.usuarioId).devido += participante.valorCentavos;
    }
  }

  const ajustes = await db.divida.findMany({
    where: { grupoId, status: { in: ["QUITADA", "CALOTE"] } },
    select: { credorId: true, devedorId: true, valorCentavos: true },
  });

  for (const ajuste of ajustes) {
    garantir(mapa, ajuste.credorId).ajuste -= ajuste.valorCentavos;
    garantir(mapa, ajuste.devedorId).ajuste += ajuste.valorCentavos;
  }

  return mapa;
}

async function vencimentoPorDevedor(grupoId: string, db: Banco) {
  const despesas = await db.despesa.findMany({
    where: { grupoId, excluidoEm: null },
    select: {
      prazoPagamento: true,
      participantes: { select: { usuarioId: true, valorCentavos: true } },
    },
  });
  const mapa = new Map<string, Date>();

  for (const despesa of despesas) {
    for (const participante of despesa.participantes) {
      if (participante.valorCentavos <= 0) continue;

      const atual = mapa.get(participante.usuarioId);

      if (!atual || despesa.prazoPagamento < atual) {
        mapa.set(participante.usuarioId, despesa.prazoPagamento);
      }
    }
  }

  return mapa;
}

export async function recalcularGrupo(grupoId: string, tx: Prisma.TransactionClient) {
  try {
    await tx.grupo.update({ where: { id: grupoId }, data: { atualizadoEm: new Date() } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError(404, "Grupo não encontrado");
    }

    throw error;
  }

  const acumulado = await detalharAcumulado(grupoId, tx);
  const transferencias = simplificarDividas(
    [...acumulado.entries()].map(([usuarioId, valores]) => ({
      usuarioId,
      saldoCentavos: valores.pago - valores.devido + valores.ajuste,
    })),
  );
  const vencimentos = await vencimentoPorDevedor(grupoId, tx);
  const abertas = await tx.divida.findMany({ where: { grupoId, status: "EM_ABERTO" } });
  const desejadas = new Map(transferencias.map((transferencia) => [`${transferencia.devedorId}:${transferencia.credorId}`, transferencia]));
  const existentes = new Map(abertas.map((divida) => [`${divida.devedorId}:${divida.credorId}`, divida]));

  for (const [chave, divida] of existentes) {
    const desejada = desejadas.get(chave);

    if (!desejada) {
      await tx.divida.delete({ where: { id: divida.id } });
      continue;
    }

    const vencimento = vencimentos.get(desejada.devedorId) ?? null;
    const vencimentoMudou = (divida.vencimento?.getTime() ?? null) !== (vencimento?.getTime() ?? null);

    if (divida.valorCentavos !== desejada.valorCentavos || vencimentoMudou) {
      await tx.divida.update({
        where: { id: divida.id },
        data: { valorCentavos: desejada.valorCentavos, vencimento },
      });
    }

    desejadas.delete(chave);
  }

  for (const desejada of desejadas.values()) {
    await tx.divida.create({
      data: {
        grupoId,
        credorId: desejada.credorId,
        devedorId: desejada.devedorId,
        valorCentavos: desejada.valorCentavos,
        status: "EM_ABERTO",
        vencimento: vencimentos.get(desejada.devedorId) ?? null,
      },
    });
  }
}

export async function mapaSaldosAbertos(grupoIds: string[]) {
  const mapa = new Map<string, Map<string, number>>();

  for (const grupoId of grupoIds) {
    mapa.set(grupoId, new Map());
  }

  if (grupoIds.length === 0) return mapa;

  const despesas = await prisma.despesa.findMany({
    where: { grupoId: { in: grupoIds }, excluidoEm: null },
    select: {
      grupoId: true,
      pagadores: { select: { usuarioId: true, valorCentavos: true } },
      participantes: { select: { usuarioId: true, valorCentavos: true } },
    },
  });
  const ajustes = await prisma.divida.findMany({
    where: { grupoId: { in: grupoIds }, status: { in: ["QUITADA", "CALOTE"] } },
    select: { grupoId: true, credorId: true, devedorId: true, valorCentavos: true },
  });

  const somar = (grupoId: string, usuarioId: string, delta: number) => {
    const grupo = mapa.get(grupoId);

    if (!grupo) return;

    grupo.set(usuarioId, (grupo.get(usuarioId) ?? 0) + delta);
  };

  for (const despesa of despesas) {
    for (const pagador of despesa.pagadores) somar(despesa.grupoId, pagador.usuarioId, pagador.valorCentavos);
    for (const participante of despesa.participantes) somar(despesa.grupoId, participante.usuarioId, -participante.valorCentavos);
  }

  for (const ajuste of ajustes) {
    somar(ajuste.grupoId, ajuste.credorId, -ajuste.valorCentavos);
    somar(ajuste.grupoId, ajuste.devedorId, ajuste.valorCentavos);
  }

  return mapa;
}

function apresentarDivida(divida: {
  id: string;
  grupoId: string;
  valorCentavos: number;
  status: StatusDivida;
  vencimento: Date | null;
  cobrancas: number;
  ultimaCobranca: Date | null;
  criadoEm: Date;
  credor: { id: string; nome: string; email: string | null; telefone: string | null; fotoUrl: string | null };
  devedor: { id: string; nome: string; email: string | null; telefone: string | null; fotoUrl: string | null };
}) {
  return {
    id: divida.id,
    grupoId: divida.grupoId,
    valorCentavos: divida.valorCentavos,
    status: divida.status,
    vencimento: divida.vencimento,
    cobrancas: divida.cobrancas,
    ultimaCobranca: divida.ultimaCobranca,
    credor: divida.credor,
    devedor: divida.devedor,
    criadoEm: divida.criadoEm,
  };
}

async function sincronizar(grupoId: string) {
  await prisma.$transaction(async (tx) => {
    await recalcularGrupo(grupoId, tx);
  });
}

export const saldoService = {
  async listar(usuarioId: string, grupoId: string) {
    await obterMembro(grupoId, usuarioId);
    await sincronizar(grupoId);

    const acumulado = await detalharAcumulado(grupoId, prisma);
    const membros = await prisma.grupoUsuario.findMany({
      where: { grupoId },
      include: { usuario: { select: usuarioResumoSelect } },
    });
    const usuarios = new Map(membros.map((membro) => [membro.usuarioId, membro.usuario]));
    const idsExtras = [...acumulado.keys()].filter((id) => !usuarios.has(id));

    if (idsExtras.length > 0) {
      const extras = await prisma.usuario.findMany({
        where: { id: { in: idsExtras } },
        select: usuarioResumoSelect,
      });

      for (const extra of extras) usuarios.set(extra.id, extra);
    }

    const ids = new Set<string>([...usuarios.keys(), ...acumulado.keys()]);
    const saldos = [...ids].map((id) => {
      const valores = acumulado.get(id) ?? { pago: 0, devido: 0, ajuste: 0 };

      return {
        usuario: usuarios.get(id) ?? null,
        totalPagoCentavos: valores.pago,
        totalDevidoCentavos: valores.devido,
        saldoLiquidoCentavos: valores.pago - valores.devido,
        saldoAbertoCentavos: valores.pago - valores.devido + valores.ajuste,
      };
    });

    saldos.sort((a, b) => (a.usuario?.nome ?? "").localeCompare(b.usuario?.nome ?? ""));

    const abertas = await prisma.divida.findMany({
      where: { grupoId, status: "EM_ABERTO" },
      include: includeDivida,
      orderBy: { valorCentavos: "desc" },
    });

    return { saldos, transferencias: abertas.map(apresentarDivida) };
  },

  async listarDividas(usuarioId: string, grupoId: string, status?: StatusDivida) {
    await obterMembro(grupoId, usuarioId);
    await sincronizar(grupoId);

    const dividas = await prisma.divida.findMany({
      where: { grupoId, ...(status ? { status } : {}) },
      include: includeDivida,
      orderBy: { criadoEm: "desc" },
    });

    return dividas.map(apresentarDivida);
  },

  async quitar(usuarioId: string, dividaId: string, dados: QuitarDividaInput) {
    const divida = await prisma.divida.findUnique({ where: { id: dividaId } });

    if (!divida) throw new AppError(404, "Dívida não encontrada");

    await obterMembro(divida.grupoId, usuarioId);

    if (usuarioId !== divida.credorId && usuarioId !== divida.devedorId) {
      throw new AppError(403, "Apenas o credor ou o devedor podem quitar esta dívida");
    }

    await prisma.$transaction(async (tx) => {
      await tx.grupo.update({ where: { id: divida.grupoId }, data: { atualizadoEm: new Date() } });
      const atual = await tx.divida.findUnique({ where: { id: dividaId } });

      if (!atual || atual.status !== "EM_ABERTO") {
        throw new AppError(400, "Apenas dívidas em aberto podem ser quitadas");
      }

      const valor = dados.valorCentavos ?? atual.valorCentavos;

      if (valor > atual.valorCentavos) {
        throw new AppError(400, "O valor informado é maior que a dívida em aberto");
      }

      await tx.divida.create({
        data: {
          grupoId: atual.grupoId,
          credorId: atual.credorId,
          devedorId: atual.devedorId,
          valorCentavos: valor,
          status: "QUITADA",
          vencimento: atual.vencimento,
        },
      });
      await recalcularGrupo(atual.grupoId, tx);
    });

    return { mensagem: "Dívida quitada" };
  },

  async calote(usuarioId: string, dividaId: string) {
    const divida = await prisma.divida.findUnique({ where: { id: dividaId } });

    if (!divida) throw new AppError(404, "Dívida não encontrada");

    await obterMembro(divida.grupoId, usuarioId);

    if (usuarioId !== divida.credorId) {
      throw new AppError(403, "Apenas o credor pode marcar calote");
    }

    await prisma.$transaction(async (tx) => {
      await tx.grupo.update({ where: { id: divida.grupoId }, data: { atualizadoEm: new Date() } });
      const atual = await tx.divida.findUnique({ where: { id: dividaId } });

      if (!atual || atual.status !== "EM_ABERTO") {
        throw new AppError(400, "Apenas dívidas em aberto podem ser marcadas como calote");
      }

      if (!atual.vencimento || atual.vencimento.getTime() > Date.now()) {
        throw new AppError(403, "Só é possível marcar calote após o vencimento");
      }

      await tx.divida.create({
        data: {
          grupoId: atual.grupoId,
          credorId: atual.credorId,
          devedorId: atual.devedorId,
          valorCentavos: atual.valorCentavos,
          status: "CALOTE",
          vencimento: atual.vencimento,
        },
      });
      await recalcularGrupo(atual.grupoId, tx);
    });

    return { mensagem: "Dívida marcada como calote" };
  },

  async cobrar(usuarioId: string, dividaId: string, dados: CobrarDividaInput) {
    const divida = await prisma.divida.findUnique({
      where: { id: dividaId },
      include: { grupo: true, devedor: true, credor: { select: usuarioResumoSelect } },
    });

    if (!divida) throw new AppError(404, "Dívida não encontrada");

    await obterMembro(divida.grupoId, usuarioId);

    if (usuarioId !== divida.credorId) {
      throw new AppError(403, "Apenas o credor pode cobrar esta dívida");
    }

    if (divida.status !== "EM_ABERTO") {
      throw new AppError(400, "Só é possível cobrar dívidas em aberto");
    }

    const mensagem =
      dados.mensagem?.trim() ||
      `Você tem uma dívida de ${formatarMoeda(divida.valorCentavos, divida.grupo.moeda)} no grupo ${divida.grupo.nome}.`;

    const cobranca = await prisma.$transaction(async (tx) => {
      const atual = await tx.divida.findUnique({ where: { id: divida.id } });

      if (!atual || atual.status !== "EM_ABERTO") {
        throw new AppError(400, "Só é possível cobrar dívidas em aberto");
      }

      const criada = await tx.cobranca.create({
        data: {
          grupoId: atual.grupoId,
          dividaId: atual.id,
          credorId: atual.credorId,
          devedorId: atual.devedorId,
          valorCentavos: atual.valorCentavos,
          mensagem,
        },
      });

      await tx.divida.update({
        where: { id: atual.id },
        data: { cobrancas: { increment: 1 }, ultimaCobranca: new Date() },
      });

      return criada;
    });

    if (divida.devedor.email) {
      try {
        await enviarEmail(divida.devedor.email, `Cobrança no grupo ${divida.grupo.nome}`, mensagem);
      } catch (error) {
        console.error(error);
      }
    }

    return {
      id: cobranca.id,
      mensagem: cobranca.mensagem,
      valorCentavos: cobranca.valorCentavos,
      criadoEm: cobranca.criadoEm,
      credor: divida.credor,
      devedor: {
        id: divida.devedor.id,
        nome: divida.devedor.nome,
        email: divida.devedor.email,
        telefone: divida.devedor.telefone,
        fotoUrl: divida.devedor.fotoUrl,
      },
    };
  },

  async listarCobrancas(usuarioId: string) {
    const cobrancas = await prisma.cobranca.findMany({
      where: { devedorId: usuarioId },
      include: {
        credor: { select: usuarioResumoSelect },
        grupo: { select: { id: true, nome: true, moeda: true } },
      },
      orderBy: { criadoEm: "desc" },
    });

    return cobrancas;
  },
};
