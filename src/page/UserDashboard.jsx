import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveEvent } from "../store/eventSlice";
import { fetchMyTeam } from "../store/teamSlice";
import { Loader2 } from "lucide-react";
import { Sidebar } from "../components/UserDashboard/Sidebar";
import { Header } from "../components/UserDashboard/Header";
import { ChallengesView } from "../components/UserDashboard/ChallengesView";
import { SubmitView } from "../components/UserDashboard/SubmitView";
import { TeamView } from "../components/UserDashboard/TeamView";

const viewTitles = {
  challenges: {
    title: "View Challenges",
    sub: "Browse all active and upcoming challenges",
  },
  submit: {
    title: "Nộp bài dự án",
    sub: "Cập nhật link dự án, slide và mã nguồn GitHub",
  },
  team: {
    title: "Team Information",
    sub: "Manage your team and track progress",
  },
};

export default function UserDashboard() {
  const [activeNav, setActiveNav] = useState("challenges");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();

  const { activeEventId, loading: eventLoading } = useSelector((s) => s.event);
  const { fetched: teamFetched, loading: teamLoading } = useSelector(
    (s) => s.team,
  );

  // Step 1: fetch active event
  useEffect(() => {
    if (activeEventId === null) {
      dispatch(fetchActiveEvent());
    }
  }, [dispatch, activeEventId]);

  // Step 2: fetch my-team sau khi có activeEventId
  useEffect(() => {
    if (activeEventId && !teamFetched) {
      dispatch(fetchMyTeam());
    }
  }, [dispatch, activeEventId, teamFetched]);

  const loading =
    eventLoading || (activeEventId && teamLoading && !teamFetched);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0E14] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#F26F21]" />
          <p className="text-sm font-semibold tracking-wider text-slate-300 uppercase">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{
        background: "#F9FAFB",
        fontFamily:
          "'Montserrat', 'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,111,33,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(242,111,33,0.02) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="fixed top-0 left-64 right-0 h-96 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(242,111,33,0.03) 0%, transparent 100%)",
        }}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm transition-all duration-300 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        active={activeNav}
        onNav={(id) => {
          setActiveNav(id);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="px-8 py-5 border-b" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-end gap-3">
            <div>
              <h2
                className="text-2xl font-black tracking-tight text-[#111827]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {viewTitles[activeNav].title}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {viewTitles[activeNav].sub}
              </p>
            </div>
            <div
              className="mb-1 flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(242,111,33,0.4), transparent)",
              }}
            />
          </div>
        </div>

        <main className="flex-1 px-8 py-7">
          <div key={activeNav} className="animate-fade-in">
            {activeNav === "challenges" && <ChallengesView />}
            {activeNav === "submit" && <SubmitView eventId={activeEventId} />}
            {activeNav === "team" && <TeamView />}
          </div>
        </main>

        <footer
          className="px-8 py-4 border-t flex items-center justify-between text-[11px]"
          style={{ borderColor: "#E5E7EB", color: "#4B5563" }}
        >
          <span>FPT Hackathon 2026 &mdash; All rights reserved.</span>
          <span className="font-semibold" style={{ color: "#F26F21" }}>
            FPT Hackathon 2026
          </span>
        </footer>
      </div>
    </div>
  );
}
