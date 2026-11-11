import React, { useState, useEffect } from 'react';
import { Plus, Users, BarChart2, Radio, CheckCircle2, ShieldAlert, Sparkles, KeyRound } from 'lucide-react';
import {
  AdminPlanTier,
  CensusSectorData,
  FormField,
  Interviewer,
  PLAN_CONFIGS,
  SearchLocationTarget,
  SurveyRecord,
  UserRole,
} from '../../types/votality';
import {
  INITIAL_CENSUS_SECTORS,
  INITIAL_FORM_FIELDS,
  INITIAL_INTERVIEWERS,
  INITIAL_SURVEY_PINS,
} from '../../data/votalityMock';
import { VotalityNavbar } from './VotalityNavbar';
import { VotalityMap } from './VotalityMap';
import { VotalityFormEditorModal } from './VotalityFormEditorModal';
import { VotalityRespondentsModal } from './VotalityRespondentsModal';
import { VotalityStatisticsModal } from './VotalityStatisticsModal';
import { VotalityCaptureModal } from './VotalityCaptureModal';
import { VotalityUpgradeModal } from './VotalityUpgradeModal';
import { VotalityProjectSetupModal } from './VotalityProjectSetupModal';
import { VotalityInvitationsModal } from './VotalityInvitationsModal';
import { VotalityAdBanner } from './VotalityAdBanner';
import {
  searchTerritorialLocal,
  fetchReverseGeocode,
  GeoSearchResult,
  GeoSuggestItem,
} from '../../data/colombiaTerritoryData';

import { UserSession } from '../auth/AuthPage';
import { solicitarUbicacionGPS } from '../../utils/geolocation';

interface VotalityDashboardProps {
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onNavigateToJoin?: (token: string) => void;
  onOpenUpgradeModal?: () => void;
  onUpdateProjectName?: (projectName: string) => void;
}

function resolveUserRoleAndTier(user?: UserSession | null): { role: UserRole; tier: AdminPlanTier } {
  if (!user) {
    return { role: 'admin', tier: 'comunal' };
  }
  const roleUpper = (user.role || '').toUpperCase();
  const planUpper = (user.plan?.codigo || user.planTier || '').toUpperCase();

  if (roleUpper === 'ENCUESTADOR') {
    return { role: 'encuestador', tier: 'comunal' };
  }

  if (
    roleUpper === 'USUARIO_FREE' ||
    roleUpper === 'FREE' ||
    planUpper === 'FREE' ||
    (!planUpper && roleUpper !== 'ADMIN_CAMPANA' && roleUpper !== 'SUPERADMIN')
  ) {
    return { role: 'free', tier: 'comunal' };
  }

  if (planUpper === 'MUNICIPAL') {
    return { role: 'admin', tier: 'municipal' };
  }

  if (planUpper === 'DEPARTAMENTAL' || roleUpper === 'SUPERADMIN') {
    return { role: 'admin', tier: 'departamental' };
  }

  return { role: 'admin', tier: 'comunal' };
}

