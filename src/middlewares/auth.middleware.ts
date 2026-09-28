import { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";
import { verificarToken } from "../lib/jwt";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const cabecalho = req.header("authorization");

    if (!cabecalho?.startsWith("Bearer ")) {
      throw new AppError(401, "Token não informado");
    }

    const token = cabecalho.slice("Bearer ".length).trim();
    const payload = verificarToken(token);
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, convidado: true, tokenVersao: true },
    });

    if (!usuario || usuario.tokenVersao !== payload.tv) {
      throw new AppError(401, "Sessão inválida");
    }

    req.usuario = {
      id: usuario.id,
      convidado: usuario.convidado,
      tokenVersao: usuario.tokenVersao,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, "Sessão inválida"));
  }
}

export function usuarioAtual(req: Request) {
  if (!req.usuario) {
    throw new AppError(401, "Não autenticado");
  }

  return req.usuario;
}
