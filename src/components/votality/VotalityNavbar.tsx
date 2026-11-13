import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  PlayCircle,
  Compass,
  Building,
  ArrowRight,
  Filter,
  Calendar,
  Clock,
  Crown,
} from 'lucide-react';
import { AdminPlanTier, CensusSectorData, Interviewer, PLAN_CONFIGS, UserRole, SurveyRecord } from '../../types/votality';
import { GeoSuggestItem, getTerritorialSuggestions } from '../../data/colombiaTerritoryData';
import { VotalityInvitationsModal } from './VotalityInvitationsModal';
import { ModuloEntrevistadores } from './ModuloEntrevistadores';
import { UserSession } from '../auth/AuthPage';

export interface VotalityFilterSelection {
  type: 'departamento' | 'municipio' | 'encuestador';
  value: string;
  label: string;
}

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
  onNavigateToLanding?: () => void;
  currentUser?: UserSession | null;
  onOpenTutorial?: () => void;
  pins?: SurveyRecord[];
  activeFilter?: VotalityFilterSelection | null;
  onApplyFilter?: (filter: VotalityFilterSelection | null) => void;
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
  onNavigateToLanding,
  currentUser,
  onOpenTutorial,
  pins = [],
  activeFilter = null,
  onApplyFilter,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterTab, setFilterTab] = useState<'todos' | 'departamentos' | 'municipios' | 'encuestadores'>('todos');
  const [suggestions, setSuggestions] = useState<GeoSuggestItem[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);

  // Sincronización con el filtro activo seleccionado
  useEffect(() => {
    if (activeFilter) {
      setSearchQuery(activeFilter.label);
    } else if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [activeFilter, externalSearchQuery]);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentPlan = currentRole === 'free' ? PLAN_CONFIGS.free : PLAN_CONFIGS[adminTier];
  const activeInterviewersCount = interviewers.filter((i) => i.isActive).length;
  const isQuotaFull = currentRole === 'admin' && activeInterviewersCount >= currentPlan.maxInterviewers;

  // Determinar rol efectivo
  const isEncuestador =
    currentRole === 'encuestador' ||
    currentUser?.role?.toUpperCase() === 'ENCUESTADOR';

  const isFree = currentRole === 'free' && !isEncuestador;
  const isAdmin = !isEncuestador && !isFree;

  // Determinar la licencia adquirida / plan según la suscripción con la que inició
  const effectiveTier = adminTier || 'comunal';

  const licenseData = isEncuestador
    ? {
        title: 'Plan Básico',
        price: 'Token de Equipo',
        scope: 'Operador de Campo / Terreno',
        description: 'Acceso autorizado mediante enlace de invitación para recolección en terreno.',
        vigencia: '6 Meses (Duración de la campaña)',
        interviewersLimit: '1 operador de campo',
        pinsLimit: 'Ilimitados según campaña',
        benefit: 'Sincronización satelital en tiempo real con la campaña asignada.',
        badge: 'BÁSICO',
        isCampaign: false,
      }
    : isFree
    ? {
        title: 'Plan Básico (Free)',
        price: '$0 COP (Jamás Pagas)',
        scope: 'Evaluación y Uso Individual',
        description: 'Límite estricto de 100 pines propios. Sin gestión de equipo de encuestadores.',
        vigencia: 'Tiempo Ilimitado (Para siempre)',
        interviewersLimit: '0 encuestadores',
        pinsLimit: '100 pines propios',
        benefit: 'Estadísticas básicas con limitación de métricas avanzadas.',
        badge: 'GRATUITO',
        isCampaign: false,
      }
    : effectiveTier === 'premium'
    ? {
        title: 'Plan Premium',
        price: '$350.000 COP (Mensual)',
        scope: 'Eventos, Grupos y Profesionales',
        description: 'Suscripción mensual flexible: hasta 30 encuestadores y 1.000 pines. Resguardo temporal de 3 meses si no renuevas, con envío previo de respaldo en PDF y Excel.',
        vigencia: 'Mensual (3 Meses de resguardo post-vencimiento)',
        interviewersLimit: 'Hasta 30 encuestadores',
        pinsLimit: '1.000 pines propios',
        benefit: 'Estadísticas completas con descarga en Excel y PDF.',
        badge: 'PREMIUM',
        isCampaign: false,
      }
    : effectiveTier === 'municipal'
    ? {
        title: 'Plan Campaña Municipal',
        price: '$9.500.000 COP',
        scope: 'Alcaldía y Concejo Municipal',
        description: 'Cobertura integral para cabeceras municipales, ciudades intermedias y equipos robustos.',
        vigencia: '6 Meses',
        interviewersLimit: 'Hasta 50 encuestadores',
        pinsLimit: '50.000 pines máximo',
        benefit: 'Estadísticas avanzadas de sus encuestas en tiempo real.',
        badge: 'MÁS ELEGIDO',
        isCampaign: true,
      }
    : effectiveTier === 'departamental'
    ? {
        title: 'Plan Campaña Departamental',
        price: '$18.000.000 COP',
        scope: 'Gobernación y Asamblea',
        description: 'Infraestructura de alta capacidad para múltiples municipios y despliegue masivo simultáneo.',
        vigencia: '6 Meses',
        interviewersLimit: 'Hasta 200 encuestadores',
        pinsLimit: '250.000 pines máximo',
        benefit: 'Estadísticas departamentales de sus encuestas en tiempo real.',
        badge: 'DEPARTAMENTAL',
        isCampaign: true,
      }
    : {
        title: 'Plan Campaña Comunal',
        price: '$3.500.000 COP',
        scope: 'Comunas, Corregimientos y JAL',
        description: 'Diseñado para liderazgos locales, ediles y campañas en comunas o sectores barriales.',
        vigencia: '6 Meses',
        interviewersLimit: 'Hasta 15 encuestadores',
        pinsLimit: '10.000 pines máximo',
        benefit: 'Estadísticas completas de sus encuestas en tiempo real.',
        badge: 'COMUNAL',
        isCampaign: true,
      };

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

  // 1. Departamentos que fueron encuestados
  const surveyedDepartamentos = useMemo(() => {
    if (!pins || pins.length === 0) return [];
    const map = new Map<string, { name: string; count: number; municipios: Set<string> }>();

    pins.forEach((p) => {
      const dep = (p.departamento || (p.answers?.departamento as string) || '').trim();
      if (!dep) return;
      const mun = (p.municipio || (p.answers?.municipio as string) || '').trim();
      const existing = map.get(dep) || { name: dep, count: 0, municipios: new Set<string>() };
      existing.count += 1;
      if (mun) existing.municipios.add(mun);
      map.set(dep, existing);
    });

    return Array.from(map.values())
      .map((d) => ({
        name: d.name,
        count: d.count,
        municipiosCount: d.municipios.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [pins]);

  // 2. Municipios que fueron encuestados
  const surveyedMunicipios = useMemo(() => {
    if (!pins || pins.length === 0) return [];
    const map = new Map<string, { name: string; departamento: string; count: number; barrios: Set<string> }>();

    pins.forEach((p) => {
      const mun = (p.municipio || (p.answers?.municipio as string) || '').trim();
      if (!mun) return;
      const dep = (p.departamento || (p.answers?.departamento as string) || '').trim();
      const barrio = (p.barrio || (p.answers?.barrio as string) || '').trim();
      const key = `${mun.toLowerCase()}__${dep.toLowerCase()}`;
      const existing = map.get(key) || { name: mun, departamento: dep, count: 0, barrios: new Set<string>() };
      existing.count += 1;
      if (barrio) existing.barrios.add(barrio);
      map.set(key, existing);
    });

    return Array.from(map.values())
      .map((m) => ({
        name: m.name,
        departamento: m.departamento,
        count: m.count,
        barriosCount: m.barrios.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [pins]);

  // 3. Encuestadores (Aparecerá un Card de los nombres de los encuestadores, y mostrarán los pines e información con buen front-end UI)
  const surveyedEncuestadores = useMemo(() => {
    const map = new Map<string, {
      name: string;
      id: string;
      count: number;
      respondentsCount: number;
      municipios: Set<string>;
      departamentos: Set<string>;
      lastSurveyAt: string | null;
    }>();

    (pins || []).forEach((p) => {
      const rawName = (p.surveyorName || (p.answers?.encuestador as string) || 'Encuestador de Campo').trim();
      const survId = p.surveyorId || rawName;
      const mun = (p.municipio || (p.answers?.municipio as string) || '').trim();
      const dep = (p.departamento || (p.answers?.departamento as string) || '').trim();
      const respCount = p.respondents && p.respondents.length > 0 ? p.respondents.length : 1;

      const existing = map.get(rawName) || {
        name: rawName,
        id: survId,
        count: 0,
        respondentsCount: 0,
        municipios: new Set<string>(),
        departamentos: new Set<string>(),
        lastSurveyAt: null,
      };

      existing.count += 1;
      existing.respondentsCount += respCount;
      if (mun) existing.municipios.add(mun);
      if (dep) existing.departamentos.add(dep);
      if (p.createdAt) {
        if (!existing.lastSurveyAt || new Date(p.createdAt) > new Date(existing.lastSurveyAt)) {
          existing.lastSurveyAt = p.createdAt;
        }
      }
      map.set(rawName, existing);
    });

    // También incluir miembros de interviewers si existen
    (interviewers || []).forEach((inv) => {
      if (!map.has(inv.name)) {
        map.set(inv.name, {
          name: inv.name,
          id: inv.id,
          count: inv.totalSurveys || 0,
          respondentsCount: inv.totalSurveys || 0,
          municipios: new Set<string>(),
          departamentos: new Set<string>(),
          lastSurveyAt: inv.registeredAt || null,
        });
      }
    });

    return Array.from(map.values())
      .map((e) => ({
        id: e.id,
        name: e.name,
        count: e.count,
        respondentsCount: e.respondentsCount,
        municipiosList: Array.from(e.municipios),
        departamentosList: Array.from(e.departamentos),
        lastSurveyAt: e.lastSurveyAt,
      }))
      .sort((a, b) => b.count - a.count);
  }, [pins, interviewers]);

  // Filtrado reactivo según texto ingresado en el buscador
  const cleanSearchQuery = searchQuery.trim().toLowerCase()
    .replace(/^departamento:\s*/i, '')
    .replace(/^municipio:\s*/i, '')
    .replace(/^encuestador:\s*/i, '')
    .trim();

  const filteredDepartamentos = useMemo(() => {
    if (!cleanSearchQuery) return surveyedDepartamentos;
    return surveyedDepartamentos.filter((d) => d.name.toLowerCase().includes(cleanSearchQuery));
  }, [surveyedDepartamentos, cleanSearchQuery]);

  const filteredMunicipios = useMemo(() => {
    if (!cleanSearchQuery) return surveyedMunicipios;
    return surveyedMunicipios.filter(
      (m) =>
        m.name.toLowerCase().includes(cleanSearchQuery) ||
        m.departamento.toLowerCase().includes(cleanSearchQuery)
    );
  }, [surveyedMunicipios, cleanSearchQuery]);

  const filteredEncuestadores = useMemo(() => {
    if (!cleanSearchQuery) return surveyedEncuestadores;
    return surveyedEncuestadores.filter(
      (e) =>
        e.name.toLowerCase().includes(cleanSearchQuery) ||
        e.municipiosList.some((m) => m.toLowerCase().includes(cleanSearchQuery)) ||
        e.departamentosList.some((d) => d.toLowerCase().includes(cleanSearchQuery))
    );
  }, [surveyedEncuestadores, cleanSearchQuery]);

  const handleSelectFilterItem = (filter: VotalityFilterSelection) => {
    setSearchQuery(filter.label);
    setIsSearchFocused(false);
    if (onApplyFilter) {
      onApplyFilter(filter);
    }
  };

  const handleClearFilter = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    if (onApplyFilter) {
      onApplyFilter(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

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
                {adminTier === 'premium'
                  ? 'Plan Premium'
                  : adminTier === 'municipal'
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
        {/* Left: Brand Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-white">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-white"></span>
            <span className="hidden sm:inline">PANEL TERRITORIAL</span>
          </div>
        </div>

        {/* Center: Filtro con solo 3 opciones: Departamentos, Municipios y Encuestadores */}
        <div id="barra-filtro" ref={searchRef} className="relative flex-1 max-w-xl mx-2">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setIsSearchFocused(!isSearchFocused)}
              className="absolute left-2.5 p-1 text-[#888888] hover:text-[#FFFFFF] cursor-pointer z-10 transition-colors"
              title="Filtro de Departamentos, Municipios y Encuestadores"
            >
              <Filter className={`w-4 h-4 ${activeFilter ? 'text-[#00FF85]' : 'text-[#888888]'}`} />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Filtrar por Departamento, Municipio o Encuestador..."
              className={`w-full bg-[#111111] hover:bg-[#161616] focus:bg-[#000000] text-[#FFFFFF] placeholder-[#666666] text-xs font-mono pl-9 pr-9 py-2 border ${
                activeFilter
                  ? 'border-[#00FF85] text-[#00FF85] font-semibold'
                  : 'border-[#333333] focus:border-[#FFFFFF]'
              } rounded-sm transition-all focus:outline-none`}
            />
            {(searchQuery || activeFilter) && (
              <button
                onClick={handleClearFilter}
                className="absolute right-2.5 text-[#777777] hover:text-[#FFFFFF] cursor-pointer p-0.5"
                title="Quitar filtro y mostrar todos los pines"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown del Filtro: Departamentos, Municipios y Encuestadores */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#000000] border-2 border-[#333333] rounded-sm shadow-2xl overflow-hidden z-[2000] max-h-[75vh] flex flex-col font-sans">
              {/* Header con Pestañas de las 3 Opciones */}
              <div className="p-2.5 bg-[#0d0d0d] border-b border-[#222222] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterTab('todos')}
                    className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-xs transition-colors cursor-pointer ${
                      filterTab === 'todos'
                        ? 'bg-[#FFFFFF] text-[#000000]'
                        : 'bg-[#181818] text-[#888888] hover:text-[#FFFFFF]'
                    }`}
                  >
                    Todo ({surveyedDepartamentos.length + surveyedMunicipios.length + surveyedEncuestadores.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('departamentos')}
                    className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      filterTab === 'departamentos'
                        ? 'bg-[#00FF85] text-[#000000]'
                        : 'bg-[#181818] text-[#888888] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Compass className="w-3 h-3" />
                    <span>Departamentos ({surveyedDepartamentos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('municipios')}
                    className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      filterTab === 'municipios'
                        ? 'bg-[#00FF85] text-[#000000]'
                        : 'bg-[#181818] text-[#888888] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Building className="w-3 h-3" />
                    <span>Municipios ({surveyedMunicipios.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('encuestadores')}
                    className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      filterTab === 'encuestadores'
                        ? 'bg-[#00FF85] text-[#000000]'
                        : 'bg-[#181818] text-[#888888] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>Encuestadores ({surveyedEncuestadores.length})</span>
                  </button>
                </div>
                <span className="text-[10px] font-mono text-[#555555] hidden sm:inline">ESC cerrar</span>
              </div>

              {/* Contenido scrolleable con los 3 bloques */}
              <div className="overflow-y-auto p-3 space-y-4 max-h-[60vh] divide-y divide-[#1a1a1a]">
                {/* 1. DEPARTAMENTOS ENCUESTADOS */}
                {(filterTab === 'todos' || filterTab === 'departamentos') && (
                  <div className="pt-2 first:pt-0">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]">
                      <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#00FF85]">
                        <Compass className="w-3.5 h-3.5 text-[#00FF85]" />
                        <span>DEPARTAMENTOS ENCUESTADOS ({filteredDepartamentos.length})</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#666666]">Haz clic para filtrar</span>
                    </div>

                    {filteredDepartamentos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {filteredDepartamentos.map((dep) => (
                          <div
                            key={dep.name}
                            onClick={() => handleSelectFilterItem({
                              type: 'departamento',
                              value: dep.name,
                              label: `Departamento: ${dep.name}`,
                            })}
                            className="p-2.5 bg-[#0a0a0a] hover:bg-[#161616] border border-[#262626] hover:border-[#00FF85] rounded-sm transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-sm bg-[#141414] border border-[#2f2f2f] flex items-center justify-center shrink-0 group-hover:border-[#00FF85]">
                                <Compass className="w-3.5 h-3.5 text-white group-hover:text-[#00FF85] transition-colors" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-white group-hover:text-[#00FF85] transition-colors truncate">
                                  {dep.name}
                                </div>
                                <div className="text-[10px] font-mono text-[#777777]">
                                  {dep.municipiosCount} {dep.municipiosCount === 1 ? 'municipio' : 'municipios'}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs bg-[#111111] border border-[#333333] text-[#00FF85]">
                              {dep.count} {dep.count === 1 ? 'Pin' : 'Pines'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-2.5 text-center text-xs font-mono text-[#666666]">
                        No se encontraron departamentos encuestados.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. MUNICIPIOS ENCUESTADOS */}
                {(filterTab === 'todos' || filterTab === 'municipios') && (
                  <div className="pt-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]">
                      <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#00FF85]">
                        <Building className="w-3.5 h-3.5 text-[#00FF85]" />
                        <span>MUNICIPIOS ENCUESTADOS ({filteredMunicipios.length})</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#666666]">Haz clic para filtrar</span>
                    </div>

                    {filteredMunicipios.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {filteredMunicipios.map((mun) => (
                          <div
                            key={`${mun.name}__${mun.departamento}`}
                            onClick={() => handleSelectFilterItem({
                              type: 'municipio',
                              value: mun.name,
                              label: `Municipio: ${mun.name}`,
                            })}
                            className="p-2.5 bg-[#0a0a0a] hover:bg-[#161616] border border-[#262626] hover:border-[#00FF85] rounded-sm transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-sm bg-[#141414] border border-[#2f2f2f] flex items-center justify-center shrink-0 group-hover:border-[#00FF85]">
                                <Building className="w-3.5 h-3.5 text-white group-hover:text-[#00FF85] transition-colors" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-white group-hover:text-[#00FF85] transition-colors truncate">
                                  {mun.name}
                                </div>
                                <div className="text-[10px] font-mono text-[#777777] truncate">
                                  {mun.departamento || 'Colombia'}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs bg-[#111111] border border-[#333333] text-[#00FF85]">
                              {mun.count} {mun.count === 1 ? 'Pin' : 'Pines'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-2.5 text-center text-xs font-mono text-[#666666]">
                        No se encontraron municipios encuestados.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ENCUESTADORES (Card UI con nombres, pines e información) */}
                {(filterTab === 'todos' || filterTab === 'encuestadores') && (
                  <div className="pt-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]">
                      <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#00FF85]">
                        <Users className="w-3.5 h-3.5 text-[#00FF85]" />
                        <span>ENCUESTADORES · EQUIPO DE CAMPO ({filteredEncuestadores.length})</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#666666]">Haz clic para ver sus pines</span>
                    </div>

                    {filteredEncuestadores.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 mt-2">
                        {filteredEncuestadores.map((enc) => {
                          const initials = enc.name
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase() || 'EN';

                          const lastDateFormatted = enc.lastSurveyAt
                            ? new Date(enc.lastSurveyAt).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })
                            : null;

                          return (
                            <div
                              key={enc.id || enc.name}
                              onClick={() => handleSelectFilterItem({
                                type: 'encuestador',
                                value: enc.name,
                                label: `Encuestador: ${enc.name}`,
                              })}
                              className="p-3 bg-[#0a0a0a] hover:bg-[#121212] border border-[#2a2a2a] hover:border-[#00FF85] rounded-sm transition-all cursor-pointer group shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0 w-9 h-9 rounded-full bg-[#181818] border border-[#383838] group-hover:border-[#00FF85] flex items-center justify-center font-mono font-bold text-xs text-white uppercase transition-colors">
                                  {initials}
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00FF85] border-2 border-black" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white group-hover:text-[#00FF85] transition-colors truncate">
                                      {enc.name}
                                    </span>
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-[#1a1a1a] text-[#888888] border border-[#333333]">
                                      ENCUESTADOR
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#999999] font-mono">
                                    {enc.municipiosList.length > 0 ? (
                                      <span className="flex items-center gap-1 text-[#aaaaaa]">
                                        <MapPin className="w-3 h-3 text-[#00FF85]" />
                                        {enc.municipiosList.join(', ')}
                                      </span>
                                    ) : (
                                      <span className="text-[#666666]">Sin municipios registrados aún</span>
                                    )}
                                    {lastDateFormatted && (
                                      <span className="text-[#666666] hidden sm:inline">
                                        • {lastDateFormatted}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1a1a1a]">
                                <div className="text-right">
                                  <div className="text-xs font-mono font-bold text-[#00FF85]">
                                    {enc.count} {enc.count === 1 ? 'Pin' : 'Pines'}
                                  </div>
                                  <div className="text-[10px] font-mono text-[#777777]">
                                    {enc.respondentsCount} {enc.respondentsCount === 1 ? 'encuesta' : 'encuestas'}
                                  </div>
                                </div>
                                <span className="px-2.5 py-1.5 bg-[#171717] group-hover:bg-[#00FF85] group-hover:text-black text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1">
                                  <span>Ver Pines</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-2.5 text-center text-xs font-mono text-[#666666]">
                        No se encontraron encuestadores.
                      </div>
                    )}
                  </div>
                )}

                {/* Si no hay encuestas registradas en el sistema */}
                {pins.length === 0 && (
                  <div className="p-6 text-center text-xs font-mono text-[#888888] flex flex-col items-center justify-center gap-2">
                    <Filter className="w-6 h-6 text-[#555555]" />
                    <div className="font-bold text-white">No hay encuestas registradas para filtrar</div>
                    <div className="text-[11px] text-[#666666] max-w-sm">
                      Realice encuestas en campo o pulse "Marcar mi ubicación" para ver aquí los Departamentos, Municipios y Encuestadores con sus respectivos pines.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Botón Landing/Planes, Botón Crear/Editar y Botón de Perfil */}
        <div className="flex items-center gap-2">
          {/* Botón Ir a Página de Inicio (Disponible en todas las cuentas) */}
          <button
            id="btn-ir-landing-page"
            onClick={onNavigateToLanding || (() => (window.location.href = '/'))}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#000000] hover:bg-[#151515] text-[#e0e0e0] hover:text-[#00FF85] border border-[#444444] hover:border-[#00FF85]/80 text-xs font-mono uppercase tracking-wider font-semibold transition-all rounded-sm cursor-pointer shadow-sm active:scale-95"
            title="Ir a la página de inicio para revisar o cambiar de plan"
          >
            <Compass className="w-3.5 h-3.5 text-[#00FF85]" />
            <span className="hidden sm:inline">Página Inicio</span>
            <span className="sm:hidden">Inicio</span>
          </button>

          {!isEncuestador && (
            <button
              id="btn-crear-editar"
              onClick={onOpenFormEditor}
              className="flex items-center gap-2 px-3 py-2 bg-[#000000] hover:bg-[#FFFFFF] hover:text-[#000000] border border-[#444444] hover:border-[#FFFFFF] text-xs font-mono uppercase tracking-wider font-semibold transition-all rounded-sm cursor-pointer shadow-sm active:scale-95"
              title="Crear o configurar preguntas personalizadas del formulario base"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Crear/Editar</span>
            </button>
          )}

          {/* Profile Icon & Dropdown Modal */}
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
              className="absolute right-0 top-full mt-2 w-84 sm:w-[410px] bg-[#000000] border border-[#FFFFFF] rounded-sm shadow-2xl p-4 text-xs font-sans z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header: Personal Info */}
              <div className="pb-3 border-b border-[#262626] flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF85]"></span>
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

              {/* BLOQUE DESTACADO: ROL DEL USUARIO Y LICENCIA ADQUIRIDA */}
              <div className="mt-3 p-3 bg-[#0a0a0a] border border-[#222222] rounded-sm space-y-3">
                {/* 1. Indicador de Rol */}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                    Rol del Usuario:
                  </div>
                  {isEncuestador ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#002B36] text-[#2AA198] border border-[#2AA198]/50 shadow-[0_0_8px_rgba(42,161,152,0.25)]">
                      <KeyRound className="w-3 h-3" />
                      Encuestador
                    </span>
                  ) : isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#003820] text-[#00FF85] border border-[#00FF85]/50 shadow-[0_0_8px_rgba(0,255,133,0.25)]">
                      <Shield className="w-3 h-3" />
                      Administrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#181818] text-[#cccccc] border border-[#444444]">
                      <User className="w-3 h-3" />
                      Usuario Básico
                    </span>
                  )}
                </div>

                {/* 2. Licencia Adquirida */}
                <div className="pt-2.5 border-t border-[#1c1c1c]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                      Licencia Adquirida:
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#00FF85] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF85] animate-pulse"></span>
                      {licenseData.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#FFFFFF] font-sans">
                      {licenseData.title}
                    </div>
                    {licenseData.badge === 'MÁS ELEGIDO' ? (
                      <span className="px-1.5 py-0.5 bg-[#FFFFFF] text-[#000000] text-[9px] font-mono font-bold uppercase rounded-xs">
                        MÁS ELEGIDO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-[#181818] text-[#888888] border border-[#333333] text-[9px] font-mono uppercase rounded-xs">
                        {licenseData.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#777777] font-mono mt-0.5">
                    [{licenseData.scope}]
                  </div>
                </div>

                {/* 3. Capacidades y Parámetros del Plan */}
                <div className="pt-2.5 border-t border-[#1c1c1c] space-y-1.5 text-[10px] font-mono">
                  <div className="flex items-center justify-between text-[#888888]">
                    <span>Vigencia de la licencia:</span>
                    <span className="text-[#00FF85] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#00FF85]" />
                      {licenseData.vigencia}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#888888]">
                    <span>Encuestadores permitidos:</span>
                    <span className="text-[#FFFFFF] font-semibold">{licenseData.interviewersLimit}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#888888]">
                    <span>Límite máximo de pines:</span>
                    <span className="text-[#FFFFFF] font-semibold">{licenseData.pinsLimit}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-[#888888]">
                    <span className="shrink-0">Beneficio activo:</span>
                    <span className="text-[#00FF85] text-right font-sans text-[10px] leading-tight">
                      {licenseData.benefit}
                    </span>
                  </div>

                  {/* Aviso de Vigencia de 6 Meses y Respaldo por Correo */}
                  {licenseData.isCampaign && (
                    <div className="mt-2.5 p-2.5 rounded-sm bg-[#141005] border border-amber-500/40 text-[10px] font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[9px]">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Aviso de Vigencia (6 Meses) y Respaldo</span>
                      </div>
                      <p className="text-[#aaaaaa] leading-relaxed text-[9.5px]">
                        La licencia dura 6 meses. Antes de 15 días de que se acabe la licencia, se le va a borrar toda la información por seguridad, pero se le enviará automáticamente en <strong className="text-white">PDF y Excel</strong> al correo la última información guardada.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* BOTÓN VER TUTORIAL (DISPONIBLE PARA TODOS LOS ROLES) */}
              <button
                id="btn-perfil-ver-tutorial"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onOpenTutorial) onOpenTutorial();
                }}
                className="w-full mt-3 py-2.5 px-3 bg-[#111111] hover:bg-[#1a1a1a] text-[#FFFFFF] hover:text-[#00FF85] border border-[#2e2e2e] hover:border-[#00FF85]/60 text-xs font-mono uppercase tracking-wider font-semibold transition-all rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                title="Ver videos explicativos de la plataforma"
              >
                <PlayCircle className="w-3.5 h-3.5 text-[#00FF85] group-hover:scale-110 transition-transform" />
                <span>Ver tutorial</span>
              </button>

              {/* ROLE SPECIFIC VIEW: ADMIN (Campaña Comunal, Municipal, Departamental) */}
              <div
                id="perfil-admin-section"
                style={{ display: isAdmin ? 'block' : 'none' }}
                className="mt-3 space-y-3"
              >
                {/* Módulo Simplificado de Entrevistadores: Enlace en Espera y Lista Activa */}
                <ModuloEntrevistadores
                  tipoPlan={licenseData.title}
                  limiteCupos={currentPlan.maxInterviewers}
                  onNavigateToJoin={onNavigateToJoin}
                />
              </div>

              {/* ROLE SPECIFIC VIEW: FREE PLAN */}
              <div
                id="perfil-free-section"
                style={{ display: isFree ? 'block' : 'none' }}
                className="mt-3 space-y-3"
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
                  <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Mejorar Plan (Plan Premium)</span>
                </button>
              </div>

              {/* ROLE SPECIFIC VIEW: ENCUESTADOR */}
              <div
                id="perfil-encuestador-section"
                style={{ display: isEncuestador ? 'block' : 'none' }}
                className="mt-3 space-y-3 font-mono"
              >
                <div className="p-3 bg-[#111111] border border-[#262626] rounded-sm space-y-2">
                  <div className="text-[10px] uppercase text-[#888888] flex items-center justify-between">
                    <span>Director / Administrador</span>
                    <span className="text-[9px] text-[#00FF85] font-bold">LÍDER DE EQUIPO</span>
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                    <User className="w-4 h-4 text-[#00FF85]" />
                    <span>{currentUser?.adminName || localStorage.getItem('votality_encuestador_admin_name') || 'Administrador de Campaña'}</span>
                  </div>
                  <div className="text-[10px] text-[#777777] italic">
                    (Correo del administrador reservado por privacidad)
                  </div>
                  {projectName && (
                    <div className="text-[11px] text-[#00FF85] pt-1 border-t border-[#1f1f1f]">
                      Campaña: {projectName}
                    </div>
                  )}
                </div>

                {/* Otros encuestadores del equipo */}
                <div className="p-3 bg-[#111111] border border-[#262626] rounded-sm space-y-2">
                  <div className="text-[10px] uppercase text-[#888888] flex items-center justify-between">
                    <span>Compañeros de Equipo ({interviewers.length})</span>
                    <Users className="w-3.5 h-3.5 text-white" />
                  </div>
                  {interviewers.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {interviewers.map((i) => (
                        <div key={i.id} className="text-[11px] text-[#cccccc] flex items-center justify-between py-1 border-b border-[#1c1c1c] last:border-0">
                          <span className="truncate">{i.name}</span>
                          <span className="text-[10px] text-[#00FF85] font-bold shrink-0">{i.totalSurveys || 0} pines</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#777777]">
                      Eres el único encuestador registrado actualmente en este equipo.
                    </div>
                  )}
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

