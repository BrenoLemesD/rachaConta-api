import { z } from "zod";

export const atualizarPerfilSchema = z
  .object({
    nome: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(160).optional(),
    telefone: z.string().trim().max(20).nullable().optional(),
    fotoUrl: z.string().trim().max(500).nullable().optional(),
  })
  .refine((dados) => Object.values(dados).some((valor) => valor !== undefined), {
    message: "Nenhum dado para atualizar",
  });

export const preferenciasSchema = z
  .object({
    tema: z.enum(["CLARO", "ESCURO"]).optional(),
    cor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "A cor deve estar no formato #RRGGBB")
      .optional(),
    moedaPadrao: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, "Use o código da moeda com 3 letras")
      .optional(),
  })
  .refine((dados) => dados.tema || dados.cor || dados.moedaPadrao, {
    message: "Informe ao menos uma preferência",
  });

export type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>;
export type PreferenciasInput = z.infer<typeof preferenciasSchema>;
