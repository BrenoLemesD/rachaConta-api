import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { usuarioService } from "../services/usuario.service";
import { AlterarSenhaInput } from "../types/auth.schema";
import { AtualizarPerfilInput, PreferenciasInput } from "../types/usuario.schema";

export const usuarioController = {
  eu: asyncHandler(async (req: Request, res: Response) => {
    const data = await usuarioService.eu(usuarioAtual(req).id);
    res.json({ data });
  }),

  atualizar: asyncHandler(async (req: Request, res: Response) => {
    const data = await usuarioService.atualizar(usuarioAtual(req).id, req.body as AtualizarPerfilInput);
    res.json({ data });
  }),

  alterarSenha: asyncHandler(async (req: Request, res: Response) => {
    const data = await usuarioService.alterarSenha(usuarioAtual(req).id, req.body as AlterarSenhaInput);
    res.json({ data });
  }),

  preferencias: asyncHandler(async (req: Request, res: Response) => {
    const data = await usuarioService.preferencias(usuarioAtual(req).id);
    res.json({ data });
  }),

  atualizarPreferencias: asyncHandler(async (req: Request, res: Response) => {
    const data = await usuarioService.atualizarPreferencias(usuarioAtual(req).id, req.body as PreferenciasInput);
    res.json({ data });
  }),
};
