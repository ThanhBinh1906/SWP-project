import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from './Modal';
import PasswordInput from './PasswordInput';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#F26F21]/60 focus:ring-1 focus:ring-[#F26F21]/30 transition-colors';

const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

const emptyMember = () => ({ name: '', email: '' });

const initialState = () => ({
  leaderName: '',
  leaderEmail: '',
  leaderPassword: '',
  members: [emptyMember()],
});

export default function RegisterModal({ open, onClose }) {
  const [form, setForm] = useState(initialState);

  const resetAndClose = () => {
    setForm(initialState());
    onClose();
  };

  const updateLeader = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateMember = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const addMember = () => {
    if (form.members.length >= 4) return;
    setForm((prev) => ({
      ...prev,
      members: [...prev.members, emptyMember()],
    }));
  };

  const removeMember = (index) => {
    if (form.members.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    resetAndClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Register"
      subtitle="Register your team for FPT Hackathon 2026"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team leader */}
        <section>
          <h3
            className="text-sm font-bold text-[#F26F21] uppercase tracking-widest mb-4 pb-2 border-b border-[#F26F21]/20"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Team Leader
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="leader-name" className={labelClass}>
                Full Name
              </label>
              <input
                id="leader-name"
                type="text"
                required
                placeholder="John Doe"
                value={form.leaderName}
                onChange={(e) => updateLeader('leaderName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="leader-email" className={labelClass}>
                Gmail
              </label>
              <input
                id="leader-email"
                type="email"
                required
                autoComplete="email"
                placeholder="example@gmail.com"
                value={form.leaderEmail}
                onChange={(e) => updateLeader('leaderEmail', e.target.value)}
                className={inputClass}
              />
            </div>
            <PasswordInput
              id="leader-password"
              label="Password"
              value={form.leaderPassword}
              onChange={(e) => updateLeader('leaderPassword', e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </section>

        {/* Team members */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h3
              className="text-sm font-bold text-[#38b6ff] uppercase tracking-widest"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Team Members
            </h3>
            {form.members.length < 4 && (
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#38b6ff] hover:text-[#5cc4ff] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </div>

          <div className="space-y-4">
            {form.members.map((member, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Member {index + 1}
                  </span>
                  {form.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      aria-label="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor={`member-name-${index}`}
                      className={labelClass}
                    >
                      Full Name
                    </label>
                    <input
                      id={`member-name-${index}`}
                      type="text"
                      required
                      placeholder="Jane Smith"
                      value={member.name}
                      onChange={(e) =>
                        updateMember(index, 'name', e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`member-email-${index}`}
                      className={labelClass}
                    >
                      Gmail
                    </label>
                    <input
                      id={`member-email-${index}`}
                      type="email"
                      required
                      placeholder="member@gmail.com"
                      value={member.email}
                      onChange={(e) =>
                        updateMember(index, 'email', e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Up to 4 members (excluding team leader). Teams must have 2–5 people.
          </p>
        </section>

        <button
          type="submit"
          className="w-full px-5 py-3 bg-[#F26F21] text-white text-sm font-bold tracking-wider uppercase rounded-lg glow-orange hover:bg-[#e05a10] transition-all duration-200"
        >
          Register
        </button>
      </form>
    </Modal>
  );
}
