import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users, BarChart2, Radio, CheckCircle2, ShieldAlert, Sparkles, KeyRound, MapPin, X } from 'lucide-react';
import {
  AdminPlanTier,
  CensusSectorData,
  FormField,
  Interviewer,
  PLAN_CONFIGS,
  SearchLocationTarget,
  SurveyRecord,
  RespondentRecord,
  UserRole,
} from '../../types/votality';
import {
  INITIAL_CENSUS_SECTORS,
  INITIAL_FORM_FIELDS,
  INITIAL_INTERVIEWERS,
  INITIAL_SURVEY_PINS,
} from '../../data/votalityMock';
import { VotalityNavbar, VotalityFilterSelection } from './VotalityNavbar';
import { VotalityMap } from './VotalityMap';
import { VotalityFormEditorModal } from './VotalityFormEditorModal';
import { VotalityRespondentsModal } from './VotalityRespondentsModal';
import { VotalityStatisticsModal } from './VotalityStatisticsModal';
import { VotalityCaptureModal } from './VotalityCaptureModal';
import { VotalityUpgradeModal } from './VotalityUpgradeModal';
import { VotalityProjectSetupModal } from './VotalityProjectSetupModal';
import { VotalityInvitationsModal } from './VotalityInvitationsModal';
import { VotalityTutorialModal } from './VotalityTutorialModal';
import { VotalityAdBanner } from './VotalityAdBanner';
import { VotalityPinDetailDrawer } from './VotalityPinDetailDrawer';
import { VotalityRelocateModal } from './VotalityRelocateModal';
import { VotalityAddonPaymentModal } from './VotalityAddonPaymentModal';
import { VotalityPremiumPaymentModal } from './VotalityPremiumPaymentModal';
import {
  searchTerritorialLocal,
  fetchReverseGeocode,
  reverseGeocodeLocal,
  GeoSearchResult,
  GeoSuggestItem,
} from '../../data/colombiaTerritoryData';

import { UserSession } from '../auth/AuthPage';
import { solicitarUbicacionGPS } from '../../utils/geolocation';
import { updateUserPlanInStore } from '../../utils/userStore';

interface VotalityDashboardProps {
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onNavigateToJoin?: (token: string) => void;
  onOpenUpgradeModal?: () => void;
  onUpdateProjectName?: (projectName: string) => void;
  onNavigateToLanding?: () => void;
}

function resolveUserRoleAndTier(
  user?: UserSession | null,
  overridePlan?: string | null
): { role: UserRole; tier: AdminPlanTier } {
  if (!user) {
    return { role: 'admin', tier: 'comunal' };
  }
  const roleUpper = (user.role || '').toUpperCase();
  const planUpper = (overridePlan || user.plan?.codigo || user.planTier || '').toUpperCase();

  if (roleUpper === 'ENCUESTADOR') {
    return { role: 'encuestador', tier: 'comunal' };
  }

  // 1. Plan Premium: Solo para la cuenta individual que lo adquirió
  if (planUpper === 'PREMIUM' || roleUpper === 'PREMIUM') {
    return { role: 'admin', tier: 'premium' };
  }

  // 2. Plan Empresarial e Institucional
  if (planUpper === 'EMPRESARIAL' || planUpper === 'INSTITUCIONAL') {
    return { role: 'admin', tier: 'departamental' };
  }

  // 3. Planes por Campaña Territorial Oficial
  if (planUpper === 'MUNICIPAL') {
    return { role: 'admin', tier: 'municipal' };
  }

  if (planUpper === 'DEPARTAMENTAL' || roleUpper === 'SUPERADMIN') {
    return { role: 'admin', tier: 'departamental' };
  }

  if (planUpper === 'COMUNAL') {
    return { role: 'admin', tier: 'comunal' };
  }

  // 4. Plan Básico (Free): Si la cuenta fue registrada gratis, se mantiene gratis a menos que mejore individualmente
  if (
    roleUpper === 'USUARIO_FREE' ||
    roleUpper === 'FREE' ||
    planUpper === 'FREE' ||
    (!planUpper && roleUpper !== 'ADMIN_CAMPANA' && roleUpper !== 'SUPERADMIN')
  ) {
    return { role: 'free', tier: 'comunal' };
  }

  return { role: 'admin', tier: 'comunal' };
}

