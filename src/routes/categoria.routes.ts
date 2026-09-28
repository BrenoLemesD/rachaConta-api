import { Router } from "express";
import { categoriaController } from "../controllers/categoria.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { atualizarCategoriaSchema, categoriaSchema, listarCategoriasQuerySchema } from "../types/categoria.schema";
import { idParamSchema } from "../types/comum.schema";

export const categoriaRoutes = Router();

categoriaRoutes.use(authMiddleware);
categoriaRoutes.get("/", validar(listarCategoriasQuerySchema, "query"), categoriaController.listar);
categoriaRoutes.post("/", validar(categoriaSchema), categoriaController.criar);
categoriaRoutes.patch("/:id", validar(idParamSchema, "params"), validar(atualizarCategoriaSchema), categoriaController.atualizar);
categoriaRoutes.delete("/:id", validar(idParamSchema, "params"), categoriaController.arquivar);
