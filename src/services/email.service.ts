import nodemailer from "nodemailer";
import { env } from "../config/env";

export async function enviarEmail(para: string, assunto: string, texto: string): Promise<boolean> {
  if (!env.smtpHost) {
    if (!env.isProduction) {
      console.info(`[email:dev] para=${para} assunto="${assunto}"\n${texto}`);
    }

    return false;
  }

  const transporte = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
  });

  await transporte.sendMail({
    from: env.smtpFrom,
    to: para,
    subject: assunto,
    text: texto,
  });

  return true;
}
