# RachaConta API — instruções para o agente

Backend Node.js + TypeScript do aplicativo RachaConta. Não implemente frontend neste repositório.

Responda em português. Commits e mensagens de PR também em português, no infinitivo ou com verbo no presente, focando o motivo da mudança.

## Stack

- Express 4, TypeScript strict, Zod, Prisma, PostgreSQL, JWT, Vitest
- Swagger em `/api/docs` (spec em `src/docs/openapi.ts`)
- Valores financeiros **sempre em centavos (inteiro)**. Nunca use `float`/`number` decimal para dinheiro persistido ou calculado.

## Estrutura em `src`

Siga este formato ao criar ou alterar endpoints:

```
src/
  index.ts              # bootstrap
  app.ts                # Express, Helmet, CORS, Swagger
  controllers/          # req/res apenas; chama o service
  services/             # regra de negócio e Prisma
  routes/               # monta verbos, middlewares e validação
  types/                # schemas Zod + tipos inferidos
  middlewares/          # auth, convidado, validate, error
  lib/                  # prisma, jwt, AppError, helpers
  docs/                 # OpenAPI + Swagger UI
```

Fluxo de uma rota nova: `types` → `service` → `controller` → `route` → atualizar `src/docs/openapi.ts`.

## Convenções

- Resposta de sucesso: `{ data: ... }`. Erro: `{ erro: { mensagem, detalhes? } }` via `AppError`.
- Validar body/query/params com Zod e `validar(schema, fonte)`.
- Rotas autenticadas usam `authMiddleware` e `Authorization: Bearer <token>`.
- Modo convidado: sem Pix e sem entrar em grupos de terceiros (`bloquearConvidado` / checagens no service).
- Categorias do sistema não se apagam: exclusão arquiva.
- Edição/exclusão de despesa recalcula saldos e grava `AuditoriaDespesa`.
- Calote: só o credor e só após o vencimento.
- Divisão: `IGUAL`, `PERCENTUAL` (soma 100%) ou `VALOR` (soma = total já com serviço e taxa). Use `divisao.service` e `simplificacao.service`.
- Controle de acesso a grupo: `obterMembro` / `obterAdmin`.
- Não commitar `.env`. Use `.env.example`.

## Exemplo

```ts
// route
router.post("/", authMiddleware, validar(criarSchema), controller.criar);

// controller
export const xController = {
  criar: asyncHandler(async (req, res) => {
    const data = await xService.criar(usuarioAtual(req).id, req.body);
    res.status(201).json({ data });
  }),
};
```

Não coloque Prisma nem regra de saldo no controller.

## Comandos

```bash
docker compose up -d
npm install
npx prisma generate
npm run db:setup
npm run dev          # http://localhost:3333
npm test
npx tsc --noEmit
```

Prisma: altere `prisma/schema.prisma` e gere migration versionada. Seed só para categorias padrão (Viagem, Bar, Restaurante, iFood).

## Testes

Toda mudança em rateio, centavos ou algoritmo guloso precisa de teste em `tests/`. Rode `npm test` antes de encerrar.
