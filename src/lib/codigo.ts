import { randomBytes } from "crypto";

export function gerarCodigoConvite(): string {
  return randomBytes(6).toString("hex");
}
