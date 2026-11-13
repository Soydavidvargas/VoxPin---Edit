import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  AlertTriangle,
  Send,
  Crosshair,
  Loader2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  Building,
  Search,
  Sparkles,
} from 'lucide-react';
import { CensusSectorData, FormField, SurveyRecord } from '../../types/votality';
import {
  COLOMBIA_DEPARTAMENTOS,
  COLOMBIA_MUNICIPIOS,
  COLOMBIA_BARRIOS,
  getBarriosPorMunicipio,
  getBarrioCoordinates,
  fetchReverseGeocode,
  reverseGeocodeLocal,
} from '../../data/colombiaTerritoryData';
import { solicitarUbicacionGPS, obtenerUbicacionExacta } from '../../utils/geolocation';
import {
  StructuredAddressInput,
  CascadeGeocodeResult,
  GeocodeCandidate,
  PrecisionLevel,
} from '../../services/geocodingTypes';
import { buildNormalizedAddress, geocodeCascade, getBarrioContext } from '../../services/geocodingService';
import {
  DIAN_NOMENCLATURE_TABLE,
  formatToDianAddress,
  parseColombianAddress,
} from '../../utils/addressParser';

const createDraggableMiniPinIcon = (precision: PrecisionLevel = 'EXACTA') => {
  const pinColor =
    precision === 'EXACTA'
      ? '#10b981'
      : precision === 'APROXIMADA'
        ? '#f59e0b'
        : '#ef4444';

  const svg = `
    <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.85));">
      <path d="M16 2C8.26801 2 2 8.26801 2 16C2 26.5 16 42 16 42C16 42 30 26.5 30 16C30 8.26801 23.732 2 16 2Z" 
            fill="${pinColor}" 
            stroke="#FFFFFF" 
            stroke-width="2.5" 
            stroke-linejoin="round"/>
      <circle cx="16" cy="16" r="6" fill="#000000" stroke="#FFFFFF" stroke-width="1.8"/>
      <circle cx="16" cy="16" r="2.5" fill="#FFFFFF"/>
    </svg>
  `;

  return L.divIcon({
    className: 'interactive-draggable-modal-pin',
    html: `
      <div style="position: relative; width: 32px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab;">
        ${svg}
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
  });
};

interface VotalityCaptureModalProps {
  fields: FormField[];
  activeSector?: CensusSectorData;
  onSaveSurvey: (newSurvey: Omit<SurveyRecord, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  surveyorName: string;
  surveyorId: string;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

// Helper para formatear cualquier dirección colombiana al campo simplificado (tipo y número)
function splitColombianAddressToInputs(addrText: string): { tipo: string; num: string } {
  if (!addrText) return { tipo: 'Calle', num: '' };
  const clean = addrText.trim();
  const match = clean.match(/^(calle|cll|cl|carrera|cra|kr|diagonal|dg|transversal|tv|avenida|av)\s+([0-9a-zA-Z]+(?:\s+bis)?(?:\s+[a-zA-Z])?)\s*(?:#|\s)\s*([0-9a-zA-Z]+)\s*(?:-|–|\s)\s*([0-9]+)/i);
  if (match) {
    const rawTipo = match[1].toLowerCase();
    const tipo = rawTipo.startsWith('cra') || rawTipo.startsWith('kr') ? 'Carrera' :
      rawTipo.startsWith('dg') ? 'Diagonal' :
        rawTipo.startsWith('tv') ? 'Transversal' :
          rawTipo.startsWith('av') ? 'Avenida' : 'Calle';
    return {
      tipo,
      num: `${match[2]} ${match[3]}-${match[4]}`,
    };
  }
  const sinTipo = clean.replace(/^(calle|cll|cl|carrera|cra|kr|diagonal|dg|transversal|tv|avenida|av)\s+/i, '');
  return { tipo: 'Calle', num: sinTipo.replace(/^#\s*/, '') };
}

export const VotalityCaptureModal: React.FC<VotalityCaptureModalProps> = ({
  fields,
  activeSector,
  onSaveSurvey,
  onClose,
  surveyorName,
  surveyorId,
  initialLat,
  initialLng,
  initialAddress,
}) => {
  // Datos Personales del Encuestado (Dividido en Primer Nombre, Segundo Nombre, Primer Apellido, Segundo Apellido y Alias)
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [alias, setAlias] = useState('');

  // Validación de Nombres y Apellidos:
  // Regla estricta: Es obligatorio colocar primer nombre y primer apellido para poder guardar si o si
  const isPrimerNombreValid = primerNombre.trim().length >= 2;
  const isPrimerApellidoValid = primerApellido.trim().length >= 2;
  const isNombreValid = isPrimerNombreValid && isPrimerApellidoValid;

  // Nombre consolidado para identificación en el mapa y registro de encuesta
  const fullPersonName = useMemo(() => {
    const parts = [
      primerNombre.trim(),
      segundoNombre.trim(),
      primerApellido.trim(),
      segundoApellido.trim(),
    ].filter(Boolean);
    const base = parts.join(' ');
    if (alias.trim()) {
      return base ? `${base} (${alias.trim()})` : alias.trim();
    }
    return base;
  }, [primerNombre, segundoNombre, primerApellido, segundoApellido, alias]);

  // Coordenadas iniciales (Ubicación actual o sector activo)
  const initialCoordLat = initialLat ?? activeSector?.center?.[0] ?? 4.6097;
  const initialCoordLng = initialLng ?? activeSector?.center?.[1] ?? -74.0817;

  // Detección territorial automática instantánea (<1ms) según la ubicación donde se encuentre
  const initialGeo = useMemo(() => {
    return reverseGeocodeLocal(initialCoordLat, initialCoordLng);
  }, [initialCoordLat, initialCoordLng]);

  // Nomenclatura Vial y Dirección: Detección automática según ubicación donde esté el usuario
  const [departamento, setDepartamento] = useState<string>(
    initialLat !== undefined
      ? (initialGeo.departamento || 'Bogotá D.C.')
      : (activeSector?.department || initialGeo.departamento || 'Bogotá D.C.')
  );
  const [municipio, setMunicipio] = useState<string>(
    initialLat !== undefined
      ? (initialGeo.municipio || 'Bogotá')
      : (activeSector?.municipality || initialGeo.municipio || 'Bogotá')
  );
  const [barrio, setBarrio] = useState<string>(initialGeo.barrio || '');
  const [tipoVia, setTipoVia] = useState<string>('Calle');
  const [numeroVia, setNumeroVia] = useState<string>(''); // Casilla Verde donde se escribe "23 # 6-13", "23 6-13", etc.

  // Opciones simplificadas / ocultas (opcional)
  const [showOpcionesOcultas, setShowOpcionesOcultas] = useState(false);
  const [letraVia, setLetraVia] = useState<string>('');
  const [bis, setBis] = useState<boolean>(false);
  const [cuadranteVia, setCuadranteVia] = useState<string>('');
  const [complemento, setComplemento] = useState<string>('');

  // Validación de Ubicación y Dirección
  const [isGpsMarked, setIsGpsMarked] = useState(false);
  const isDireccionValid = numeroVia.trim().length >= 2;
  const isBarrioValid = barrio.trim().length > 0;

  const [isBarrioSearching, setIsBarrioSearching] = useState(false);
  const [barrioLocatedName, setBarrioLocatedName] = useState<string | null>(null);

  // Lista de barrios disponibles según el municipio y departamento seleccionados
  const availableBarrios = useMemo(() => {
    return getBarriosPorMunicipio(municipio, departamento);
  }, [municipio, departamento]);

  // Filtrado reactivo de chips de barrios según búsqueda
  const filteredBarrios = useMemo(() => {
    if (!barrio.trim()) return availableBarrios;
    const q = barrio.toLowerCase().trim();
    return availableBarrios.filter((b) => b.toLowerCase().includes(q));
  }, [availableBarrios, barrio]);

  // Handler para seleccionar barrio y posicionar el pin y minimapa de forma inmediata y exacta
  const handleSelectBarrio = async (selectedBarrio: string) => {
    setBarrio(selectedBarrio);
    if (!selectedBarrio.trim()) {
      setBarrioLocatedName(null);
      return;
    }

    // 1. Coordenadas locales instantáneas (<1ms)
    const bCoords = getBarrioCoordinates(selectedBarrio, municipio, departamento);
    if (bCoords) {
      setBarrioLocatedName(selectedBarrio);
      if (!numeroVia.trim()) {
        setLat(bCoords.lat);
        setLng(bCoords.lng);
        miniMapMarkerRef.current?.setLatLng([bCoords.lat, bCoords.lng]);
        miniMapInstanceRef.current?.flyTo([bCoords.lat, bCoords.lng], 17, { animate: true, duration: 0.6 });
        setIsPinConfirmed(true);
      }
      return;
    }

    // 2. Si no está en el catálogo local, búsqueda satelital en vivo
    setIsBarrioSearching(true);
    try {
      const liveCtx = await getBarrioContext(selectedBarrio, municipio, departamento);
      if (liveCtx) {
        setBarrioLocatedName(selectedBarrio);
        if (!numeroVia.trim()) {
          setLat(liveCtx.lat);
          setLng(liveCtx.lng);
          miniMapMarkerRef.current?.setLatLng([liveCtx.lat, liveCtx.lng]);
          miniMapInstanceRef.current?.flyTo([liveCtx.lat, liveCtx.lng], 17, { animate: true, duration: 0.6 });
          setIsPinConfirmed(true);
        }
      }
    } catch (e) {
      console.warn('Error buscando barrio satelital:', e);
    } finally {
      setIsBarrioSearching(false);
    }
  };

  // Efecto reactivo con debounce para geolocalizar y volar el minimapa automáticamente cuando el usuario escribe cualquier barrio
  useEffect(() => {
    const cleanB = barrio.trim();
    if (!cleanB || cleanB.length < 3) {
      setBarrioLocatedName(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Si el usuario ya tiene una vía escrita, geocodeCascade se encarga en su propio efecto
      if (numeroVia.trim()) {
        setBarrioLocatedName(cleanB);
        return;
      }

      // Buscar coordenadas del barrio escrito
      const localCoords = getBarrioCoordinates(cleanB, municipio, departamento);
      if (localCoords) {
        setLat(localCoords.lat);
        setLng(localCoords.lng);
        miniMapMarkerRef.current?.setLatLng([localCoords.lat, localCoords.lng]);
        miniMapInstanceRef.current?.flyTo([localCoords.lat, localCoords.lng], 17, { animate: true, duration: 0.6 });
        setBarrioLocatedName(cleanB);
        return;
      }

      setIsBarrioSearching(true);
      try {
        const liveCtx = await getBarrioContext(cleanB, municipio, departamento);
        if (liveCtx) {
          setLat(liveCtx.lat);
          setLng(liveCtx.lng);
          miniMapMarkerRef.current?.setLatLng([liveCtx.lat, liveCtx.lng]);
          miniMapInstanceRef.current?.flyTo([liveCtx.lat, liveCtx.lng], 17, { animate: true, duration: 0.6 });
          setBarrioLocatedName(cleanB);
        }
      } catch (err) {
        console.warn('Error ubicando barrio escrito:', err);
      } finally {
        setIsBarrioSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [barrio, municipio, departamento, numeroVia]);

  // Respuestas dinámicas
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});

  // Preguntas personalizadas adicionales (excluyendo los dos campos fijos base: Nombre y Dirección)
  const customFields = useMemo(() => {
    return (fields || []).filter((f) => !f.isDefault && f.id !== 'nombre' && f.id !== 'direccion');
  }, [fields]);

  // Coordenadas y Estado del Pin (Centrado inicial en el sector activo en el mapa)
  const [lat, setLat] = useState<number>(() => initialCoordLat);
  const [lng, setLng] = useState<number>(() => initialCoordLng);
  const [isPinConfirmed, setIsPinConfirmed] = useState(false);
  const [fuenteUbicacion, setFuenteUbicacion] = useState<'gps' | 'direccion' | 'ajuste_manual'>('direccion');
  const isUbicacionValida = isDireccionValid || isGpsMarked || fuenteUbicacion === 'gps' || fuenteUbicacion === 'ajuste_manual';

  // Validación estricta: Todas las preguntas personalizadas deben ser respondidas
  const areCustomFieldsValid = useMemo(() => {
    return customFields.every((f) => {
      const val = customAnswers[f.id];
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
  }, [customFields, customAnswers]);

  const isFormCompletelyValid = isNombreValid && isUbicacionValida && areCustomFieldsValid;

  // Estado del Motor en Cascada (Pasos 2, 3 y 4)
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [cascadeResult, setCascadeResult] = useState<CascadeGeocodeResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<GeocodeCandidate | null>(null);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);

  // Vistas de UI
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [showDianGlossary, setShowDianGlossary] = useState(false);
  const [showDebugTrace, setShowDebugTrace] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Referencias para Mini-Mapa Leaflet Real Interactivo
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMapMarkerRef = useRef<L.Marker | null>(null);
  const streetsLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  // Inicialización del Mini-Mapa Leaflet Real
  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: [lat, lng],
        zoom: 18,
        minZoom: 6,
        maxZoom: 20,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const streetsLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
      }).addTo(map);
      streetsLayerRef.current = streetsLayer;

      const satLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
      });
      satelliteLayerRef.current = satLayer;

      // Marcador 100% Arrastrable a Voluntad
      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: createDraggableMiniPinIcon(selectedCandidate?.precision || 'EXACTA'),
        autoPan: true,
      }).addTo(map);

      marker.bindTooltip('Arrastra el pin hasta la puerta exacta', {
        permanent: false,
        direction: 'top',
        offset: [0, -38],
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        setFuenteUbicacion('ajuste_manual');
        setIsPinConfirmed(true);

        // Ajustar automáticamente departamento y municipio según la nueva ubicación arrastrada
        const rev = reverseGeocodeLocal(newLat, newLng);
        if (rev) {
          if (rev.departamento) setDepartamento(rev.departamento);
          if (rev.municipio) setMunicipio(rev.municipio);
          if (rev.barrio && !barrio) setBarrio(rev.barrio);
        }
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        setFuenteUbicacion('ajuste_manual');
        setIsPinConfirmed(true);

        // Ajustar automáticamente departamento y municipio según el punto clickeado
        const rev = reverseGeocodeLocal(newLat, newLng);
        if (rev) {
          if (rev.departamento) setDepartamento(rev.departamento);
          if (rev.municipio) setMunicipio(rev.municipio);
          if (rev.barrio && !barrio) setBarrio(rev.barrio);
        }
      });

      miniMapMarkerRef.current = marker;
      miniMapInstanceRef.current = map;

      // Invalidador de tamaño con ResizeObserver y timers para asegurar renderizado inmediato de tiles
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(miniMapContainerRef.current);

      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 350);
      setTimeout(() => map.invalidateSize(), 700);

      return () => {
        resizeObserver.disconnect();
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.remove();
          miniMapInstanceRef.current = null;
          miniMapMarkerRef.current = null;
        }
      };
    }
  }, []);

  // Actualizar posición del marcador y vista del mapa cuando cambien lat / lng
  useEffect(() => {
    if (!miniMapInstanceRef.current || !miniMapMarkerRef.current) return;
    miniMapMarkerRef.current.setLatLng([lat, lng]);
    miniMapMarkerRef.current.setIcon(
      createDraggableMiniPinIcon(
        fuenteUbicacion === 'ajuste_manual' ? 'EXACTA' : selectedCandidate?.precision || 'EXACTA'
      )
    );
    try {
      const center = miniMapInstanceRef.current.getCenter();
      const dist = Math.hypot(center.lat - lat, center.lng - lng);
      if (dist > 0.05) {
        miniMapInstanceRef.current.setView([lat, lng], 15);
      } else {
        miniMapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.4 });
      }
    } catch {
      miniMapInstanceRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng, selectedCandidate, fuenteUbicacion]);

  // Alternancia entre Calles y Satélite
  const toggleMapType = () => {
    const map = miniMapInstanceRef.current;
    if (!map || !streetsLayerRef.current || !satelliteLayerRef.current) return;

    if (mapType === 'streets') {
      map.removeLayer(streetsLayerRef.current);
      map.addLayer(satelliteLayerRef.current);
      setMapType('satellite');
    } else {
      map.removeLayer(satelliteLayerRef.current);
      map.addLayer(streetsLayerRef.current);
      setMapType('streets');
    }
  };

  // Filtrar municipios por departamento seleccionado
  const availableMunicipios = useMemo(() => {
    const cleanDept = departamento.toLowerCase().trim();
    return COLOMBIA_MUNICIPIOS.filter((m) => {
      const mDept = (m.departamento || '').toLowerCase().trim();
      return mDept === cleanDept || (cleanDept.includes('bogot') && mDept.includes('bogot'));
    });
  }, [departamento]);

  // Dirección normalizada y DIAN en vivo
  const fullAddressString = useMemo(() => {
    const num = numeroVia.trim();
    if (!num) return '';
    // Limpiar si el usuario ya escribió "Calle", "Cll", "CL", etc. dentro de la casilla
    const cleanNum = num.replace(/^(calle|cll|cl|carrera|cra|kr|diagonal|dg|transversal|tv|avenida|av|circular|cq)\s+/i, '');
    const extraParts = [
      `${tipoVia} ${cleanNum}`,
      letraVia ? letraVia.toUpperCase() : '',
      bis ? 'Bis' : '',
      cuadranteVia ? cuadranteVia : '',
    ].filter(Boolean).join(' ');

    const parsed = parseColombianAddress(extraParts);
    return parsed.direccion_canonica || extraParts;
  }, [tipoVia, numeroVia, letraVia, bis, cuadranteVia]);

  const normalizedAddressPreview = fullAddressString;
  const dianPreview = formatToDianAddress(
    `${normalizedAddressPreview}${barrio ? ` BR ${barrio}` : ''}${complemento ? ` ${complemento}` : ''}`
  );

  const structuredInput: StructuredAddressInput = {
    departamento,
    municipio,
    tipoVia,
    numeroVia,
    letraVia,
    bis,
    cuadranteVia,
    barrio: barrio.trim(),
    complemento: complemento.trim(),
    direccionTexto: fullAddressString,
  };

  // Geocodificar en cascada con debounce al modificar la casilla de dirección
  useEffect(() => {
    setIsPinConfirmed(false);
    const timer = setTimeout(async () => {
      if (!numeroVia.trim()) return;
      setIsGeocoding(true);
      setErrorMsg(null);
      try {
        const result = await geocodeCascade(structuredInput, gpsData);
        setCascadeResult(result);
        setSelectedCandidate(result.selected);
        const finalLat = Number(result.selected.lat.toFixed(6));
        const finalLng = Number(result.selected.lng.toFixed(6));
        setLat(finalLat);
        setLng(finalLng);
        setFuenteUbicacion('direccion');
        if (miniMapMarkerRef.current) {
          miniMapMarkerRef.current.setLatLng([finalLat, finalLng]);
        }
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.setView([finalLat, finalLng], 17);
        }
      } catch (err: any) {
        console.error('Error en geocodificación:', err);
      } finally {
        setIsGeocoding(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    departamento,
    municipio,
    barrio,
    tipoVia,
    numeroVia,
    letraVia,
    bis,
    cuadranteVia,
    complemento,
  ]);

  // Autodetección inmediata de la ubicación física real del usuario al abrir el modal
  useEffect(() => {
    if (initialAddress) {
      const { tipo, num } = splitColombianAddressToInputs(initialAddress);
      setTipoVia(tipo);
      setNumeroVia(num);
    }

    if (initialLat !== undefined && initialLng !== undefined) {
      setLat(initialLat);
      setLng(initialLng);
      setIsPinConfirmed(true);

      const revLocal = reverseGeocodeLocal(initialLat, initialLng);
      if (revLocal.departamento) setDepartamento(revLocal.departamento);
      if (revLocal.municipio) setMunicipio(revLocal.municipio);
      if (revLocal.barrio) setBarrio(revLocal.barrio);

      fetchReverseGeocode(initialLat, initialLng).then((rev) => {
        if (rev) {
          if (rev.departamento) setDepartamento(rev.departamento);
          if (rev.municipio) setMunicipio(rev.municipio);
          if (rev.barrio) setBarrio(rev.barrio);
          if (!initialAddress && rev.direccion) {
            const { tipo, num } = splitColombianAddressToInputs(rev.direccion);
            setTipoVia(tipo);
            setNumeroVia(num);
          }
        }
      });
    } else {
      // Si no se pasaron coordenadas previas, detectar automáticamente la ubicación física real del usuario
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userLat = Number(pos.coords.latitude.toFixed(6));
            const userLng = Number(pos.coords.longitude.toFixed(6));
            setLat(userLat);
            setLng(userLng);
            setIsPinConfirmed(true);

            // Detección territorial automática en <1ms
            const revLocal = reverseGeocodeLocal(userLat, userLng);
            if (revLocal.departamento) setDepartamento(revLocal.departamento);
            if (revLocal.municipio) setMunicipio(revLocal.municipio);
            if (revLocal.barrio) setBarrio(revLocal.barrio);

            // Mover mini-mapa y marcador a la ubicación donde está el usuario
            if (miniMapMarkerRef.current) {
              miniMapMarkerRef.current.setLatLng([userLat, userLng]);
            }
            if (miniMapInstanceRef.current) {
              miniMapInstanceRef.current.flyTo([userLat, userLng], 17, { animate: true, duration: 0.8 });
            }

            // Geocodificación inversa satelital en segundo plano
            fetchReverseGeocode(userLat, userLng).then((rev) => {
              if (rev) {
                if (rev.departamento) setDepartamento(rev.departamento);
                if (rev.municipio) setMunicipio(rev.municipio);
                if (rev.barrio) setBarrio(rev.barrio);
                if (!numeroVia.trim() && rev.direccion) {
                  const { tipo, num } = splitColombianAddressToInputs(rev.direccion);
                  setTipoVia(tipo);
                  setNumeroVia(num);
                }
              }
            });
          },
          (err) => {
            console.log('Geolocalización automática de navegador no disponible o denegada:', err.message);
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
        );
      }
    }
  }, [initialLat, initialLng, initialAddress]);

  // Manejar captura de GPS con alta precisión (Paso 5) y Guardado Inteligente
  const handleGpsHighAccuracy = () => {
    setErrorMsg(null);

    // 1. REGLA ESTRICTA: Es obligatorio colocar Primer Nombre y Primer Apellido para poder guardar si o si
    if (!primerNombre.trim() || !primerApellido.trim()) {
      setErrorMsg('Es obligatorio colocar Primer Nombre y Primer Apellido de la persona para marcar la ubicación satelital y guardar.');
      const targetInput = !primerNombre.trim()
        ? document.getElementById('input-primer-nombre')
        : document.getElementById('input-primer-apellido');
      if (targetInput) targetInput.focus();
      return;
    }

    setIsGpsActive(true);
    obtenerUbicacionExacta(
      async (gpsLat, gpsLng, gpsAccuracy) => {
        setIsGpsActive(false);
        const accuracy = gpsAccuracy || 10;
        setGpsData({ lat: gpsLat, lng: gpsLng, accuracy });

        // Coordenadas exactas fijadas sin importar restricciones manuales de dirección
        const finalLat = Number(gpsLat.toFixed(6));
        const finalLng = Number(gpsLng.toFixed(6));
        setLat(finalLat);
        setLng(finalLng);
        setFuenteUbicacion('gps');
        setIsPinConfirmed(true);
        setIsGpsMarked(true);

        // Mover mini-mapa a nivel de predio (zoom 19) y reubicar marcador
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.flyTo([finalLat, finalLng], 19, { animate: true, duration: 0.8 });
        }
        if (miniMapMarkerRef.current) {
          miniMapMarkerRef.current.setLatLng([finalLat, finalLng]);
          miniMapMarkerRef.current.setIcon(createDraggableMiniPinIcon('EXACTA'));
        }

        // Geocodificación inversa satelital instantánea para obtener barrio, municipio y dirección referencial
        let resolvedAddress = '';
        let resolvedBarrio = barrio;
        let resolvedMun = municipio;
        let resolvedDep = departamento;

        try {
          const rev = await fetchReverseGeocode(finalLat, finalLng);
          if (rev) {
            if (rev.departamento) {
              setDepartamento(rev.departamento);
              resolvedDep = rev.departamento;
            }
            if (rev.municipio) {
              setMunicipio(rev.municipio);
              resolvedMun = rev.municipio;
            }
            if (rev.barrio) {
              setBarrio(rev.barrio);
              resolvedBarrio = rev.barrio;
            }
            if (rev.direccion) {
              resolvedAddress = rev.direccion;
              const { tipo, num } = splitColombianAddressToInputs(rev.direccion);
              setTipoVia(tipo);
              setNumeroVia(num);
            }
          }
        } catch (e) {
          console.warn('Reversa geocodificación omitida:', e);
        }

        // Construir dirección de respaldo limpia
        const finalFormattedAddress =
          resolvedAddress ||
          normalizedAddressPreview ||
          (resolvedBarrio ? `Barrio ${resolvedBarrio}, ${resolvedMun}` : `${resolvedMun}, ${resolvedDep}`) ||
          `Ubicación GPS (${finalLat.toFixed(6)}, ${finalLng.toFixed(6)})`;

        // 2. VERIFICACIÓN DE PREGUNTAS PERSONALIZADAS:
        // Regla estricta: Al activar mi ubicación, NO se guardará automáticamente hasta que
        // TODAS las preguntas personalizadas de la encuesta también se hayan respondido.
        const pendingCustomQuestions = customFields.filter((f) => {
          const val = customAnswers[f.id];
          return val === undefined || val === null || String(val).trim() === '';
        });

        const canAutoSave = customFields.length === 0 || pendingCustomQuestions.length === 0;

        if (canAutoSave) {
          // Mapeo legible de preguntas y etiquetas
          const questionLabelsMap: Record<string, string> = {};
          (fields || []).forEach((f) => {
            questionLabelsMap[f.id] = f.label;
          });

          // GUARDADO AUTOMÁTICO INMEDIATO:
          // Se guarda la encuesta automáticamente y se coloca el PIN en la ubicación precisa del usuario
          onSaveSurvey({
            campaignId: 'camp-votality-2026',
            name: fullPersonName,
            address: finalFormattedAddress,
            lat: finalLat,
            lng: finalLng,
            surveyorId,
            surveyorName,
            censusSector: resolvedBarrio?.trim() || resolvedMun,
            fuente: 'gps',
            nivelPrecision: 'EXACTA',
            locationType: 'ROOFTOP',
            candidatoElegido: finalFormattedAddress,
            puntaje: 100,
            advertencias: [],
            direccionNormalizada: finalFormattedAddress,
            barrio: resolvedBarrio?.trim() || '',
            departamento: resolvedDep,
            municipio: resolvedMun,
            questionLabels: questionLabelsMap,
            answers: {
              nombre: fullPersonName,
              primer_nombre: primerNombre.trim(),
              segundo_nombre: segundoNombre.trim(),
              primer_apellido: primerApellido.trim(),
              segundo_apellido: segundoApellido.trim(),
              alias: alias.trim(),
              direccion: finalFormattedAddress,
              direccion_normalizada: finalFormattedAddress,
              direccion_dian: dianPreview || finalFormattedAddress,
              departamento: resolvedDep,
              municipio: resolvedMun,
              barrio: resolvedBarrio?.trim() || '',
              complemento: complemento.trim(),
              fuente_ubicacion: 'gps',
              nivel_precision: 'EXACTA',
              ...customAnswers,
            },
          });

          onClose();
        } else {
          // Si faltan preguntas personalizadas por responder:
          // NO se guarda automáticamente. Se fija la ubicación precisa satelital y se orienta al usuario para responderlas.
          setErrorMsg(
            `✓ Ubicación satelital fijada con precisión. Por favor responde las preguntas personalizadas (${pendingCustomQuestions.length} pendiente${pendingCustomQuestions.length > 1 ? 's' : ''}) para guardar la encuesta.`
          );
          setTimeout(() => {
            const customSection = document.getElementById('seccion-preguntas-personalizadas');
            if (customSection) {
              customSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 120);
        }
      },
      (err) => {
        setIsGpsActive(false);
        setErrorMsg(`Error GPS: ${err.message}. Puedes ingresar la dirección o arrastrar el pin.`);
      }
    );
  };

  // Confirmar Pin
  const handleConfirmLocation = () => {
    setIsPinConfirmed(true);
    setIsGpsMarked(true);
    setErrorMsg(null);
  };

  // Manejo de guardado final
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // REGLA ESTRICTA: Es obligatorio colocar primer nombre y primer apellido para poder guardar si o si
    if (!primerNombre.trim() || !primerApellido.trim()) {
      setErrorMsg('Es obligatorio colocar el Primer Nombre y Primer Apellido de la persona para poder guardar la encuesta.');
      const targetInput = !primerNombre.trim()
        ? document.getElementById('input-primer-nombre')
        : document.getElementById('input-primer-apellido');
      if (targetInput) targetInput.focus();
      return;
    }

    // Solo se exige escribir dirección manual si NO se ha fijado la ubicación por GPS
    if (!isGpsMarked && fuenteUbicacion !== 'gps' && !numeroVia.trim()) {
      setErrorMsg('Debes ingresar la dirección del encuestado o presionar "Marcar Mi Ubicación (GPS Satelital)".');
      return;
    }

    // Validar preguntas personalizadas de la encuesta
    for (const field of customFields) {
      const val = customAnswers[field.id];
      if (val === undefined || val === null || String(val).trim() === '') {
        setErrorMsg(`La pregunta personalizada "${field.label}" debe ser respondida para guardar la encuesta.`);
        const customSection = document.getElementById('seccion-preguntas-personalizadas');
        if (customSection) {
          customSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    // Si no pulsó confirmar explícitamente, se confirma automáticamente al guardar
    setIsPinConfirmed(true);

    // Validar límites de Colombia
    if (lat < -4.3 || lat > 13.5 || lng < -81.8 || lng > -66.8) {
      setErrorMsg('Ubicación fuera de Colombia. VoxPin opera exclusivamente en territorio nacional.');
      return;
    }

    const precisionFinal: PrecisionLevel =
      fuenteUbicacion === 'gps' || fuenteUbicacion === 'ajuste_manual'
        ? 'EXACTA'
        : selectedCandidate?.precision || 'APROXIMADA';

    const fullFormattedAddress =
      (numeroVia.trim() ? `${normalizedAddressPreview}${barrio ? `, Barrio ${barrio}` : ''}${complemento ? `, ${complemento}` : ''}` : '') ||
      (barrio ? `Barrio ${barrio}, ${municipio}` : `${municipio}, ${departamento}`) ||
      `Ubicación GPS Satelital (${lat.toFixed(6)}, ${lng.toFixed(6)})`;

    // Mapeo legible de preguntas y etiquetas
    const questionLabelsMap: Record<string, string> = {};
    (fields || []).forEach((f) => {
      questionLabelsMap[f.id] = f.label;
    });

    onSaveSurvey({
      campaignId: 'camp-votality-2026',
      name: fullPersonName,
      address: fullFormattedAddress,
      lat,
      lng,
      surveyorId,
      surveyorName,
      censusSector: barrio.trim() || municipio,
      fuente: fuenteUbicacion,
      nivelPrecision: precisionFinal,
      locationType: selectedCandidate?.locationType || (fuenteUbicacion === 'gps' ? 'ROOFTOP' : 'RANGE_INTERPOLATED'),
      candidatoElegido: selectedCandidate?.label || fullFormattedAddress,
      puntaje: selectedCandidate?.score || (fuenteUbicacion === 'gps' ? 100 : 90),
      advertencias: selectedCandidate?.warnings || [],
      direccionNormalizada: normalizedAddressPreview || fullFormattedAddress,
      barrio: barrio.trim(),
      departamento,
      municipio,
      questionLabels: questionLabelsMap,
      answers: {
        nombre: fullPersonName,
        primer_nombre: primerNombre.trim(),
        segundo_nombre: segundoNombre.trim(),
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim(),
        alias: alias.trim(),
        direccion: fullFormattedAddress,
        direccion_normalizada: normalizedAddressPreview || fullFormattedAddress,
        direccion_dian: dianPreview || fullFormattedAddress,
        departamento,
        municipio,
        barrio: barrio.trim(),
        complemento: complemento.trim(),
        fuente_ubicacion: fuenteUbicacion,
        nivel_precision: precisionFinal,
        ...customAnswers,
      },
    });

    onClose();
  };

  const precisionBadge = () => {
    const prec = selectedCandidate?.precision || 'APROXIMADA';
    if (prec === 'EXACTA') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-sm font-bold">
          <CheckCircle className="w-3.5 h-3.5" /> EXACTA (Predio / Puerta)
        </span>
      );
    }
    if (prec === 'APROXIMADA') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-amber-950/80 border border-amber-500 text-amber-300 rounded-sm font-bold">
          <AlertCircle className="w-3.5 h-3.5" /> APROXIMADA (Tramo Vial)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-rose-950/80 border border-rose-500 text-rose-300 rounded-sm font-bold">
        <AlertTriangle className="w-3.5 h-3.5" /> SOLO MUNICIPIO
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md font-sans select-none">
      <div className="bg-[#000000] border border-[#FFFFFF] w-full max-w-5xl rounded-sm shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-[#262626] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
              REGISTRO DE ENCUESTADO · GEORREFERENCIACIÓN COLOMBIA
            </div>
            <h2 className="text-base font-bold text-[#FFFFFF] mt-0.5">
              Captura Territorial con Confirmación de Pin
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1a1a1a] rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body Split (Izquierda Formulario, Derecha Mini-Mapa de Confirmación) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Panel Izquierdo: Datos Estructurados */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto space-y-3.5 text-xs border-b md:border-b-0 md:border-r border-[#262626]">
            {/* Guía visual para usuario no técnico */}
            <div className="p-2.5 bg-[#0e0e0e] border border-[#262626] rounded-sm text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isFormCompletelyValid
                      ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                      : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'
                  }`}
                />
                <span className="text-[#cccccc] text-[11px] leading-snug">
                  {isFormCompletelyValid
                    ? '✓ Datos, ubicación satelital y preguntas listos para guardar el PIN en el mapa'
                    : !isNombreValid
                    ? 'Es obligatorio colocar Primer Nombre y Primer Apellido para ubicar y confirmar el PIN'
                    : !isUbicacionValida
                    ? 'Nombre listo. Pulsa "Marcar Mi Ubicación (GPS Satelital)" o ingresa la dirección para ubicar el PIN.'
                    : `Faltan responder las preguntas personalizadas obligatorias (${customFields.filter((f) => !customAnswers[f.id] || String(customAnswers[f.id]).trim() === '').length} pendientes)`}
                </span>
              </div>
            </div>

            {/* Datos Personales del Encuestado con marco dinámico en ROJO / VERDE */}
            <div
              className={`p-3 rounded-sm transition-all space-y-2.5 ${
                isNombreValid
                  ? 'border-2 border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                  : 'border-2 border-red-500 bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.12)]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <label className="block font-mono text-[11px] font-bold text-white tracking-wide">
                  DATOS PERSONALES DEL ENCUESTADO <span className="text-red-400">*</span>
                </label>
                {isNombreValid ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    ✓ Completado
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-red-400 flex items-center gap-1">
                    ⚠ Obligatorio: Primer Nombre y Apellido
                  </span>
                )}
              </div>

              {/* Fila 1: Primer Nombre (Obligatorio) y Segundo Nombre (Opcional) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] font-bold text-[#dddddd] mb-1">
                    Primer Nombre <span className="text-red-400 font-black">*</span>
                  </label>
                  <input
                    id="input-primer-nombre"
                    type="text"
                    required
                    value={primerNombre}
                    onChange={(e) => setPrimerNombre(e.target.value)}
                    placeholder="Ej: Juan"
                    className={`w-full bg-[#111111] text-white p-2 border rounded-sm text-xs font-sans focus:outline-none transition-colors ${
                      isPrimerNombreValid
                        ? 'border-emerald-500/80 focus:border-emerald-400'
                        : 'border-red-500/80 focus:border-red-400 placeholder:text-red-300/40'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#888888] mb-1">
                    Segundo Nombre <span className="text-[#666666] text-[9px]">(Opcional)</span>
                  </label>
                  <input
                    id="input-segundo-nombre"
                    type="text"
                    value={segundoNombre}
                    onChange={(e) => setSegundoNombre(e.target.value)}
                    placeholder="Ej: David"
                    className="w-full bg-[#111111] text-white p-2 border border-[#262626] rounded-sm text-xs font-sans focus:outline-none focus:border-[#444444] transition-colors"
                  />
                </div>
              </div>

              {/* Fila 2: Primer Apellido (Obligatorio) y Segundo Apellido (Opcional) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] font-bold text-[#dddddd] mb-1">
                    Primer Apellido <span className="text-red-400 font-black">*</span>
                  </label>
                  <input
                    id="input-primer-apellido"
                    type="text"
                    required
                    value={primerApellido}
                    onChange={(e) => setPrimerApellido(e.target.value)}
                    placeholder="Ej: Pérez"
                    className={`w-full bg-[#111111] text-white p-2 border rounded-sm text-xs font-sans focus:outline-none transition-colors ${
                      isPrimerApellidoValid
                        ? 'border-emerald-500/80 focus:border-emerald-400'
                        : 'border-red-500/80 focus:border-red-400 placeholder:text-red-300/40'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#888888] mb-1">
                    Segundo Apellido <span className="text-[#666666] text-[9px]">(Opcional)</span>
                  </label>
                  <input
                    id="input-segundo-apellido"
                    type="text"
                    value={segundoApellido}
                    onChange={(e) => setSegundoApellido(e.target.value)}
                    placeholder="Ej: Gómez"
                    className="w-full bg-[#111111] text-white p-2 border border-[#262626] rounded-sm text-xs font-sans focus:outline-none focus:border-[#444444] transition-colors"
                  />
                </div>
              </div>

              {/* Fila 3: Alias / Apodo (Opcional) */}
              <div>
                <label className="block font-mono text-[10px] text-[#888888] mb-1">
                  Alias / Apodo <span className="text-[#666666] text-[9px]">(Opcional)</span>
                </label>
                <input
                  id="input-alias"
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Ej: El Capi, Doña Rosa, Chepe..."
                  className="w-full bg-[#111111] text-white p-2 border border-[#262626] rounded-sm text-xs font-sans focus:outline-none focus:border-[#444444] transition-colors"
                />
              </div>

              {!isNombreValid && (
                <p className="text-[10px] font-mono text-red-400 mt-0.5">
                  * Es obligatorio colocar Primer Nombre y Primer Apellido para poder guardar si o si
                </p>
              )}
            </div>

            {/* Departamento y Municipio */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-[#aaaaaa] uppercase font-bold">
                  Departamento *
                </label>
                <select
                  value={departamento}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setDepartamento(newDept);
                    const cleanNew = newDept.toLowerCase().trim();
                    const munis = COLOMBIA_MUNICIPIOS.filter((m) => {
                      const mDept = (m.departamento || '').toLowerCase().trim();
                      return mDept === cleanNew || (cleanNew.includes('bogot') && mDept.includes('bogot'));
                    });
                    const defaultMuni = munis.length > 0 && munis[0].nombre ? munis[0].nombre : 'Bogotá';
                    setMunicipio(defaultMuni);
                    setBarrio('');
                    const foundMuni = munis.find((m) => m.nombre === defaultMuni) || munis[0];
                    if (foundMuni) {
                      setLat(foundMuni.lat);
                      setLng(foundMuni.lon);
                      setIsPinConfirmed(true);
                      if (miniMapMarkerRef.current) {
                        miniMapMarkerRef.current.setLatLng([foundMuni.lat, foundMuni.lon]);
                      }
                      if (miniMapInstanceRef.current) {
                        miniMapInstanceRef.current.setView([foundMuni.lat, foundMuni.lon], 15);
                      }
                    }
                  }}
                  className="w-full bg-[#111111] text-[#FFFFFF] p-2 border border-[#333333] hover:border-[#666666] rounded-sm text-xs focus:outline-none cursor-pointer"
                >
                  {COLOMBIA_DEPARTAMENTOS.map((d) => (
                    <option key={d.dane_code} value={d.nombre}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-[#aaaaaa] uppercase font-bold">
                  Municipio *
                </label>
                <select
                  value={municipio}
                  onChange={(e) => {
                    const newMuni = e.target.value;
                    setMunicipio(newMuni);
                    setBarrio('');
                    const cleanMuni = newMuni.toLowerCase().trim();
                    const cleanDept = departamento.toLowerCase().trim();
                    const foundMuni =
                      availableMunicipios.find(
                        (m) => m.nombre && m.nombre.toLowerCase().trim() === cleanMuni
                      ) ||
                      COLOMBIA_MUNICIPIOS.find(
                        (m) =>
                          m.nombre &&
                          m.nombre.toLowerCase().trim() === cleanMuni &&
                          (m.departamento || '').toLowerCase().trim() === cleanDept
                      ) ||
                      COLOMBIA_MUNICIPIOS.find(
                        (m) => m.nombre && m.nombre.toLowerCase().trim() === cleanMuni
                      );
                    if (foundMuni) {
                      setLat(foundMuni.lat);
                      setLng(foundMuni.lon);
                      setIsPinConfirmed(true);
                      if (miniMapMarkerRef.current) {
                        miniMapMarkerRef.current.setLatLng([foundMuni.lat, foundMuni.lon]);
                      }
                      if (miniMapInstanceRef.current) {
                        miniMapInstanceRef.current.setView([foundMuni.lat, foundMuni.lon], 15);
                      }
                    }
                  }}
                  className="w-full bg-[#111111] text-[#FFFFFF] p-2 border border-[#333333] hover:border-[#666666] rounded-sm text-xs focus:outline-none cursor-pointer"
                >
                  {availableMunicipios.length > 0 ? (
                    availableMunicipios.map((m) => (
                      <option key={m.dane_code || m.nombre} value={m.nombre || ''}>
                        {m.nombre || ''}
                      </option>
                    ))
                  ) : (
                    <option value={municipio}>{municipio}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Barrio / Sector con buscador interactivo, auto-vuelo satelital y chips dinámicos */}
            <div className="space-y-2 p-3 bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#383838] transition-colors rounded-sm shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <label className="block font-mono text-[10px] text-[#cccccc] uppercase font-bold tracking-wide">
                    Barrio, Sector o Comuna
                  </label>
                </div>
                {isBarrioSearching ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold animate-pulse bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded-sm">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    Ubicando sector...
                  </span>
                ) : barrioLocatedName || (barrio && isBarrioValid) ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/50 px-2 py-0.5 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    ✓ {barrio}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-[#777777]">Opcional / Sugerido</span>
                )}
              </div>

              {/* Casilla de búsqueda con icono y botón de limpiar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#666666] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  list="barrios-sugeridos-list"
                  value={barrio}
                  onChange={(e) => handleSelectBarrio(e.target.value)}
                  placeholder={`Escriba o elija un barrio de ${municipio}...`}
                  className="w-full bg-[#141414] text-[#FFFFFF] pl-8 pr-8 py-2 border border-[#333333] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 rounded-sm text-xs font-mono focus:outline-none transition-all placeholder:text-[#555555]"
                />
                {barrio && (
                  <button
                    type="button"
                    onClick={() => {
                      setBarrio('');
                      setBarrioLocatedName(null);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white p-0.5 transition-colors cursor-pointer"
                    title="Borrar barrio"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <datalist id="barrios-sugeridos-list">
                  {availableBarrios.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              {/* Indicador de barrio libre geolocalizado en vivo si no está en la lista estándar */}
              {barrio.trim() &&
                !availableBarrios.some((b) => b.toLowerCase() === barrio.toLowerCase().trim()) && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded-sm text-[10px] font-mono text-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>
                      Sector personalizado <strong className="text-white">"{barrio}"</strong> geolocalizado automáticamente en el mapa.
                    </span>
                  </div>
                )}

              {/* Chips dinámicos de barrios filtrados con diseño pulido */}
              {availableBarrios.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase text-[#777777]">
                    <span>Barrios en {municipio}:</span>
                    <span className="text-[#555555]">{filteredBarrios.length} sectores</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {filteredBarrios.map((b) => {
                      const isSelected = barrio.toLowerCase() === b.toLowerCase();
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleSelectBarrio(b)}
                          className={`px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${isSelected
                              ? 'bg-emerald-500 text-black font-bold border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                              : 'bg-[#141414] text-[#aaaaaa] border-[#2e2e2e] hover:text-white hover:border-[#555555] hover:bg-[#1c1c1c]'
                            }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* DIRECCIÓN NOMENCLATURA (DIAN) */}
            <div
              className={`p-3.5 rounded-sm space-y-2.5 transition-all ${
                isDireccionValid || isGpsMarked || fuenteUbicacion === 'gps'
                  ? 'border-2 border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'border-2 border-red-500 bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
              }`}
            >
              <div className="flex items-center justify-between pb-1 border-b border-[#262626]">
                <div className="font-mono text-[10px] uppercase font-bold text-white flex items-center gap-1.5">
                  <span>Dirección Nomenclatura (DIAN)</span>
                  <button
                    type="button"
                    onClick={() => setShowDianGlossary(!showDianGlossary)}
                    className="underline text-[#aaaaaa] hover:text-[#FFFFFF] cursor-pointer text-[9px] font-normal"
                  >
                    {showDianGlossary ? 'Cerrar Siglas' : 'Ver Siglas DIAN'}
                  </button>
                </div>
                {isDireccionValid ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    ✓ Dirección Ingresada
                  </span>
                ) : isGpsMarked || fuenteUbicacion === 'gps' ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    ✓ Ubicación GPS Satelital Fijada
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-red-400">
                    ⚠ Ingrese dirección o pulse botón GPS
                  </span>
                )}
              </div>

              {showDianGlossary && (
                <div className="p-2 bg-[#141414] border border-[#333333] rounded-xs text-[10px] font-mono grid grid-cols-3 gap-1">
                  {DIAN_NOMENCLATURE_TABLE.slice(0, 15).map((item) => (
                    <span key={item.sigla} className="text-[#cccccc]">
                      <strong className="text-white">{item.sigla}</strong>: {item.nombre}
                    </span>
                  ))}
                </div>
              )}

              {/* Fila Principal: Sigla de Calle + Casilla Verde con el número completo */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#888888] flex items-center justify-between">
                  <span>1. Vía Principal y Número / Cruce:</span>
                  {!numeroVia.trim() ? (
                    <span className="text-red-400 font-bold">* Falta número</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">✓ Listo</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Selector con siglas DIAN (Calle CL, Carrera KR, etc.) */}
                  <select
                    value={tipoVia}
                    onChange={(e) => setTipoVia(e.target.value)}
                    className="w-36 bg-[#141414] text-[#FFFFFF] p-2.5 border border-[#333333] hover:border-[#666] rounded-xs text-xs font-mono font-bold cursor-pointer"
                  >
                    <option value="Calle">Calle (CL)</option>
                    <option value="Carrera">Carrera (KR)</option>
                    <option value="Diagonal">Diagonal (DG)</option>
                    <option value="Transversal">Transversal (TV)</option>
                    <option value="Avenida">Avenida (AV)</option>
                    <option value="Avenida Calle">Av. Calle (AC)</option>
                    <option value="Avenida Carrera">Av. Carrera (AK)</option>
                    <option value="Circular">Circular (CQ)</option>
                  </select>

                  {/* La Casilla Verde donde escribe "23 # 6-13", "23 6-13", "73 Sur # 80-15" */}
                  <input
                    type="text"
                    required
                    placeholder="Ej: 23 6-13 (o 23 # 6-13)"
                    value={numeroVia}
                    onChange={(e) => setNumeroVia(e.target.value)}
                    className={`flex-1 bg-[#141414] text-[#FFFFFF] p-2.5 border rounded-xs text-xs font-mono font-bold focus:outline-none transition-all ${numeroVia.trim()
                        ? 'border-2 border-emerald-500 bg-emerald-950/25 text-white focus:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'border-2 border-red-500 bg-red-950/25 focus:border-red-400 placeholder:text-red-300/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Botón GPS de Alta Precisión */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGpsHighAccuracy}
                disabled={isGpsActive}
                className="flex-1 py-2 px-3 bg-[#111111] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#444444] rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isGpsActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5" />
                )}
                <span>Marcar Mi Ubicación (GPS Satelital)</span>
              </button>
            </div>

            {/* SECCIÓN DINÁMICA: PREGUNTAS PERSONALIZADAS DE LA ENCUESTA */}
            {customFields.length > 0 && (
              <div id="seccion-preguntas-personalizadas" className="pt-3 border-t border-[#262626] space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#1c1c1c]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#00FF85] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preguntas Personalizadas de la Encuesta ({customFields.length})</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#888888] bg-[#141414] px-1.5 py-0.5 rounded border border-[#2a2a2a]">
                    En tiempo real
                  </span>
                </div>

                {customFields.map((field, idx) => {
                  const val = customAnswers[field.id];
                  const isMissing = val === undefined || val === '' || val === null;

                  return (
                    <div
                      key={field.id}
                      className={`p-3 bg-[#0a0a0a] rounded-sm border transition-all space-y-2 ${
                        isMissing
                          ? 'border-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                          : 'border-[#262626] focus-within:border-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="text-[#00FF85]">#{idx + 1}</span>
                          <span>{field.label}</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[9px] font-mono uppercase text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-800/50 font-bold">
                          ▲ Obligatorio
                        </span>
                      </div>

                      {/* Campo de Texto Abierto */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={val || ''}
                          onChange={(e) =>
                            setCustomAnswers((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          placeholder={`Escriba la respuesta para "${field.label}"...`}
                          className="w-full bg-[#111111] border border-[#333333] focus:border-[#FFFFFF] px-3 py-2 text-xs text-white placeholder-[#555555] rounded-sm outline-none transition-colors"
                        />
                      )}

                      {/* Campo Numérico */}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={val !== undefined ? val : ''}
                          onChange={(e) =>
                            setCustomAnswers((prev) => ({
                              ...prev,
                              [field.id]: e.target.value === '' ? '' : Number(e.target.value),
                            }))
                          }
                          placeholder="Ingrese valor numérico..."
                          className="w-full bg-[#111111] border border-[#333333] focus:border-[#FFFFFF] px-3 py-2 text-xs text-white placeholder-[#555555] rounded-sm outline-none transition-colors font-mono"
                        />
                      )}

                      {/* Campo Opción Múltiple (Select / Chips) */}
                      {field.type === 'select' && (
                        <div className="space-y-1.5">
                          <select
                            value={val !== undefined ? String(val) : ''}
                            onChange={(e) =>
                              setCustomAnswers((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-[#111111] border border-[#333333] text-white px-3 py-2 text-xs font-mono rounded-sm focus:border-[#FFFFFF] outline-none"
                          >
                            <option value="" className="bg-[#111111] text-[#888888]">
                              -- Seleccione una opción --
                            </option>
                            {(field.options || ['Opción A', 'Opción B']).map((opt) => (
                              <option key={opt} value={opt} className="bg-[#111111] text-white">
                                {opt}
                              </option>
                            ))}
                          </select>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(field.options || ['Opción A', 'Opción B']).map((opt) => {
                              const isSelected = val === opt;
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() =>
                                    setCustomAnswers((prev) => ({
                                      ...prev,
                                      [field.id]: opt,
                                    }))
                                  }
                                  className={`px-2.5 py-1 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#00FF85] text-black border-[#00FF85] font-bold shadow-[0_0_8px_rgba(0,255,133,0.3)]'
                                      : 'bg-[#141414] text-[#aaaaaa] border-[#333333] hover:text-white hover:border-[#666666]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Campo Booleano (Sí / No) */}
                      {field.type === 'boolean' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomAnswers((prev) => ({
                                ...prev,
                                [field.id]: true,
                              }))
                            }
                            className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-xs border transition-all cursor-pointer ${
                              val === true
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : 'bg-[#141414] text-[#888888] border-[#333333] hover:text-white'
                            }`}
                          >
                            ✓ Sí
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomAnswers((prev) => ({
                                ...prev,
                                [field.id]: false,
                              }))
                            }
                            className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-xs border transition-all cursor-pointer ${
                              val === false
                                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                                : 'bg-[#141414] text-[#888888] border-[#333333] hover:text-white'
                            }`}
                          >
                            ✕ No
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Derecho: Mini-Mapa de Confirmación Obligatoria (Paso 5) */}
          <div className="w-full md:w-1/2 p-4 flex flex-col justify-between space-y-3 bg-[#050505]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FFFFFF]" />
                  <span className="font-mono text-xs uppercase font-bold text-white">
                    Confirmación del Pin
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {precisionBadge()}
                </div>
              </div>

              {/* Información entendida por el geocodificador */}
              <div className="p-2.5 bg-[#0e0e0e] border border-[#262626] rounded-sm text-xs font-mono space-y-1">
                <div className="text-[#888888] text-[10px]">DIRECCIÓN RESUELTA:</div>
                <div className="text-white font-bold truncate">
                  {selectedCandidate?.label || 'Buscando candidato...'}
                </div>
                <div className="text-[10px] text-[#aaaaaa]">
                  Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)} | Fuente: {fuenteUbicacion}
                </div>
              </div>

              {/* Advertencias de consistencia */}
              {selectedCandidate?.warnings && selectedCandidate.warnings.length > 0 && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-600/50 rounded-sm text-amber-200 text-xs font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    {selectedCandidate.warnings.map((w, idx) => (
                      <div key={idx}>{w}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini-Mapa Leaflet Real Interactivo de Confirmación y Ajuste */}
              <div className="relative w-full h-64 sm:h-72 bg-[#141414] border border-[#FFFFFF] rounded-sm overflow-hidden shadow-inner">
                {/* Contenedor DOM para la instancia real de Leaflet */}
                <div ref={miniMapContainerRef} className="w-full h-full z-0" />

                {/* Barra superior de información sobre el mapa */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2 max-w-[80%] pointer-events-none">
                  <div className="bg-black/90 text-white border border-white/40 px-2.5 py-1 rounded-xs font-mono text-[10px] shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ARRÁSTRALO O TOCA EL MAPA EN LA PUERTA</span>
                  </div>
                </div>

                {/* Botón flotante para alternar Calles vs Satélite */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    onClick={toggleMapType}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-black/90 hover:bg-white text-white hover:text-black border border-white/60 rounded-xs font-mono text-[10px] uppercase font-bold transition-all shadow-lg backdrop-blur-md cursor-pointer"
                    title="Alternar entre vista de calles y vista satélite fotográfica"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{mapType === 'streets' ? 'Satélite' : 'Calles'}</span>
                  </button>
                </div>

                {/* Coordenadas en vivo en esquina inferior izquierda */}
                <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                  <div className="bg-black/95 text-white border border-white/40 px-2 py-0.5 rounded-xs font-mono text-[9px] shadow-md">
                    LAT: {lat.toFixed(6)} | LNG: {lng.toFixed(6)}
                    {fuenteUbicacion === 'ajuste_manual' && (
                      <span className="ml-1 text-emerald-400 font-bold">(AJUSTADO)</span>
                    )}
                  </div>
                </div>

                {/* Controles de Micro-Ajuste Manual en cruz */}
                <div className="absolute bottom-2 right-12 flex gap-1 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setLat((l) => Number((l + 0.00005).toFixed(6)));
                      setFuenteUbicacion('ajuste_manual');
                      setIsPinConfirmed(true);
                    }}
                    className="p-1 px-1.5 bg-black/90 hover:bg-white text-white hover:text-black border border-white/60 text-[9px] font-mono rounded-xs shadow-md transition-colors"
                    title="Mover Norte (Micro-ajuste)"
                  >
                    ▲ N
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLat((l) => Number((l - 0.00005).toFixed(6)));
                      setFuenteUbicacion('ajuste_manual');
                      setIsPinConfirmed(true);
                    }}
                    className="p-1 px-1.5 bg-black/90 hover:bg-white text-white hover:text-black border border-white/60 text-[9px] font-mono rounded-xs shadow-md transition-colors"
                    title="Mover Sur (Micro-ajuste)"
                  >
                    ▼ S
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLng((g) => Number((g - 0.00005).toFixed(6)));
                      setFuenteUbicacion('ajuste_manual');
                      setIsPinConfirmed(true);
                    }}
                    className="p-1 px-1.5 bg-black/90 hover:bg-white text-white hover:text-black border border-white/60 text-[9px] font-mono rounded-xs shadow-md transition-colors"
                    title="Mover Oeste (Micro-ajuste)"
                  >
                    ◀ O
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLng((g) => Number((g + 0.00005).toFixed(6)));
                      setFuenteUbicacion('ajuste_manual');
                      setIsPinConfirmed(true);
                    }}
                    className="p-1 px-1.5 bg-black/90 hover:bg-white text-white hover:text-black border border-white/60 text-[9px] font-mono rounded-xs shadow-md transition-colors"
                    title="Mover Este (Micro-ajuste)"
                  >
                    ▶ E
                  </button>
                </div>
              </div>

              {/* Botón de Confirmación Obligatoria del Pin */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className={`w-full py-2.5 px-3 font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${isPinConfirmed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                      : 'bg-white hover:bg-[#e5e5e5] text-black border border-black'
                    }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isPinConfirmed
                      ? '✓ Ubicación Confirmada (Listo para Guardar)'
                      : 'Confirmar Ubicación del Pin'}
                  </span>
                </button>
              </div>

              {/* Panel de Depuración (Paso 7: Solo en desarrollo) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDebugTrace(!showDebugTrace)}
                  className="text-[10px] font-mono text-[#777777] hover:text-[#FFFFFF] underline flex items-center gap-1"
                >
                  <span>{showDebugTrace ? 'Ocultar Depuración' : 'Modo Depuración (Cascada y Puntaje)'}</span>
                </button>

                {showDebugTrace && cascadeResult && (
                  <div className="mt-1 p-2 bg-[#0c0c0c] border border-[#262626] text-[10px] font-mono text-[#888888] space-y-1 max-h-32 overflow-y-auto">
                    <div>Puntaje Final: {selectedCandidate?.score}</div>
                    <div>Paso Cascada: {selectedCandidate?.step}</div>
                    {cascadeResult.debugTrace?.map((d, i) => (
                      <div key={i}>
                        [{d.step}] Intento: "{d.attemptQuery}" -&gt; {d.candidatesFound} candidatos
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono rounded-sm">
                {errorMsg}
              </div>
            )}

            {/* Footer de Acciones */}
            <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-mono text-xs uppercase text-[#888888] hover:text-[#FFFFFF]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!isFormCompletelyValid}
                className={`px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center gap-2 transition-all shadow-md ${
                  isFormCompletelyValid
                    ? 'bg-[#FFFFFF] text-[#000000] hover:bg-[#e5e5e5] cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    : 'bg-[#222222] text-[#666666] border border-[#333333] cursor-not-allowed'
                }`}
                title={
                  !isNombreValid
                    ? 'Es obligatorio colocar Primer Nombre y Primer Apellido de la persona'
                    : !isUbicacionValida
                    ? 'Falta marcar ubicación GPS o ingresar dirección'
                    : !areCustomFieldsValid
                    ? 'Es obligatorio responder todas las preguntas personalizadas para guardar el PIN'
                    : 'Guardar encuesta y viajar inmediatamente a su pin en el mapa'
                }
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Guardar y Ver PIN en Mapa</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
