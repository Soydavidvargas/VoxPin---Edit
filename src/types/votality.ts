export type UserRole = 'admin' | 'free' | 'encuestador';

export type AdminPlanTier = 'comunal' | 'municipal' | 'departamental';

export interface PlanLimits {
  tier: AdminPlanTier | 'free';
  name: string;
  maxInterviewers: number;
  maxPins: number; // 100 for Free, unlimited for paid
  allowStatistics: boolean;
  allowInterviewerManagement: boolean;
  hasAds: boolean;
}

export const PLAN_CONFIGS: Record<AdminPlanTier | 'free', PlanLimits> = {
  free: {
    tier: 'free',
    name: 'Plan Básico (Free)',
    maxInterviewers: 0,
    maxPins: 100,
    allowStatistics: true, // Estadísticas básicas con censura de métricas avanzadas
    allowInterviewerManagement: false,
    hasAds: true,
  },
  comunal: {
    tier: 'comunal',
    name: 'Campaña Comunal',
    maxInterviewers: 15,
    maxPins: 10000,
    allowStatistics: true,
    allowInterviewerManagement: true,
    hasAds: false,
  },
  municipal: {
    tier: 'municipal',
    name: 'Campaña Municipal',
    maxInterviewers: 50,
    maxPins: 50000,
    allowStatistics: true,
    allowInterviewerManagement: true,
    hasAds: false,
  },
  departamental: {
    tier: 'departamental',
    name: 'Campaña Departamental',
    maxInterviewers: 200,
    maxPins: 250000,
    allowStatistics: true,
    allowInterviewerManagement: true,
    hasAds: false,
  },
};

export interface Interviewer {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  sessionToken: string;
  isActive: boolean;
  totalSurveys: number;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
  isDefault?: boolean; // 'Nombre' and 'Dirección' are locked defaults
}

export interface SurveyRecord {
  id: string;
  campaignId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  answers: Record<string, string | number | boolean>;
  surveyorId: string;
  surveyorName: string;
  createdAt: string;
  censusSector: string;
}

export interface SearchLocationTarget {
  lat: number;
  lng: number;
  label: string;
  bbox?: [[number, number], [number, number]] | [number, number, number, number];
  zoomLevel: number;
  type: 'address' | 'municipality' | 'department' | 'localidad' | 'comuna' | 'barrio';
}

export interface CensusSectorData {
  id: string;
  name: string;
  code: string;
  department: string;
  municipality: string;
  totalPopulation: number;
  sampleGoal: number;
  center: [number, number]; // [lat, lng]
}

