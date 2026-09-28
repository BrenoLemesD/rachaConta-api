import { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error";
import { usuarioAtual } from "./auth.middleware";

export function bloquearConvidado(req: Request, _res: Response, next: NextFunction) {
  try {
    const usuario = usuarioAtual(req);

    if (usuario.convidado) {
      throw new AppError(403, "Modo convidado não permite esta ação");
    }

    next();
  } catch (error) {
    next(error);
  }
}
