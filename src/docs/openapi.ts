import { OpenAPIV3 } from "openapi-types";

const bearer: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];

function corpo(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject, exemplo?: unknown): OpenAPIV3.RequestBodyObject {
  return {
    required: true,
    content: {
      "application/json": {
        schema,
        ...(exemplo !== undefined ? { example: exemplo } : {}),
      },
    },
  };
}

function resposta(
  descricao: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  exemplo?: unknown,
): OpenAPIV3.ResponseObject {
  return {
    description: descricao,
    content: {
      "application/json": {
        schema,
        ...(exemplo !== undefined ? { example: exemplo } : {}),
      },
    },
  };
}

function envelope(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject {
  return {
    type: "object",
    required: ["data"],
    properties: { data: schema },
  };
}

function ref(nome: string): OpenAPIV3.ReferenceObject {
  return { $ref: `#/components/schemas/${nome}` };
}

function uuidParam(nome: string, descricao: string): OpenAPIV3.ParameterObject {
  return {
    name: nome,
    in: "path",
    required: true,
    description: descricao,
    schema: { type: "string", format: "uuid" },
  };
}

const erros = {
  400: resposta("Dados inválidos", ref("Erro")),
  401: resposta("Não autenticado", ref("Erro")),
  403: resposta("Sem permissão", ref("Erro")),
  404: resposta("Não encontrado", ref("Erro")),
  409: resposta("Conflito", ref("Erro")),
} satisfies Record<string, OpenAPIV3.ResponseObject>;

const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  Erro: {
    type: "object",
    required: ["erro"],
    properties: {
      erro: {
        type: "object",
        required: ["mensagem"],
        properties: {
          mensagem: { type: "string", example: "Dados inválidos" },
          detalhes: { description: "Detalhes da validação, quando houver" },
        },
      },
    },
  },
  Mensagem: {
    type: "object",
    required: ["mensagem"],
    properties: { mensagem: { type: "string", example: "Operação concluída" } },
  },
  UsuarioResumo: {
    type: "object",
    required: ["id", "nome"],
    properties: {
      id: { type: "string", format: "uuid" },
      nome: { type: "string", example: "Ana Silva" },
      email: { type: "string", format: "email", nullable: true },
      telefone: { type: "string", nullable: true, example: "11999999999" },
      fotoUrl: { type: "string", nullable: true },
    },
  },
  Usuario: {
    allOf: [
      { $ref: "#/components/schemas/UsuarioResumo" },
      {
        type: "object",
        required: ["convidado", "tema", "cor", "moedaPadrao", "googleVinculado", "criadoEm"],
        properties: {
          convidado: { type: "boolean" },
          tema: { type: "string", enum: ["CLARO", "ESCURO"] },
          cor: { type: "string", example: "#16A34A" },
          moedaPadrao: { type: "string", example: "BRL" },
          googleVinculado: { type: "boolean" },
          criadoEm: { type: "string", format: "date-time" },
        },
      },
    ],
  },
  Sessao: {
    type: "object",
    required: ["token", "usuario"],
    properties: {
      token: { type: "string", description: "JWT para o header Authorization" },
      usuario: ref("Usuario"),
    },
  },
  Preferencias: {
    type: "object",
    required: ["tema", "cor", "moedaPadrao"],
    properties: {
      tema: { type: "string", enum: ["CLARO", "ESCURO"] },
      cor: { type: "string", example: "#16A34A" },
      moedaPadrao: { type: "string", example: "BRL" },
    },
  },
  Categoria: {
    type: "object",
    required: ["id", "nome", "icone", "cor", "arquivada", "sistema"],
    properties: {
      id: { type: "string", format: "uuid" },
      nome: { type: "string", example: "Restaurante" },
      icone: { type: "string", example: "restaurante" },
      cor: { type: "string", example: "#DC2626" },
      usuarioId: { type: "string", format: "uuid", nullable: true },
      arquivada: { type: "boolean" },
      sistema: { type: "boolean" },
      criadoEm: { type: "string", format: "date-time" },
      atualizadoEm: { type: "string", format: "date-time" },
    },
  },
  CategoriaInput: {
    type: "object",
    required: ["nome", "icone", "cor"],
    properties: {
      nome: { type: "string", minLength: 2, maxLength: 40, example: "Mercado" },
      icone: { type: "string", example: "mercado" },
      cor: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$", example: "#16A34A" },
    },
  },
  ChavePix: {
    type: "object",
    required: ["id", "tipo", "valor", "nomeTitular"],
    properties: {
      id: { type: "string", format: "uuid" },
      usuarioId: { type: "string", format: "uuid" },
      tipo: { type: "string", enum: ["CPF", "EMAIL", "TELEFONE", "ALEATORIA"] },
      valor: { type: "string", example: "12345678901" },
      nomeTitular: { type: "string", example: "Ana Silva" },
      criadoEm: { type: "string", format: "date-time" },
      atualizadoEm: { type: "string", format: "date-time" },
    },
  },
  PixInput: {
    type: "object",
    required: ["tipo", "valor", "nomeTitular"],
    properties: {
      tipo: { type: "string", enum: ["CPF", "EMAIL", "TELEFONE", "ALEATORIA"] },
      valor: { type: "string", example: "12345678901" },
      nomeTitular: { type: "string", example: "Ana Silva" },
    },
  },
  Amigo: {
    type: "object",
    required: ["id", "tipo", "status"],
    properties: {
      id: { type: "string", format: "uuid" },
      tipo: { type: "string", enum: ["USUARIO", "EXTERNO"], description: "USUARIO tem conta; EXTERNO é contato sem cadastro" },
      status: { type: "string", enum: ["PENDENTE", "ACEITO", "RECUSADO"] },
      criadoEm: { type: "string", format: "date-time" },
      amigo: { allOf: [ref("UsuarioResumo")], nullable: true },
      contato: {
        type: "object",
        nullable: true,
        properties: {
          nome: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          telefone: { type: "string", nullable: true },
        },
      },
    },
  },
  ListaAmigos: {
    type: "object",
    required: ["amigos", "convitesRecebidos", "convitesEnviados"],
    properties: {
      amigos: { type: "array", items: ref("Amigo") },
      convitesRecebidos: { type: "array", items: ref("Amigo") },
      convitesEnviados: { type: "array", items: ref("Amigo") },
    },
  },
  GrupoResumo: {
    type: "object",
    required: ["id", "nome", "moeda", "papel", "saldoPessoalCentavos"],
    properties: {
      id: { type: "string", format: "uuid" },
      nome: { type: "string", example: "Churrasco" },
      descricao: { type: "string", nullable: true },
      imagemUrl: { type: "string", nullable: true },
      moeda: { type: "string", example: "BRL" },
      prazoPagamentoDias: { type: "integer", example: 7 },
      recorrencia: { type: "string", nullable: true },
      papel: { type: "string", enum: ["ADMIN", "MEMBRO"] },
      totalMembros: { type: "integer", example: 2 },
      saldoPessoalCentavos: {
        type: "integer",
        description: "Positivo: o grupo deve para você. Negativo: você deve ao grupo.",
        example: 5500,
      },
      criadoEm: { type: "string", format: "date-time" },
    },
  },
  Grupo: {
    allOf: [
      { $ref: "#/components/schemas/GrupoResumo" },
      {
        type: "object",
        properties: {
          codigoConvite: { type: "string", example: "a1b2c3d4e5f6" },
          linkConvite: { type: "string", example: "http://localhost:5173/convite/a1b2c3d4e5f6" },
          atualizadoEm: { type: "string", format: "date-time" },
        },
      },
    ],
  },
  GrupoInput: {
    type: "object",
    required: ["nome"],
    properties: {
      nome: { type: "string", minLength: 2, maxLength: 80, example: "Churrasco" },
      descricao: { type: "string", nullable: true, example: "Grupo do churrasco de domingo" },
      imagemUrl: { type: "string", nullable: true },
      moeda: { type: "string", example: "BRL" },
      prazoPagamentoDias: { type: "integer", minimum: 0, maximum: 365, example: 7 },
      recorrencia: { type: "string", nullable: true, example: "mensal" },
    },
  },
  Membro: {
    type: "object",
    required: ["id", "papel", "usuario"],
    properties: {
      id: { type: "string", format: "uuid" },
      papel: { type: "string", enum: ["ADMIN", "MEMBRO"] },
      entrouEm: { type: "string", format: "date-time" },
      usuario: {
        allOf: [
          { $ref: "#/components/schemas/UsuarioResumo" },
          {
            type: "object",
            properties: { convidado: { type: "boolean" } },
          },
        ],
      },
    },
  },
  Convite: {
    type: "object",
    required: ["codigo", "link"],
    properties: {
      codigo: { type: "string", example: "a1b2c3d4e5f6" },
      link: { type: "string", example: "http://localhost:5173/convite/a1b2c3d4e5f6" },
    },
  },
  Pagador: {
    type: "object",
    required: ["usuario", "valorCentavos"],
    properties: {
      usuario: ref("UsuarioResumo"),
      valorCentavos: { type: "integer", example: 11000 },
    },
  },
  Participante: {
    type: "object",
    required: ["usuario", "valorCentavos"],
    properties: {
      usuario: ref("UsuarioResumo"),
      percentual: { type: "number", nullable: true, example: 50 },
      valorCentavos: { type: "integer", example: 5500 },
    },
  },
  ItemDespesa: {
    type: "object",
    required: ["descricao", "valorCentavos"],
    properties: {
      id: { type: "string", format: "uuid" },
      descricao: { type: "string", example: "Pizza" },
      valorCentavos: { type: "integer", example: 10000 },
      participantes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            usuario: ref("UsuarioResumo"),
            valorCentavos: { type: "integer" },
          },
        },
      },
    },
  },
  ItemDespesaInput: {
    type: "object",
    required: ["descricao", "valorCentavos"],
    properties: {
      descricao: { type: "string", example: "Pizza" },
      valorCentavos: { type: "integer", example: 10000 },
      participantes: {
        type: "array",
        items: {
          type: "object",
          required: ["usuarioId", "valorCentavos"],
          properties: {
            usuarioId: { type: "string", format: "uuid" },
            valorCentavos: { type: "integer" },
          },
        },
      },
    },
  },
  Despesa: {
    type: "object",
    required: ["id", "descricao", "valorTotalCentavos", "modoDivisao"],
    properties: {
      id: { type: "string", format: "uuid" },
      grupoId: { type: "string", format: "uuid" },
      descricao: { type: "string", example: "Jantar" },
      categoria: { allOf: [ref("Categoria")], nullable: true },
      valorBaseCentavos: { type: "integer", example: 10000 },
      percentualServico: { type: "number", example: 10 },
      valorServicoCentavos: { type: "integer", example: 1000 },
      taxaExtraCentavos: { type: "integer", example: 0 },
      valorTotalCentavos: { type: "integer", example: 11000 },
      modoDivisao: { type: "string", enum: ["IGUAL", "PERCENTUAL", "VALOR"] },
      prazoPagamento: { type: "string", format: "date-time" },
      criadoPor: { type: "object", properties: { id: { type: "string" }, nome: { type: "string" } } },
      atualizadoPor: { type: "object", nullable: true },
      criadoEm: { type: "string", format: "date-time" },
      atualizadoEm: { type: "string", format: "date-time" },
      pagadores: { type: "array", items: ref("Pagador") },
      participantes: { type: "array", items: ref("Participante") },
      itens: { type: "array", items: ref("ItemDespesa") },
      auditorias: { type: "array", items: { type: "object" } },
    },
  },
  DespesaInput: {
    type: "object",
    required: ["descricao", "modoDivisao", "pagadores", "participantes"],
    properties: {
      descricao: { type: "string", example: "Jantar" },
      categoriaId: { type: "string", format: "uuid", nullable: true },
      valorCentavos: { type: "integer", description: "Valor base em centavos. Obrigatório se não houver itens.", example: 10000 },
      percentualServico: { type: "number", minimum: 0, maximum: 100, example: 10 },
      taxaExtraCentavos: { type: "integer", minimum: 0, example: 0 },
      modoDivisao: {
        type: "string",
        enum: ["IGUAL", "PERCENTUAL", "VALOR"],
        description: "PERCENTUAL: cada participante informa percentual (soma 100). VALOR: cada um informa valorCentavos (soma o total com serviço e taxa).",
      },
      prazoPagamento: { type: "string", format: "date", example: "2026-10-05", description: "Se omitido, herda o prazo do grupo" },
      pagadores: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["usuarioId"],
          properties: {
            usuarioId: { type: "string", format: "uuid" },
            valorCentavos: { type: "integer", description: "Obrigatório se houver mais de um pagador" },
          },
        },
      },
      participantes: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["usuarioId"],
          properties: {
            usuarioId: { type: "string", format: "uuid" },
            percentual: { type: "number", description: "Usado em modo PERCENTUAL" },
            valorCentavos: { type: "integer", description: "Usado em modo VALOR" },
          },
        },
      },
      itens: { type: "array", items: ref("ItemDespesaInput") },
    },
    example: {
      descricao: "Jantar",
      valorCentavos: 10000,
      percentualServico: 10,
      taxaExtraCentavos: 0,
      modoDivisao: "IGUAL",
      pagadores: [{ usuarioId: "11111111-1111-1111-1111-111111111111" }],
      participantes: [
        { usuarioId: "11111111-1111-1111-1111-111111111111" },
        { usuarioId: "22222222-2222-2222-2222-222222222222" },
      ],
    },
  },
  SaldoParticipante: {
    type: "object",
    properties: {
      usuario: ref("UsuarioResumo"),
      totalPagoCentavos: { type: "integer", example: 11000 },
      totalDevidoCentavos: { type: "integer", example: 5500 },
      saldoLiquidoCentavos: { type: "integer", example: 5500, description: "pago − devido" },
      saldoAbertoCentavos: { type: "integer", description: "Líquido já descontando quitações e calotes" },
    },
  },
  Divida: {
    type: "object",
    required: ["id", "valorCentavos", "status", "credor", "devedor"],
    properties: {
      id: { type: "string", format: "uuid" },
      grupoId: { type: "string", format: "uuid" },
      valorCentavos: { type: "integer", example: 5500 },
      status: { type: "string", enum: ["EM_ABERTO", "QUITADA", "CALOTE"] },
      vencimento: { type: "string", format: "date-time", nullable: true },
      cobrancas: { type: "integer" },
      ultimaCobranca: { type: "string", format: "date-time", nullable: true },
      credor: ref("UsuarioResumo"),
      devedor: ref("UsuarioResumo"),
      criadoEm: { type: "string", format: "date-time" },
    },
  },
  Saldos: {
    type: "object",
    required: ["saldos", "transferencias"],
    properties: {
      saldos: { type: "array", items: ref("SaldoParticipante") },
      transferencias: { type: "array", items: ref("Divida"), description: "Lista gulosa de quem paga para quem" },
    },
  },
  Cobranca: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      mensagem: { type: "string" },
      valorCentavos: { type: "integer" },
      criadoEm: { type: "string", format: "date-time" },
      credor: ref("UsuarioResumo"),
      devedor: ref("UsuarioResumo"),
      grupo: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          moeda: { type: "string" },
        },
      },
    },
  },
  Historico: {
    type: "object",
    required: ["despesas", "quantidade", "totais"],
    properties: {
      despesas: { type: "array", items: { type: "object" } },
      quantidade: { type: "integer" },
      totais: {
        type: "object",
        properties: {
          totalPagoCentavos: { type: "integer", description: "Soma do que você pagou nas despesas filtradas" },
          totalRecebidoCentavos: { type: "integer", description: "Soma das dívidas quitadas em que você é credor" },
        },
      },
    },
  },
};

