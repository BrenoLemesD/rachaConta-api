export type UsuarioToken = {
  id: string;
  convidado: boolean;
  tokenVersao: number;
};

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export {};
