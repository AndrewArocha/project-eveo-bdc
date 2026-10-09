import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import InteractiveJourney from '../components/UI/InteractiveJourney';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Backgrounds
import bgEntrance from '../images/landing/eveo-entrance.jpeg';
import Andres from '../images/about/andres.jpg';
import Foundations from '../images/about/foundations.jpg';
import Hardships from '../images/about/hardships.jpg';
import Architecting from '../images/about/architecting.jpg';
import Pipeline from '../images/about/pipeline.png';
import Development from '../images/about/fullStack.jpg';  
import Scaling from '../images/about/scaling.jpg';
import Startup from '../images/about/earlystart.jpg';
import Scripting from '../images/about/scripting.jpg';
import Automotive from '../images/about/automotive.jpg';
import Digitalization from '../images/about/digitalization.png';

// --- YOUR STORIES ---
const eveoJourney = [
  { phase: "2021 / The Spark", title: "A Two-Computer Start", img: Startup, desc: "EVEO Inc. was born as a small operation in Medellín. Founded by Erick Espin, it began as a lean telemarketing operation with just two computers and a vision for social media management." },
  { phase: "2022 / The Pivot", title: "The BDC Inception", img: Automotive, desc: "The trajectory changed when an automotive client requested something beyond social media: direct customer follow-ups. We took on the challenge, officially birthing EVEO's Business Development Center (BDC) operation." },
  { phase: "2023 / The Architecture", title: "Scripting the Floor", img: Scripting, desc: "To survive the automotive space, we had to systematize. We revolutionized our workflows by introducing rigorous sales pipelines, robust closing scripts, and rigid operational architecture." },
  { phase: "2024 / The Expansion", title: "Outscaling the Competition", img: Scaling, desc: "The systems worked. EVEO rapidly scaled its physical operations, managing 9 dealerships simultaneously. At our peak, we ran a multi-tenant operation strictly handling volume for titans like Northstar Kia." },
  { phase: "2025 / The Evolution", title: "Physical to Digital", img: Digitalization, desc: "Realizing that human effort alone couldn't outpace technological bottlenecks, we translated our battle-tested physical workflows into code. EVEO transitioned from a service agency into a proprietary SaaS platform." }
];

const andresJourney = [
  { phase: "Phase 1 / The Hustle", title: "Self-Taught Foundations", img: Foundations, desc: "My drive for business started early. I taught myself a second language through media and reading digital forums, building a global mindset long before I had the means to travel." },
  { phase: "Phase 2 / The Crucible", title: "Outworking the Circumstances", img: Hardships, desc: "Due to circumstances out of my control, at the age of 17. I abandoned my electrical engineering studies to support my household. Forging a relentless work ethic through adversity." },
  { phase: "Phase 3 / The Closer", title: "Mastering the Pipeline", img: Pipeline, desc: "Seeking a higher ceiling, I transitioned into high-stakes sales. From earning my first major commissions as a closing agent to becoming a night shift manager, I mastered B2B communication and financial collections." },
  { phase: "Phase 4 / The Migration", title: "Architecting EVEO", img: Architecting, desc: "I joined a young EVEO team and over 5 years together, I utilized my sales mastery to architect our BDC operations, writing scripts and training elite agents, improving results by 80%." },
  { phase: "Phase 5 / The Developer", title: "Full-Stack Expansion", img: Development, desc: "To solve the inherent bottlenecks of physical BDC floors, I taught myself to code. And seeking to adapt a decade of experience in sales to full-stack engineering, I completed TripleTen's rigorous curriculum to single-handedly build the EVEO OS." }
];

