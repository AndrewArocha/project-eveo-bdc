import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Activity, Shield, Zap, CheckCircle2, PlayCircle, Calendar, X } from 'lucide-react';

import SwipeableModal from '../components/UI/SwipeableModal';

// Backgrounds
import bgSunset from '../images/landing/sunset-lot.jpeg';
import bgBlueSky from '../images/landing/blue-sky-lot.jpeg';
import bgOffice from '../images/landing/office-desks.jpeg';
import bgEntrance from '../images/landing/eveo-entrance.jpeg';
import bgRoster from '../images/landing/agent-roster-view.png';

export default function Landing() {
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  // Movie Reel Edge Component
  const FilmStripEdge = () => (
    <div className="w-full flex items-center justify-between px-2 py-1.5 bg-[#0a0a0a] border-b border-t border-white/5 relative z-20">
      <span className="text-orange-500/80 font-mono text-[10px] font-bold tracking-widest pl-2">11A ▶</span>
      <div className="flex flex-1 justify-around px-4 overflow-hidden gap-2">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-6 h-4 bg-[#e5e5e5] rounded-xs shrink-0 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] opacity-90" />
        ))}
      </div>
      <span className="text-orange-500/80 font-mono text-[10px] font-bold tracking-widest pr-2">12</span>
    </div>
  );

  return (
    // FIX: Added overflow-x-hidden here to permanently prevent horizontal drag on mobile
    <div className="w-full flex-1 flex flex-col text-white relative overflow-x-hidden">

      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full" />
      </div>
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col z-10 pt-10">

        {/* Hero Section */}
        {/* FIX: Added overflow-hidden to the section so the scale-105 background doesn't bleed out */}
        <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 text-center w-full overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img src={bgSunset} alt="Dealership Sunset" className="w-full h-full object-cover opacity-25 blur-[3px] mix-blend-luminosity scale-105" />
            <div className="absolute inset-0 bg-linear-to-b from-[#05080c]/40 via-[#05080c]/80 to-[#05080c]" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/20 blur-[150px] rounded-full mix-blend-screen" />
          </div>

          <motion.div className="relative z-10 max-w-5xl mx-auto" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.2 } } }}>
            <motion.span variants={fadeUp} className="px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6 inline-block backdrop-blur-sm">
              Enterprise Dealership OS
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight drop-shadow-2xl">
              Stop losing deals to the <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-orange-600 drop-shadow-none">response clock.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium drop-shadow-md">
              EVEO acts as your dealership's AI Chief of Staff. We automate BDC routing, enforce showroom SLAs, and proactively mine your aging inventory.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center px-4 sm:px-0">
              <button
                onClick={() => setShowcaseOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-lg transition-colors border border-white/20 flex items-center justify-center gap-2 backdrop-blur-md outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <PlayCircle size={20} /> Watch Showcase
              </button>
              <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-black text-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Calendar size={20} /> Request Live Demo
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* AI Feature Grid */}
        <section className="relative px-4 py-32 w-full z-10 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img src={bgBlueSky} alt="Dealership Lot" className="w-full h-full object-cover opacity-15 mix-blend-overlay scale-105" />
            <div className="absolute inset-0 bg-linear-to-b from-[#05080c] via-transparent to-[#05080c]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors backdrop-blur-md shadow-2xl">
              <Activity className="text-orange-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Live Showroom Tracking</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Real-time lobby timers. If a floor rep leaves a customer waiting &gt;4 mins, they lose exclusivity.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 }} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors backdrop-blur-md shadow-2xl">
              <Zap className="text-blue-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Predictive Matchmaker</h3>
              <p className="text-gray-400 text-sm leading-relaxed">AI automatically cross-references aging inventory against archived leads to surface hidden deals.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.3 }} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors backdrop-blur-md shadow-2xl">
              <Shield className="text-emerald-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">SLA Enforcement</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Automated alerts flag dropped leads and missed follow-ups before the customer goes to a competitor.</p>
            </motion.div>
          </div>
        </section>

        {/* The Command Center */}
        {/* Already correctly had overflow-hidden */}
        <section className="relative w-full py-32 border-y border-white/10 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img src={bgOffice} alt="EVEO Operations Center" className="w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105" />
            <div className="absolute inset-0 bg-linear-to-b from-[#05080c]/80 via-[#05080c]/60 to-[#05080c]/90" />
          </div>

          <motion.div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <div>
              <span className="text-emerald-500 font-bold tracking-wider text-xs uppercase mb-4 block">The EVEO Command Center</span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Software is only half the equation.</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                We're not just an AI wrapper. We are a human relationship center. EVEO mixes the power of the human mind and empathy with the sheer mathematical advantage of a potent LLM for lead management.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-bold text-gray-200"><CheckCircle2 className="text-emerald-500" size={20} /> Elite Remote BDC Agents</li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-200"><CheckCircle2 className="text-emerald-500" size={20} /> Pre-qualified, verified appointments</li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-200"><CheckCircle2 className="text-emerald-500" size={20} /> Deep CRM and Inventory Integration</li>
              </ul>
            </div>

            {/* Live Floor Sync Card */}
            <div className="hidden lg:block relative h-96 rounded-4xl border border-white/10 bg-white/5 shadow-2xl p-6 group">
              <div className="absolute inset-0 z-0 overflow-hidden rounded-4xl">
                <img src={bgRoster} alt="EVEO Roster" className="w-full h-full object-cover opacity-60 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0f16] via-[#0a0f16]/80 to-[#0a0f16]/60" />
              </div>

              <div className="relative z-10 w-full h-full rounded-2xl bg-[#0a0f16]/40 border border-white/10 flex flex-col items-center justify-center text-center p-8 backdrop-blur-[2px]">
                <Activity className="text-orange-500 mb-4" size={48} />
                <h3 className="text-2xl font-black text-white mb-2 drop-shadow-md">Live Floor Sync</h3>
                <p className="text-sm text-gray-300 font-medium">Our physical agents are tracking your physical floor in real-time.</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Results Section */}
        <section className="px-4 py-32 w-full relative overflow-hidden">
          <motion.div className="max-w-5xl mx-auto bg-[#0a0f16]/80 rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>

            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center bg-black/40">
              <img src={bgEntrance} alt="EVEO Office Entrance" className="w-full h-full object-cover object-[center_35%] blur-xs opacity-40 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-linear-to-r from-[#0a0f16] via-[#0a0f16]/80 to-transparent" />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-blue-400 font-bold tracking-wider text-xs uppercase mb-4 block">Proven Results</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight drop-shadow-md">
                  "Our show rate increased by 40% in the first two months."
                </h2>
                <p className="text-gray-300 text-sm md:text-base font-medium">— Operations Director, Premium Auto Group</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-black/60 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">+40%</div>
                  <div className="text-xs md:text-sm text-gray-300 font-medium">Appointment Show Rate</div>
                </div>
                <div className="p-6 bg-black/60 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">&lt; 3m</div>
                  <div className="text-xs md:text-sm text-gray-300 font-medium">Average Response Time</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Demo Request Form */}
        <section id="contact" className="px-4 pb-32 pt-10 w-full max-w-3xl mx-auto text-center relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to scale your floor?</h2>
            <p className="text-gray-400 mb-10 text-sm md:text-base">Leave your details below to schedule a Live Demo with our operations team.</p>

            <form className="flex flex-col gap-4 max-w-md mx-auto text-left" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-300 ml-1">First Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 focus:bg-white/10 outline-none transition-all text-sm text-white" placeholder="John" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-300 ml-1">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 focus:bg-white/10 outline-none transition-all text-sm text-white" placeholder="Doe" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-300 ml-1">Work Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 focus:bg-white/10 outline-none transition-all text-sm text-white" placeholder="john@dealership.com" />
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <label className="text-xs font-medium text-gray-300 ml-1">Monthly Lead Volume</label>
                <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 focus:bg-white/10 outline-none transition-all text-sm text-white appearance-none cursor-pointer">
                  <option value="0-500" className="bg-gray-900">0 - 500 leads</option>
                  <option value="500-1500" className="bg-gray-900">500 - 1,500 leads</option>
                  <option value="1500+" className="bg-gray-900">1,500+ leads</option>
                </select>
              </div>

              <button type="submit" className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-lg outline-none flex justify-center items-center gap-2 mt-2">
                <Calendar size={18} /> Request Live Demo
              </button>
            </form>
          </motion.div>
        </section>

      </div>

{/* --- MOVIE REEL SHOWCASE MODAL --- */}
      <SwipeableModal 
        isOpen={showcaseOpen} 
        onClose={() => setShowcaseOpen(false)} 
        layoutId="showcase-modal"
      >
        <div className="relative w-full h-full bg-[#111] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x-4 border-black flex flex-col z-10 overflow-hidden">
          <FilmStripEdge />

          {/* The Video Container */}
          <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-hidden border-y border-[#1a1a1a] group">
            <img src={bgRoster} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity scale-105 transition-transform duration-1000 group-hover:scale-100" />
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

            {/* Simulated Play Button & Text */}
            <div className="relative z-10 flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500/90 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                <PlayCircle size={40} className="text-white ml-1" />
              </div>
              <h2 className="text-3xl sm:text-6xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight uppercase">Promo video</h2>
              <h3 className="text-2xl sm:text-4xl font-bold text-gray-200 drop-shadow-md tracking-wider">app showcase</h3>
            </div>
          </div>

          <FilmStripEdge />

          {/* Close Button */}
          <button
            onClick={() => setShowcaseOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors border border-white/10 z-30 outline-none"
          >
            <X size={20} />
          </button>
        </div>
      </SwipeableModal>

    </div>
  );
}