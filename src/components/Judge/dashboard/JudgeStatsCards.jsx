import { JudgeStatCard } from "../shared/JudgeStatCard";
import { judgeIcons } from "../shared/judgeIcons";

export function JudgeStatsCards({ rounds, totalSubmissions }) {
  const scoringRound = rounds.find((round) => round.status === "Scoring");
  const activeCount = rounds.filter((round) => round.status === "Active").length;
  const closedCount = rounds.filter((round) => round.status === "Closed").length;

  const stats = [
    { label: "Vòng được phân công", value: rounds.length, icon: judgeIcons.CalendarDays, tone: "orange", helper: "Sẵn sàng để chấm điểm" },
    { label: "Active Scoring", value: scoringRound ? scoringRound.name : "None", icon: judgeIcons.Timer, tone: "purple", helper: "Current scoring window" },
    { label: "Submissions", value: totalSubmissions, icon: judgeIcons.CheckCircle2, tone: "green", helper: "Trong các Round được gán" },
    { label: "Active / Closed", value: `${activeCount} / ${closedCount}`, icon: judgeIcons.Lock, tone: "red", helper: "Trạng thái Round" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => <JudgeStatCard key={stat.label} {...stat} />)}
    </div>
  );
}
