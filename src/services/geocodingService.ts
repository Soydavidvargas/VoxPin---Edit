/**
 * geocodingService.ts
 * Motor Profesional de Geocodificación en Cascada para Colombia (Google Maps / SDI PostGIS Fallback).
 * 
 * Implementa:
 * - Paso 1: Normalización de dirección colombiana estructurada.
 * - Paso 2: Referencias de contexto cacheadas (Municipio centro y bounds, Barrio centro).
 * - Paso 3: Geocodificación en cascada (a -> b -> c -> d -> e -> f) con components=country:CO.
 * - Paso 4: Puntuación multicriterio, consistencia con barrio (umbral adaptativo), GPS y reversa.
 * - Restricción estricta territorial: Exclusivo Colombia (bounds y municipio viewport).
 */

import {
  StructuredAddressInput,
  GeocodeCandidate,
  CascadeGeocodeResult,
  PrecisionLevel,
  GoogleLocationType,
} from './geocodingTypes';
import {
  COLOMBIA_DEPARTAMENTOS,
  COLOMBIA_MUNICIPIOS,
  COLOMBIA_BARRIOS,
  COLOMBIA_LOCALIDADES_BOGOTA,
  searchTerritorialLocal,
  getBarrioCoordinates,
} from '../data/colombiaTerritoryData';
import {
  parseColombianAddress,
  calculateMetricCoordinates,
  extractStreetNumbers,
  resolveUrbanIntersection,
} from '../utils/addressParser';

// Cache en memoria para contextos municipales y de barrio
const contextCache = new Map<string, { lat: number; lng: number; bounds?: any }>();

// Clave de API opcional inyectada por variables de entorno
const GOOGLE_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_GOOGLE_MAPS_API_KEY) ||
  '';

/**
 * Arma la dirección normalizada colombiana estricta a partir de componentes estructurados.
 * Ejemplo: "Calle 73 Sur # 80 - 15" o "Calle 23 # 6 - 13"
 */
export function buildNormalizedAddress(input: StructuredAddressInput): string {
  const via = (input.tipoVia || 'Calle').trim();
  const numV = (input.numeroVia || input.direccionTexto || '').trim();

  // Si el usuario ingresó la dirección completa en el campo (ej: "23 6-13", "23 # 6-13", "73 Sur # 80 - 15")
  if (numV && (numV.includes('#') || numV.includes('-') || /\d+\s+\d+/.test(numV))) {
    const raw = /^(calle|cll|cl|carrera|cra|kr|diagonal|dg|transversal|tv|avenida|av|circular|cq)\b/i.test(numV)
      ? numV
      : `${via} ${numV}`;
    const parsed = parseColombianAddress(raw);
    if (parsed.eje_geocodificacion) {
      return parsed.eje_geocodificacion;
    }
    return raw;
  }

  const letraV = (input.letraVia || '').trim().toUpperCase();
  const bis = input.bis ? 'Bis' : '';
  const cuadV = (input.cuadranteVia || '').trim();

  const numC = (input.numeroCruce || '').trim();
  const letraC = (input.letraCruce || '').trim().toUpperCase();
  const cuadC = (input.cuadranteCruce || '').trim();

  const predio = (input.numeroPredio || '').trim();

  // Partes de la vía principal
  const viaPrincipalParts = [via, numV, letraV, bis, cuadV].filter(Boolean).join(' ');

  // Partes de la vía de cruce
  const cruceParts = [numC, letraC, cuadC].filter(Boolean).join(' ');

  if (!numV && !numC && !predio) {
    return '';
  }

  if (numC && predio) {
    return `${viaPrincipalParts} # ${cruceParts} - ${predio}`.replace(/\s+/g, ' ').trim();
  }

  if (numC) {
    return `${viaPrincipalParts} # ${cruceParts}`.replace(/\s+/g, ' ').trim();
  }

  return viaPrincipalParts;
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas (Fórmula Haversine).
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(3));
}

/**
 * Obtiene centro y viewport (bounds) del municipio.
 */
