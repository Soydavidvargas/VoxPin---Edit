/**
 * geocodingTypes.ts
 * Definiciones de tipos para el motor de geocodificación en cascada,
 * validación territorial y confirmación obligatoria de pines en Colombia.
 */

export type PrecisionLevel = 'EXACTA' | 'APROXIMADA' | 'SOLO_MUNICIPIO';

export type GeocodeSource = 'gps' | 'direccion' | 'ajuste_manual' | 'barrio' | 'municipio';

export type GoogleLocationType = 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';

export interface StructuredAddressInput {
  departamento: string;
  municipio: string;
  municipioCodigoDane?: string;
  direccionTexto?: string; // Dirección completa o compuesta en un solo campo
  tipoVia?: string;        // ej: 'Calle', 'Carrera', 'Diagonal', 'Transversal', 'Avenida'
  numeroVia?: string;      // ej: '73', '23', '17' o '23 # 6-13'
  letraVia?: string;       // ej: 'A', 'B'
  bis?: boolean;          // true si es Bis
  cuadranteVia?: string;  // 'Sur', 'Norte', 'Este', 'Oeste'
  cruceTipoVia?: string;  // 'Carrera', 'Calle', etc.
  numeroCruce?: string;    // ej: '80', '6', '14'
  letraCruce?: string;    // ej: 'A'
  cuadranteCruce?: string;// 'Sur', 'Norte', 'Este', 'Oeste'
  numeroPredio?: string;   // ej: '15', '13', '34' (placa)
  barrio: string;         // ej: 'Bosa Laureles', 'Panamá', 'Villa del Prado'
  complemento?: string;   // ej: 'Torre 2', 'Bloque B', 'Casa 14'
  detalle?: string;       // ej: 'Apto 301', 'Piso 2'
}

export interface GeocodeCandidate {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  precision: PrecisionLevel;
  locationType: GoogleLocationType;
  score: number;
  distanceToBarrioKm?: number;
  distanceToGpsMeters?: number;
  warnings: string[];
  reasons: string[];
  matchedComponents: {
    route?: string;
    streetNumber?: string;
    neighborhood?: string;
    locality?: string;
    administrativeArea?: string;
    country?: string;
  };
  step: 'a_normalizada' | 'b_barrio' | 'c_places' | 'd_via' | 'e_barrio_centro' | 'f_municipio';
}

export interface CascadeGeocodeResult {
  selected: GeocodeCandidate;
  candidates: GeocodeCandidate[];
  hasTieConflict: boolean; // Si los 2 mejores están a más de 300m
  tieCandidates?: [GeocodeCandidate, GeocodeCandidate];
  municipioBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  barrioCenter?: { lat: number; lng: number };
  normalizedAddressString: string;
  explanation: string;
  debugTrace?: Array<{
    step: string;
    attemptQuery: string;
    candidatesFound: number;
    notes?: string;
  }>;
}

export interface AuditMovementRecord {
  id: string;
  pinId: string;
  ubicacionOriginal: { lat: number; lng: number; address?: string };
  ubicacionNueva: { lat: number; lng: number; address?: string };
  corregidoPor: string;
  fecha: string;
  motivo: string;
  modo: 'solo_registro' | 'todo_el_predio';
  registrosAfectados?: string[];
}

