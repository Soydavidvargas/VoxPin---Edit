import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  MapPin,
  X,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { ThreeBackground } from '../ThreeBackground';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { LandingVideoCarousel } from './LandingVideoCarousel';
import { FlowSection } from './FlowSection';
import { PlansSection } from './PlansSection';
import { LandingFooter } from './LandingFooter';
import {
  CampaignPlansModal,
  CampaignPlanTier,
} from './CampaignPlansModal';
import { LandingInterviewerModal } from './LandingInterviewerModal';
import { UserSession } from '../auth/AuthPage';
import { updateUserPlanInStore } from '../../utils/userStore';

interface LandingPageProps {
  currentUser?: UserSession | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSelectBasicPlan: () => void;
  onSelectCampaignPlan: (plan: CampaignPlanTier) => void;
  onSelectPremiumPlan?: () => void;
  onOpenWorkspace: () => void;
  onLogout: () => void;
  onInterviewerJoined?: (encuestador: {
    id: string;
    name: string;
    username: string;
    sessionToken: string;
    role: string;
    projectName?: string;
    campaignName?: string;
    director?: string;
  }) => void;
}

interface PendingPlanChange {
  type: 'campaign' | 'premium';
  plan?: CampaignPlanTier;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenAuth,
  onSelectBasicPlan,
  onSelectCampaignPlan,
  onSelectPremiumPlan,
  onOpenWorkspace,
  onLogout,
  onInterviewerJoined,
}) => {
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isInterviewerModalOpen, setIsInterviewerModalOpen] = useState(false);

  // Detección estricta de plan de pago activo en la cuenta actual
  const currentPlanCode = (currentUser?.plan?.codigo || currentUser?.planTier || '').toUpperCase();
  const currentRoleCode = (currentUser?.role || '').toUpperCase();
  const hasActivePaidPlan = Boolean(
    currentUser &&
      currentPlanCode &&
      currentPlanCode !== 'FREE' &&
      currentRoleCode !== 'USUARIO_FREE' &&
      currentRoleCode !== 'ENCUESTADOR'
  );

  // Estado del modal de confirmación con debilitación de 5 segundos
  const [pendingPlanChange, setPendingPlanChange] = useState<PendingPlanChange | null>(null);
  const [confirmCountdown, setConfirmCountdown] = useState<number>(5);

  // Temporizador de 5 segundos con debilitación de botón activo
  useEffect(() => {
    let timer: any = null;
    if (pendingPlanChange) {
      setConfirmCountdown(5);
      timer = setInterval(() => {
        setConfirmCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pendingPlanChange]);

  const handleExploreClick = () => {
    const el =
      document.getElementById('seccion-planes') ||
      document.getElementById('pricing') ||
      document.getElementById('planes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Selección de Plan por Campaña
  const handleChooseCampaignPlan = (plan: CampaignPlanTier) => {
    setIsCampaignModalOpen(false);
    if (hasActivePaidPlan && currentPlanCode !== plan.codigo.toUpperCase()) {
      setPendingPlanChange({ type: 'campaign', plan });
    } else {
      onSelectCampaignPlan(plan);
    }
  };

  // Selección de Plan Premium
  const handleChoosePremiumPlan = () => {
    if (hasActivePaidPlan && currentPlanCode !== 'PREMIUM') {
      setPendingPlanChange({ type: 'premium' });
    } else {
      if (onSelectPremiumPlan) {
        onSelectPremiumPlan();
      } else {
        window.location.href = '/pago?plan=premium&rol=director_campana';
      }
    }
  };

  // Confirmación del cambio de plan (tras esperar los 5 segundos reglamentarios)
  const handleConfirmPlanChange = () => {
    if (!pendingPlanChange) return;

    // Cancelar el plan actual para esta cuenta específica
    if (currentUser?.email) {
      const cleanEmail = currentUser.email.trim().toLowerCase();
      try {
        localStorage.removeItem(`votality_user_plan_${cleanEmail}`);
        localStorage.removeItem('votality_user_plan');
        localStorage.removeItem('votality_premium_paid');
      } catch (e) {
        console.error(e);
      }
    }

    const targetChange = pendingPlanChange;
    setPendingPlanChange(null);

    // Proceder al método de pago de la nueva licencia
    if (targetChange.type === 'campaign' && targetChange.plan) {
      onSelectCampaignPlan(targetChange.plan);
    } else if (targetChange.type === 'premium') {
      if (onSelectPremiumPlan) {
        onSelectPremiumPlan();
      } else {
        window.location.href = '/pago?plan=premium&rol=director_campana';
      }
    }
  };

  // Nombre legible del plan actual
  const currentPlanName =
    currentPlanCode === 'PREMIUM'
      ? 'Plan Premium (Profesional)'
      : currentPlanCode === 'MUNICIPAL'
      ? 'Plan Campaña Municipal'
      : currentPlanCode === 'DEPARTAMENTAL'
      ? 'Plan Campaña Departamental'
      : currentPlanCode === 'COMUNAL'
      ? 'Plan Campaña Comunal'
      : currentPlanCode === 'FREE'
      ? 'Plan Básico (Free)'
      : currentPlanCode;

  // Nombre del nuevo plan a comprar
  const newPlanName =
    pendingPlanChange?.type === 'premium'
      ? 'Plan Premium ($350.000 COP / mes)'
      : pendingPlanChange?.plan?.nombre
      ? `${pendingPlanChange.plan.nombre} (${pendingPlanChange.plan.precio})`
      : 'Nueva Licencia';

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black flex flex-col antialiased">
      {/* Three.js Interactive Particle Background */}
      <ThreeBackground />

      {/* Landing Sticky Navbar */}
      <LandingNavbar
        onOpenAuth={() => onOpenAuth('login')}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenWorkspace={onOpenWorkspace}
      />

      {/* Main Sections */}
      <main className="relative z-10 flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          onExploreClick={handleExploreClick}
          onOpenInterviewerModal={() => setIsInterviewerModalOpen(true)}
        />

        {/* 1.5 Carrusel Automático de Videos Oficiales + Advertencia Versión BETA */}
        <LandingVideoCarousel />

        {/* 2. Flujo Metodológico */}
        <FlowSection />

        {/* 3. Planes y Suscripciones */}
        <PlansSection
          onSelectBasicPlan={onSelectBasicPlan}
          onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
          onOpenLogin={() => onOpenAuth('login')}
          onSelectPremiumPlan={handleChoosePremiumPlan}
        />
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <LandingFooter />
      </div>

      {/* Modal Territorial de Planes por Campaña */}
      <CampaignPlansModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSelectPlan={handleChooseCampaignPlan}
        onOpenLogin={() => onOpenAuth('login')}
      />

      {/* Modal de Acceso para Encuestadores con Token Único */}
      <LandingInterviewerModal
        isOpen={isInterviewerModalOpen}
        onClose={() => setIsInterviewerModalOpen(false)}
        onJoined={(encuestador) => {
          setIsInterviewerModalOpen(false);
          if (onInterviewerJoined) {
            onInterviewerJoined(encuestador);
          } else {
            onOpenWorkspace();
          }
        }}
      />

      {/* Botón Flotante para regresar a la Mesa de Trabajo (Visible en todas las cuentas autenticadas) */}
      {currentUser && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={onOpenWorkspace}
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-white text-black font-mono text-xs uppercase tracking-wider font-bold shadow-[0_4px_30px_rgba(255,255,255,0.4)] hover:bg-[#e5e5e5] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-black group"
            title="Volver a mi mesa de trabajo / mapa"
          >
            <MapPin className="w-4 h-4 text-[#00FF85] group-hover:scale-110 transition-transform" />
            <span>Volver a mi Mesa de Trabajo</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Modal de Advertencia "¿Está Seguro?" con debilitación de 5 segundos para cambio de plan */}
      {pendingPlanChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-mono animate-in fade-in duration-150">
          <div className="bg-[#0c0c0c] border-2 border-red-500 w-full max-w-lg rounded-sm shadow-[0_0_60px_rgba(239,68,68,0.35)] p-6 space-y-5">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2 font-bold text-red-500">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="text-sm uppercase tracking-wider">ADVERTENCIA // ¿ESTÁ SEGURO?</span>
              </div>
              <button
                onClick={() => setPendingPlanChange(null)}
                className="p-1 rounded-sm text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                title="Cerrar y mantener plan actual"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Mensaje */}
            <div className="space-y-3 text-xs">
              <p className="text-white font-bold text-sm">
                Actualmente posees una licencia activa en tu cuenta.
              </p>

              <div className="p-3.5 bg-[#140b0b] border border-red-500/40 rounded-sm space-y-2 text-[#cccccc] leading-relaxed">
                <div className="flex items-center justify-between pb-2 border-b border-[#291414]">
                  <span className="text-[10px] text-[#888888] uppercase">Plan Activo Actual:</span>
                  <span className="text-white font-bold">{currentPlanName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#291414]">
                  <span className="text-[10px] text-[#D4AF37] uppercase font-bold">Nueva Licencia Seleccionada:</span>
                  <span className="text-[#D4AF37] font-bold">{newPlanName}</span>
                </div>
                <div className="text-[11px] text-[#e0e0e0] pt-1">
                  Al confirmar el cambio, <strong className="text-red-400">tu plan actual se cancelará</strong> y serás transferido a los métodos de pago para adquirir tu nueva licencia. Una vez completado el pago, tu cuenta dispondrá de inmediato de las nuevas funciones y límites.
                </div>
              </div>
            </div>

            {/* Acciones y Botón con Debilitación de 5 Segundos */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setPendingPlanChange(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-sm bg-[#181818] hover:bg-[#252525] text-[#aaaaaa] hover:text-white text-xs font-mono uppercase cursor-pointer transition-colors"
              >
                Mantener mi Plan Actual
              </button>

              <button
                type="button"
                onClick={handleConfirmPlanChange}
                disabled={confirmCountdown > 0}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 ${
                  confirmCountdown > 0
                    ? 'bg-[#1c1c1c] text-[#666666] border border-[#2a2a2a] cursor-not-allowed opacity-60'
                    : 'bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                }`}
              >
                {confirmCountdown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin text-[#888888]" />
                    <span>Espere {confirmCountdown}s para habilitar...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    <span>Sí, Estoy Seguro · Cancelar y Comprar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
