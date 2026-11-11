import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Loader2 } from 'lucide-react';
import { SearchLocationTarget, SurveyRecord } from '../../types/votality';
import { obtenerUbicacionExacta } from '../../utils/geolocation';

interface VotalityMapProps {
  pins: SurveyRecord[];
  center: [number, number];
  zoom?: number;
  onPinSelect?: (pin: SurveyRecord) => void;
  selectedPinId?: string | null;
  maxPins?: number;
  searchTarget?: SearchLocationTarget | null;
  onSearchLocationAdjusted?: (lat: number, lng: number) => void;
  onGpsLocated?: (lat: number, lng: number, accuracy?: number) => void;
  onGpsError?: (message: string) => void;
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

// Marcador Fijo Inmutable por GPS Nativo (100% no arrastrable)
const createFixedGpsPinIcon = () => {
  return L.divIcon({
    className: 'fixed-gps-address-marker',
    html: `
      <div style="position: relative; width: 40px; height: 52px; display: flex; flex-direction: column; align-items: center; cursor: default; transform: translate(-20px, -46px);">
        <!-- Sombra en suelo con pulso sutil -->
        <div style="position: absolute; bottom: 0; width: 18px; height: 6px; background: rgba(0,0,0,0.5); border-radius: 50%; filter: blur(1.5px);"></div>
        <!-- Pin Monocromático de Alta Precisión Inmutable -->
        <svg width="36" height="48" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.85));">
          <path d="M17 2C8.71573 2 2 8.71573 2 17C2 27.5 17 40 17 40C17 40 32 27.5 32 17C32 8.71573 25.2843 2 17 2Z" 
                fill="#000000" 
                stroke="#FFFFFF" 
                stroke-width="2.5" 
                stroke-linejoin="round"/>
          <circle cx="17" cy="17" r="7" 
                  fill="#FFFFFF" 
                  stroke="#000000" 
                  stroke-width="2"/>
          <circle cx="17" cy="17" r="2.8" fill="#000000"/>
        </svg>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 48],
    popupAnchor: [0, -44],
  });
};

const createDraggableAddressPinIcon = createFixedGpsPinIcon;

// Strictly Monochromatic SVG Vector Marker
const createMonochromePinIcon = (isSelected: boolean, index: number) => {
  const svg = `
    <svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="0" y="0" width="34" height="46" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M17 2C8.71573 2 2 8.71573 2 17C2 27.5 17 40 17 40C17 40 32 27.5 32 17C32 8.71573 25.2843 2 17 2Z" 
              fill="${isSelected ? '#FFFFFF' : '#000000'}" 
              stroke="${isSelected ? '#000000' : '#FFFFFF'}" 
              stroke-width="2.5" 
              stroke-linejoin="round"/>
        <circle cx="17" cy="17" r="6" 
                fill="${isSelected ? '#000000' : '#FFFFFF'}" 
                stroke="${isSelected ? '#FFFFFF' : '#000000'}" 
                stroke-width="1.5"/>
      </g>
    </svg>
  `;

  return L.divIcon({
    className: 'monochrome-leaflet-marker',
    html: `
      <div style="cursor: pointer; transform: translate(-17px, -40px); transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
        ${svg}
      </div>
    `,
    iconSize: [34, 46],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
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
  onSearchLocationAdjusted,
  onGpsLocated,
  onGpsError,
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
            // Centrar el mapa con zoom de calle
            map.flyTo([lat, lng], 18, { duration: 1.5 });

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

              surveyMarker.bindTooltip('Pin Fijo: Ubicación GPS Inmutable', {
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
          prefix: '<span style="font-family: monospace; font-size: 10px; color: #888;">VOTALITY GIS • LEAFLET</span>',
        })
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      mapInstanceRef.current = map;

      // 1. AUTO-ENFOQUE POR GPS NATIVO AL CARGAR LA PLATAFORMA (Alta precisión satelital + calibración)
      locateCurrentPosition(false);
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
    if (mapInstanceRef.current && !searchTarget) {
      mapInstanceRef.current.flyTo(center, zoom, {
        duration: 1.2,
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

  // Update pins on map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Limit pins if specified (e.g. 100 for Free Plan)
    const visiblePins = pins.slice(0, maxPins);

    visiblePins.forEach((pin, index) => {
      const isSelected = pin.id === selectedPinId;
      const marker = L.marker([pin.lat, pin.lng], {
        icon: createMonochromePinIcon(isSelected, index),
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'font-sans text-xs bg-black text-white p-3 border border-white/20 shadow-2xl rounded-sm max-w-xs';
      popupContent.innerHTML = `
        <div style="font-family: monospace; font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
          PIN #${pin.id} • ${pin.censusSector || 'Sector Censal'}
        </div>
        <div style="font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 2px;">
          ${pin.name}
        </div>
        <div style="color: #bbb; margin-bottom: 8px;">
          ${pin.address}
        </div>
        <div style="border-top: 1px solid #333; padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
          ${Object.entries(pin.answers || {})
            .map(([key, val]) => `
              <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 11px;">
                <span style="color: #777; text-transform: capitalize;">${key.replace('_', ' ')}:</span>
                <span style="color: #fff; font-weight: 600;">${String(val)}</span>
              </div>
            `)
            .join('')}
        </div>
        <div style="margin-top: 8px; font-family: monospace; font-size: 9px; color: #666; border-top: 1px dashed #222; padding-top: 4px;">
          Encuestador: ${pin.surveyorName} • ${new Date(pin.createdAt).toLocaleDateString()}
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'votality-monochrome-popup',
      });

      marker.on('click', () => {
        if (onPinSelect) {
          onPinSelect(pin);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [pins, selectedPinId, maxPins]);

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

