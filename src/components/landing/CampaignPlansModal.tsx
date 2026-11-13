import React from 'react';
import { X, Check, Shield, Users, MapPin, BarChart3, ArrowRight, Calendar, AlertTriangle, Clock } from 'lucide-react';

export interface CampaignPlanTier {
  id: string;
  codigo: 'COMUNAL' | 'MUNICIPAL' | 'DEPARTAMENTAL';
  nombre: string;
  nivel: string;
  precio: string;
  precioNumero: number;
  limiteEncuestadores: number;
  limitePines: number;
  beneficioEstadisticas: string;
  descripcion: string;
  etiquetaBoton: string;
  recomendado?: boolean;
}

export const CAMPAIGN_PLAN_TIERS: CampaignPlanTier[] = [
  {
    id: 'plan-comunal',
    codigo: 'COMUNAL',
    nombre: 'Plan Campaña Comunal',
    nivel: 'Comunas, Corregimientos y JAL',
    precio: '$3.500.000 COP',
    precioNumero: 3500000,
    limiteEncuestadores: 15,
    limitePines: 10000,
    beneficioEstadisticas: 'Estadísticas completas de sus encuestas en tiempo real.',
    descripcion: 'Diseñado para liderazgos locales, ediles y campañas en comunas o sectores barriales.',
    etiquetaBoton: 'ADQUIRIR PLAN COMUNAL',
    recomendado: false,
  },
  {
    id: 'plan-municipal',
    codigo: 'MUNICIPAL',
    nombre: 'Plan Campaña Municipal',
    nivel: 'Alcaldía y Concejo Municipal',
    precio: '$9.500.000 COP',
    precioNumero: 9500000,
    limiteEncuestadores: 50,
    limitePines: 50000,
    beneficioEstadisticas: 'Estadísticas avanzadas de sus encuestas en tiempo real.',
    descripcion: 'Cobertura integral para cabeceras municipales, ciudades intermedias y equipos robustos.',
    etiquetaBoton: 'ADQUIRIR PLAN MUNICIPAL',
    recomendado: true,
  },
  {
    id: 'plan-departamental',
    codigo: 'DEPARTAMENTAL',
    nombre: 'Plan Campaña Departamental',
    nivel: 'Gobernación y Asamblea',
    precio: '$18.000.000 COP',
    precioNumero: 1800000,
    limiteEncuestadores: 200,
    limitePines: 250000,
    beneficioEstadisticas: 'Estadísticas departamentales de sus encuestas en tiempo real.',
    descripcion: 'Infraestructura de alta capacidad para múltiples municipios y despliegue masivo simultáneo.',
    etiquetaBoton: 'ADQUIRIR PLAN DEPARTAMENTAL',
    recomendado: false,
  },
];

interface CampaignPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: CampaignPlanTier) => void;
  onOpenLogin?: () => void;
}

