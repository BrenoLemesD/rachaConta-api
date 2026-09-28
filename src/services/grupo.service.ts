import { randomInt } from "crypto";
import { env } from "../config/env";
import { AppError } from "../lib/app-error";
import { gerarCodigoConvite } from "../lib/codigo";
import { prisma } from "../lib/prisma";
import { limparTexto } from "../lib/texto";
import { usuarioResumoSelect } from "../lib/usuario-publico";
import {
  AdicionarMembroInput,
  AtualizarGrupoInput,
  CriarGrupoInput,
  PapelMembroInput,
  RoletaInput,
} from "../types/grupo.schema";
import { obterAdmin, obterMembro } from "./grupo-acesso.service";
import { mapaSaldosAbertos } from "./saldo.service";

function linkConvite(codigo: string) {
  return `${env.frontUrl}/convite/${codigo}`;
}

async function gerarCodigoUnico() {
  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const codigo = gerarCodigoConvite();
    const existe = await prisma.conviteGrupo.findUnique({ where: { codigo } });

    if (!existe) return codigo;
  }

  throw new AppError(500, "Não foi possível gerar o código de convite");
}

async function apresentarGrupo(grupoId: string, usuarioId: string) {
  const membro = await obterMembro(grupoId, usuarioId);
  const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });

  if (!grupo) throw new AppError(404, "Grupo não encontrado");

  const totalMembros = await prisma.grupoUsuario.count({ where: { grupoId } });
  const saldos = await mapaSaldosAbertos([grupoId]);

  return {
    id: grupo.id,
    nome: grupo.nome,
    descricao: grupo.descricao,
    imagemUrl: grupo.imagemUrl,
    moeda: grupo.moeda,
    prazoPagamentoDias: grupo.prazoPagamentoDias,
    recorrencia: grupo.recorrencia,
    codigoConvite: grupo.codigoConvite,
    linkConvite: linkConvite(grupo.codigoConvite),
    papel: membro.papel,
    totalMembros,
    saldoPessoalCentavos: saldos.get(grupoId)?.get(usuarioId) ?? 0,
    criadoEm: grupo.criadoEm,
    atualizadoEm: grupo.atualizadoEm,
  };
}

