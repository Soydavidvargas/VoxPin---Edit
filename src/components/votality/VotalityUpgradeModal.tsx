import React, { useState } from 'react';
import { X, Check, Users, MapPin, BarChart3, Sparkles, RefreshCw } from 'lucide-react';
import { UserSession } from '../auth/AuthPage';

interface VotalityUpgradeModalProps {
  onClose: () => void;
  currentUser?: UserSession | null;
  onSelectTier?: (tierId: string) => void;
}

interface UpgradePlanItem {
  id: string;
  nombre: string;
  nivel: string;
  precio: string;
  limiteEncuestadores: string;
  limitePines: string;
  beneficioEstadisticas: string;
  descripcion: string;
  botonTexto: string;
  recomendado?: boolean;
}

const UPGRADE_PLANS: UpgradePlanItem[] = [
  {
    id: 'comunal',
    nombre: 'Plan Campaña Comunal',
    nivel: 'Comunas, Corregimientos y JAL',
    precio: '$3.500.000 COP',
    limiteEncuestadores: 'Hasta 15 encuestadores en perfil',
    limitePines: 'Hasta 10.000 pines registrados',
    beneficioEstadisticas: 'Estadísticas completas de encuestas en tiempo real.',
    descripcion: 'Diseñado para liderazgos comunales, ediles y campañas en sectores barriales.',
    botonTexto: 'Elegir Plan Comunal',
    recomendado: false,
  },
  {
    id: 'municipal',
    nombre: 'Plan Campaña Municipal',
    nivel: 'Alcaldía y Concejo Municipal',
    precio: '$9.500.000 COP',
    limiteEncuestadores: 'Hasta 50 encuestadores en perfil',
    limitePines: 'Hasta 50.000 pines registrados',
    beneficioEstadisticas: 'Estadísticas avanzadas de encuestas en tiempo real.',
    descripcion: 'Cobertura integral para cabeceras municipales y equipos robustos.',
    botonTexto: 'Elegir Plan Municipal',
    recomendado: true,
  },
  {
    id: 'departamental',
    nombre: 'Plan Campaña Departamental',
    nivel: 'Gobernación y Asamblea',
    precio: '$18.000.000 COP',
    limiteEncuestadores: 'Hasta 200 encuestadores en perfil',
    limitePines: 'Hasta 250.000 pines registrados',
    beneficioEstadisticas: 'Estadísticas departamentales de encuestas en tiempo real.',
    descripcion: 'Infraestructura de alta capacidad para despliegue masivo regional.',
    botonTexto: 'Elegir Plan Departamental',
    recomendado: false,
  },
];

