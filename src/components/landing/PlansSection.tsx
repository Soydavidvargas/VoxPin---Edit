import React from 'react';
import { Check, Zap, FileText } from 'lucide-react';

export const PlansSection: React.FC = () => {
  return (
    <section id="planes" className="py-24 border-b border-[#2e2e2e] relative bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            SAAS CON COBRO MENSUAL · MÓDULO 4
          </div>
          <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.03em] leading-[0.95]">
            Modelo de Negocio y Suscripciones
          </h2>
          <p className="text-base text-[#8a8a8a] mt-4 leading-[1.6]">
            Requiere inicio de sesión (estándar o Google) y genera un código de acceso único por cliente. Los administradores crean y gestionan los permisos de sus encuestadores.
          </p>
        </div>

        {/* 3 SaaS Plans from Page 6 in Monochrome */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14 items-stretch font-mono">
          
          {/* Plan Básico */}
          <div className="rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-6 flex flex-col justify-between hover:border-white transition-colors">
            <div>
              <div className="text-[10px] uppercase text-[#8a8a8a] tracking-wider mb-2">
                [GRATUITO]
              </div>
              <h3 className="text-2xl font-normal text-white mb-1 font-sans">Plan Básico</h3>
              <p className="text-xs text-[#8a8a8a] mb-6">Para mediciones iniciales y barrios.</p>

              <div className="space-y-3 text-xs text-[#8a8a8a] border-t border-[#2e2e2e] pt-6">
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Hasta 100 usuarios / pines</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Filtros: barrio/localidad, grupo o evento</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Estadísticas generales y censuradas</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Monetización con anuncios en la app</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Pago por evento para exportar</span>
                </div>
              </div>
            </div>

            <button className="mt-8 w-full py-3 rounded-[3.6px] bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] border border-[#2e2e2e] text-xs font-bold tracking-wider uppercase transition-colors">
              Comenzar Básico
            </button>
          </div>

          {/* Plan Premium */}
          <div className="rounded-[3.6px] bg-[#141414] border-2 border-white p-6 flex flex-col justify-between relative">
            <div className="absolute top-3 right-3 text-white text-[10px] font-bold uppercase tracking-wider">
              [RECOMENDADO]
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#8a8a8a] tracking-wider mb-2">
                [EMPRESARIAL // INSTITUCIONAL]
              </div>
              <h3 className="text-2xl font-normal text-white mb-1 font-sans">Plan Premium</h3>
              <p className="text-xs text-[#8a8a8a] mb-6">Para empresas y entidades de investigación.</p>

              <div className="space-y-3 text-xs text-[#8a8a8a] border-t border-[#2e2e2e] pt-6">
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span className="text-white">Verificación de empresa (automática/manual)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Registro de trabajadores con validación SheerID</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span className="text-white">Acceso ilimitado a estadísticas</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Campos personalizados en encuestas</span>
                </div>
              </div>
            </div>

            <button className="mt-8 w-full py-3.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black text-xs font-bold tracking-wider uppercase transition-colors">
              Activar Plan Premium
            </button>
          </div>

          {/* Modo Campaña */}
          <div className="rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-6 flex flex-col justify-between hover:border-white transition-colors">
            <div>
              <div className="text-[10px] uppercase text-[#8a8a8a] tracking-wider mb-2">
                [NACIONAL]
              </div>
              <h3 className="text-2xl font-normal text-white mb-1 font-sans">Modo Campaña</h3>
              <p className="text-xs text-[#8a8a8a] mb-6">Para despliegues masivos por toda Colombia.</p>

              <div className="space-y-3 text-xs text-[#8a8a8a] border-t border-[#2e2e2e] pt-6">
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span className="text-white">Despliegues masivos concurrentes</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Uso ilimitado en cualquier municipio</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Modificación total de encuestas y métricas</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>Infraestructura PostGIS de alta tasa</span>
                </div>
              </div>
            </div>

            <button className="mt-8 w-full py-3 rounded-[3.6px] bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] border border-[#2e2e2e] text-xs font-bold tracking-wider uppercase transition-colors">
              Solicitar Campaña
            </button>
          </div>

        </div>

        {/* Verificación de Empresa en Premium (Page 6) in Monochrome */}
        <div className="rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-6 sm:p-8 font-mono">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              VERIFICACIÓN DE EMPRESA EN PREMIUM · EL CLIENTE ELIGE EL FLUJO
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Box 1: Automático */}
            <div className="p-5 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Zap className="w-4 h-4" />
                <span>Flujo 1: Automático</span>
              </div>
              <p className="text-[#8a8a8a] leading-[1.6]">
                Validadores de identidad digital, correos corporativos autenticados (@empresa.com) o pasarelas de pago, para <strong className="text-white">activación inmediata</strong>.
              </p>
            </div>

            {/* Box 2: Manual */}
            <div className="p-5 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <FileText className="w-4 h-4" />
                <span>Flujo 2: Manual</span>
              </div>
              <p className="text-[#8a8a8a] leading-[1.6]">
                Carga de documentación oficial (RUT vigente o Certificado de Cámara de Comercio) para validación interna del equipo.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
