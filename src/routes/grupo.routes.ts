import { Router } from "express";
import { despesaController } from "../controllers/despesa.controller";
import { grupoController } from "../controllers/grupo.controller";
import { saldoController } from "../controllers/saldo.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import { listarDividasQuerySchema } from "../types/consulta.schema";
import { grupoIdParamSchema, membroParamSchema } from "../types/comum.schema";
import { despesaSchema } from "../types/despesa.schema";
import {
  adicionarMembroSchema,
  atualizarGrupoSchema,
  criarGrupoSchema,
  entrarGrupoSchema,
  papelMembroSchema,
  roletaSchema,
} from "../types/grupo.schema";

export const grupoRoutes = Router();

grupoRoutes.use(authMiddleware);
grupoRoutes.get("/", grupoController.listar);
grupoRoutes.post("/", validar(criarGrupoSchema), grupoController.criar);
grupoRoutes.post("/entrar", validar(entrarGrupoSchema), grupoController.entrar);
grupoRoutes.get("/:grupoId", validar(grupoIdParamSchema, "params"), grupoController.obter);
grupoRoutes.patch("/:grupoId", validar(grupoIdParamSchema, "params"), validar(atualizarGrupoSchema), grupoController.atualizar);
grupoRoutes.delete("/:grupoId", validar(grupoIdParamSchema, "params"), grupoController.excluir);
grupoRoutes.get("/:grupoId/convite", validar(grupoIdParamSchema, "params"), grupoController.convite);
grupoRoutes.post("/:grupoId/convite", validar(grupoIdParamSchema, "params"), grupoController.renovarConvite);
grupoRoutes.get("/:grupoId/membros", validar(grupoIdParamSchema, "params"), grupoController.listarMembros);
grupoRoutes.post("/:grupoId/membros", validar(grupoIdParamSchema, "params"), validar(adicionarMembroSchema), grupoController.adicionarMembro);
grupoRoutes.delete("/:grupoId/membros/:usuarioId", validar(membroParamSchema, "params"), grupoController.removerMembro);
grupoRoutes.patch("/:grupoId/membros/:usuarioId", validar(membroParamSchema, "params"), validar(papelMembroSchema), grupoController.alterarPapel);
grupoRoutes.post("/:grupoId/roleta", validar(grupoIdParamSchema, "params"), validar(roletaSchema), grupoController.roleta);
grupoRoutes.get("/:grupoId/saldos", validar(grupoIdParamSchema, "params"), saldoController.listar);
grupoRoutes.get("/:grupoId/dividas", validar(grupoIdParamSchema, "params"), validar(listarDividasQuerySchema, "query"), saldoController.listarDividas);
grupoRoutes.get("/:grupoId/despesas", validar(grupoIdParamSchema, "params"), despesaController.listar);
grupoRoutes.post("/:grupoId/despesas/preview", validar(grupoIdParamSchema, "params"), validar(despesaSchema), despesaController.previsualizar);
grupoRoutes.post("/:grupoId/despesas", validar(grupoIdParamSchema, "params"), validar(despesaSchema), despesaController.criar);
