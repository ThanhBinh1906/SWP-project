import { useState, useEffect, useCallback } from "react";
import {
  CloudUpload,
  Link,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import teamService from "../../services/teamService";
import roundService from "../../services/roundService";
import submissionService from "../../services/submissionService";
import { getApiMessage } from "../Coordinator/coordinatorHelpers";

function isValidUrl(value) {
  if (!value?.trim()) return false;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function SubmissionZone({ eventId }) {
  const [team, setTeam] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const teamRes = await teamService.getMyTeam(eventId);
      const myTeam = teamRes.data?.data;
      setTeam(myTeam || null);

      if (!myTeam?.trackId) {
        setRounds([]);
        setSubmissions([]);
        return;
      }

      const [roundsRes, subsRes] = await Promise.all([
        roundService.getByTrack(myTeam.trackId),
        submissionService.getByTeam(myTeam.id),
      ]);
      const roundList = roundsRes.data?.data || [];
      const activeRounds = roundList.filter((r) => r.status === "Active");
      setRounds(activeRounds);
      setSubmissions(subsRes.data?.data || []);

      if (activeRounds.length > 0) {
        setSelectedRoundId(String(activeRounds[0].id));
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setTeam(null);
      } else {
        setError(getApiMessage(err, "Không thể tải thông tin nộp bài."));
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const existingSubmission = submissions.find(
    (s) => String(s.roundId) === selectedRoundId,
  );
  const selectedRound = rounds.find(
    (r) => String(r.id) === selectedRoundId,
  );

  useEffect(() => {
    if (existingSubmission) {
      setDemoUrl(existingSubmission.demoUrl || "");
      setReportUrl(existingSubmission.reportUrl || "");
    } else {
      setDemoUrl("");
      setReportUrl("");
    }
  }, [existingSubmission?.id, selectedRoundId]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!team) {
      setError("Bạn chưa có team. Vui lòng tạo team trước.");
      return;
    }
    if (team.status !== "Approved") {
      setError("Team chưa được Coordinator duyệt. Không thể nộp bài.");
      return;
    }
    if (!team.githubRepoLink?.trim()) {
      setError("Team cần có GitHub repo link trước khi nộp bài.");
      return;
    }
    if (!selectedRoundId) {
      setError("Không có vòng thi đang Active để nộp bài.");
      return;
    }
    if (!isValidUrl(demoUrl) && !isValidUrl(reportUrl)) {
      setError("Cần ít nhất một URL hợp lệ (Demo hoặc Report).");
      return;
    }

    setSaving(true);
    try {
      const body = {
        demoUrl: isValidUrl(demoUrl) ? demoUrl.trim() : null,
        reportUrl: isValidUrl(reportUrl) ? reportUrl.trim() : null,
      };

      if (existingSubmission) {
        await submissionService.update(existingSubmission.id, body);
        setSuccess("Cập nhật bài nộp thành công!");
      } else {
        await submissionService.create(selectedRoundId, body);
        setSuccess("Nộp bài thành công!");
      }
      await loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(getApiMessage(err, "Nộp bài thất bại."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-sm text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-[#F26F21]" />
        Đang tải...
      </div>
    );
  }

  if (!team) {
    return (
      <div
        className="rounded-2xl p-6 text-sm"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
      >
        <p className="font-semibold">Chưa có team</p>
        <p className="mt-1">Vào mục Team Information để tạo team trước khi nộp bài.</p>
      </div>
    );
  }

  if (team.status !== "Approved") {
    return (
      <div
        className="rounded-2xl p-6 text-sm"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
      >
        <p className="font-semibold">Team chưa được duyệt</p>
        <p className="mt-1">
          Trạng thái hiện tại: <strong>{team.status || "Pending"}</strong>. Coordinator cần
          approve team trước khi nộp bài.
        </p>
      </div>
    );
  }

  if (!team.githubRepoLink?.trim()) {
    return (
      <div
        className="rounded-2xl p-6 text-sm"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
      >
        <p className="font-semibold">Thiếu GitHub repo</p>
        <p className="mt-1">
          Cập nhật GitHub link trong Team Information trước khi nộp bài.
        </p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 text-sm"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
      >
        <p className="font-semibold">Chưa có vòng thi Active</p>
        <p className="mt-1">
          Coordinator cần tạo Round và đổi status sang <strong>Active</strong> trong khung
          thời gian nộp bài.
        </p>
      </div>
    );
  }

  const isDisqualified = existingSubmission?.isDisqualified;

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: "rgba(242,111,33,0.1)",
            border: "1px solid rgba(242,111,33,0.2)",
          }}
        >
          <CloudUpload className="w-4 h-4" style={{ color: "#F26F21" }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827]">Nộp bài theo vòng</h3>
          <p className="text-[11px] text-slate-500">
            Team: {team.teamName} • Track ID: {team.trackId}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl p-3 text-xs text-red-600"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl p-3 text-xs text-emerald-700"
          style={{ background: "#D1FAE5", border: "1px solid #A7F3D0" }}>
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {isDisqualified && (
        <div className="mb-4 rounded-xl p-3 text-xs text-red-700"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="font-bold">Bài nộp đã bị loại</p>
          <p className="mt-1">{existingSubmission.disqualifyReason || "—"}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Vòng thi (Active)
          </label>
          <select
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {selectedRound && (
            <p className="mt-1 text-[10px] text-slate-400">
              {new Date(selectedRound.startTime).toLocaleString("vi-VN")} →{" "}
              {new Date(selectedRound.endTime).toLocaleString("vi-VN")}
            </p>
          )}
        </div>

        {existingSubmission && (
          <div className="rounded-xl p-3 text-xs" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <p className="font-semibold text-emerald-800">Đã nộp bài cho vòng này</p>
            <p className="text-emerald-700 mt-0.5">
              Nộp lúc: {new Date(existingSubmission.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Demo URL
          </label>
          <div className="mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300">
            <Link className="w-4 h-4 text-slate-500" />
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.example.com"
              disabled={isDisqualified}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Report URL
          </label>
          <div className="mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300">
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <input
              type="url"
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              disabled={isDisqualified}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Ít nhất một trong Demo hoặc Report URL.</p>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || isDisqualified}
        className="w-full mt-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #F26F21, #c9520e)",
          color: "#fff",
          boxShadow: "0 4px 14px rgba(242,111,33,0.2)",
        }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
          </span>
        ) : existingSubmission ? (
          "Cập nhật bài nộp"
        ) : (
          "Nộp bài"
        )}
      </button>
    </div>
  );
}
