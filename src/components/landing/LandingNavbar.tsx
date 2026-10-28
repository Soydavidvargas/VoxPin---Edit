import React from 'react';
import { ArrowRight } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const scrollToFlow = () => {
    const element = document.getElementById('flujo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#2e2e2e] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Wordmark (Strictly Black & White) */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-white rounded-[1px] rotate-45 inline-block shrink-0" />
            <span className="text-xl font-bold tracking-[-0.03em] text-white font-sans uppercase">
              Voxpin
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] text-[#8a8a8a] tracking-wider uppercase border-l border-[#2e2e2e] pl-3 py-0.5">
            // PLATAFORMA GEOESPACIAL
          </span>
        </div>

        {/* Solo el botón "Conocer plataforma" (Monochrome: White button, Black text) */}
        <div>
          <button
            onClick={scrollToFlow}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-[13px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
          >
            <span>Conocer plataforma</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </header>
  );
};
