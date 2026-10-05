// src/pages/Hub.tsx
import { motion } from 'framer-motion';
import defaultBanner from '../../images/defaultBanner.avif'; // Imagen por defecto si no hay bannerImg

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  delay: number;
  highlight?: boolean;
}

// 1. Definimos las props dinámicas que llegarán desde la base de datos
interface HomeProps {
  bannerImg?: string;
  homeBtnLogo?: string;
  dealershipName?: string;
}

export default function Hub({
  bannerImg,
  homeBtnLogo,
  dealershipName = "Auto Dealership" // Nombre por defecto si el usuario no tiene nombre aún
}: HomeProps) {

  // 2. Fallback elegante para la imagen de fondo (Si no hay bannerImg, usa esta foto de Unsplash)
  const displayBanner = bannerImg || defaultBanner;

  // 3. Lógica para generar un "Logo de texto" si no han subido imagen
  // Toma la primera palabra del concesionario. Ej: "Edison Ford" -> "EDISON"
  const textLogoPlaceholder = dealershipName.split(' ')[0].toUpperCase();

  return (
    <motion.div
      className="relative z-10 w-full pb-32 md:pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-orange-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Banner Dinámico */}
      <section className="
        relative w-full h-[55vh] min-h-105 md:h-95 mb-8 md:mb-10
        md:rounded-4xl overflow-hidden group cursor-pointer
        md:mt-8 md:mx-8 md:w-[calc(100%-4rem)]
        max-w-6xl xl:mx-auto
        shadow-2xl dark:shadow-none
      ">
        {/* Usamos la variable displayBanner */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url('${displayBanner}')` }}
        />

        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#05080c]/95 via-[#05080c]/60 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8"
          >
            <div className="max-w-xl">
              <span className="text-orange-500 font-bold tracking-wider text-[10px] md:text-xs uppercase mb-2 block drop-shadow-md">
                System Online
              </span>
              {/* Nombre dinámico del concesionario */}
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white drop-shadow-lg">
                {dealershipName} Hub
              </h1>
              <p className="text-gray-200 text-sm md:text-base font-medium drop-shadow-md leading-relaxed">
                Your automated lead parsing and GHL workflows are running smoothly. Ready to generate today's report?
              </p>
            </div>

            <button className="
              relative flex items-center p-1.5 pr-6 gap-4 rounded-full
              bg-white/10 dark:bg-black/20 backdrop-blur-md
              border border-white/20 dark:border-white/10
              hover:bg-white/20 dark:hover:bg-white/10 transition-all shadow-2xl
              w-full sm:w-auto overflow-hidden group/btn outline-none
              focus-visible:ring-2 focus-visible:ring-orange-500
            ">

              {/* Lógica dinámica del Logo del Botón */}
              {homeBtnLogo ? (
                // Si el usuario subió su logo, renderizamos la imagen
                <div className="flex items-center justify-center bg-white rounded-full p-2 shrink-0 z-10 shadow-sm h-11 w-24">
                  <img src={homeBtnLogo} alt={`${dealershipName} Logo`} className="h-full w-full object-contain" />
                </div>
              ) : (
                // Si no hay logo, renderizamos el placeholder de texto estilizado
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-200 text-black px-4 py-3 rounded-full text-[11px] font-extrabold tracking-tighter shrink-0 z-10 shadow-sm">
                  {textLogoPlaceholder} <span className="text-orange-600 ml-0.5">/</span> BDC
                </div>
              )}

              <span className="text-white font-semibold text-sm z-10 whitespace-nowrap drop-shadow-sm">
                Generate Report
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Contenedor de las Tarjetas de Métricas (Sin cambios) */}
      <div className="px-6 md:px-10 max-w-6xl mx-auto">
        <section>
          <h2 className="text-xl font-semibold mb-6 tracking-wide text-gray-800 dark:text-gray-200">
            Recent Activity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard title="Total Leads Processed" value="1,248" trend="+12% this week" trendUp={true} delay={0.4} />
            <DashboardCard title="Pending Handoffs" value="34" trend="Action required" trendUp={false} delay={0.5} />
            <DashboardCard title="AI Assistant Insights" value="3 New" trend="Check Insights tab" trendUp={true} delay={0.6} highlight={true} />
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function DashboardCard({ title, value, trend, trendUp, delay, highlight = false }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5 }}
      tabIndex={0}
      className={`
        p-6 rounded-2xl border focus-visible:ring-2 focus-visible:ring-orange-500 outline-none
        ${highlight
          ? 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20'
          : 'bg-white dark:bg-[#0a0f16] border-gray-200 dark:border-white/5'}
        hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden shadow-sm
      `}
    >
      <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-3">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {value}
      </p>
      <p className={`text-xs font-semibold ${trendUp ? (highlight ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400') : 'text-rose-600 dark:text-rose-400'}`}>
        {trend}
      </p>
    </motion.div>
  );
}