// src/components/Layout/ProtectedLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StartupAnimation from '../UI/StartupAnimation';
import Navbar from '../Navigation/Navbar'; // Your floating pill

export default function ProtectedLayout() {
  const [isStartupDone, setIsStartupDone] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-[#05080c] transition-colors duration-500 h-screen w-full text-gray-900 dark:text-white overflow-hidden flex font-sans">
      <AnimatePresence mode="wait">
        {!isStartupDone ? (
          <motion.div
            key="startup"
            className="absolute inset-0 z-100"
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <StartupAnimation onComplete={() => setIsStartupDone(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex h-screen w-full relative"
          >
            {/* The Floating Pill */}
            <Navbar />

            {/* The Internal Scroll Container */}
            <main className="flex-1 overflow-y-auto relative scroll-smooth bg-gray-50 dark:bg-[#05080c]">
              {/* <Outlet /> renders whatever child route is active (Hub, Reports, etc.) */}
              <Outlet />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}