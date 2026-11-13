import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Loader2 } from 'lucide-react';
import { SearchLocationTarget, SurveyRecord, FormField, RespondentRecord } from '../../types/votality';
import { obtenerUbicacionExacta } from '../../utils/geolocation';

interface VotalityMapProps {
  pins: SurveyRecord[];
  center: [number, number];
  zoom?: number;
  onPinSelect?: (pin: SurveyRecord) => void;
  selectedPinId?: string | null;
  maxPins?: number;
  searchTarget?: SearchLocationTarget | null;
  formFields?: FormField[];
  onSearchLocationAdjusted?: (lat: number, lng: number) => void;
  onGpsLocated?: (lat: number, lng: number, accuracy?: number) => void;
  onGpsError?: (message: string) => void;
  onMovePinRequest?: (pin: SurveyRecord) => void;
}

// Límites territoriales estrictos de Colombia (Zona continental e insular)
// SW: [-4.3, -81.8] (Leticia y Pacífico) • NE: [13.5, -66.8] (San Andrés y Guainía)
const COLOMBIA_BOUNDS: L.LatLngBoundsLiteral = [
  [-4.3, -81.8],
  [13.5, -66.8],
];

// Indicador visual / Pin para ubicación geocodificada buscada
const createSearchIndicatorIcon = (type: string) => {
  return L.divIcon({
    className: 'search-target-marker',
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; transform: translate(-21px, -21px);">
        <div style="position: absolute; inset: 0; border: 2.5px solid #000000; border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.85;"></div>
        <div style="width: 24px; height: 24px; background: #000000; border: 2.5px solid #FFFFFF; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.8);">
          <div style="width: 7px; height: 7px; background: #FFFFFF; border-radius: 9999px;"></div>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });
};

// Marcador de "Mi Ubicación" GPS (Pin distintivo con Corona monocromática dorada/blanca y pulso de radar)
const createMyLocationCrownPinIcon = () => {
  return L.divIcon({
    className: 'fixed-gps-address-marker',
    html: `
      <div style="position: relative; width: 48px; height: 60px; display: flex; flex-direction: column; align-items: center; cursor: default; transform: translate(-24px, -52px);">
        <!-- Anillo de pulso GPS satelital -->
        <div style="position: absolute; bottom: 0; width: 26px; height: 10px; background: rgba(255, 255, 255, 0.4); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <!-- Sombra en suelo con pulso -->
        <div style="position: absolute; bottom: 0; width: 22px; height: 8px; background: rgba(0,0,0,0.6); border-radius: 50%; filter: blur(2px);"></div>
        <!-- Pin Monocromático de Mi Ubicación con Corona -->
        <svg width="42" height="54" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 6px 14px rgba(0,0,0,0.95));">
          <!-- Cuerpo del Pin con bordes nítidos -->
          <path d="M17 2C8.71573 2 2 8.71573 2 17C2 27.5 17 40 17 40C17 40 32 27.5 32 17C32 8.71573 25.2843 2 17 2Z" 
                fill="#000000" 
                stroke="#FFFFFF" 
                stroke-width="2.5" 
                stroke-linejoin="round"/>
          <!-- Círculo interior blanco contrastante -->
          <circle cx="17" cy="17" r="8.5" 
                  fill="#FFFFFF" 
                  stroke="#000000" 
                  stroke-width="1.8"/>
          <!-- Icono de Corona (Crown) en el centro -->
          <!-- Corona de 5 puntas estilizada y definida -->
          <path d="M12 21.5H22L21.2 18.2L19.2 19.5L17 13.5L14.8 19.5L12.8 18.2L12 21.5Z" 
                fill="#000000" 
                stroke="#000000" 
                stroke-width="0.8" 
                stroke-linejoin="round"/>
          <!-- Gemas / círculos en las puntas de la corona -->
          <circle cx="12.5" cy="17.8" r="0.9" fill="#000000"/>
          <circle cx="17" cy="13" r="1.1" fill="#000000"/>
          <circle cx="21.5" cy="17.8" r="0.9" fill="#000000"/>
        </svg>
      </div>
    `,
    iconSize: [48, 60],
    iconAnchor: [24, 54],
    popupAnchor: [0, -50],
  });
};

