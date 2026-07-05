import { useCallback, useEffect, useState } from "react";
import { MentorOverview } from "../components/Mentor/dashboard/MentorOverview";
import { MentorHeader } from "../components/Mentor/layout/MentorHeader";
import { MentorPageTitle } from "../components/Mentor/layout/MentorPageTitle";
import { MentorSidebar } from "../components/Mentor/layout/MentorSidebar";
import { MentorTeams } from "../components/Mentor/teams/MentorTeams";
import mentorService from "../services/mentorService";
import submissionService from "../services/submissionService";

const viewTitles = {
  dashboard: {
    title: "Mentor Dashboard",
    sub: "Monitor assigned tracks, teams, topics, and read-only submissions",
  },
  teams: {
    title: "Assigned Teams",
    sub: "View team members, submissions, status, and assigned topics",
  },
};

export default function MentorDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const title = viewTitles[activeNav] || viewTitles.dashboard;

  const loadMentorTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const teamsResponse = await mentorService.getTeams();
      const teamList = teamsResponse.data?.data || [];
      const submissionResults = await Promise.allSettled(
        teamList.map((team) => submissionService.getByTeam(team.id)),
      );
      setTeams(
        teamList.map((team, index) => {
          const result = submissionResults[index];
          const submissions =
            result?.status === "fulfilled" ? result.value.data?.data || [] : [];
          const sortedSubmissions = [...submissions].sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
          );
          const readinessParts = [
            Boolean(team.githubRepoLink),
            Boolean(team.topic),
            sortedSubmissions.length > 0,
          ];
          return {
            ...team,
            submissions: sortedSubmissions,
            latestSubmission: sortedSubmissions[0] || null,
            submissionStatus: sortedSubmissions.length ? "Submitted" : "Missing",
            submissionLoadFailed: result?.status === "rejected",
            readiness: Math.round(
              (readinessParts.filter(Boolean).length / readinessParts.length) * 100,
            ),
          };
        }),
      );
    } catch (requestError) {
      setTeams([]);
      setError(
        requestError?.response?.data?.message ||
          "Không thể tải danh sách team được phân công.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentorTeams();
  }, [loadMentorTeams]);

  const views = {
    dashboard: <MentorOverview teams={teams} loading={loading} error={error} onReload={loadMentorTeams} onViewTeams={() => setActiveNav("teams")} />,
    teams: <MentorTeams teams={teams} loading={loading} error={error} onReload={loadMentorTeams} />,
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
      <MentorSidebar
        active={activeNav}
        onNav={setActiveNav}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col md:pl-[236px]">
        <MentorHeader onMenuClick={() => setSidebarOpen(true)} />
        <MentorPageTitle title={title.title} sub={title.sub} />
        <main className="flex-1 px-4 py-6 sm:px-8">
          {views[activeNav] || views.dashboard}
        </main>
        <footer
          className="border-t bg-white px-4 py-4 text-center text-xs text-slate-700 sm:px-8"
          style={{ borderColor: "#E5E7EB" }}
        >
          SEAL Hackathon Mentor Console - Không gian theo dõi chỉ đọc
        </footer>
      </div>
    </div>
  );
}
