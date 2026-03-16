import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRiskLevel } from '../../utils/risk';
import { getRiskStatus, RISK_STATUS_CONFIG } from '../../utils/riskStatus';
import { getCabangLabel, getCabangCode } from '../../utils/cabang';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import RiskLevelBadge from './RiskLevelBadge';
import RiskScoreBar from './RiskScoreBar';

function truncateText(value, maxChars) {
  const s = String(value ?? '');
  if (!maxChars || maxChars <= 0) return s;
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}...`;
}

/**
 * Expandable Risk Card Component with detailed sections
 * Shows: Risk Registry, Analysis, Planning, Evaluation (if applicable)
 */
export default function RiskCardExpandable({
  risk,
  showRiskLevel = true,
  showScoreBar = false,
  showRemoveButton = false,
  showEvaluateButton = false,
  showActionButtons = true, // Controls Analyze and Mitigate buttons
  showEvaluationMonth = true,
  showRiskLevelText = true, // Show risk level text below category (default: true)
  riskEventMaxLength = 18,
  clickable = false,
  onRemove,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  if (!risk) return null;

  const riskStatus = getRiskStatus(risk);
  const statusConfig = RISK_STATUS_CONFIG[riskStatus] || RISK_STATUS_CONFIG['risiko-baru'];
  const riskEventValue = risk.riskEvent || risk.title || '';
  const riskEventText = truncateText(riskEventValue, riskEventMaxLength);

  // Determine which sections to show based on status
  const hasAnalysis = ['analyzed', 'planned', 'monitor', 'mitigate', 'need-improvement'].includes(riskStatus);
  const hasPlanning = ['planned', 'monitor', 'mitigate', 'need-improvement'].includes(riskStatus);
  const hasEvaluation = ['monitor', 'mitigate', 'need-improvement'].includes(riskStatus);

  const handleCardClick = () => {
    if (clickable) {
      navigate(`/risks/${risk.id}/detail`);
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-(--color-card-border-dark) bg-white dark:bg-(--color-card-bg-dark) transition-colors ${
        clickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' : ''
      } ${className}`}
      onClick={clickable ? handleCardClick : undefined}
    >
      {/* Collapsed View */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Header: Organization | Cabang */}
            {(risk.organization || risk.regionCode) && (
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {risk.organization && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{risk.organization}</span>
                )}
                {risk.organization && risk.regionCode && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">|</span>
                )}
                {risk.regionCode && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{getCabangLabel(risk.regionCode)}</span>
                )}
              </div>
            )}

            {/* Title - Use riskEvent if available */}
            <div className="font-semibold text-gray-900 dark:text-white mt-1">
              <span className="block truncate" title={riskEventValue}>
                {riskEventText}
              </span>
            </div>

            {/* Division, Category, Eval */}
            <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              {risk.division && (
                <div>
                  Divisi: <span className="font-semibold text-gray-700 dark:text-gray-200">{risk.division}</span>
                </div>
              )}
              {(risk.category || risk.riskCategory) && (
                <div>
                  Kategori: <span className="font-semibold text-gray-700 dark:text-gray-200">{risk.category || risk.riskCategory}</span>
                </div>
              )}
              {/* Risk Level - only show if score > 0, status is not risiko-baru, and showRiskLevelText is true */}
              {showRiskLevelText && (() => {
                // Don't show if status is risiko-baru
                if (riskStatus === 'risiko-baru') {
                  return null;
                }
                
                // Determine which score to show based on status
                let displayScore = 0;
                let labelText = 'Risk Level';
                
                if (riskStatus === 'analyzed') {
                  // After Risk Analysis: show Inherent Risk
                  displayScore = Number(risk.inherentScore ?? risk.score ?? 0);
                  labelText = 'Tingkat Risiko Inheren';
                } else if (['planned', 'monitor', 'mitigate', 'need-improvement'].includes(riskStatus)) {
                  // After Mitigation Plan: show Current Risk (Residual)
                  displayScore = Number(risk.currentScore ?? risk.residualScore ?? risk.residualScoreFinal ?? 0);
                  labelText = 'Tingkat Risiko Residual';
                } else {
                  // Fallback to score
                  displayScore = Number(risk.score ?? 0);
                }
                
                if (!displayScore || displayScore <= 0) {
                  return null;
                }
                
                const riskLevel = getRiskLevel(displayScore);
                return riskLevel ? (
                  <div>
                    {labelText}: <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskLevel.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${riskLevel.dotClass}`} />
                      <span>{riskLevel.label}</span>
                    </span>
                  </div>
                ) : null;
              })()}
              {showEvaluationMonth && risk.evaluationMonth && (
                <div>
                  Eval: <span className="font-semibold text-gray-700 dark:text-gray-200">{risk.evaluationMonth}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}>
                <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Right side: Badge, Score Bar, Action Buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Badge container - can expand based on label length */}
            {/* Only show badge if score exists, is > 0, and status is not risiko-baru */}
            {showRiskLevel && riskStatus !== 'risiko-baru' && (() => {
              // Determine which score to show based on status
              let badgeScore = 0;

              if (riskStatus === 'analyzed') {
                // After Risk Analysis: show Inherent Risk
                badgeScore = Number(risk.inherentScore ?? risk.score ?? 0);
              } else if (['planned', 'monitor', 'mitigate', 'need-improvement'].includes(riskStatus)) {
                // After Mitigation Plan: show Current Risk (Residual)
                badgeScore = Number(risk.currentScore ?? risk.residualScore ?? risk.residualScoreFinal ?? 0);
              } else {
                // Fallback to score
                badgeScore = Number(risk.score ?? 0);
              }
              
              if (!badgeScore || isNaN(badgeScore) || badgeScore <= 0) return null;
              return (
                <div className="flex justify-end">
                  <RiskLevelBadge score={badgeScore} />
                </div>
              );
            })()}
            {/* Score bar container - fixed width, separate from badge */}
            {/* Only show score bar if score exists, is > 0, and status is not open-risk */}
            {showScoreBar && riskStatus !== 'risiko-baru' && (() => {
              // Determine which score to show based on status
              let barScore = 0;

              if (riskStatus === 'analyzed') {
                // After Risk Analysis: show Inherent Risk
                barScore = Number(risk.inherentScore ?? risk.score ?? 0);
              } else if (['planned', 'monitor', 'mitigate', 'need-improvement'].includes(riskStatus)) {
                // After Mitigation Plan: show Current Risk (Residual)
                barScore = Number(risk.currentScore ?? risk.residualScore ?? risk.residualScoreFinal ?? 0);
              } else {
                // Fallback to score
                barScore = Number(risk.score ?? 0);
              }
              
              if (!barScore || isNaN(barScore) || barScore <= 0) return null;
              return (
                <div className="w-28 shrink-0">
                  <RiskScoreBar score={barScore} />
                </div>
              );
            })()}

            {/* Remove Button */}
            {showRemoveButton && onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors shadow-sm"
                title="Remove Risk"
              >
                <i className="bi bi-trash"></i>
                <span className="hidden sm:inline">Remove</span>
              </button>
            )}

            {/* Action buttons based on status */}
            {showActionButtons && riskStatus === 'risiko-baru' && (
              <Link
                to={`/risks/${risk.id}/risk-analysis`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors shadow-sm"
                title="Risk Analysis"
              >
                <i className="bi bi-clipboard-check"></i>
                <span className="hidden sm:inline">Analyze</span>
              </Link>
            )}
            {showActionButtons && (riskStatus === 'analyzed' || riskStatus === 'planned' || riskStatus === 'need-improvement') && !risk.evaluationRequested && (
              <Link
                to={`/risks/${risk.id}/mitigation-plan`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                title="Mitigation Plan"
              >
                <i className="bi bi-shield-check"></i>
                <span className="hidden sm:inline">Mitigate</span>
              </Link>
            )}
            {showEvaluateButton && (riskStatus === 'planned' || riskStatus === 'need-improvement') && (
              <Link
                to={`/risks/${risk.id}/evaluation`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#ffc107] rounded-lg hover:bg-yellow-600 transition-colors shadow-sm"
                title="Monthly Evaluation"
              >
                <i className="bi bi-calendar-check"></i>
                <span className="hidden sm:inline">Evaluate</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Expanded View - Sections */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-(--color-card-border-dark) p-4 space-y-4 bg-gray-50 dark:bg-gray-800/30">
          {/* Section 1: Risk Identified */}
          <div className="border-l-4 border-blue-500 pl-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <i className="bi bi-clipboard-data mr-2 text-blue-500"></i>
              Resiko Teridentifikasi
            </div>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {/* Nama Perusahaan & Divisi */}
              {risk.organization && (
                <div>
                  <span className="font-semibold">Nama Perusahaan:</span> {risk.organization}
                </div>
              )}
              {risk.division && (
                <div>
                  <span className="font-semibold">Divisi:</span> {risk.division}
                </div>
              )}
              {/* Sasaran & Cabang */}
              {risk.target && (
                <div>
                  <span className="font-semibold">Sasaran:</span> {risk.target}
                </div>
              )}
              {risk.regionCode && (
                <div>
                  <span className="font-semibold">Cabang:</span> {getCabangCode(risk.regionCode)}
                </div>
              )}
              {/* Peristiwa Risiko */}
              <div>
                <span className="font-semibold">Peristiwa Resiko:</span> {risk.riskEvent || risk.title || 'N/A'}
              </div>
              {/* Deskripsi Peristiwa Risiko */}
              {risk.riskEventDescription && (
                <div>
                  <span className="font-semibold">Deskripsi Peristiwa Resiko:</span> {risk.riskEventDescription}
                </div>
              )}
              {/* Kategori */}
              {(risk.category || risk.riskCategory) && (
                <div>
                  <span className="font-semibold">Kategori:</span> {risk.category || risk.riskCategory}
                </div>
              )}
              {/* Penyebab Risiko */}
              {risk.riskCause && (
                <div>
                  <span className="font-semibold">Penyebab Resiko:</span> {risk.riskCause}
                </div>
              )}
              {/* Kategori Resiko */}
              {risk.riskCategoryType && (
                <div>
                  <span className="font-semibold">Kategori Resiko:</span> {risk.riskCategoryType}
                </div>
              )}
              {/* Deskripsi Dampak */}
              {risk.riskImpactExplanation && (
                <div>
                  <span className="font-semibold">Deskripsi Dampak:</span> {risk.riskImpactExplanation}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Analysis (if analyzed) */}
          {hasAnalysis && (
            <div className="border-l-4 border-green-500 pl-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <i className="bi bi-graph-up mr-2 text-green-500"></i>
                Analisis Resiko
              </div>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.impactDescription && (
                  <div>
                    <span className="font-semibold">Penjelasan Dampak:</span> {risk.impactDescription}
                  </div>
                )}
                {risk.possibilityDescription && (
                  <div>
                    <span className="font-semibold">Penjelasan Kemungkinan:</span> {risk.possibilityDescription}
                  </div>
                )}
                {(risk.score && risk.score > 0) && (
                  <div>
                    <span className="font-semibold">Skor Resiko:</span> {risk.score}/25
                    <span className="ml-2 text-xs">
                      (Possibility: {risk.possibility || risk.possibilityType || 0} × Impact: {risk.impact || risk.impactLevel || 0})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Planning (if planned) */}
          {hasPlanning && (
            <div className="border-l-4 border-yellow-500 pl-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <i className="bi bi-shield-check mr-2 text-yellow-500"></i>
                Perencanaan Mitigasi
              </div>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.mitigationPlan && (
                  <div>
                    <span className="font-semibold">Rencana Mitigasi:</span> {risk.mitigationPlan}
                  </div>
                )}
                {risk.residualImpactDescription && (
                  <div>
                    <span className="font-semibold">Dampak Residual:</span> {risk.residualImpactDescription}
                  </div>
                )}
                {risk.residualProbabilityDescription && (
                  <div>
                    <span className="font-semibold">Kemungkinan Residual:</span> {risk.residualProbabilityDescription}
                  </div>
                )}
                {risk.evaluationMonth && (
                  <div>
                    <span className="font-semibold">Bulan Evaluasi:</span> {risk.evaluationMonth}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Evaluation (if evaluated) */}
          {hasEvaluation && (
            <div className="border-l-4 border-purple-500 pl-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <i className="bi bi-calendar-check mr-2 text-purple-500"></i>
                Evaluasi Keberhasilan
              </div>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.evaluationStatus && (
                  <div>
                    <span className="font-semibold">Status Evaluasi:</span> {risk.evaluationStatus}
                  </div>
                )}
                {risk.evaluationNotes && (
                  <div>
                    <span className="font-semibold">Catatan Evaluasi:</span> {risk.evaluationNotes}
                  </div>
                )}
                {risk.evaluator && (
                  <div>
                    <span className="font-semibold">Pembuat Evaluasi:</span> {risk.evaluator}
                  </div>
                )}
                {risk.evaluationDate && (
                  <div>
                    <span className="font-semibold">Tanggal Evaluasi:</span> {risk.evaluationDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (onRemove) {
            onRemove(risk.id);
          }
          setShowDeleteConfirm(false);
        }}
        title="Delete Risk"
        itemName={risk.riskEvent || risk.title || 'this risk'}
        message={`Are you sure you want to delete "${risk.riskEvent || risk.title || 'this risk'}"? This action cannot be undone.`}
      />
    </div>
  );
}

