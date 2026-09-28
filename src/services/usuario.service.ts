import bcrypt from "bcryptjs";
import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";
import { limparTexto } from "../lib/texto";
import { usuarioPublico } from "../lib/usuario-publico";
import { AlterarSenhaInput } from "../types/auth.schema";
import { AtualizarPerfilInput, PreferenciasInput } from "../types/usuario.schema";
import { emitirSessao } from "./auth.service";

const RODADAS_BCRYPT = 10;

async function carregar(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!usuario) {
    throw new AppError(401, "Sessão inválida");
  }

  return usuario;
}

export const usuarioService = {
  async eu(usuarioId: string) {
    const usuario = await carregar(usuarioId);
    return usuarioPublico(usuario);
  },

  async atualizar(usuarioId: string, dados: AtualizarPerfilInput) {
    const usuario = await carregar(usuarioId);

    if (usuario.convidado && dados.email) {
      throw new AppError(403, "Crie uma conta para alterar o e-mail");
    }

    let email = usuario.email;

    if (dados.email) {
      email = dados.email.trim().toLowerCase();
      const outro = await prisma.usuario.findUnique({ where: { email } });

      if (outro && outro.id !== usuarioId) {
        throw new AppError(409, "E-mail já cadastrado");
      }
    }

    const atualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nome: dados.nome?.trim() ?? usuario.nome,
        email,
        telefone: dados.telefone === undefined ? usuario.telefone : limparTexto(dados.telefone),
        fotoUrl: dados.fotoUrl === undefined ? usuario.fotoUrl : limparTexto(dados.fotoUrl),
      },
    });

    return usuarioPublico(atualizado);
  },

  async alterarSenha(usuarioId: string, dados: AlterarSenhaInput) {
    const usuario = await carregar(usuarioId);

    if (usuario.convidado || !usuario.senhaHash) {
      throw new AppError(400, "Esta conta não possui senha. Use a recuperação por e-mail.");
    }

    const senhaConfere = await bcrypt.compare(dados.senhaAtual, usuario.senhaHash);

    if (!senhaConfere) {
      throw new AppError(401, "Senha atual incorreta");
    }

    const atualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        senhaHash: await bcrypt.hash(dados.novaSenha, RODADAS_BCRYPT),
        tokenVersao: { increment: 1 },
      },
    });

    await prisma.resetSenhaToken.updateMany({
      where: { usuarioId, usado: false },
      data: { usado: true },
    });

    return {
      mensagem: "Senha alterada com sucesso",
      ...emitirSessao(atualizado),
    };
  },

  async preferencias(usuarioId: string) {
    const usuario = await carregar(usuarioId);

    return {
      tema: usuario.tema,
      cor: usuario.cor,
      moedaPadrao: usuario.moedaPadrao,
    };
  },

  async atualizarPreferencias(usuarioId: string, dados: PreferenciasInput) {
    await carregar(usuarioId);

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        tema: dados.tema,
        cor: dados.cor,
        moedaPadrao: dados.moedaPadrao?.toUpperCase(),
      },
    });

    return {
      tema: usuario.tema,
      cor: usuario.cor,
      moedaPadrao: usuario.moedaPadrao,
    };
  },
};
