import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { authService } from "../services/auth.service";
import { LoginInput, RedefinirSenhaInput, RegistrarInput } from "../types/auth.schema";
import { usuarioAtual } from "../middlewares/auth.middleware";

export const authController = {
  registrar: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.registrar(req.body as RegistrarInput);
    res.status(201).json({ data });
  }),

  entrar: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.entrar(req.body as LoginInput);
    res.json({ data });
  }),

  google: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.entrarComGoogle(req.body.idToken as string);
    res.json({ data });
  }),

  convidado: asyncHandler(async (_req: Request, res: Response) => {
    const data = await authService.entrarComoConvidado();
    res.status(201).json({ data });
  }),

  recuperarSenha: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.recuperarSenha(req.body.email as string);
    res.json({ data });
  }),

  redefinirSenha: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.redefinirSenha(req.body as RedefinirSenhaInput);
    res.json({ data });
  }),

  sair: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.sair(usuarioAtual(req).id);
    res.json({ data });
  }),
};
