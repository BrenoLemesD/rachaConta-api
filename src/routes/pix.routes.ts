import { Router } from "express";
import { pixController } from "../controllers/pix.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { bloquearConvidado } from "../middlewares/convidado.middleware";
import { validar } from "../middlewares/validate.middleware";
import { idParamSchema } from "../types/comum.schema";
import { pixSchema } from "../types/pix.schema";

export const pixRoutes = Router();

pixRoutes.use(authMiddleware, bloquearConvidado);
pixRoutes.get("/", pixController.listar);
pixRoutes.post("/", validar(pixSchema), pixController.criar);
pixRoutes.patch("/:id", validar(idParamSchema, "params"), validar(pixSchema), pixController.atualizar);
pixRoutes.delete("/:id", validar(idParamSchema, "params"), pixController.remover);
