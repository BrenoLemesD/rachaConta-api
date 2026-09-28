import { StatusDivida } from "@prisma/client";
import { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { usuarioAtual } from "../middlewares/auth.middleware";
import { saldoService } from "../services/saldo.service";
import { CobrarDividaInput, QuitarDividaInput } from "../types/consulta.schema";

export const saldoController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const data = await saldoService.listar(usuarioAtual(req).id, req.params.grupoId);
    res.json({ data });
  }),

  listarDividas: asyncHandler(async (req: Request, res: Response) => {
    const status = typeof req.query.status === "string" ? (req.query.status as StatusDivida) : undefined;
    const data = await saldoService.listarDividas(usuarioAtual(req).id, req.params.grupoId, status);
    res.json({ data });
  }),

  quitar: asyncHandler(async (req: Request, res: Response) => {
    const data = await saldoService.quitar(usuarioAtual(req).id, req.params.dividaId, req.body as QuitarDividaInput);
    res.json({ data });
  }),

  cobrar: asyncHandler(async (req: Request, res: Response) => {
    const data = await saldoService.cobrar(usuarioAtual(req).id, req.params.dividaId, req.body as CobrarDividaInput);
    res.json({ data });
  }),

  calote: asyncHandler(async (req: Request, res: Response) => {
    const data = await saldoService.calote(usuarioAtual(req).id, req.params.dividaId);
    res.json({ data });
  }),

  cobrancas: asyncHandler(async (req: Request, res: Response) => {
    const data = await saldoService.listarCobrancas(usuarioAtual(req).id);
    res.json({ data });
  }),
};