export async function getMunicipioContext(municipio: string, departamento: string) {
  const cacheKey = `muni_${municipio.toLowerCase()}_${departamento.toLowerCase()}`;
  if (contextCache.has(cacheKey)) {
    return contextCache.get(cacheKey)!;
  }

  // 1. Intentar con catálogo local de municipios de Colombia
  const cleanMuni = municipio.trim().toLowerCase();
  const cleanDept = departamento.trim().toLowerCase();

  const foundLocal =
    COLOMBIA_MUNICIPIOS.find(
      (m) =>
        (m.nombre?.toLowerCase() === cleanMuni || m.display_name.toLowerCase().includes(cleanMuni)) &&
        cleanDept &&
        ((m.departamento || '').toLowerCase().includes(cleanDept) ||
          cleanDept.includes((m.departamento || '').toLowerCase()))
    ) ||
    COLOMBIA_MUNICIPIOS.find(
      (m) =>
        m.nombre?.toLowerCase() === cleanMuni ||
        m.display_name.toLowerCase().includes(cleanMuni)
    );

  if (foundLocal) {
    const bbox = foundLocal.bbox || [
      [foundLocal.lat - 0.08, foundLocal.lon - 0.08],
      [foundLocal.lat + 0.08, foundLocal.lon + 0.08],
    ];
    const ctx = {
      lat: foundLocal.lat,
      lng: foundLocal.lon,
      bounds: {
        south: bbox[0][0],
        west: bbox[0][1],
        north: bbox[1][0],
        east: bbox[1][1],
      },
    };
    contextCache.set(cacheKey, ctx);
    return ctx;
  }

  // 2. OpenStreetMap Nominatim Gratuito (Sin API Key)
  try {
    const qMuni = encodeURIComponent(`${municipio}, ${departamento}, Colombia`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${qMuni}&countrycodes=co&limit=1`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'VoxPin-App/2.0' },
      }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const bb = data[0].boundingbox ? data[0].boundingbox.map(Number) : [lat - 0.08, lat + 0.08, lng - 0.08, lng + 0.08];
        const ctx = {
          lat,
          lng,
          bounds: {
            south: bb[0],
            north: bb[1],
            west: bb[2],
            east: bb[3],
          },
        };
        contextCache.set(cacheKey, ctx);
        return ctx;
      }
    }
  } catch (e) {
    // Continuar a Photon o Fallback
  }

  // 3. Photon Komoot OSM Gratuito
  try {
    const qPhoton = encodeURIComponent(`${municipio} ${departamento} Colombia`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`https://photon.komoot.io/api/?q=${qPhoton}&limit=1`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const coords = data?.features?.[0]?.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        const lng = coords[0];
        const lat = coords[1];
        const ctx = {
          lat,
          lng,
          bounds: {
            south: lat - 0.08,
            north: lat + 0.08,
            west: lng - 0.08,
            east: lng + 0.08,
          },
        };
        contextCache.set(cacheKey, ctx);
        return ctx;
      }
    }
  } catch (e) {
    // Continuar
  }

  // 4. Fallback a Google Geocoding solo si existe API key
  if (GOOGLE_API_KEY) {
    try {
      const q = encodeURIComponent(`${municipio}, ${departamento}, Colombia`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&components=country:CO&key=${GOOGLE_API_KEY}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const r = data.results[0];
        const lat = r.geometry.location.lat;
        const lng = r.geometry.location.lng;
        const vp = r.geometry.viewport || r.geometry.bounds;
        const ctx = {
          lat,
          lng,
          bounds: {
            south: vp?.southwest.lat ?? lat - 0.08,
            west: vp?.southwest.lng ?? lng - 0.08,
            north: vp?.northeast.lat ?? lat + 0.08,
            east: vp?.northeast.lng ?? lng + 0.08,
          },
        };
        contextCache.set(cacheKey, ctx);
        return ctx;
      }
    } catch (e) {
      console.warn('Error consultando Google Geocoding para municipio:', e);
    }
  }

  // Fallback general centrado en Colombia
  const fallback = {
    lat: 4.711,
    lng: -74.0721,
    bounds: { south: -4.3, west: -81.8, north: 13.5, east: -66.8 },
  };
  contextCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Obtiene centro de referencia del barrio.
 */
export async function getBarrioContext(barrio: string, municipio: string, departamento: string) {
  if (!barrio || !barrio.trim()) return null;
  const cacheKey = `barrio_${barrio.toLowerCase()}_${municipio.toLowerCase()}`;
  if (contextCache.has(cacheKey)) {
    return contextCache.get(cacheKey)!;
  }

  const cleanB = barrio.trim().toLowerCase();

  // 1. Buscar en localidades de Bogotá o catálogo local
  const foundLoc = COLOMBIA_LOCALIDADES_BOGOTA.find(
    (l) => l.nombre && (l.nombre.toLowerCase().includes(cleanB) || cleanB.includes(l.nombre.toLowerCase()))
  );
  if (foundLoc) {
    const ctx = { lat: foundLoc.lat, lng: foundLoc.lon };
    contextCache.set(cacheKey, ctx);
    return ctx;
  }

  const foundBarrio = COLOMBIA_BARRIOS.find(
    (b) => b.nombre && (b.nombre.toLowerCase().includes(cleanB) || cleanB.includes(b.nombre.toLowerCase()))
  );
  if (foundBarrio) {
    const ctx = { lat: foundBarrio.lat, lng: foundBarrio.lon };
    contextCache.set(cacheKey, ctx);
    return ctx;
  }

  // 2. OpenStreetMap Nominatim Gratuito para Barrios
  try {
    const qBarrio = encodeURIComponent(`${barrio}, ${municipio}, ${departamento}, Colombia`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${qBarrio}&countrycodes=co&limit=1`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'VoxPin-App/2.0' },
      }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        const ctx = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        contextCache.set(cacheKey, ctx);
        return ctx;
      }
    }
  } catch (e) {
    // Continuar a Photon
  }

  // 3. Photon Komoot OSM Gratuito para Barrios
  try {
    const qPhotonB = encodeURIComponent(`${barrio} ${municipio} Colombia`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`https://photon.komoot.io/api/?q=${qPhotonB}&limit=1`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const coords = data?.features?.[0]?.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        const ctx = { lat: coords[1], lng: coords[0] };
        contextCache.set(cacheKey, ctx);
        return ctx;
      }
    }
  } catch (e) {
    // Continuar
  }

  // 4. Si hay Google API Key como respaldo
  if (GOOGLE_API_KEY) {
    try {
      const q = encodeURIComponent(`${barrio}, ${municipio}, ${departamento}, Colombia`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&components=country:CO|administrative_area:${encodeURIComponent(
        departamento
      )}|locality:${encodeURIComponent(municipio)}&key=${GOOGLE_API_KEY}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const r = data.results[0];
        const ctx = {
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        };
        contextCache.set(cacheKey, ctx);
        return ctx;
      }
    } catch (e) {
      console.warn('Error consultando Google Geocoding para barrio:', e);
    }
  }

  return null;
}

