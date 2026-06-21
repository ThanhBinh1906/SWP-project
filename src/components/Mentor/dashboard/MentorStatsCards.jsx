import { MentorStatCard } from "../shared/MentorStatCard";
import { mentorIcons } from "../shared/mentorIcons";

export function MentorStatsCards({ teams = [] }) {
  const trackCount = new Set(teams.map((team) => team.trackId).filter(Boolean)).size;
  const submitted = teams.filter((team) => team.submissionStatus === "Submitted").length;
  const memberCount = teams.reduce((total, team) => total + (team.members?.length || 0), 0);
  const stats = [
    { label: "Track được phân công", value: trackCount, icon: mentorIcons.GitBranch, tone: "orange", helper: "Phạm vi đang phụ trách" },
    { label: "Team đang hướng dẫn", value: teams.length, icon: mentorIcons.Users, tone: "blue", helper: "Dữ liệu chỉ xem" },
    { label: "Thành viên", value: memberCount, icon: mentorIcons.UserCheck, tone: "amber", helper: "Tổng số thành viên" },
    { label: "Team đã nộp bài", value: `${submitted}/${teams.length}`, icon: mentorIcons.FileText, tone: "green", helper: "Theo dữ liệu submission" },
  ];

  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <MentorStatCard key={stat.label} {...stat} />)}</div>;
}
