import { Router } from "express";
import { prisma } from "../lib/prisma";
import { amigoRoutes } from "./amigo.routes";
import { authRoutes } from "./auth.routes";
import { categoriaRoutes } from "./categoria.routes";
import { cobrancaRoutes, dividaRoutes } from "./divida.routes";
import { despesaRoutes } from "./despesa.routes";
import { grupoRoutes } from "./grupo.routes";
import { historicoRoutes } from "./historico.routes";
import { pixRoutes } from "./pix.routes";
import { usuarioRoutes } from "./usuario.routes";

export const routes = Router();

routes.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: "ok", servico: "rachaconta-api" } });
  } catch {
    res.status(503).json({ erro: { mensagem: "Banco de dados indisponível" } });
  }
});

routes.use("/auth", authRoutes);
routes.use("/me", usuarioRoutes);
routes.use("/categorias", categoriaRoutes);
routes.use("/pix", pixRoutes);
routes.use("/amigos", amigoRoutes);
routes.use("/grupos", grupoRoutes);
routes.use("/despesas", despesaRoutes);
routes.use("/dividas", dividaRoutes);
routes.use("/cobrancas", cobrancaRoutes);
routes.use("/historico", historicoRoutes);
