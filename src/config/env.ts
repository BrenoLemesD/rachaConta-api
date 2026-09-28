import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("RachaConta <noreply@rachaconta.local>"),
  FRONT_URL: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
  console.error(resultado.error.flatten().fieldErrors);
  throw new Error("Variáveis de ambiente inválidas. Confira o arquivo .env.example.");
}

const dados = resultado.data;

export const env = {
  port: dados.PORT,
  databaseUrl: dados.DATABASE_URL,
  directUrl: dados.DIRECT_URL,
  jwtSecret: dados.JWT_SECRET,
  jwtExpiresIn: dados.JWT_EXPIRES_IN,
  googleClientId: dados.GOOGLE_CLIENT_ID,
  smtpHost: dados.SMTP_HOST,
  smtpPort: dados.SMTP_PORT,
  smtpUser: dados.SMTP_USER,
  smtpPass: dados.SMTP_PASS,
  smtpFrom: dados.SMTP_FROM,
  frontUrl: dados.FRONT_URL.replace(/\/$/, ""),
  nodeEnv: dados.NODE_ENV,
  isProduction: dados.NODE_ENV === "production",
};
