import { Router } from "express";
import { historicoController } from "../controllers/historico.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { historicoQuerySchema } from "../types/consulta.schema";

export const historicoRoutes = Router();

historicoRoutes.use(authMiddleware);
historicoRoutes.get("/", validar(historicoQuerySchema, "query"), historicoController.listar);
