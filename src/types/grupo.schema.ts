import { z } from "zod";

export const criarGrupoSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  descricao: z.string().trim().max(500).optional().nullable(),
  imagemUrl: z.string().trim().max(500).optional().nullable(),
  moeda: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Use o código da moeda com 3 letras")
    .optional(),
  prazoPagamentoDias: z.number().int().min(0).max(365).optional(),
  recorrencia: z.string().trim().max(40).optional().nullable(),
});

export const atualizarGrupoSchema = criarGrupoSchema
  .partial()
  .refine((dados) => Object.values(dados).some((valor) => valor !== undefined), {
    message: "Nenhum dado para atualizar",
  });

export const entrarGrupoSchema = z.object({
  codigo: z.string().trim().min(4).max(64),
});

export const adicionarMembroSchema = z
  .object({
    usuarioId: z.string().uuid().optional(),
    email: z.string().trim().email().optional(),
  })
  .refine((dados) => dados.usuarioId || dados.email, {
    message: "Informe o usuário ou o e-mail",
  });

export const papelMembroSchema = z.object({
  papel: z.enum(["ADMIN", "MEMBRO"]),
});

export const roletaSchema = z.preprocess(
  (valor) => valor ?? {},
  z.object({
    usuarioIds: z.array(z.string().uuid()).min(1).optional(),
  }),
);

export type CriarGrupoInput = z.infer<typeof criarGrupoSchema>;
export type AtualizarGrupoInput = z.infer<typeof atualizarGrupoSchema>;
export type AdicionarMembroInput = z.infer<typeof adicionarMembroSchema>;
export type PapelMembroInput = z.infer<typeof papelMembroSchema>;
export type RoletaInput = z.infer<typeof roletaSchema>;
