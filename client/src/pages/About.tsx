import { motion } from 'framer-motion';

export default function About() {
  return (
    <main className="grow flex items-center justify-center p-4 md:p-8 min-w-[320px]">
      <motion.article 
        className="max-w-4xl w-full bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header Section */}
        <header className="relative w-full h-48 md:h-64 bg-linear-to-br from-orange-500/20 to-orange-900/40 border-b border-gray-200 dark:border-white/10 flex items-end p-6 md:p-10">
          <div className="absolute inset-0 bg-linear-to-t from-white dark:from-[#05080c] to-transparent" />
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-orange-500 dark:text-orange-400 font-bold tracking-wider text-xs uppercase block">
              About the Author
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Andres Alfonso Hernandez Arocha
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-lg text-sm md:text-base">
              Bridging automotive operations with full-stack web development.
            </p>
          </div>
        </header>

        {/* Content Section */}
        <section className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
              The Developer
            </h2>
            <p>
              Based in Medellín, Colombia, I specialize in building efficient, data-driven applications. My technical foundation comes from completing an intensive full-stack web development program, where I mastered front-end interfaces using React, Vite, Tailwind CSS 4, and Framer Motion, alongside robust back-end architectures utilizing Node.js, Express, and databases like MongoDB and MySQL.
            </p>
          </div>

          <div className="space-y-4 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
              The Project: Eveo BDC
            </h2>
            <p>
              Eveo BDC was born from firsthand experience managing Business Development Center (BDC) operations and coordinating sales leads at a vehicle dealership. 
            </p>
            <p>
              Recognizing the bottlenecks in daily workflow reporting and lead handoffs, I designed this SaaS application to automate parsing, integrate third-party APIs, and provide actionable insights through a proprietary database, directly addressing the operational needs of modern dealership teams.
            </p>
          </div>
        </section>
      </motion.article>
    </main>
  );
}