import React from 'react';
import { ArrowUp } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2e2e2e] pt-16 pb-12 font-mono text-[13px] text-[#8a8a8a]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#2e2e2e]">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-white rounded-[1px] rotate-45 inline-block" />
              <span className="text-xl font-bold tracking-[-0.03em] text-white font-sans uppercase">
                Voxpin
              </span>
            </div>

            <p className="text-xs text-[#8a8a8a] leading-[1.6] max-w-sm font-mono">
              // Plataforma SaaS para mapear opiniones, intención de voto y datos de mercado: cada persona encuestada es un pin en el mapa, y cada pin alimenta estadísticas en tiempo real.
            </p>

            <div className="text-[11px] text-[#525252] pt-1">
              [PROPUESTA TÉCNICA · WEB + MÓVIL · EVALUACIÓN & COTIZACIÓN]
            </div>
          </div>

          {/* Architecture & Navigation Links */}
          <div className="md:col-span-3 space-y-2 text-xs">
            <div className="text-white font-bold uppercase tracking-wider mb-3">
              MÓDULOS // MAPA
            </div>
            <ul className="space-y-1.5 text-[#8a8a8a]">
              <li><a href="#flujo" className="hover:text-white transition-colors">• El Flujo de Trabajo</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">• M1: Geolocalización & Clustering</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">• M2: Personalización Dinámica</a></li>
              <li><a href="#estadisticas" className="hover:text-white transition-colors">• M3: Análisis & Dashboard</a></li>
              <li><a href="#planes" className="hover:text-white transition-colors">• M4: Planes y Precios</a></li>
              <li><a href="#arquitectura" className="hover:text-white transition-colors">• Arquitectura PostGIS</a></li>
            </ul>
          </div>

          {/* Sectores de aplicación */}
          <div className="md:col-span-4 space-y-2 text-xs">
            <div className="text-white font-bold uppercase tracking-wider mb-3">
              SECTORES // APLICACIÓN
            </div>
            <div className="space-y-1.5 text-[#8a8a8a]">
              <div>• Campañas políticas y electorales</div>
              <div>• Estudios de mercado y consumo</div>
              <div>• Empresas privadas y retail</div>
              <div>• Instituciones públicas y encuestas sociales</div>
            </div>

            <div className="pt-3 text-[11px] text-white font-semibold">
              [DISEÑO MONOCROMÁTICO NEUTRAL // SIN SESGO PARTIDISTA]
            </div>
          </div>

        </div>

        {/* Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8a8a8a]">
          <div>
            © {new Date().getFullYear()} VOXPIN // SISTEMA GEOESPACIAL NEUTRAL.
          </div>

          <div>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3.6px] bg-[#141414] text-white hover:text-black hover:bg-white border border-[#2e2e2e] transition-colors cursor-pointer"
            >
              <span>SUBIR AL INICIO</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
