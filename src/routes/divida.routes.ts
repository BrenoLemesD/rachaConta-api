import { Router } from "express";
import { saldoController } from "../controllers/saldo.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { cobrarDividaSchema, quitarDividaSchema } from "../types/consulta.schema";
import { dividaIdParamSchema } from "../types/comum.schema";

export const dividaRoutes = Router();

dividaRoutes.use(authMiddleware);
dividaRoutes.post("/:dividaId/quitar", validar(dividaIdParamSchema, "params"), validar(quitarDividaSchema), saldoController.quitar);
dividaRoutes.post("/:dividaId/cobrar", validar(dividaIdParamSchema, "params"), validar(cobrarDividaSchema), saldoController.cobrar);
dividaRoutes.post("/:dividaId/calote", validar(dividaIdParamSchema, "params"), saldoController.calote);

export const cobrancaRoutes = Router();

cobrancaRoutes.use(authMiddleware);
cobrancaRoutes.get("/", saldoController.cobrancas);