const paths: OpenAPIV3.PathsObject = {
  "/health": {
    get: {
      tags: ["Saúde"],
      summary: "Checagem do serviço e do banco",
      security: [],
      responses: {
        200: resposta("API e banco ok", envelope({ type: "object", properties: { status: { type: "string" }, servico: { type: "string" } } })),
        503: resposta("Banco indisponível", ref("Erro")),
      },
    },
  },
  "/auth/registrar": {
    post: {
      tags: ["Autenticação"],
      summary: "Cadastrar usuário",
      security: [],
      requestBody: corpo(ref("RegistrarInput"), {
        nome: "Ana Silva",
        email: "ana@rachaconta.dev",
        senha: "senha1234",
        confirmarSenha: "senha1234",
        telefone: "11999999999",
      }),
      responses: {
        201: resposta("Conta criada", envelope(ref("Sessao"))),
        400: erros[400],
        409: erros[409],
      },
    },
  },
  "/auth/entrar": {
    post: {
      tags: ["Autenticação"],
      summary: "Entrar com e-mail e senha",
      security: [],
      requestBody: corpo({
        type: "object",
        required: ["email", "senha"],
        properties: {
          email: { type: "string", format: "email", example: "ana@rachaconta.dev" },
          senha: { type: "string", example: "senha1234" },
        },
      }),
      responses: {
        200: resposta("Sessão iniciada", envelope(ref("Sessao"))),
        401: erros[401],
      },
    },
  },
  "/auth/google": {
    post: {
      tags: ["Autenticação"],
      summary: "Entrar com Google",
      description: "Exige `GOOGLE_CLIENT_ID` no ambiente.",
      security: [],
      requestBody: corpo({
        type: "object",
        required: ["idToken"],
        properties: { idToken: { type: "string" } },
      }),
      responses: {
        200: resposta("Sessão iniciada", envelope(ref("Sessao"))),
        401: erros[401],
        501: resposta("Google não configurado", ref("Erro")),
      },
    },
  },
  "/auth/convidado": {
    post: {
      tags: ["Autenticação"],
      summary: "Entrar como convidado",
      description: "Cria uma sessão restrita: sem Pix e sem entrar em grupos de terceiros.",
      security: [],
      responses: { 201: resposta("Sessão de convidado", envelope(ref("Sessao"))) },
    },
  },
  "/auth/recuperar-senha": {
    post: {
      tags: ["Autenticação"],
      summary: "Pedir recuperação de senha",
      description: "Em desenvolvimento, se o e-mail existir, a resposta pode incluir `tokenDesenvolvimento`.",
      security: [],
      requestBody: corpo({
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      }),
      responses: { 200: resposta("Pedido aceito", envelope({ type: "object", properties: { mensagem: { type: "string" }, tokenDesenvolvimento: { type: "string" } } })) },
    },
  },
  "/auth/redefinir-senha": {
    post: {
      tags: ["Autenticação"],
      summary: "Redefinir senha com o token do e-mail",
      security: [],
      requestBody: corpo({
        type: "object",
        required: ["token", "novaSenha", "confirmarNovaSenha"],
        properties: {
          token: { type: "string" },
          novaSenha: { type: "string", minLength: 8 },
          confirmarNovaSenha: { type: "string", minLength: 8 },
        },
      }),
      responses: {
        200: resposta("Senha redefinida", envelope(ref("Mensagem"))),
        400: erros[400],
      },
    },
  },
  "/auth/sair": {
    post: {
      tags: ["Autenticação"],
      summary: "Encerrar sessão",
      description: "Invalida o token atual incrementando a versão da sessão.",
      security: bearer,
      responses: {
        200: resposta("Sessão encerrada", envelope(ref("Mensagem"))),
        401: erros[401],
      },
    },
  },
  "/me": {
    get: {
      tags: ["Perfil"],
      summary: "Obter usuário autenticado",
      security: bearer,
      responses: { 200: resposta("Perfil", envelope(ref("Usuario"))), 401: erros[401] },
    },
    patch: {
      tags: ["Perfil"],
      summary: "Atualizar perfil",
      security: bearer,
      requestBody: corpo({
        type: "object",
        properties: {
          nome: { type: "string" },
          email: { type: "string", format: "email" },
          telefone: { type: "string", nullable: true },
          fotoUrl: { type: "string", nullable: true },
        },
      }),
      responses: { 200: resposta("Perfil atualizado", envelope(ref("Usuario"))), 400: erros[400], 401: erros[401], 409: erros[409] },
    },
  },
  "/me/senha": {
    patch: {
      tags: ["Perfil"],
      summary: "Alterar senha",
      description: "Devolve um token novo. A senha atual precisa conferir.",
      security: bearer,
      requestBody: corpo({
        type: "object",
        required: ["senhaAtual", "novaSenha", "confirmarNovaSenha"],
        properties: {
          senhaAtual: { type: "string" },
          novaSenha: { type: "string", minLength: 8 },
          confirmarNovaSenha: { type: "string", minLength: 8 },
        },
      }),
      responses: { 200: resposta("Senha alterada", envelope({ type: "object", properties: { mensagem: { type: "string" }, token: { type: "string" }, usuario: ref("Usuario") } })), 401: erros[401] },
    },
  },
  "/me/preferencias": {
    get: {
      tags: ["Perfil"],
      summary: "Obter preferências",
      security: bearer,
      responses: { 200: resposta("Preferências", envelope(ref("Preferencias"))), 401: erros[401] },
    },
    patch: {
      tags: ["Perfil"],
      summary: "Atualizar tema, cor e moeda padrão",
      security: bearer,
      requestBody: corpo({
        type: "object",
        properties: {
          tema: { type: "string", enum: ["CLARO", "ESCURO"] },
          cor: { type: "string", example: "#16A34A" },
          moedaPadrao: { type: "string", example: "BRL" },
        },
      }),
      responses: { 200: resposta("Preferências atualizadas", envelope(ref("Preferencias"))), 400: erros[400], 401: erros[401] },
    },
  },
  "/categorias": {
    get: {
      tags: ["Categorias"],
      summary: "Listar categorias do sistema e do usuário",
      security: bearer,
      parameters: [
        {
          name: "incluirArquivadas",
          in: "query",
          schema: { type: "string", enum: ["true", "false"] },
          description: "Passe `true` para incluir categorias arquivadas",
        },
      ],
      responses: { 200: resposta("Lista de categorias", envelope({ type: "array", items: ref("Categoria") })), 401: erros[401] },
    },
    post: {
      tags: ["Categorias"],
      summary: "Criar categoria pessoal",
      security: bearer,
      requestBody: corpo(ref("CategoriaInput")),
      responses: { 201: resposta("Categoria criada", envelope(ref("Categoria"))), 400: erros[400], 409: erros[409] },
    },
  },
  "/categorias/{id}": {
    patch: {
      tags: ["Categorias"],
      summary: "Editar categoria pessoal",
      security: bearer,
      parameters: [uuidParam("id", "ID da categoria")],
      requestBody: corpo({
        type: "object",
        properties: {
          nome: { type: "string" },
          icone: { type: "string" },
          cor: { type: "string" },
          arquivada: { type: "boolean" },
        },
      }),
      responses: { 200: resposta("Categoria atualizada", envelope(ref("Categoria"))), 403: erros[403], 404: erros[404] },
    },
    delete: {
      tags: ["Categorias"],
      summary: "Arquivar categoria",
      description: "Não apaga de verdade, para não quebrar o histórico de despesas.",
      security: bearer,
      parameters: [uuidParam("id", "ID da categoria")],
      responses: { 200: resposta("Categoria arquivada", envelope(ref("Categoria"))), 403: erros[403], 404: erros[404] },
    },
  },
  "/pix": {
    get: {
      tags: ["Pix"],
      summary: "Listar chaves Pix",
      description: "Indisponível no modo convidado.",
      security: bearer,
      responses: { 200: resposta("Chaves Pix", envelope({ type: "array", items: ref("ChavePix") })), 403: erros[403] },
    },
    post: {
      tags: ["Pix"],
      summary: "Cadastrar chave Pix",
      security: bearer,
      requestBody: corpo(ref("PixInput")),
      responses: { 201: resposta("Chave criada", envelope(ref("ChavePix"))), 400: erros[400], 403: erros[403], 409: erros[409] },
    },
  },
  "/pix/{id}": {
    patch: {
      tags: ["Pix"],
      summary: "Atualizar chave Pix",
      security: bearer,
      parameters: [uuidParam("id", "ID da chave")],
      requestBody: corpo(ref("PixInput")),
      responses: { 200: resposta("Chave atualizada", envelope(ref("ChavePix"))), 404: erros[404] },
    },
    delete: {
      tags: ["Pix"],
      summary: "Remover chave Pix",
      security: bearer,
      parameters: [uuidParam("id", "ID da chave")],
      responses: { 200: resposta("Chave removida", envelope(ref("Mensagem"))), 404: erros[404] },
    },
  },
  "/amigos": {
    get: {
      tags: ["Amigos"],
      summary: "Listar amigos e convites",
      security: bearer,
      responses: { 200: resposta("Lista de amigos", envelope(ref("ListaAmigos"))), 401: erros[401] },
    },
    post: {
      tags: ["Amigos"],
      summary: "Adicionar amigo ou contato externo",
      description: "Se encontrar um usuário cadastrado, cria convite. Se não encontrar, envie `nome` para cadastrar um contato externo.",
      security: bearer,
      requestBody: corpo({
        type: "object",
        properties: {
          usuarioId: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          telefone: { type: "string" },
          nome: { type: "string", description: "Obrigatório para contato externo" },
        },
      }),
      responses: { 201: resposta("Amizade criada", envelope(ref("Amigo"))), 400: erros[400], 404: erros[404], 409: erros[409] },
    },
  },
  "/amigos/busca": {
    post: {
      tags: ["Amigos"],
      summary: "Buscar usuário por e-mail ou telefone",
      security: bearer,
      requestBody: corpo({
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          telefone: { type: "string" },
        },
      }),
      responses: { 200: resposta("Usuários encontrados", envelope({ type: "object", properties: { usuarios: { type: "array", items: ref("UsuarioResumo") } } })) },
    },
  },
  "/amigos/{id}": {
    patch: {
      tags: ["Amigos"],
      summary: "Aceitar ou recusar convite",
      security: bearer,
      parameters: [uuidParam("id", "ID da amizade")],
      requestBody: corpo({
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", enum: ["ACEITO", "RECUSADO"] } },
      }),
      responses: { 200: resposta("Convite atualizado", envelope(ref("Amigo"))), 404: erros[404] },
    },
    delete: {
      tags: ["Amigos"],
      summary: "Remover amizade ou convite",
      security: bearer,
      parameters: [uuidParam("id", "ID da amizade")],
      responses: { 200: resposta("Amizade removida", envelope(ref("Mensagem"))), 404: erros[404] },
    },
  },
  "/grupos": {
    get: {
      tags: ["Grupos"],
      summary: "Listar grupos do usuário",
      security: bearer,
      responses: { 200: resposta("Grupos", envelope({ type: "array", items: ref("GrupoResumo") })), 401: erros[401] },
    },
    post: {
      tags: ["Grupos"],
      summary: "Criar grupo",
      description: "O criador entra como administrador. A moeda, se omitida, usa a preferência do usuário.",
      security: bearer,
      requestBody: corpo(ref("GrupoInput")),
      responses: { 201: resposta("Grupo criado", envelope(ref("Grupo"))), 400: erros[400] },
    },
  },
  "/grupos/entrar": {
    post: {
      tags: ["Grupos"],
      summary: "Entrar em grupo pelo código de convite",
      description: "Convidado não pode entrar em grupo de terceiros.",
      security: bearer,
      requestBody: corpo({
        type: "object",
        required: ["codigo"],
        properties: { codigo: { type: "string", example: "a1b2c3d4e5f6" } },
      }),
      responses: { 200: resposta("Entrada confirmada", envelope(ref("Grupo"))), 403: erros[403], 404: erros[404] },
    },
  },
  "/grupos/{grupoId}": {
    get: {
      tags: ["Grupos"],
      summary: "Obter grupo",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      responses: { 200: resposta("Grupo", envelope(ref("Grupo"))), 403: erros[403] },
    },
    patch: {
      tags: ["Grupos"],
      summary: "Editar configurações do grupo",
      description: "Somente administrador.",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      requestBody: corpo(ref("GrupoInput")),
      responses: { 200: resposta("Grupo atualizado", envelope(ref("Grupo"))), 403: erros[403] },
    },
    delete: {
      tags: ["Grupos"],
      summary: "Excluir grupo",
      description: "Somente administrador.",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      responses: { 200: resposta("Grupo excluído", envelope(ref("Mensagem"))), 403: erros[403] },
    },
  },
  "/grupos/{grupoId}/convite": {
    get: {
      tags: ["Grupos"],
      summary: "Obter código e link de convite",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      responses: { 200: resposta("Convite atual", envelope(ref("Convite"))) },
    },
    post: {
      tags: ["Grupos"],
      summary: "Renovar código de convite",
      description: "Invalida o código anterior. Somente administrador.",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      responses: { 200: resposta("Novo convite", envelope(ref("Convite"))), 403: erros[403] },
    },
  },
  "/grupos/{grupoId}/membros": {
    get: {
      tags: ["Grupos"],
      summary: "Listar membros",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      responses: { 200: resposta("Membros", envelope({ type: "array", items: ref("Membro") })) },
    },
    post: {
      tags: ["Grupos"],
      summary: "Adicionar membro",
      description: "Somente administrador. Informe `usuarioId` ou `email`.",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      requestBody: corpo({
        type: "object",
        properties: {
          usuarioId: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
        },
      }),
      responses: { 201: resposta("Membro adicionado", envelope({ type: "array", items: ref("Membro") })), 403: erros[403], 404: erros[404], 409: erros[409] },
    },
  },
  "/grupos/{grupoId}/membros/{usuarioId}": {
    patch: {
      tags: ["Grupos"],
      summary: "Alterar papel do membro",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo"), uuidParam("usuarioId", "ID do membro")],
      requestBody: corpo({
        type: "object",
        required: ["papel"],
        properties: { papel: { type: "string", enum: ["ADMIN", "MEMBRO"] } },
      }),
      responses: { 200: resposta("Papel atualizado", envelope({ type: "array", items: ref("Membro") })), 400: erros[400], 403: erros[403] },
    },
    delete: {
      tags: ["Grupos"],
      summary: "Remover membro ou sair do grupo",
      description: "Admin remove outros. Qualquer membro pode sair. O último admin não pode sair sem promover outro.",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo"), uuidParam("usuarioId", "ID do membro")],
      responses: { 200: resposta("Membro removido", envelope(ref("Mensagem"))), 400: erros[400], 403: erros[403] },
    },
  },
  "/grupos/{grupoId}/roleta": {
    post: {
      tags: ["Grupos"],
      summary: "Sortear quem paga a conta",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                usuarioIds: {
                  type: "array",
                  items: { type: "string", format: "uuid" },
                  description: "Se informado, o sorteio fica restrito a esses membros",
                },
              },
            },
          },
        },
      },
      responses: { 200: resposta("Membro sorteado", envelope({ type: "object", properties: { usuario: ref("UsuarioResumo") } })), 400: erros[400] },
    },
  },
  "/grupos/{grupoId}/saldos": {
    get: {
      tags: ["Saldos e dívidas"],
      summary: "Saldos líquidos e transferências simplificadas",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      responses: { 200: resposta("Saldos do grupo", envelope(ref("Saldos"))) },
    },
  },
  "/grupos/{grupoId}/dividas": {
    get: {
      tags: ["Saldos e dívidas"],
      summary: "Listar dívidas do grupo",
      security: bearer,
      parameters: [
        uuidParam("grupoId", "ID do grupo"),
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["EM_ABERTO", "QUITADA", "CALOTE"] },
        },
      ],
      responses: { 200: resposta("Dívidas", envelope({ type: "array", items: ref("Divida") })) },
    },
  },
  "/grupos/{grupoId}/despesas": {
    get: {
      tags: ["Despesas"],
      summary: "Listar despesas do grupo",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      responses: { 200: resposta("Despesas", envelope({ type: "array", items: ref("Despesa") })) },
    },
    post: {
      tags: ["Despesas"],
      summary: "Cadastrar despesa",
      description: "Recalcula saldos e grava auditoria. Valores em centavos.",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      requestBody: corpo(ref("DespesaInput")),
      responses: { 201: resposta("Despesa criada", envelope(ref("Despesa"))), 400: erros[400] },
    },
  },
  "/grupos/{grupoId}/despesas/preview": {
    post: {
      tags: ["Despesas"],
      summary: "Pré-visualizar divisão da despesa",
      description: "Mesmo corpo do cadastro. Não persiste.",
      security: bearer,
      parameters: [uuidParam("grupoId", "ID do grupo")],
      requestBody: corpo(ref("DespesaInput")),
      responses: { 200: resposta("Prévia do rateio", envelope(ref("Despesa"))), 400: erros[400] },
    },
  },
  "/despesas/{despesaId}": {
    get: {
      tags: ["Despesas"],
      summary: "Obter despesa com auditoria",
      security: bearer,
      parameters: [uuidParam("despesaId", "ID da despesa")],
      responses: { 200: resposta("Despesa", envelope(ref("Despesa"))), 404: erros[404] },
    },
    patch: {
      tags: ["Despesas"],
      summary: "Editar despesa",
      description: "Recalcula saldos automaticamente.",
      security: bearer,
      parameters: [uuidParam("despesaId", "ID da despesa")],
      requestBody: corpo(ref("DespesaInput")),
      responses: { 200: resposta("Despesa atualizada", envelope(ref("Despesa"))), 400: erros[400], 404: erros[404] },
    },
    delete: {
      tags: ["Despesas"],
      summary: "Excluir despesa",
      description: "Exclusão lógica com trilha de auditoria e recálculo de saldos.",
      security: bearer,
      parameters: [uuidParam("despesaId", "ID da despesa")],
      responses: { 200: resposta("Despesa excluída", envelope(ref("Mensagem"))), 404: erros[404] },
    },
  },
  "/despesas/{despesaId}/itens": {
    post: {
      tags: ["Despesas"],
      summary: "Adicionar item à despesa",
      security: bearer,
      parameters: [uuidParam("despesaId", "ID da despesa")],
      requestBody: corpo(ref("ItemDespesaInput")),
      responses: { 201: resposta("Item adicionado", envelope(ref("Despesa"))), 400: erros[400] },
    },
  },
  "/despesas/{despesaId}/itens/{itemId}": {
    patch: {
      tags: ["Despesas"],
      summary: "Editar item da despesa",
      security: bearer,
      parameters: [uuidParam("despesaId", "ID da despesa"), uuidParam("itemId", "ID do item")],
      requestBody: corpo(ref("ItemDespesaInput")),
      responses: { 200: resposta("Item atualizado", envelope(ref("Despesa"))), 404: erros[404] },
    },
    delete: {
      tags: ["Despesas"],
      summary: "Remover item da despesa",
      security: bearer,
      parameters: [uuidParam("despesaId", "ID da despesa"), uuidParam("itemId", "ID do item")],
      responses: { 200: resposta("Item removido", envelope(ref("Despesa"))), 404: erros[404] },
    },
  },
  "/dividas/{dividaId}/quitar": {
    post: {
      tags: ["Saldos e dívidas"],
      summary: "Quitar dívida",
      description: "Credor ou devedor. Sem `valorCentavos`, quita o valor inteiro.",
      security: bearer,
      parameters: [uuidParam("dividaId", "ID da dívida")],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { valorCentavos: { type: "integer", example: 2000, description: "Quitação parcial" } },
            },
          },
        },
      },
      responses: { 200: resposta("Dívida quitada", envelope(ref("Mensagem"))), 400: erros[400], 403: erros[403] },
    },
  },
  "/dividas/{dividaId}/cobrar": {
    post: {
      tags: ["Saldos e dívidas"],
      summary: "Enviar cobrança ao devedor",
      description: "Somente o credor, e só em dívida em aberto.",
      security: bearer,
      parameters: [uuidParam("dividaId", "ID da dívida")],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { mensagem: { type: "string", maxLength: 280 } },
            },
          },
        },
      },
      responses: { 200: resposta("Cobrança enviada", envelope(ref("Cobranca"))), 400: erros[400], 403: erros[403] },
    },
  },
  "/dividas/{dividaId}/calote": {
    post: {
      tags: ["Saldos e dívidas"],
      summary: "Marcar dívida como calote",
      description: "Somente o credor e somente depois do vencimento.",
      security: bearer,
      parameters: [uuidParam("dividaId", "ID da dívida")],
      responses: { 200: resposta("Calote registrado", envelope(ref("Mensagem"))), 403: erros[403] },
    },
  },
  "/cobrancas": {
    get: {
      tags: ["Saldos e dívidas"],
      summary: "Listar cobranças recebidas",
      security: bearer,
      responses: { 200: resposta("Cobranças", envelope({ type: "array", items: ref("Cobranca") })) },
    },
  },
  "/historico": {
    get: {
      tags: ["Histórico"],
      summary: "Histórico consolidado de despesas",
      security: bearer,
      parameters: [
        { name: "grupoId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "categoriaId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "dataInicio", in: "query", schema: { type: "string", format: "date" }, description: "AAAA-MM-DD" },
        { name: "dataFim", in: "query", schema: { type: "string", format: "date" }, description: "AAAA-MM-DD" },
        { name: "valorMinCentavos", in: "query", schema: { type: "integer" } },
        { name: "valorMaxCentavos", in: "query", schema: { type: "integer" } },
      ],
      responses: { 200: resposta("Histórico filtrado", envelope(ref("Historico"))), 400: erros[400] },
    },
  },
};

