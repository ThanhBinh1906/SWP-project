import React from "react";
import "./index.css";
import Navbar from "./components/Home/Navbar";
import Hero from "./components/Home/Hero";
import About from "./components/Home/About";
import Timeline from "./components/Home/Timeline";
import Prizes from "./components/Home/Prizes";
import Sponsors from "./components/Home/Sponsors";
import FAQ from "./components/Home/FAQ";
import Footer from "./components/Home/Footer";

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
      {/* <Footer /> */}
    </div>
  );
}