export const grupoService = {
  async listar(usuarioId: string) {
    const vinculos = await prisma.grupoUsuario.findMany({
      where: { usuarioId },
      include: { grupo: true },
      orderBy: { entrouEm: "desc" },
    });

    if (vinculos.length === 0) return [];

    const grupoIds = vinculos.map((vinculo) => vinculo.grupoId);
    const [saldos, contagens] = await Promise.all([
      mapaSaldosAbertos(grupoIds),
      prisma.grupoUsuario.groupBy({
        by: ["grupoId"],
        where: { grupoId: { in: grupoIds } },
        _count: { _all: true },
      }),
    ]);
    const totais = new Map(contagens.map((contagem) => [contagem.grupoId, contagem._count._all]));

    return vinculos.map((vinculo) => ({
      id: vinculo.grupo.id,
      nome: vinculo.grupo.nome,
      descricao: vinculo.grupo.descricao,
      imagemUrl: vinculo.grupo.imagemUrl,
      moeda: vinculo.grupo.moeda,
      prazoPagamentoDias: vinculo.grupo.prazoPagamentoDias,
      recorrencia: vinculo.grupo.recorrencia,
      papel: vinculo.papel,
      totalMembros: totais.get(vinculo.grupoId) ?? 0,
      saldoPessoalCentavos: saldos.get(vinculo.grupoId)?.get(usuarioId) ?? 0,
      criadoEm: vinculo.grupo.criadoEm,
    }));
  },

  async criar(usuarioId: string, dados: CriarGrupoInput) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

    if (!usuario) throw new AppError(401, "Sessão inválida");

    const codigo = await gerarCodigoUnico();
    const grupo = await prisma.grupo.create({
      data: {
        nome: dados.nome.trim(),
        descricao: limparTexto(dados.descricao),
        imagemUrl: limparTexto(dados.imagemUrl),
        moeda: (dados.moeda ?? usuario.moedaPadrao).toUpperCase(),
        prazoPagamentoDias: dados.prazoPagamentoDias ?? 7,
        recorrencia: limparTexto(dados.recorrencia),
        codigoConvite: codigo,
        criadoPorId: usuarioId,
        membros: { create: { usuarioId, papel: "ADMIN" } },
        convites: { create: { codigo, criadoPorId: usuarioId } },
      },
    });

    return apresentarGrupo(grupo.id, usuarioId);
  },

  async obter(usuarioId: string, grupoId: string) {
    return apresentarGrupo(grupoId, usuarioId);
  },

  async atualizar(usuarioId: string, grupoId: string, dados: AtualizarGrupoInput) {
    await obterAdmin(grupoId, usuarioId);

    await prisma.grupo.update({
      where: { id: grupoId },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome.trim() } : {}),
        ...(dados.descricao !== undefined ? { descricao: limparTexto(dados.descricao) } : {}),
        ...(dados.imagemUrl !== undefined ? { imagemUrl: limparTexto(dados.imagemUrl) } : {}),
        ...(dados.moeda !== undefined ? { moeda: dados.moeda.toUpperCase() } : {}),
        ...(dados.prazoPagamentoDias !== undefined ? { prazoPagamentoDias: dados.prazoPagamentoDias } : {}),
        ...(dados.recorrencia !== undefined ? { recorrencia: limparTexto(dados.recorrencia) } : {}),
      },
    });

    return apresentarGrupo(grupoId, usuarioId);
  },

  async excluir(usuarioId: string, grupoId: string) {
    await obterAdmin(grupoId, usuarioId);
    await prisma.grupo.delete({ where: { id: grupoId } });
    return { mensagem: "Grupo excluído" };
  },

  async entrar(usuarioId: string, codigo: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

    if (!usuario) throw new AppError(401, "Sessão inválida");

    if (usuario.convidado) {
      throw new AppError(403, "Modo convidado não permite entrar em grupos de terceiros");
    }

    const convite = await prisma.conviteGrupo.findFirst({
      where: { codigo: codigo.trim(), ativo: true },
    });

    if (!convite || (convite.expiraEm && convite.expiraEm < new Date())) {
      throw new AppError(404, "Convite inválido ou expirado");
    }

    const jaParticipa = await prisma.grupoUsuario.findUnique({
      where: { grupoId_usuarioId: { grupoId: convite.grupoId, usuarioId } },
    });

    if (!jaParticipa) {
      await prisma.grupoUsuario.create({
        data: { grupoId: convite.grupoId, usuarioId, papel: "MEMBRO" },
      });
    }

    return apresentarGrupo(convite.grupoId, usuarioId);
  },

  async convite(usuarioId: string, grupoId: string) {
    await obterMembro(grupoId, usuarioId);
    const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });

    if (!grupo) throw new AppError(404, "Grupo não encontrado");

    return { codigo: grupo.codigoConvite, link: linkConvite(grupo.codigoConvite) };
  },

  async renovarConvite(usuarioId: string, grupoId: string) {
    await obterAdmin(grupoId, usuarioId);
    const codigo = await gerarCodigoUnico();

    await prisma.$transaction([
      prisma.conviteGrupo.updateMany({ where: { grupoId, ativo: true }, data: { ativo: false } }),
      prisma.conviteGrupo.create({ data: { grupoId, codigo, criadoPorId: usuarioId } }),
      prisma.grupo.update({ where: { id: grupoId }, data: { codigoConvite: codigo } }),
    ]);

    return { codigo, link: linkConvite(codigo) };
  },

  async listarMembros(usuarioId: string, grupoId: string) {
    await obterMembro(grupoId, usuarioId);
    const membros = await prisma.grupoUsuario.findMany({
      where: { grupoId },
      include: { usuario: { select: { ...usuarioResumoSelect, convidado: true } } },
      orderBy: { entrouEm: "asc" },
    });

    return membros.map((membro) => ({
      id: membro.id,
      papel: membro.papel,
      entrouEm: membro.entrouEm,
      usuario: membro.usuario,
    }));
  },

  async adicionarMembro(usuarioId: string, grupoId: string, dados: AdicionarMembroInput) {
    await obterAdmin(grupoId, usuarioId);

    const alvo = dados.usuarioId
      ? await prisma.usuario.findUnique({ where: { id: dados.usuarioId } })
      : await prisma.usuario.findUnique({ where: { email: dados.email!.trim().toLowerCase() } });

    if (!alvo) {
      throw new AppError(404, "Usuário não encontrado");
    }

    if (alvo.convidado) {
      throw new AppError(403, "Usuário convidado não pode ser membro de um grupo");
    }

    const existente = await prisma.grupoUsuario.findUnique({
      where: { grupoId_usuarioId: { grupoId, usuarioId: alvo.id } },
    });

    if (existente) {
      throw new AppError(409, "Este usuário já participa do grupo");
    }

    await prisma.grupoUsuario.create({
      data: { grupoId, usuarioId: alvo.id, papel: "MEMBRO" },
    });

    return this.listarMembros(usuarioId, grupoId);
  },

  async removerMembro(usuarioId: string, grupoId: string, alvoId: string) {
    if (alvoId !== usuarioId) {
      await obterAdmin(grupoId, usuarioId);
    } else {
      await obterMembro(grupoId, usuarioId);
    }

    await prisma.$transaction(async (tx) => {
      const alvo = await tx.grupoUsuario.findUnique({
        where: { grupoId_usuarioId: { grupoId, usuarioId: alvoId } },
      });

      if (!alvo) throw new AppError(404, "Membro não encontrado");

      if (alvo.papel === "ADMIN") {
        const admins = await tx.grupoUsuario.count({ where: { grupoId, papel: "ADMIN" } });

        if (admins <= 1) {
          throw new AppError(400, "Defina outro administrador antes de remover este");
        }
      }

      await tx.grupoUsuario.delete({ where: { id: alvo.id } });
    });

    return { mensagem: "Membro removido" };
  },

  async alterarPapel(usuarioId: string, grupoId: string, alvoId: string, dados: PapelMembroInput) {
    await obterAdmin(grupoId, usuarioId);

    await prisma.$transaction(async (tx) => {
      const alvo = await tx.grupoUsuario.findUnique({
        where: { grupoId_usuarioId: { grupoId, usuarioId: alvoId } },
      });

      if (!alvo) throw new AppError(404, "Membro não encontrado");

      if (dados.papel === "MEMBRO" && alvo.papel === "ADMIN") {
        const admins = await tx.grupoUsuario.count({ where: { grupoId, papel: "ADMIN" } });

        if (admins <= 1) {
          throw new AppError(400, "O grupo precisa manter ao menos um administrador");
        }
      }

      await tx.grupoUsuario.update({ where: { id: alvo.id }, data: { papel: dados.papel } });
    });

    return this.listarMembros(usuarioId, grupoId);
  },

  async roleta(usuarioId: string, grupoId: string, dados: RoletaInput) {
    await obterMembro(grupoId, usuarioId);

    const membros = await prisma.grupoUsuario.findMany({
      where: {
        grupoId,
        ...(dados.usuarioIds ? { usuarioId: { in: dados.usuarioIds } } : {}),
      },
      include: { usuario: { select: usuarioResumoSelect } },
    });

    if (dados.usuarioIds && membros.length !== new Set(dados.usuarioIds).size) {
      throw new AppError(400, "A roleta só inclui membros do grupo");
    }

    if (membros.length === 0) {
      throw new AppError(400, "Nenhum membro disponível para o sorteio");
    }

    const escolhido = membros[randomInt(membros.length)];
    return { usuario: escolhido.usuario };
  },
};