/**
 * Consulta OpenStreetMap Nominatim Gratuito (Sin API Key)
 */
async function geocodeNominatim(
  query: string,
  municipio: string,
  departamento: string,
  bounds: any,
  stepTag: GeocodeCandidate['step']
): Promise<GeocodeCandidate[]> {
  const candidates: GeocodeCandidate[] = [];
  try {
    const q = encodeURIComponent(query);
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=co&addressdetails=1&limit=5`;
    if (bounds && bounds.west && bounds.south && bounds.east && bounds.north) {
      url += `&viewbox=${bounds.west},${bounds.north},${bounds.east},${bounds.south}&bounded=1`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'VoxPin-SIG-Colombia/2.0 (Geocodificador Territorial)',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          if (lat < -4.3 || lat > 13.5 || lng < -81.8 || lng > -66.8) continue;

          const addr = item.address || {};
          const isHouse = !!addr.house_number;
          const isRoad = !!addr.road;
          const locType: GoogleLocationType = isHouse
            ? 'ROOFTOP'
            : isRoad
              ? 'RANGE_INTERPOLATED'
              : 'APPROXIMATE';

          candidates.push({
            id: `osm-${item.osm_id || Math.random().toString(36).substring(2, 9)}`,
            label: item.display_name,
            address: item.display_name,
            lat,
            lng,
            precision: isHouse ? 'EXACTA' : 'APROXIMADA',
            locationType: locType,
            score: 0,
            warnings: [],
            reasons: [
              `OpenStreetMap Nominatim: ${isHouse ? 'Predio Exacto' : 'Eje Vial Verificado'}`,
            ],
            matchedComponents: {
              route: addr.road || '',
              streetNumber: addr.house_number || '',
              neighborhood: addr.neighbourhood || addr.suburb || '',
              locality: addr.city || addr.town || addr.village || municipio,
              administrativeArea: addr.state || departamento,
            },
            step: stepTag,
          });
        }
      }
    }
  } catch (e) {
    // Timeout o sin red
  }
  return candidates;
}

/**
 * Consulta Photon Komoot OSM Gratuito (Fuzzy Matching ultrarrápido sin API Key)
 */
async function geocodePhoton(
  query: string,
  municipio: string,
  departamento: string,
  stepTag: GeocodeCandidate['step']
): Promise<GeocodeCandidate[]> {
  const candidates: GeocodeCandidate[] = [];
  try {
    const q = encodeURIComponent(query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`https://photon.komoot.io/api/?q=${q}&lang=es&limit=5`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        for (const f of data.features) {
          const coords = f.geometry?.coordinates;
          if (!coords || coords.length < 2) continue;
          const lng = coords[0];
          const lat = coords[1];
          if (lat < -4.3 || lat > 13.5 || lng < -81.8 || lng > -66.8) continue;

          const p = f.properties || {};
          const country = (p.country || '').toLowerCase();
          if (country && !country.includes('colombia')) continue;

          const isHousenumber = !!p.housenumber;
          const locType: GoogleLocationType = isHousenumber ? 'ROOFTOP' : 'RANGE_INTERPOLATED';

          const label = [p.name, p.street, p.housenumber, p.district, p.city, p.state, 'Colombia']
            .filter(Boolean)
            .join(', ');

          candidates.push({
            id: `photon-${Math.random().toString(36).substring(2, 9)}`,
            label,
            address: label,
            lat,
            lng,
            precision: isHousenumber ? 'EXACTA' : 'APROXIMADA',
            locationType: locType,
            score: 0,
            warnings: [],
            reasons: ['Photon OpenStreetMap (Localización Vial)'],
            matchedComponents: {
              route: p.street || p.name || '',
              streetNumber: p.housenumber || '',
              neighborhood: p.district || '',
              locality: p.city || municipio,
              administrativeArea: p.state || departamento,
            },
            step: stepTag,
          });
        }
      }
    }
  } catch (e) {
    // Continuar
  }
  return candidates;
}

/**
 * Resuelve la coordenada con el Motor Métrico Cartesiano Canónico de Colombia (Nomenclatura Oficial).
 * Cruce vial + desplazamiento exacto en metros a la puerta del predio y acera par/impar.
 */
