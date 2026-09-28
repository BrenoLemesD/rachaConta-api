import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { historicoService } from "../services/historico.service";
import { HistoricoQuery } from "../types/consulta.schema";

export const historicoController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const data = await historicoService.listar(usuarioAtual(req).id, req.query as HistoricoQuery);
    res.json({ data });
  }),
};
