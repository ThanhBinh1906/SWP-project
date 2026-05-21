import { Users, Circle, Activity } from 'lucide-react';

const members = [
  { name: 'Nguyen Van A', role: 'Leader', initials: 'NA', online: true, color: '#F26F21', activity: 'Pushed commit 3m ago' },
  { name: 'Tran Thi B', role: 'Developer', initials: 'TB', online: true, color: '#6366f1', activity: 'Reviewing PR 12m ago' },
  { name: 'Le Van C', role: 'Designer', initials: 'LC', online: false, color: '#06b6d4', activity: 'Updated mockups 1h ago' },
  { name: 'Pham Thi D', role: 'Developer', initials: 'PD', online: true, color: '#10b981', activity: 'Fixed bug 25m ago' },
];

const roleColors = {
  Leader: { bg: 'rgba(242,111,33,0.15)', border: 'rgba(242,111,33,0.3)', text: '#F26F21' },
  Developer: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' },
  Designer: { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', text: '#22d3ee' },
};

const activityLog = [
  { time: '14:32', msg: 'Team Alpha submitted a draft', accent: '#F26F21' },
  { time: '13:55', msg: 'New message in challenge Q&A', accent: '#6366f1' },
  { time: '12:10', msg: 'Challenge rules updated by organizers', accent: '#f59e0b' },
  { time: '10:00', msg: 'Hackathon officially started', accent: '#10b981' },
];

export function TeamStatus() {
  return (
    <div className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(242,111,33,0.15)', border: '1px solid rgba(242,111,33,0.3)' }}>
          <Users className="w-4 h-4" style={{ color: '#F26F21' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Team Status</h3>
          <p className="text-[11px] text-slate-500">
            <span className="text-emerald-400 font-semibold">{members.filter(m => m.online).length}</span> of {members.length} online
          </p>
        </div>
      </div>

      {/* Members */}
      <div className="space-y-2 mb-5">
        {members.map(m => {
          const rc = roleColors[m.role] || roleColors['Developer'];
          return (
            <div key={m.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              {/* Avatar */}
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: m.color }}>
                {m.initials}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d1117]"
                  style={{ background: m.online ? '#22c55e' : '#4b5563' }} />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{m.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{m.activity}</p>
              </div>
              {/* Role badge */}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                {m.role}
              </span>
            </div>
          );
        })}
      </div>

      {/* Activity Log */}
      <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5" style={{ color: '#F26F21' }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Activity Log</p>
        </div>
        <div className="space-y-2.5">
          {activityLog.map((entry, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: entry.accent, boxShadow: `0 0 4px ${entry.accent}` }} />
              <div className="flex-1">
                <p className="text-xs text-slate-400 leading-snug">{entry.msg}</p>
              </div>
              <p className="text-[10px] text-slate-600 flex-shrink-0 font-mono">{entry.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
