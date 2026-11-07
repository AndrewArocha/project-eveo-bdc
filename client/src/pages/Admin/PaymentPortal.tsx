// src/pages/Admin/PaymentPortal.tsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-22 sm:pt-24 pb-16 px-4 sm:px-6 relative overflow-x-hidden flex justify-center">

      <div className="w-full max-w-6xl relative z-10">

        {/* Top Back Button */}
        <button
          type="button"
          onClick={() => navigate('/admin/store')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white active:scale-95 transition-all mb-6 sm:mb-8 outline-none cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Plans
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left Column: Payment Form inside #0a0f16 Hub Card */}
          <div className="lg:col-span-7 flex flex-col order-2 lg:order-1">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0f16] border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                  Billing Portal
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-6 sm:mb-8">
                Secure Checkout
              </h1>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                    <label className="relative flex flex-col p-4 rounded-xl border border-orange-500/50 bg-orange-500/10 active:scale-[0.98] transition-transform cursor-pointer">
                      <input type="radio" name="payment_method" value="card" className="sr-only" defaultChecked />
                      <CreditCard className="text-orange-500 mb-2" size={22} />
                      <span className="font-bold text-white text-xs sm:text-sm">Credit Card</span>
                    </label>
                    <label className="relative flex flex-col p-4 rounded-xl border border-white/10 bg-black/40 cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all">
                      <input type="radio" name="payment_method" value="paypal" className="sr-only" />
                      <svg aria-hidden="true" className="mb-2 w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                      </svg>
                      <span className="font-bold text-gray-300 text-xs sm:text-sm">PayPal</span>
                    </label>
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Card Details</h3>

                  <div>
                    <label htmlFor="card-number" className="block text-xs font-bold text-gray-400 ml-1 mb-1.5">Card Information</label>
                    <div className="flex flex-col sm:flex-row bg-black/40 border border-white/15 rounded-xl overflow-hidden focus-within:border-orange-500 transition-colors">
                      <div className="flex-1 min-h-11 px-3.5 py-2.5 border-b sm:border-b-0 sm:border-r border-white/10 flex items-center gap-3">
                        <CreditCard className="text-gray-500 shrink-0" size={16} />
                        <input
                          id="card-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="Card number"
                          className="w-full bg-transparent outline-none text-xs sm:text-sm text-white placeholder:text-gray-600"
                        />
                      </div>
                      <div className="flex sm:w-44">
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          aria-label="Expiration date MM/YY"
                          placeholder="MM / YY"
                          className="w-1/2 min-h-11 px-3.5 py-2.5 bg-transparent border-r border-white/10 outline-none text-xs sm:text-sm text-white placeholder:text-gray-600"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          aria-label="Security code CVC"
                          placeholder="CVC"
                          className="w-1/2 min-h-11 px-3.5 py-2.5 bg-transparent outline-none text-xs sm:text-sm text-white placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="card-name" className="block text-xs font-bold text-gray-400 ml-1 mb-1.5">Name on card</label>
                    <input
                      id="card-name"
                      type="text"
                      autoComplete="cc-name"
                      className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none transition-colors text-xs sm:text-sm text-white placeholder:text-gray-600"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-11 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 outline-none mt-2 cursor-pointer"
                >
                  <Lock size={16} /> Subscribe &bull; $499.00 / mo
                </button>

                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                  <ShieldCheck size={14} className="text-emerald-500" /> Payments are 256-bit SSL encrypted.
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Order Summary inside Warm Orange Hub Card */}
          <div className="lg:col-span-5 relative order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:sticky lg:top-28 p-6 sm:p-8 rounded-2xl bg-linear-to-br from-orange-500/15 via-[#140f0d] to-[#0a0f16] border border-orange-500/35 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                  Order Summary
                </span>
                <span className="w-2 h-2 rounded-full bg-orange-500" />
              </div>

              <div className="flex justify-between items-start mb-5">
                <div>
                  <h4 className="font-black text-white text-lg sm:text-xl">Software Only Tier</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Enterprise Dealership OS</p>
                </div>
                <span className="font-black text-white text-lg sm:text-xl">$499.00</span>
              </div>

              <ul className="space-y-3 mb-5 py-4 border-y border-white/10">
                <li className="flex items-center gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-orange-500 shrink-0" size={16} /> Unlimited Agent Seats
                </li>
                <li className="flex items-center gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-orange-500 shrink-0" size={16} /> Live Floor Dashboard
                </li>
                <li className="flex items-center gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-orange-500 shrink-0" size={16} /> Full CRM API Integration
                </li>
              </ul>

              <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                <span className="text-gray-400 font-medium">Subtotal</span>
                <span className="text-white font-bold">$499.00</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm mb-5">
                <span className="text-gray-400 font-medium">Tax</span>
                <span className="text-white font-bold">$0.00</span>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-white/10">
                <div>
                  <span className="block text-orange-400 font-bold uppercase tracking-widest text-[10px] mb-1">
                    Total due today
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white">$499.00</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}