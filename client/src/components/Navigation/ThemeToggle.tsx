// src/components/Navigation/ThemeToggle.tsx
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex h-8 w-16 items-center rounded-full p-1 transition-colors duration-500
        focus-visible:ring-2 focus-visible:ring-orange-500 outline-none
        ${isDark ? 'bg-white/10' : 'bg-gray-300'}
      `}
      aria-label="Toggle Dark Mode"
    >
      <motion.div
        className={`
          flex h-6 w-6 items-center justify-center rounded-full shadow-lg
          ${isDark ? 'bg-[#0a0f16]' : 'bg-white'}
        `}
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        animate={{ x: isDark ? 32 : 0 }}
      >
        <motion.span
          initial={false}
          animate={{ rotate: isDark ? 360 : 0 }}
          className="text-xs"
        >
          {isDark ? '🌙' : '☀️'}
        </motion.span>
      </motion.div>
    </button>
  );
}