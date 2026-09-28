import { Router } from "express";
import { usuarioController } from "../controllers/usuario.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { alterarSenhaSchema } from "../types/auth.schema";
import { atualizarPerfilSchema, preferenciasSchema } from "../types/usuario.schema";

export const usuarioRoutes = Router();

usuarioRoutes.use(authMiddleware);
usuarioRoutes.get("/", usuarioController.eu);
usuarioRoutes.patch("/", validar(atualizarPerfilSchema), usuarioController.atualizar);
usuarioRoutes.patch("/senha", validar(alterarSenhaSchema), usuarioController.alterarSenha);
usuarioRoutes.get("/preferencias", usuarioController.preferencias);
usuarioRoutes.patch("/preferencias", validar(preferenciasSchema), usuarioController.atualizarPreferencias);
