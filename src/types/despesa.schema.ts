import { z } from "zod";
import { dataIsoSchema, percentualSchema } from "./comum.schema";

const participanteItemSchema = z.object({
  usuarioId: z.string().uuid(),
  valorCentavos: z.number().int().positive(),
});

export const itemDespesaSchema = z.object({
  descricao: z.string().trim().min(1).max(120),
  valorCentavos: z.number().int().positive(),
  participantes: z.array(participanteItemSchema).optional(),
});

export const atualizarItemSchema = itemDespesaSchema.partial().refine(
  (dados) => Object.values(dados).some((valor) => valor !== undefined),
  { message: "Nenhum dado para atualizar" },
);

const participanteSchema = z.object({
  usuarioId: z.string().uuid(),
  percentual: percentualSchema.optional(),
  valorCentavos: z.number().int().nonnegative().optional(),
});

const pagadorSchema = z.object({
  usuarioId: z.string().uuid(),
  valorCentavos: z.number().int().positive().optional(),
});

export const despesaSchema = z.object({
  descricao: z.string().trim().min(1).max(160),
  categoriaId: z.string().uuid().nullable().optional(),
  valorCentavos: z.number().int().positive().optional(),
  percentualServico: percentualSchema.optional(),
  taxaExtraCentavos: z.number().int().nonnegative().optional(),
  modoDivisao: z.enum(["IGUAL", "PERCENTUAL", "VALOR"]),
  prazoPagamento: dataIsoSchema.optional(),
  pagadores: z.array(pagadorSchema).min(1),
  participantes: z.array(participanteSchema).min(1),
  itens: z.array(itemDespesaSchema).optional(),
});

export const atualizarDespesaSchema = despesaSchema.partial().refine(
  (dados) => Object.values(dados).some((valor) => valor !== undefined),
  { message: "Nenhum dado para atualizar" },
);

export type ItemDespesaInput = z.infer<typeof itemDespesaSchema>;
export type DespesaInput = z.infer<typeof despesaSchema>;
export type AtualizarDespesaInput = z.infer<typeof atualizarDespesaSchema>;
