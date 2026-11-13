import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  AlertTriangle,
  Building,
  Crown,
  Briefcase,
  Shield,
  Info,
  Lock,
  Mail,
  Users,
  MapPin,
  X,
} from 'lucide-react';
import { ScrollReveal } from '../ui/ScrollReveal';
import { useSkeleton } from '../../context/SkeletonContext';
import { Skeleton, SkeletonBadge } from '../ui/Skeleton';

interface PlansSectionProps {
  onSelectBasicPlan?: () => void;
  onOpenCampaignModal?: () => void;
  onOpenLogin?: () => void;
  onSelectPremiumPlan?: () => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({
  onSelectBasicPlan,
  onOpenCampaignModal,
  onOpenLogin,
  onSelectPremiumPlan,
}) => {
  const { isSkeleton } = useSkeleton();
  const [activeInfoModal, setActiveInfoModal] = useState<'premium' | 'empresarial' | null>(null);

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
                Elige el plan ideal según tu alcance: comienza gratis para pruebas iniciales, activa un entorno territorial de campaña o elige planes profesionales y corporativos.
              </p>
            </>
          )}
        </ScrollReveal>

        {/* FILA 1: Plan Básico (Free) & Plan por Campaña */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 items-stretch font-mono">
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
              {/* 1. Plan Básico (Free / Jamás pagas) */}
              <ScrollReveal delay={0} className="h-full">
                <div className="rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-6 sm:p-8 flex flex-col justify-between hover:border-[#666666] transition-all h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase text-[#8a8a8a] tracking-wider">
                        [GRATUITO]
                      </div>
                      <span className="px-2 py-0.5 bg-[#222222] text-[#aaaaaa] border border-[#333333] text-[9px] font-bold uppercase rounded-xs">
                        JAMÁS PAGAS
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-normal text-white mb-1 font-sans">
                      Plan Básico
                    </h3>
                    <div className="text-xl font-bold text-white mb-1 font-mono">
                      $0 COP <span className="text-xs text-[#777777] font-normal">/ para siempre</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#aaaaaa] mb-4">
                      Medición comunitaria e individual sin costo.
                    </div>

                    {/* Aviso de Anuncios y Limitaciones */}
                    <div className="p-3 bg-[#111111] border border-[#2e2e2e] rounded-sm text-[10.5px] font-mono text-[#888888] mb-5 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[9px]">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Contiene anuncios y limitaciones</span>
                      </div>
                      <p className="text-[#999999] leading-relaxed">
                        Es 100% gratis y jamás pagas, pero contiene publicidad y cuenta con limitaciones de uso que se abren adquiriendo un plan de pago.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs text-[#8a8a8a] border-t border-[#2e2e2e] pt-4">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-[#cccccc]">Hasta 100 pines propios guardados</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-[#888888]">Sin invitaciones de encuestadores (uso individual)</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Mapeo GPS en tiempo real con precisión satelital</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Lista de encuestados en padrón</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#00FF85] shrink-0 mt-0.5" />
                        <span className="text-[#00FF85] font-bold">Vigencia: Tiempo ilimitado (acceso para siempre)</span>
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

              {/* 2. Plan por Campaña (Precio Oculto a Simple Vista - Se entra para mirar precios) */}
              <ScrollReveal delay={120} className="h-full">
                <div className="rounded-[3.6px] bg-[#141414] border-2 border-white p-6 sm:p-8 flex flex-col justify-between relative h-full shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-xs">
                    [RECOMENDADO]
                  </div>

                  <div>
                    <div className="text-[10px] uppercase text-[#8a8a8a] tracking-wider mb-2">
                      [TERRITORIAL // CAMPAÑAS ELECTORALES]
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 font-sans">
                      Plan por Campaña
                    </h3>
                    
                    {/* Precio Oculto a Simple Vista */}
                    <div className="mb-2">
                      <div className="text-base sm:text-lg font-bold text-[#00FF85] font-mono flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <span>Tarifa por Nivel Territorial</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#888888] mt-0.5">
                        Licencia de 6 meses · Pago único sin mensualidades
                      </div>
                    </div>

                    {/* Explicación de por qué esta inversión estratégica */}
                    <div className="p-3 bg-[#111111] border border-[#2a2a2a] rounded-sm text-[10.5px] font-mono text-[#cccccc] mb-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-white font-bold uppercase text-[9px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00FF85] shrink-0" />
                        <span>¿POR QUÉ ESTA INVERSIÓN ESTRATÉGICA?</span>
                      </div>
                      <p className="text-[#aaaaaa] leading-relaxed">
                        Cuesta esta inversión por la <strong className="text-white">información tan inmensa</strong> que obtienes en territorio y la ventaja de coordinar <strong className="text-white">socios y encuestadores que te ayudan a levantar datos</strong> en terreno con funciones casi ilimitadas.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs text-[#8a8a8a] border-t border-[#2e2e2e] pt-4">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span className="text-white font-semibold">
                          Licencia activa por 6 meses completos (Pago Único)
                        </span>
                      </div>
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
                          Hasta 250.000 pines con precisión satelital
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Estadísticas avanzadas en tiempo real sin anuncios</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>Respaldo garantizado en PDF y Excel 15 días antes de finalizar</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#00FF85] shrink-0 mt-0.5" />
                        <span className="text-white font-medium">
                          Pines 100% privados: nadie ve tus pines ajenos salvo encuestadores con token
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={onOpenCampaignModal}
                    className="mt-8 w-full py-3.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>ENTRAR PARA MIRAR PRECIOS</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </ScrollReveal>
            </>
          )}
        </div>

        {/* FILA 2: Plan Premium & Plan Empresarial e Institucional */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00FF85]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#888888] font-bold">
              MÁS OPCIONES DE SUSCRIPCIÓN // PROFESIONAL Y CORPORATIVO
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch font-mono">
            {/* 3. Plan Premium */}
            <div className="rounded-[3.6px] bg-[#111111] border border-[#2e2e2e] hover:border-[#D4AF37] p-6 sm:p-7 flex flex-col justify-between transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase text-[#D4AF37] font-bold tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                    [SUSCRIPCIÓN MENSUAL // PROFESIONAL]
                  </span>
                  <span className="px-2 py-0.5 bg-[#201804] text-amber-300 border border-[#D4AF37]/40 text-[9px] font-bold uppercase rounded-xs">
                    PAGO MENSUAL
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1 font-sans group-hover:text-[#FBBF24] transition-colors">
                  Plan Premium
                </h3>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mb-1">
                  $350.000 COP <span className="text-xs text-[#888888] font-normal font-mono">/ mes</span>
                </div>
                <div className="text-xs font-mono text-[#D4AF37] font-bold mb-3">
                  Tarifa mensual flexible · Sin permanencia
                </div>

                <p className="text-xs text-[#aaaaaa] leading-relaxed mb-5 font-sans">
                  Mejores funciones que la versión gratuita y con pago mensual, diseñado para un uso más profesional y de gran alcance: eventos masivos, grupos de trabajo, sondeos comunitarios, activismo y organizaciones.
                </p>

                <div className="space-y-2.5 text-xs text-[#8a8a8a] border-t border-[#222222] pt-4">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="text-white font-semibold">100% Libre de anuncios publicitarios</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-[#cccccc]">Hasta <strong className="text-white">30 encuestadores</strong> permitidos en su perfil</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-[#cccccc]">Hasta <strong className="text-white">1.000 pines</strong> máximo guardados</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>Permisos para usar <strong className="text-white">estadísticas completas</strong> y descargarlas en <strong className="text-white">Excel y PDF</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>Formularios avanzados con preguntas personalizadas ilimitadas</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#00FF85] shrink-0 mt-0.5" />
                    <span className="text-[#00FF85]">Pago mensual cancelable en cualquier momento</span>
                  </div>

                  {/* Resguardo temporal 3 meses y envío por correo PDF/Excel */}
                  <div className="mt-2 p-3 rounded-sm bg-[#161205] border border-[#D4AF37]/50 flex items-start gap-2.5 text-[11px] font-mono text-[#dcdcdc] leading-snug">
                    <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#D4AF37] font-bold block mb-0.5">RESGUARDO TEMPORAL DE 3 MESES:</span>
                      <span>La información se resguarda temporalmente durante 3 meses aunque se acabe la mensualidad. Antes de borrarse, <strong className="text-[#00FF85]">se le enviará a su correo el PDF y Excel</strong> con los últimos datos registrados.</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onSelectPremiumPlan) {
                    onSelectPremiumPlan();
                  } else {
                    window.location.href = '/pago?plan=premium&rol=director_campana';
                  }
                }}
                className="mt-6 w-full py-3 rounded-[3.6px] bg-[#1a1505] hover:bg-[#D4AF37] text-[#FBBF24] hover:text-black border border-[#D4AF37]/60 hover:border-[#D4AF37] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <span>ELEGIR PLAN PREMIUM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. Plan Empresarial e Institucional (En desarrollo - Activa Muy Pronto) */}
            <div className="rounded-[3.6px] bg-[#111111] border border-[#2e2e2e] hover:border-amber-500/40 p-6 sm:p-7 flex flex-col justify-between transition-all group relative">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase text-[#888888] font-bold tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-white" />
                    [CORPORATIVO // PRIVADO]
                  </span>
                  <span className="px-2 py-0.5 bg-[#241a06] text-amber-300 border border-amber-500/50 text-[9px] font-bold uppercase rounded-xs flex items-center gap-1 shadow-sm">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    Activa Muy Pronto
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1 font-sans">
                  Empresarial e Institucional
                </h3>
                <div className="text-sm font-mono text-white font-bold mb-3 flex items-center justify-between">
                  <span>A Medida · Cotización Institucional</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">
                    [Próximamente]
                  </span>
                </div>

                <p className="text-xs text-[#aaaaaa] leading-relaxed mb-5 font-sans">
                  Diseñado exclusivamente para encuestas privadas, estudios de mercado corporativos y levantamiento confidencial que realizan las empresas, gremios o instituciones públicas y privadas.
                </p>

                <div className="space-y-2.5 text-xs text-[#8a8a8a] border-t border-[#222222] pt-4">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-white font-semibold">Entorno 100% privado y cerrado (alta seguridad)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-[#cccccc]">Gestión para encuestadores corporativos propios</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>Formularios confidenciales para estudios de mercado y marcas</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>Tableros analíticos institucionales y segmentación empresarial</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-[#00FF85]">Soporte dedicado y acuerdo de confidencialidad (NDA)</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-[3.6px] bg-[#161616] text-[#777777] border border-[#2a2a2a] text-xs font-mono font-bold tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-2 select-none opacity-80"
                  title="Función en desarrollo - Activa muy pronto"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Activa Muy Pronto</span>
                </button>
              </div>
            </div>
          </div>
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

      {/* Modal Informativo para Plan Premium o Plan Empresarial */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono select-none animate-in fade-in duration-150">
          <div className="bg-[#0c0c0c] border-2 border-white w-full max-w-lg rounded-sm shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2 font-bold text-white">
                {activeInfoModal === 'premium' ? (
                  <>
                    <Crown className="w-4 h-4 text-[#D4AF37]" />
                    <span>PLAN PREMIUM // PROFESIONAL</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 text-white" />
                    <span>PLAN EMPRESARIAL E INSTITUCIONAL</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveInfoModal(null)}
                className="p-1 rounded-sm text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#cccccc] leading-relaxed">
                {activeInfoModal === 'premium'
                  ? 'El Plan Premium ($350.000 COP/mes) incluye hasta 30 encuestadores, 1.000 pines, formularios personalizados ilimitados, eliminación total de anuncios y descarga en PDF y Excel. Si se te acaba la mensualidad, tu información se mantendrá resguardada temporalmente por 3 meses. Antes de borrarse, te enviaremos por correo el PDF y Excel con la última información guardada.'
                  : 'El Plan Empresarial e Institucional está reservado para compañías, entidades públicas y gremios que requieren recolectar encuestas privadas confidenciales, con protocolos de seguridad cerrados, usuarios ilimitados y acompañamiento analítico.'}
              </p>

              <div className="p-3 bg-[#141414] border border-[#2b2b2b] rounded-sm space-y-2">
                <span className="text-[10px] text-[#888888] uppercase tracking-wider block font-bold">
                  {activeInfoModal === 'premium' ? 'Modalidad de Suscripción' : 'Condiciones Institucionales'}
                </span>
                <div className="text-white font-bold text-sm">
                  {activeInfoModal === 'premium'
                    ? '$350.000 COP / mes · Sin cláusulas de permanencia'
                    : 'Cotización personalizada según alcance de la empresa o institución'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                onClick={() => setActiveInfoModal(null)}
                className="px-4 py-2 rounded-sm bg-[#181818] text-[#888888] hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setActiveInfoModal(null);
                  if (activeInfoModal === 'premium') {
                    if (onSelectPremiumPlan) {
                      onSelectPremiumPlan();
                    } else {
                      window.location.href = '/pago?plan=premium&rol=director_campana';
                    }
                  } else if (onOpenLogin) {
                    onOpenLogin();
                  }
                }}
                className="px-5 py-2.5 rounded-sm bg-white text-black font-bold text-xs font-mono uppercase tracking-wider hover:bg-[#e0e0e0] cursor-pointer flex items-center gap-1.5"
              >
                <span>{activeInfoModal === 'premium' ? 'Suscribirme Ahora' : 'Contactar Asesor'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
