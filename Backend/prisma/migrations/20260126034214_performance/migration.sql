-- CreateIndex
CREATE INDEX "other_requests_status_idx" ON "other_requests"("status");

-- CreateIndex
CREATE INDEX "other_requests_user_id_idx" ON "other_requests"("user_id");

-- CreateIndex
CREATE INDEX "other_requests_status_requested_at_idx" ON "other_requests"("status", "requested_at" DESC);

-- CreateIndex
CREATE INDEX "regulation_updates_published_at_idx" ON "regulation_updates"("published_at" DESC);

-- CreateIndex
CREATE INDEX "risk_evaluations_last_evaluated_at_idx" ON "risk_evaluations"("last_evaluated_at" DESC);

-- CreateIndex
CREATE INDEX "risk_evaluations_risk_id_last_evaluated_at_idx" ON "risk_evaluations"("risk_id", "last_evaluated_at" DESC);

-- CreateIndex
CREATE INDEX "risks_created_at_idx" ON "risks"("created_at" DESC);

-- CreateIndex
CREATE INDEX "risks_region_code_created_at_idx" ON "risks"("region_code", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_registration_requests_status_idx" ON "user_registration_requests"("status");

-- CreateIndex
CREATE INDEX "user_registration_requests_email_idx" ON "user_registration_requests"("email");

-- CreateIndex
CREATE INDEX "user_registration_requests_status_requested_at_idx" ON "user_registration_requests"("status", "requested_at" DESC);

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);

-- CreateIndex
CREATE INDEX "users_region_cabang_created_at_idx" ON "users"("region_cabang", "created_at" DESC);
