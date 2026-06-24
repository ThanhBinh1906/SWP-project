import { useState } from "react";
import { JudgeOverview } from "../components/Judge/dashboard/JudgeOverview";
import { ScoringHistory } from "../components/Judge/history/ScoringHistory";
import { JudgeHeader } from "../components/Judge/layout/JudgeHeader";
import { JudgePageTitle } from "../components/Judge/layout/JudgePageTitle";
import { JudgeSidebar } from "../components/Judge/layout/JudgeSidebar";
import { JudgeRounds } from "../components/Judge/rounds/JudgeRounds";
import { JudgeScoringWorkspace } from "../components/Judge/scoring/JudgeScoringWorkspace";
import { JudgeRankingView } from "../components/Judge/ranking/JudgeRankingView";

const viewTitles = {
  dashboard: {
    title: "Judge Dashboard",
    sub: "Assigned rounds, scoring progress, countdowns, and lock status",
  },
  rounds: {
    title: "Assigned Rounds",
    sub: "Review scoring windows and ranking lock state",
  },
  scoring: {
    title: "Submission Scoring",
    sub: "Chấm điểm bài nộp qua API, round status phải là Scoring",
  },
  history: {
    title: "Scoring History",
    sub: "Read-only record of submitted scores and comments",
  },
  ranking: {
    title: "Ranking",
    sub: "Xem snapshot bảng xếp hạng của các Round được phân công",
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
    dashboard: (
      <JudgeOverview
        onOpenScoring={openScoring}
      />
    ),
    rounds: <JudgeRounds onOpenScoring={openScoring} />,
    scoring: <JudgeScoringWorkspace initialRoundId={scoringRoundId} />,
    history: <ScoringHistory submissions={[]} />,
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

      <div className="flex min-w-0 flex-1 flex-col">
        <JudgeHeader onMenuClick={() => setSidebarOpen(true)} />
        <JudgePageTitle title={title.title} sub={title.sub} />
        <main className="flex-1 px-4 py-6 sm:px-8">
          {views[activeNav] || views.dashboard}
        </main>
        <footer
          className="border-t bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-8"
          style={{ borderColor: "#E5E7EB" }}
        >
          SEAL Hackathon Judge Console • API scoring workspace
        </footer>
      </div>
    </div>
  );
}
