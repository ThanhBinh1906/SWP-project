import React from 'react';
import { Zap, Github, Facebook, Linkedin, Twitter, Mail, MapPin, Phone } from 'lucide-react';

const quickLinks = ['Home', 'Timeline', 'Prizes', 'FAQ', 'Sponsors'];
const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#070A0F] border-t border-[#F26F21]/15">
      {/* Top neon line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#F26F21]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand col */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-[#F26F21] flex items-center justify-center glow-orange">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-white font-black text-base tracking-widest uppercase"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                FPTU <span className="text-[#F26F21]">Hackathon</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              The most electrifying 48-hour coding competition at FPT University, Vietnam.
            </p>
            <p
              className="text-xs font-black tracking-widest uppercase text-[#F26F21]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              FPT University
            </p>
            <p className="text-xs text-slate-600 mt-1">Ho Chi Minh City Campus</p>
          </div>

          {/* Quick links */}
          <div>
            <h4
              className="text-white font-bold uppercase tracking-widest text-xs mb-5"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-slate-500 hover:text-[#F26F21] text-sm transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#F26F21] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-white font-bold uppercase tracking-widest text-xs mb-5"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Contact
            </h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3 text-sm text-slate-500">
                <MapPin className="w-4 h-4 text-[#F26F21] flex-shrink-0 mt-0.5" />
                <span>Lot E2a-7, D1 Street, Long Thanh My, Thu Duc, Ho Chi Minh City</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <Mail className="w-4 h-4 text-[#F26F21] flex-shrink-0" />
                <a href="mailto:hackathon@fpt.edu.vn" className="hover:text-[#F26F21] transition-colors">
                  hackathon@fpt.edu.vn
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <Phone className="w-4 h-4 text-[#F26F21] flex-shrink-0" />
                <span>+84 28 7300 5588</span>
              </li>
            </ul>
          </div>

          {/* Social + Register CTA */}
          <div>
            <h4
              className="text-white font-bold uppercase tracking-widest text-xs mb-5"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Follow Us
            </h4>
            <div className="flex gap-3 mb-8">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-[#F26F21] hover:border-[#F26F21]/40 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            <a
              href="#register"
              className="block px-6 py-3 bg-[#F26F21] text-white text-sm font-bold tracking-wider uppercase rounded text-center glow-orange hover:bg-[#e05a10] transition-all duration-200"
            >
              Register Now
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            &copy; 2026 FPTU Hackathon. Organized by FPT University Student Union. All rights reserved.
          </p>
          <p className="text-slate-700 text-xs font-mono tracking-widest">
            CODE &middot; CREATE &middot; CONQUER
          </p>
        </div>
      </div>
    </footer>
  );
}
