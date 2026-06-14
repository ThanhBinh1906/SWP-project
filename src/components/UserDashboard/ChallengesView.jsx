import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Loader2, AlertCircle, FileText, Lock, Clock } from "lucide-react";
import { ChallengeCard } from "./ChallengeCard";
// import problemService from "../../services/problemService";

// ── Mock: xóa khi có endpoint thật ─────────────────────────────
const MOCK_IS_RELEASED = true; // TODO: đổi thành true hoặc lấy từ API

const MOCK_MY_PROBLEM = {
  id: 1,
  roundId: 1,
  title: "Smart Campus - Study Room Booking System",
  description:
    "Xây dựng hệ thống đặt phòng học nhóm cho sinh viên, hỗ trợ xem lịch trống, đặt phòng theo khung giờ, quản lý thiết bị trong phòng và theo dõi hiệu suất sử dụng phòng.",
  requirements:
    "Quản lý danh sách phòng học, sức chứa và thiết bị đi kèm. Sinh viên xem lịch trống và đặt phòng theo khung giờ. Gửi email xác nhận sau khi đặt thành công. Check-in/Check-out bằng mã QR. Admin Dashboard theo dõi hiệu suất sử dụng phòng. Backend áp dụng Clean Architecture, Repository Pattern, JWT và xử lý concurrency khi nhiều sinh viên cùng đặt một phòng.",
  attachmentUrl:
    "https://res.cloudinary.com/dzvr8nxl4/image/upload/fl_attachment/s5vpqn9long2s2mj1fzt.pdf",
};

// ── Coordinator view: danh sách tất cả đề ───────────────────────
function CoordinatorProblemsView({ roundId }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roundId) return;
    setLoading(true);
    problemService
      .getByRound(roundId)
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setProblems(list);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message || "Không thể tải danh sách đề bài.",
        );
      })
      .finally(() => setLoading(false));
  }, [roundId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!problems.length) return <EmptyState />;

  return (
    <div className="space-y-4">
      <SectionHeader
        count={problems.length}
        label="Tất cả đề bài"
        subtitle={`Round #${roundId}`}
      />
      <div className="space-y-4">
        {problems.map((p) => (
          <ChallengeCard key={p.id} problem={p} />
        ))}
      </div>
    </div>
  );
}

// ── Leader view: chỉ 1 đề được assign cho team ──────────────────
function LeaderProblemView({ teamId }) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // TODO: thay bằng API thật khi có endpoint
    // problemService.getMyProblem(teamId).then(...).catch(...)
    const timer = setTimeout(() => {
      setProblem(MOCK_MY_PROBLEM);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [teamId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  // TODO: thay MOCK_IS_RELEASED bằng field từ API (vd: problem?.isReleased)
  if (!MOCK_IS_RELEASED) return <ProblemLocked />;

  if (!problem) return <NoProblemAssigned />;

  return (
    <div className="space-y-4">
      <SectionHeader label="Đề bài của team" />
      <ChallengeCard problem={problem} />
    </div>
  );
}

// ── Main export: chọn view theo role ────────────────────────────
export function ChallengesView() {
  const role = useSelector((s) => s.auth?.user?.role);
  const roundId = useSelector((s) => s.event?.activeRoundId);
  const teamId = useSelector((s) => s.team?.myTeam?.id);

  const isCoordinator = role === "Coordinator";

  return (
    <div className="w-full mt-6">
      {isCoordinator ? (
        <CoordinatorProblemsView roundId={roundId} />
      ) : (
        <LeaderProblemView teamId={teamId} />
      )}
    </div>
  );
}

// ── Shared UI helpers ────────────────────────────────────────────
function SectionHeader({ label, count, subtitle }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" style={{ color: "#F26F21" }} />
        <h2
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#F26F21" }}
        >
          {label}
        </h2>
        {count !== undefined && (
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-bold"
            style={{
              background: "rgba(242,111,33,0.1)",
              color: "#F26F21",
              border: "1px solid rgba(242,111,33,0.2)",
            }}
          >
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-slate-400 font-medium">{subtitle}</span>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 gap-3 text-sm text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#F26F21" }} />
      Đang tải đề bài...
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl text-sm"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#dc2626",
      }}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{
          background: "rgba(242,111,33,0.08)",
          border: "1px solid rgba(242,111,33,0.15)",
        }}
      >
        <FileText className="w-7 h-7" style={{ color: "#F26F21" }} />
      </div>
      <p className="text-sm font-semibold text-slate-600">
        Chưa có đề bài nào.
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Đề bài sẽ được công bố khi round bắt đầu.
      </p>
    </div>
  );
}

function NoProblemAssigned() {
  return (
    <div className="text-center py-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{
          background: "rgba(242,111,33,0.08)",
          border: "1px solid rgba(242,111,33,0.15)",
        }}
      >
        <FileText className="w-7 h-7" style={{ color: "#F26F21" }} />
      </div>
      <p className="text-sm font-semibold text-slate-600">
        Team chưa được phân đề bài.
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Coordinator sẽ phân đề sau khi duyệt team.
      </p>
    </div>
  );
}

function ProblemLocked() {
  return (
    <div className="w-full flex items-center justify-center py-10">
      <div
        className="w-full rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          border: "1px solid rgba(242,111,33,0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(90deg, #F26F21, #FDA071, #F26F21)",
          }}
        />

        <div className="px-10 py-16 flex flex-col items-center text-center gap-6">
          {/* Lock icon */}
          <div className="relative">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{
                background: "rgba(242,111,33,0.12)",
                border: "1px solid rgba(242,111,33,0.25)",
                boxShadow: "0 0 40px rgba(242,111,33,0.15)",
              }}
            >
              <Lock className="w-12 h-12" style={{ color: "#F26F21" }} />
            </div>
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-3xl animate-ping"
              style={{
                background: "rgba(242,111,33,0.08)",
                animationDuration: "2s",
              }}
            />
          </div>

          {/* Text */}
          <div className="space-y-3 max-w-md">
            <h2
              className="text-2xl font-black text-white"
              style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
            >
              Đề bài chưa được mở
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ban tổ chức sẽ công bố đề bài vào thời điểm chính thức bắt đầu
              vòng thi. Hãy chuẩn bị sẵn sàng!
            </p>
          </div>

          {/* Countdown placeholder */}
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
            style={{
              background: "rgba(242,111,33,0.08)",
              border: "1px solid rgba(242,111,33,0.2)",
            }}
          >
            <Clock className="w-4 h-4" style={{ color: "#F26F21" }} />
            <span className="text-sm font-semibold text-slate-300">
              Vui lòng chờ thông báo từ Ban tổ chức
            </span>
          </div>

          {/* Divider dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{
                  background: "#F26F21",
                  opacity: 0.6,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
