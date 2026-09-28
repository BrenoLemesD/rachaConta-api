import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { amigoService } from "../services/amigo.service";
import { BuscarAmigoInput, CriarAmigoInput, StatusAmizadeInput } from "../types/amigo.schema";

export const amigoController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const data = await amigoService.listar(usuarioAtual(req).id);
    res.json({ data });
  }),

  buscar: asyncHandler(async (req: Request, res: Response) => {
    const data = await amigoService.buscar(usuarioAtual(req).id, req.body as BuscarAmigoInput);
    res.json({ data });
  }),

  criar: asyncHandler(async (req: Request, res: Response) => {
    const data = await amigoService.criar(usuarioAtual(req).id, req.body as CriarAmigoInput);
    res.status(201).json({ data });
  }),

  responder: asyncHandler(async (req: Request, res: Response) => {
    const data = await amigoService.responder(usuarioAtual(req).id, req.params.id, req.body as StatusAmizadeInput);
    res.json({ data });
  }),

  remover: asyncHandler(async (req: Request, res: Response) => {
    const data = await amigoService.remover(usuarioAtual(req).id, req.params.id);
    res.json({ data });
  }),
};
