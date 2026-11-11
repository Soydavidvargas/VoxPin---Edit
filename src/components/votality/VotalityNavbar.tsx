import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3,
  Search,
  User,
  LogOut,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Sparkles,
  Shield,
  Layers,
  ChevronDown,
  X,
  MapPin,
  Users,
  ExternalLink,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { AdminPlanTier, CensusSectorData, Interviewer, PLAN_CONFIGS, UserRole } from '../../types/votality';
import { GeoSuggestItem, getTerritorialSuggestions } from '../../data/colombiaTerritoryData';
import { VotalityInvitationsModal } from './VotalityInvitationsModal';
import { ModuloEntrevistadores } from './ModuloEntrevistadores';

interface VotalityNavbarProps {
  currentRole: UserRole;
  adminTier: AdminPlanTier;
  interviewers: Interviewer[];
  sectors: CensusSectorData[];
  selectedSector: CensusSectorData;
  onSelectSector: (sector: CensusSectorData) => void;
  onOpenFormEditor: () => void;
  onDeleteInterviewer: (id: string) => void;
  onRoleChange?: (role: UserRole) => void;
  onTierChange?: (tier: AdminPlanTier) => void;
  onOpenUpgradeModal: () => void;
  onLogout: () => void;
  onGeocodeSearch: (query: string) => void;
  onSelectSuggestion?: (item: GeoSuggestItem) => void;
  isGeocoding?: boolean;
  userName?: string;
  userEmail?: string;
  projectName?: string;
  externalSearchQuery?: string;
  onNavigateToJoin?: (token: string) => void;
}

