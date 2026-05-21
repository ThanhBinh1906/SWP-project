import { Code2, CloudUpload, Users, LogOut, Trophy } from 'lucide-react';

const navItems = [
  { id: 'challenges', label: 'View Challenges', labelVi: 'Xem đề', icon: Code2 },
  { id: 'submit', label: 'Submit Project', labelVi: 'Submit', icon: CloudUpload },
  { id: 'team', label: 'Team Information', labelVi: 'Thông tin nhóm', icon: Users },
];

export function Sidebar({ active, onNav }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-30"
      style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(242,111,33,0.15)' }}>
      {/* Logo & Team */}
      <div className="px-6 py-7 border-b" style={{ borderColor: 'rgba(242,111,33,0.15)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F26F21, #c9520e)' }}>
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F26F21' }}>FPT Hackathon</p>
            <p className="text-xs text-slate-400">2026 Edition</p>
          </div>
        </div>
        <div className="mt-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(242,111,33,0.08)', border: '1px solid rgba(242,111,33,0.18)' }}>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Team</p>
          <p className="text-white font-bold text-sm tracking-tight">Team Alpha</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-600 px-3 mb-3">Navigation</p>
        {navItems.map(({ id, label, labelVi, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group"
              style={{
                background: isActive ? 'rgba(242,111,33,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(242,111,33,0.35)' : '1px solid transparent',
                boxShadow: isActive ? '0 0 16px rgba(242,111,33,0.1)' : 'none',
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(242,111,33,0.25)' : 'rgba(255,255,255,0.04)',
                }}>
                <Icon className="w-4 h-4 transition-colors duration-200"
                  style={{ color: isActive ? '#F26F21' : '#6b7280' }} />
              </div>
              <div>
                <p className="text-sm font-semibold transition-colors duration-200"
                  style={{ color: isActive ? '#F26F21' : '#e2e8f0' }}>{label}</p>
                <p className="text-[10px]" style={{ color: isActive ? 'rgba(242,111,33,0.7)' : '#4b5563' }}>{labelVi}</p>
              </div>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#F26F21', boxShadow: '0 0 6px #F26F21' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-6 border-t pt-4 space-y-3" style={{ borderColor: 'rgba(242,111,33,0.1)' }}>
        {/* Avatar */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #F26F21, #c9520e)' }}>
            N
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Nguyen Van A</p>
            <p className="text-[10px] text-slate-500 truncate">Leader</p>
          </div>
        </div>
        <button
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
