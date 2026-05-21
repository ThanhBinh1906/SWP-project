import { TeamStatus } from './TeamStatus';
import { Mail, MessageSquare, Edit2 } from 'lucide-react';

const stats = [
  { label: 'Commits', value: '47', color: '#F26F21' },
  { label: 'Pull Requests', value: '12', color: '#6366f1' },
  { label: 'Issues Closed', value: '8', color: '#10b981' },
  { label: 'Hours Active', value: '34', color: '#06b6d4' },
];

export function TeamView() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}33`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <p className="text-2xl font-black mb-0.5" style={{ color: s.color, fontFamily: "'Montserrat', sans-serif" }}>{s.value}</p>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Team status + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <TeamStatus />
        </div>
        {/* Actions panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-white mb-4">Team Actions</h3>
            <div className="space-y-2.5">
              {[
                { Icon: MessageSquare, label: 'Open Team Chat', color: '#F26F21' },
                { Icon: Mail, label: 'Contact Mentors', color: '#6366f1' },
                { Icon: Edit2, label: 'Edit Team Profile', color: '#06b6d4' },
              ].map(({ Icon, label, color }) => (
                <button key={label}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = `${color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress towards submission */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-white mb-4">Sprint Progress</h3>
            {[
              { task: 'Frontend UI', pct: 80, color: '#F26F21' },
              { task: 'Backend API', pct: 65, color: '#6366f1' },
              { task: 'ML Model', pct: 45, color: '#06b6d4' },
              { task: 'Documentation', pct: 30, color: '#10b981' },
            ].map(({ task, pct, color }) => (
              <div key={task} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="font-medium text-slate-400">{task}</span>
                  <span className="font-bold" style={{ color }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
