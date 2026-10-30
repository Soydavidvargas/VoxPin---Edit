import React from 'react';
import { ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { UserSession } from '../auth/AuthPage';

interface LandingNavbarProps {
  onOpenAuth: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onOpenWorkspace?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenAuth,
  currentUser,
  onLogout,
  onOpenWorkspace,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#2e2e2e] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Wordmark (Strictly Black & White) */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-white rounded-[1px] rotate-45 inline-block shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <span className="text-xl font-bold tracking-[-0.03em] text-white font-sans uppercase">
              Voxpin
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] text-[#8a8a8a] tracking-wider uppercase border-l border-[#2e2e2e] pl-3 py-0.5">
            // PLATAFORMA GEOESPACIAL
          </span>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            /* Logged-In User Actions */
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white font-semibold">{currentUser.name}</span>
                <span className="text-[#666] text-[10px] uppercase">({currentUser.provider})</span>
              </div>

              {onOpenWorkspace && (
                <button
                  onClick={onOpenWorkspace}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Plataforma</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3.6px] border border-[#333] hover:border-white text-[#888] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              )}
            </div>
          ) : (
            /* Botón "Conocer plataforma" -> Abre Login / Registro */
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-[13px] font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            >
              <span>Conocer plataforma</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

