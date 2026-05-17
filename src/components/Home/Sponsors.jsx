import React from 'react';

const tiers = [
  {
    tier: 'Platinum',
    color: '#e2e8f0',
    glow: 'rgba(226,232,240,0.2)',
    sponsors: ['FPT Software', 'FPT Telecom'],
    size: 'text-2xl',
  },
  {
    tier: 'Gold',
    color: '#F26F21',
    glow: 'rgba(242,111,33,0.2)',
    sponsors: ['VNG Corporation', 'Grab Vietnam', 'Momo'],
    size: 'text-xl',
  },
  {
    tier: 'Silver',
    color: '#38b6ff',
    glow: 'rgba(56,182,255,0.15)',
    sponsors: ['Axon Active', 'Rikkeisoft', 'TMA Solutions', 'KMS Technology'],
    size: 'text-base',
  },
];

export default function Sponsors() {
  return (
    <section id="sponsors" className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#38b6ff]/20 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#38b6ff]/4 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#38b6ff] mb-3">
            Partners
          </p>
          <h2
            className="text-3xl md:text-4xl font-black uppercase text-white"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Our <span className="text-[#F26F21]">Sponsors</span>
          </h2>
        </div>

        {/* Tiers */}
        <div className="flex flex-col gap-12">
          {tiers.map(({ tier, color, glow, sponsors, size }) => (
            <div key={tier} className="text-center">
              {/* Tier label */}
              <div className="flex items-center gap-4 justify-center mb-6">
                <div className="flex-1 max-w-[120px] h-px" style={{ background: `${color}40` }} />
                <span
                  className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                  style={{
                    color,
                    background: `${color}14`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {tier}
                </span>
                <div className="flex-1 max-w-[120px] h-px" style={{ background: `${color}40` }} />
              </div>

              {/* Logos */}
              <div className="flex flex-wrap justify-center gap-5">
                {sponsors.map((name) => (
                  <div
                    key={name}
                    className="glass rounded-lg px-8 py-5 hover:scale-105 transition-transform duration-200 cursor-pointer"
                    style={{ boxShadow: `0 0 16px ${glow}` }}
                  >
                    <span
                      className={`font-black uppercase tracking-widest ${size}`}
                      style={{ color, fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Become a sponsor CTA */}
        <div className="mt-16 text-center glass rounded-xl p-8 border border-[#F26F21]/20">
          <p
            className="text-xl font-bold uppercase text-white mb-3"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Want to be a Sponsor?
          </p>
          <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
            Reach 500+ top-tier CS students and emerging engineers at Vietnam's leading tech university.
          </p>
          <a
            href="mailto:hackathon@fpt.edu.vn"
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#F26F21] text-[#F26F21] font-bold tracking-wider uppercase rounded hover:bg-[#F26F21]/10 transition-all duration-200 text-sm"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