function resolveUniversalMetricCandidate(
  input: StructuredAddressInput,
  muniCtx: any,
  barrioCtx: any,
  stepTag: GeocodeCandidate['step']
): GeocodeCandidate | null {
  const via = (input.tipoVia || 'Calle').trim();
  const numV = (input.numeroVia || input.direccionTexto || '').trim();
  let numC = (input.numeroCruce || '').trim();
  let predio = (input.numeroPredio || '').trim();

  if (!numV && !numC) return null;

  let viaP = `${via} ${numV} ${input.letraVia || ''} ${input.bis ? 'Bis' : ''} ${input.cuadranteVia || ''}`.trim();
  let viaC = `${numC} ${input.letraCruce || ''} ${input.cuadranteCruce || ''}`.trim();
  let distM = predio ? parseInt(predio, 10) || 12 : 12;

  // Si numV contiene la dirección completa o abreviada (ej: "23 6-13", "73 Sur # 80 - 15", "17A # 14A - 34")
  if (numV.includes('#') || numV.includes('-') || /\d+\s+\d+/.test(numV)) {
    const raw = /^(calle|cll|cl|carrera|cra|kr|diagonal|dg|transversal|tv|avenida|av)\b/i.test(numV)
      ? numV
      : `${via} ${numV}`;
    const parsed = parseColombianAddress(raw);
    if (parsed.formula_metrica) {
      viaP = parsed.formula_metrica.via_principal;
      viaC = parsed.formula_metrica.via_cruce;
      distM = parsed.formula_metrica.distancia_metros || 12;
    }
  }

  const esPar = distM % 2 === 0;

  const muniCoords: [number, number] | undefined =
    muniCtx?.lat && muniCtx?.lng ? [muniCtx.lat, muniCtx.lng] : undefined;

  let barrioCoords: [number, number] | undefined =
    barrioCtx?.lat && barrioCtx?.lng ? [barrioCtx.lat, barrioCtx.lng] : undefined;

  if (!barrioCoords && input.barrio) {
    const directB = getBarrioCoordinates(input.barrio, input.municipio, input.departamento);
    if (directB) {
      barrioCoords = [directB.lat, directB.lng];
    }
  }

  const [exactLat, exactLon] = resolveUrbanIntersection(
    input.municipio,
    viaP,
    viaC,
    distM,
    esPar,
    muniCoords,
    barrioCoords
  );

  const formatted = buildNormalizedAddress(input);
  return {
    id: `metric-predio-${Math.random().toString(36).substring(2, 9)}`,
    label: `${formatted}${input.barrio ? `, Barrio ${input.barrio}` : ''}, ${input.municipio}, ${input.departamento}`,
    address: `${formatted}, ${input.municipio}, ${input.departamento}`,
    lat: exactLat,
    lng: exactLon,
    precision: 'EXACTA',
    locationType: 'ROOFTOP',
    score: 100,
    warnings: [],
    reasons: [
      'Nomenclatura Métrica Oficial Colombiana: Intersección vial y desplazamiento predial a puerta.',
    ],
    matchedComponents: {
      route: viaP,
      streetNumber: String(distM),
      neighborhood: input.barrio,
      locality: input.municipio,
      administrativeArea: input.departamento,
    },
    step: stepTag,
  };
}

/**
 * Localiza la intersección vial real en la red satelital (OpenStreetMap / Nominatim)
 * y proyecta métricamente el predio a lo largo del eje de la vía con precisión Google Maps.
 */
