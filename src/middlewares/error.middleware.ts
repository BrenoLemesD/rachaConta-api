import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/app-error";

export function errorMiddleware(erro: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof AppError) {
    const corpo: { mensagem: string; detalhes?: unknown } = { mensagem: erro.message };

    if (erro.detalhes !== undefined) {
      corpo.detalhes = erro.detalhes;
    }

    res.status(erro.statusCode).json({ erro: corpo });
    return;
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    res.status(409).json({ erro: { mensagem: "Registro duplicado" } });
    return;
  }

  console.error(erro);
  res.status(500).json({ erro: { mensagem: "Erro interno do servidor" } });
}
