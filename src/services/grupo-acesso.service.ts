import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";

export async function obterMembro(grupoId: string, usuarioId: string) {
  const membro = await prisma.grupoUsuario.findUnique({
    where: { grupoId_usuarioId: { grupoId, usuarioId } },
  });

  if (!membro) {
    throw new AppError(403, "Você não participa deste grupo");
  }

  return membro;
}

export async function obterAdmin(grupoId: string, usuarioId: string) {
  const membro = await obterMembro(grupoId, usuarioId);

  if (membro.papel !== "ADMIN") {
    throw new AppError(403, "Apenas administradores podem fazer isso");
  }

  return membro;
}
