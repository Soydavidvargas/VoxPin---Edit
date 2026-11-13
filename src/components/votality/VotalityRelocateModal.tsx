import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Compass,
  CheckCircle,
  AlertTriangle,
  Layers,
  Crosshair,
  Loader2,
  Building,
  Check,
} from 'lucide-react';
import { SurveyRecord } from '../../types/votality';
import {
  COLOMBIA_DEPARTAMENTOS,
  COLOMBIA_MUNICIPIOS,
  getBarriosPorMunicipio,
  getBarrioCoordinates,
  fetchReverseGeocode,
  reverseGeocodeLocal,
} from '../../data/colombiaTerritoryData';
import { geocodeCascade } from '../../services/geocodingService';
import { StructuredAddressInput } from '../../services/geocodingTypes';
import { obtenerUbicacionExacta } from '../../utils/geolocation';

interface VotalityRelocateModalProps {
  pin: SurveyRecord;
  onClose: () => void;
  onConfirmRelocation: (params: {
    newLat: number;
    newLng: number;
    newAddress: string;
    newBarrio?: string;
    newMunicipio?: string;
    newDepartamento?: string;
    scope: 'solo_registro' | 'todo_el_predio';
    reason: string;
  }) => void;
}

const createDraggablePinIcon = () => {
  return L.divIcon({
    className: 'draggable-mini-pin-marker',
    html: `
      <div style="position: relative; width: 34px; height: 46px; display: flex; flex-direction: column; align-items: center; cursor: grab; transform: translate(-17px, -42px);">
        <div style="width: 28px; height: 28px; background: #000000; border: 2.5px solid #f59e0b; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.6); animation: bounce 1.8s infinite;">
          <div style="width: 9px; height: 9px; background: #f59e0b; border-radius: 9999px;"></div>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid #f59e0b; margin-top: -2px;"></div>
        <div style="position: absolute; bottom: 0; width: 12px; height: 4px; background: rgba(0,0,0,0.5); border-radius: 9999px; filter: blur(1.5px);"></div>
      </div>
    `,
    iconSize: [34, 46],
    iconAnchor: [17, 42],
    tooltipAnchor: [0, -42],
  });
};

