import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-24 pb-12 px-4 sm:px-6 relative overflow-x-hidden flex justify-center">
      
      <div className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Left Column: Payment Form */}
        <div className="lg:col-span-7 flex flex-col">
          <button 
            onClick={() => navigate('/admin/store')}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-8 outline-none w-fit"
          >
            <ArrowLeft size={16} /> Back to Plans
          </button>

          <h1 className="text-3xl font-black drop-shadow-md tracking-tight text-white mb-8">Secure Checkout</h1>

          <form className="space-y-8" onSubmit={e => e.preventDefault()}>
            
            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex flex-col p-4 rounded-xl border-2 border-orange-500 bg-orange-500/5 cursor-pointer">
                  <input type="radio" name="payment_method" value="card" className="absolute opacity-0" defaultChecked />
                  <CreditCard className="text-orange-500 mb-2" size={24} />
                  <span className="font-bold text-white text-sm">Credit Card</span>
                </label>
                <label className="relative flex flex-col p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="radio" name="payment_method" value="paypal" className="absolute opacity-0" />
                  {/* Standard SVG icon for PayPal */}
                  <svg className="mb-2 w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                  </svg>
                  <span className="font-bold text-gray-300 text-sm">PayPal</span>
                </label>
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Card Details</h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Card Information</label>
                <div className="flex flex-col sm:flex-row bg-black/50 border border-white/10 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                  <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-white/10 flex items-center gap-3">
                    <CreditCard className="text-gray-500" size={18} />
                    <input type="text" placeholder="Card number" className="w-full bg-transparent outline-none text-sm text-white placeholder:text-gray-600" />
                  </div>
                  <div className="flex sm:w-48">
                    <input type="text" placeholder="MM / YY" className="w-1/2 px-4 py-3 bg-transparent border-r border-white/10 outline-none text-sm text-white placeholder:text-gray-600" />
                    <input type="text" placeholder="CVC" className="w-1/2 px-4 py-3 bg-transparent outline-none text-sm text-white placeholder:text-gray-600" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Name on card</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white placeholder:text-gray-600" placeholder="John Doe" />
              </div>
            </div>

            <button className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 outline-none mt-4">
              <Lock size={18} /> Subscribe • $499.00 / mo
            </button>
            
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <ShieldCheck size={14} /> Payments are secure and encrypted.
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 relative mt-8 lg:mt-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="sticky top-32 p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl"
          >
            <h3 className="text-xl font-black text-white mb-6">Order Summary</h3>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-bold text-white text-lg">Software Only Tier</h4>
                <p className="text-sm text-gray-400 mt-1">Enterprise Dealership OS</p>
              </div>
              <span className="font-bold text-white text-lg">$499.00</span>
            </div>

            <ul className="space-y-3 mb-6 py-6 border-y border-white/10">
              <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={18} /> Unlimited Agent Seats</li>
              <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={18} /> Live Floor Dashboard</li>
              <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={18} /> Full CRM API Integration</li>
            </ul>

            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-medium">Subtotal</span>
              <span className="text-white font-medium">$499.00</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-400 font-medium">Tax</span>
              <span className="text-white font-medium">$0.00</span>
            </div>

            <div className="flex justify-between items-end pt-6 border-t border-white/10">
              <div>
                <span className="block text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Total due today</span>
                <span className="text-3xl font-black text-white">$499.00</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}