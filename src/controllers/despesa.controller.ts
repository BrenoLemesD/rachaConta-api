import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { despesaService } from "../services/despesa.service";
import { AtualizarDespesaInput, DespesaInput, ItemDespesaInput } from "../types/despesa.schema";

export const despesaController = {
  previsualizar: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.previsualizar(usuarioAtual(req).id, req.params.grupoId, req.body as DespesaInput);
    res.json({ data });
  }),

  criar: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.criar(usuarioAtual(req).id, req.params.grupoId, req.body as DespesaInput);
    res.status(201).json({ data });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.listar(usuarioAtual(req).id, req.params.grupoId);
    res.json({ data });
  }),

  obter: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.obter(usuarioAtual(req).id, req.params.despesaId);
    res.json({ data });
  }),

  atualizar: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.atualizar(
      usuarioAtual(req).id,
      req.params.despesaId,
      req.body as AtualizarDespesaInput,
    );
    res.json({ data });
  }),

  excluir: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.excluir(usuarioAtual(req).id, req.params.despesaId);
    res.json({ data });
  }),

  adicionarItem: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.adicionarItem(
      usuarioAtual(req).id,
      req.params.despesaId,
      req.body as ItemDespesaInput,
    );
    res.status(201).json({ data });
  }),

  atualizarItem: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.atualizarItem(
      usuarioAtual(req).id,
      req.params.despesaId,
      req.params.itemId,
      req.body as Partial<ItemDespesaInput>,
    );
    res.json({ data });
  }),

  removerItem: asyncHandler(async (req: Request, res: Response) => {
    const data = await despesaService.removerItem(usuarioAtual(req).id, req.params.despesaId, req.params.itemId);
    res.json({ data });
  }),
};
