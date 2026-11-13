/**
 * colombiaPopulationData.ts
 * Estimaciones oficiales de población territorial según proyecciones del Censo DANE.
 * Permite contrastar la muestra levantada con el universo poblacional del departamento y municipio.
 */

// Población proyectada por Departamento (DANE)
export const DANE_POBLACION_DEPARTAMENTOS: Record<string, number> = {
  'Bogotá D.C.': 7935000,
  'Antioquia': 6890000,
  'Valle del Cauca': 4620000,
  'Cundinamarca': 3420000,
  'Atlántico': 2790000,
  'Santander': 2340000,
  'Bolívar': 2220000,
  'Córdoba': 1860000,
  'Nariño': 1690000,
  'Norte de Santander': 1620000,
  'Cauca': 1530000,
  'Magdalena': 1450000,
  'Tolima': 1365000,
  'Cesar': 1340000,
  'Boyacá': 1260000,
  'Huila': 1200000,
  'Meta': 1090000,
  'Caldas': 1040000,
  'La Guajira': 1010000,
  'Risaralda': 975000,
  'Sucre': 970000,
  'Quindío': 565000,
  'Chocó': 550000,
  'Casanare': 445000,
  'Caquetá': 420000,
  'Putumayo': 370000,
  'Arauca': 300000,
  'Vichada': 115000,
  'Guaviare': 90000,
  'Amazonas': 82000,
  'San Andrés y Providencia': 65000,
  'Guainía': 52000,
  'Vaupés': 45000,
};

// Población proyectada por Municipios representativos (DANE)
export const DANE_POBLACION_MUNICIPIOS: Record<string, number> = {
  'Bogotá': 7935000,
  'Bogotá D.C.': 7935000,
  'Medellín': 2580000,
  'Cali': 2280000,
  'Barranquilla': 1320000,
  'Cartagena': 1050000,
  'Soacha': 810000,
  'Cúcuta': 810000,
  'Soledad': 685000,
  'Bucaramanga': 615000,
  'Villavicencio': 555000,
  'Bello': 550000,
  'Ibagué': 545000,
  'Santa Marta': 540000,
  'Valledupar': 530000,
  'Montería': 510000,
  'Pereira': 480000,
  'Manizales': 450000,
  'Pasto': 400000,
  'Neiva': 365000,
  'Palmira': 355000,
  'Popayán': 325000,
  'Buenaventura': 315000,
  'Armenia': 310000,
  'Floridablanca': 270000,
  'Sincelejo': 300000,
  'Itagüí': 290000,
  'Tumaco': 260000,
  'Envigado': 245000,
  'Dosquebradas': 225000,
  'Tuluá': 220000,
  'Girón': 200000,
  'Piedecuesta': 185000,
  'Yopal': 180000,
  'Cartago': 140000,
  'Pitalito': 138000,
  'Rionegro': 145000,
  'Facatativá': 145000,
  'Chía': 160000,
  'Zipaquirá': 150000,
  'Turbo': 135000,
  'Sogamoso': 135000,
  'Apartadó': 130000,
  'Duitama': 130000,
  'Buga': 130000,
  'Fusagasugá': 140000,
  'Garzón': 98000,
  'La Plata': 67000,
  'San Gil': 62000,
  'Campoalegre': 34500,
  'Gigante': 35000,
  'Rivera': 26000,
  'Algeciras': 25000,
  'Palermo': 32000,
  'Aipe': 28000,
  'Tarqui': 18000,
  'Timaná': 22000,
  'Acevedo': 35000,
  'San Agustín': 34000,
  'Guadalupe': 21000,
  'Suaza': 23000,
  'Oporapa': 14000,
  'Isnos': 28000,
  'Saladoblanco': 12000,
  'Elías': 5000,
  'Altamira': 5200,
  'Agrado': 10000,
  'Paicol': 7000,
  'Tesalia': 11000,
  'Nátaga': 7200,
  'Íquira': 12000,
  'Yaguará': 9000,
  'Hobo': 8500,
  'Tello': 14500,
  'Baraya': 10500,
  'Villavieja': 8000,
  'Colombia': 13000,
  'Santa María': 12000,
};

/**
 * Normaliza nombres para búsqueda sin tildes ni mayúsculas
 */
function cleanKey(text: string): string {
  return (text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Obtiene la población estimada del departamento según el DANE
 */
export function obtenerPoblacionDepartamento(departamento: string): number {
  if (!departamento) return 50000000; // Colombia total aprox
  const clean = cleanKey(departamento);

  for (const [dep, pop] of Object.entries(DANE_POBLACION_DEPARTAMENTOS)) {
    if (cleanKey(dep) === clean) {
      return pop;
    }
  }

  return 1200000; // Promedio departamental de referencia
}

/**
 * Obtiene la población estimada del municipio según el DANE
 */
export function obtenerPoblacionMunicipio(municipio: string, departamento?: string): number {
  if (!municipio) {
    return departamento ? obtenerPoblacionDepartamento(departamento) : 50000;
  }

  const cleanMun = cleanKey(municipio);

  for (const [mun, pop] of Object.entries(DANE_POBLACION_MUNICIPIOS)) {
    if (cleanKey(mun) === cleanMun) {
      return pop;
    }
  }

  // Si no está en el diccionario directo, calculamos una estimación proporcional
  if (departamento) {
    const depPop = obtenerPoblacionDepartamento(departamento);
    // Un municipio intermedio suele representar aproximadamente entre el 2.5% y el 4% del departamento
    return Math.max(12000, Math.round(depPop * 0.03));
  }

  return 35000; // Estimación base municipio intermedio
}

/**
 * Calcula el tamaño de muestra estadístico representativo (Fórmula Cochran)
 * N: Población del universo
 * Confianza: 95% (Z = 1.96)
 * Error muestral: 5% (e = 0.05) o 4% (e = 0.04)
 * Varianza máxima: p = 0.5 (q = 0.5)
 */
export function calcularMuestraObjetivo(poblacionUniverso: number, margenError: number = 0.05): number {
  if (poblacionUniverso <= 0) return 384;
  const Z = 1.96; // 95% confianza
  const p = 0.5;
  const q = 0.5;
  const e = margenError;

  const numerador = poblacionUniverso * Math.pow(Z, 2) * p * q;
  const denominador = Math.pow(e, 2) * (poblacionUniverso - 1) + Math.pow(Z, 2) * p * q;

  const n = Math.ceil(numerador / denominador);
  return Math.min(n, poblacionUniverso);
}
