import { z } from "zod";
import { dataIsoValida } from "../lib/data";
import { ateDuasCasasDecimais } from "../lib/dinheiro";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const grupoIdParamSchema = z.object({
  grupoId: z.string().uuid(),
});

export const despesaIdParamSchema = z.object({
  despesaId: z.string().uuid(),
});

export const dividaIdParamSchema = z.object({
  dividaId: z.string().uuid(),
});

export const membroParamSchema = z.object({
  grupoId: z.string().uuid(),
  usuarioId: z.string().uuid(),
});

export const itemParamSchema = z.object({
  despesaId: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const dataIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a data no formato AAAA-MM-DD")
  .refine(dataIsoValida, "Data inválida");

export const percentualSchema = z
  .number()
  .min(0)
  .max(100)
  .refine(ateDuasCasasDecimais, "Use no máximo duas casas decimais");
