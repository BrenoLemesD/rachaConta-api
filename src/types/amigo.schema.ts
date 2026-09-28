import { z } from "zod";

export const criarAmigoSchema = z
  .object({
    usuarioId: z.string().uuid().optional(),
    email: z.string().trim().email().optional(),
    telefone: z.string().trim().max(20).optional(),
    nome: z.string().trim().min(2).max(120).optional(),
  })
  .refine((dados) => dados.usuarioId || dados.email || dados.telefone, {
    message: "Informe o usuário, o e-mail ou o telefone",
  });

export const buscarAmigoSchema = z
  .object({
    email: z.string().trim().email().optional(),
    telefone: z.string().trim().min(3).max(20).optional(),
  })
  .refine((dados) => dados.email || dados.telefone, {
    message: "Informe e-mail ou telefone",
  });

export const statusAmizadeSchema = z.object({
  status: z.enum(["ACEITO", "RECUSADO"]),
});

export type CriarAmigoInput = z.infer<typeof criarAmigoSchema>;
export type BuscarAmigoInput = z.infer<typeof buscarAmigoSchema>;
export type StatusAmizadeInput = z.infer<typeof statusAmizadeSchema>;
