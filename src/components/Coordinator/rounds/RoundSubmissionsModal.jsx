import { useState, useEffect, useCallback } from "react";
import {
  CoordinatorActionButton,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import submissionService from "../../../services/submissionService";
import { FormError, getApiMessage } from "../coordinatorHelpers";

export function RoundSubmissionsModal({ round, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disqualifyTarget, setDisqualifyTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await submissionService.getByRound(round.roundId);
      setSubmissions(res.data?.data || []);
    } catch (err) {
      setError(getApiMessage(err, "Không thể tải bài nộp."));
    } finally {
      setLoading(false);
    }
  }, [round.roundId]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const handleDisqualify = async () => {
    if (!reason.trim()) {
      setFormError("Lý do loại bài không được để trống.");
      return;
    }
    setSaving(true);
    try {
      await submissionService.disqualify(disqualifyTarget.id, reason.trim());
      await fetchSubs();
      setDisqualifyTarget(null);
      setReason("");
      setFormError("");
    } catch (err) {
      setFormError(getApiMessage(err, "Loại bài thất bại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ModalShell
        title={`Bài nộp — ${round.name}`}
        onClose={onClose}
        actions={
          <CoordinatorActionButton onClick={onClose}>Đóng</CoordinatorActionButton>
        }
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-500">{error}</p>
        ) : submissions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Chưa có bài nộp cho vòng này.
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl border border-slate-200 p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-500">
                      Team: {String(sub.teamId).slice(0, 12)}...
                    </p>
                    <p>
                      Presentation:{" "}
                      {sub.presentationUrl || sub.reportUrl ? (
                        <a
                          href={sub.presentationUrl || sub.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[#F26F21] hover:underline"
                        >
                          {sub.presentationUrl || sub.reportUrl}
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                    {sub.isDisqualified && (
                      <p className="mt-2 text-red-600 font-semibold">
                        Đã loại: {sub.disqualifyReason}
                      </p>
                    )}
                  </div>
                  {!sub.isDisqualified && (
                    <CoordinatorActionButton
                      variant="danger"
                      onClick={() => {
                        setDisqualifyTarget(sub);
                        setReason("");
                        setFormError("");
                      }}
                    >
                      Loại bài
                    </CoordinatorActionButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalShell>

      {disqualifyTarget && (
        <ModalShell
          title="Loại bài nộp"
          onClose={() => setDisqualifyTarget(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setDisqualifyTarget(null)}>
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                disabled={saving}
                onClick={handleDisqualify}
              >
                {saving ? "Đang xử lý..." : "Xác nhận loại"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <FormError msg={formError} />
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none min-h-24"
              placeholder="Lý do loại bài (bắt buộc, max 500 ký tự)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>
        </ModalShell>
      )}
    </>
  );
}
