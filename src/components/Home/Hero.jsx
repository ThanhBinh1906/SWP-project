import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass rounded-lg px-5 py-4 min-w-[80px] text-center gradient-border glow-orange">
        <span
          className="text-4xl md:text-5xl font-black text-[#F26F21] tabular-nums"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-xs font-semibold tracking-widest uppercase text-slate-400">
        {label}
      </span>
    </div>
  );
}

function CircuitSVG() {
  return (
    <svg
      viewBox="0 0 500 500"
      className="w-full h-full opacity-80 float-anim"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="250" cy="250" r="200" stroke="#F26F21" strokeWidth="0.5" strokeDasharray="8 4" opacity="0.4" />
      <circle cx="250" cy="250" r="160" stroke="#38b6ff" strokeWidth="0.5" strokeDasharray="6 6" opacity="0.3" />
      <circle cx="250" cy="250" r="120" stroke="#F26F21" strokeWidth="1" opacity="0.6" />

      {/* Center glow */}
      <circle cx="250" cy="250" r="18" fill="#F26F21" opacity="0.15" />
      <circle cx="250" cy="250" r="10" fill="#F26F21" opacity="0.8" />
      <circle cx="250" cy="250" r="5" fill="white" />

      {/* Circuit lines */}
      <path d="M250 130 L250 90 L310 90 L310 60" stroke="#F26F21" strokeWidth="1.5" opacity="0.7" />
      <path d="M250 370 L250 410 L190 410 L190 440" stroke="#38b6ff" strokeWidth="1.5" opacity="0.7" />
      <path d="M130 250 L90 250 L90 190 L60 190" stroke="#F26F21" strokeWidth="1.5" opacity="0.7" />
      <path d="M370 250 L410 250 L410 310 L440 310" stroke="#38b6ff" strokeWidth="1.5" opacity="0.7" />
      <path d="M180 180 L140 140 L100 140" stroke="#F26F21" strokeWidth="1" opacity="0.5" />
      <path d="M320 320 L360 360 L400 360" stroke="#38b6ff" strokeWidth="1" opacity="0.5" />
      <path d="M320 180 L360 140 L400 140" stroke="#F26F21" strokeWidth="1" opacity="0.5" />
      <path d="M180 320 L140 360 L100 360" stroke="#38b6ff" strokeWidth="1" opacity="0.5" />

      {/* Node dots */}
      <circle cx="310" cy="60" r="4" fill="#F26F21" />
      <circle cx="190" cy="440" r="4" fill="#38b6ff" />
      <circle cx="60" cy="190" r="4" fill="#F26F21" />
      <circle cx="440" cy="310" r="4" fill="#38b6ff" />
      <circle cx="100" cy="140" r="3" fill="#F26F21" opacity="0.7" />
      <circle cx="400" cy="360" r="3" fill="#38b6ff" opacity="0.7" />
      <circle cx="400" cy="140" r="3" fill="#F26F21" opacity="0.7" />
      <circle cx="100" cy="360" r="3" fill="#38b6ff" opacity="0.7" />

      {/* Axis lines */}
      <line x1="250" y1="130" x2="250" y2="370" stroke="white" strokeWidth="0.3" opacity="0.1" />
      <line x1="130" y1="250" x2="370" y2="250" stroke="white" strokeWidth="0.3" opacity="0.1" />

      {/* Diagonal cross */}
      <line x1="180" y1="180" x2="320" y2="320" stroke="white" strokeWidth="0.3" opacity="0.08" />
      <line x1="320" y1="180" x2="180" y2="320" stroke="white" strokeWidth="0.3" opacity="0.08" />

      {/* Small orbit dots */}
      <circle cx="250" cy="130" r="3" fill="#F26F21" />
      <circle cx="250" cy="370" r="3" fill="#38b6ff" />
      <circle cx="130" cy="250" r="3" fill="#F26F21" />
      <circle cx="370" cy="250" r="3" fill="#38b6ff" />
    </svg>
  );
}

export default function Hero({ onRegisterClick }) {
  const TARGET_DATE = new Date('2026-03-15T08:00:00');

  const getTimeLeft = () => {
    const diff = TARGET_DATE - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center circuit-bg overflow-hidden"
    >
      {/* Neon horizontal line */}
      <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F26F21]/30 to-transparent neon-line" />
      <div className="absolute bottom-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38b6ff]/20 to-transparent neon-line" style={{ animationDelay: '1.2s' }} />

      {/* Radial glow center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[#F26F21]/5 blur-[120px]" />
      </div>

      {/* Corner accents */}
      <div className="absolute top-24 left-8 w-12 h-12 border-l-2 border-t-2 border-[#F26F21]/50" />
      <div className="absolute top-24 right-8 w-12 h-12 border-r-2 border-t-2 border-[#F26F21]/50" />
      <div className="absolute bottom-12 left-8 w-12 h-12 border-l-2 border-b-2 border-[#38b6ff]/50" />
      <div className="absolute bottom-12 right-8 w-12 h-12 border-r-2 border-b-2 border-[#38b6ff]/50" />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 w-full grid md:grid-cols-2 gap-12 items-center">
        {/* Text side */}
        <div className="fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F26F21]/40 bg-[#F26F21]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F26F21] animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-[#F26F21]">
              March 15–17, 2026 · FPT University
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-tight text-white mb-6"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            CODE THE{' '}
            <span className="text-[#F26F21] glow-orange-text">FUTURE</span>
            ,{' '}
            <br />
            BUILD THE{' '}
            <span className="text-[#38b6ff]" style={{ textShadow: '0 0 20px rgba(56,182,255,0.8)' }}>
              WORLD
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed max-w-lg">
            48 hours. One campus. Unlimited possibilities. Join the most electrifying tech competition
            in Vietnam and turn your boldest ideas into reality.
          </p>

          {/* Countdown */}
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">
              Event Starts In
            </p>
            <div className="flex items-start gap-4">
              <CountdownUnit value={timeLeft.days} label="Days" />
              <span className="text-3xl font-black text-[#F26F21] mt-3">:</span>
              <CountdownUnit value={timeLeft.hours} label="Hours" />
              <span className="text-3xl font-black text-[#F26F21] mt-3">:</span>
              <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onRegisterClick}
              className="px-8 py-3 bg-[#F26F21] text-white font-bold tracking-wider uppercase rounded glow-orange hover:bg-[#e05a10] transition-all duration-200 text-sm"
            >
              Register
            </button>
            <a
              href="#about"
              className="px-8 py-3 border border-[#38b6ff]/60 text-[#38b6ff] font-bold tracking-wider uppercase rounded hover:bg-[#38b6ff]/10 transition-all duration-200 text-sm"
            >
              View Theme
            </a>
          </div>
        </div>

        {/* Circuit graphic side */}
        <div className="hidden md:flex items-center justify-center">
          <div className="w-[420px] h-[420px] relative">
            <CircuitSVG />
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-[#F26F21]/5 blur-2xl" />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center text-slate-500 hover:text-[#F26F21] transition-colors"
      >
        <span className="text-xs tracking-widest uppercase mb-1">Scroll</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </a>
    </section>
  );
}
