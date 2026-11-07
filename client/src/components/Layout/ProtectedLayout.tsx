// src/components/Layout/ProtectedLayout.tsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StartupAnimation from '../UI/StartupAnimation';
import Navbar from '../Navigation/Navbar';
import { startAmbient } from '../../utils/soundEngine';

export default function ProtectedLayout() {
  const [isStartupDone, setIsStartupDone] = useState(false);

  useEffect(() => {
    if (!isStartupDone) return;
    startAmbient();
    const resumeAmbientOnInteraction = () => startAmbient();
    window.addEventListener('pointerdown', resumeAmbientOnInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', resumeAmbientOnInteraction);
  }, [isStartupDone]);

  return (
    <div className="bg-gray-50 dark:bg-[#05080c] transition-colors duration-500 h-dvh w-full text-gray-900 dark:text-white overflow-hidden flex font-sans">
      <AnimatePresence mode="wait">
        {!isStartupDone ? (
          <motion.div
            key="startup"
            className="absolute inset-0 z-100"
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <StartupAnimation onComplete={() => setIsStartupDone(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col md:flex-row h-dvh w-full relative overflow-hidden"
          >
            <main
              id="app-scroll-container"
              className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden relative scroll-smooth bg-gray-50 dark:bg-[#05080c]"
            >
              <Outlet />
            </main>

            <Navbar />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}