import { z } from "zod";
import { dataIsoSchema } from "./comum.schema";

export const listarDividasQuerySchema = z.object({
  status: z.enum(["EM_ABERTO", "QUITADA", "CALOTE"]).optional(),
});

export const quitarDividaSchema = z.preprocess(
  (valor) => valor ?? {},
  z.object({
    valorCentavos: z.number().int().positive().optional(),
  }),
);

export const cobrarDividaSchema = z.preprocess(
  (valor) => valor ?? {},
  z.object({
    mensagem: z.string().trim().max(280).optional(),
  }),
);

export const historicoQuerySchema = z.object({
  grupoId: z.string().uuid().optional(),
  categoriaId: z.string().uuid().optional(),
  dataInicio: dataIsoSchema.optional(),
  dataFim: dataIsoSchema.optional(),
  valorMinCentavos: z.coerce.number().int().nonnegative().optional(),
  valorMaxCentavos: z.coerce.number().int().nonnegative().optional(),
});

export type HistoricoQuery = z.infer<typeof historicoQuerySchema>;
export type QuitarDividaInput = z.infer<typeof quitarDividaSchema>;
export type CobrarDividaInput = z.infer<typeof cobrarDividaSchema>;