export const VotalityUpgradeModal: React.FC<VotalityUpgradeModalProps> = ({
  onClose,
  currentUser,
  onSelectTier,
}) => {
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);

  const handleSelectPlan = async (e: React.MouseEvent, planId: string) => {
    e.preventDefault();
    if (onSelectTier) {
      onSelectTier(planId);
      return;
    }

    const planCode = planId.toUpperCase();
    setUpgradingTier(planId);

    try {
      const email = currentUser?.email || 'willianstebangonzalezcortes@gmail.com';
      const res = await fetch('/api/v1/campana/upgrade/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          tipo_plan: planCode,
          token: currentUser?.token,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        // 1. Conservar pines y migrar sesión en localStorage
        const rawUser = localStorage.getItem('votality_user');
        const userObj: UserSession = rawUser ? JSON.parse(rawUser) : (currentUser || { name: 'Director Campaña', provider: 'email' });

        const planSpecs: Record<string, any> = {
          COMUNAL: {
            codigo: 'COMUNAL',
            nombre: 'Campaña Comunal',
            limite_encuestadores: 15,
            limite_pines: 10000,
          },
          MUNICIPAL: {
            codigo: 'MUNICIPAL',
            nombre: 'Campaña Municipal',
            limite_encuestadores: 50,
            limite_pines: 50000,
          },
          DEPARTAMENTAL: {
            codigo: 'DEPARTAMENTAL',
            nombre: 'Campaña Departamental',
            limite_encuestadores: 200,
            limite_pines: 250000,
          },
        };

        const updatedPlan = data.usuario?.plan || planSpecs[planCode] || planSpecs.COMUNAL;
        userObj.role = 'ADMIN_CAMPANA';
        userObj.planTier = planCode;
        userObj.plan = updatedPlan;
        userObj.campana_id = data.usuario?.campana_id || userObj.campana_id || `camp_${Date.now()}`;

        localStorage.setItem('votality_user', JSON.stringify(userObj));

        // 2. Restablecer invitaciones en espera para iniciar el nuevo equipo limpio
        localStorage.removeItem('votality_invitaciones_history_v2');

        // Recargar para aplicar los nuevos privilegios y aislamiento de campaña
        window.location.reload();
      } else {
        alert(data?.error || 'No se pudo completar el ascenso a campaña.');
      }
    } catch (err) {
      console.error('Error al ascender de plan:', err);
      // Fallback local
      const rawUser = localStorage.getItem('votality_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        u.role = 'ADMIN_CAMPANA';
        u.planTier = planCode;
        localStorage.setItem('votality_user', JSON.stringify(u));
        window.location.reload();
      }
    } finally {
      setUpgradingTier(null);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#0a0a0a] border border-[#2e2e2e] rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#222222] bg-[#0d0d0d] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-white rounded-[1px] rotate-45 inline-block shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <div>
              <div className="text-[10px] text-[#888888] tracking-widest uppercase mb-0.5">
                VOTALITY SIG // GESTIÓN DE SUSCRIPCIONES
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans tracking-tight">
                ACTUALIZAR SUSCRIPCIÓN TERRITORIAL
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

        {/* Informative Subtitle */}
        <div className="px-6 py-3 bg-[#111111] border-b border-[#1f1f1f] flex flex-wrap items-center justify-between gap-2 text-xs text-[#999999]">
          <span>
            Selecciona la cobertura adecuada para tu despliegue de campo.
          </span>
          <span className="text-white font-bold text-[11px] uppercase tracking-wider">
            [PAGO ÚNICO POR CAMPAÑA]
          </span>
        </div>

        {/* Plans Grid (3 Territorial Cards) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {UPGRADE_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-sm bg-[#121212] p-6 flex flex-col justify-between transition-all relative ${
                plan.recomendado
                  ? 'border-2 border-white shadow-[0_0_25px_rgba(255,255,255,0.08)] bg-[#141414]'
                  : 'border border-[#262626] hover:border-[#555555]'
              }`}
            >
              {plan.recomendado && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs shadow-md">
                  MÁS ELEGIDO
                </div>
              )}

              <div>
                {/* Level Tag */}
                <div className="text-[10px] text-[#888888] uppercase tracking-wider mb-1">
                  [{plan.nivel}]
                </div>

                {/* Plan Title */}
                <h3 className="text-xl font-bold text-white font-sans mb-3">
                  {plan.nombre}
                </h3>

                {/* Price Display */}
                <div className="mb-4 pb-4 border-b border-[#222222]">
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {plan.precio}
                  </div>
                  <div className="text-[11px] text-[#777777] mt-0.5">
                    Tarifa completa para toda la campaña
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#999999] leading-relaxed mb-6 font-sans">
                  {plan.descripcion}
                </p>

                {/* Specifications List */}
                <div className="space-y-3.5 text-xs text-[#CCCCCC] pt-2">
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>{plan.limiteEncuestadores}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>{plan.limitePines}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <BarChart3 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>{plan.beneficioEstadisticas}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>Enlaces de invitación únicos de un solo uso</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>Sin anuncios publicitarios</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={Boolean(upgradingTier)}
                onClick={(e) => handleSelectPlan(e, plan.id)}
                className={`mt-6 w-full py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  plan.recomendado
                    ? 'bg-white text-black hover:bg-[#e5e5e5] shadow-md'
                    : 'bg-[#181818] text-white hover:bg-white hover:text-black border border-[#333333] hover:border-white'
                } ${upgradingTier ? 'opacity-50' : ''}`}
              >
                {upgradingTier === plan.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Ascendiendo suscripción...</span>
                  </>
                ) : (
                  <>
                    <span>{plan.botonTexto}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1f1f1f] bg-[#0c0c0c] flex items-center justify-between text-xs text-[#777777]">
          <span>Los planes por campaña habilitan el aislamiento estricto de datos y cuotas territoriales.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xs border border-[#333333] hover:border-white text-white hover:bg-[#1a1a1a] transition-all cursor-pointer font-mono text-xs uppercase tracking-wider"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
