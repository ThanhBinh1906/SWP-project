import { useState } from 'react';
import Modal from './Modal';
import PasswordInput, { authLabelClass } from './PasswordInput';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#F26F21]/60 focus:ring-1 focus:ring-[#F26F21]/30 transition-colors';

export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onClose();
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Login"
      subtitle="Sign in with your Gmail and password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
            Gmail
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <PasswordInput
          id="login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="submit"
          className="w-full mt-2 px-5 py-3 bg-[#F26F21] text-white text-sm font-bold tracking-wider uppercase rounded-lg glow-orange hover:bg-[#e05a10] transition-all duration-200"
        >
          Login
        </button>
      </form>
    </Modal>
  );
}
