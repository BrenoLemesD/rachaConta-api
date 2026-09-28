import { Amizade, Usuario } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";
import { usuarioResumoSelect } from "../lib/usuario-publico";
import { BuscarAmigoInput, CriarAmigoInput, StatusAmizadeInput } from "../types/amigo.schema";

const includeAmizade = {
  solicitante: { select: usuarioResumoSelect },
  destinatario: { select: usuarioResumoSelect },
} as const;

type AmizadeCarregada = Amizade & {
  solicitante: Pick<Usuario, "id" | "nome" | "email" | "telefone" | "fotoUrl">;
  destinatario: Pick<Usuario, "id" | "nome" | "email" | "telefone" | "fotoUrl"> | null;
};

function apresentar(registro: AmizadeCarregada, usuarioId: string) {
  const outro = registro.solicitanteId === usuarioId ? registro.destinatario : registro.solicitante;

  return {
    id: registro.id,
    tipo: registro.tipo,
    status: registro.status,
    criadoEm: registro.criadoEm,
    amigo: registro.tipo === "USUARIO" ? outro : null,
    contato:
      registro.tipo === "EXTERNO"
        ? {
            nome: registro.nomeContato,
            email: registro.emailContato,
            telefone: registro.telefoneContato,
          }
        : null,
  };
}

async function buscarEntreUsuarios(usuarioId: string, alvoId: string) {
  return prisma.amizade.findFirst({
    where: {
      tipo: "USUARIO",
      OR: [
        { solicitanteId: usuarioId, destinatarioId: alvoId },
        { solicitanteId: alvoId, destinatarioId: usuarioId },
      ],
    },
    include: includeAmizade,
  });
}

export const amigoService = {
  async listar(usuarioId: string) {
    const registros = await prisma.amizade.findMany({
      where: { OR: [{ solicitanteId: usuarioId }, { destinatarioId: usuarioId }] },
      include: includeAmizade,
      orderBy: { criadoEm: "desc" },
    });

    const apresentados = registros.map((registro) => ({
      registro,
      view: apresentar(registro, usuarioId),
    }));

    return {
      amigos: apresentados.filter((item) => item.registro.status === "ACEITO").map((item) => item.view),
      convitesRecebidos: apresentados
        .filter((item) => item.registro.status === "PENDENTE" && item.registro.destinatarioId === usuarioId)
        .map((item) => item.view),
      convitesEnviados: apresentados
        .filter((item) => item.registro.status === "PENDENTE" && item.registro.solicitanteId === usuarioId)
        .map((item) => item.view),
    };
  },

  async buscar(usuarioId: string, dados: BuscarAmigoInput) {
    const filtros = [];

    if (dados.email) filtros.push({ email: dados.email.trim().toLowerCase() });
    if (dados.telefone) filtros.push({ telefone: dados.telefone.trim() });

    const usuarios = await prisma.usuario.findMany({
      where: { OR: filtros, NOT: { id: usuarioId }, convidado: false },
      select: usuarioResumoSelect,
    });

    return { usuarios };
  },

  async criar(usuarioId: string, dados: CriarAmigoInput) {
    const email = dados.email?.trim().toLowerCase();
    const telefone = dados.telefone?.trim();
    let alvo = dados.usuarioId
      ? await prisma.usuario.findUnique({ where: { id: dados.usuarioId } })
      : null;

    if (dados.usuarioId && !alvo) {
      throw new AppError(404, "Usuário não encontrado");
    }

    if (!alvo && email) {
      alvo = await prisma.usuario.findUnique({ where: { email } });
    }

    if (!alvo && telefone) {
      const encontrados = await prisma.usuario.findMany({
        where: { telefone, convidado: false, NOT: { id: usuarioId } },
      });

      if (encontrados.length > 1) {
        throw new AppError(409, "Há mais de um usuário com este telefone");
      }

      alvo = encontrados[0] ?? null;
    }

    if (alvo?.convidado) {
      throw new AppError(400, "Não é possível adicionar um convidado como amigo");
    }

    if (alvo) {
      if (alvo.id === usuarioId) {
        throw new AppError(400, "Você não pode adicionar a si mesmo");
      }

      const existente = await buscarEntreUsuarios(usuarioId, alvo.id);

      if (existente?.status === "ACEITO") {
        throw new AppError(409, "Vocês já são amigos");
      }

      if (existente?.status === "PENDENTE" && existente.solicitanteId === usuarioId) {
        throw new AppError(409, "Convite já enviado");
      }

      if (existente?.status === "PENDENTE" && existente.destinatarioId === usuarioId) {
        const aceita = await prisma.amizade.update({
          where: { id: existente.id },
          data: { status: "ACEITO" },
          include: includeAmizade,
        });

        return apresentar(aceita, usuarioId);
      }

      if (existente?.status === "RECUSADO") {
        const reaberta = await prisma.amizade.update({
          where: { id: existente.id },
          data: { solicitanteId: usuarioId, destinatarioId: alvo.id, status: "PENDENTE", tipo: "USUARIO" },
          include: includeAmizade,
        });

        return apresentar(reaberta, usuarioId);
      }

      const criada = await prisma.amizade.create({
        data: { solicitanteId: usuarioId, destinatarioId: alvo.id, tipo: "USUARIO", status: "PENDENTE" },
        include: includeAmizade,
      });

      return apresentar(criada, usuarioId);
    }

    if (!dados.nome?.trim()) {
      throw new AppError(404, "Usuário não encontrado. Informe o nome para cadastrar um contato externo");
    }

    const filtrosExternos = [];
    if (email) filtrosExternos.push({ emailContato: email });
    if (telefone) filtrosExternos.push({ telefoneContato: telefone });

    if (filtrosExternos.length > 0) {
      const duplicado = await prisma.amizade.findFirst({
        where: { solicitanteId: usuarioId, tipo: "EXTERNO", OR: filtrosExternos },
      });

      if (duplicado) {
        throw new AppError(409, "Este contato já está na sua lista");
      }
    }

    const contato = await prisma.amizade.create({
      data: {
        solicitanteId: usuarioId,
        tipo: "EXTERNO",
        status: "ACEITO",
        nomeContato: dados.nome.trim(),
        emailContato: email ?? null,
        telefoneContato: telefone ?? null,
      },
      include: includeAmizade,
    });

    return apresentar(contato, usuarioId);
  },

  async responder(usuarioId: string, amizadeId: string, dados: StatusAmizadeInput) {
    const amizade = await prisma.amizade.findUnique({ where: { id: amizadeId }, include: includeAmizade });

    if (!amizade || amizade.destinatarioId !== usuarioId) {
      throw new AppError(404, "Convite não encontrado");
    }

    if (amizade.status !== "PENDENTE") {
      throw new AppError(400, "Este convite não está pendente");
    }

    const atualizada = await prisma.amizade.update({
      where: { id: amizadeId },
      data: { status: dados.status },
      include: includeAmizade,
    });

    return apresentar(atualizada, usuarioId);
  },

  async remover(usuarioId: string, amizadeId: string) {
    const amizade = await prisma.amizade.findUnique({ where: { id: amizadeId } });
    const participa = amizade?.solicitanteId === usuarioId || amizade?.destinatarioId === usuarioId;

    if (!amizade || !participa) {
      throw new AppError(404, "Amizade não encontrada");
    }

    await prisma.amizade.delete({ where: { id: amizadeId } });
    return { mensagem: "Amizade removida" };
  },
};
