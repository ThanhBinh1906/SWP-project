import React from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Timeline from './components/Timeline';
import Prizes from './components/Prizes';
import Sponsors from './components/Sponsors';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Timeline />
        <Prizes />
        <Sponsors />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
