import { z } from "zod";

export const categoriaSchema = z.object({
  nome: z.string().trim().min(2).max(40),
  icone: z.string().trim().min(1).max(40),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "A cor deve estar no formato #RRGGBB"),
});

export const atualizarCategoriaSchema = categoriaSchema
  .partial()
  .extend({
    arquivada: z.boolean().optional(),
  })
  .refine((dados) => Object.values(dados).some((valor) => valor !== undefined), {
    message: "Nenhum dado para atualizar",
  });

export const listarCategoriasQuerySchema = z.object({
  incluirArquivadas: z.string().optional(),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type AtualizarCategoriaInput = z.infer<typeof atualizarCategoriaSchema>;
