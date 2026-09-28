import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";
import { AtualizarCategoriaInput, CategoriaInput } from "../types/categoria.schema";

async function buscarPropria(usuarioId: string, categoriaId: string) {
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });

  if (!categoria || categoria.usuarioId !== usuarioId) {
    throw new AppError(404, "Categoria não encontrada");
  }

  if (categoria.sistema) {
    throw new AppError(403, "Categorias do sistema não podem ser alteradas");
  }

  return categoria;
}

async function garantirNomeDisponivel(usuarioId: string, nome: string, ignorarId?: string) {
  const duplicada = await prisma.categoria.findFirst({
    where: {
      arquivada: false,
      nome: { equals: nome, mode: "insensitive" },
      ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
      OR: [{ usuarioId }, { sistema: true }],
    },
  });

  if (duplicada) {
    throw new AppError(409, "Já existe uma categoria ativa com este nome");
  }
}

export const categoriaService = {
  async listar(usuarioId: string, incluirArquivadas: boolean) {
    return prisma.categoria.findMany({
      where: {
        OR: [{ sistema: true }, { usuarioId }],
        ...(incluirArquivadas ? {} : { arquivada: false }),
      },
      orderBy: [{ sistema: "desc" }, { nome: "asc" }],
    });
  },

  async criar(usuarioId: string, dados: CategoriaInput) {
    const nome = dados.nome.trim();
    await garantirNomeDisponivel(usuarioId, nome);

    return prisma.categoria.create({
      data: {
        nome,
        icone: dados.icone.trim(),
        cor: dados.cor.toUpperCase(),
        usuarioId,
      },
    });
  },

  async atualizar(usuarioId: string, categoriaId: string, dados: AtualizarCategoriaInput) {
    const categoria = await buscarPropria(usuarioId, categoriaId);
    const nome = dados.nome?.trim() ?? categoria.nome;

    if (!dados.arquivada) {
      await garantirNomeDisponivel(usuarioId, nome, categoriaId);
    }

    return prisma.categoria.update({
      where: { id: categoriaId },
      data: {
        nome,
        icone: dados.icone?.trim() ?? categoria.icone,
        cor: dados.cor?.toUpperCase() ?? categoria.cor,
        arquivada: dados.arquivada ?? categoria.arquivada,
      },
    });
  },

  async arquivar(usuarioId: string, categoriaId: string) {
    await buscarPropria(usuarioId, categoriaId);

    return prisma.categoria.update({
      where: { id: categoriaId },
      data: { arquivada: true },
    });
  },
};
