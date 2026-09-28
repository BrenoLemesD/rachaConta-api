import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { AppError } from "../lib/app-error";
import { assinarToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { limparTexto } from "../lib/texto";
import { usuarioPublico } from "../lib/usuario-publico";
import { LoginInput, RedefinirSenhaInput, RegistrarInput } from "../types/auth.schema";
import { enviarEmail } from "./email.service";

const RODADAS_BCRYPT = 10;

type UsuarioSessao = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  fotoUrl: string | null;
  convidado: boolean;
  tema: "CLARO" | "ESCURO";
  cor: string;
  moedaPadrao: string;
  googleId: string | null;
  criadoEm: Date;
  tokenVersao: number;
};

export function emitirSessao(usuario: UsuarioSessao) {
  const token = assinarToken({
    sub: usuario.id,
    convidado: usuario.convidado,
    tv: usuario.tokenVersao,
  });

  return { token, usuario: usuarioPublico(usuario) };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const authService = {
  async registrar(dados: RegistrarInput) {
    const email = dados.email.trim().toLowerCase();
    const existente = await prisma.usuario.findUnique({ where: { email } });

    if (existente) {
      throw new AppError(409, "E-mail já cadastrado");
    }

    const usuario = await prisma.usuario.create({
      data: {
        nome: dados.nome.trim(),
        email,
        senhaHash: await bcrypt.hash(dados.senha, RODADAS_BCRYPT),
        telefone: limparTexto(dados.telefone),
      },
    });

    return emitirSessao(usuario);
  },

  async entrar(dados: LoginInput) {
    const usuario = await prisma.usuario.findUnique({
      where: { email: dados.email.trim().toLowerCase() },
    });

    if (!usuario?.senhaHash) {
      throw new AppError(401, "E-mail ou senha inválidos");
    }

    const senhaConfere = await bcrypt.compare(dados.senha, usuario.senhaHash);

    if (!senhaConfere) {
      throw new AppError(401, "E-mail ou senha inválidos");
    }

    return emitirSessao(usuario);
  },

  async entrarComGoogle(idToken: string) {
    if (!env.googleClientId) {
      throw new AppError(501, "Login com Google não está configurado");
    }

    const cliente = new OAuth2Client(env.googleClientId);
    const ticket = await cliente.verifyIdToken({ idToken, audience: env.googleClientId }).catch(() => null);
    const payload = ticket?.getPayload();

    if (!payload?.email || !payload.email_verified || !payload.sub) {
      throw new AppError(401, "Token do Google inválido");
    }

    const email = payload.email.toLowerCase();
    const porGoogle = await prisma.usuario.findUnique({ where: { googleId: payload.sub } });

    if (porGoogle) {
      return emitirSessao(porGoogle);
    }

    const porEmail = await prisma.usuario.findUnique({ where: { email } });

    if (porEmail) {
      const usuario = await prisma.usuario.update({
        where: { id: porEmail.id },
        data: { googleId: payload.sub },
      });

      return emitirSessao(usuario);
    }

    const usuario = await prisma.usuario.create({
      data: {
        nome: payload.name?.trim() || email.split("@")[0],
        email,
        googleId: payload.sub,
        fotoUrl: payload.picture ?? null,
      },
    });

    return emitirSessao(usuario);
  },

  async entrarComoConvidado() {
    const usuario = await prisma.usuario.create({
      data: { nome: "Convidado", convidado: true },
    });

    return emitirSessao(usuario);
  },

  async recuperarSenha(emailInformado: string) {
    const mensagem = "Se o e-mail existir, enviaremos instruções de recuperação.";
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailInformado.trim().toLowerCase() },
    });

    if (!usuario?.email || usuario.convidado) {
      return { mensagem };
    }

    const token = randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.resetSenhaToken.create({
      data: { usuarioId: usuario.id, tokenHash: hashToken(token), expiraEm },
    });

    const link = `${env.frontUrl}/redefinir-senha?token=${token}`;

    await enviarEmail(
      usuario.email,
      "Recuperação de senha — RachaConta",
      `Para criar uma nova senha, acesse o link abaixo. Ele vale por 1 hora:\n${link}\n\nSe você não pediu isso, ignore este e-mail.`,
    );

    if (!env.isProduction) {
      return { mensagem, tokenDesenvolvimento: token };
    }

    return { mensagem };
  },

  async redefinirSenha(dados: RedefinirSenhaInput) {
    const registro = await prisma.resetSenhaToken.findUnique({
      where: { tokenHash: hashToken(dados.token) },
    });

    if (!registro || registro.usado || registro.expiraEm < new Date()) {
      throw new AppError(400, "Token de recuperação inválido ou expirado");
    }

    const senhaHash = await bcrypt.hash(dados.novaSenha, RODADAS_BCRYPT);

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: registro.usuarioId },
        data: { senhaHash, tokenVersao: { increment: 1 } },
      }),
      prisma.resetSenhaToken.updateMany({
        where: { usuarioId: registro.usuarioId, usado: false },
        data: { usado: true },
      }),
    ]);

    return { mensagem: "Senha redefinida com sucesso" };
  },

  async sair(usuarioId: string) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { tokenVersao: { increment: 1 } },
    });

    return { mensagem: "Sessão encerrada" };
  },
};
