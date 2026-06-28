import { useState } from "react";
import { JudgeOverview } from "../components/Judge/dashboard/JudgeOverview";
import { ScoringHistory } from "../components/Judge/history/ScoringHistory";
import { JudgeHeader } from "../components/Judge/layout/JudgeHeader";
import { JudgePageTitle } from "../components/Judge/layout/JudgePageTitle";
import { JudgeSidebar } from "../components/Judge/layout/JudgeSidebar";
import { JudgeRankingView } from "../components/Judge/ranking/JudgeRankingView";
import { JudgeRounds } from "../components/Judge/rounds/JudgeRounds";
import { JudgeScoringWorkspace } from "../components/Judge/scoring/JudgeScoringWorkspace";
import { JudgeTieBreakView } from "../components/Judge/tiebreak/JudgeTieBreakView";

const viewTitles = {
  dashboard: {
    title: "Judge Dashboard",
    sub: "Theo dõi vòng được phân công, tiến độ chấm và trạng thái khóa điểm",
  },
  rounds: {
    title: "Vòng được phân công",
    sub: "Xem thời gian chấm và các vòng đã chốt kết quả",
  },
  scoring: {
    title: "Chấm điểm bài nộp",
    sub: "Chấm điểm các bài nộp trong vòng đang mở chấm",
  },
  "tie-break": {
    title: "Tie-break Scoring",
    sub: "Chấm lại các đội đồng hạng ở vị trí quan trọng",
  },
  history: {
    title: "Lịch sử chấm điểm",
    sub: "Xem lại các lần chấm mới và chỉnh sửa điểm của bạn",
  },
  ranking: {
    title: "Bảng xếp hạng",
    sub: "Xem bảng xếp hạng đã được công bố của các vòng được phân công",
  },
};

export default function JudgeDashboard() {
  const [activeNav, setActiveNav] = useState("scoring");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scoringRoundId, setScoringRoundId] = useState("");
  const title = viewTitles[activeNav] || viewTitles.dashboard;

  const openScoring = (roundId) => {
    if (roundId) {
      setScoringRoundId(String(roundId));
    }
    setActiveNav("scoring");
  };

  const views = {
    dashboard: <JudgeOverview onOpenScoring={openScoring} />,
    rounds: <JudgeRounds onOpenScoring={openScoring} />,
    scoring: <JudgeScoringWorkspace initialRoundId={scoringRoundId} />,
    "tie-break": <JudgeTieBreakView />,
    history: <ScoringHistory />,
    ranking: <JudgeRankingView />,
  };

  return (
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{ background: "#F9FAFB" }}
    >
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      <JudgeSidebar
        active={activeNav}
        onNav={setActiveNav}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <JudgeHeader onMenuClick={() => setSidebarOpen(true)} />
        <JudgePageTitle title={title.title} sub={title.sub} />
        <main className="flex-1 px-4 py-6 sm:px-8">
          {views[activeNav] || views.dashboard}
        </main>
        <footer
          className="border-t bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-8"
          style={{ borderColor: "#E5E7EB" }}
        >
          SEAL Hackathon Judge Console • Không gian chấm điểm
        </footer>
      </div>
    </div>
  );
}
