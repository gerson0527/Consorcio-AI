-- pgvector es opcional en el Postgres local. Con la extensión, el embedding queda en vector(384).
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector no está instalado: %', SQLERRM;
END $$;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ANALISTA', 'AUDITOR');

-- CreateEnum
CREATE TYPE "TipoEntidad" AS ENUM ('BANCO', 'FINANCIERA', 'COOPERATIVA');

-- CreateEnum
CREATE TYPE "TipoCredito" AS ENUM ('LIBRANZA', 'VEHICULO', 'VIVIENDA', 'CONSUMO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PENDIENTE', 'PROCESANDO', 'PROCESADO', 'REVISAR', 'ERROR');

-- CreateEnum
CREATE TYPE "OrigenRegla" AS ENUM ('MANUAL', 'SUGERIDA_IA');

-- CreateEnum
CREATE TYPE "EstadoRegla" AS ENUM ('ACTIVA', 'PENDIENTE', 'RECHAZADA', 'ARCHIVADA');

-- CreateEnum
CREATE TYPE "ResultadoReal" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoEntidad" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Entidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Politica" (
    "id" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "archivoKey" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "subidaPorId" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Politica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fragmento" (
    "id" TEXT NOT NULL,
    "politicaId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "seccion" TEXT,
    "pagina" INTEGER,
    "texto" TEXT NOT NULL,

    CONSTRAINT "Fragmento_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    EXECUTE 'ALTER TABLE "Fragmento" ADD COLUMN embedding vector(384)';
  ELSE
    EXECUTE 'ALTER TABLE "Fragmento" ADD COLUMN embedding text';
  END IF;
END $$;

-- CreateTable
CREATE TABLE "Regla" (
    "id" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "tipoCredito" "TipoCredito",
    "campo" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "mensaje" TEXT NOT NULL,
    "origen" "OrigenRegla" NOT NULL,
    "estado" "EstadoRegla" NOT NULL,
    "evidencia" JSONB,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decididaPorId" TEXT,
    "decididaEn" TIMESTAMP(3),

    CONSTRAINT "Regla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documentoHash" TEXT NOT NULL,
    "documentoCifrado" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suprimidoEn" TIMESTAMP(3),

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consentimiento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "finalidad" TEXT NOT NULL,
    "otorgadoEn" TIMESTAMP(3) NOT NULL,
    "evidenciaKey" TEXT,

    CONSTRAINT "Consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caso" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoCredito" "TipoCredito" NOT NULL,
    "perfil" JSONB,
    "analistaId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "archivoKey" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PENDIENTE',
    "datosExtraidos" JSONB,
    "confianza" DOUBLE PRECISION,
    "observaciones" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "politicaId" TEXT NOT NULL,
    "cumpleReglas" BOOLEAN NOT NULL,
    "reglasDetalle" JSONB NOT NULL,
    "probabilidad" DOUBLE PRECISION,
    "confianza" TEXT NOT NULL,
    "ranking" INTEGER NOT NULL,
    "explicacion" TEXT NOT NULL,
    "citas" JSONB NOT NULL,
    "modeloIA" TEXT NOT NULL,
    "versionPrompt" TEXT NOT NULL,
    "veredicto" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resultado" (
    "id" TEXT NOT NULL,
    "evaluacionId" TEXT NOT NULL,
    "estado" "ResultadoReal" NOT NULL,
    "motivo" TEXT,
    "registradoPorId" TEXT NOT NULL,
    "registradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resultado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calibracion" (
    "id" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "muestras" INTEGER NOT NULL,
    "aprobacionPredicha" DOUBLE PRECISION NOT NULL,
    "aprobacionReal" DOUBLE PRECISION NOT NULL,
    "parametros" JSONB NOT NULL,
    "calculadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calibracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "accion" TEXT NOT NULL,
    "objetoTipo" TEXT NOT NULL,
    "objetoId" TEXT,
    "detalle" JSONB NOT NULL,
    "ip" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Entidad_nombre_key" ON "Entidad"("nombre");

-- CreateIndex
CREATE INDEX "Politica_entidadId_vigente_idx" ON "Politica"("entidadId", "vigente");

-- CreateIndex
CREATE UNIQUE INDEX "Politica_entidadId_version_key" ON "Politica"("entidadId", "version");

-- CreateIndex
CREATE INDEX "Fragmento_politicaId_orden_idx" ON "Fragmento"("politicaId", "orden");

-- CreateIndex
CREATE INDEX "Regla_entidadId_estado_idx" ON "Regla"("entidadId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_documentoHash_key" ON "Cliente"("documentoHash");

-- CreateIndex
CREATE INDEX "Caso_clienteId_idx" ON "Caso"("clienteId");

-- CreateIndex
CREATE INDEX "Caso_analistaId_idx" ON "Caso"("analistaId");

-- CreateIndex
CREATE INDEX "Evaluacion_casoId_ranking_idx" ON "Evaluacion"("casoId", "ranking");

-- CreateIndex
CREATE INDEX "Evaluacion_entidadId_idx" ON "Evaluacion"("entidadId");

-- CreateIndex
CREATE UNIQUE INDEX "Resultado_evaluacionId_key" ON "Resultado"("evaluacionId");

-- CreateIndex
CREATE INDEX "Calibracion_entidadId_calculadaEn_idx" ON "Calibracion"("entidadId", "calculadaEn");

-- CreateIndex
CREATE INDEX "AuditLog_objetoTipo_objetoId_idx" ON "AuditLog"("objetoTipo", "objetoId");

-- CreateIndex
CREATE INDEX "AuditLog_creadoEn_idx" ON "AuditLog"("creadoEn");

-- AddForeignKey
ALTER TABLE "Politica" ADD CONSTRAINT "Politica_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "Entidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Politica" ADD CONSTRAINT "Politica_subidaPorId_fkey" FOREIGN KEY ("subidaPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fragmento" ADD CONSTRAINT "Fragmento_politicaId_fkey" FOREIGN KEY ("politicaId") REFERENCES "Politica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regla" ADD CONSTRAINT "Regla_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "Entidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regla" ADD CONSTRAINT "Regla_decididaPorId_fkey" FOREIGN KEY ("decididaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimiento" ADD CONSTRAINT "Consentimiento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "Entidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_politicaId_fkey" FOREIGN KEY ("politicaId") REFERENCES "Politica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultado" ADD CONSTRAINT "Resultado_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "Evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultado" ADD CONSTRAINT "Resultado_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calibracion" ADD CONSTRAINT "Calibracion_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "Entidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
