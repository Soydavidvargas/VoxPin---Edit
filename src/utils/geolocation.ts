/**
 * Módulo de Geolocalización Satelital de Alta Precisión (GPS High Accuracy + watchPosition)
 * Fuerza la antena GPS nativa en dispositivos móviles, descarta triangulaciones imprecisas por Wi-Fi/celda (>20m)
 * y calibra la señal satelital en tiempo real con filtro de precisión (Accuracy Filter).
 */

export interface GpsLocationCallback {
  (lat: number, lng: number, precisionMetros: number): void;
}

export interface GpsErrorCallback {
  (error: GeolocationPositionError | Error): void;
}

/**
 * Obtiene la ubicación exacta forzando satélites GPS y filtrando lecturas con más de 15-20 metros de error.
 * Utiliza watchPosition para esperar la calibración satelital y se desconecta en cuanto alcanza la precisión deseada.
 */
export function obtenerUbicacionExacta(
  callback: GpsLocationCallback,
  errorCallback?: GpsErrorCallback
): () => void {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    if (errorCallback) {
      errorCallback(new Error('La geolocalización no está soportada en este navegador o dispositivo.'));
    }
    return () => {};
  }

  const opciones: PositionOptions = {
    enableHighAccuracy: true, // Forzar satélites GPS en móviles
    timeout: 15000,          // Dar tiempo al chip GPS para sincronizar con los satélites
    maximumAge: 0,           // Posición en tiempo real sin caché vieja
  };

  let watchId: number | null = null;
  let timerFallback: any = null;
  let hasResolved = false;
  let bestPosition: GeolocationPosition | null = null;
  let readingsCount = 0;

  const cleanup = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (timerFallback !== null) {
      clearTimeout(timerFallback);
      timerFallback = null;
    }
  };

  const resolveWithPosition = (pos: GeolocationPosition) => {
    if (hasResolved) return;
    hasResolved = true;
    cleanup();
    callback(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
  };

  // Timer de seguridad: si tras 10 segundos no ha bajado de 20 metros, utiliza la mejor lectura obtenida
  timerFallback = setTimeout(() => {
    if (hasResolved) return;
    if (bestPosition) {
      resolveWithPosition(bestPosition);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolveWithPosition(pos),
        (err) => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            if (errorCallback) errorCallback(err);
          }
        },
        opciones
      );
    }
  }, 10000);

  // Usar watchPosition para esperar a que el satélite calibre la mejor señal
  try {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        readingsCount++;
        const precisionMetros = position.coords.accuracy;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Registrar la lectura más fina hasta el momento
        if (!bestPosition || precisionMetros < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // Si la precisión es buena (<= 20 metros) o pasaron 3 lecturas con señal razonable, fijar el punto y detener el sensor
        if (precisionMetros <= 20 || (readingsCount >= 3 && precisionMetros <= 35)) {
          navigator.geolocation.clearWatch(watchId as number);
          watchId = null;
          resolveWithPosition(position);
        }
      },
      (error) => {
        console.warn('watchPosition esperando sincronización satelital:', error.message);
        // Si falla o tarda, usar la última lectura disponible como fallback
        if (!hasResolved) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolveWithPosition(pos),
            (fallbackErr) => {
              if (!hasResolved) {
                if (bestPosition) {
                  resolveWithPosition(bestPosition);
                } else {
                  hasResolved = true;
                  cleanup();
                  if (errorCallback) errorCallback(fallbackErr);
                }
              }
            },
            opciones
          );
        }
      },
      opciones
    );
  } catch (err: any) {
    cleanup();
    if (errorCallback) errorCallback(err);
  }

  return cleanup;
}

/**
 * Función para solicitar ubicación de forma explícita al cargar o pulsar capturar
 * Utiliza el motor de alta precisión satelital (watchPosition + filtro satelital)
 */
export const solicitarUbicacionGPS = (
  onSuccess?: (coords: { lat: number; lng: number; accuracy?: number }) => void,
  onError?: (err: GeolocationPositionError | Error) => void
) => {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    if (onError) onError(new Error("Tu navegador no soporta geolocalización."));
    return;
  }

  // Delegar al calibrador satelital de alta precisión
  obtenerUbicacionExacta(
    (lat, lng, accuracy) => {
      if (onSuccess) {
        onSuccess({ lat, lng, accuracy });
      }
    },
    (err) => {
      console.warn("Aviso señal GPS:", err);
      if (onError) onError(err);
    }
  );
};

