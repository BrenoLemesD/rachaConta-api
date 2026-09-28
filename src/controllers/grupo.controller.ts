import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { grupoService } from "../services/grupo.service";
import {
  AdicionarMembroInput,
  AtualizarGrupoInput,
  CriarGrupoInput,
  PapelMembroInput,
  RoletaInput,
} from "../types/grupo.schema";

export const grupoController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.listar(usuarioAtual(req).id);
    res.json({ data });
  }),

  criar: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.criar(usuarioAtual(req).id, req.body as CriarGrupoInput);
    res.status(201).json({ data });
  }),

  obter: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.obter(usuarioAtual(req).id, req.params.grupoId);
    res.json({ data });
  }),

  atualizar: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.atualizar(usuarioAtual(req).id, req.params.grupoId, req.body as AtualizarGrupoInput);
    res.json({ data });
  }),

  excluir: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.excluir(usuarioAtual(req).id, req.params.grupoId);
    res.json({ data });
  }),

  entrar: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.entrar(usuarioAtual(req).id, req.body.codigo as string);
    res.json({ data });
  }),

  convite: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.convite(usuarioAtual(req).id, req.params.grupoId);
    res.json({ data });
  }),

  renovarConvite: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.renovarConvite(usuarioAtual(req).id, req.params.grupoId);
    res.json({ data });
  }),

  listarMembros: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.listarMembros(usuarioAtual(req).id, req.params.grupoId);
    res.json({ data });
  }),

  adicionarMembro: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.adicionarMembro(
      usuarioAtual(req).id,
      req.params.grupoId,
      req.body as AdicionarMembroInput,
    );
    res.status(201).json({ data });
  }),

  removerMembro: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.removerMembro(usuarioAtual(req).id, req.params.grupoId, req.params.usuarioId);
    res.json({ data });
  }),

  alterarPapel: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.alterarPapel(
      usuarioAtual(req).id,
      req.params.grupoId,
      req.params.usuarioId,
      req.body as PapelMembroInput,
    );
    res.json({ data });
  }),

  roleta: asyncHandler(async (req: Request, res: Response) => {
    const data = await grupoService.roleta(usuarioAtual(req).id, req.params.grupoId, req.body as RoletaInput);
    res.json({ data });
  }),
};
