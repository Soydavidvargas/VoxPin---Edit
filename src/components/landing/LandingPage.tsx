import React, { useState } from 'react';
import { ThreeBackground } from '../ThreeBackground';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { FlowSection } from './FlowSection';
import { ModulesSection } from './ModulesSection';
import { PlansSection } from './PlansSection';
import { LandingFooter } from './LandingFooter';
import {
  CampaignPlansModal,
  CampaignPlanTier,
} from './CampaignPlansModal';
import { UserSession } from '../auth/AuthPage';

interface LandingPageProps {
  currentUser?: UserSession | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSelectBasicPlan: () => void;
  onSelectCampaignPlan: (plan: CampaignPlanTier) => void;
  onOpenWorkspace: () => void;
  onLogout: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenAuth,
  onSelectBasicPlan,
  onSelectCampaignPlan,
  onOpenWorkspace,
  onLogout,
}) => {
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const handleExploreClick = () => {
    const el =
      document.getElementById('seccion-planes') ||
      document.getElementById('pricing') ||
      document.getElementById('planes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChooseCampaignPlan = (plan: CampaignPlanTier) => {
    setIsCampaignModalOpen(false);
    onSelectCampaignPlan(plan);
  };

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
        <HeroSection onExploreClick={handleExploreClick} />

        {/* 2. Flujo Metodológico */}
        <FlowSection />

        {/* 3. Módulos / Cómo Funciona */}
        <ModulesSection />

        {/* 4. Planes y Suscripciones */}
        <PlansSection
          onSelectBasicPlan={onSelectBasicPlan}
          onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
          onOpenLogin={() => onOpenAuth('login')}
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
    </div>
  );
};