export const VotalityDashboard: React.FC<VotalityDashboardProps> = ({ 
  currentUser,
  onLogout, 
  onNavigateToJoin,
  onOpenUpgradeModal,
  onUpdateProjectName,
  onNavigateToLanding,
}) => {
  // Plan Override para activación inmediata de Suscripción Premium en vivo (estrictamente por cuenta individual)
  const [activePlanOverride, setActivePlanOverride] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('votality_user_plan');
        localStorage.removeItem('votality_premium_paid');
      }
      if (currentUser?.email) {
        return localStorage.getItem(`votality_user_plan_${currentUser.email.trim().toLowerCase()}`);
      }
      return null;
    } catch {
      return null;
    }
  });

  // Mantener sincronizado el plan con la cuenta autenticada actual y evitar fugas entre cuentas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('votality_user_plan');
      localStorage.removeItem('votality_premium_paid');
    }
    if (currentUser?.email) {
      const planForUser = localStorage.getItem(`votality_user_plan_${currentUser.email.trim().toLowerCase()}`);
      setActivePlanOverride(planForUser);
    } else {
      setActivePlanOverride(null);
    }
  }, [currentUser?.email]);

  // Role & Plan State derived strictly from authenticated user session + override
  const { role: currentRole, tier: adminTier } = resolveUserRoleAndTier(
    currentUser,
    activePlanOverride
  );

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

  // Sectors & Active Selection
  const [sectors] = useState<CensusSectorData[]>(INITIAL_CENSUS_SECTORS);
  const [selectedSector, setSelectedSector] = useState<CensusSectorData>(INITIAL_CENSUS_SECTORS[0]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(INITIAL_CENSUS_SECTORS[0].center);

  // Form Fields Schema con persistencia y sincronización en tiempo real
  const [formFields, setFormFields] = useState<FormField[]>(() => {
    try {
      const saved = localStorage.getItem('votality_active_form_fields');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error al cargar preguntas de formulario:', e);
    }
    return INITIAL_FORM_FIELDS;
  });

  // Sincronización en tiempo real del esquema de preguntas para Administradores y Encuestadores
  useEffect(() => {
    let broadcast: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcast = new BroadcastChannel('votality_form_schema_channel');
        broadcast.onmessage = (event) => {
          if (event.data?.type === 'SCHEMA_UPDATED' && Array.isArray(event.data.fields)) {
            setFormFields(event.data.fields);
            showToast('El formulario fue actualizado con nuevas preguntas por el Administrador.', 'info');
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel no soportado:', e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'votality_active_form_fields' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setFormFields(parsed);
            showToast('Preguntas del formulario sincronizadas en tiempo real.', 'info');
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (broadcast) broadcast.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Interviewers Data (Quotas)
  const [interviewers, setInterviewers] = useState<Interviewer[]>(INITIAL_INTERVIEWERS);

  // Aislamiento Hermético de PINES por Cuenta / Campaña:
  // Regla estricta: Los pines son privados para cada cuenta registrada en la plataforma.
  // Nadie puede ver los pines ajenos. Solo puede ver los pines de esa cuenta administrador
  // si recibió un token o link oficial que le permite ser encuestador de ese administrador.
  const tenantId = useMemo(() => {
    if (currentRole === 'encuestador') {
      const fromStorage =
        localStorage.getItem('votality_encuestador_campana_id') ||
        localStorage.getItem('votality_current_campaign_id');
      return (
        currentUser?.campana_id ||
        (currentUser as any)?.campaignId ||
        fromStorage ||
        (projectName ? `camp_${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'camp-votality-default')
      );
    }
    return (
      currentUser?.campana_id ||
      (currentUser as any)?.campaignId ||
      currentUser?.id ||
      currentUser?.email ||
      'admin_camp_default'
    );
  }, [currentUser, currentRole, projectName]);

  const tenantPinsStorageKey = useMemo(() => {
    return `votality_surveys_${tenantId}`;
  }, [tenantId]);

  // Survey Records (Pins) privados cargados y sincronizados con la Base de Datos y localStorage
  const [pins, setPins] = useState<SurveyRecord[]>(() => {
    try {
      const local = localStorage.getItem(tenantPinsStorageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
      // Si es la cuenta principal inicial por defecto (admin_camp_default o admin-001) cargar los pines iniciales
      if (tenantId === 'admin_camp_default' || tenantId === 'admin-001') {
        const legacy = localStorage.getItem('votality_survey_records_v1');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          } catch {}
        }
        return INITIAL_SURVEY_PINS;
      }
      // Cualquier otra cuenta nueva inicia con su padrón privado limpio (0 pines de terceros)
      return [];
    } catch (e) {
      console.error('Error al leer encuestas guardadas localmente:', e);
      return [];
    }
  });

  // Efecto para sincronizar el padrón de pines cuando cambie el usuario o la campaña
  useEffect(() => {
    try {
      const local = localStorage.getItem(tenantPinsStorageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          setPins(parsed);
          return;
        }
      }
      if (tenantId === 'admin_camp_default' || tenantId === 'admin-001') {
        setPins(INITIAL_SURVEY_PINS);
      } else {
        setPins([]);
      }
    } catch (err) {
      console.error('Error sincronizando pines privados de la cuenta:', err);
    }
  }, [tenantPinsStorageKey, tenantId]);

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [lastSurveyedPin, setLastSurveyedPin] = useState<SurveyRecord | null>(null);
  const [inspectedPin, setInspectedPin] = useState<SurveyRecord | null>(null);
  const [lastGpsPosition, setLastGpsPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Autodetección automática de la ubicación real del usuario en Colombia al cargar el Dashboard
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setLastGpsPosition({ lat, lng });
          setMapCenter([lat, lng]);

          const localRev = reverseGeocodeLocal(lat, lng);
          if (localRev.municipio && localRev.departamento) {
            setSelectedSector((prev) => ({
              ...prev,
              name: localRev.barrio ? `${localRev.barrio} (${localRev.municipio})` : localRev.municipio,
              department: localRev.departamento,
              municipality: localRev.municipio,
              center: [lat, lng],
            }));
          }
        },
        (err) => {
          console.log('Geolocalización inicial de Dashboard no disponible o denegada:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );
    }
  }, []);

  // Sincronizar encuestas privadas desde el backend al cargar el componente
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await fetch(`/api/v1/surveys/?campaignId=${encodeURIComponent(tenantId)}`, {
          headers: {
            'x-campaign-id': tenantId,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            const isolatedSurveys = data.results.filter(
              (s: SurveyRecord) => !s.campaignId || s.campaignId === tenantId
            );
            if (isolatedSurveys.length > 0) {
              setPins(isolatedSurveys);
              localStorage.setItem(tenantPinsStorageKey, JSON.stringify(isolatedSurveys));
            }
          }
        }
      } catch (err) {
        // Modo offline / fallback
      }
    };
    fetchSurveys();
  }, [tenantId, tenantPinsStorageKey]);

  // Persistir en localStorage ante cualquier cambio (en el almacén privado de la cuenta)
  const updatePinsAndPersist = (newPins: SurveyRecord[] | ((prev: SurveyRecord[]) => SurveyRecord[])) => {
    setPins((current) => {
      const updated = typeof newPins === 'function' ? newPins(current) : newPins;
      try {
        localStorage.setItem(tenantPinsStorageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Error persistiendo encuestas privadas:', err);
      }
      return updated;
    });
  };

  // Geocoding and Search Target State
  const [searchTarget, setSearchTarget] = useState<SearchLocationTarget | null>(null);

  // Conteo de Pines Únicos acumulados por ubicación (~3 metros: 4 decimales)
  // Las encuestas en la misma ubicación se acumulan y NO consumen pines adicionales del plan
  const uniquePinLocationsCount = useMemo(() => {
    const set = new Set<string>();
    pins.forEach((p) => {
      set.add(`${p.lat.toFixed(4)},${p.lng.toFixed(4)}`);
    });
    return set.size;
  }, [pins]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [topBarFilterText, setTopBarFilterText] = useState<string>('');
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  // Filtro Territorial y de Equipo: Departamentos, Municipios y Encuestadores
  const [activeFilter, setActiveFilter] = useState<VotalityFilterSelection | null>(null);

  const displayedPins = useMemo(() => {
    if (!activeFilter) return pins;
    return pins.filter((p) => {
      if (activeFilter.type === 'departamento') {
        const dep = (p.departamento || (p.answers?.departamento as string) || '').trim().toLowerCase();
        return dep === activeFilter.value.trim().toLowerCase();
      }
      if (activeFilter.type === 'municipio') {
        const mun = (p.municipio || (p.answers?.municipio as string) || '').trim().toLowerCase();
        return mun === activeFilter.value.trim().toLowerCase();
      }
      if (activeFilter.type === 'encuestador') {
        const surveyor = (p.surveyorName || (p.answers?.encuestador as string) || '').trim().toLowerCase();
        return surveyor === activeFilter.value.trim().toLowerCase() || p.surveyorId === activeFilter.value;
      }
      return true;
    });
  }, [pins, activeFilter]);

  const handleApplyFilter = (filter: VotalityFilterSelection | null) => {
    setActiveFilter(filter);
    if (!filter) {
      showToast('Filtro eliminado · Mostrando todos los pines', 'info');
      return;
    }

    const matching = pins.filter((p) => {
      if (filter.type === 'departamento') {
        const dep = (p.departamento || (p.answers?.departamento as string) || '').trim().toLowerCase();
        return dep === filter.value.trim().toLowerCase();
      }
      if (filter.type === 'municipio') {
        const mun = (p.municipio || (p.answers?.municipio as string) || '').trim().toLowerCase();
        return mun === filter.value.trim().toLowerCase();
      }
      if (filter.type === 'encuestador') {
        const surveyor = (p.surveyorName || (p.answers?.encuestador as string) || '').trim().toLowerCase();
        return surveyor === filter.value.trim().toLowerCase() || p.surveyorId === filter.value;
      }
      return true;
    });

    if (matching.length > 0) {
      const avgLat = matching.reduce((sum, p) => sum + p.lat, 0) / matching.length;
      const avgLng = matching.reduce((sum, p) => sum + p.lng, 0) / matching.length;
      setMapCenter([avgLat, avgLng]);
      showToast(`Filtro aplicado: ${filter.label} (${matching.length} pines)`, 'info');
    } else {
      showToast(`Filtro aplicado: ${filter.label} (0 pines encontrados)`, 'info');
    }
  };

  // Modals Visibility
  const [isFormEditorOpen, setIsFormEditorOpen] = useState(false);
  const [isRespondentsOpen, setIsRespondentsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isPremiumPaymentOpen, setIsPremiumPaymentOpen] = useState(false);
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isFirstTimeTutorial, setIsFirstTimeTutorial] = useState(false);

  // Manejo de actualización de plan: Si el usuario está en Plan Gratis, se le envía a pagar el Plan Premium
  const handleOpenUpgrade = () => {
    if (currentRole === 'free') {
      setIsPremiumPaymentOpen(true);
    } else if (onOpenUpgradeModal) {
      onOpenUpgradeModal();
    } else {
      setIsUpgradeOpen(true);
    }
  };

  // Confirmación de pago y activación en vivo del Plan Premium (estrictamente para esta cuenta individual)
  const handleConfirmPremiumPayment = () => {
    setIsPremiumPaymentOpen(false);
    if (currentUser?.email) {
      const cleanEmail = currentUser.email.trim().toLowerCase();
      setActivePlanOverride('PREMIUM');
      try {
        localStorage.setItem(`votality_user_plan_${cleanEmail}`, 'PREMIUM');
        localStorage.removeItem('votality_user_plan');
        updateUserPlanInStore(cleanEmail, 'PREMIUM');
        const updatedUser = {
          ...currentUser,
          planTier: 'PREMIUM',
          role: 'ADMIN_CAMPANA',
          plan: {
            codigo: 'PREMIUM',
            nombre: 'Plan Premium',
            limite_encuestadores: 30,
            limite_pines: 1000,
          },
        };
        localStorage.setItem('votality_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
    }
    showToast(
      '¡Suscripción al Plan Premium activada exitosamente para tu cuenta! Has desbloqueado 30 encuestadores, 1.000 pines y reportes analíticos.',
      'info'
    );
  };

  // Apertura automática del tutorial en el primer ingreso al mapa tras autenticarse
  useEffect(() => {
    const userKey = `votality_tutorial_seen_${currentUser?.email || currentUser?.id || 'guest'}`;
    const globalKey = 'votality_tutorial_seen';
    const seen = localStorage.getItem(userKey) || localStorage.getItem(globalKey);
    if (!seen) {
      setIsFirstTimeTutorial(true);
      setIsTutorialOpen(true);
    }
  }, [currentUser?.email, currentUser?.id]);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    const userKey = `votality_tutorial_seen_${currentUser?.email || currentUser?.id || 'guest'}`;
    try {
      localStorage.setItem(userKey, 'true');
      localStorage.setItem('votality_tutorial_seen', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTutorialFromProfile = () => {
    setIsFirstTimeTutorial(false);
    setIsTutorialOpen(true);
  };

  // Real-time Toast Notifications (B&W)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'alert' } | null>(null);

  const showToast = (message: string, type: 'info' | 'alert' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const currentPlan = currentRole === 'free' ? PLAN_CONFIGS.free : PLAN_CONFIGS[adminTier];

  // Gestión de Paquetes Adicionales de 1.000 Pines ($350.000 COP cada uno, máx 3 compras)
  const [isAddonPaymentOpen, setIsAddonPaymentOpen] = useState(false);
  const addonStorageKey = `votality_addon_packs_${currentUser?.email || 'default'}`;
  const [purchasedAddonPacks, setPurchasedAddonPacks] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(addonStorageKey);
      return saved ? Math.min(3, Math.max(0, parseInt(saved, 10))) : 0;
    } catch {
      return 0;
    }
  });

  const maxPinsAllowed = currentPlan.maxPins + purchasedAddonPacks * 1000;

  const handleCompleteAddonPurchase = () => {
    if (purchasedAddonPacks >= 3) {
      showToast('Límite de compras adicionales alcanzado (3 de 3 paquetes).', 'alert');
      return;
    }
    const nextCount = purchasedAddonPacks + 1;
    setPurchasedAddonPacks(nextCount);
    try {
      localStorage.setItem(addonStorageKey, nextCount.toString());
    } catch (e) {
      console.error(e);
    }
    setIsAddonPaymentOpen(false);
    showToast(
      `¡Pago de $350.000 COP completado con éxito! Se han aumentado 1.000 pines a tu campaña (Nueva capacidad: ${(currentPlan.maxPins + nextCount * 1000).toLocaleString('es-CO')} pines).`,
      'info'
    );
  };

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
        `Localizado en mapa: ${target.label} (${labelTipo})`,
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
        `Localizado en mapa: ${item.label} (${labelTipo})`,
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
  // Regla: Si alguien tiene la misma ubicación de ese PIN se acumula y no se contará otro pin en el mapa
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

    const newRecordId = `pin-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const newRecord: SurveyRecord = {
      ...newSurveyData,
      id: newRecordId,
      campaignId: tenantId,
      createdAt: nowIso,
    };

    // Verificar si ya existe un pin en esta misma ubicación espacial (~8 metros de tolerancia: 0.00008° o misma dirección y municipio)
    const existingIndex = pins.findIndex((p) => {
      const sameCoords =
        Math.abs(p.lat - newSurveyData.lat) < 0.00008 &&
        Math.abs(p.lng - newSurveyData.lng) < 0.00008;
      const sameAddress =
        Boolean(p.address && newSurveyData.address) &&
        p.address.trim().toLowerCase() === newSurveyData.address.trim().toLowerCase() &&
        (p.municipio || '').toLowerCase() === (newSurveyData.municipio || '').toLowerCase();
      return sameCoords || sameAddress;
    });

    if (existingIndex !== -1) {
      // MISMA UBICACIÓN DETECTADA:
      // Se acumula en el mismo PIN predial (NO se contará otro pin en el mapa, solo se acumula)
      const existingPin = pins[existingIndex];

      const prevRespondents: RespondentRecord[] =
        existingPin.respondents && existingPin.respondents.length > 0
          ? existingPin.respondents
          : [
              {
                id: existingPin.id,
                name: existingPin.name,
                surveyorId: existingPin.surveyorId,
                surveyorName: existingPin.surveyorName,
                createdAt: existingPin.createdAt,
                answers: existingPin.answers,
                questionLabels: existingPin.questionLabels,
              },
            ];

      const newRespondent: RespondentRecord = {
        id: `resp-${Date.now().toString(36)}`,
        name: newSurveyData.name,
        surveyorId: newSurveyData.surveyorId,
        surveyorName: newSurveyData.surveyorName,
        createdAt: nowIso,
        answers: newSurveyData.answers,
        questionLabels: newSurveyData.questionLabels,
      };

      const updatedRespondents = [...prevRespondents, newRespondent];

      const updatedPin: SurveyRecord = {
        ...existingPin,
        respondents: updatedRespondents,
      };

      updatePinsAndPersist((prev) => {
        const next = [...prev];
        next[existingIndex] = updatedPin;
        return next;
      });

      setLastSurveyedPin(updatedPin);
      setSelectedPinId(updatedPin.id);
      setInspectedPin(updatedPin);
      setMapCenter([updatedPin.lat, updatedPin.lng]);

      // Sincronizar asíncronamente con la base de datos de la campaña privada
      fetch('/api/v1/surveys/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-campaign-id': tenantId,
        },
        body: JSON.stringify({
          ...newRecord,
          campaignId: tenantId,
          accumulatedAtPinId: existingPin.id,
        }),
      }).catch((e) => console.warn('Error sincronizando encuesta acumulada en BD:', e));

      showToast(
        `¡Misma ubicación detectada! Encuesta acumulada en el mismo PIN (${updatedRespondents.length} personas encuestadas aquí). No se cuenta otro PIN en el mapa.`,
        'info'
      );
      return;
    }

    // UBICACIÓN NUEVA:
    // Se crea un nuevo PIN en el mapa con su primer encuestado
    const newRecordWithRespondent: SurveyRecord = {
      ...newRecord,
      respondents: [
        {
          id: newRecord.id,
          name: newRecord.name,
          surveyorId: newRecord.surveyorId,
          surveyorName: newRecord.surveyorName,
          createdAt: newRecord.createdAt,
          answers: newRecord.answers,
          questionLabels: newRecord.questionLabels,
        },
      ],
    };

    updatePinsAndPersist((prev) => [newRecordWithRespondent, ...prev]);
    setLastSurveyedPin(newRecordWithRespondent);
    setSelectedPinId(newRecordWithRespondent.id);
    setInspectedPin(newRecordWithRespondent);
    setMapCenter([newRecordWithRespondent.lat, newRecordWithRespondent.lng]);

    // Sincronizar asíncronamente con la base de datos de la campaña privada
    fetch('/api/v1/surveys/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-campaign-id': tenantId,
      },
      body: JSON.stringify({
        ...newRecordWithRespondent,
        campaignId: tenantId,
      }),
    }).catch((e) => console.warn('Error sincronizando encuesta en BD:', e));

    showToast(
      `Encuesta de ${newRecord.name} guardada en BD. PIN georreferenciado en el mapa.`,
      'info'
    );
  };

  // Manejador para editar encuesta (sincroniza en estado local, mapa y BD)
  const handleUpdateSurvey = async (updatedRecord: SurveyRecord) => {
    updatePinsAndPersist((prev) =>
      prev.map((p) => (p.id === updatedRecord.id ? updatedRecord : p))
    );

    try {
      await fetch(`/api/v1/surveys/${encodeURIComponent(updatedRecord.id)}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord),
      });
    } catch (e) {
      console.warn('Error actualizando encuesta en BD:', e);
    }

    showToast(`Información de "${updatedRecord.name}" actualizada en la base de datos.`, 'info');
  };

  // Estados para Movimiento y Corrección Auditada de Pines (Paso 6)
  const [movingPinRecord, setMovingPinRecord] = useState<SurveyRecord | null>(null);
  const [movingPinNewCoords, setMovingPinNewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [movingPinReason, setMovingPinReason] = useState<string>('Corrección de precisión en puerta');
  const [movingPinClusterScope, setMovingPinClusterScope] = useState<'solo_registro' | 'todo_el_predio'>('solo_registro');

  const handleStartMovePin = (pin: SurveyRecord) => {
    // Permisos: Encuestador creador o Director de Campaña
    const isOwner = pin.surveyorId === (currentUser?.id || 'admin-001');
    const isAdmin = currentRole === 'admin';
    if (!isOwner && !isAdmin) {
      showToast('No tienes permisos para reubicar este pin.', 'alert');
      return;
    }

    setMovingPinRecord(pin);
    setMovingPinNewCoords({ lat: pin.lat, lng: pin.lng });
    setMovingPinReason('Corrección de precisión en puerta');
    showToast(`Modo edición activo: Ajusta las coordenadas del pin de ${pin.name}.`, 'info');
  };

  const handleConfirmRelocation = async ({
    newLat,
    newLng,
    newAddress,
    newBarrio,
    newMunicipio,
    newDepartamento,
    scope,
    reason,
  }: {
    newLat: number;
    newLng: number;
    newAddress: string;
    newBarrio?: string;
    newMunicipio?: string;
    newDepartamento?: string;
    scope: 'solo_registro' | 'todo_el_predio';
    reason: string;
  }) => {
    if (!movingPinRecord) return;

    // Validar bounds de Colombia
    if (newLat < -4.3 || newLat > 13.5 || newLng < -81.8 || newLng > -66.8) {
      showToast('La nueva ubicación se encuentra fuera de Colombia.', 'alert');
      return;
    }

    const auditEntry = {
      fecha: new Date().toISOString(),
      corregidoPor: currentUser?.name || 'Administrador',
      ubicacionAnterior: { lat: movingPinRecord.lat, lng: movingPinRecord.lng },
      ubicacionNueva: { lat: newLat, lng: newLng },
      motivo: reason,
    };

    if (scope === 'todo_el_predio') {
      // Mover todos los registros que compartían la ubicación original
      const origLat = movingPinRecord.lat;
      const origLng = movingPinRecord.lng;

      updatePinsAndPersist((prev) =>
        prev.map((p) => {
          if (Math.abs(p.lat - origLat) < 0.00008 && Math.abs(p.lng - origLng) < 0.00008) {
            return {
              ...p,
              lat: newLat,
              lng: newLng,
              address: newAddress || p.address,
              barrio: newBarrio || p.barrio,
              municipio: newMunicipio || p.municipio,
              departamento: newDepartamento || p.departamento,
              fuente: 'ajuste_manual',
              auditTrail: [...(p.auditTrail || []), auditEntry],
              answers: {
                ...p.answers,
                direccion: newAddress || p.address,
                barrio: newBarrio || p.barrio || '',
                municipio: newMunicipio || p.municipio || '',
                departamento: newDepartamento || p.departamento || '',
                fuente_ubicacion: 'ajuste_manual',
              },
            };
          }
          return p;
        })
      );
      showToast(`Todo el predio (${movingPinRecord.name} y encuestados vinculados) ha sido reubicado con éxito.`, 'info');
    } else {
      // Mover solo este registro individual
      const updated: SurveyRecord = {
        ...movingPinRecord,
        lat: newLat,
        lng: newLng,
        address: newAddress || movingPinRecord.address,
        barrio: newBarrio || movingPinRecord.barrio,
        municipio: newMunicipio || movingPinRecord.municipio,
        departamento: newDepartamento || movingPinRecord.departamento,
        fuente: 'ajuste_manual',
        auditTrail: [...(movingPinRecord.auditTrail || []), auditEntry],
        answers: {
          ...movingPinRecord.answers,
          direccion: newAddress || movingPinRecord.address,
          barrio: newBarrio || movingPinRecord.barrio || '',
          municipio: newMunicipio || movingPinRecord.municipio || '',
          departamento: newDepartamento || movingPinRecord.departamento || '',
          fuente_ubicacion: 'ajuste_manual',
        },
      };
      await handleUpdateSurvey(updated);
      showToast(`Pin de ${movingPinRecord.name} reubicado exitosamente en el minimapa.`, 'info');
    }

    setMapCenter([newLat, newLng]);
    setMovingPinRecord(null);
    setMovingPinNewCoords(null);
  };
  const handleDeleteSurvey = async (surveyId: string) => {
    const target = pins.find((p) => p.id === surveyId);
    const targetName = target ? target.name : 'la encuesta';

    updatePinsAndPersist((prev) => prev.filter((p) => p.id !== surveyId));
    if (selectedPinId === surveyId) {
      setSelectedPinId(null);
    }

    try {
      await fetch(`/api/v1/surveys/${encodeURIComponent(surveyId)}/`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Error eliminando encuesta en BD:', e);
    }

    showToast(`"${targetName}" eliminada permanentemente de la base de datos y del mapa.`, 'alert');
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

        // 3. Sincronizar searchTarget SOLO si NO es GPS directo (el GPS ya tiene su propio marcador de Corona)
        if (!isDirectGps) {
          setSearchTarget({
            lat,
            lng,
            label: rev.direccion,
            zoomLevel: 18,
            type: 'address',
          });
          setMapCenter([lat, lng]);
        }

        const accText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
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
        onOpenUpgradeModal={handleOpenUpgrade}
        onGeocodeSearch={handleGeocodeSearch}
        onSelectSuggestion={handleSelectSuggestion}
        isGeocoding={isGeocoding}
        onLogout={onLogout || (() => showToast('Sesión finalizada', 'info'))}
        externalSearchQuery={topBarFilterText}
        onNavigateToJoin={onNavigateToJoin}
        onNavigateToLanding={onNavigateToLanding || (() => (window.location.href = '/'))}
        projectName={projectName}
        currentUser={currentUser}
        onOpenTutorial={handleOpenTutorialFromProfile}
        pins={pins}
        activeFilter={activeFilter}
        onApplyFilter={handleApplyFilter}
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
        {/* Floating Active Filter Banner sobre el mapa */}
        {activeFilter && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-1.5 bg-[#0a0a0a]/95 border-2 border-[#00FF85] shadow-[0_4px_24px_rgba(0,255,133,0.35)] rounded-sm font-mono text-xs text-white animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00FF85] animate-ping" />
            <span className="font-bold text-[#00FF85] uppercase tracking-wider text-[11px]">
              {activeFilter.type}:
            </span>
            <span className="font-semibold text-white truncate max-w-xs">{activeFilter.value}</span>
            <span className="text-[#888888] text-[10px]">
              ({displayedPins.length} {displayedPins.length === 1 ? 'pin filtrado' : 'pines filtrados'})
            </span>
            <button
              onClick={() => handleApplyFilter(null)}
              className="ml-2 px-2 py-0.5 bg-[#171717] hover:bg-white hover:text-black border border-[#444444] hover:border-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Restablecer todos los pines"
            >
              <X className="w-3 h-3" />
              <span>Quitar Filtro</span>
            </button>
          </div>
        )}

        <VotalityMap
          pins={displayedPins}
          center={mapCenter}
          zoom={15}
          maxPins={maxPinsAllowed}
          selectedPinId={selectedPinId}
          searchTarget={searchTarget}
          formFields={formFields}
          onPinSelect={(pin) => {
            setSearchTarget(null);
            setSelectedPinId(pin.id);
            setInspectedPin(pin);
            setMapCenter([pin.lat, pin.lng]);
            showToast(`Cámara dirigida al PIN de: ${pin.name} (#${pin.id})`, 'info');
          }}
          onSearchLocationAdjusted={handleSearchLocationAdjusted}
          onGpsLocated={(lat, lng, accuracy) => {
            setLastGpsPosition({ lat, lng });
            handleReverseGeocodeCoordinates(lat, lng, true, accuracy);
          }}
          onGpsError={(errorMsg) => {
            showToast(errorMsg, 'alert');
          }}
          onMovePinRequest={handleStartMovePin}
        />

        {/* Drawer / Tarjeta de Información Detallada del Pin Seleccionado */}
        {inspectedPin && (
          <VotalityPinDetailDrawer
            pin={inspectedPin}
            allPinsAtLocation={pins.filter(
              (p) =>
                p.id === inspectedPin.id ||
                (Math.abs(p.lat - inspectedPin.lat) < 0.00008 &&
                  Math.abs(p.lng - inspectedPin.lng) < 0.00008) ||
                (Boolean(p.address && inspectedPin.address) &&
                  p.address.trim().toLowerCase() === inspectedPin.address.trim().toLowerCase() &&
                  (p.municipio || '').toLowerCase() === (inspectedPin.municipio || '').toLowerCase())
            )}
            formFields={formFields}
            onClose={() => setInspectedPin(null)}
            onCenterPin={(pin) => {
              setMapCenter([pin.lat, pin.lng]);
              setSelectedPinId(pin.id);
            }}
            onMovePin={(pin) => {
              setInspectedPin(null);
              handleStartMovePin(pin);
            }}
            onEditPin={(pin) => {
              setInspectedPin(null);
              setSelectedPinId(pin.id);
              setIsRespondentsOpen(true);
            }}
            canEditOrMove={
              currentRole === 'admin' ||
              inspectedPin.surveyorId === (currentUser?.id || 'admin-001')
            }
          />
        )}

        {/* Modal de Reubicación y Corrección de Pin con Minimapa Interactivo y Cambio de Dirección */}
        {movingPinRecord && (
          <VotalityRelocateModal
            pin={movingPinRecord}
            onClose={() => {
              setMovingPinRecord(null);
              setMovingPinNewCoords(null);
            }}
            onConfirmRelocation={handleConfirmRelocation}
          />
        )}

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
              onClick={handleOpenUpgrade}
              className="shrink-0 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#000000] bg-[#FFFFFF] hover:bg-[#e5e5e5] px-2.5 py-1 rounded-sm font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>Mejorar Plan</span>
            </button>
          </div>
        )}

        {/* Indicador de Sincronización en Tiempo Real y Botón Comprar 1.000 Pines Más */}
        <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2">
          {/* Badge de Sincronización */}
          <div className="bg-[#000000]/90 backdrop-blur-sm border border-[#333333] px-3 py-1.5 rounded-sm flex items-center gap-2 text-[10px] font-mono text-[#aaaaaa] shadow-lg select-none">
            <Radio className="w-3.5 h-3.5 text-[#00FF85] animate-pulse" />
            <span className="text-[#FFFFFF] font-bold tracking-wider">SINCRONIZACIÓN EN TIEMPO REAL</span>
            <span className="text-[#444444]">|</span>
            <span className="text-[#FFFFFF] font-bold">
              {uniquePinLocationsCount} / {maxPinsAllowed.toLocaleString('es-CO')} PINES
            </span>
            {purchasedAddonPacks > 0 && (
              <span className="text-[9px] text-amber-300 bg-amber-950/70 border border-[#D4AF37]/50 px-1.5 py-0.2 rounded-xs font-bold">
                (+{(purchasedAddonPacks * 1000).toLocaleString('es-CO')} PINES EXTRA)
              </span>
            )}
            {pins.length > uniquePinLocationsCount && (
              <span className="text-[9px] text-[#888888] bg-[#1a1a1a] px-1 py-0.2 rounded-xs">
                ({pins.length} encuestas acumuladas)
              </span>
            )}
          </div>

          {/* Botón: Comprar 1.000 Pines más con marco dorado (Solo hasta 3 compras, sin precio en el botón) */}
          {currentRole !== 'encuestador' && (
            purchasedAddonPacks < 3 ? (
              <button
                id="btn-comprar-pines-addon"
                onClick={() => setIsAddonPaymentOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#000000]/95 hover:bg-[#1a1505] text-[#F59E0B] hover:text-[#FBBF24] border-2 border-[#D4AF37] hover:border-[#FBBF24] rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_18px_rgba(212,175,55,0.25)] hover:shadow-[0_4px_24px_rgba(212,175,55,0.45)] transition-all cursor-pointer active:scale-95 group"
                title={`Comprar 1.000 pines adicionales (${purchasedAddonPacks}/3 compras realizadas)`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>Comprar 1.000 Pines más</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#261c04] border border-[#D4AF37]/40 text-amber-300 rounded-xs font-bold">
                  {purchasedAddonPacks}/3
                </span>
              </button>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a]/90 text-[#887744] border-2 border-[#665522] rounded-sm font-mono text-[10px] uppercase tracking-wider opacity-85 select-none"
                title="Has alcanzado el tope máximo de 3 compras adicionales (+3.000 pines en total)"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Límite de ampliación alcanzado (+3.000 Pines)</span>
              </div>
            )
          )}
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
            try {
              localStorage.setItem('votality_active_form_fields', JSON.stringify(updated));
              if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                const bc = new BroadcastChannel('votality_form_schema_channel');
                bc.postMessage({ type: 'SCHEMA_UPDATED', fields: updated });
                bc.close();
              }
            } catch (err) {
              console.error('Error guardando esquema de preguntas:', err);
            }
            showToast('Esquema de preguntas actualizado y sincronizado en tiempo real para todos los encuestadores.', 'info');
          }}
          onClose={() => setIsFormEditorOpen(false)}
          userRole={currentRole}
        />
      )}

      {isRespondentsOpen && (
        <VotalityRespondentsModal
          records={pins}
          formFields={formFields}
          onClose={() => setIsRespondentsOpen(false)}
          onLocateOnMap={(record) => {
            setSearchTarget(null);
            setSelectedPinId(record.id);
            setInspectedPin(record);
            setMapCenter([record.lat, record.lng]);
            showToast(`Cámara dirigida al PIN de: ${record.name}`, 'info');
          }}
          onUpdateRecord={handleUpdateSurvey}
          onDeleteRecord={handleDeleteSurvey}
        />
      )}

      {isStatisticsOpen && (
        <VotalityStatisticsModal
          records={pins}
          interviewers={interviewers}
          onClose={() => setIsStatisticsOpen(false)}
          onLocateOnMap={(record) => {
            setSearchTarget(null);
            setSelectedPinId(record.id);
            setInspectedPin(record);
            setMapCenter([record.lat, record.lng]);
            showToast(`Cámara dirigida al PIN de: ${record.name}`, 'info');
          }}
          isFreePlan={currentRole === 'free'}
          adminTier={adminTier}
          projectName={projectName}
          userRole={currentRole}
          currentUser={currentUser}
          formFields={formFields}
          onUpgrade={() => {
            setIsStatisticsOpen(false);
            handleOpenUpgrade();
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
          initialLat={lastGpsPosition?.lat ?? (searchTarget?.type === 'address' ? searchTarget.lat : undefined)}
          initialLng={lastGpsPosition?.lng ?? (searchTarget?.type === 'address' ? searchTarget.lng : undefined)}
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

      {/* Modal / Card Carrusel de Tutoriales en Video Oficiales */}
      <VotalityTutorialModal
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        isFirstTime={isFirstTimeTutorial}
      />

      {/* Modal de Pago para Paquete Adicional de 1.000 Pines ($350.000 COP, máx 3 compras) */}
      <VotalityAddonPaymentModal
        isOpen={isAddonPaymentOpen}
        onClose={() => setIsAddonPaymentOpen(false)}
        onConfirmPayment={handleCompleteAddonPurchase}
        currentMaxPins={maxPinsAllowed}
        purchasedCount={purchasedAddonPacks}
        userEmail={currentUser?.email}
        userName={currentUser?.name}
      />

      {/* Modal de Pago Directo para Plan Premium ($120.000 COP / mes) */}
      <VotalityPremiumPaymentModal
        isOpen={isPremiumPaymentOpen}
        onClose={() => setIsPremiumPaymentOpen(false)}
        onConfirmPayment={handleConfirmPremiumPayment}
        userEmail={currentUser?.email}
        userName={currentUser?.name}
      />
    </div>
  );
};

