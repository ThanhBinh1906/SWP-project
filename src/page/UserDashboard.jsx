import { useState } from "react";
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
    title: "Submit Project",
    sub: "Upload your project files or link your repository",
  },
  team: {
    title: "Team Information",
    sub: "Manage your team and track progress",
  },
};

export default function UserDashboard() {
  const [activeNav, setActiveNav] = useState("challenges");

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#0D1117",
        fontFamily:
          "'Montserrat', 'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Background grid texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,111,33,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(242,111,33,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-64 right-0 h-96 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(242,111,33,0.06) 0%, transparent 100%)",
        }}
      />

      <Sidebar active={activeNav} onNav={setActiveNav} />

      {/* Main layout */}
      <div className="ml-64 flex flex-col min-h-screen">
        <Header />

        {/* Page title strip */}
        <div
          className="px-8 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-end gap-3">
            <div>
              <h2
                className="text-2xl font-black tracking-tight text-white"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {viewTitles[activeNav].title}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {viewTitles[activeNav].sub}
              </p>
            </div>
            {/* neon accent line */}
            <div
              className="mb-1 flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(242,111,33,0.4), transparent)",
              }}
            />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-8 py-7">
          {activeNav === "challenges" && <ChallengesView />}
          {activeNav === "submit" && <SubmitView />}
          {activeNav === "team" && <TeamView />}
        </main>

        {/* Footer */}
        <footer
          className="px-8 py-4 border-t flex items-center justify-between text-[11px]"
          style={{ borderColor: "rgba(255,255,255,0.05)", color: "#374151" }}
        >
          <span>FPT Hackathon 2026 &mdash; All rights reserved.</span>
          <span className="font-mono" style={{ color: "rgba(242,111,33,0.4)" }}>
            Team Alpha &bull; CH-001
          </span>
        </footer>
      </div>
    </div>
  );
}
