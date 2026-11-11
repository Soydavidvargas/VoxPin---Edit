import React, { useState } from 'react';
import { Sparkles, ExternalLink, X } from 'lucide-react';

interface VotalityAdBannerProps {
  onUpgradeClick: () => void;
}

export const VotalityAdBanner: React.FC<VotalityAdBannerProps> = ({ onUpgradeClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="absolute top-20 right-4 z-20 w-72 sm:w-80 bg-[#000000] border border-[#FFFFFF] p-3.5 rounded-sm shadow-2xl font-sans text-xs select-none animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-2.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">
          ESPACIO PUBLICITARIO • PLAN FREE
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-[#666666] hover:text-[#FFFFFF] cursor-pointer"
          title="Ocultar anuncio temporalmente"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="font-bold text-sm text-[#FFFFFF] leading-tight">
          Consultoría Territorial & Cartografía Censal 2026
        </div>
        <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
          Optimiza la recolección de firmas e intención de voto con microsegmentación espacial y padrón biométrico.
        </p>

        <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#1f1f1f]">
          <button
            onClick={onUpgradeClick}
            className="text-[10px] font-mono text-[#FFFFFF] underline hover:text-[#e5e5e5] cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Eliminar anuncios con Plan Pro</span>
          </button>
          <span className="font-mono text-[9px] text-[#666666]">AD #4019</span>
        </div>
      </div>
    </div>
  );
};

