/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingNavbar } from './components/landing/LandingNavbar';
import { HeroSection } from './components/landing/HeroSection';
import { FlowSection } from './components/landing/FlowSection';
import { ModulesSection } from './components/landing/ModulesSection';
import { DashboardShowcaseSection } from './components/landing/DashboardShowcaseSection';
import { PlansSection } from './components/landing/PlansSection';
import { ArchitectureSection } from './components/landing/ArchitectureSection';
import { LandingFooter } from './components/landing/LandingFooter';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Monochrome field terminal initialization sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 250);
          return 100;
        }
        return prev + 25;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleExploreClick = () => {
    const element = document.getElementById('flujo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 p-4 font-mono text-white">
        <div className="relative flex flex-col items-center max-w-xs w-full text-center space-y-5">
          
          {/* Monochromatic Marker */}
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-[3.6px] bg-[#141414] border-2 border-white flex items-center justify-center">
              <span className="w-3 h-3 bg-white rounded-[1px] animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-[3.6px] border border-white/20 animate-ping pointer-events-none" />
          </div>

          <div>
            <h1 className="text-xl font-normal font-sans tracking-[-0.03em] text-white uppercase">
              Voxpin
            </h1>
            <p className="text-[11px] text-[#8a8a8a] uppercase tracking-wider mt-1">
              [INICIALIZANDO MOTOR GEO // POSTGIS]
            </p>
          </div>

          {/* Progress bar in Pure White */}
          <div className="w-full bg-[#141414] h-1.5 rounded-[1px] overflow-hidden border border-[#2e2e2e]">
            <div 
              className="h-full bg-white transition-all duration-200"
              style={{ width: `${loadProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full text-[10px] text-[#8a8a8a]">
            <span>STATUS: SATELLITE</span>
            <span className="text-white font-bold">{loadProgress}%</span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black flex flex-col antialiased">
      
      {/* Sticky Header */}
      <LandingNavbar />

      {/* Main Landing Page Flow */}
      <main className="flex-1">
        {/* 1. Header HERO con PIN mostrando información */}
        <HeroSection onExploreClick={handleExploreClick} />

        {/* 2. El Flujo en una imagen */}
        <FlowSection />

        {/* 3. Los 4 Módulos de la plataforma */}
        <ModulesSection />

        {/* 4. Dashboard & Estadísticas en tiempo real */}
        <DashboardShowcaseSection />

        {/* 5. Modelo de Negocio, Suscripciones & Verificación */}
        <PlansSection />

        {/* 6. Arquitectura Técnica PostgreSQL + PostGIS */}
        <ArchitectureSection />
      </main>

      {/* Footer Final */}
      <LandingFooter />

    </div>
  );
}