export const VotalityNavbar: React.FC<VotalityNavbarProps> = ({
  currentRole,
  adminTier,
  interviewers,
  sectors,
  selectedSector,
  onSelectSector,
  onOpenFormEditor,
  onDeleteInterviewer,
  onRoleChange,
  onTierChange,
  onOpenUpgradeModal,
  onLogout,
  onGeocodeSearch,
  onSelectSuggestion,
  isGeocoding = false,
  userName = 'Administrador General',
  userEmail = 'direccion@votality.gov.co',
  projectName,
  externalSearchQuery,
  onNavigateToJoin,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoSuggestItem[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);

  // Sincronización bidireccional si la ubicación GPS o el pin arrastrado actualiza el texto superior
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentPlan = currentRole === 'free' ? PLAN_CONFIGS.free : PLAN_CONFIGS[adminTier];
  const activeInterviewersCount = interviewers.filter((i) => i.isActive).length;
  const isQuotaFull = currentRole === 'admin' && activeInterviewersCount >= currentPlan.maxInterviewers;

  // Close profile on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Google-style predictive territorial autocompletion with 280ms debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      let fetched: GeoSuggestItem[] = [];
      try {
        const res = await fetch(`/api/v1/geosearch/suggest/?q=${encodeURIComponent(q)}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          fetched = await res.json();
        }
      } catch {
        // Fallback local inmediato a PostGIS
      }

      if (!fetched || fetched.length === 0) {
        fetched = getTerritorialSuggestions(q, 5);
      }

      setSuggestions(fetched.slice(0, 5));
      setActiveSuggestionIndex(-1);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestItem = (item: GeoSuggestItem) => {
    setSearchQuery(item.label);
    setIsSearchFocused(false);
    setActiveSuggestionIndex(-1);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    } else {
      onGeocodeSearch(item.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < suggestions.length
      ) {
        handleSelectSuggestItem(suggestions[activeSuggestionIndex]);
      } else {
        setIsSearchFocused(false);
        onGeocodeSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const filteredSectors = sectors.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.municipality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="relative z-30 w-full bg-[#000000] border-b border-[#262626] text-[#FFFFFF] font-sans antialiased select-none">
      {/* Top Fixed Header with Project Name, User Name and Plan / Role Badge */}
      <div className="bg-[#111111] border-b border-[#222222] px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-white font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>VOTALITY</span>
          </div>

          <span className="text-[#444444] hidden sm:inline">|</span>

          {/* Etiqueta Fija: PROYECTO: [Nombre del Proyecto ingresado por el usuario] */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#888888] text-[11px] uppercase tracking-wider font-semibold">PROYECTO:</span>
            <span className="px-2 py-0.5 rounded-[2.6px] bg-[#1a1a1a] border border-[#333333] text-white font-bold tracking-wide">
              {projectName || 'Proyecto de Investigación'}
            </span>
          </div>

          <span className="text-[#444444] hidden sm:inline">|</span>

          {/* Nombre del Usuario logueado registrado en la base de datos */}
          <div className="flex items-center gap-1.5 text-[#aaaaaa]">
            <span className="text-[#666666] text-[11px] uppercase">USUARIO:</span>
            <span className="text-white font-semibold">{userName || 'Administrador'}</span>
          </div>
        </div>

        {/* Fixed Active Session Badge (100% Derived from user.plan / user.rol) */}
        <div className="flex items-center gap-2">
          {currentRole === 'free' ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2.6px] border border-[#444444] bg-[#000000] text-xs font-mono text-[#CCCCCC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#888888]"></span>
              <span className="font-bold tracking-wider uppercase text-white">Plan Básico (Free)</span>
            </div>
          ) : currentRole === 'encuestador' ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2.6px] border border-[#444444] bg-[#000000] text-xs font-mono text-[#CCCCCC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#888888]"></span>
              <span className="font-bold tracking-wider uppercase text-white">Encuestador de Campo</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2.6px] border border-white bg-[#000000] text-xs font-mono shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span className="font-bold tracking-wider uppercase text-white">
                {adminTier === 'municipal'
                  ? 'Campaña Municipal'
                  : adminTier === 'departamental'
                  ? 'Campaña Departamental'
                  : 'Campaña Comunal'}
              </span>
              <span className="text-[#666666] text-[10px] hidden sm:inline">
                [{currentPlan.maxInterviewers} encuestadores · {currentPlan.maxPins.toLocaleString()} pines]
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Button "Editar" */}
        <div className="flex items-center gap-3">
          <button
            id="btn-editar"
            onClick={onOpenFormEditor}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#000000] hover:bg-[#FFFFFF] hover:text-[#000000] border border-[#444444] hover:border-[#FFFFFF] text-xs font-mono uppercase tracking-wider font-semibold transition-all rounded-sm cursor-pointer shadow-sm active:scale-95"
            title={
              currentRole === 'encuestador'
                ? 'Editar datos del formulario de captura'
                : 'Configurar preguntas del formulario base'
            }
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
        </div>

        {/* Center: Search / Address Filter with Geocoding */}
        <div id="barra-filtro" ref={searchRef} className="relative flex-1 max-w-xl mx-2">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => onGeocodeSearch(searchQuery)}
              disabled={isGeocoding}
              className="absolute left-2.5 p-1 text-[#888888] hover:text-[#FFFFFF] cursor-pointer z-10 transition-colors"
              title="Geocodificar en Colombia (Enter)"
            >
              {isGeocoding ? (
                <Loader2 className="w-4 h-4 text-[#FFFFFF] animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Filtro territorial PostGIS: Municipio, Departamento o Dirección..."
              className="w-full bg-[#111111] hover:bg-[#161616] focus:bg-[#000000] text-[#FFFFFF] placeholder-[#666666] text-xs font-mono pl-9 pr-9 py-2 border border-[#333333] focus:border-[#FFFFFF] rounded-sm transition-all focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setActiveSuggestionIndex(-1);
                }}
                className="absolute right-2.5 text-[#777777] hover:text-[#FFFFFF] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocompletado Predictivo Tipo Google (Dropdown en Tiempo Real con Debounce) */}
          {isSearchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#000000] border border-[#333333] rounded-sm shadow-2xl overflow-hidden z-[2000]">
              <div className="p-2 border-b border-[#222222] flex justify-between items-center text-[10px] font-mono text-[#888888]">
                <span>SUGERENCIAS POSTGIS ({suggestions.length})</span>
                <span className="text-[#555555]">↑↓ Navegar • Enter Seleccionar • ESC Cerrar</span>
              </div>
              {suggestions.length > 0 ? (
                <ul id="geosearch-suggestions" role="listbox" className="max-h-64 overflow-y-auto divide-y divide-[#181818]">
                  {suggestions.map((item, idx) => {
                    const isHighlighted = idx === activeSuggestionIndex;
                    const typeLabel =
                      item.tipo === 'departamento'
                        ? '[DEPARTAMENTO]'
                        : item.tipo === 'municipio'
                        ? '[MUNICIPIO]'
                        : item.tipo === 'localidad'
                        ? '[LOCALIDAD]'
                        : item.tipo === 'comuna'
                        ? '[COMUNA]'
                        : item.tipo === 'barrio'
                        ? '[BARRIO]'
                        : '[DIRECCIÓN]';

                    return (
                      <li
                        key={`${item.tipo}-${item.id}-${idx}`}
                        role="option"
                        aria-selected={isHighlighted}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        onClick={() => handleSelectSuggestItem(item)}
                        className={`px-3 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isHighlighted
                            ? 'bg-[#FFFFFF] text-[#000000] font-semibold'
                            : 'hover:bg-[#161616] text-[#E0E0E0]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <MapPin
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isHighlighted ? 'text-[#000000]' : 'text-[#888888]'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span
                          className={`text-[9px] font-mono tracking-wider shrink-0 px-1.5 py-0.5 rounded-xs ${
                            isHighlighted
                              ? 'bg-[#000000] text-[#FFFFFF]'
                              : 'bg-[#141414] text-[#888888] border border-[#2a2a2a]'
                          }`}
                        >
                          {typeLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-3 text-center text-xs text-[#666666] font-mono">
                  No se encontraron sugerencias en Colombia. Presione Enter para buscar.
                </div>
              )}
            </div>
          )}

          {/* Autocomplete / Geocoding Suggestions para búsqueda vacía (< 2 caracteres) */}
          {isSearchFocused && searchQuery.trim().length < 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#000000] border border-[#333333] rounded-sm shadow-2xl overflow-hidden z-[2000]">
              <div className="p-2 border-b border-[#222222] flex justify-between items-center text-[10px] font-mono text-[#888888]">
                <span>UBICACIONES Y PUNTOS DISPONIBLES</span>
                <span className="text-[#555555]">ESC para cerrar</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-[#1a1a1a]">
                {filteredSectors.map((sector) => {
                  const isSelected = sector.id === selectedSector.id;
                  return (
                    <div
                      key={sector.id}
                      onClick={() => {
                        onSelectSector(sector);
                        setSearchQuery(sector.name);
                        setIsSearchFocused(false);
                      }}
                      className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#FFFFFF] text-[#000000]'
                          : 'hover:bg-[#1a1a1a] text-[#d4d4d4]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-[#000000]' : 'text-[#888888]'
                          }`}
                        />
                        <div>
                          <div className="font-bold">{sector.name}</div>
                          <div
                            className={`text-[10px] font-mono ${
                              isSelected ? 'text-[#333333]' : 'text-[#777777]'
                            }`}
                          >
                            {sector.municipality}, {sector.department} • Código: {sector.code}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border ${
                          isSelected
                            ? 'border-[#000000] bg-[#000000] text-[#FFFFFF]'
                            : 'border-[#333333] bg-[#111111] text-[#999999]'
                        }`}
                      >
                        Población: {sector.totalPopulation.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Profile Icon & Dropdown Modal */}
        <div ref={profileRef} className="relative">
          <button
            id="btn-perfil-trigger"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2 p-2 rounded-sm border transition-all cursor-pointer ${
              isProfileOpen
                ? 'bg-[#FFFFFF] text-[#000000] border-[#FFFFFF]'
                : 'bg-[#000000] text-[#FFFFFF] border-[#444444] hover:border-[#FFFFFF]'
            }`}
            title="Perfil de Usuario y Configuración"
          >
            <User className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Profile Modal / Dropdown */}
          {isProfileOpen && (
            <div
              id="modal-perfil"
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#000000] border border-[#FFFFFF] rounded-sm shadow-2xl p-4 text-xs font-sans z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header: Personal Info */}
              <div className="pb-3 border-b border-[#262626] flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                    Cuenta Autenticada
                  </div>
                  <div className="text-sm font-bold text-[#FFFFFF] mt-0.5">{userName}</div>
                  <div className="text-xs text-[#999999] font-mono mt-0.5">{userEmail}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 hover:bg-[#1a1a1a] text-[#888888] hover:text-[#FFFFFF] rounded-sm transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* ROLE SPECIFIC VIEW: ADMIN (Campaña Comunal, Municipal, Departamental) */}
              <div
                id="perfil-admin-section"
                style={{ display: currentRole === 'admin' ? 'block' : 'none' }}
                className="mt-3 space-y-3"
              >
                {/* Módulo Simplificado de Entrevistadores: Enlace en Espera y Lista Activa */}
                <ModuloEntrevistadores
                  tipoPlan={currentPlan.name}
                  limiteCupos={currentPlan.maxInterviewers}
                  onNavigateToJoin={onNavigateToJoin}
                />
              </div>

              {/* ROLE SPECIFIC VIEW: FREE PLAN */}
              <div
                id="perfil-free-section"
                style={{ display: currentRole === 'free' ? 'block' : 'none' }}
                className="mt-4 space-y-3"
              >
                <div className="p-3 bg-[#111111] border border-[#333333] rounded-sm">
                  <div className="text-[10px] font-mono uppercase text-[#888888] mb-1">
                    Estado de Suscripción
                  </div>
                  <div className="text-sm font-bold text-[#FFFFFF]">Plan Básico (Free)</div>
                  <div className="text-[11px] text-[#888888] mt-1 font-mono">
                    Límite estricto de 100 pines geográficos propios. Publicidad activa. Sin gestión de equipo de encuestadores.
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenUpgradeModal();
                  }}
                  className="w-full py-2.5 px-3 bg-[#FFFFFF] text-[#000000] hover:bg-[#e5e5e5] text-xs font-mono uppercase tracking-wider font-bold transition-all rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mejorar a Plan Campaña</span>
                </button>
              </div>

              {/* ROLE SPECIFIC VIEW: ENCUESTADOR */}
              <div
                id="perfil-encuestador-section"
                style={{ display: currentRole === 'encuestador' ? 'block' : 'none' }}
                className="mt-4 space-y-3"
              >
                <div className="p-3 bg-[#111111] border border-[#262626] rounded-sm">
                  <div className="text-[10px] font-mono uppercase text-[#888888] mb-1">
                    Rol Asignado
                  </div>
                  <div className="text-sm font-bold text-[#FFFFFF]">Entrevistador / Encuestador</div>
                  <div className="text-[11px] text-[#888888] mt-1 font-mono">
                    Modo solo lectura para configuraciones. Acceso para registro en terreno de encuestas inmutables.
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full py-2 px-3 bg-[#000000] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#444444] hover:border-[#FFFFFF] text-xs font-mono uppercase tracking-wider transition-all rounded-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Historial y Generación de Enlaces de Invitación de Un Solo Uso */}
      <VotalityInvitationsModal
        isOpen={isInvitationsModalOpen}
        onClose={() => setIsInvitationsModalOpen(false)}
        adminTier={adminTier}
        activeInterviewersCount={activeInterviewersCount}
        maxInterviewers={currentPlan.maxInterviewers}
        onNavigateToJoin={onNavigateToJoin}
      />
    </header>
  );
};

