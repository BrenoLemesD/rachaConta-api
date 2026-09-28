import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { AppError } from "../lib/app-error";

type Fonte = "body" | "query" | "params";

export function validar(schema: ZodTypeAny, fonte: Fonte = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req[fonte]);

    if (!resultado.success) {
      next(new AppError(400, "Dados inválidos", resultado.error.flatten()));
      return;
    }

    if (fonte === "body") {
      req.body = resultado.data;
    }

    if (fonte === "query") {
      Object.defineProperty(req, "query", {
        value: resultado.data,
        writable: true,
        configurable: true,
      });
    }

    next();
  };
}
