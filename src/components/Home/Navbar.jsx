import React, { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { AuthButtons } from './AuthButtons';

export default function Navbar({ onLoginClick, onRegisterClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Home', 'Timeline', 'Prizes', 'FAQ'];

  const handleLogin = () => {
    setMenuOpen(false);
    onLoginClick?.();
  };

  const handleRegister = () => {
    setMenuOpen(false);
    onRegisterClick?.();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-[#F26F21]/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-[#F26F21] flex items-center justify-center glow-orange">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span
            className="text-white font-black text-lg tracking-widest uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            FPTU <span className="text-[#F26F21]">Hackathon</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-slate-300 hover:text-[#F26F21] text-sm font-medium tracking-wider uppercase transition-colors duration-200 relative group"
            >
              {link}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#F26F21] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <AuthButtons
            onLoginClick={handleLogin}
            onRegisterClick={handleRegister}
          />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="text-slate-300 hover:text-[#F26F21] text-sm font-medium tracking-wider uppercase transition-colors"
            >
              {link}
            </a>
          ))}
          <AuthButtons
            onLoginClick={handleLogin}
            onRegisterClick={handleRegister}
            fullWidth
            className="flex-col"
            loginClassName="text-center"
            registerClassName="text-center"
          />
        </div>
      )}
    </nav>
  );
}
