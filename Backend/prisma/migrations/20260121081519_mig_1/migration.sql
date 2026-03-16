-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN_PUSAT', 'ADMIN_CABANG', 'USER_BIASA');

-- CreateEnum
CREATE TYPE "Cabang" AS ENUM ('KPS', 'CGO', 'CGK', 'DPS', 'SUB', 'UPG', 'KNO', 'AAP', 'AMQ', 'BDJ', 'BKS', 'BPN', 'BTH', 'BTJ', 'BWX', 'DJB', 'DJJ', 'DTB', 'FLZ', 'GNS', 'HLP', 'YIA', 'KOE', 'LBJ', 'LOP', 'MDC', 'MKQ', 'MKW', 'PDG', 'PGK', 'PKU', 'PLM', 'PNK', 'SOC', 'SRG', 'TJQ', 'TKG', 'TNJ', 'BIK', 'KJT');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('EFFECTIVE', 'NOT_EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'NOT_STARTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('ADMIN_ACCESS', 'PASSWORD_RESET', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nip" VARCHAR(50),
    "user_role" "UserRole" NOT NULL DEFAULT 'USER_BIASA',
    "region_cabang" "Cabang",
    "department" VARCHAR(255),
    "avatar" VARCHAR(500),
    "member_since" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "riskEvent" TEXT NOT NULL,
    "title" VARCHAR(500),
    "organization" VARCHAR(255),
    "division" VARCHAR(255),
    "target" TEXT,
    "risk_event_description" TEXT,
    "risk_cause" TEXT,
    "risk_impact_explanation" TEXT,
    "category" VARCHAR(500),
    "risk_category_type" VARCHAR(255),
    "region_code" "Cabang",
    "evaluation_requested" BOOLEAN DEFAULT false,
    "evaluation_requested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_analyses" (
    "id" SERIAL NOT NULL,
    "risk_id" VARCHAR(50) NOT NULL,
    "existing_control" TEXT,
    "control_type" VARCHAR(255),
    "control_level" VARCHAR(255),
    "control_effectiveness_assessment" VARCHAR(255),
    "estimated_exposure_date" TIMESTAMP(3),
    "key_risk_indicator" TEXT,
    "kri_unit" VARCHAR(255),
    "kri_value_safe" VARCHAR(255),
    "kri_value_caution" VARCHAR(255),
    "kri_value_danger" VARCHAR(255),
    "impact_description" TEXT,
    "impact_level" INTEGER,
    "possibility_type" INTEGER,
    "possibility_description" TEXT,
    "inherent_score" INTEGER,
    "inherent_level" VARCHAR(50),
    "residual_impact_description" TEXT,
    "residual_impact_level" INTEGER,
    "residual_possibility_type" INTEGER,
    "residual_possibility_description" TEXT,
    "residual_score" INTEGER,
    "residual_level" VARCHAR(50),
    "analyzed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_mitigations" (
    "id" SERIAL NOT NULL,
    "risk_id" VARCHAR(50) NOT NULL,
    "handling_type" VARCHAR(255),
    "mitigation_plan" TEXT NOT NULL,
    "mitigation_output" TEXT,
    "mitigation_budget" INTEGER,
    "mitigation_actual" INTEGER,
    "progress_mitigation" TEXT,
    "realization_target" TEXT,
    "target_kpi" TEXT,
    "inherent_score" INTEGER,
    "current_impact_description" TEXT,
    "current_impact_level" INTEGER,
    "current_probability_description" TEXT,
    "current_probability_type" INTEGER,
    "current_score" INTEGER,
    "current_level" VARCHAR(50),
    "planned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_mitigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_evaluations" (
    "id" SERIAL NOT NULL,
    "risk_id" VARCHAR(50) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "evaluation_status" "EvaluationStatus" NOT NULL,
    "evaluation_notes" TEXT,
    "evaluation_date" TIMESTAMP(3),
    "evaluator" VARCHAR(255),
    "evaluator_note" TEXT,
    "last_evaluated_at" TIMESTAMP(3),
    "current_impact_description" TEXT,
    "current_impact_level" INTEGER,
    "current_probability_description" TEXT,
    "current_probability_type" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_registration_requests" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "cabang" "Cabang" NOT NULL,
    "nip" VARCHAR(50),
    "password_hash" VARCHAR(255),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by" INTEGER,

    CONSTRAINT "user_registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "other_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "RequestType" NOT NULL,
    "detail" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by" INTEGER,

    CONSTRAINT "other_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "risks_user_id_idx" ON "risks"("user_id");

-- CreateIndex
CREATE INDEX "risks_region_code_idx" ON "risks"("region_code");

-- CreateIndex
CREATE UNIQUE INDEX "risk_analyses_risk_id_key" ON "risk_analyses"("risk_id");

-- CreateIndex
CREATE UNIQUE INDEX "risk_mitigations_risk_id_key" ON "risk_mitigations"("risk_id");

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_analyses" ADD CONSTRAINT "risk_analyses_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_mitigations" ADD CONSTRAINT "risk_mitigations_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_evaluations" ADD CONSTRAINT "risk_evaluations_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_evaluations" ADD CONSTRAINT "risk_evaluations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_registration_requests" ADD CONSTRAINT "user_registration_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "other_requests" ADD CONSTRAINT "other_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "other_requests" ADD CONSTRAINT "other_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
