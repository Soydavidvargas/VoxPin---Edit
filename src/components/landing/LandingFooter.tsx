import React from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '../ui/ScrollReveal';
import { FileText, ShieldCheck, ExternalLink } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-transparent border-t border-[#2e2e2e] pt-16 pb-12 font-mono text-[13px] text-[#8a8a8a]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Main Footer Row */}
        <ScrollReveal delay={0}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#2e2e2e]">
            
            {/* Brand Info */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-white rounded-[1px] rotate-45 inline-block" />
                <span className="text-xl font-bold tracking-[-0.03em] text-white font-sans uppercase">
                  Votality
                </span>
              </div>

              <p className="text-xs text-[#8a8a8a] leading-[1.6] max-w-sm font-mono">
                // Plataforma SaaS para mapear opiniones, intención de voto y datos de mercado: cada persona encuestada es un pin en el mapa, y cada pin alimenta estadísticas en tiempo real.
              </p>

              {/* Botón Destacado: Términos y Condiciones */}
              <div className="pt-2">
                <Link
                  to="/terminos"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#141414] hover:bg-white hover:text-black text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm border border-[#333333] hover:border-white transition-all cursor-pointer shadow-sm group"
                >
                  <FileText className="w-3.5 h-3.5 text-[#00FF85] group-hover:text-black transition-colors" />
                  <span>Términos y condiciones</span>
                  <ExternalLink className="w-3 h-3 text-[#777777] group-hover:text-black transition-colors" />
                </Link>
              </div>
            </div>

            {/* Architecture & Navigation Links */}
            <div className="md:col-span-3 space-y-2 text-xs">
              <div className="text-white font-bold uppercase tracking-wider mb-3">
                PLATAFORMA // PASOS
              </div>
              <ul className="space-y-1.5 text-[#8a8a8a]">
                <li><a href="#flujo" className="hover:text-white transition-colors">• Flujo Metodológico</a></li>
                <li><a href="#videos-oficiales" className="hover:text-white transition-colors">• Demostración en Video</a></li>
                <li><a href="#planes" className="hover:text-white transition-colors">• Planes y Suscripciones</a></li>
                <li>
                  <Link to="/terminos" className="hover:text-white text-[#aaaaaa] font-semibold transition-colors flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00FF85]" />
                    <span>Términos y condiciones</span>
                  </Link>
                </li>
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
        </ScrollReveal>

        {/* Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8a8a8a]">
          <div>
            © {new Date().getFullYear()} VOTALITY // SISTEMA GEOESPACIAL NEUTRAL.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link
              to="/terminos"
              className="text-[#aaaaaa] hover:text-white transition-colors underline underline-offset-4"
            >
              Términos y condiciones
            </Link>
            <span className="text-[#444444]">|</span>
            <Link
              to="/terminos"
              className="text-[#aaaaaa] hover:text-white transition-colors"
            >
              Políticas de Suscripciones (6 meses)
            </Link>
            <span className="text-[#444444]">|</span>
            <Link
              to="/terminos"
              className="text-[#aaaaaa] hover:text-white transition-colors"
            >
              Habeas Data & Privacidad
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
