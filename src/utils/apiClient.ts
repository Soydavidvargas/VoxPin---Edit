/**
 * Cliente de API de Alto Rendimiento para VoxPin / Votality
 * Implementa:
 * 1. Deduplicación de peticiones en vuelo (evita llamadas duplicadas simultáneas)
 * 2. Timeouts con AbortController en APIs externas y locales
 * 3. Ejecución paralela de peticiones independientes
 * 4. Paginación estándar de resultados (cursor / offset)
 * 5. Proyección de columnas (solo pide los campos necesarios)
 * 6. Resolución de URLs estáticas mediante CDN
 */

// Cache de peticiones en vuelo para deduplicación instantánea
const inFlightRequests = new Map<string, Promise<any>>();

// Cache TTL en memoria (Stale-While-Revalidate ligero)
const memoryCache = new Map<string, { data: any; expiry: number }>();

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  dedupe?: boolean;
  ttlMs?: number;
  columns?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Resuelve la URL de un recurso estático sirviéndolo desde una CDN si está configurada
 */
export function getCdnUrl(path: string): string {
  const cdnBase = import.meta.env.VITE_CDN_URL || '';
  if (!cdnBase) return path;
  const cleanBase = cdnBase.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Petición fetch optimizada con deduplicación y timeout
 */
export async function dedupedFetch<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 6000,
    dedupe = true,
    ttlMs = 0,
    columns,
    ...fetchOptions
  } = options;

  // Si se solicitaron solo columnas específicas, anexar parámetro de proyección
  let finalUrl = url;
  if (columns && columns.length > 0) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}fields=${encodeURIComponent(columns.join(','))}`;
  }

  const cacheKey = `${fetchOptions.method || 'GET'}:${finalUrl}`;

  // 1. Revisar cache en memoria si tiene TTL activo
  if (ttlMs > 0 && memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)!;
    if (Date.now() < entry.expiry) {
      return entry.data as T;
    }
    memoryCache.delete(cacheKey);
  }

  // 2. Deduplicación de peticiones en vuelo (evita disparar 2 o más requests idénticos)
  if (dedupe && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)! as Promise<T>;
  }

  // 3. Crear promesa con Timeout explícito
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestPromise = (async () => {
    try {
      const response = await fetch(finalUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (ttlMs > 0) {
        memoryCache.set(cacheKey, { data, expiry: Date.now() + ttlMs });
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Timeout de petición excedido (${timeoutMs}ms) en: ${finalUrl}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      inFlightRequests.delete(cacheKey);
    }
  })();

  if (dedupe) {
    inFlightRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
}

/**
 * Lanza múltiples peticiones independientes en paralelo (Promise.allSettled)
 */
export async function fetchParallel<T extends Record<string, () => Promise<any>>>(
  tasks: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }> {
  const keys = Object.keys(tasks) as (keyof T)[];
  const promises = keys.map((key) => tasks[key]());
  const results = await Promise.allSettled(promises);

  const output: any = {};
  results.forEach((res, idx) => {
    const key = keys[idx];
    if (res.status === 'fulfilled') {
      output[key] = res.value;
    } else {
      console.warn(`[fetchParallel] Error en tarea paralela "${String(key)}":`, res.reason);
      output[key] = null;
    }
  });

  return output;
}

/**
 * Paginador local en memoria / slice para listas grandes
 */
export function paginateArray<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
): PaginatedResponse<T> {
  const total = items.length;
  const safePage = Math.max(1, page);
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (safePage - 1) * pageSize;
  const data = items.slice(startIndex, startIndex + pageSize);

  return {
    data,
    total,
    page: safePage,
    pageSize,
    totalPages,
    hasMore: safePage < totalPages,
  };
}

/**
 * Proyecta únicamente las columnas deseadas de un array de objetos
 */
export function projectColumns<T extends Record<string, any>, K extends keyof T>(
  items: T[],
  keys: K[]
): Pick<T, K>[] {
  return items.map((item) => {
    const projected: any = {};
    for (const key of keys) {
      if (key in item) {
        projected[key] = item[key];
      }
    }
    return projected;
  });
}