export const CampaignPlansModal: React.FC<CampaignPlansModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  onOpenLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0a0a0a] border border-[#2e2e2e] rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#222222] bg-[#0d0d0d] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-white rounded-[1px] rotate-45 inline-block shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <div>
              <div className="text-[10px] text-[#888888] tracking-widest uppercase mb-0.5">
                VOTALITY // PLANES POR CAMPAÑA ELECTORAL
              </div>
              <h2 className="text-xl sm:text-2xl font-normal text-white font-sans tracking-tight">
                Tarifas y Niveles Territoriales de Campaña
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-white transition-colors cursor-pointer rounded-sm hover:bg-[#1a1a1a]"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Justificación Estratégica de Inversión */}
        <div className="px-6 py-3.5 bg-[#0f0f0f] border-b border-[#222222] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-[#00FF85] shrink-0 mt-0.5" />
            <div className="text-[#aaaaaa] leading-relaxed">
              <strong className="text-white uppercase font-mono text-[11px] block sm:inline mr-1">¿Por qué esta inversión estratégica?</strong>
              Cuesta esta inversión por la <span className="text-white font-medium">información tan inmensa</span> que obtienes en territorio y la ventaja de coordinar <span className="text-white font-medium">socios y encuestadores que te ayudan a encuestar</span> en terreno con funciones casi ilimitadas.
            </div>
          </div>
          <span className="text-white font-bold text-[10px] uppercase tracking-wider bg-[#1c1c1c] border border-[#333333] px-2.5 py-1 rounded-xs shrink-0 font-mono">
            PAGO ÚNICO · 6 MESES
          </span>
        </div>

        {/* Informative Subtitle */}
        <div className="px-6 py-2.5 bg-[#0a0a0a] border-b border-[#1f1f1f] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#777777]">
          <span className="text-[#cccccc]">
            🔒 <strong className="text-white">PINES 100% PRIVADOS:</strong> Cada cuenta dispone de su plataforma privada y nadie puede ver los pines ajenos (salvo encuestadores con token oficial).
          </span>
          <span className="text-[#00FF85] font-bold text-[10px] uppercase tracking-wider">
            LICENCIA VÁLIDA POR 6 MESES
          </span>
        </div>

        {/* Plans Grid (3 Territorial Cards) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {CAMPAIGN_PLAN_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-sm bg-[#121212] p-6 flex flex-col justify-between transition-all relative ${
                tier.recomendado
                  ? 'border-2 border-white shadow-[0_0_25px_rgba(255,255,255,0.08)] bg-[#141414]'
                  : 'border border-[#262626] hover:border-[#555555]'
              }`}
            >
              {tier.recomendado && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs shadow-md">
                  MÁS ELEGIDO
                </div>
              )}

              <div>
                {/* Level Tag */}
                <div className="text-[10px] text-[#888888] uppercase tracking-wider mb-1">
                  [{tier.nivel}]
                </div>

                {/* Plan Title */}
                <h3 className="text-xl font-bold text-white font-sans mb-3">
                  {tier.nombre}
                </h3>

                {/* Price Display */}
                <div className="mb-4 pb-4 border-b border-[#222222]">
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {tier.precio}
                  </div>
                  <div className="text-[11px] text-[#00FF85] font-mono mt-0.5 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#00FF85]" />
                    <span>Duración: 6 meses de licencia</span>
                  </div>
                  <div className="text-[10px] text-[#777777] mt-0.5">
                    Tarifa completa para toda la campaña
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#999999] leading-relaxed mb-4 font-sans">
                  {tier.descripcion}
                </p>

                {/* Specifications List */}
                <div className="space-y-3 text-xs text-[#CCCCCC] pt-2">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Vigencia de 6 meses:</strong> Duración de la licencia para toda la campaña.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Hasta {tier.limiteEncuestadores} encuestadores</strong> permitidos en su perfil.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Hasta {tier.limitePines.toLocaleString('es-CO')} pines</strong> máximo guardados.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <BarChart3 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Beneficio:</strong> {tier.beneficioEstadisticas}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-[#888888]">
                    <Shield className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>Cartografía satelital + GPS de alta precisión nativo.</span>
                  </div>

                  {/* Aviso de Expiración y Respaldo por Correo */}
                  <div className="p-3 bg-[#111111] border border-[#333333] rounded-sm text-[11px] font-mono space-y-1 mt-3">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>AVISO DE VIGENCIA Y RESPALDO</span>
                    </div>
                    <p className="text-[#aaaaaa] leading-relaxed">
                      La licencia dura <strong className="text-white">6 meses</strong>. Antes de <strong className="text-amber-300">15 días</strong> de que se acabe la licencia, se le va a borrar toda la información por seguridad, pero se le enviará en <strong className="text-white">PDF y Excel</strong> al correo la última información guardada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-[#222222]">
                <button
                  onClick={() => onSelectPlan(tier)}
                  className={`w-full py-3 px-4 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tier.recomendado
                      ? 'bg-white hover:bg-[#e0e0e0] text-black shadow-md hover:shadow-lg'
                      : 'bg-[#1a1a1a] hover:bg-white text-white hover:text-black border border-[#333333] hover:border-white'
                  }`}
                >
                  <span>{tier.etiquetaBoton}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0d0d0d] border-t border-[#222222] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#777777]">
          <div className="flex items-center gap-1.5">
            <span>¿Ya tienes una cuenta activa?</span>
            <button
              onClick={() => {
                onClose();
                if (onOpenLogin) onOpenLogin();
              }}
              className="text-white hover:underline font-semibold cursor-pointer"
            >
              Inicia sesión aquí
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

