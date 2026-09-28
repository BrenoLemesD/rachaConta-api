import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type TokenPayload = {
  sub: string;
  convidado: boolean;
  tv: number;
};

export function assinarToken(payload: TokenPayload): string {
  const opcoes: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, opcoes);
}

export function verificarToken(token: string): TokenPayload {
  const decodificado = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;

  if (!decodificado.sub || typeof decodificado.tv !== "number") {
    throw new Error("Token inválido");
  }

  return {
    sub: decodificado.sub,
    convidado: Boolean(decodificado.convidado),
    tv: decodificado.tv,
  };
}
