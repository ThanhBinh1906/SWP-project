import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

const prizes = [
  {
    rank: '2nd Place',
    icon: Medal,
    amount: '30,000,000',
    currency: 'VND',
    perks: ['Internship Fast-Track', 'Mentor Sessions x3', 'Tech Swag Kit'],
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.3)',
    border: 'rgba(148,163,184,0.25)',
    order: 'md:order-1',
    scale: '',
  },
  {
    rank: '1st Place',
    icon: Trophy,
    amount: '50,000,000',
    currency: 'VND',
    perks: ['Full Internship Offer', 'Mentor Sessions x6', 'Hardware Bundle', 'Media Coverage'],
    color: '#F26F21',
    glow: 'rgba(242,111,33,0.4)',
    border: 'rgba(242,111,33,0.35)',
    order: 'md:order-2',
    scale: 'md:scale-110',
    featured: true,
  },
  {
    rank: '3rd Place',
    icon: Award,
    amount: '15,000,000',
    currency: 'VND',
    perks: ['Resume Boost Program', 'Mentor Session x1', 'Event Certificate'],
    color: '#c97c3a',
    glow: 'rgba(201,124,58,0.3)',
    border: 'rgba(201,124,58,0.25)',
    order: 'md:order-3',
    scale: '',
  },
];

export default function Prizes() {
  return (
    <section id="prizes" className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#F26F21]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F26F21]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#F26F21] mb-3">
            Rewards
          </p>
          <h2
            className="text-3xl md:text-4xl font-black uppercase text-white mb-4"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Prize <span className="text-[#F26F21]">Pool</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Over{' '}
            <span className="text-[#F26F21] font-bold">100,000,000 VND</span>{' '}
            in total rewards, opportunities, and goodies
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-end">
          {prizes.map(({ rank, icon: Icon, amount, currency, perks, color, glow, border, order, scale, featured }) => (
            <div
              key={rank}
              className={`relative rounded-xl p-8 flex flex-col items-center text-center transition-transform duration-300 hover:scale-[1.03] ${order} ${scale}`}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${border}`,
                boxShadow: featured ? `0 0 40px ${glow}, 0 0 80px rgba(242,111,33,0.1)` : `0 0 20px ${glow}`,
              }}
            >
              {featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F26F21] text-white text-xs font-bold tracking-widest uppercase glow-orange">
                  Top Prize
                </div>
              )}

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: `${color}18`,
                  boxShadow: `0 0 24px ${glow}`,
                }}
              >
                <Icon className="w-8 h-8" style={{ color }} />
              </div>

              {/* Rank */}
              <p
                className="text-xs font-bold tracking-widest uppercase mb-3"
                style={{ color }}
              >
                {rank}
              </p>

              {/* Amount */}
              <p
                className="text-4xl font-black text-white mb-1"
                style={{ fontFamily: 'Montserrat, sans-serif', textShadow: `0 0 20px ${color}80` }}
              >
                {amount}
              </p>
              <p className="text-sm font-semibold text-slate-400 mb-6">{currency}</p>

              {/* Divider */}
              <div className="w-full h-px mb-6" style={{ background: `${color}30` }} />

              {/* Perks */}
              <ul className="flex flex-col gap-2 w-full text-left">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Special prizes note */}
        <p className="text-center text-slate-500 text-xs mt-10 tracking-wide">
          + Special category prizes, best UI/UX award, best social impact award, and more.
        </p>
      </div>
    </section>
  );
}
