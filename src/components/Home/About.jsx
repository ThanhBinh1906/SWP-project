import React from 'react';
import { Lightbulb, Users, Code2 } from 'lucide-react';

const features = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    color: '#F26F21',
    shadow: 'rgba(242,111,33,0.3)',
    desc: 'Push boundaries with cutting-edge solutions. We challenge you to think differently and solve real-world problems with creativity and tech.',
  },
  {
    icon: Users,
    title: 'Networking',
    color: '#38b6ff',
    shadow: 'rgba(56,182,255,0.3)',
    desc: 'Connect with top engineers, designers, and entrepreneurs. Build relationships that last far beyond the 48-hour sprint.',
  },
  {
    icon: Code2,
    title: 'Coding',
    color: '#a78bfa',
    shadow: 'rgba(167,139,250,0.3)',
    desc: 'Ship production-ready code under pressure. Sharpen your skills across frontend, backend, AI, and systems programming.',
  },
];

export default function About() {
  return (
    <section id="about" className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-[#F26F21]/50" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#38b6ff]/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#F26F21] mb-3">
            About the Event
          </p>
          <h2
            className="text-3xl md:text-4xl font-black uppercase text-white mb-5"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            What is{' '}
            <span className="text-[#F26F21]">FPTU Hackathon</span>?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
            FPTU Hackathon 2026 is the premier 48-hour coding marathon at FPT University, bringing
            together the brightest student minds across Vietnam to prototype, build, and present
            transformative technology solutions — in a single electrifying weekend.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, color, shadow, desc }) => (
            <div
              key={title}
              className="glass rounded-xl p-8 group hover:scale-[1.02] transition-transform duration-300"
              style={{ borderColor: `${color}22` }}
            >
              {/* Icon container */}
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-6"
                style={{
                  background: `${color}18`,
                  boxShadow: `0 0 20px ${shadow}`,
                }}
              >
                <Icon
                  className="w-7 h-7"
                  style={{ color }}
                />
              </div>

              <h3
                className="text-xl font-bold uppercase text-white mb-3 tracking-wide"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {title}
              </h3>

              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>

              {/* Bottom accent line */}
              <div
                className="mt-6 h-[1px] w-0 group-hover:w-full transition-all duration-500"
                style={{ background: color }}
              />
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 glass rounded-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: '500+', label: 'Participants' },
            { val: '48h', label: 'Hacking Time' },
            { val: '50+', label: 'Mentors' },
            { val: '100M+', label: 'Prize Pool (VND)' },
          ].map(({ val, label }) => (
            <div key={label}>
              <p
                className="text-3xl font-black text-[#F26F21] mb-1"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {val}
              </p>
              <p className="text-xs font-medium tracking-widest uppercase text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
