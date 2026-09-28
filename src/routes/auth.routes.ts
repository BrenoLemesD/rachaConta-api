import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { googleSchema, loginSchema, recuperarSenhaSchema, redefinirSenhaSchema, registrarSchema } from "../types/auth.schema";

export const authRoutes = Router();

authRoutes.post("/registrar", validar(registrarSchema), authController.registrar);
authRoutes.post("/entrar", validar(loginSchema), authController.entrar);
authRoutes.post("/google", validar(googleSchema), authController.google);
authRoutes.post("/convidado", authController.convidado);
authRoutes.post("/recuperar-senha", validar(recuperarSenhaSchema), authController.recuperarSenha);
authRoutes.post("/redefinir-senha", validar(redefinirSenhaSchema), authController.redefinirSenha);
authRoutes.post("/sair", authMiddleware, authController.sair);
