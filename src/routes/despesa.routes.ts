import { Router } from "express";
import { despesaController } from "../controllers/despesa.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { despesaIdParamSchema, itemParamSchema } from "../types/comum.schema";
import { atualizarDespesaSchema, atualizarItemSchema, itemDespesaSchema } from "../types/despesa.schema";

export const despesaRoutes = Router();

despesaRoutes.use(authMiddleware);
despesaRoutes.get("/:despesaId", validar(despesaIdParamSchema, "params"), despesaController.obter);
despesaRoutes.patch("/:despesaId", validar(despesaIdParamSchema, "params"), validar(atualizarDespesaSchema), despesaController.atualizar);
despesaRoutes.delete("/:despesaId", validar(despesaIdParamSchema, "params"), despesaController.excluir);
despesaRoutes.post("/:despesaId/itens", validar(despesaIdParamSchema, "params"), validar(itemDespesaSchema), despesaController.adicionarItem);
despesaRoutes.patch("/:despesaId/itens/:itemId", validar(itemParamSchema, "params"), validar(atualizarItemSchema), despesaController.atualizarItem);
despesaRoutes.delete("/:despesaId/itens/:itemId", validar(itemParamSchema, "params"), despesaController.removerItem);
