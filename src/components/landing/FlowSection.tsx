import React from 'react';
import { 
  Smartphone, 
  MapPin, 
  BarChart3, 
  FileSpreadsheet
} from 'lucide-react';
import { ScrollReveal } from '../ui/ScrollReveal';
import { useSkeleton } from '../../context/SkeletonContext';
import { Skeleton, SkeletonBadge } from '../ui/Skeleton';

export const FlowSection: React.FC = () => {
  const { isSkeleton } = useSkeleton();

  const steps = [
    {
      num: '01',
      title: 'Encuestador registra',
      tag: 'APP MÓVIL // GPS',
      desc: 'El encuestador en campo captura nombre, edad, cédula, teléfono y dirección exacta o barrio desde su teléfono.',
      icon: Smartphone,
      badge: 'CAMPO',
    },
    {
      num: '02',
      title: 'Pin en el mapa',
      tag: 'MAPEO // AGRUPACIÓN',
      desc: 'Cada encuestado se posiciona como un pin. Si varias personas viven en la misma dirección, se reúnen en un solo pin interactivo.',
      icon: MapPin,
      badge: 'TIEMPO REAL',
    },
    {
      num: '03',
      title: 'Dashboard automático',
      tag: 'ESTADÍSTICA // ZONAS',
      desc: 'Los datos alimentan al instante métricas por zona, cruce demográfico vs. población total censada y tendencias sectoriales.',
      icon: BarChart3,
      badge: 'ALGORITMO',
    },
    {
      num: '04',
      title: 'Informe PDF / Excel',
      tag: 'EXPORTACIÓN // CRUDA',
      desc: 'Descarga instantánea de informes ejecutivos con gráficos numéricos y bases de datos tabuladas para análisis crudo.',
      icon: FileSpreadsheet,
      badge: 'ENTREGA',
    },
  ];

  return (
    <section id="flujo" className="py-24 border-b border-[#2e2e2e] relative bg-transparent">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal delay={0} className="max-w-3xl mb-16">
          {isSkeleton ? (
            <div className="space-y-4">
              <SkeletonBadge width={180} />
              <Skeleton className="h-10 sm:h-12 w-4/5 rounded-[3.6px]" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-10/12" />
              </div>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold tracking-wider uppercase mb-4">
                VISIÓN GENERAL · PÁGINA 2
              </div>
              <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.03em] leading-[0.95]">
                De una idea de voto a una plataforma completa
              </h2>
              <p className="text-base sm:text-[18px] text-[#d4d4d4] mt-4 leading-[1.62] tracking-[-0.03em] max-w-2xl">
                El punto de partida fue una necesidad concreta: contar con una herramienta eficiente que permita mapear la intención de voto. Al escalar la idea, el objetivo real pasó a ser un <strong className="text-white font-medium">aplicativo web y móvil de encuestas geolocalizadas, altamente personalizable</strong>.
              </p>
            </>
          )}
        </ScrollReveal>

        {/* EL FLUJO EN UNA IMAGEN Header */}
        <ScrollReveal delay={100} className="mb-6 flex items-center justify-between border-b border-[#2e2e2e] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-[1px]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              EL FLUJO EN UNA IMAGEN
            </span>
          </div>
          <span className="font-mono text-xs text-[#8a8a8a] hidden sm:inline">
            // TELEMETRÍA DE CAMPO A DECISIÓN ESTRATÉGICA
          </span>
        </ScrollReveal>

        {/* 4 Steps Grid (Live or Skeleton) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {isSkeleton ? (
            /* SKELETON WIREFRAME FOR THE 4 CARDS */
            steps.map((step, idx) => (
              <div 
                key={step.num}
                className="relative rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-6 flex flex-col justify-between h-full skeleton-shimmer min-h-[300px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-8 w-12 rounded-[3.6px]" />
                    <SkeletonBadge width={60} />
                  </div>

                  <Skeleton className="h-6 w-3/4 mb-3 rounded-[3.6px]" />
                  <Skeleton className="h-3.5 w-1/2 mb-5 rounded-[3.6px]" />

                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-11/12" />
                    <Skeleton className="h-3.5 w-4/5" />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#222] flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              </div>
            ))
          ) : (
            steps.map((step, idx) => {
              const Icon = step.icon;
              const stepImages = [
                '/assets/images/landing-mobile-field.webp',
                '/assets/images/landing-gis-map.webp',
                '/assets/images/landing-territory-cluster.webp',
                '/assets/images/landing-analytics-dashboard.webp',
              ];
              return (
                <ScrollReveal
                  key={step.num}
                  delay={idx * 120}
                  className="h-full"
                >
                  <div className="relative rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-5 hover:border-white transition-colors flex flex-col justify-between h-full group">
                    <div>
                      {/* Imagen optimizada en formato WebP con Lazy Loading nativo */}
                      <div className="relative overflow-hidden rounded-[3px] border border-[#2a2a2a] mb-4 aspect-video bg-[#0d0d0d]">
                        <picture>
                          <source srcSet={stepImages[idx]} type="image/webp" />
                          <img
                            src={stepImages[idx]}
                            alt={step.title}
                            loading="lazy"
                            decoding="async"
                            width="400"
                            height="225"
                            className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 opacity-80 group-hover:opacity-100"
                          />
                        </picture>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-[2px] bg-black/80 border border-white/20 font-mono text-[9px] text-[#cccccc] uppercase">
                          FASE 0{idx + 1} // WEBP
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-2xl font-light text-white">
                          {step.num}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] text-[#8a8a8a]">
                          {step.badge}
                        </span>
                      </div>

                      <h3 className="text-xl font-normal text-white tracking-[-0.03em] mb-1">
                        {step.title}
                      </h3>
                      
                      <div className="font-mono text-[11px] text-[#d4d4d4] uppercase tracking-wider mb-3">
                        {step.tag}
                      </div>

                      <p className="text-sm text-[#8a8a8a] leading-[1.6]">
                        {step.desc}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-[#2e2e2e] flex items-center justify-between font-mono text-[11px] text-[#8a8a8a]">
                      <span>FASE {step.num}</span>
                      <Icon className="w-4 h-4 text-[#8a8a8a] group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                </ScrollReveal>
              );
            })
          )}

        </div>

      </div>
    </section>
  );
};