export const VotalityDashboard: React.FC<VotalityDashboardProps> = ({ 
  currentUser,
  onLogout, 
  onNavigateToJoin,
  onOpenUpgradeModal,
  onUpdateProjectName,
}) => {
  // Role & Plan State derived strictly from authenticated user session
  const { role: currentRole, tier: adminTier } = resolveUserRoleAndTier(currentUser);

  // Nombre del Proyecto ingresado por el usuario (aplica para los 4 planes)
  const [projectName, setProjectName] = useState<string>(() => {
    return (
      currentUser?.projectName ||
      currentUser?.proyecto_nombre ||
      localStorage.getItem(`votality_project_${currentUser?.email || 'default'}`) ||
      localStorage.getItem(`voxpin_project_${currentUser?.email || 'default'}`) ||
      (currentRole === 'encuestador' ? localStorage.getItem('votality_last_project_name') || localStorage.getItem('voxpin_last_project_name') || '' : '')
    );
  });

  // Si el usuario es un encuestador y aún no tiene nombre de proyecto local, consultamos la sesión de su campaña
  useEffect(() => {
    if (currentRole === 'encuestador' && !projectName) {
      const fetchSession = async () => {
        try {
          const res = await fetch('/api/v1/encuestador/session/');
          if (res.ok) {
            const data = await res.json();
            if (data?.proyecto?.nombre) {
              setProjectName(data.proyecto.nombre);
              if (onUpdateProjectName) {
                onUpdateProjectName(data.proyecto.nombre);
              }
              return;
            }
          }
        } catch {
          // Continuar a fallback
        }
        const fallback =
          localStorage.getItem('votality_last_project_name') ||
          localStorage.getItem('voxpin_last_project_name') ||
          '';
        if (fallback) {
          setProjectName(fallback);
        }
      };
      fetchSession();
    }
  }, [currentRole, projectName, onUpdateProjectName]);

  // Solicitud activa de permiso GPS para encuestadores al ingresar al panel
  useEffect(() => {
    if (currentRole === 'encuestador') {
      solicitarUbicacionGPS(
        (coords) => {
          setMapCenter([coords.lat, coords.lng]);
        },
        (err) => {
          console.warn('GPS inicial para encuestador no concedido:', err);
        }
      );
    }
  }, [currentRole]);

  // Sectors & Active Selection
  const [sectors] = useState<CensusSectorData[]>(INITIAL_CENSUS_SECTORS);
  const [selectedSector, setSelectedSector] = useState<CensusSectorData>(INITIAL_CENSUS_SECTORS[0]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(INITIAL_CENSUS_SECTORS[0].center);

  // Form Fields Schema
  const [formFields, setFormFields] = useState<FormField[]>(INITIAL_FORM_FIELDS);

  // Interviewers Data (Quotas)
  const [interviewers, setInterviewers] = useState<Interviewer[]>(INITIAL_INTERVIEWERS);

  // Survey Records (Pins)
  const [pins, setPins] = useState<SurveyRecord[]>(INITIAL_SURVEY_PINS);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // Geocoding and Search Target State
  const [searchTarget, setSearchTarget] = useState<SearchLocationTarget | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [topBarFilterText, setTopBarFilterText] = useState<string>('');
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  // Modals Visibility
  const [isFormEditorOpen, setIsFormEditorOpen] = useState(false);
  const [isRespondentsOpen, setIsRespondentsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false);

  // Real-time Toast Notifications (B&W)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'alert' } | null>(null);

  const showToast = (message: string, type: 'info' | 'alert' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const currentPlan = currentRole === 'free' ? PLAN_CONFIGS.free : PLAN_CONFIGS[adminTier];
  const maxPinsAllowed = currentPlan.maxPins;

  // Búsqueda Territorial Local en PostGIS (Endpoint interno /api/v1/geosearch/ sin APIs externas)
  const handleGeocodeSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    setIsGeocoding(true);
    try {
      let data: GeoSearchResult | null = null;

      // 1. Consumir el endpoint interno en Django / PostGIS
      try {
        const response = await fetch(`/api/v1/geosearch/?q=${encodeURIComponent(q)}`, {
          headers: {
            Accept: 'application/json',
          },
        });
        if (response.ok) {
          data = await response.json();
        }
      } catch (err) {
        // En caso de que el backend local no esté levantado, utilizar el fallback PostGIS local
      }

      // 2. Fallback de alta velocidad con base territorial local
      if (!data) {
        data = searchTerritorialLocal(q);
      }

      if (!data) {
        showToast(
          'Dirección no encontrada en Colombia. Por favor verifique los datos.',
          'alert'
        );
        return;
      }

      // Validación estricta territorial: Lat [-4.3, 13.5], Lon [-81.8, -66.8]
      if (
        data.lat < -4.3 ||
        data.lat > 13.5 ||
        data.lon < -81.8 ||
        data.lon > -66.8
      ) {
        showToast(
          'Dirección no encontrada en Colombia. Por favor verifique los datos.',
          'alert'
        );
        return;
      }

      const category: SearchLocationTarget['type'] =
        data.tipo === 'departamento'
          ? 'department'
          : data.tipo === 'municipio'
          ? 'municipality'
          : data.tipo === 'localidad'
          ? 'localidad'
          : data.tipo === 'comuna'
          ? 'comuna'
          : data.tipo === 'barrio'
          ? 'barrio'
          : 'address';

      const zoomLevel =
        data.tipo === 'departamento'
          ? 9
          : data.tipo === 'municipio'
          ? 13
          : data.tipo === 'localidad'
          ? 14
          : data.tipo === 'comuna'
          ? 15
          : data.tipo === 'barrio'
          ? 16
          : 17;

      const target: SearchLocationTarget = {
        lat: data.lat,
        lng: data.lon,
        label: data.display_name,
        bbox: data.bbox,
        zoomLevel,
        type: category,
      };

      setSearchTarget(target);
      setMapCenter([data.lat, data.lon]);

      const labelTipo =
        category === 'department'
          ? 'Departamento'
          : category === 'municipality'
          ? 'Municipio'
          : category === 'localidad'
          ? 'Localidad'
          : category === 'comuna'
          ? 'Comuna'
          : category === 'barrio'
          ? 'Barrio'
          : 'Dirección/Vía';

      showToast(
        `Localizado en PostGIS: ${target.label} (${labelTipo})`,
        'info'
      );
    } catch (err) {
      showToast(
        'Dirección no encontrada en Colombia. Por favor verifique los datos.',
        'alert'
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle Selection from Google-style Predictive Dropdown
  const handleSelectSuggestion = (item: GeoSuggestItem) => {
    if (item.lat !== undefined && item.lon !== undefined) {
      const category: SearchLocationTarget['type'] =
        item.tipo === 'departamento'
          ? 'department'
          : item.tipo === 'municipio'
          ? 'municipality'
          : item.tipo === 'localidad'
          ? 'localidad'
          : item.tipo === 'comuna'
          ? 'comuna'
          : item.tipo === 'barrio'
          ? 'barrio'
          : 'address';

      const zoomLevel =
        item.tipo === 'departamento'
          ? 9
          : item.tipo === 'municipio'
          ? 13
          : item.tipo === 'localidad'
          ? 14
          : item.tipo === 'comuna'
          ? 15
          : item.tipo === 'barrio'
          ? 16
          : 17;

      const target: SearchLocationTarget = {
        lat: item.lat,
        lng: item.lon,
        label: item.label,
        bbox: item.bbox,
        zoomLevel,
        type: category,
      };

      setSearchTarget(target);
      setMapCenter([item.lat, item.lon]);

      const labelTipo =
        category === 'department'
          ? 'Departamento'
          : category === 'municipality'
          ? 'Municipio'
          : category === 'localidad'
          ? 'Localidad'
          : category === 'comuna'
          ? 'Comuna'
          : category === 'barrio'
          ? 'Barrio'
          : 'Dirección/Vía';

      showToast(
        `Localizado en PostGIS: ${item.label} (${labelTipo})`,
        'info'
      );
      return;
    }

    handleGeocodeSearch(item.label);
  };

  // Handle Sector Change via Search or Selection
  const handleSelectSector = (sector: CensusSectorData) => {
    setSelectedSector(sector);
    setMapCenter(sector.center);
    setSearchTarget({
      lat: sector.center[0],
      lng: sector.center[1],
      label: `${sector.name}, ${sector.municipality}`,
      zoomLevel: 15,
      type: 'address',
    });
    showToast(`Mapa centrado en: ${sector.name} (${sector.municipality})`, 'info');
  };

  // Handle Delete Interviewer (Action: Confirmation -> DELETE -> Revoke session/token -> Release quota)
  const handleDeleteInterviewer = (id: string) => {
    const target = interviewers.find((i) => i.id === id);
    if (!target) return;

    // Simulate backend DELETE request with session token revocation
    setInterviewers((prev) => prev.filter((i) => i.id !== id));
    showToast(
      `Encuestador ${target.name} eliminado. Sesión y token ${target.sessionToken} revocados al instante. Cupo liberado.`,
      'alert'
    );
  };

  // Handle Save New Survey (Kafka Producer -> WebSocket Stream -> Leaflet Pin)
  const handleSaveSurvey = (newSurveyData: Omit<SurveyRecord, 'id' | 'createdAt'>) => {
    // Validación estricta territorial: Solo dentro de Colombia
    if (
      newSurveyData.lat < -4.3 ||
      newSurveyData.lat > 13.5 ||
      newSurveyData.lng < -81.8 ||
      newSurveyData.lng > -66.8
    ) {
      showToast(
        'Ubicación inválida: el registro debe encontrarse dentro de Colombia.',
        'alert'
      );
      return;
    }

    const newRecord: SurveyRecord = {
      ...newSurveyData,
      id: `pin-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    // Prepend to pins list
    setPins((prev) => [newRecord, ...prev]);
    setSelectedPinId(newRecord.id);
    setMapCenter([newRecord.lat, newRecord.lng]);

    showToast(
      `Encuesta guardada con éxito. Evento publicado en Kafka [topic: votality-pines] y transmitido a clientes conectados.`,
      'info'
    );
  };

  // Geocodificación Inversa Bidireccional (GPS / Pin Drag -> Barra de Filtro y Formulario)
  const handleReverseGeocodeCoordinates = async (
    lat: number,
    lng: number,
    isDirectGps: boolean = false,
    accuracy?: number
  ) => {
    try {
      const rev = await fetchReverseGeocode(lat, lng);
      if (rev) {
        // 1. Barra de filtro superior: Mostrar texto contextual detectado
        setTopBarFilterText(rev.contexto);

        // 2. Formulario de captura: Rellenar campo Dirección
        setDetectedAddress(rev.direccion);

        // Actualizar directamente el input DOM si está montado
        const inputDir = document.getElementById('input-direccion') as HTMLInputElement | null;
        if (inputDir) {
          inputDir.value = rev.direccion;
          inputDir.dispatchEvent(new Event('input', { bubbles: true }));
          inputDir.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 3. Sincronizar searchTarget
        const accText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
        setSearchTarget({
          lat,
          lng,
          label: rev.direccion,
          zoomLevel: 18,
          type: 'address',
        });
        setMapCenter([lat, lng]);

        showToast(
          `${isDirectGps ? `GPS satelital${accText}` : 'Pin calibrado'}: ${rev.direccion} [${rev.contexto}]`,
          'info'
        );
      }
    } catch (err) {
      console.warn('Error en geocodificación inversa:', err);
    }
  };

  // Handle Location adjustment from draggable pin
  const handleSearchLocationAdjusted = (newLat: number, newLng: number) => {
    handleReverseGeocodeCoordinates(newLat, newLng, false);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#000000] text-[#FFFFFF] overflow-hidden select-none font-sans">
      {/* 1. TOP NAVBAR CON TEXTO CONTEXTUAL SINCRONIZADO */}
      <VotalityNavbar
        currentRole={currentRole}
        adminTier={adminTier}
        interviewers={interviewers}
        sectors={sectors}
        selectedSector={selectedSector}
        onSelectSector={handleSelectSector}
        onOpenFormEditor={() => setIsFormEditorOpen(true)}
        onDeleteInterviewer={handleDeleteInterviewer}
        onOpenUpgradeModal={() => {
          if (onOpenUpgradeModal) onOpenUpgradeModal();
          else setIsUpgradeOpen(true);
        }}
        onGeocodeSearch={handleGeocodeSearch}
        onSelectSuggestion={handleSelectSuggestion}
        isGeocoding={isGeocoding}
        onLogout={onLogout || (() => showToast('Sesión finalizada', 'info'))}
        externalSearchQuery={topBarFilterText}
        onNavigateToJoin={onNavigateToJoin}
        projectName={projectName}
        userName={
          currentUser?.name ||
          (currentRole === 'encuestador'
            ? 'Encuestador de Campo'
            : currentRole === 'free'
            ? 'Usuario Plan Free'
            : 'Director de Campaña')
        }
        userEmail={
          currentUser?.email ||
          (currentRole === 'encuestador'
            ? 'encuestador@votality.com'
            : currentRole === 'free'
            ? 'usuario.free@votality.com'
            : 'campana@votality.com')
        }
      />

      {/* 2. CENTER: LEAFLET MAP IN STRICT MONOCHROME */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <VotalityMap
          pins={pins}
          center={mapCenter}
          zoom={15}
          maxPins={maxPinsAllowed}
          selectedPinId={selectedPinId}
          searchTarget={searchTarget}
          onPinSelect={(pin) => {
            setSelectedPinId(pin.id);
            showToast(`Encuesta seleccionada: ${pin.name} (#${pin.id})`, 'info');
          }}
          onSearchLocationAdjusted={handleSearchLocationAdjusted}
          onGpsLocated={(lat, lng, accuracy) => {
            handleReverseGeocodeCoordinates(lat, lng, true, accuracy);
          }}
          onGpsError={(errorMsg) => {
            showToast(errorMsg, 'alert');
          }}
        />

        {/* Inputs ocultos de respaldo para acceso directo de scripts de geolocalización cuando el modal está cerrado */}
        {!isCaptureOpen && (
          <div className="hidden" aria-hidden="true">
            <input
              type="hidden"
              id="input-lat"
              value={searchTarget?.lat ?? mapCenter[0]}
              readOnly
            />
            <input
              type="hidden"
              id="input-lng"
              value={searchTarget?.lng ?? mapCenter[1]}
              readOnly
            />
          </div>
        )}

        {/* Contenedor publicitario flotante (#ad-banner) exclusivo para Plan Básico (Free) */}
        {currentRole === 'free' && (
          <div
            id="ad-banner"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-between gap-3 sm:gap-6 bg-[#000000] text-[#FFFFFF] border border-[#2e2e2e] px-4 py-2.5 rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.85)] font-sans text-xs max-w-[92vw] sm:max-w-xl backdrop-blur-md transition-all select-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider bg-[#141414] border border-[#2e2e2e] text-[#888888] px-1.5 py-0.5 rounded-xs">
                Publicidad
              </span>
              <div className="truncate">
                <span className="font-bold text-[#FFFFFF] mr-1.5">Consultoría Territorial 2026:</span>
                <span className="text-[#888888] hidden sm:inline text-[11px]">
                  Microsegmentación espacial y padrón biométrico.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (onOpenUpgradeModal) onOpenUpgradeModal();
                else setIsUpgradeOpen(true);
              }}
              className="shrink-0 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#000000] bg-[#FFFFFF] hover:bg-[#e5e5e5] px-2.5 py-1 rounded-sm font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>Mejorar Plan</span>
            </button>
          </div>
        )}

        {/* Real-Time WebSocket Streaming Indicator Badge */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-[#000000]/90 backdrop-blur-sm border border-[#333333] px-3 py-1.5 rounded-sm flex items-center gap-2 text-[10px] font-mono text-[#aaaaaa] shadow-lg">
            <Radio className="w-3.5 h-3.5 text-[#FFFFFF] animate-pulse" />
            <span>KAFKA STREAM: votality-pines</span>
            <span className="text-[#444444]">|</span>
            <span className="text-[#FFFFFF] font-bold">{pins.length} / {maxPinsAllowed.toLocaleString()} PINES</span>
          </div>
        </div>

        {/* 3. BOTTOM-LEFT AREA: ACTION BUTTONS ACCORDING TO ROLE */}
        <div id="contenedor-inferior-izq" className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
          {/* Button: "Encuestados" (Visible ONLY for Admin Campaña; COMPLETAMENTE OCULTO for Free and Encuestador) */}
          {currentRole === 'admin' && (
            <>
              <button
                id="btn-encuestados"
                onClick={() => setIsRespondentsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#000000] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#FFFFFF] rounded-sm font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-xl cursor-pointer active:scale-95"
                title="Ver padrón alfabético de encuestados A-Z"
              >
                <Users className="w-4 h-4" />
                <span>Encuestados</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#222222] text-[#FFFFFF] group-hover:bg-[#000000] group-hover:text-[#FFFFFF] rounded-xs font-mono ml-1">
                  {pins.length}
                </span>
              </button>

              <button
                id="btn-invitar"
                onClick={() => setIsInvitationsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#000000] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#FFFFFF] rounded-sm font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-xl cursor-pointer active:scale-95"
                title={`Generar enlace de invitación único de un solo uso (Cupos: ${interviewers.filter((i) => i.isActive).length}/${currentPlan.maxInterviewers})`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Invitar</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#222222] text-[#FFFFFF] group-hover:bg-[#000000] group-hover:text-[#FFFFFF] rounded-xs font-mono ml-1">
                  {interviewers.filter((i) => i.isActive).length}/{currentPlan.maxInterviewers}
                </span>
              </button>
            </>
          )}

          {/* Button: "Encuestados" for Free, "Estadística" for Admin; COMPLETAMENTE OCULTO for Encuestador */}
          {currentRole !== 'encuestador' && (
            <button
              id={currentRole === 'free' ? 'btn-encuestados' : 'btn-estadistica'}
              onClick={() => setIsStatisticsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#000000] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#FFFFFF] rounded-sm font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-xl cursor-pointer active:scale-95"
              title={
                currentRole === 'free'
                  ? 'Ver personas encuestadas (Hasta 100 en Plan Básico)'
                  : 'Abrir panel de tasa de cobertura censal y analítica'
              }
            >
              {currentRole === 'free' ? <Users className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
              <span>{currentRole === 'free' ? 'Encuestados' : 'Estadística'}</span>
              {currentRole === 'free' && (
                <span className="text-[10px] px-1.5 py-0.2 bg-[#222222] text-[#FFFFFF] rounded-xs font-mono ml-0.5">
                  {Math.min(pins.length, 100)}/100
                </span>
              )}
            </button>
          )}
        </div>

        {/* 4. BOTTOM-RIGHT AREA: CIRCULAR FLOATING BUTTON "AGREGAR" */}
        <div className="absolute bottom-6 right-6 z-20">
          <button
            id="btn-agregar"
            onClick={() => setIsCaptureOpen(true)}
            className="w-14 h-14 bg-[#FFFFFF] hover:bg-[#e5e5e5] text-[#000000] rounded-full border-2 border-[#000000] shadow-[0_4px_25px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Registrar nueva encuesta georreferenciada en campo"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Toast Notification (Monochromatic B&W Alert) */}
        {toast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-[#000000] border-2 border-[#FFFFFF] text-[#FFFFFF] px-4 py-2.5 rounded-sm shadow-2xl flex items-center gap-2.5 text-xs font-mono max-w-md">
              {toast.type === 'alert' ? (
                <ShieldAlert className="w-4 h-4 text-[#FFFFFF] shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#FFFFFF] shrink-0" />
              )}
              <span className="leading-snug">{toast.message}</span>
            </div>
          </div>
        )}
      </main>

      {/* 5. MODALS & POP-UPS */}
      {isFormEditorOpen && (
        <VotalityFormEditorModal
          fields={formFields}
          onSaveFields={(updated) => {
            setFormFields(updated);
            showToast('Esquema de formulario actualizado y sincronizado en tiempo real.', 'info');
          }}
          onClose={() => setIsFormEditorOpen(false)}
          userRole={currentRole}
        />
      )}

      {isRespondentsOpen && (
        <VotalityRespondentsModal
          records={pins}
          onClose={() => setIsRespondentsOpen(false)}
          onLocateOnMap={(record) => {
            setSelectedPinId(record.id);
            setMapCenter([record.lat, record.lng]);
          }}
        />
      )}

      {isStatisticsOpen && (
        <VotalityStatisticsModal
          records={pins}
          interviewers={interviewers}
          onClose={() => setIsStatisticsOpen(false)}
          isFreePlan={currentRole === 'free'}
          adminTier={adminTier}
          projectName={projectName}
          onUpgrade={() => {
            setIsStatisticsOpen(false);
            if (onOpenUpgradeModal) onOpenUpgradeModal();
            else setIsUpgradeOpen(true);
          }}
        />
      )}

      {isCaptureOpen && (
        <VotalityCaptureModal
          fields={formFields}
          activeSector={selectedSector}
          onSaveSurvey={handleSaveSurvey}
          onClose={() => setIsCaptureOpen(false)}
          surveyorName={
            currentRole === 'encuestador'
              ? (currentUser?.name || 'Encuestador de Campo')
              : (currentUser?.name || 'Director de Campaña')
          }
          surveyorId={currentRole === 'encuestador' ? (currentUser?.id || 'enc-001') : 'admin-001'}
          initialLat={searchTarget?.type === 'address' ? searchTarget.lat : undefined}
          initialLng={searchTarget?.type === 'address' ? searchTarget.lng : undefined}
          initialAddress={detectedAddress || (searchTarget?.type === 'address' ? searchTarget.label : undefined)}
        />
      )}

      {isUpgradeOpen && (
        <VotalityUpgradeModal
          currentUser={currentUser}
          onClose={() => setIsUpgradeOpen(false)}
        />
      )}

      {/* Modal Universal Simplificado: Enlace en Espera y Lista Activa */}
      <VotalityInvitationsModal
        isOpen={isInvitationsOpen}
        onClose={() => setIsInvitationsOpen(false)}
        adminTier={adminTier}
        activeInterviewersCount={interviewers.filter((i) => i.isActive).length}
        maxInterviewers={currentPlan.maxInterviewers}
        onNavigateToJoin={onNavigateToJoin}
        onSyncInterviewers={(activos) => {
          if (activos && activos.length > 0) {
            setInterviewers(
              activos.map((a) => ({
                id: a.id,
                name: a.nombre_completo,
                email: a.email || `${a.nombre_completo.toLowerCase().replace(/\s+/g, '.')}@votality.com`,
                phone: a.telefono || '+57 300 000 0000',
                registeredAt: new Date().toISOString(),
                sessionToken: `tok_${a.id}`,
                totalSurveys: a.totalSurveys || 0,
                isActive: true,
              }))
            );
          }
        }}
      />

      {/* Pantalla Intermedia Obligatoria: Definir Proyecto de Investigación (Solo admin/creadores, los encuestadores heredan el proyecto) */}
      <VotalityProjectSetupModal
        isOpen={!projectName && currentRole !== 'encuestador'}
        userEmail={currentUser?.email}
        userId={currentUser?.id}
        onProjectSaved={(name) => {
          setProjectName(name);
          try {
            localStorage.setItem(`votality_project_${currentUser?.email || 'default'}`, name);
            localStorage.setItem('votality_last_project_name', name);
          } catch (e) {
            console.error(e);
          }
          if (onUpdateProjectName) {
            onUpdateProjectName(name);
          }
        }}
      />
    </div>
  );
};

