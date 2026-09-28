import { Router } from "express";
import { amigoController } from "../controllers/amigo.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { buscarAmigoSchema, criarAmigoSchema, statusAmizadeSchema } from "../types/amigo.schema";
import { idParamSchema } from "../types/comum.schema";

export const amigoRoutes = Router();

amigoRoutes.use(authMiddleware);
amigoRoutes.get("/", amigoController.listar);
amigoRoutes.post("/busca", validar(buscarAmigoSchema), amigoController.buscar);
amigoRoutes.post("/", validar(criarAmigoSchema), amigoController.criar);
amigoRoutes.patch("/:id", validar(idParamSchema, "params"), validar(statusAmizadeSchema), amigoController.responder);
amigoRoutes.delete("/:id", validar(idParamSchema, "params"), amigoController.remover);
