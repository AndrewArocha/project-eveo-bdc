import { useState } from 'react';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import LegalModal from '../UI/LegalModal';

export default function Footer() {
    const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  return (
    <footer className="w-full border-t border-white/10 bg-[#020305] py-12 px-6 z-20 relative text-center">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6 opacity-80">
          <img src={eveoSymbol} alt="EVEO" className="w-5 h-5 grayscale" />
          <span className="text-lg font-black tracking-widest uppercase text-white">EVEO</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-500 font-medium mb-8">
          <button onClick={() => setModalType('privacy')} className="hover:text-orange-500 transition-colors">Privacy Policy</button>
          <button onClick={() => setModalType('terms')} className="hover:text-orange-500 transition-colors">Terms of Service</button>
          <a href="#" className="hover:text-orange-500 transition-colors">Contact</a>
        </div>
        <p className="text-xs text-gray-600 mb-2">&copy; {new Date().getFullYear()} EVEO BDC. All rights reserved.</p>
        <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Engineered by Andres Hernandez</p>
      </div>

        <LegalModal isOpen={modalType !== null} onClose={() => setModalType(null)} type={modalType} />
    </footer>
  );
}