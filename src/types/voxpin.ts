export interface SurveyOption {
  id: string;
  text: string;
  color: string; // Hex color for pins
  bgClass?: string;
  count: number;
  percentage: number;
}

export interface Survey {
  id: string;
  title: string;
  question: string;
  targetArea: string;
  category: 'politica' | 'mercado' | 'empresas' | 'instituciones';
  options: SurveyOption[];
  totalResponses: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  cedula: string;
  phone: string;
  relationship: string;
  answerOptionId: string;
  notes?: string;
}

export interface SurveyPin {
  id: string;
  name: string;
  age: number;
  cedula: string;
  phone: string;
  address: string;
  neighborhood: string;
  locality: string;
  locationType: 'exact' | 'neighborhood_only';
  lat: number;
  lng: number;
  surveyId: string;
  answerOptionId: string;
  familyMembers?: FamilyMember[]; // For clustering at same address
  surveyorName: string;
  surveyorId: string;
  timestamp: string;
}

export type PlanType = 'basico' | 'premium' | 'campana';

export interface CompanyVerification {
  type: 'automatic' | 'manual';
  companyName: string;
  nit: string;
  corporateEmail: string;
  documentName?: string;
  status: 'verified' | 'pending' | 'unverified';
}