const createFixedGpsPinIcon = createMyLocationCrownPinIcon;

const createDraggableAddressPinIcon = createFixedGpsPinIcon;

// Strictly Monochromatic SVG Vector Marker (Tamaño fijo inalterable al hacer zoom)
const createMonochromePinIcon = (isSelected: boolean, clusterCount: number = 1) => {
  const isCluster = clusterCount > 1;
  const svg = `
    <svg width="26" height="36" viewBox="0 0 26 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="0" y="0" width="26" height="36" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M13 2C6.92487 2 2 6.92487 2 13C2 21 13 32 13 32C13 32 24 21 24 13C24 6.92487 19.0751 2 13 2Z" 
              fill="${isSelected ? '#FFFFFF' : '#000000'}" 
              stroke="${isSelected ? '#000000' : '#FFFFFF'}" 
              stroke-width="2" 
              stroke-linejoin="round"/>
        <circle cx="13" cy="13" r="${isCluster ? 6.5 : 4.5}" 
                fill="${isSelected ? '#000000' : '#FFFFFF'}" 
                stroke="${isSelected ? '#FFFFFF' : '#000000'}" 
                stroke-width="1.2"/>
        ${
          isCluster
            ? `<text x="13" y="16" text-anchor="middle" font-size="8" font-family="monospace, sans-serif" font-weight="bold" fill="${
                isSelected ? '#FFFFFF' : '#000000'
              }">${Math.min(clusterCount, 99)}</text>`
            : `<circle cx="13" cy="13" r="2" fill="${isSelected ? '#FFFFFF' : '#000000'}"/>`
        }
      </g>
    </svg>
  `;

  return L.divIcon({
    className: 'monochrome-leaflet-marker fixed-zoom-pin',
    html: `
      <div style="width: 26px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
        ${svg}
      </div>
    `,
    iconSize: [26, 36],
    iconAnchor: [13, 33], // Anclaje milimétrico exacto a la punta inferior del pin
    popupAnchor: [0, -32],
  });
};

export const VotalityMap: React.FC<VotalityMapProps> = ({
  pins,
  center,
  zoom = 15,
  onPinSelect,
  selectedPinId,
  maxPins = Infinity,
  searchTarget,
  formFields,
  onSearchLocationAdjusted,
  onGpsLocated,
  onGpsError,
  onMovePinRequest,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const surveyMarkerRef = useRef<L.Marker | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Función de geolocalización GPS nativa de alta precisión satelital
  const locateCurrentPosition = (isManual: boolean = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if ('geolocation' in navigator) {
      setIsLocatingGps(true);
      obtenerUbicacionExacta(
        (lat, lng, accuracy) => {
          setIsLocatingGps(false);

          // Validación estricta territorial: Solo dentro de Colombia
          // Latitud: [-4.3, 13.5], Longitud: [-81.8, -66.8]
          const isWithinColombia =
            lat >= -4.3 && lat <= 13.5 && lng >= -81.8 && lng <= -66.8;

          if (isWithinColombia) {
            // Centrar el mapa con zoom de alta resolución predial
            map.flyTo([lat, lng], 19, { duration: 1.2 });

            // Colocar el marcador fijo de la encuesta en el punto actual (100% inmutable, no arrastrable)
            let surveyMarker = surveyMarkerRef.current || (window as any).surveyMarker;
            if (typeof surveyMarker !== 'undefined' && surveyMarker) {
              surveyMarker.setLatLng([lat, lng]);
            } else {
              surveyMarker = L.marker([lat, lng], {
                draggable: false, // Marcador 100% fijo, no se puede mover
                icon: createFixedGpsPinIcon(),
                zIndexOffset: 1600,
              }).addTo(map);

              surveyMarker.bindTooltip('👑 Mi Ubicación GPS', {
                permanent: true,
                direction: 'top',
                className: 'votality-drag-tooltip',
                offset: [0, -48],
              });

              surveyMarkerRef.current = surveyMarker;
              (window as any).surveyMarker = surveyMarker;
            }

            // Actualizar los inputs ocultos de latitud y longitud del formulario
            const inputLat = document.getElementById('input-lat') as HTMLInputElement | null;
            const inputLng = document.getElementById('input-lng') as HTMLInputElement | null;
            if (inputLat) {
              inputLat.value = lat.toString();
              inputLat.dispatchEvent(new Event('input', { bubbles: true }));
              inputLat.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (inputLng) {
              inputLng.value = lng.toString();
              inputLng.dispatchEvent(new Event('input', { bubbles: true }));
              inputLng.dispatchEvent(new Event('change', { bubbles: true }));
            }

            if (onGpsLocated) {
              onGpsLocated(lat, lng, accuracy);
            }
          } else {
            console.warn(
              'Ubicación GPS fuera de Colombia [-4.3 a 13.5, -81.8 a -66.8]. Se mantiene vista general predeterminada:',
              lat,
              lng
            );
            if (isManual && onGpsError) {
              onGpsError(
                `Ubicación GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) fuera del territorio colombiano. Votality opera exclusivamente en Colombia.`
              );
            }
          }
        },
        (error) => {
          setIsLocatingGps(false);
          console.warn('Permiso de GPS denegado o no disponible:', error.message);
          // Fallback: Si no da permiso, mantener la vista general predeterminada
          if (isManual && onGpsError) {
            const isDenied = 'code' in error && (error as any).code === 1;
            onGpsError(
              isDenied
                ? 'Permiso de GPS denegado en el navegador. Active la ubicación en su dispositivo.'
                : `Error al obtener señal GPS: ${error.message}`
            );
          }
        }
      );
    } else {
      console.warn('Geolocalización no soportada por el navegador');
      if (isManual && onGpsError) {
        onGpsError('Su navegador no soporta geolocalización GPS.');
      }
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Configuración de límites estrictos de navegación (Solo Colombia)
      // Visor cartográfico estricto: navegación, zoom y arrastre de cámara habilitados,
      // clic en lienzo DESACTIVADO (no crea pines ni selecciona puntos arbitrarios).
      const map = L.map(mapContainerRef.current, {
        center: [4.5709, -74.2973], // Centro de Colombia
        zoom: 6,
        minZoom: 5,
        maxBounds: COLOMBIA_BOUNDS,
        maxBoundsViscosity: 1.0, // Rebote rígido sin permitir salir de Colombia
        zoomControl: false,
        attributionControl: false,
        dragging: true, // Arrastre y desplazamiento de cámara habilitado
        scrollWheelZoom: true, // Zoom con rueda del ratón habilitado
        doubleClickZoom: true, // Doble clic para zoom habilitado
        boxZoom: true,
        keyboard: false,
      });

      // Vista inicial centrada en Colombia
      map.setView([4.5709, -74.2973], 6);

      // Capa base Google Maps a todo color con tonos verdes
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '&copy; Google Maps',
      }).addTo(map);

      // Re-position zoom control to bottom right or custom
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add attribution in monochromatic text
      L.control
        .attribution({
          position: 'bottomleft',
          prefix: '<span style="font-family: monospace; font-size: 10px; color: #888;">VOTALITY • PLATAFORMA TERRITORIAL</span>',
        })
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      mapInstanceRef.current = map;

      // El mapa inicia centrado en Colombia / territorio asignado sin auto-zoom invasivo al GPS personal
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, {
        duration: 1.0,
      });
    }
  }, [center[0], center[1], zoom]);

  // Efecto para enfocar y aplicar zoom dinámico según resultado geocodificado
  useEffect(() => {
    if (!mapInstanceRef.current || !searchTarget) return;

    const map = mapInstanceRef.current;

    // Remover marcador de búsqueda anterior si existe
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // 1. Enfoque y Zoom dinámico (PostGIS SDI)
    if (
      searchTarget.type === 'municipality' ||
      searchTarget.type === 'department' ||
      searchTarget.type === 'localidad' ||
      searchTarget.type === 'comuna' ||
      searchTarget.type === 'barrio'
    ) {
      if (searchTarget.bbox) {
        let bounds: L.LatLngBoundsLiteral;
        if (Array.isArray(searchTarget.bbox[0])) {
          bounds = searchTarget.bbox as [[number, number], [number, number]];
        } else {
          const [south, north, west, east] = searchTarget.bbox as [number, number, number, number];
          bounds = [
            [south, west],
            [north, east],
          ];
        }
        map.fitBounds(bounds, {
          maxZoom: searchTarget.zoomLevel,
          padding: [40, 40],
          animate: true,
          duration: 1.5,
        });
      } else {
        map.flyTo([searchTarget.lat, searchTarget.lng], searchTarget.zoomLevel, {
          duration: 1.5,
        });
      }
    } else {
      // 2. Dirección o Vía específica: flyTo nivel calle (zoom 17)
      map.flyTo([searchTarget.lat, searchTarget.lng], 17, {
        duration: 1.5,
      });
    }

    // 3. Colocar marcador / indicador visual en la posición buscada (100% fijo no arrastrable)
    const isAddressType = searchTarget.type === 'address';

    const marker = L.marker([searchTarget.lat, searchTarget.lng], {
      icon: isAddressType
        ? createFixedGpsPinIcon()
        : createSearchIndicatorIcon(searchTarget.type),
      draggable: false, // Marcador 100% fijo inmutable
      zIndexOffset: 1500,
    }).addTo(map);

    const typeBadge =
      searchTarget.type === 'department'
        ? 'DEPARTAMENTO'
        : searchTarget.type === 'municipality'
        ? 'MUNICIPIO'
        : searchTarget.type === 'localidad'
        ? 'LOCALIDAD'
        : searchTarget.type === 'comuna'
        ? 'COMUNA'
        : searchTarget.type === 'barrio'
        ? 'BARRIO'
        : 'DIRECCIÓN';

    const renderPopupContent = (latVal: number, lngVal: number) => `
      <div style="font-family: sans-serif; font-size: 11px; background: #000; color: #fff; padding: 10px; border: 1px solid #fff; border-radius: 2px; max-width: 280px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <div style="font-family: monospace; font-size: 9px; color: #00ff88; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold;">
            ${typeBadge} GEOCODIFICADO
          </div>
          <div style="font-family: monospace; font-size: 8px; background: #222; border: 1px solid #444; color: #fff; padding: 1px 4px; border-radius: 2px;">
            GPS INMUTABLE
          </div>
        </div>
        <div style="font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 4px; line-height: 1.25;">
          ${searchTarget.label}
        </div>
        <div style="font-family: monospace; font-size: 10px; color: #888; border-top: 1px solid #333; padding-top: 4px; display: flex; justify-content: space-between;">
          <span>LAT: ${latVal.toFixed(6)}</span>
          <span>LNG: ${lngVal.toFixed(6)}</span>
        </div>
      </div>
    `;

    marker
      .bindPopup(renderPopupContent(searchTarget.lat, searchTarget.lng), {
        closeButton: true,
        className: 'votality-monochrome-popup',
      })
      .openPopup();

    if (isAddressType) {
      marker.bindTooltip('Pin Fijo: Ubicación GPS 100% Inmutable', {
        permanent: true,
        direction: 'top',
        className: 'votality-drag-tooltip',
        offset: [0, -48],
      });
    }

    searchMarkerRef.current = marker;
  }, [searchTarget, onSearchLocationAdjusted]);

  // Update pins on map con agrupación espacial exacta (no se mueven ni se agrandan con el zoom)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Agrupar encuestas que comparten la misma ubicación geográfica (~3 metros: 4 decimales)
    const clustersMap = new Map<string, { lat: number; lng: number; records: SurveyRecord[] }>();

    pins.forEach((pin) => {
      const key = `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}`;
      const existing = clustersMap.get(key);
      if (existing) {
        existing.records.push(pin);
      } else {
        clustersMap.set(key, {
          lat: pin.lat,
          lng: pin.lng,
          records: [pin],
        });
      }
    });

    // 2. Renderizar cada PIN físico acumulado (no aumenta pines disponibles cuando comparten ubicación)
    Array.from(clustersMap.values()).forEach((cluster) => {
      const isSelected = cluster.records.some((r) => r.id === selectedPinId);
      const firstRecord = cluster.records[0];

      // Acumular todos los encuestados que residen o fueron registrados en este mismo PIN
      const allRespondentsInCluster: RespondentRecord[] = [];

      cluster.records.forEach((rec) => {
        if (rec.respondents && rec.respondents.length > 0) {
          rec.respondents.forEach((resp) => {
            if (!allRespondentsInCluster.some((x) => x.id === resp.id)) {
              allRespondentsInCluster.push(resp);
            }
          });
        } else {
          if (!allRespondentsInCluster.some((x) => x.id === rec.id)) {
            allRespondentsInCluster.push({
              id: rec.id,
              name: rec.name,
              surveyorId: rec.surveyorId || 'surveyor-1',
              surveyorName: rec.surveyorName,
              createdAt: rec.createdAt,
              answers: rec.answers,
              questionLabels: rec.questionLabels,
            });
          }
        }
      });

      const count = allRespondentsInCluster.length;

      const marker = L.marker([cluster.lat, cluster.lng], {
        icon: createMonochromePinIcon(isSelected, count),
        riseOnHover: true,
      });

      // Construcción del Popup con diseño UI avanzado (Nombre completo, Dpto, Municipio, Hora exacta y Preguntas Personalizadas)
      const popupContent = document.createElement('div');
      popupContent.className =
        'font-sans text-xs bg-black text-white p-3.5 border border-white/30 shadow-[0_12px_36px_rgba(0,0,0,0.95)] rounded-sm max-w-sm max-h-96 overflow-y-auto select-none';

      const dptoPrincipal = firstRecord.departamento || (firstRecord.answers?.departamento as string) || 'Colombia';
      const muniPrincipal = firstRecord.municipio || (firstRecord.answers?.municipio as string) || firstRecord.censusSector || 'No especificado';
      const barrioPrincipal = firstRecord.barrio || (firstRecord.answers?.barrio as string) || '';

      const headerHtml = `
        <div style="border-bottom: 1px solid #262626; padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #00FF85; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 5px;">
              <span style="width: 7px; height: 7px; border-radius: 9999px; background: #00FF85; box-shadow: 0 0 6px #00FF85; display: inline-block;"></span>
              ${count > 1 ? `PIN CON ${count} ENCUESTAS ACUMULADAS` : `PIN REGISTRADO`}
            </span>
            <span style="font-family: monospace; font-size: 9px; color: #888; background: #141414; border: 1px solid #262626; padding: 2px 6px; border-radius: 2px;">
              ${barrioPrincipal ? `BARRIO ${barrioPrincipal.toUpperCase()}` : 'PREDIO'}
            </span>
          </div>

          <div style="font-family: monospace; font-size: 12px; font-weight: bold; color: #ffffff; display: flex; align-items: flex-start; gap: 5px; margin-top: 4px;">
            <span style="color: #ff3366;">📍</span>
            <span>${firstRecord.address}</span>
          </div>

          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-family: monospace; font-size: 10px; color: #aaaaaa; margin-top: 5px; background: #0c0c0c; padding: 5px 8px; border-radius: 2px; border: 1px solid #1f1f1f;">
            <span style="color: #00FF85;">🏛️</span>
            <span><strong>Municipio:</strong> <span style="color: #ffffff;">${muniPrincipal}</span></span>
            <span style="color: #444444;">•</span>
            <span><strong>Dpto:</strong> <span style="color: #ffffff;">${dptoPrincipal}</span></span>
          </div>
        </div>
      `;

      // Helper para obtener el Nombre Completo estructurado (Primer Nombre, Segundo Nombre, Apellidos y Alias)
      const getStructuredFullName = (rec: any): string => {
        const ans = rec.answers || {};
        const pNom = ans.primer_nombre || '';
        const sNom = ans.segundo_nombre || '';
        const pApe = ans.primer_apellido || '';
        const sApe = ans.segundo_apellido || '';
        const alias = ans.alias || '';

        const nameParts = [pNom, sNom, pApe, sApe].map((s) => String(s).trim()).filter(Boolean);
        if (nameParts.length > 0) {
          const joined = nameParts.join(' ');
          return alias ? `${joined} (${alias})` : joined;
        }

        if (rec.name) {
          return alias && !rec.name.includes(alias) ? `${rec.name} (${alias})` : rec.name;
        }

        return 'Persona Encuestada';
      };

      // Helper estricto para ignorar claves de metadatos del sistema
      const isSystemMetadataKey = (key: string): boolean => {
        const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const IGNORED = [
          'nombre',
          'primernombre',
          'segundonombre',
          'primerapellido',
          'segundoapellido',
          'alias',
          'apodo',
          'direccion',
          'direcciondian',
          'nomenclaturadian',
          'direccionnormalizada',
          'departamento',
          'municipio',
          'barrio',
          'sector',
          'comuna',
          'complemento',
          'detalle',
          'fuenteubicacion',
          'fuente',
          'nivelprecision',
          'precision',
          'candidatoelegido',
          'puntaje',
          'score',
          'advertencias',
          'locationtype',
          'questionlabels',
          'subsurveys',
          'respondents',
        ];
        return IGNORED.includes(clean);
      };

      const getQuestionLabelText = (key: string, recAnswers: any, recQuestionLabels?: Record<string, string>) => {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Buscar en formFields
        const found = formFields?.find((f) => f.id === key || f.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey);
        if (found?.label) return found.label;

        // 2. Buscar en questionLabels del registro
        if (recQuestionLabels?.[key]) return recQuestionLabels[key];
        if (recQuestionLabels) {
          for (const [k, v] of Object.entries(recQuestionLabels)) {
            if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey) return v;
          }
        }

        // 3. Buscar en questionLabels del primer registro
        if (firstRecord.questionLabels?.[key]) return firstRecord.questionLabels[key];
        if (firstRecord.questionLabels) {
          for (const [k, v] of Object.entries(firstRecord.questionLabels)) {
            if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey) return v;
          }
        }

        // 4. Buscar en __question_labels
        if (recAnswers?.__question_labels?.[key]) return recAnswers.__question_labels[key];
        if (recAnswers?.__question_labels) {
          for (const [k, v] of Object.entries(recAnswers.__question_labels as Record<string, string>)) {
            if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey) return v;
          }
        }

        // 5. Buscar en localStorage de preguntas activas
        try {
          const stored = localStorage.getItem('votality_active_form_fields') || localStorage.getItem('votality_form_fields');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const matched = parsed.find((f: any) => f.id === key || (f.id && f.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey));
              if (matched?.label) return matched.label;
            }
          }
        } catch {}

        if (formFields && formFields.length > 0) {
          const customOnly = formFields.filter((f) => !f.isDefault && f.id !== 'nombre' && f.id !== 'direccion');
          if (customOnly.length === 1) return customOnly[0].label;
        }

        // 6. Si es una clave técnica como custom_179... jamás mostrar el código crudo
        if (cleanKey.startsWith('custom')) return 'Pregunta Personalizada';
        return key.replace(/_/g, ' ');
      };

      const recordsHtml = allRespondentsInCluster
        .map((rec, i) => {
          const fullName = getStructuredFullName(rec);
          const rawDate = rec.createdAt ? new Date(rec.createdAt) : null;
          const exactTimeStr = rawDate && !isNaN(rawDate.getTime())
            ? rawDate.toLocaleString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })
            : 'Hora no registrada';

          // Filtrar respuestas personalizadas reales
          const customQuestions = Object.entries(rec.answers || {}).filter(
            ([k]) => !isSystemMetadataKey(k)
          );

          return `
            <div style="background: #090909; border: 1px solid #242424; border-radius: 4px; padding: 10px; margin-bottom: 9px;">
              <!-- Nombre Completo de la Persona -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 7px;">
                <div style="font-weight: 700; font-size: 13px; color: #ffffff; line-height: 1.2;">
                  <span style="color: #00FF85; font-family: monospace; margin-right: 4px;">${count > 1 ? `#${i + 1}` : '👤'}</span>
                  ${fullName}
                </div>
                <span style="font-size: 9px; font-family: monospace; color: #00FF85; background: rgba(0,255,133,0.08); border: 1px solid rgba(0,255,133,0.3); padding: 1px 5px; border-radius: 2px; white-space: nowrap;">
                  ✓ Verificado
                </span>
              </div>

              <!-- Fecha y Hora Exacta de Registro + Encuestador -->
              <div style="font-family: monospace; font-size: 10px; color: #888888; display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 5px;">
                  <span>🕒</span>
                  <span><strong>Hora de registro:</strong> <span style="color: #ffffff; font-weight: bold;">${exactTimeStr}</span></span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                  <span>👤</span>
                  <span><strong>Encuestador:</strong> <span style="color: #cccccc;">${rec.surveyorName}</span></span>
                </div>
              </div>

              <!-- Preguntas Personalizadas y Respuestas -->
              <div style="margin-top: 6px; border-top: 1px dashed #202020; padding-top: 6px;">
                <div style="font-family: monospace; font-size: 9px; font-weight: bold; color: #aaaaaa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;">
                  📋 Preguntas Personalizadas (${customQuestions.length}):
                </div>

                ${
                  customQuestions.length === 0
                    ? `<div style="font-family: monospace; font-size: 10px; color: #666666; font-style: italic;">
                        Formulario base diligenciado (sin preguntas adicionales).
                      </div>`
                    : customQuestions
                        .map(([k, v]) => {
                          const qTitle = getQuestionLabelText(k, rec.answers, rec.questionLabels);
                          const formattedVal = typeof v === 'boolean' ? (v ? 'Sí / Afirmativo' : 'No / Negativo') : String(v);
                          return `
                            <div style="background: #111111; border: 1px solid #1f1f1f; border-left: 2.5px solid #00FF85; border-radius: 2px; padding: 5px 8px; margin-bottom: 4px;">
                              <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: #00FF85; text-transform: uppercase;">
                                ? ${qTitle}
                              </div>
                              <div style="font-size: 11px; font-weight: 600; color: #ffffff; margin-top: 2px;">
                                ${formattedVal}
                              </div>
                            </div>
                          `;
                        })
                        .join('')
                }
              </div>
            </div>
          `;
        })
        .join('');

      const moveButtonHtml = `
        <div style="margin-top: 8px; border-top: 1px solid #262626; padding-top: 8px; display: flex; gap: 6px;">
          <button id="btn-mover-pin-${firstRecord.id}" style="flex: 1; background: #f59e0b; color: #000000; font-family: monospace; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 7px 10px; border: none; border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s;">
            ⇄ Mover Pin
          </button>
          <button id="btn-detalle-pin-${firstRecord.id}" style="flex: 1; background: #ffffff; color: #000000; font-family: monospace; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 7px 10px; border: none; border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s;">
            Ver Panel
          </button>
        </div>
      `;

      popupContent.innerHTML = `${headerHtml}<div>${recordsHtml}</div>${moveButtonHtml}`;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'votality-monochrome-popup',
        autoPan: false,
      });

      marker.on('popupopen', () => {
        const btnMove = document.getElementById(`btn-mover-pin-${firstRecord.id}`);
        if (btnMove) {
          btnMove.onclick = () => {
            marker.closePopup();
            if (onMovePinRequest) {
              onMovePinRequest(firstRecord);
            }
          };
        }

        const btnDetail = document.getElementById(`btn-detalle-pin-${firstRecord.id}`);
        if (btnDetail) {
          btnDetail.onclick = () => {
            marker.closePopup();
            if (onPinSelect) {
              onPinSelect({
                ...firstRecord,
                respondents: allRespondentsInCluster,
              });
            }
          };
        }
      });

      marker.on('click', () => {
        // Dirigir la cámara directamente a las coordenadas de ESE pin (no a mi ubicación)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([cluster.lat, cluster.lng], 18, { duration: 0.8 });
        }
        if (onPinSelect) {
          onPinSelect({
            ...firstRecord,
            respondents: allRespondentsInCluster,
          });
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [pins, selectedPinId, maxPins]);

  // Centrar cámara y desplegar popup automáticamente cuando se selecciona un pin específico (ej. al guardar o desde el padrón)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPinId) return;
    const targetPin = pins.find((p) => p.id === selectedPinId);
    if (targetPin) {
      mapInstanceRef.current.flyTo([targetPin.lat, targetPin.lng], 18, { duration: 0.8 });
      markersLayerRef.current?.eachLayer((layer: any) => {
        if (layer.getLatLng && layer.openPopup) {
          const pos = layer.getLatLng();
          if (
            Math.abs(pos.lat - targetPin.lat) < 0.0001 &&
            Math.abs(pos.lng - targetPin.lng) < 0.0001
          ) {
            layer.openPopup();
          }
        }
      });
    }
  }, [selectedPinId]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Estilos para popups y controles Leaflet */}
      <style>{`
        .votality-monochrome-popup .leaflet-popup-content-wrapper {
          background: #000000 !important;
          color: #ffffff !important;
          border: 1px solid #ffffff !important;
          border-radius: 2px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.8) !important;
          padding: 0 !important;
        }
        .votality-monochrome-popup .leaflet-popup-tip {
          background: #000000 !important;
          border: 1px solid #ffffff !important;
        }
        .leaflet-control-zoom a {
          background-color: #000000 !important;
          color: #ffffff !important;
          border: 1px solid #333333 !important;
          border-radius: 2px !important;
          margin-bottom: 2px !important;
          transition: all 0.2s;
        }
        .leaflet-control-zoom a:hover {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #ffffff !important;
        }
        .votality-drag-tooltip {
          background: #000000 !important;
          color: #ffffff !important;
          border: 1px solid #ffffff !important;
          border-radius: 2px !important;
          font-family: monospace, sans-serif !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          letter-spacing: 0.03em !important;
          padding: 4px 8px !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.95) !important;
          white-space: nowrap !important;
          pointer-events: none !important;
        }
        .votality-drag-tooltip::before {
          border-top-color: #000000 !important;
        }
        .fixed-gps-address-marker svg,
        .draggable-address-marker svg {
          cursor: default !important;
        }
        .fixed-gps-address-marker:hover svg,
        .draggable-address-marker:hover svg {
          transform: scale(1.05);
          transition: transform 0.15s ease-out;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#e5e3df]" />

      {/* Botón Flotante de Localización GPS ("Mi Ubicación") */}
      <div className="absolute top-20 right-4 z-20 flex flex-col items-end gap-2">
        <button
          id="btn-mi-ubicacion"
          type="button"
          onClick={() => locateCurrentPosition(true)}
          disabled={isLocatingGps}
          className="flex items-center gap-2 px-3 py-2 bg-[#000000] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#FFFFFF] rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.85)] font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer active:scale-95 group select-none backdrop-blur-sm"
          title="Localizar mi ubicación GPS en tiempo real (alta precisión satelital)"
        >
          {isLocatingGps ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF] group-hover:text-[#000000]" />
              <span className="hidden sm:inline">GPS Activo...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4 text-[#FFFFFF] group-hover:text-[#000000] group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">Mi Ubicación</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

