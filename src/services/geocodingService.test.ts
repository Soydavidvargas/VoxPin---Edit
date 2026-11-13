import { describe, it, expect } from 'vitest';
import {
  buildNormalizedAddress,
  haversineDistanceKm,
  scoreCandidate,
  geocodeCascade,
} from './geocodingService';
import { StructuredAddressInput, GeocodeCandidate } from './geocodingTypes';

describe('Motor de Geocodificación y Verificación Territorial Colombia', () => {
  it('Paso 1: Construye la dirección normalizada sin placeholders ni textos residuales', () => {
    const input: StructuredAddressInput = {
      departamento: 'Bogotá D.C.',
      municipio: 'Bogotá',
      tipoVia: 'Calle',
      numeroVia: '73',
      letraVia: '',
      bis: false,
      cuadranteVia: 'Sur',
      numeroCruce: '80',
      letraCruce: '',
      cuadranteCruce: '',
      numeroPredio: '15',
      barrio: 'Bosa Laureles',
    };

    const normalized = buildNormalizedAddress(input);
    expect(normalized).toBe('Calle 73 Sur # 80 - 15');
  });

  it('Paso 1b: Maneja sufijos de letras y bis correctamente', () => {
    const input: StructuredAddressInput = {
      departamento: 'Huila',
      municipio: 'Campoalegre',
      tipoVia: 'Calle',
      numeroVia: '23',
      letraVia: 'A',
      bis: true,
      cuadranteVia: '',
      numeroCruce: '6',
      letraCruce: 'B',
      cuadranteCruce: '',
      numeroPredio: '13',
      barrio: 'Panamá',
    };

    const normalized = buildNormalizedAddress(input);
    expect(normalized).toBe('Calle 23 A Bis # 6 B - 13');
  });

  it('Paso 4: Penaliza fuertemente a candidatos que contradigan el cuadrante cardinal (ej: Sur vs Norte)', () => {
    const input: StructuredAddressInput = {
      departamento: 'Bogotá D.C.',
      municipio: 'Bogotá',
      tipoVia: 'Calle',
      numeroVia: '73',
      cuadranteVia: 'Sur',
      numeroCruce: '80',
      numeroPredio: '15',
      barrio: 'Bosa Laureles',
    };

    const candidateNorte: GeocodeCandidate = {
      id: 'c-norte',
      label: 'Calle 73 Norte # 80 - 15, Bogotá',
      address: 'calle 73 norte # 80 - 15, bogota',
      lat: 4.705,
      lng: -74.07,
      precision: 'APROXIMADA',
      locationType: 'RANGE_INTERPOLATED',
      score: 50,
      warnings: [],
      reasons: [],
      matchedComponents: {},
      step: 'a_normalizada',
    };

    const score = scoreCandidate(candidateNorte, input, { lat: 4.6075, lng: -74.1945 });
    expect(candidateNorte.warnings.some((w) => w.includes('Sur pero el punto apunta al Norte'))).toBe(true);
    expect(score).toBeLessThan(40);
  });

  it('Paso 4b: Bonifica cercanía estricta al centroide del barrio indicado', () => {
    const input: StructuredAddressInput = {
      departamento: 'Huila',
      municipio: 'Campoalegre',
      tipoVia: 'Calle',
      numeroVia: '23',
      numeroCruce: '6',
      numeroPredio: '13',
      barrio: 'Panamá',
    };

    const candidatePanama: GeocodeCandidate = {
      id: 'c-panama',
      label: 'Calle 23 # 6 - 13, Panamá, Campoalegre',
      address: 'calle 23 # 6 - 13, panama, campoalegre',
      lat: 2.6895,
      lng: -75.3245,
      precision: 'EXACTA',
      locationType: 'ROOFTOP',
      score: 50,
      warnings: [],
      reasons: [],
      matchedComponents: {},
      step: 'a_normalizada',
    };

    const score = scoreCandidate(candidatePanama, input, { lat: 2.6895, lng: -75.3245 });
    expect(candidatePanama.distanceToBarrioKm).toBeLessThanOrEqual(0.1);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('Paso 3: Caso Bosa Laureles queda en el sur de Bogotá (~4.6075, -74.1945), nunca en el norte', async () => {
    const input: StructuredAddressInput = {
      departamento: 'Bogotá D.C.',
      municipio: 'Bogotá',
      tipoVia: 'Calle',
      numeroVia: '73',
      cuadranteVia: 'Sur',
      numeroCruce: '80',
      numeroPredio: '15',
      barrio: 'Bosa Laureles',
    };

    const result = await geocodeCascade(input);
    expect(result.selected.lat).toBeLessThan(4.65); // Zona Sur de Bogotá
    expect(result.selected.lat).toBeGreaterThan(4.55);
    expect(result.selected.lng).toBeLessThan(-74.15); // Zona Suroccidental (Bosa)
  });

  it('Paso 3b: Caso Campoalegre Panamá queda dentro de Campoalegre (~2.689, -75.324)', async () => {
    const input: StructuredAddressInput = {
      departamento: 'Huila',
      municipio: 'Campoalegre',
      tipoVia: 'Calle',
      numeroVia: '23',
      numeroCruce: '6',
      numeroPredio: '13',
      barrio: 'Panamá',
    };

    const result = await geocodeCascade(input);
    expect(result.selected.lat).toBeGreaterThan(2.65);
    expect(result.selected.lat).toBeLessThan(2.72);
    expect(result.selected.lng).toBeGreaterThan(-75.35);
    expect(result.selected.lng).toBeLessThan(-75.30);
  });
});

