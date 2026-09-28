import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { pixService } from "../services/pix.service";
import { PixInput } from "../types/pix.schema";

export const pixController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const data = await pixService.listar(usuarioAtual(req).id);
    res.json({ data });
  }),

  criar: asyncHandler(async (req: Request, res: Response) => {
    const data = await pixService.criar(usuarioAtual(req).id, req.body as PixInput);
    res.status(201).json({ data });
  }),

  atualizar: asyncHandler(async (req: Request, res: Response) => {
    const data = await pixService.atualizar(usuarioAtual(req).id, req.params.id, req.body as PixInput);
    res.json({ data });
  }),

  remover: asyncHandler(async (req: Request, res: Response) => {
    const data = await pixService.remover(usuarioAtual(req).id, req.params.id);
    res.json({ data });
  }),
};
