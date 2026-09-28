# RachaConta API

Backend do RachaConta em Node.js e TypeScript. Valores financeiros trafegam e são persistidos em **centavos** (inteiros).

## Subir o projeto

1. Suba o Postgres:

```bash
docker compose up -d
```

2. Copie o ambiente, se ainda não existir `.env`:

```bash
copy .env.example .env
```

3. Instale, crie as tabelas e rode as categorias padrão (Viagem, Bar, Restaurante e iFood):

```bash
npm install
npx prisma generate
npm run db:setup
npm run dev
```

A API sobe em `http://localhost:3333`. Confira `GET /api/health`.

A documentação interativa fica em [`http://localhost:3333/api/docs`](http://localhost:3333/api/docs). O JSON OpenAPI está em `/api/docs.json`. Depois do login, use **Authorize** e cole o JWT.

## Autenticação

Envie `Authorization: Bearer <token>` nas rotas protegidas. O login devolve o token.

- `POST /api/auth/registrar` — nome, email, senha, confirmarSenha, telefone opcional
- `POST /api/auth/entrar` — email e senha
- `POST /api/auth/google` — `{ "idToken" }`, exige `GOOGLE_CLIENT_ID`
- `POST /api/auth/convidado` — sessão sem conta
- `POST /api/auth/recuperar-senha` — em desenvolvimento a resposta inclui `tokenDesenvolvimento` se o e-mail existir; com SMTP configurado, o link vai por e-mail
- `POST /api/auth/redefinir-senha` — token, novaSenha, confirmarNovaSenha
- `POST /api/auth/sair` — invalida o token atual

Modo convidado não cadastra Pix e não entra em grupo de outra pessoa. Pode criar o próprio grupo.

## Perfil, categorias, Pix e amigos

- `GET /api/me` e `PATCH /api/me`
- `PATCH /api/me/senha` — senhaAtual, novaSenha, confirmarNovaSenha; devolve um token novo
- `GET|PATCH /api/me/preferencias` — tema (`CLARO` ou `ESCURO`), cor e moedaPadrao
- `GET|POST /api/categorias`, `PATCH|DELETE /api/categorias/:id` — excluir arquiva, para não quebrar o histórico
- `GET|POST /api/pix`, `PATCH|DELETE /api/pix/:id`
- `GET /api/amigos`
- `POST /api/amigos/busca` — email ou telefone
- `POST /api/amigos` — usuário existente vira convite; se não existir, envie `nome` para criar contato externo
- `PATCH /api/amigos/:id` — `{ "status": "ACEITO" | "RECUSADO" }`
- `DELETE /api/amigos/:id`

## Grupos

- `GET|POST /api/grupos`
- `POST /api/grupos/entrar` — `{ "codigo" }`
- `GET|PATCH|DELETE /api/grupos/:grupoId`
- `GET|POST /api/grupos/:grupoId/convite` — o POST renova o código (admin)
- `GET|POST /api/grupos/:grupoId/membros`
- `PATCH|DELETE /api/grupos/:grupoId/membros/:usuarioId` — papel `ADMIN` ou `MEMBRO`
- `POST /api/grupos/:grupoId/roleta` — sorteia um membro; body opcional `{ "usuarioIds": [] }`
- `GET /api/grupos/:grupoId/saldos`
- `GET /api/grupos/:grupoId/dividas?status=EM_ABERTO|QUITADA|CALOTE`

A listagem de grupos traz `saldoPessoalCentavos`: positivo significa que o grupo deve para você.

## Despesas

`POST /api/grupos/:grupoId/despesas` e `POST /api/grupos/:grupoId/despesas/preview` recebem o mesmo corpo. O preview só calcula.

```json
{
  "descricao": "Jantar",
  "valorCentavos": 10000,
  "categoriaId": null,
  "percentualServico": 10,
  "taxaExtraCentavos": 0,
  "modoDivisao": "IGUAL",
  "prazoPagamento": "2026-10-05",
  "pagadores": [{ "usuarioId": "..." }],
  "participantes": [{ "usuarioId": "..." }, { "usuarioId": "..." }],
  "itens": [{ "descricao": "Pizza", "valorCentavos": 10000 }]
}
```

`modoDivisao`: `IGUAL`, `PERCENTUAL` (campo `percentual`, soma 100) ou `VALOR` (campo `valorCentavos`, soma igual ao total já com serviço e taxa). Se houver um pagador sem valor, ele assume a conta inteira. O prazo omisso herda `prazoPagamentoDias` do grupo.

- `GET /api/grupos/:grupoId/despesas`
- `GET|PATCH|DELETE /api/despesas/:despesaId`
- `POST /api/despesas/:despesaId/itens`
- `PATCH|DELETE /api/despesas/:despesaId/itens/:itemId`

Edição e exclusão recalculam os saldos e gravam auditoria.

## Dívidas, cobrança e histórico

- `POST /api/dividas/:dividaId/quitar` — body opcional `{ "valorCentavos" }` para quitação parcial
- `POST /api/dividas/:dividaId/cobrar` — só o credor; body opcional `{ "mensagem" }`
- `POST /api/dividas/:dividaId/calote` — só o credor e só depois do vencimento
- `GET /api/cobrancas` — lembretes recebidos
- `GET /api/historico` — filtros `grupoId`, `categoriaId`, `dataInicio`, `dataFim`, `valorMinCentavos`, `valorMaxCentavos`

O saldo líquido é total pago menos total devido. As transferências em aberto vêm do algoritmo guloso, já descontando quitações e calotes.

## Testes

```bash
npm test
```
