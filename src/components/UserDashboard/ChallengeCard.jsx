import { Zap, Clock, Star, ChevronRight } from 'lucide-react';

const difficultyMap = {
  Hard: { label: 'Hard', classes: 'text-red-400', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  Medium: { label: 'Medium', classes: 'text-yellow-400', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.25)' },
  Easy: { label: 'Easy', classes: 'text-emerald-400', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
};

const challenge = {
  id: 'CH-001',
  title: 'AI-Powered Smart City Solution',
  description: 'Build an intelligent platform that leverages real-time data streams to optimize urban infrastructure, reduce energy waste, and improve citizen quality of life using modern AI/ML techniques.',
  difficulty: 'Hard',
  track: 'AI & Machine Learning',
  timeLeft: '47h 30m',
  points: 1500,
  tags: ['AI/ML', 'IoT', 'Smart City', 'Real-time'],
};

export function ChallengeCard() {
  const diff = difficultyMap[challenge.difficulty];

  return (
    <div className="rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(242,111,33,0.2)',
        boxShadow: '0 0 40px rgba(242,111,33,0.05), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(242,111,33,0.15)', border: '1px solid rgba(242,111,33,0.3)' }}>
            <Zap className="w-4 h-4" style={{ color: '#F26F21' }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Active Challenge</p>
            <p className="text-[11px] font-medium" style={{ color: '#F26F21' }}>{challenge.id} &mdash; {challenge.track}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: diff.bg, border: `1px solid ${diff.border}`, color: diff.classes.replace('text-', '') }}>
            <span className={diff.classes}>{diff.label}</span>
          </span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-2 leading-snug tracking-tight"
        style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}>
        {challenge.title}
      </h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-5">{challenge.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {challenge.tags.map(tag => (
          <span key={tag} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-4 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" style={{ color: '#F26F21' }} />
            <span className="font-medium text-white">{challenge.timeLeft}</span>
            <span>left</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-medium text-white">{challenge.points.toLocaleString()}</span>
            <span>pts</span>
          </div>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #F26F21, #c9520e)', color: '#fff', boxShadow: '0 0 20px rgba(242,111,33,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(242,111,33,0.5)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(242,111,33,0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
