/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageLoader } from './components/PageLoader';
import { ThreeBackground } from './components/ThreeBackground';
import { LandingNavbar } from './components/landing/LandingNavbar';
import { HeroSection } from './components/landing/HeroSection';
import { FlowSection } from './components/landing/FlowSection';
import { ModulesSection } from './components/landing/ModulesSection';
import { PlansSection } from './components/landing/PlansSection';
import { LandingFooter } from './components/landing/LandingFooter';
import { SkeletonProvider, useSkeleton } from './context/SkeletonContext';
import { AuthPage, UserSession } from './components/auth/AuthPage';
import { CheckCircle2 } from 'lucide-react';

function AppContent() {
  const [showLoader, setShowLoader] = useState(true);
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'workspace'>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { simulateLoading } = useSkeleton();

  const handleExploreClick = () => {
    const element = document.getElementById('flujo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoaderComplete = () => {
    setShowLoader(false);
    // Smooth 1.2s skeleton hydration right after initial starry deep space loader
    simulateLoading(1200);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    setCurrentView('workspace');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
    setToastMessage('Has cerrado sesión correctamente.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // If in Auth View
  if (currentView === 'auth') {
    return (
      <>
        <ThreeBackground />
        <AuthPage
          initialMode={authInitialMode}
          onBackToLanding={() => setCurrentView('landing')}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // After registration / login: pure white screen with black text "Hay que hacerlo funcional"
  if (currentView === 'workspace' && currentUser) {
    return (
      <div className="min-h-screen w-full bg-white text-black flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white relative">
        {/* Subtle navigation links */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between font-mono text-xs text-neutral-500">
          <button
            onClick={() => setCurrentView('landing')}
            className="hover:text-black underline cursor-pointer"
          >
            ← Volver al inicio
          </button>
          <div className="flex items-center gap-4">
            <span className="text-neutral-400">Usuario: {currentUser.name}</span>
            <button
              onClick={handleLogout}
              className="hover:text-black underline cursor-pointer font-bold"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Requested text: "Hay que hacerlo funcional" */}
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-black leading-tight">
            Hay que hacerlo funcional
          </h1>
        </div>
      </div>
    );
  }

  // Default: Landing Page View
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black flex flex-col antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121212] border border-white/30 text-white px-4 py-2.5 rounded-[3.6px] font-mono text-xs flex items-center gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cinematic Starry Deep Space Loading Screen */}
      {showLoader && (
        <PageLoader
          minDurationMs={2200}
          onLoaded={handleLoaderComplete}
        />
      )}
      
      {/* Three.js Interactive Dispersing Particle Background */}
      <ThreeBackground />

      {/* Sticky Header with Conocer Plataforma / Auth Action */}
      <LandingNavbar
        onOpenAuth={() => handleOpenAuth('login')}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenWorkspace={() => setCurrentView('workspace')}
      />

      {/* Main Landing Page Flow */}
      <main className="relative z-10 flex-1">
        {/* 1. Header HERO con PIN mostrando información */}
        <HeroSection onExploreClick={handleExploreClick} />

        {/* 2. El Flujo en una imagen */}
        <FlowSection />

        {/* 3. Carrusel Interactivo: Cómo funciona la plataforma (Paso a paso) */}
        <ModulesSection />

        {/* 4. Modelo de Negocio, Suscripciones & Verificación */}
        <PlansSection />
      </main>

      {/* Footer Final */}
      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SkeletonProvider>
      <AppContent />
    </SkeletonProvider>
  );
}

