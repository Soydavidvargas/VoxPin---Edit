import React from 'react';
import { Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ScrollReveal } from '../ui/ScrollReveal';
import { useSkeleton } from '../../context/SkeletonContext';
import { Skeleton, SkeletonBadge } from '../ui/Skeleton';

interface PlansSectionProps {
  onSelectBasicPlan?: () => void;
  onOpenCampaignModal?: () => void;
  onOpenLogin?: () => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({
  onSelectBasicPlan,
  onOpenCampaignModal,
  onOpenLogin,
}) => {
  const { isSkeleton } = useSkeleton();

  return (
    <section id="seccion-planes" className="py-24 border-b border-[#2e2e2e] relative bg-transparent font-mono scroll-mt-16">
      <div id="planes" className="absolute -top-16" />
      <div id="pricing" className="absolute -top-16" />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <ScrollReveal delay={0} className="max-w-3xl mb-16">
          {isSkeleton ? (
            <div className="space-y-4">
              <SkeletonBadge width={240} />
              <Skeleton className="h-10 sm:h-12 w-3/4 rounded-[3.6px]" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-10/12" />
              </div>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
                PLANES Y SUSCRIPCIONES · MÓDULO 4
              </div>
              <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.03em] leading-[0.95] font-sans">
                Modelo de Negocio y Suscripciones
              </h2>
              <p className="text-base text-[#8a8a8a] mt-4 leading-[1.6]">
                Elige el plan ideal según tu alcance: comienza gratis para pruebas iniciales o activa un entorno de campaña con aislamiento territorial, cupos de encuestadores y estadísticas en tiempo real.
              </p>
            </>
          )}
        </ScrollReveal>

        {/* 2 Plans Container: Plan Básico (Free) & Plan por Campaña */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch font-mono">
          
          {isSkeleton ? (
            [
              { border: 'border-[#2e2e2e]' },
              { border: 'border-2 border-white' },
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`rounded-[3.6px] bg-[#141414] ${plan.border} p-6 sm:p-8 flex flex-col justify-between h-full skeleton-shimmer min-h-[480px]`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-3 w-20" />
                    {i === 1 && <SkeletonBadge width={110} />}
                  </div>
                  <Skeleton className="h-7 w-48 mb-2 rounded-[3.6px]" />
                  <Skeleton className="h-3.5 w-3/4 mb-6" />

                  <div className="space-y-3.5 border-t border-[#222] pt-6">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <Skeleton className="h-3.5 w-3.5 rounded-[1px] shrink-0" />
                        <Skeleton className="h-3.5 w-full" />
                      </div>
                    ))}
                  </div>
                </div>

                <Skeleton className="mt-8 h-12 w-full rounded-[3.6px]" />
              </div>
            ))
          ) : (
            <>
              {/* 1. Plan Básico (Free) */}
              <ScrollReveal delay={0} className="h-full">
                <div className="rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-6 sm:p-8 flex flex-col justify-between hover:border-[#666666] transition-all h-full">
                  <div>
                    <div className="text-[10px] uppercase text-[#8a8a8a] tracking-wider mb-2">
                      [GRATUITO]
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-normal text-white mb-1 font-sans">
                      Plan Básico
                    </h3>
                    <div className="text-xl font-bold text-white mb-2 font-mono">
                      $0 COP <span className="text-xs text-[#777777] font-normal">/ para siempre</span>
                    </div>
                    <p className="text-xs text-[#8a8a8a] mb-6">
                      Para mediciones iniciales, exploración comunitaria y barrios.
                    </p>

                    <div className="space-y-3.5 text-xs text-[#8a8a8a] border-t border-[#2e2e2e] pt-6">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-[#cccccc]">Hasta 1.000 pines de encuestas</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-[#888888]">Sin invitaciones de encuestadores (uso individual)</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Mapeo satelital GPS en tiempo real</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Lista de encuestados con coordenadas</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Acceso gratuito para siempre</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={onSelectBasicPlan}
                    className="mt-8 w-full py-3.5 rounded-[3.6px] bg-[#0a0a0a] text-white hover:bg-white hover:text-black border border-[#333333] hover:border-white text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>COMENZAR PLAN FREE</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </div>
              </ScrollReveal>

              {/* 2. Plan por Campaña */}
              <ScrollReveal delay={120} className="h-full">
                <div className="rounded-[3.6px] bg-[#141414] border-2 border-white p-6 sm:p-8 flex flex-col justify-between relative h-full shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-xs">
                    [RECOMENDADO]
                  </div>

                  <div>
                    <div className="text-[10px] uppercase text-[#8a8a8a] tracking-wider mb-2">
                      [TERRITORIAL // CAMPAÑAS]
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 font-sans">
                      Plan por Campaña
                    </h3>
                    <div className="text-xl font-bold text-white mb-2 font-mono">
                      Desde $3.500.000 COP <span className="text-xs text-[#888888] font-normal">/ campaña</span>
                    </div>
                    <p className="text-xs text-[#8a8a8a] mb-6">
                      Para despliegues electorales comunales, municipales y departamentales.
                    </p>

                    <div className="space-y-3.5 text-xs text-[#8a8a8a] border-t border-[#2e2e2e] pt-6">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-white font-semibold">
                          3 Niveles: Comunal, Municipal o Departamental
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-[#cccccc]">
                          De 15 a 200 encuestadores permitidos por perfil
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-white">
                          Hasta 250.000 pines con precisión GPS satelital
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Estadísticas completas y avanzadas en tiempo real</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Gestión de enlaces de invitación de un solo uso</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Aislamiento multi-tenant e inmutabilidad de registros</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={onOpenCampaignModal}
                    className="mt-8 w-full py-3.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>INICIAR CAMPAÑA</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </ScrollReveal>
            </>
          )}

        </div>

        {/* Informative Note & Opción para Usuarios con Cuenta Existente */}
        <div className="text-center font-mono text-xs text-[#777777] space-y-4">
          <div>
            <span>¿Tienes dudas sobre la asignación de cuotas o el perímetro territorial? </span>
            <span className="text-white underline cursor-pointer" onClick={onOpenCampaignModal}>
              Revisa los detalles de cada nivel territorial.
            </span>
          </div>

          <div className="pt-4 border-t border-[#222222] max-w-md mx-auto">
            <span className="text-[#8a8a8a]">¿Ya tienes una cuenta activa? </span>
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-white hover:text-white/80 underline font-semibold transition-colors cursor-pointer"
            >
              Inicia sesión aquí
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
