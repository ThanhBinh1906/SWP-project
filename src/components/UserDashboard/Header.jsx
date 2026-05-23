import { useState, useEffect } from 'react';
import { Bell, Clock, ChevronDown } from 'lucide-react';

// Deadline: 48 hours from a fixed reference (demo)
const DEADLINE = new Date(Date.now() + 48 * 60 * 60 * 1000);

function pad(n) {
  return String(n).padStart(2, '0');
}

function useCountdown(target) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSecs = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return { hours, minutes, seconds };
}

export function Header() {
  const { hours, minutes, seconds } = useCountdown(DEADLINE);
  const [hasNotif, setHasNotif] = useState(true);

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b"
      style={{
        background: '#FFFFFF',
        borderColor: '#E5E7EB',
      }}>
      {/* Greeting */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6B7280' }}>Welcome back</p>
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Montserrat', 'Inter', sans-serif", color: '#111827' }}>
          Nguyen Van A <span className="font-semibold" style={{ color: '#F26F21' }}>/ Team Alpha</span>
        </h1>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        {/* Countdown */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: '#FFF6F0', border: '1px solid #FFD0B5' }}>
          <Clock className="w-4 h-4" style={{ color: '#F26F21' }} />
          <div className="flex items-center gap-1 font-mono font-bold text-sm" style={{ color: '#111827' }}>
            <span className="tabular-nums">{pad(hours)}</span>
            <span style={{ color: '#F26F21' }}>:</span>
            <span className="tabular-nums">{pad(minutes)}</span>
            <span style={{ color: '#F26F21' }}>:</span>
            <span className="tabular-nums">{pad(seconds)}</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#F26F21' }}>Remaining</span>
        </div>

        {/* Bell */}
        <button
          className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
          onClick={() => setHasNotif(false)}
          onMouseEnter={e => { e.currentTarget.style.background = '#FFF6F0'; e.currentTarget.style.borderColor = '#FFD0B5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
        >
          <Bell className="w-4 h-4" style={{ color: '#6B7280' }} />
          {hasNotif && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#F26F21' }} />
          )}
        </button>
      </div>
    </header>
  );
}
