import React from 'react';
import { 
  MapPin, 
  BarChart3, 
  SlidersHorizontal, 
  CreditCard, 
  Smartphone, 
  Database, 
  Plus, 
  Radio
} from 'lucide-react';
import { PlanType } from '../types/voxpin';

interface HeaderProps {
  activeTab: 'mapa' | 'encuestas' | 'dashboard' | 'planes' | 'arquitectura';
  setActiveTab: (tab: 'mapa' | 'encuestas' | 'dashboard' | 'planes' | 'arquitectura') => void;
  openNewPinModal: () => void;
  toggleMobileMode: () => void;
  isMobileModeOpen: boolean;
  currentPlan: PlanType;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openNewPinModal,
  toggleMobileMode,
  isMobileModeOpen,
  currentPlan,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0e1012] border-b border-[#1c1f24] backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('mapa')}>
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#007afc] to-[#0052ad] flex items-center justify-center shadow-lg shadow-[#007afc]/20 border border-[#007afc]/40">
              <MapPin className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00d2b5] animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00d2b5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Vox<span className="text-[#007afc]">pin</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-[#228a56]/20 text-[#228a56] border border-[#228a56]/40">
                  SaaS GEO
                </span>
              </div>
              <span className="text-[11px] text-[#8b96aa] hidden md:block">
                Encuestas geolocalizadas en tiempo real
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Modules) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#15171b] p-1 rounded-full border border-[#1c1f24]">
          <button
            onClick={() => setActiveTab('mapa')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'mapa'
                ? 'bg-[#007afc] text-white shadow-md'
                : 'text-[#a0aaba] hover:text-white hover:bg-[#1c1f24]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Módulo 1: Mapa & Geos</span>
          </button>

          <button
            onClick={() => setActiveTab('encuestas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'encuestas'
                ? 'bg-[#007afc] text-white shadow-md'
                : 'text-[#a0aaba] hover:text-white hover:bg-[#1c1f24]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Módulo 2: Encuestas</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#007afc] text-white shadow-md'
                : 'text-[#a0aaba] hover:text-white hover:bg-[#1c1f24]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Módulo 3: Análisis</span>
          </button>

          <button
            onClick={() => setActiveTab('planes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'planes'
                ? 'bg-[#007afc] text-white shadow-md'
                : 'text-[#a0aaba] hover:text-white hover:bg-[#1c1f24]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Módulo 4: Planes</span>
          </button>

          <button
            onClick={() => setActiveTab('arquitectura')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'arquitectura'
                ? 'bg-[#23262d] text-white border border-[#333943]'
                : 'text-[#8b96aa] hover:text-white'
            }`}
            title="Arquitectura Técnica PostGIS & Roles"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Arquitectura</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Active Plan Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#15171b] border border-[#1c1f24] text-[11px] text-[#bbc2ce]">
            <Radio className="w-3 h-3 text-[#228a56]" />
            <span className="capitalize">{currentPlan === 'campana' ? 'Modo Campaña' : `Plan ${currentPlan}`}</span>
          </div>

          {/* Toggle Mobile Surveyor Mode Drawer */}
          <button
            onClick={toggleMobileMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isMobileModeOpen
                ? 'bg-[#0062ca] text-white border-[#007afc]'
                : 'bg-[#15171b] text-[#bbc2ce] border-[#1c1f24] hover:border-[#333943] hover:text-white'
            }`}
            title="Abrir simulador de App Móvil para Encuestador en Campo"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#007afc]" />
            <span className="hidden sm:inline">App Móvil</span>
            <span className="w-2 h-2 rounded-full bg-[#228a56] animate-pulse" />
          </button>

          {/* New Respondent Pin Button */}
          <button
            onClick={openNewPinModal}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#007afc] text-white text-xs font-medium shadow-md shadow-[#007afc]/20 hover:bg-[#0062ca] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Pin</span>
          </button>
        </div>

      </div>

      {/* Mobile Nav Scroller for smaller viewports */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-t border-[#1c1f24] overflow-x-auto text-xs bg-[#0e1012]">
        <button
          onClick={() => setActiveTab('mapa')}
          className={`whitespace-nowrap px-3 py-1 rounded-full font-medium ${
            activeTab === 'mapa' ? 'bg-[#007afc] text-white' : 'text-[#a0aaba]'
          }`}
        >
          M1: Mapa
        </button>
        <button
          onClick={() => setActiveTab('encuestas')}
          className={`whitespace-nowrap px-3 py-1 rounded-full font-medium ${
            activeTab === 'encuestas' ? 'bg-[#007afc] text-white' : 'text-[#a0aaba]'
          }`}
        >
          M2: Encuestas
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`whitespace-nowrap px-3 py-1 rounded-full font-medium ${
            activeTab === 'dashboard' ? 'bg-[#007afc] text-white' : 'text-[#a0aaba]'
          }`}
        >
          M3: Análisis
        </button>
        <button
          onClick={() => setActiveTab('planes')}
          className={`whitespace-nowrap px-3 py-1 rounded-full font-medium ${
            activeTab === 'planes' ? 'bg-[#007afc] text-white' : 'text-[#a0aaba]'
          }`}
        >
          M4: Planes
        </button>
        <button
          onClick={() => setActiveTab('arquitectura')}
          className={`whitespace-nowrap px-3 py-1 rounded-full font-medium ${
            activeTab === 'arquitectura' ? 'bg-[#23262d] text-white' : 'text-[#8b96aa]'
          }`}
        >
          Arquitectura
        </button>
      </div>
    </header>
  );
};
