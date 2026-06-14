import { FileText, Download, Hash, BookOpen, CheckSquare } from "lucide-react";

export function ChallengeCard({ problem }) {
  const handleDownload = () => {
    window.open(problem.attachmentUrl, "_blank");
  };

  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{
        border: "1px solid #FFD0B5",
        boxShadow:
          "0 4px 24px rgba(242,111,33,0.06), 0 1px 4px rgba(0,0,0,0.04)",
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
            onClick={handleDownload}
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
            <Download className="w-4 h-4" />
            Tải PDF
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-8">
        {/* Title */}
        <h2
          className="text-2xl font-black text-[#111827] leading-snug mb-8"
          style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
        >
          {problem.title}
        </h2>

        {/* 2 columns: description + requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description */}
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
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

          {/* Requirements */}
          {problem.requirements && (
            <div
              className="rounded-2xl p-6 space-y-3"
              style={{
                background: "rgba(242,111,33,0.03)",
                border: "1px solid rgba(242,111,33,0.18)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
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
