import React from 'react';
import { ArrowRight } from 'lucide-react';
import { EarthGlobe3D } from '../EarthGlobe3D';
import { useSkeleton } from '../../context/SkeletonContext';
import { Skeleton, SkeletonBadge } from '../ui/Skeleton';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  const { isSkeleton } = useSkeleton();

  return (
    <section id="hero" className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-14 lg:py-20 border-b border-[#2e2e2e] bg-transparent">
      
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column (6 cols): Technical Proposal Text or Skeleton Wireframe */}
          <div className="lg:col-span-6 space-y-7">
            
            {isSkeleton ? (
              /* SKELETON WIREFRAME FOR HERO */
              <div className="space-y-6">
                <SkeletonBadge width={220} className="h-6" />

                <div className="space-y-3">
                  <Skeleton className="h-12 sm:h-14 w-11/12 rounded-[3.6px]" />
                  <Skeleton className="h-12 sm:h-14 w-8/12 rounded-[3.6px]" />
                </div>

                <div className="space-y-2.5 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-3">
                  <Skeleton className="h-12 w-48 rounded-[3.6px]" />
                  <Skeleton className="h-12 w-36 rounded-[3.6px]" />
                </div>

                <div className="pt-4 border-t border-[#2e2e2e] flex flex-wrap items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-28 rounded-[3.6px]" />
                  <Skeleton className="h-6 w-32 rounded-[3.6px]" />
                  <Skeleton className="h-6 w-20 rounded-[3.6px]" />
                  <Skeleton className="h-6 w-24 rounded-[3.6px]" />
                </div>
              </div>
            ) : (
              /* LIVE HERO CONTENT */
              <>
                {/* Massive Editorial Headline: 58-72px */}
                <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-normal text-white tracking-[-0.03em] leading-[0.90] font-sans">
                  Encuestas <br />
                  <span className="text-[#a3a3a3]">geolocalizadas</span>
                </h1>

                {/* Body text */}
                <p className="text-base sm:text-[18px] text-[#d4d4d4] max-w-xl font-normal leading-[1.62] tracking-[-0.03em]">
                  Una plataforma SaaS para mapear opiniones, intención de voto y datos de mercado: <strong className="text-white font-medium">cada persona encuestada es un pin en el mapa</strong>, y cada pin alimenta estadísticas en tiempo real.
                </p>

                {/* Action Button: Descubrir cómo funciona */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={onExploreClick}
                    className="px-6 py-3.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-[13px] font-bold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Descubrir cómo funciona</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Target Audience Rails (Page 1) — Monochromatic tags */}
                <div className="pt-4 border-t border-[#2e2e2e] flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-[#8a8a8a] uppercase tracking-wider text-[11px] mr-1">
                    SECTORES:
                  </span>
                  <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                    Campañas políticas
                  </span>
                  <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                    Estudios de mercado
                  </span>
                  <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                    Empresas
                  </span>
                  <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                    Instituciones
                  </span>
                </div>
              </>
            )}

          </div>

          {/* Right Column (6 cols): 3D EARTH PLANET OR SKELETON RADAR SCAN */}
          <div className="lg:col-span-6 relative flex items-center justify-center w-full min-h-[340px] sm:min-h-[460px] lg:min-h-[560px] pointer-events-auto">
            {isSkeleton ? (
              /* SKELETON WIREFRAME RADAR & TELEMETRY */
              <div className="w-full h-[340px] sm:h-[460px] lg:h-[560px] rounded-[3.6px] border border-[#2e2e2e] bg-[#101010] p-6 flex flex-col justify-between relative overflow-hidden skeleton-shimmer">
                <div className="flex items-center justify-between font-mono text-[11px] text-[#8a8a8a] border-b border-[#222] pb-3 z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-[1px] bg-white animate-ping" />
                    <span>SKELETON // MALLA GEOESPACIAL</span>
                  </div>
                  <span>GRID: 64x64 NODOS</span>
                </div>

                {/* Radar Scanning Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-dashed border-[#555] animate-[spin_16s_linear_infinite]" />
                  <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-[#444] absolute" />
                  <div className="w-24 h-24 rounded-full border border-white/40 absolute" />
                  <div className="w-full h-[1px] bg-[#333] absolute" />
                  <div className="h-full w-[1px] bg-[#333] absolute" />
                </div>

                {/* Shimmering Node Placeholders */}
                <div className="grid grid-cols-3 gap-3 z-10 mt-auto">
                  <div className="p-3 bg-[#161616] border border-[#2a2a2a] rounded-[3.6px]">
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="p-3 bg-[#161616] border border-[#2a2a2a] rounded-[3.6px]">
                    <Skeleton className="h-3 w-14 mb-2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="p-3 bg-[#161616] border border-[#2a2a2a] rounded-[3.6px]">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-5 w-22" />
                  </div>
                </div>
              </div>
            ) : (
              <EarthGlobe3D className="w-full h-[340px] sm:h-[460px] lg:h-[560px]" />
            )}
          </div>

        </div>
      </div>

    </section>
  );
};

