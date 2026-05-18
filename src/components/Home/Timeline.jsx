import React from "react";
import { ClipboardList, Mic, Terminal, Monitor } from "lucide-react";

const stages = [
  {
    icon: ClipboardList,
    phase: "Phase 01",
    title: "Registration",
    date: "Jan 15 – Feb 28, 2026",
    color: "#F26F21",
    shadow: "rgba(242,111,33,0.35)",
    desc: "Form your team (2–5 members) and register online. Submit your initial concept and tech stack.",
  },
  {
    icon: Mic,
    phase: "Phase 02",
    title: "Opening Ceremony",
    date: "March 15, 2026",
    color: "#38b6ff",
    shadow: "rgba(56,182,255,0.35)",
    desc: "Kick off with keynote speakers, sponsor presentations, theme reveal, and team networking mixer.",
  },
  {
    icon: Terminal,
    phase: "Phase 03",
    title: "Hacking 48h",
    date: "March 15–17, 2026",
    color: "#a78bfa",
    shadow: "rgba(167,139,250,0.35)",
    desc: "Two days of non-stop building. Mentors on-site, workshops, meals provided. Code, iterate, and ship.",
  },
  {
    icon: Monitor,
    phase: "Phase 04",
    title: "Demo Day",
    date: "March 17, 2026",
    color: "#34d399",
    shadow: "rgba(52,211,153,0.35)",
    desc: "Present your project to judges from top tech companies. Winners announced at the closing ceremony.",
  },
];

export default function Timeline() {
  return (
    <section id="timeline" className="relative py-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#F26F21]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#F26F21] mb-3">
            Schedule
          </p>
          <h2
            className="text-3xl md:text-4xl font-black uppercase text-white"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Event <span className="text-[#F26F21]">Timeline</span>
          </h2>
        </div>

        {/* Desktop horizontal timeline */}
        <div className="hidden lg:block">
          {/* Connector line */}
          <div className="relative flex items-start justify-between gap-4">
            <div className="absolute top-[28px] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-[#F26F21] via-[#38b6ff] via-[#a78bfa] to-[#34d399]" />

            {stages.map(
              (
                { icon: Icon, phase, title, date, color, shadow, desc },
                idx,
              ) => (
                <div
                  key={idx}
                  className="relative flex flex-col items-center flex-1 group"
                >
                  {/* Node */}
                  <div
                    className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `${color}20`,
                      border: `2px solid ${color}`,
                      boxShadow: `0 0 20px ${shadow}`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>

                  {/* Card */}
                  <div className="glass rounded-xl p-5 w-full group-hover:scale-[1.02] transition-transform duration-300">
                    <p
                      className="text-xs font-bold tracking-widest uppercase mb-1"
                      style={{ color }}
                    >
                      {phase}
                    </p>
                    <h3
                      className="text-base font-bold uppercase text-white mb-1"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">{date}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Mobile vertical timeline */}
        <div className="lg:hidden flex flex-col gap-0">
          {stages.map(
            ({ icon: Icon, phase, title, date, color, shadow, desc }, idx) => (
              <div key={idx} className="flex gap-5">
                {/* Left: node + line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${color}20`,
                      border: `2px solid ${color}`,
                      boxShadow: `0 0 16px ${shadow}`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  {idx < stages.length - 1 && (
                    <div
                      className="w-[2px] flex-1 my-2"
                      style={{ background: `${color}40` }}
                    />
                  )}
                </div>

                {/* Right: card */}
                <div className="glass rounded-xl p-5 mb-4 flex-1">
                  <p
                    className="text-xs font-bold tracking-widest uppercase mb-1"
                    style={{ color }}
                  >
                    {phase}
                  </p>
                  <h3
                    className="text-base font-bold uppercase text-white mb-1"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">{date}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