schemas.RegistrarInput = {
  type: "object",
  required: ["nome", "email", "senha", "confirmarSenha"],
  properties: {
    nome: { type: "string", minLength: 2, maxLength: 120 },
    email: { type: "string", format: "email" },
    senha: { type: "string", minLength: 8, maxLength: 72 },
    confirmarSenha: { type: "string", minLength: 8, maxLength: 72 },
    telefone: { type: "string", nullable: true },
  },
};

export const openapi: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "RachaConta API",
    version: "1.0.0",
    description: [
      "Backend do RachaConta. Valores financeiros entram e saem em **centavos** (inteiros).",
      "",
      "Use **Authorize** com o JWT devolvido no cadastro ou login (`Bearer <token>`).",
      "",
      "Saldo pessoal positivo significa que o grupo deve para você.",
    ].join("\n"),
  },
  servers: [{ url: "/api", description: "API local" }],
  tags: [
    { name: "Saúde", description: "Disponibilidade do serviço" },
    { name: "Autenticação", description: "Cadastro, login, Google, convidado e senha" },
    { name: "Perfil", description: "Dados pessoais e preferências" },
    { name: "Categorias", description: "Categorias do sistema e do usuário. Excluir arquiva." },
    { name: "Pix", description: "Chaves Pix. Bloqueado no modo convidado." },
    { name: "Amigos", description: "Usuários cadastrados e contatos externos" },
    { name: "Grupos", description: "CRUD, convites, membros e roleta" },
    { name: "Despesas", description: "Rateio igual, percentual ou por valor, com prévia" },
    { name: "Saldos e dívidas", description: "Simplificação gulosa, cobrança, quitação e calote" },
    { name: "Histórico", description: "Despesas de todos os grupos, com filtros" },
  ],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Cole o token devolvido em `/auth/entrar` ou `/auth/registrar`.",
      },
    },
    schemas,
  },
  security: bearer,
};
