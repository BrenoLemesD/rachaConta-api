import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { categoriaService } from "../services/categoria.service";
import { AtualizarCategoriaInput, CategoriaInput } from "../types/categoria.schema";

export const categoriaController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const incluirArquivadas = req.query.incluirArquivadas === "true";
    const data = await categoriaService.listar(usuarioAtual(req).id, incluirArquivadas);
    res.json({ data });
  }),

  criar: asyncHandler(async (req: Request, res: Response) => {
    const data = await categoriaService.criar(usuarioAtual(req).id, req.body as CategoriaInput);
    res.status(201).json({ data });
  }),

  atualizar: asyncHandler(async (req: Request, res: Response) => {
    const data = await categoriaService.atualizar(usuarioAtual(req).id, req.params.id, req.body as AtualizarCategoriaInput);
    res.json({ data });
  }),

  arquivar: asyncHandler(async (req: Request, res: Response) => {
    const data = await categoriaService.arquivar(usuarioAtual(req).id, req.params.id);
    res.json({ data });
  }),
};
