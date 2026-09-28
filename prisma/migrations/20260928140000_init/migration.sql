-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Tema" AS ENUM ('CLARO', 'ESCURO');

-- CreateEnum
CREATE TYPE "TipoChavePix" AS ENUM ('CPF', 'EMAIL', 'TELEFONE', 'ALEATORIA');

-- CreateEnum
CREATE TYPE "StatusAmizade" AS ENUM ('PENDENTE', 'ACEITO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "TipoAmizade" AS ENUM ('USUARIO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "PapelGrupo" AS ENUM ('ADMIN', 'MEMBRO');

-- CreateEnum
CREATE TYPE "ModoDivisao" AS ENUM ('IGUAL', 'PERCENTUAL', 'VALOR');

-- CreateEnum
CREATE TYPE "StatusDivida" AS ENUM ('EM_ABERTO', 'QUITADA', 'CALOTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "senhaHash" TEXT,
    "telefone" TEXT,
    "fotoUrl" TEXT,
    "googleId" TEXT,
    "convidado" BOOLEAN NOT NULL DEFAULT false,
    "tema" "Tema" NOT NULL DEFAULT 'CLARO',
    "cor" TEXT NOT NULL DEFAULT '#16A34A',
    "moedaPadrao" TEXT NOT NULL DEFAULT 'BRL',
    "tokenVersao" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "usuarioId" TEXT,
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChavePix" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoChavePix" NOT NULL,
    "valor" TEXT NOT NULL,
    "nomeTitular" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChavePix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amizade" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "destinatarioId" TEXT,
    "tipo" "TipoAmizade" NOT NULL,
    "status" "StatusAmizade" NOT NULL DEFAULT 'PENDENTE',
    "nomeContato" TEXT,
    "emailContato" TEXT,
    "telefoneContato" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amizade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "prazoPagamentoDias" INTEGER NOT NULL DEFAULT 7,
    "recorrencia" TEXT,
    "codigoConvite" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoUsuario" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "papel" "PapelGrupo" NOT NULL DEFAULT 'MEMBRO',
    "entrouEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrupoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConviteGrupo" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConviteGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "descricao" TEXT NOT NULL,
    "valorBaseCentavos" INTEGER NOT NULL,
    "percentualServicoBps" INTEGER NOT NULL DEFAULT 0,
    "taxaExtraCentavos" INTEGER NOT NULL DEFAULT 0,
    "valorTotalCentavos" INTEGER NOT NULL,
    "modoDivisao" "ModoDivisao" NOT NULL,
    "prazoPagamento" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "atualizadoPorId" TEXT,
    "excluidoPorId" TEXT,
    "excluidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespesaPagador" (
    "id" TEXT NOT NULL,
    "despesaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,

    CONSTRAINT "DespesaPagador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespesaParticipante" (
    "id" TEXT NOT NULL,
    "despesaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "percentualBps" INTEGER,
    "valorCentavos" INTEGER NOT NULL,

    CONSTRAINT "DespesaParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDespesa" (
    "id" TEXT NOT NULL,
    "despesaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,

    CONSTRAINT "ItemDespesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemParticipante" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,

    CONSTRAINT "ItemParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Divida" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "credorId" TEXT NOT NULL,
    "devedorId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "status" "StatusDivida" NOT NULL DEFAULT 'EM_ABERTO',
    "vencimento" TIMESTAMP(3),
    "cobrancas" INTEGER NOT NULL DEFAULT 0,
    "ultimaCobranca" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Divida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobranca" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "dividaId" TEXT,
    "credorId" TEXT NOT NULL,
    "devedorId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "mensagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaDespesa" (
    "id" TEXT NOT NULL,
    "despesaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaDespesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResetSenhaToken" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetSenhaToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");

-- CreateIndex
CREATE INDEX "Categoria_usuarioId_idx" ON "Categoria"("usuarioId");

-- CreateIndex
CREATE INDEX "Categoria_sistema_idx" ON "Categoria"("sistema");

-- CreateIndex
CREATE INDEX "ChavePix_usuarioId_idx" ON "ChavePix"("usuarioId");

-- CreateIndex
CREATE INDEX "Amizade_solicitanteId_idx" ON "Amizade"("solicitanteId");

-- CreateIndex
CREATE INDEX "Amizade_destinatarioId_idx" ON "Amizade"("destinatarioId");

-- CreateIndex
CREATE INDEX "Amizade_status_idx" ON "Amizade"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_codigoConvite_key" ON "Grupo"("codigoConvite");

-- CreateIndex
CREATE INDEX "Grupo_criadoPorId_idx" ON "Grupo"("criadoPorId");

-- CreateIndex
CREATE INDEX "GrupoUsuario_grupoId_idx" ON "GrupoUsuario"("grupoId");

-- CreateIndex
CREATE INDEX "GrupoUsuario_usuarioId_idx" ON "GrupoUsuario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoUsuario_grupoId_usuarioId_key" ON "GrupoUsuario"("grupoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteGrupo_codigo_key" ON "ConviteGrupo"("codigo");

-- CreateIndex
CREATE INDEX "ConviteGrupo_grupoId_idx" ON "ConviteGrupo"("grupoId");

-- CreateIndex
CREATE INDEX "Despesa_grupoId_idx" ON "Despesa"("grupoId");

-- CreateIndex
CREATE INDEX "Despesa_grupoId_excluidoEm_idx" ON "Despesa"("grupoId", "excluidoEm");

-- CreateIndex
CREATE INDEX "Despesa_categoriaId_idx" ON "Despesa"("categoriaId");

-- CreateIndex
CREATE INDEX "Despesa_criadoPorId_idx" ON "Despesa"("criadoPorId");

-- CreateIndex
CREATE INDEX "Despesa_criadoEm_idx" ON "Despesa"("criadoEm");

-- CreateIndex
CREATE INDEX "DespesaPagador_despesaId_idx" ON "DespesaPagador"("despesaId");

-- CreateIndex
CREATE INDEX "DespesaPagador_usuarioId_idx" ON "DespesaPagador"("usuarioId");

-- CreateIndex
CREATE INDEX "DespesaParticipante_despesaId_idx" ON "DespesaParticipante"("despesaId");

-- CreateIndex
CREATE INDEX "DespesaParticipante_usuarioId_idx" ON "DespesaParticipante"("usuarioId");

-- CreateIndex
CREATE INDEX "ItemDespesa_despesaId_idx" ON "ItemDespesa"("despesaId");

-- CreateIndex
CREATE INDEX "ItemParticipante_itemId_idx" ON "ItemParticipante"("itemId");

-- CreateIndex
CREATE INDEX "ItemParticipante_usuarioId_idx" ON "ItemParticipante"("usuarioId");

-- CreateIndex
CREATE INDEX "Divida_grupoId_idx" ON "Divida"("grupoId");

-- CreateIndex
CREATE INDEX "Divida_grupoId_status_idx" ON "Divida"("grupoId", "status");

-- CreateIndex
CREATE INDEX "Divida_credorId_idx" ON "Divida"("credorId");

-- CreateIndex
CREATE INDEX "Divida_devedorId_idx" ON "Divida"("devedorId");

-- CreateIndex
CREATE INDEX "Cobranca_grupoId_idx" ON "Cobranca"("grupoId");

-- CreateIndex
CREATE INDEX "Cobranca_credorId_idx" ON "Cobranca"("credorId");

-- CreateIndex
CREATE INDEX "Cobranca_devedorId_idx" ON "Cobranca"("devedorId");

-- CreateIndex
CREATE INDEX "AuditoriaDespesa_despesaId_idx" ON "AuditoriaDespesa"("despesaId");

-- CreateIndex
CREATE INDEX "AuditoriaDespesa_usuarioId_idx" ON "AuditoriaDespesa"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ResetSenhaToken_tokenHash_key" ON "ResetSenhaToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ResetSenhaToken_usuarioId_idx" ON "ResetSenhaToken"("usuarioId");

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChavePix" ADD CONSTRAINT "ChavePix_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoUsuario" ADD CONSTRAINT "GrupoUsuario_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoUsuario" ADD CONSTRAINT "GrupoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteGrupo" ADD CONSTRAINT "ConviteGrupo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteGrupo" ADD CONSTRAINT "ConviteGrupo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_excluidoPorId_fkey" FOREIGN KEY ("excluidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaPagador" ADD CONSTRAINT "DespesaPagador_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaPagador" ADD CONSTRAINT "DespesaPagador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaParticipante" ADD CONSTRAINT "DespesaParticipante_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaParticipante" ADD CONSTRAINT "DespesaParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDespesa" ADD CONSTRAINT "ItemDespesa_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemParticipante" ADD CONSTRAINT "ItemParticipante_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemDespesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemParticipante" ADD CONSTRAINT "ItemParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divida" ADD CONSTRAINT "Divida_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divida" ADD CONSTRAINT "Divida_credorId_fkey" FOREIGN KEY ("credorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divida" ADD CONSTRAINT "Divida_devedorId_fkey" FOREIGN KEY ("devedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_credorId_fkey" FOREIGN KEY ("credorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_devedorId_fkey" FOREIGN KEY ("devedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaDespesa" ADD CONSTRAINT "AuditoriaDespesa_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaDespesa" ADD CONSTRAINT "AuditoriaDespesa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResetSenhaToken" ADD CONSTRAINT "ResetSenhaToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
