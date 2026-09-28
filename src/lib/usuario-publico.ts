export type UsuarioFonte = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  fotoUrl: string | null;
  convidado: boolean;
  tema: string;
  cor: string;
  moedaPadrao: string;
  googleId?: string | null;
  criadoEm: Date;
};

export function usuarioPublico(usuario: UsuarioFonte) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    fotoUrl: usuario.fotoUrl,
    convidado: usuario.convidado,
    tema: usuario.tema,
    cor: usuario.cor,
    moedaPadrao: usuario.moedaPadrao,
    googleVinculado: Boolean(usuario.googleId),
    criadoEm: usuario.criadoEm,
  };
}

export const usuarioResumoSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  fotoUrl: true,
} as const;
