import { z } from "zod";
import { TipoChavePix } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";
import { PixInput } from "../types/pix.schema";

async function garantirUsuarioReal(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!usuario) {
    throw new AppError(401, "Sessão inválida");
  }

  if (usuario.convidado) {
    throw new AppError(403, "Modo convidado não permite cadastrar Pix");
  }

  return usuario;
}

function normalizarChave(tipo: TipoChavePix, valor: string) {
  if (tipo === "CPF") {
    const digitos = valor.replace(/\D/g, "");

    if (!/^\d{11}$/.test(digitos)) {
      throw new AppError(400, "CPF deve ter 11 dígitos");
    }

    return digitos;
  }

  if (tipo === "TELEFONE") {
    const digitos = valor.replace(/\D/g, "");

    if (digitos.length < 10 || digitos.length > 13) {
      throw new AppError(400, "Telefone da chave Pix inválido");
    }

    return digitos;
  }

  if (tipo === "EMAIL") {
    const email = valor.trim().toLowerCase();

    if (!z.string().email().safeParse(email).success) {
      throw new AppError(400, "E-mail da chave Pix inválido");
    }

    return email;
  }

  const aleatoria = valor.trim();

  if (aleatoria.length < 8) {
    throw new AppError(400, "Chave aleatória inválida");
  }

  return aleatoria;
}

async function garantirChaveUnica(usuarioId: string, valor: string, ignorarId?: string) {
  const existente = await prisma.chavePix.findFirst({
    where: {
      usuarioId,
      valor,
      ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
    },
  });

  if (existente) {
    throw new AppError(409, "Esta chave Pix já está cadastrada");
  }
}

export const pixService = {
  async listar(usuarioId: string) {
    await garantirUsuarioReal(usuarioId);
    return prisma.chavePix.findMany({ where: { usuarioId }, orderBy: { criadoEm: "desc" } });
  },

  async criar(usuarioId: string, dados: PixInput) {
    await garantirUsuarioReal(usuarioId);
    const valor = normalizarChave(dados.tipo, dados.valor);
    await garantirChaveUnica(usuarioId, valor);

    return prisma.chavePix.create({
      data: {
        usuarioId,
        tipo: dados.tipo,
        valor,
        nomeTitular: dados.nomeTitular.trim(),
      },
    });
  },

  async atualizar(usuarioId: string, chaveId: string, dados: PixInput) {
    await garantirUsuarioReal(usuarioId);
    const chave = await prisma.chavePix.findUnique({ where: { id: chaveId } });

    if (!chave || chave.usuarioId !== usuarioId) {
      throw new AppError(404, "Chave Pix não encontrada");
    }

    const valor = normalizarChave(dados.tipo, dados.valor);
    await garantirChaveUnica(usuarioId, valor, chaveId);

    return prisma.chavePix.update({
      where: { id: chaveId },
      data: {
        tipo: dados.tipo,
        valor,
        nomeTitular: dados.nomeTitular.trim(),
      },
    });
  },

  async remover(usuarioId: string, chaveId: string) {
    await garantirUsuarioReal(usuarioId);
    const chave = await prisma.chavePix.findUnique({ where: { id: chaveId } });

    if (!chave || chave.usuarioId !== usuarioId) {
      throw new AppError(404, "Chave Pix não encontrada");
    }

    await prisma.chavePix.delete({ where: { id: chaveId } });
    return { mensagem: "Chave Pix removida" };
  },
};
