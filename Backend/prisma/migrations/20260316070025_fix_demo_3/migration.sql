-- CreateIndex
CREATE INDEX "other_requests_user_id_idx" ON "other_requests"("user_id");

-- CreateIndex
CREATE INDEX "other_requests_status_idx" ON "other_requests"("status");

-- CreateIndex
CREATE INDEX "other_requests_type_idx" ON "other_requests"("type");

-- CreateIndex
CREATE INDEX "regulation_updates_published_at_idx" ON "regulation_updates"("published_at");

-- CreateIndex
CREATE INDEX "risk_approvals_user_id_idx" ON "risk_approvals"("user_id");

-- CreateIndex
CREATE INDEX "risk_evaluations_risk_id_idx" ON "risk_evaluations"("risk_id");

-- CreateIndex
CREATE INDEX "risk_evaluations_user_id_idx" ON "risk_evaluations"("user_id");

-- CreateIndex
CREATE INDEX "user_registration_requests_status_idx" ON "user_registration_requests"("status");

-- CreateIndex
CREATE INDEX "user_registration_requests_email_idx" ON "user_registration_requests"("email");
