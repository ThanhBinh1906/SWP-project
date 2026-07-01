import React from 'react';
import { Trophy, Lock, ShieldCheck } from 'lucide-react';

const reviewSteps = [
  { label: 'Submissions Collected', done: true },
  { label: 'Judge Scoring Complete', done: true },
  { label: 'Final Review in Progress', done: false },
  { label: 'Results Published', done: false },
];

export default function ResultLockScreen() {
  return (
    <div className="min-h-screen bg-[#080A0F] dot-bg flex items-center justify-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[#F26F21]/[0.02] blur-[150px]" />
      </div>
      <div className="absolute top-20 left-10 w-[300px] h-[300px] rounded-full bg-[#38b6ff]/[0.015] blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto fade-in-up">
        {/* Lock icon with glow */}
        <div className="mx-auto mb-8 w-24 h-24 rounded-2xl flex items-center justify-center bg-[#F26F21]/[0.06] border border-[#F26F21]/20 shadow-[0_0_40px_rgba(242,111,33,0.08)]">
          <Trophy className="w-10 h-10 text-[#F26F21]" />
        </div>

        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Results Are Being{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26F21] to-orange-400">
            Finalized
          </span>
        </h1>

        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-10">
          The organizing committee is reviewing all submissions and scores.
          Official results will be announced once the review process is complete.
        </p>

        {/* Review progress */}
        <div className="max-w-sm mx-auto">
          <div className="flex flex-col gap-3">
            {reviewSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    step.done
                      ? 'bg-[#F26F21]/10 border-[#F26F21]/30'
                      : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  {step.done ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F26F21]" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-600" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step.done ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
                {i === 2 && !step.done && (
                  <span className="ml-auto text-[9px] font-bold tracking-wider uppercase text-[#F26F21] animate-pulse">
                    IN PROGRESS
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom hint */}
        <p className="mt-12 text-[11px] text-slate-600 tracking-wide">
          This page will automatically update when results are published.
        </p>
      </div>
    </div>
  );
}
