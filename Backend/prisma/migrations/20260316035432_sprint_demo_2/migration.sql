-- CreateTable
CREATE TABLE "risk_approvals" (
    "id" TEXT NOT NULL,
    "risk_id" VARCHAR(50) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_measurements" (
    "id" TEXT NOT NULL,
    "risk_id" VARCHAR(50) NOT NULL,
    "treatment_option" VARCHAR(100) NOT NULL,
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
    "measured_by" INTEGER NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "risk_approvals_risk_id_idx" ON "risk_approvals"("risk_id");

-- CreateIndex
CREATE UNIQUE INDEX "risk_measurements_risk_id_key" ON "risk_measurements"("risk_id");

-- AddForeignKey
ALTER TABLE "risk_approvals" ADD CONSTRAINT "risk_approvals_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_approvals" ADD CONSTRAINT "risk_approvals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_measurements" ADD CONSTRAINT "risk_measurements_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_measurements" ADD CONSTRAINT "risk_measurements_measured_by_fkey" FOREIGN KEY ("measured_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
