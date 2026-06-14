import { useSelector } from "react-redux";
import {
  FileText,
  Lock,
  Clock,
  AlertCircle,
  Download,
  Hash,
  BookOpen,
  CheckSquare,
} from "lucide-react";

function ChallengeCard({ problem }) {
  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{
        border: "1px solid #FFD0B5",
        boxShadow: "0 4px 24px rgba(242,111,33,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, rgba(242,111,33,0.08) 0%, rgba(242,111,33,0.02) 100%)",
          borderBottom: "1px solid rgba(242,111,33,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(242,111,33,0.12)",
              border: "1px solid rgba(242,111,33,0.25)",
            }}
          >
            <FileText className="w-5 h-5" style={{ color: "#F26F21" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Problem Statement
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Hash className="w-3.5 h-3.5" style={{ color: "#F26F21" }} />
              <p className="text-sm font-bold" style={{ color: "#F26F21" }}>
                Problem {problem.id}
              </p>
            </div>
          </div>
        </div>
        {problem.attachmentUrl && (
          <button
            onClick={() => window.open(problem.attachmentUrl, "_blank")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              background: "rgba(242,111,33,0.08)",
              border: "1px solid rgba(242,111,33,0.25)",
              color: "#F26F21",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(242,111,33,0.16)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(242,111,33,0.08)")
            }
          >
            <Download className="w-4 h-4" /> Tải PDF
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-8">
        <h2
          className="text-2xl font-black text-[#111827] leading-snug mb-8"
          style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
        >
          {problem.title}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-6"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#E5E7EB" }}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Mô tả
              </p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {problem.description}
            </p>
          </div>

          {problem.requirements && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(242,111,33,0.03)",
                border: "1px solid rgba(242,111,33,0.18)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(242,111,33,0.12)" }}
                >
                  <CheckSquare
                    className="w-3.5 h-3.5"
                    style={{ color: "#F26F21" }}
                  />
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#F26F21" }}
                >
                  Yêu cầu kỹ thuật
                </p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {problem.requirements}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------
function ProblemLocked() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-24 gap-8">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-36 h-36 rounded-full"
          style={{ background: "rgba(242,111,33,0.06)" }}
        />
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{ background: "rgba(242,111,33,0.1)" }}
        />
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(242,111,33,0.12)",
            border: "1.5px solid rgba(242,111,33,0.3)",
          }}
        >
          <Lock className="w-8 h-8" style={{ color: "#F26F21" }} />
        </div>
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h2
          className="text-2xl font-black text-[#111827]"
          style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
        >
          Đề bài chưa được mở
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Ban tổ chức sẽ công bố đề bài vào thời điểm chính thức bắt đầu vòng
          thi.
        </p>
      </div>
      <div
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
        style={{
          background: "rgba(242,111,33,0.06)",
          border: "1px solid rgba(242,111,33,0.18)",
        }}
      >
        <Clock className="w-4 h-4" style={{ color: "#F26F21" }} />
        <span className="text-sm font-semibold" style={{ color: "#F26F21" }}>
          Vui lòng chờ thông báo từ Ban tổ chức
        </span>
      </div>
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              background: "#F26F21",
              opacity: 0.4,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
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
        Coordinator sẽ phân đề sau khi round bắt đầu.
      </p>
    </div>
  );
}

function NoTeam() {
  return (
    <div className="text-center py-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{
          background: "rgba(242,111,33,0.08)",
          border: "1px solid rgba(242,111,33,0.15)",
        }}
      >
        <AlertCircle className="w-7 h-7" style={{ color: "#F26F21" }} />
      </div>
      <p className="text-sm font-semibold text-slate-600">Bạn chưa có team.</p>
      <p className="text-xs text-slate-400 mt-1">
        Vui lòng đăng ký team trước khi xem đề bài.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function ChallengesView() {
  const { myTeam, fetched } = useSelector((s) => s.team);

  // Chưa fetch xong
  if (!fetched) return null;

  // Chưa có team
  if (!myTeam) return <NoTeam />;

  // Có team nhưng chưa có topic → chờ Coordinator phân đề
  if (!myTeam.topic) return <NoProblemAssigned />;

  // Có topic → hiển thị đề bài
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" style={{ color: "#F26F21" }} />
        <h2
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#F26F21" }}
        >
          Đề bài của team
        </h2>
      </div>
      <ChallengeCard problem={myTeam.topic} />
    </div>
  );
}
