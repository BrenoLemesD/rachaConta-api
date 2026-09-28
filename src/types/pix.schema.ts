import { z } from "zod";

export const pixSchema = z.object({
  tipo: z.enum(["CPF", "EMAIL", "TELEFONE", "ALEATORIA"]),
  valor: z.string().trim().min(3).max(140),
  nomeTitular: z.string().trim().min(2).max(120),
});

export type PixInput = z.infer<typeof pixSchema>;