export default function About() {
  const [selectedPath, setSelectedPath] = useState<'eveo' | 'andres' | null>(null);
  const [hoveredPath, setHoveredPath] = useState<'eveo' | 'andres' | null>(null);

  // Custom Light Cursor
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    const { innerWidth, innerHeight } = window;
    mouseX.set((e.clientX / innerWidth) * 2 - 1);
    mouseY.set((e.clientY / innerHeight) * 2 - 1);
  };

  const crystalX = useTransform(useSpring(mouseX, { stiffness: 100, damping: 20 }), [-1, 1], [-15, 15]);
  const crystalY = useTransform(useSpring(mouseY, { stiffness: 100, damping: 20 }), [-1, 1], [-15, 15]);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#05080c] text-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        
        {!selectedPath ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onMouseMove={handleMouseMove}
            className="flex flex-col md:flex-row w-full flex-1 min-h-[calc(100vh-80px)] relative overflow-hidden md:cursor-none"
          >
            {/* Ambient Mouse Tracker (Hidden on mobile) */}
            <motion.div 
              className="hidden md:flex fixed top-0 left-0 pointer-events-none z-30 items-center justify-center -translate-x-1/2 -translate-y-1/2"
              style={{ x: mousePos.x, y: mousePos.y }}
            >
               <div className="w-8 h-8 rounded-full border border-white/30 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center backdrop-blur-sm">
                 <div className="w-1.5 h-1.5 bg-white rounded-full" />
               </div>
            </motion.div>

            {/* Left Side: About EVEO */}
            <div className="flex-1 relative overflow-hidden group flex items-center justify-center">
              {/* FIX: Mobile naturally sits at 40% opacity in full color, completely ignoring hover states */}
              <img src={bgEntrance} className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out md:grayscale ${hoveredPath === 'eveo' ? 'md:scale-105 md:opacity-60' : 'scale-100 opacity-40 md:opacity-20'}`} />
              <div className={`absolute inset-0 bg-linear-to-t from-[#05080c] via-[#05080c]/60 to-[#05080c] transition-opacity duration-700 ${hoveredPath === 'eveo' ? 'md:opacity-30' : 'opacity-60 md:opacity-100'}`} />
              
              <div 
                className="relative z-20 w-full md:w-[85%] h-full flex flex-col items-center justify-center cursor-pointer md:cursor-none"
                // FIX: Strict pointerType check completely disables sticky touch-hovers on mobile
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHoveredPath('eveo')}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setHoveredPath(null)}
                onClick={() => setSelectedPath('eveo')}
              >
                <div className="text-center transition-transform duration-700 ease-out md:group-hover:-translate-y-4 pointer-events-none">
                  <span className={`text-orange-500 font-mono text-xs font-bold tracking-widest uppercase mb-4 block transition-opacity duration-300 ${hoveredPath === 'eveo' ? 'md:opacity-100' : 'opacity-100 md:opacity-0'}`}>Company History</span>
                  <h2 className={`text-4xl md:text-5xl font-black drop-shadow-2xl transition-all duration-500 tracking-tight ${hoveredPath === 'eveo' ? 'md:text-white md:scale-110' : 'text-white md:text-gray-700'}`}>ABOUT THE COMPANY</h2>
                </div>
              </div>
            </div>

            {/* Right Side: About Andres */}
            <div className="flex-1 relative overflow-hidden group flex items-center justify-center">
              <img src={Andres} className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out md:grayscale ${hoveredPath === 'andres' ? 'md:scale-105 md:opacity-60' : 'scale-100 opacity-40 md:opacity-20'}`} />
              <div className={`absolute inset-0 bg-linear-to-t from-[#05080c] via-[#05080c]/60 to-[#05080c] transition-opacity duration-700 ${hoveredPath === 'andres' ? 'md:opacity-30' : 'opacity-60 md:opacity-100'}`} />
              
              <div 
                className="relative z-20 w-full md:w-[85%] h-full flex flex-col items-center justify-center cursor-pointer md:cursor-none"
                // FIX: Strict pointerType check completely disables sticky touch-hovers on mobile
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHoveredPath('andres')}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setHoveredPath(null)}
                onClick={() => setSelectedPath('andres')}
              >
                <div className="text-center transition-transform duration-700 ease-out md:group-hover:-translate-y-4 pointer-events-none">
                  <span className={`text-orange-500 font-mono text-xs font-bold tracking-widest uppercase mb-4 block transition-opacity duration-300 ${hoveredPath === 'andres' ? 'md:opacity-100' : 'opacity-100 md:opacity-0'}`}>Manager / Developer</span>
                  <h2 className={`text-4xl md:text-5xl font-black drop-shadow-2xl transition-all duration-500 tracking-tight ${hoveredPath === 'andres' ? 'md:text-white md:scale-110' : 'text-white md:text-gray-700'}`}>ABOUT THE AUTHOR</h2>
                </div>
              </div>
            </div>

            {/* THE RESPONSIVE CENTRAL SELECTOR */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center w-full h-full md:max-w-sm">
              
              {/* Desktop Vertical Separators */}
              <div className="hidden md:block absolute top-0 bottom-[calc(50%+3.5rem)] left-1/2 -translate-x-1/2 w-0.5 bg-linear-to-b from-transparent via-white/50 to-white/10 shadow-[0_0_15px_rgba(255,255,255,0.4)] backdrop-blur-md" />
              <div className="hidden md:block absolute top-[calc(50%+3.5rem)] bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-linear-to-t from-transparent via-white/50 to-white/10 shadow-[0_0_15px_rgba(255,255,255,0.4)] backdrop-blur-md" />
              
              {/* Mobile Horizontal Separators */}
              <div className="md:hidden absolute left-0 right-[calc(50%+3.5rem)] top-1/2 -translate-y-1/2 h-0.5 bg-linear-to-r from-transparent via-white/50 to-white/10 shadow-[0_0_15px_rgba(255,255,255,0.4)] backdrop-blur-md" />
              <div className="md:hidden absolute left-[calc(50%+3.5rem)] right-0 top-1/2 -translate-y-1/2 h-0.5 bg-linear-to-l from-transparent via-white/50 to-white/10 shadow-[0_0_15px_rgba(255,255,255,0.4)] backdrop-blur-md" />

              {/* The Liquid Glassy Orb */}
              <div className="relative w-28 h-28 rounded-full bg-[#0a0f16]/60 backdrop-blur-2xl border border-white/20 shadow-[0_0_40px_rgba(249,115,22,0.3),inset_0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center">
                
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                   <circle cx="50" cy="50" r="48" stroke="#f97316" strokeWidth="2" fill="transparent" className="drop-shadow-[0_0_8px_rgba(249,115,22,1)]" />
                </svg>

                <motion.div 
                  style={{ x: crystalX, y: crystalY }} 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                >
                  <div className="w-4 h-4 bg-white rotate-45 shadow-[0_0_20px_rgba(255,255,255,1)]" />
                  
                  {/* Desktop Arrows (Hidden on Mobile)[cite: 26, 27] */}
                  <div className="hidden md:block">
                    <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ${hoveredPath === 'eveo' ? 'opacity-100 -left-14' : 'opacity-0 -left-6'}`}>
                      <ChevronLeft size={36} className="text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />
                    </div>
                    <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ${hoveredPath === 'andres' ? 'opacity-100 -right-14' : 'opacity-0 -right-6'}`}>
                      <ChevronRight size={36} className="text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />
                    </div>
                  </div>

                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <InteractiveJourney 
            key="journey"
            data={selectedPath === 'eveo' ? eveoJourney : andresJourney} 
            title={selectedPath} 
            // FIX: Guaranteed reset of any sticky hover states when the journey is closed
            onClose={() => {
              setSelectedPath(null);
              setHoveredPath(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}