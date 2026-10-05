import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight, BarChart3, Clock, Users } from 'lucide-react';

export default function Landing() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:pl-28 pb-28 md:pb-0">
      {/* Hero Section */}
      <motion.header 
        className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.2 } }
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none blur-3xl" />
        
        <motion.span variants={fadeUp} className="text-orange-500 font-semibold tracking-[0.2em] text-xs md:text-sm uppercase mb-6 block">
          Automotive Remote BDC
        </motion.span>
        
        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white max-w-4xl leading-tight mb-6">
          Stop letting sales leads <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-orange-300">fall through the cracks.</span>
        </motion.h1>
        
        <motion.p variants={fadeUp} className="text-gray-600 dark:text-gray-400 text-sm md:text-lg max-w-2xl mb-10 leading-relaxed">
          Designed by automotive operators, for automotive operators. We handle the follow-ups, lead parsing, and daily reporting, ensuring seamless handoffs to your floor team.
        </motion.p>
        
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
          <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2">
            Get a Custom Quote <ArrowRight size={18} />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 font-medium transition-colors">
            See the Results
          </button>
        </motion.div>
      </motion.header>

      {/* Value Proposition Section */}
      <section className="px-4 py-20 md:py-32 w-full max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Precision Lead Management</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base">Your floor agents should be closing deals, not leaving voicemails. We handle the top of the funnel.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: <Clock className="text-orange-500 mb-4" size={32} />, title: 'Speed to Lead', desc: 'Immediate contact on all inbound inquiries. We engage prospects within minutes.' },
            { icon: <Users className="text-orange-500 mb-4" size={32} />, title: 'Seamless Handoffs', desc: 'Appointments are verified, pre-qualified, and dropped directly onto your floor calendar.' },
            { icon: <BarChart3 className="text-orange-500 mb-4" size={32} />, title: 'Actionable Insights', desc: 'Real-time dashboard reporting on show rates, pending tasks, and agent performance.' }
          ].map((feature, idx) => (
            <motion.article 
              key={idx}
              className="p-8 rounded-3xl bg-white dark:bg-white/2 border border-gray-100 dark:border-white/5 hover:border-orange-500/30 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              {feature.icon}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Testimonial / Results Section */}
      <section className="px-4 py-20 w-full">
        <motion.div 
          className="max-w-5xl mx-auto bg-gray-900 dark:bg-[#0a0f16] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden border border-gray-800 dark:border-white/5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-orange-500 font-bold tracking-wider text-xs uppercase mb-4 block">Proven Results</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                "Our show rate increased by 40% in the first two months."
              </h2>
              <p className="text-gray-400 text-sm md:text-base">
                — Operations Director, Premium Auto Group
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">+40%</div>
                <div className="text-xs md:text-sm text-gray-400">Appointment Show Rate</div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">&lt; 3m</div>
                <div className="text-xs md:text-sm text-gray-400">Average Response Time</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA / Contact Form Section */}
      <section className="px-4 py-20 md:py-32 w-full max-w-3xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Ready to scale your BDC?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 text-sm md:text-base">Leave your details below and our operations team will reach out to audit your current lead workflow.</p>
          
          <form className="flex flex-col gap-4 max-w-md mx-auto text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">First Name</label>
                <input type="text" id="firstName" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="John" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">Last Name</label>
                <input type="text" id="lastName" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="Doe" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">Work Email</label>
              <input type="email" id="email" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="john@dealership.com" />
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              <label htmlFor="volume" className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">Monthly Lead Volume</label>
              <select id="volume" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white appearance-none">
                <option value="0-500">0 - 500 leads</option>
                <option value="500-1500">500 - 1,500 leads</option>
                <option value="1500+">1,500+ leads</option>
              </select>
            </div>
            
            <button type="submit" className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-lg">
              Request Audit
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
}