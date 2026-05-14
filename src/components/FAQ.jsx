import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Who can participate in FPTU Hackathon 2026?',
    a: 'The event is open to all currently enrolled students at FPT University campuses across Vietnam. Teams of 2–5 members are required. Students from any major are welcome.',
  },
  {
    q: 'Is there a registration fee?',
    a: 'No, participation is completely free. We provide meals, snacks, workspaces, and mentorship at no cost to participants.',
  },
  {
    q: 'What should I bring?',
    a: 'Bring your laptop, chargers, and any hardware you plan to use. We provide high-speed internet, power outlets, and collaborative workspace.',
  },
  {
    q: 'Do I need to have a project idea before registering?',
    a: 'No pre-formed idea is required. The theme will be revealed at the Opening Ceremony. You should have your team ready and a range of skills covered.',
  },
  {
    q: 'How are projects judged?',
    a: 'Projects are evaluated on Innovation & Creativity, Technical Complexity, Impact & Feasibility, and Quality of Presentation by a panel of industry experts.',
  },
  {
    q: 'Can I use AI tools and open-source libraries?',
    a: 'Yes! You may use any open-source libraries, APIs, and AI tools. The key requirement is that the core solution must be built during the 48-hour hacking period.',
  },
];

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b border-white/10 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={open}
      >
        <span
          className="font-semibold text-white group-hover:text-[#F26F21] transition-colors text-sm md:text-base"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <span className="text-[#F26F21] mr-3 font-black">
            {String(index + 1).padStart(2, '0')}.
          </span>
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 ml-4 transition-transform duration-300 ${open ? 'rotate-180 text-[#F26F21]' : 'text-slate-500'}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-slate-400 text-sm leading-relaxed pr-8">
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F26F21]/20 to-transparent" />

      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#F26F21] mb-3">
            Got Questions?
          </p>
          <h2
            className="text-3xl md:text-4xl font-black uppercase text-white"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            FAQ
          </h2>
        </div>

        <div className="glass rounded-xl p-6 md:p-10">
          {faqs.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          Still have questions?{' '}
          <a href="mailto:hackathon@fpt.edu.vn" className="text-[#F26F21] hover:underline">
            Email us
          </a>
        </p>
      </div>
    </section>
  );
}
