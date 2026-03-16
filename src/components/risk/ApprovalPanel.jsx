import { useState } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { getRiskStatus } from '../../utils/riskStatus';

/**
 * ApprovalPanel — shown inside Risk Detail for risks in "Risiko Baru" status.
 *
 * Visibility rules:
 *   - Always shows the approval status summary when status === 'risiko-baru'
 *   - Approve/Reject buttons only render for RISK_CHAMPION and RISK_ASSESSMENT
 *   - If the current user already acted, shows an informational label instead
 */
export default function ApprovalPanel({ risk, onActionComplete }) {
  const { user } = useAuth();
  const riskStatus = getRiskStatus(risk);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Only render for 'risiko-baru' status
  if (riskStatus !== 'risiko-baru') return null;

  // RISK_CHAMPION can only approve risks from their own cabang (unless KPS)
  const champCabangMatch =
    user?.userRole !== 'RISK_CHAMPION' ||
    !user?.regionCabang ||
    user.regionCabang === 'KPS' ||
    risk?.regionCode === user.regionCabang;

  const isApprover =
    (user?.userRole === 'RISK_CHAMPION' || user?.userRole === 'RISK_ASSESSMENT') &&
    champCabangMatch;

  const approvals = risk.approvals || [];

  // Find if the current user has already submitted an action
  const myAction = approvals.find((a) => a.userId === user?.id);

  // Per-role approval records
  const champApproval = approvals.find(
    (a) => a.role === 'Risk Champion' && a.action === 'approved'
  );
  const assessApproval = approvals.find(
    (a) => a.role === 'Risk Assessment' && a.action === 'approved'
  );
  const rejectionRecord = approvals.find((a) => a.action === 'rejected');

  // --- Helpers ---
  const submitAction = async (action, note = null) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiRequest(API_ENDPOINTS.risks.approval(risk.id), {
        method: 'POST',
        body: JSON.stringify({ action, note }),
      });
      onActionComplete?.();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => submitAction('approved');

  const handleConfirmReject = async () => {
    await submitAction('rejected', rejectNote || null);
    if (!error) {
      setIsRejectModalOpen(false);
      setRejectNote('');
    }
  };

  // --- Status summary text ---
  const renderSummary = () => {
    if (rejectionRecord) {
      return (
        <span className="text-red-600 dark:text-red-400 font-medium">
          <i className="bi bi-x-circle-fill mr-1.5" />
          Ditolak oleh {rejectionRecord.role}
          {rejectionRecord.note && (
            <span className="font-normal italic ml-1">
              — "{rejectionRecord.note}"
            </span>
          )}
        </span>
      );
    }

    const parts = [];
    if (champApproval) {
      parts.push(
        <span key="champ" className="text-green-600 dark:text-green-400">
          <i className="bi bi-check-circle-fill mr-1" />
          Approved by Risk Champion
        </span>
      );
    } else {
      parts.push(
        <span key="champ-wait" className="text-gray-500 dark:text-gray-400">
          <i className="bi bi-hourglass-split mr-1" />
          Awaiting Risk Champion
        </span>
      );
    }

    if (assessApproval) {
      parts.push(
        <span key="assess" className="text-green-600 dark:text-green-400">
          <i className="bi bi-check-circle-fill mr-1" />
          Approved by Risk Assessment
        </span>
      );
    } else {
      parts.push(
        <span key="assess-wait" className="text-gray-500 dark:text-gray-400">
          <i className="bi bi-hourglass-split mr-1" />
          Awaiting Risk Assessment
        </span>
      );
    }

    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center text-sm">
            {p}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-3 space-y-3">
      {/* Summary row */}
      <div className="text-sm">{renderSummary()}</div>

      {/* Action buttons — only for approvers */}
      {isApprover && (
        <div className="flex items-center gap-3 flex-wrap">
          {myAction ? (
            // User already acted
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1 ${
                myAction.action === 'approved'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              <i
                className={`bi ${
                  myAction.action === 'approved'
                    ? 'bi-check-circle-fill'
                    : 'bi-x-circle-fill'
                }`}
              />
              You have {myAction.action === 'approved' ? 'Approved' : 'Rejected'} this risk
            </span>
          ) : (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <i className="bi bi-check-lg" />
                Approve
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setRejectNote('');
                  setError(null);
                  setIsRejectModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <i className="bi bi-x-lg" />
                Reject
              </button>
            </>
          )}
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Reject modal */}
      {isRejectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setIsRejectModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Tolak Risiko
              </h3>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Alasan Penolakan
                <span className="font-normal text-gray-400 ml-1">(opsional)</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors resize-none min-h-[80px]"
                placeholder="Jelaskan alasan penolakan..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReject}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
