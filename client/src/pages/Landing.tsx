// src/pages/Landing.tsx
import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Activity, Shield, CheckCircle2, PlayCircle, Calendar, X, Sparkles } from 'lucide-react';

import SwipeableModal from '../components/UI/SwipeableModal';

// Assets
import eveoSymbol from '../images/logo/eveo-symbol.svg';
import bgSunset from '../images/landing/sunset-lot.jpeg';
import bgBlueSky from '../images/landing/blue-sky-lot.jpeg';
import bgOffice from '../images/landing/office-desks.jpeg';
import bgEntrance from '../images/landing/eveo-entrance.jpeg';
import bgRoster from '../images/landing/agent-roster-view.png';

export default function Landing() {
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
  };

  return (
    <div className="w-full flex-1 flex flex-col text-white relative overflow-x-hidden select-none sm:select-auto">

      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] sm:w-[50%] h-[50%] bg-orange-500/10 blur-[120px] sm:blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] sm:w-[50%] h-[50%] bg-blue-500/10 blur-[120px] sm:blur-[150px] rounded-full" />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col z-10 pt-16 sm:pt-10">

        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center min-h-[82vh] sm:min-h-[85vh] px-5 sm:px-6 py-12 text-center w-full overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={bgSunset}
              alt="Automotive dealership lot at sunset"
              className="w-full h-full object-cover opacity-25 blur-[3px] mix-blend-luminosity scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#05080c]/40 via-[#05080c]/80 to-[#05080c]" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/20 blur-[150px] rounded-full mix-blend-screen" />
          </div>

          <motion.div
            className="relative z-10 max-w-5xl mx-auto w-full"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {/* Enterprise Dealership OS Badge with EVEO Logo */}
            <motion.span
              variants={fadeUp}
              className="px-4 py-1.5 rounded-full bg-[#0a0f16]/90 border border-orange-500/35 text-orange-400 text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-5 sm:mb-6 inline-flex items-center gap-2.5 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.2)]"
            >
              <img src={eveoSymbol} alt="EVEO Brand Symbol" className="w-4 h-4 object-contain" />
              <span>Enterprise Dealership OS</span>
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-5 sm:mb-6 leading-[1.1] drop-shadow-2xl"
            >
              Stop losing deals to the <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-orange-600 drop-shadow-none">
                response clock.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium drop-shadow-md px-1"
            >
              EVEO acts as your dealership&apos;s AI Chief of Staff. We automate BDC routing, enforce showroom SLAs, and proactively mine your aging inventory.
            </motion.p>

            {/* HubModals-styled Action Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 w-full sm:w-auto justify-center max-w-md sm:max-w-none mx-auto"
            >
              <button
                type="button"
                onClick={() => setShowcaseOpen(true)}
                className="w-full sm:w-auto min-h-12 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center justify-center gap-2 backdrop-blur-xl outline-none cursor-pointer"
              >
                <PlayCircle size={18} className="text-orange-500" /> Watch Showcase
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto min-h-12 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-sm sm:text-base transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 outline-none cursor-pointer"
              >
                <Calendar size={18} /> Request Live Demo
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* AI Feature Grid - Matching Hub & HubModals Cards */}
        <section className="relative px-4 sm:px-6 py-16 md:py-32 w-full z-10 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={bgBlueSky}
              alt="Dealership vehicle inventory lot under blue sky"
              className="w-full h-full object-cover opacity-15 mix-blend-overlay scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#05080c] via-transparent to-[#05080c]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
            {/* Card 1: Live Showroom (Warm Orange Hub Variant) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 sm:p-7 rounded-2xl bg-linear-to-br from-orange-500/15 via-[#140f0d] to-[#0a0f16] border border-orange-500/35 shadow-lg relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-500">
                  <Activity size={14} /> Live Showroom
                </span>
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Live Showroom Tracking</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Real-time lobby timers. If a floor rep leaves a customer waiting &gt;4 mins, they lose exclusivity.
              </p>
            </motion.div>

            {/* Card 2: Predictive Matchmaker (Hub Dark Obsidian Variant) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 sm:p-7 rounded-2xl bg-[#0a0f16] border border-white/10 hover:border-orange-500/30 transition-colors shadow-lg relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-purple-400">
                  <Sparkles size={14} /> AI Assistant
                </span>
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Predictive Matchmaker</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                AI automatically cross-references aging inventory against archived leads to surface hidden deals.
              </p>
            </motion.div>

            {/* Card 3: SLA Enforcement (Hub Dark Obsidian Variant) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 sm:p-7 rounded-2xl bg-[#0a0f16] border border-white/10 hover:border-orange-500/30 transition-colors shadow-lg relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-500">
                  <Shield size={14} /> Confirmations
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">SLA Enforcement</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Automated alerts flag dropped leads and missed follow-ups before the customer goes to a competitor.
              </p>
            </motion.div>
          </div>
        </section>

        {/* The Command Center */}
        <section className="relative w-full py-16 md:py-32 border-y border-white/10 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={bgOffice}
              alt="EVEO BDC Operations Center desks and monitors"
              className="w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#05080c]/80 via-[#05080c]/60 to-[#05080c]/90" />
          </div>

          <motion.div
            className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <div>
              <span className="text-emerald-500 font-bold tracking-widest text-xs uppercase mb-3 sm:mb-4 block">
                The EVEO Command Center
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-5 sm:mb-6 leading-tight">
                Software is only half the equation.
              </h2>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                We&apos;re not just an AI wrapper. We are a human relationship center. EVEO mixes the power of the human mind and empathy with the sheer mathematical advantage of a potent LLM for lead management.
              </p>
              <ul className="space-y-3.5 sm:space-y-4">
                <li className="flex items-center gap-3 text-sm font-bold text-gray-200">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> Elite Remote BDC Agents
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-200">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> Pre-qualified, verified appointments
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-200">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> Deep CRM and Inventory Integration
                </li>
              </ul>
            </div>

            {/* Live Floor Sync Card - Hub Card Surface */}
            <div className="relative h-72 sm:h-96 rounded-2xl border border-white/10 bg-[#0a0f16] shadow-lg p-4 sm:p-6 overflow-hidden group">
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={bgRoster}
                  alt="EVEO Live Agent Roster Dashboard View"
                  className="w-full h-full object-cover opacity-50 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0f16] via-[#0a0f16]/80 to-[#0a0f16]/60" />
              </div>

              <div className="relative z-10 w-full h-full rounded-xl bg-[#0a0f16]/80 border border-white/10 flex flex-col items-center justify-center text-center p-6 sm:p-8 backdrop-blur-xs">
                <Activity className="text-orange-500 mb-3 sm:mb-4" size={36} />
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Live Floor Sync</h3>
                <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xs">
                  Our physical agents are tracking your physical floor in real-time.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Results Section - Hub Card Surface */}
        <section className="px-4 sm:px-6 py-16 md:py-32 w-full relative overflow-hidden">
          <motion.div
            className="max-w-5xl mx-auto bg-[#0a0f16] rounded-2xl p-6 sm:p-10 md:p-12 relative overflow-hidden border border-white/10 shadow-lg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center bg-black/40">
              <img
                src={bgEntrance}
                alt="EVEO Corporate Office Entrance"
                className="w-full h-full object-cover object-[center_35%] blur-xs opacity-30 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-linear-to-b md:bg-linear-to-r from-[#0a0f16] via-[#0a0f16]/90 to-[#0a0f16]/70" />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <span className="text-orange-500 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-3 block">
                  Proven Results
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                  &ldquo;Our show rate increased by 40% in the first two months.&rdquo;
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-medium">
                  — Operations Director, Premium Auto Group
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                <div className="p-5 sm:p-6 bg-[#0a0f16] rounded-2xl border border-orange-500/30 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Show Rate</span>
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1">+40%</div>
                  <div className="text-xs text-gray-400 font-medium">Appointment Show Rate</div>
                </div>
                <div className="p-5 sm:p-6 bg-[#0a0f16] rounded-2xl border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">SLA Speed</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1">&lt; 3m</div>
                  <div className="text-xs text-gray-400 font-medium">Average Response Time</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Demo Request Form - Matching HubModals Form & Card */}
        <section id="contact" className="px-4 sm:px-6 pb-24 sm:pb-32 pt-6 sm:pt-10 w-full max-w-2xl mx-auto relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="bg-[#0a0f16] border border-white/10 rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                Schedule Walkthrough
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Ready to scale your floor?</h2>
            <p className="text-gray-400 mb-6 sm:mb-8 text-xs sm:text-sm">
              Leave your details below to schedule a Live Demo with our operations team.
            </p>

            <form className="flex flex-col gap-4 text-left" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="demo-first-name" className="text-xs font-bold text-gray-400 ml-1">First Name</label>
                  <input
                    id="demo-first-name"
                    type="text"
                    autoComplete="given-name"
                    className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none transition-colors text-sm text-white"
                    placeholder="John"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="demo-last-name" className="text-xs font-bold text-gray-400 ml-1">Last Name</label>
                  <input
                    id="demo-last-name"
                    type="text"
                    autoComplete="family-name"
                    className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none transition-colors text-sm text-white"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="demo-email" className="text-xs font-bold text-gray-400 ml-1">Work Email</label>
                <input
                  id="demo-email"
                  type="email"
                  autoComplete="email"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none transition-colors text-sm text-white"
                  placeholder="john@dealership.com"
                />
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <label htmlFor="demo-volume" className="text-xs font-bold text-gray-400 ml-1">Monthly Lead Volume</label>
                <select
                  id="demo-volume"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none transition-colors text-sm text-white appearance-none cursor-pointer"
                >
                  <option value="0-500" className="bg-[#0a0f16]">0 - 500 leads</option>
                  <option value="500-1500" className="bg-[#0a0f16]">500 - 1,500 leads</option>
                  <option value="1500+" className="bg-[#0a0f16]">1,500+ leads</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full min-h-11 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 outline-none flex justify-center items-center gap-2 mt-1 cursor-pointer"
              >
                <Calendar size={16} /> Request Live Demo
              </button>
            </form>
          </motion.div>
        </section>

      </div>

      {/* --- SHOWCASE MODAL (Matching HubModals Header + Body inside SwipeableModal) --- */}
      <SwipeableModal
        isOpen={showcaseOpen}
        onClose={() => setShowcaseOpen(false)}
        layoutId="showcase-modal"
      >
        <div className="flex flex-col h-full min-h-0 select-none sm:select-auto">
          {/* HubModals-style Header */}
          <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:p-6 border-b border-white/10 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-0.5">
                EVEO Enterprise OS
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2.5 truncate">
                <PlayCircle className="text-orange-500 shrink-0" size={22} />
                <span className="truncate">Platform Showcase</span>
              </h2>
            </div>

            <button
              type="button"
              aria-label="Close showcase video"
              onClick={() => setShowcaseOpen(false)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* HubModals-style Body */}
          <div className="relative z-10 flex-1 min-h-0 p-4 sm:p-6 md:p-8 bg-black/20">
            <div className="relative w-full aspect-video rounded-2xl bg-[#0a0f16] border border-white/10 flex items-center justify-center overflow-hidden group shadow-lg">
              <img
                src={bgRoster}
                alt="EVEO platform promotional video preview showing agent roster"
                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity scale-105 transition-transform duration-1000 group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center cursor-pointer active:scale-95 hover:scale-105 transition-transform px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-orange-500/30">
                  <PlayCircle size={36} className="text-white" />
                </div>
                <h3 className="text-xl sm:text-4xl font-black text-white tracking-tight uppercase">
                  Promo Video
                </h3>
                <p className="text-xs sm:text-sm font-bold text-orange-400 uppercase tracking-widest mt-1">
                  Live BDC Command Center Walkthrough
                </p>
              </div>
            </div>
          </div>
        </div>
      </SwipeableModal>

    </div>
  );
}