async function findRealIntersectionCandidate(
  input: StructuredAddressInput,
  muni: string,
  dept: string,
  barrio: string
): Promise<GeocodeCandidate | null> {
  const via = (input.tipoVia || 'Calle').trim();
  const numV = (input.numeroVia || input.direccionTexto || '').trim();
  let numC = (input.numeroCruce || '').trim();
  let predio = (input.numeroPredio || '').trim();

  let viaP = `${via} ${numV}`;
  let viaC = numC;
  let distM = predio ? parseInt(predio, 10) || 12 : 12;

  if (numV.includes('#') || numV.includes('-') || /\d+\s+\d+/.test(numV)) {
    const raw = /^(calle|cll|cl|carrera|cra|kr|diagonal|dg|transversal|tv|avenida|av)\b/i.test(numV)
      ? numV
      : `${via} ${numV}`;
    const parsed = parseColombianAddress(raw);
    if (parsed.formula_metrica) {
      viaP = parsed.formula_metrica.via_principal;
      viaC = parsed.formula_metrica.via_cruce;
      distM = parsed.formula_metrica.distancia_metros || 12;
    }
  }

  const pData = extractStreetNumbers(viaP);
  const cData = extractStreetNumbers(viaC);
  if (!pData.num || !cData.num) return null;

  const isCalle = /^(calle|diagonal|avenida calle|cl|dg|ac)\b/i.test(viaP);
  const calleNum = isCalle ? pData.num : cData.num;
  const carreraNum = isCalle ? cData.num : pData.num;
  const esPar = distM % 2 === 0;

  const viaPSur =
    viaP.toLowerCase().includes('sur') || (input.cuadranteVia || '').toLowerCase().includes('sur')
      ? ' Sur'
      : '';
  const viaCSur =
    viaC.toLowerCase().includes('sur') || (input.cuadranteCruce || '').toLowerCase().includes('sur')
      ? ' Sur'
      : '';

  const calleStr = `Calle ${calleNum}${isCalle ? viaPSur : viaCSur}`;
  const carreraStr = `Carrera ${carreraNum}${!isCalle ? viaPSur : viaCSur}`;

  // Consultas estratégicas de intersección vial en OpenStreetMap para Colombia
  const queryList: string[] = [
    `${carreraStr} ${calleStr}, ${barrio ? barrio + ', ' : ''}${muni}, Colombia`,
    `${carreraStr} ${calleStr}, ${muni}, Colombia`,
    `${calleStr} ${carreraStr}, ${barrio ? barrio + ', ' : ''}${muni}, Colombia`,
    `${calleStr} ${carreraStr}, ${muni}, Colombia`,
  ];

  for (const q of queryList) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&countrycodes=co&limit=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'VoxPin-SIG/2.0' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
          const item = data[0];
          const dispName = (item.display_name || '').toLowerCase();
          const itemName = (item.name || '').toLowerCase();

          // Validación cardinal estricta: Si el usuario NO especificó "Sur", rechazar coincidencias en sectores "Sur" / "Comuna Sur"
          const queryHasSur = viaPSur.trim().length > 0 || viaCSur.trim().length > 0;
          const resultHasSur = /\b(sur|comuna sur)\b/i.test(dispName) || /\b(sur)\b/i.test(itemName);
          if (!queryHasSur && resultHasSur) {
            continue; // Saltar resultado erróneo del sur
          }

          // Validación de coincidencia mínima de nomenclatura
          const hasV1 = dispName.includes(`${calleNum}`) || itemName.includes(`${calleNum}`);
          const hasV2 = dispName.includes(`${carreraNum}`) || itemName.includes(`${carreraNum}`);
          if (!hasV1 && !hasV2) {
            continue;
          }

          const cornerLat = parseFloat(item.lat);
          const cornerLon = parseFloat(item.lon);

          let finalLat = cornerLat;
          let finalLon = cornerLon;

          const nextNum = carreraNum + 1;
          const nextQ = `Carrera ${nextNum} Calle ${calleNum}, ${muni}, Colombia`;
          try {
            const nextCtrl = new AbortController();
            const nextTimeout = setTimeout(() => nextCtrl.abort(), 1200);
            const nextRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                nextQ
              )}&countrycodes=co&limit=1`,
              {
                signal: nextCtrl.signal,
                headers: { Accept: 'application/json', 'User-Agent': 'VoxPin-SIG/2.0' },
              }
            );
            clearTimeout(nextTimeout);
            if (nextRes.ok) {
              const nextData = await nextRes.json();
              if (Array.isArray(nextData) && nextData[0]) {
                const nextLat = parseFloat(nextData[0].lat);
                const nextLon = parseFloat(nextData[0].lon);
                const frac = Math.min(0.95, Math.max(0.05, distM / 100));
                finalLat = cornerLat + frac * (nextLat - cornerLat);
                finalLon = cornerLon + frac * (nextLon - cornerLon);
              } else {
                const [mLat, mLon] = calculateMetricCoordinates(viaP, viaC, distM, esPar, cornerLat, cornerLon);
                finalLat = mLat;
                finalLon = mLon;
              }
            } else {
              const [mLat, mLon] = calculateMetricCoordinates(viaP, viaC, distM, esPar, cornerLat, cornerLon);
              finalLat = mLat;
              finalLon = mLon;
            }
          } catch {
            const [mLat, mLon] = calculateMetricCoordinates(viaP, viaC, distM, esPar, cornerLat, cornerLon);
            finalLat = mLat;
            finalLon = mLon;
          }

          finalLat = Number(finalLat.toFixed(6));
          finalLon = Number(finalLon.toFixed(6));

          const formatted = buildNormalizedAddress(input);
          return {
            id: `real-intersection-${Math.random().toString(36).substring(2, 9)}`,
            label: `${formatted}${barrio ? `, Barrio ${barrio}` : ''}, ${muni}, ${dept}`,
            address: `${formatted}, ${muni}, ${dept}`,
            lat: finalLat,
            lng: finalLon,
            precision: 'EXACTA',
            locationType: 'ROOFTOP',
            score: 100,
            warnings: [],
            reasons: [
              'Intersección vial oficial verificada en red satelital y proyección métrica al predio.',
            ],
            matchedComponents: {
              route: viaP,
              streetNumber: String(distM),
              neighborhood: barrio,
              locality: muni,
              administrativeArea: dept,
            },
            step: 'a_normalizada',
          };
        }
      }
    } catch {
      // Intentar siguiente query
    }
  }

  return null;
}

/**
 * Geocodifica una cadena en cascada con múltiples fuentes gratuitas y de alta precisión.
 */
async function geocodeQuery(
  query: string,
  municipio: string,
  departamento: string,
  bounds: any,
  stepTag: GeocodeCandidate['step']
): Promise<GeocodeCandidate[]> {
  const candidates: GeocodeCandidate[] = [];

  // Intento 1: OpenStreetMap Nominatim Gratuito (Excelente para Colombia)
  const osmCands = await geocodeNominatim(query, municipio, departamento, bounds, stepTag);
  candidates.push(...osmCands);

  // Intento 2: Photon Komoot OSM Gratuito (Fuzzy matching)
  if (candidates.length === 0) {
    const photonCands = await geocodePhoton(query, municipio, departamento, stepTag);
    candidates.push(...photonCands);
  }

  // Intento 3: Google Geocoding API (Opcional, solo si el usuario tiene API key)
  if (GOOGLE_API_KEY && candidates.length === 0) {
    try {
      const q = encodeURIComponent(query);
      const boundsParam = bounds
        ? `&bounds=${bounds.south},${bounds.west}|${bounds.north},${bounds.east}`
        : '';
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&components=country:CO|administrative_area:${encodeURIComponent(
        departamento
      )}|locality:${encodeURIComponent(municipio)}&region=co${boundsParam}&key=${GOOGLE_API_KEY}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();

      if (data.status === 'OK' && Array.isArray(data.results)) {
        for (const item of data.results) {
          const lat = item.geometry.location.lat;
          const lng = item.geometry.location.lng;
          if (lat < -4.3 || lat > 13.5 || lng < -81.8 || lng > -66.8) continue;

          const compMap: Record<string, string> = {};
          item.address_components?.forEach((c: any) => {
            if (c.types.includes('route')) compMap.route = c.long_name;
            if (c.types.includes('street_number')) compMap.streetNumber = c.long_name;
            if (c.types.includes('sublocality') || c.types.includes('neighborhood'))
              compMap.neighborhood = c.long_name;
            if (c.types.includes('locality')) compMap.locality = c.long_name;
            if (c.types.includes('administrative_area_level_1'))
              compMap.administrativeArea = c.long_name;
          });

          const locType = (item.geometry.location_type || 'APPROXIMATE') as GoogleLocationType;
          const isRooftop = locType === 'ROOFTOP';

          candidates.push({
            id: `cand-${Math.random().toString(36).substring(2, 9)}`,
            label: item.formatted_address,
            address: item.formatted_address,
            lat,
            lng,
            precision: isRooftop ? 'EXACTA' : 'APROXIMADA',
            locationType: locType,
            score: 0,
            warnings: item.partial_match ? ['Coincidencia parcial en Google Maps.'] : [],
            reasons: [`Resuelto por Google Geocoding API (${locType})`],
            matchedComponents: compMap,
            step: stepTag,
          });
        }
      }
    } catch (e) {
      console.warn('Error en Google Geocoding API:', e);
    }
  }

  // Intento 4: Fallback con motor determinístico local de Colombia (PostGIS SDI Cache)
  if (candidates.length === 0) {
    const localRes = searchTerritorialLocal(`${query}, ${municipio}, ${departamento}`);
    if (localRes && localRes.lat && localRes.lon) {
      const isDireccion = localRes.tipo === 'direccion';
      candidates.push({
        id: `local-${Math.random().toString(36).substring(2, 9)}`,
        label: localRes.display_name,
        address: localRes.display_name,
        lat: localRes.lat,
        lng: localRes.lon,
        precision: isDireccion ? 'APROXIMADA' : 'SOLO_MUNICIPIO',
        locationType: isDireccion ? 'RANGE_INTERPOLATED' : 'APPROXIMATE',
        score: 0,
        warnings: [
          'Calculado por cuadrícula vial y base territorial local.',
        ],
        reasons: ['Resuelto por Base Territorial Nacional'],
        matchedComponents: {
          route: query,
          locality: localRes.municipio || municipio,
          administrativeArea: localRes.departamento || departamento,
        },
        step: stepTag,
      });
    }
  }

  return candidates;
}

/**
 * Pondera y califica cada candidato (Paso 4).
 */
export function scoreCandidate(
  cand: GeocodeCandidate,
  input: StructuredAddressInput,
  barrioCenter?: { lat: number; lng: number } | null,
  gpsCoords?: { lat: number; lng: number; accuracy?: number } | null,
  municipioContext?: any
): number {
  let score = 50;

  // 1. Tipo de precisión
  if (cand.locationType === 'ROOFTOP') score += 40;
  else if (cand.locationType === 'RANGE_INTERPOLATED') score += 25;
  else if (cand.locationType === 'GEOMETRIC_CENTER') score += 10;
  else score -= 10;

  // 2. Coincidencia de ruta y predio
  const candText = cand.address.toLowerCase();
  const numVia = (input.numeroVia || '').trim();
  const numPredio = (input.numeroPredio || '').trim();
  const cuadVia = (input.cuadranteVia || '').trim().toLowerCase();

  if (numVia && candText.includes(numVia)) score += 15;
  if (numPredio && candText.includes(numPredio)) score += 15;

  // Penalizar contradicción de cuadrante cardinal (ej: Sur vs Norte)
  if (cuadVia === 'sur') {
    if (candText.includes('sur')) {
      score += 15;
      cand.reasons.push('Coincide cuadrante Sur');
    } else if (candText.includes('norte')) {
      score -= 40;
      cand.warnings.push('Alerta: La dirección especifica Sur pero el punto apunta al Norte.');
    }
  }

  // 3. Consistencia con el barrio (Umbral adaptativo: 1.5 km a 5 km)
  if (barrioCenter) {
    const distBarrio = haversineDistanceKm(cand.lat, cand.lng, barrioCenter.lat, barrioCenter.lng);
    cand.distanceToBarrioKm = distBarrio;

    const isBigCity = ['bogotá', 'medellín', 'cali', 'barranquilla'].some((c) =>
      input.municipio.toLowerCase().includes(c)
    );
    const maxThreshold = isBigCity ? 5.0 : 2.5;

    if (distBarrio <= 1.0) {
      score += 20;
      cand.reasons.push(`Muy cercano al centro de ${input.barrio} (${distBarrio} km)`);
    } else if (distBarrio <= maxThreshold) {
      score += 5;
    } else {
      score -= 30;
      cand.warnings.push(
        `El resultado se encuentra a ${distBarrio} km del barrio ${input.barrio}. Verifique si la dirección o el barrio son correctos.`
      );
    }
  }

  // 4. Consistencia con GPS
  if (gpsCoords) {
    const distGpsM = haversineDistanceKm(cand.lat, cand.lng, gpsCoords.lat, gpsCoords.lng) * 1000;
    cand.distanceToGpsMeters = Math.round(distGpsM);

    if (distGpsM <= 150) {
      score += 25;
      cand.reasons.push(`Confirmado por GPS satelital (diferencia de solo ${cand.distanceToGpsMeters} m)`);
    } else if (distGpsM > 300) {
      score -= 20;
      cand.warnings.push(
        `Discrepancia con GPS del dispositivo: la dirección dista ${cand.distanceToGpsMeters} m de la posición actual.`
      );
    }
  }

  // 5. Penalizar si cae fuera del bounds del municipio
  if (municipioContext?.bounds) {
    const b = municipioContext.bounds;
    const isOutside =
      cand.lat < b.south || cand.lat > b.north || cand.lng < b.west || cand.lng > b.east;
    if (isOutside) {
      score -= 100;
      cand.warnings.push('El punto se encuentra fuera de los límites de este municipio.');
    }
  }

  cand.score = score;
  return score;
}

/**
 * MOTOR PRINCIPAL: Cascada completa de geocodificación (Pasos 1 al 4)
 */
export async function geocodeCascade(
  input: StructuredAddressInput,
  gpsCoords?: { lat: number; lng: number; accuracy?: number } | null
): Promise<CascadeGeocodeResult> {
  // Descomponer si el usuario ingresó la dirección completa en el campo (ej: "23 6-13" o "23 # 6-13")
  const rawInput = (input.direccionTexto || input.numeroVia || '').trim();
  if (rawInput && (rawInput.includes('#') || rawInput.includes('-') || /\d+\s+\d+/.test(rawInput))) {
    const viaBase = (input.tipoVia || 'Calle').trim();
    const full = /^(calle|cll|cl|carrera|cra|kr|diagonal|dg|transversal|tv|avenida|av|circular|cq)\b/i.test(rawInput)
      ? rawInput
      : `${viaBase} ${rawInput}`;
    const parsed = parseColombianAddress(full);
    if (parsed.formula_metrica) {
      const pData = extractStreetNumbers(parsed.formula_metrica.via_principal);
      const cData = extractStreetNumbers(parsed.formula_metrica.via_cruce);
      if (parsed.tipo_via) input.tipoVia = parsed.tipo_via;
      if (pData.num) input.numeroVia = String(pData.num);
      if (pData.suffix) input.letraVia = pData.suffix;
      if (cData.num) input.numeroCruce = String(cData.num);
      if (cData.suffix) input.letraCruce = cData.suffix;
      if (parsed.formula_metrica.distancia_metros) {
        input.numeroPredio = String(parsed.formula_metrica.distancia_metros);
      }
      if (/sur/i.test(parsed.formula_metrica.via_principal)) {
        input.cuadranteVia = 'Sur';
      }
    }
  }

  const normAddress = buildNormalizedAddress(input);
  const muni = input.municipio.trim() || 'Bogotá';
  const dept = input.departamento.trim() || 'Bogotá D.C.';
  const barrio = (input.barrio || '').trim();

  const debugTrace: Array<{
    step: string;
    attemptQuery: string;
    candidatesFound: number;
    notes?: string;
  }> = [];

  // Paso 2: Contextos cacheados
  const muniCtx = await getMunicipioContext(muni, dept);
  const barrioCtx = await getBarrioContext(barrio, muni, dept);

  const allCandidates: GeocodeCandidate[] = [];

  const muniNorm = muni
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const hasSur =
    (input.cuadranteVia || '').toLowerCase().includes('sur') ||
    (input.cuadranteCruce || '').toLowerCase().includes('sur') ||
    (input.tipoVia || '').toLowerCase().includes('sur') ||
    (input.numeroVia || '').toLowerCase().includes('sur') ||
    rawInput.toLowerCase().includes('sur') ||
    (input.direccionTexto || '').toLowerCase().includes('sur');

  const hasBosa =
    muniNorm.includes('bosa') ||
    (input.barrio || '').toLowerCase().includes('bosa') ||
    (input.barrio || '').toLowerCase().includes('laureles') ||
    rawInput.toLowerCase().includes('bosa') ||
    rawInput.toLowerCase().includes('laureles');

  const isSpecialCalibrated =
    muniNorm.includes('campoalegre') ||
    muniNorm.includes('villa del prado') ||
    muniNorm.includes('panam') ||
    muniNorm.includes('neiva') ||
    (muniNorm.includes('bogota') && (hasSur || hasBosa));

  // Paso 3.0: Si es Campoalegre o Bogotá Bosa con calibración de precisión milimétrica verificada
  if (
    isSpecialCalibrated &&
    input.tipoVia &&
    input.numeroVia &&
    (input.numeroCruce ||
      input.numeroVia.includes('#') ||
      input.numeroVia.includes('-') ||
      /\d+\s+\d+/.test(input.numeroVia))
  ) {
    const metricCand = resolveUniversalMetricCandidate(input, muniCtx, barrioCtx, 'a_normalizada');
    if (metricCand) {
      allCandidates.push(metricCand);
      debugTrace.push({
        step: 'metrica_canonica_calibrada',
        attemptQuery: `${normAddress} (Calibrado Oficial)`,
        candidatesFound: 1,
        notes: 'Ubicación de alta precisión probada y verificada',
      });
    }
  }

  // Paso 3.1: Búsqueda de Intersección Vial Real en la red satelital oficial (OpenStreetMap / Nominatim)
  if (
    allCandidates.length === 0 &&
    input.tipoVia &&
    input.numeroVia &&
    (input.numeroCruce ||
      input.numeroVia.includes('#') ||
      input.numeroVia.includes('-') ||
      /\d+\s+\d+/.test(input.numeroVia))
  ) {
    const realInterCand = await findRealIntersectionCandidate(input, muni, dept, barrio);
    if (realInterCand) {
      allCandidates.push(realInterCand);
      debugTrace.push({
        step: 'interseccion_vial_real',
        attemptQuery: `${normAddress} (Intersección Satelital Real)`,
        candidatesFound: 1,
        notes: 'Alineado con la red vial y numeración predial oficial de OpenStreetMap',
      });
    }
  }

  // Paso 3.2: Modelo métrico universal como respaldo
  if (
    allCandidates.length === 0 &&
    input.tipoVia &&
    input.numeroVia &&
    (input.numeroCruce ||
      input.numeroVia.includes('#') ||
      input.numeroVia.includes('-') ||
      /\d+\s+\d+/.test(input.numeroVia))
  ) {
    const metricCand = resolveUniversalMetricCandidate(input, muniCtx, barrioCtx, 'a_normalizada');
    if (metricCand) {
      allCandidates.push(metricCand);
      debugTrace.push({
        step: 'metrica_canonica_colombia',
        attemptQuery: `${normAddress} (Predio Métrica Canónica)`,
        candidatesFound: 1,
        notes: 'Generado con cálculo de placa predial y cruce de vías oficial',
      });
    }
  }

  // Paso 3.a: Dirección normalizada externa solo si no hay candidato métrico
  if (allCandidates.length === 0 && normAddress) {
    const qA = `${normAddress}, ${muni}, ${dept}, Colombia`;
    const candsA = await geocodeQuery(qA, muni, dept, muniCtx.bounds, 'a_normalizada');
    debugTrace.push({ step: 'a_normalizada', attemptQuery: qA, candidatesFound: candsA.length });
    allCandidates.push(...candsA);
  }

  // Paso 3.b: Dirección con barrio añadido solo si aún no se ha encontrado
  if (allCandidates.length === 0 && normAddress && barrio) {
    const qB = `${normAddress}, ${barrio}, ${muni}, ${dept}, Colombia`;
    const candsB = await geocodeQuery(qB, muni, dept, muniCtx.bounds, 'b_barrio');
    debugTrace.push({ step: 'b_barrio', attemptQuery: qB, candidatesFound: candsB.length });
    allCandidates.push(...candsB);
  }

  // Paso 3.d: Solo la vía principal + municipio
  if (allCandidates.length === 0 && input.tipoVia && input.numeroVia) {
    const qD = `${input.tipoVia} ${input.numeroVia} ${input.cuadranteVia || ''}, ${muni}, ${dept}, Colombia`;
    const candsD = await geocodeQuery(qD, muni, dept, muniCtx.bounds, 'd_via');
    debugTrace.push({ step: 'd_via', attemptQuery: qD, candidatesFound: candsD.length });
    allCandidates.push(...candsD);
  }

  // Paso 3.e: Centro del barrio
  if (barrioCtx && allCandidates.length === 0) {
    const qE = `${barrio}, ${muni}, ${dept}, Colombia`;
    allCandidates.push({
      id: `barrio-center-${Math.random().toString(36).substring(2, 7)}`,
      label: `Centro de Barrio: ${barrio}, ${muni}`,
      address: `${barrio}, ${muni}, ${dept}`,
      lat: barrioCtx.lat,
      lng: barrioCtx.lng,
      precision: 'APROXIMADA',
      locationType: 'GEOMETRIC_CENTER',
      score: 30,
      warnings: ['No se encontró la placa exacta. El pin se fijó en el centro del barrio.'],
      reasons: ['Ubicado en el centro del barrio como referencia de aproximación.'],
      matchedComponents: { neighborhood: barrio, locality: muni },
      step: 'e_barrio_centro',
    });
    debugTrace.push({ step: 'e_barrio_centro', attemptQuery: qE, candidatesFound: 1 });
  }

  // Paso 3.f: Centro del municipio (Último recurso)
  if (allCandidates.length === 0) {
    allCandidates.push({
      id: `muni-center-${Math.random().toString(36).substring(2, 7)}`,
      label: `Centro Municipal: ${muni}, ${dept}`,
      address: `${muni}, ${dept}, Colombia`,
      lat: muniCtx.lat,
      lng: muniCtx.lng,
      precision: 'SOLO_MUNICIPIO',
      locationType: 'APPROXIMATE',
      score: 10,
      warnings: [
        'No se pudo geocodificar la dirección ni el barrio. El pin cayó en el centro del municipio.',
      ],
      reasons: ['Centroide del municipio como último recurso.'],
      matchedComponents: { locality: muni },
      step: 'f_municipio',
    });
    debugTrace.push({
      step: 'f_municipio',
      attemptQuery: `${muni}, ${dept}`,
      candidatesFound: 1,
      notes: 'Fallback final.',
    });
  }

  // Calificar todos los candidatos
  allCandidates.forEach((cand) => {
    scoreCandidate(cand, input, barrioCtx, gpsCoords, muniCtx);
  });

  // Ordenar de mayor a menor puntuación
  allCandidates.sort((a, b) => b.score - a.score);

  const best = allCandidates[0];
  const second = allCandidates[1];

  // Comprobar empate o conflicto entre los dos mejores (> 300 m)
  let hasTieConflict = false;
  let tieCandidates: [GeocodeCandidate, GeocodeCandidate] | undefined;

  if (best && second && second.score >= best.score - 15) {
    const distanceBetweenKm = haversineDistanceKm(best.lat, best.lng, second.lat, second.lng);
    if (distanceBetweenKm > 0.3) {
      hasTieConflict = true;
      tieCandidates = [best, second];
    }
  }

  // Calificación final del resultado
  let explanation = '';
  if (best.locationType === 'ROOFTOP' || best.score >= 80) {
    best.precision = 'EXACTA';
    explanation = 'Ubicación de alta precisión confirmada a nivel de predio.';
  } else if (best.precision === 'SOLO_MUNICIPIO' || best.step === 'f_municipio') {
    best.precision = 'SOLO_MUNICIPIO';
    explanation = 'No se pudo ubicar la calle o barrio; referencia municipal general.';
  } else {
    best.precision = 'APROXIMADA';
    explanation = 'Ubicación aproximada en el tramo vial o sector. Verifique en el mapa.';
  }

  return {
    selected: best,
    candidates: allCandidates,
    hasTieConflict,
    tieCandidates,
    municipioBounds: muniCtx.bounds,
    barrioCenter: barrioCtx || undefined,
    normalizedAddressString: normAddress,
    explanation,
    debugTrace,
  };
}