export const VotalityRelocateModal: React.FC<VotalityRelocateModalProps> = ({
  pin,
  onClose,
  onConfirmRelocation,
}) => {
  // Coordenadas activas (gestionadas visualmente por el minimapa)
  const [currentLat, setCurrentLat] = useState<number>(pin.lat);
  const [currentLng, setCurrentLng] = useState<number>(pin.lng);

  // Dirección y datos territoriales
  const [addressInput, setAddressInput] = useState<string>(pin.address || '');
  const [departamento, setDepartamento] = useState<string>(pin.departamento || 'Huila');
  const [municipio, setMunicipio] = useState<string>(pin.municipio || 'Neiva');
  const [barrio, setBarrio] = useState<string>(pin.barrio || '');

  // Opciones de corrección
  const [scope, setScope] = useState<'solo_registro' | 'todo_el_predio'>('solo_registro');
  const [reason, setReason] = useState<string>('Corrección de precisión en puerta');
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Referencias para el Minimapa Leaflet
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMapMarkerRef = useRef<L.Marker | null>(null);
  const streetsLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  // Inicialización del Minimapa
  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 18,
        minZoom: 6,
        maxZoom: 20,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const streets = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
      }).addTo(map);
      streetsLayerRef.current = streets;

      const sat = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
      });
      satelliteLayerRef.current = sat;

      // Marcador arrastrable en el minimapa
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: createDraggablePinIcon(),
      }).addTo(map);

      marker.bindTooltip('Arrastra el pin hasta el punto o puerta exacta', {
        permanent: false,
        direction: 'top',
        offset: [0, -42],
      });

      // Evento al soltar el pin arrastrado
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        setStatusMessage('Pin reubicado en el minimapa. Obteniendo dirección...');

        try {
          const rev = await fetchReverseGeocode(newLat, newLng);
          if (rev) {
            if (rev.direccion) setAddressInput(rev.direccion);
            if (rev.barrio) setBarrio(rev.barrio);
            if (rev.municipio) setMunicipio(rev.municipio);
            if (rev.departamento) setDepartamento(rev.departamento);
            setStatusMessage('✓ Dirección actualizada según la nueva ubicación');
          }
        } catch {
          setStatusMessage('✓ Ubicación fijada en el mapa');
        }
      });

      // Evento al hacer clic en cualquier parte del minimapa
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        setStatusMessage('Pin movido al punto seleccionado. Obteniendo dirección...');

        try {
          const rev = await fetchReverseGeocode(newLat, newLng);
          if (rev) {
            if (rev.direccion) setAddressInput(rev.direccion);
            if (rev.barrio) setBarrio(rev.barrio);
            if (rev.municipio) setMunicipio(rev.municipio);
            if (rev.departamento) setDepartamento(rev.departamento);
            setStatusMessage('✓ Dirección actualizada según la nueva ubicación');
          }
        } catch {
          setStatusMessage('✓ Ubicación fijada en el mapa');
        }
      });

      miniMapMarkerRef.current = marker;
      miniMapInstanceRef.current = map;
    }

    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, []);

  // Cambiar tipo de mapa (Calles / Satélite)
  const toggleMapType = (type: 'streets' | 'satellite') => {
    if (!miniMapInstanceRef.current) return;
    setMapType(type);
    if (type === 'satellite') {
      if (streetsLayerRef.current) miniMapInstanceRef.current.removeLayer(streetsLayerRef.current);
      if (satelliteLayerRef.current) satelliteLayerRef.current.addTo(miniMapInstanceRef.current);
    } else {
      if (satelliteLayerRef.current) miniMapInstanceRef.current.removeLayer(satelliteLayerRef.current);
      if (streetsLayerRef.current) streetsLayerRef.current.addTo(miniMapInstanceRef.current);
    }
  };

  // Re-geocodificar automáticamente cuando el usuario cambia la dirección de texto
  const handleGeocodeAddress = async () => {
    if (!addressInput.trim()) return;
    setIsGeocoding(true);
    setStatusMessage('Buscando nueva dirección...');

    try {
      const structured: StructuredAddressInput = {
        departamento,
        municipio,
        tipoVia: 'Calle',
        numeroVia: addressInput.trim(),
        barrio: barrio.trim(),
        direccionTexto: `${addressInput.trim()}, ${barrio ? `Barrio ${barrio}, ` : ''}${municipio}, ${departamento}`,
      };

      const res = await geocodeCascade(structured);
      if (res && res.selected) {
        const nextLat = Number(res.selected.lat.toFixed(6));
        const nextLng = Number(res.selected.lng.toFixed(6));
        setCurrentLat(nextLat);
        setCurrentLng(nextLng);

        if (miniMapMarkerRef.current) {
          miniMapMarkerRef.current.setLatLng([nextLat, nextLng]);
        }
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.flyTo([nextLat, nextLng], 18, { duration: 0.8 });
        }
        setStatusMessage('✓ Dirección localizada con éxito en el minimapa');
      }
    } catch (e: any) {
      console.warn('Error localizando dirección:', e);
      setStatusMessage('No se pudo geocodificar la dirección exacta. Puedes mover el pin directamente en el minimapa.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Usar ubicación GPS satelital actual
  const handleUseGps = () => {
    setIsGpsLocating(true);
    setStatusMessage('Obteniendo señal GPS satelital...');
    obtenerUbicacionExacta(
      async (lat: number, lng: number) => {
        setIsGpsLocating(false);
        const finalLat = Number(lat.toFixed(6));
        const finalLng = Number(lng.toFixed(6));
        setCurrentLat(finalLat);
        setCurrentLng(finalLng);

        if (miniMapMarkerRef.current) {
          miniMapMarkerRef.current.setLatLng([finalLat, finalLng]);
        }
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.flyTo([finalLat, finalLng], 19, { duration: 0.8 });
        }

        try {
          const rev = await fetchReverseGeocode(finalLat, finalLng);
          if (rev) {
            if (rev.direccion) setAddressInput(rev.direccion);
            if (rev.barrio) setBarrio(rev.barrio);
            if (rev.municipio) setMunicipio(rev.municipio);
            if (rev.departamento) setDepartamento(rev.departamento);
          }
        } catch {}

        setStatusMessage('✓ Ubicación GPS satelital fijada en el minimapa');
      },
      (err) => {
        setIsGpsLocating(false);
        setStatusMessage(`Error GPS: ${err.message}. Puedes mover el pin directamente en el minimapa.`);
      }
    );
  };

  // Manejar confirmación de reubicación
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar bounds de Colombia
    if (currentLat < -4.3 || currentLat > 13.5 || currentLng < -81.8 || currentLng > -66.8) {
      setStatusMessage('Error: La ubicación debe encontrarse dentro del territorio de Colombia.');
      return;
    }

    onConfirmRelocation({
      newLat: currentLat,
      newLng: currentLng,
      newAddress: addressInput.trim() || pin.address,
      newBarrio: barrio.trim() || pin.barrio,
      newMunicipio: municipio.trim() || pin.municipio,
      newDepartamento: departamento.trim() || pin.departamento,
      scope,
      reason: reason.trim() || 'Corrección de precisión en puerta',
    });
  };

  return (
    <div
      id="modal-reubicar-pin"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none font-sans"
    >
      <div className="bg-[#000000] border-2 border-amber-500/80 w-full max-w-4xl rounded-sm shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-[#0a0a0a] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                ⇄ REUBICACIÓN Y CORRECCIÓN DE PIN
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                Moviendo ubicación de: {pin.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1a1a1a] rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split Formulario (Izquierda) + Minimapa Interactivo (Derecha) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Lado Izquierdo: Cambiar Dirección y Opciones */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto space-y-3.5 text-xs border-b md:border-b-0 md:border-r border-[#262626]">
            <div className="p-2.5 bg-[#0e0e0e] border border-[#262626] rounded-sm text-[11px] text-[#cccccc] leading-relaxed">
              Puedes <strong className="text-amber-400">arrastrar el pin directamente en el minimapa</strong> o <strong className="text-amber-400">escribir la nueva dirección</strong> para reposicionarlo de forma exacta.
            </div>

            {/* Dirección / Nomenclatura */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] uppercase text-[#aaaaaa] font-bold">
                Dirección / Nomenclatura Existente
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGeocodeAddress();
                    }
                  }}
                  placeholder="Ej: Calle 23 # 6 - 13, Carrera 5 # 10-20..."
                  className="flex-1 bg-[#111111] text-white p-2.5 border border-[#333333] rounded-sm text-xs font-sans focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleGeocodeAddress}
                  disabled={isGeocoding}
                  className="px-3 py-2 bg-[#222222] hover:bg-amber-500 hover:text-black text-white font-mono text-[11px] font-bold rounded-sm transition-colors flex items-center gap-1 cursor-pointer"
                  title="Localizar dirección en el minimapa"
                >
                  {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                  <span>Ubicar</span>
                </button>
              </div>
            </div>

            {/* Departamento y Municipio */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] uppercase text-[#aaaaaa]">
                  Departamento
                </label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full bg-[#111111] text-white p-2 border border-[#262626] rounded-sm text-xs focus:outline-none focus:border-amber-400"
                >
                  {COLOMBIA_DEPARTAMENTOS.map((d) => (
                    <option key={d.dane_code} value={d.nombre}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[10px] uppercase text-[#aaaaaa]">
                  Municipio
                </label>
                <input
                  type="text"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  placeholder="Municipio"
                  className="w-full bg-[#111111] text-white p-2 border border-[#262626] rounded-sm text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Barrio o Sector */}
            <div className="space-y-1">
              <label className="block font-mono text-[10px] uppercase text-[#aaaaaa]">
                Barrio, Comuna o Sector
              </label>
              <input
                type="text"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
                placeholder="Ej: Barrio Panamá, Centro, Las Palmas..."
                className="w-full bg-[#111111] text-white p-2 border border-[#262626] rounded-sm text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Botón GPS */}
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isGpsLocating}
              className="w-full py-2 bg-[#141414] hover:bg-[#202020] text-emerald-400 border border-emerald-500/40 rounded-sm font-mono text-[11px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isGpsLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Centrar en mi Ubicación GPS Actual</span>
            </button>

            {/* Alcance del Movimiento */}
            <div className="p-3 bg-[#0d0d0d] border border-[#222222] rounded-sm space-y-2">
              <label className="block font-mono text-[10px] uppercase text-[#aaaaaa] font-bold">
                Alcance de la Reubicación
              </label>
              <div className="space-y-1.5 font-mono text-[11px]">
                <label className="flex items-center gap-2 text-white cursor-pointer hover:text-amber-300 transition-colors">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'solo_registro'}
                    onChange={() => setScope('solo_registro')}
                    className="accent-amber-500"
                  />
                  <span>Mover solo a {pin.name}</span>
                </label>
                <label className="flex items-center gap-2 text-white cursor-pointer hover:text-amber-300 transition-colors">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'todo_el_predio'}
                    onChange={() => setScope('todo_el_predio')}
                    className="accent-amber-500"
                  />
                  <span>Mover todo el predio (encuestas acumuladas)</span>
                </label>
              </div>
            </div>

            {/* Motivo de Corrección */}
            <div className="space-y-1">
              <label className="block font-mono text-[10px] uppercase text-[#aaaaaa] font-bold">
                Motivo de la Corrección (Auditoría Territorial)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Corrección de precisión en puerta, cambio de dirección..."
                className="w-full bg-[#111111] text-white p-2 border border-[#262626] rounded-sm text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {statusMessage && (
              <div className="p-2 bg-[#121212] border border-amber-500/40 text-amber-300 text-[11px] font-mono rounded-sm">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Lado Derecho: Minimapa Interactivo */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#050505] relative min-h-[350px]">
            {/* Controles de vista del Minimapa */}
            <div className="absolute top-3 left-3 z-[400] flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 border border-white/20 rounded-xs">
              <button
                type="button"
                onClick={() => toggleMapType('streets')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-xs transition-colors ${
                  mapType === 'streets'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Calles
              </button>
              <button
                type="button"
                onClick={() => toggleMapType('satellite')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-xs transition-colors ${
                  mapType === 'satellite'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Satélite
              </button>
            </div>

            {/* Guía en el mapa */}
            <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-none">
              <div className="p-2 bg-black/85 backdrop-blur-md border border-white/20 text-center text-[10px] font-mono text-white rounded-xs">
                🎯 Arrastra el pin dorado o haz clic en el minimapa para posicionarlo en la puerta exacta
              </div>
            </div>

            {/* Contenedor Leaflet */}
            <div ref={miniMapContainerRef} className="w-full h-full flex-1" />
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 bg-[#0a0a0a] border-t border-[#262626] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-mono text-xs uppercase text-[#888888] hover:text-[#FFFFFF]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase font-bold tracking-wider rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Nueva Ubicación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
