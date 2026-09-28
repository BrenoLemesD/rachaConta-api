import { z } from "zod";

const senhaSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72);

export const registrarSchema = z
  .object({
    nome: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(160),
    senha: senhaSchema,
    confirmarSenha: senhaSchema,
    telefone: z.string().trim().max(20).optional().nullable(),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  senha: z.string().min(1),
});

export const googleSchema = z.object({
  idToken: z.string().min(10),
});

export const recuperarSenhaSchema = z.object({
  email: z.string().trim().email(),
});

export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(20),
    novaSenha: senhaSchema,
    confirmarNovaSenha: senhaSchema,
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "As senhas não conferem",
    path: ["confirmarNovaSenha"],
  });

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1),
    novaSenha: senhaSchema,
    confirmarNovaSenha: senhaSchema,
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "As senhas não conferem",
    path: ["confirmarNovaSenha"],
  });

export type RegistrarInput = z.infer<typeof registrarSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;
