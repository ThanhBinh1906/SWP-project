import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const inputClass =
  'w-full px-4 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#F26F21]/50 focus:ring-1 focus:ring-[#F26F21]/20 hover:border-white/[0.15] transition-all';

export const authLabelClass =
  'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required = true,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={authLabelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
