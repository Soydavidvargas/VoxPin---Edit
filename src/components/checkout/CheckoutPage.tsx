import React from 'react';
import { ArrowLeft, ShieldCheck, ArrowRight, CreditCard, Lock, Sparkles } from 'lucide-react';
import { CampaignPlanTier, CAMPAIGN_PLAN_TIERS } from '../landing/CampaignPlansModal';
import { UserSession } from '../auth/AuthPage';

interface CheckoutPageProps {
  user?: UserSession | null;
  selectedPlan?: CampaignPlanTier | null;
  onContinueToWorkspace: () => void;
  onBackToLanding: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  user,
  selectedPlan,
  onContinueToWorkspace,
  onBackToLanding,
}) => {
  const activePlan =
    selectedPlan ||
    CAMPAIGN_PLAN_TIERS.find(
      (p) =>
        p.codigo.toLowerCase() === (user?.planTier || '').toLowerCase() ||
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('plan')?.toLowerCase() ===
            p.codigo.toLowerCase())
    );

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="relative z-20 border-b border-[#1f1f1f] bg-[#0c0c0c]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLanding}
              className="p-1.5 rounded-[3.6px] border border-[#262626] hover:border-white text-[#888888] hover:text-white transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-widest font-bold text-white">VOTALITY</span>
              <span className="text-[#333]">/</span>
              <span className="font-mono text-xs text-[#888] uppercase tracking-wider">PAGO // INTEGRACIÓN EXTERNA</span>
            </div>
          </div>

          {user ? (
            <button
              onClick={onContinueToWorkspace}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[3.6px] bg-[#1a1a1a] hover:bg-white hover:text-black border border-[#333] hover:border-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Ir al Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onContinueToWorkspace}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[3.6px] bg-white text-black hover:bg-[#e0e0e0] font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <span>Crear Cuenta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-3xl w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-[#121212] border border-[#262626] rounded-[3.6px] p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Status Header */}
          <div className="border-b border-[#222222] pb-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8a8a8a] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>REGISTRO DE CAMPAÑA COMPLETADO // PANTALLA TEMPORAL DE PAGO</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white">
              Pasarela de Pago Externa
            </h1>
            <p className="text-xs font-mono text-[#888888] leading-relaxed">
              Tu cuenta ha sido creada exitosamente{user?.name ? `, ${user.name}` : ''}. Esta vista está reservada en blanco para la integración de la pasarela de transacciones externa (Wompi, PayU, Stripe, PSE). Al continuar entrarás a tu panel definitivo de campaña.
            </p>
          </div>

          {/* Plan Summary */}
          {activePlan && (
            <div className="p-4 rounded-[3.6px] bg-[#161616] border border-[#333333] font-mono text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <span className="text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  Plan Seleccionado:
                </span>
                <span className="text-white font-bold text-sm">{activePlan.precio}</span>
              </div>
              <div className="text-white font-sans font-bold text-base">{activePlan.nombre}</div>
              <div className="text-[#888888] text-[11px]">
                Nivel Territorial: <span className="text-white font-bold">{activePlan.nivel}</span> · Hasta {activePlan.limiteEncuestadores} encuestadores · {activePlan.limitePines.toLocaleString('es-CO')} pines máx.
              </div>
            </div>
          )}

          {/* Blank Reserved Integration Area */}
          <div className="border border-dashed border-[#333333] rounded-[3.6px] p-10 text-center bg-[#0d0d0d] space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-[#888]">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Módulo de Checkout Externo
              </h3>
              <p className="font-mono text-[11px] text-[#666666] max-w-md mx-auto">
                Espacio en blanco reservado para el iframe o redirección de cobro. No se ejecutan cobros ni transacciones en esta vista.
              </p>
            </div>
          </div>

          {/* Action Button to Workspace / Register */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-[#666666]">
              {user
                ? 'Puedes acceder directamente al panel para explorar el sistema:'
                : 'Continúa al registro para activar tu cuenta de Director de Campaña:'}
            </span>
            <button
              onClick={onContinueToWorkspace}
              className="w-full sm:w-auto px-6 py-3 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{user ? 'Acceder al Panel SIG' : 'Registrar Cuenta de Campaña'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-20 border-t border-[#1f1f1f] py-4 px-6 text-center font-mono text-[11px] text-[#555] flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#888]" />
          <span>ENTORNO SEGURO // INTEGRACIÓN PASARELA DE PAGO</span>
        </div>
        <span>VOTALITY &copy; 2026</span>
      </footer>
    </div>
  );
};

