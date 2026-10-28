import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Users, 
  MapPin, 
  Building2, 
  Filter, 
  Layers, 
  Crosshair, 
  Compass, 
  CheckCircle2, 
  Phone, 
  FileText,
  User,
  Plus
} from 'lucide-react';
import { Survey, SurveyPin } from '../types/voxpin';

interface MapViewProps {
  pins: SurveyPin[];
  activeSurvey: Survey;
  onOpenNewPinModalWithCoords?: (lat: number, lng: number) => void;
  selectedPin: SurveyPin | null;
  setSelectedPin: (pin: SurveyPin | null) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  pins,
  activeSurvey,
  onOpenNewPinModalWithCoords,
  selectedPin,
  setSelectedPin,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters state
  const [selectedLocality, setSelectedLocality] = useState<string>('todas');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('todos');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'exact' | 'neighborhood_only'>('all');
  const [selectedOptionFilter, setSelectedOptionFilter] = useState<string>('all');
  const [onlyFamilyClusters, setOnlyFamilyClusters] = useState<boolean>(false);
  const [showAddPrompt, setShowAddPrompt] = useState<boolean>(true);

  // Extract unique localities and neighborhoods
  const localities = useMemo(() => {
    const list = Array.from(new Set(pins.map((p) => p.locality)));
    return ['todas', ...list];
  }, [pins]);

  const neighborhoods = useMemo(() => {
    let filtered = pins;
    if (selectedLocality !== 'todas') {
      filtered = filtered.filter((p) => p.locality === selectedLocality);
    }
    const list = Array.from(new Set(filtered.map((p) => p.neighborhood)));
    return ['todos', ...list];
  }, [pins, selectedLocality]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      if (selectedLocality !== 'todas' && pin.locality !== selectedLocality) return false;
      if (selectedNeighborhood !== 'todos' && pin.neighborhood !== selectedNeighborhood) return false;
      if (locationTypeFilter !== 'all' && pin.locationType !== locationTypeFilter) return false;
      if (selectedOptionFilter !== 'all' && pin.answerOptionId !== selectedOptionFilter) return false;
      if (onlyFamilyClusters && (!pin.familyMembers || pin.familyMembers.length <= 1)) return false;
      return true;
    });
  }, [pins, selectedLocality, selectedNeighborhood, locationTypeFilter, selectedOptionFilter, onlyFamilyClusters]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center in Kennedy / Bogotá
    const map = L.map(mapContainerRef.current, {
      center: [4.629, -74.152],
      zoom: 14,
      zoomControl: false,
    });

    // Clean Dark CartoDB Tiles (Midnight map design as specified in DESIGN.md)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Click on map to add pin
    map.on('click', (e: L.LeafletEvent) => {
      const mouseEvent = e as L.LeafletMouseEvent;
      if (onOpenNewPinModalWithCoords) {
        onOpenNewPinModalWithCoords(mouseEvent.latlng.lat, mouseEvent.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onOpenNewPinModalWithCoords]);

  // Render markers whenever filteredPins, activeSurvey, or selectedPin changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    filteredPins.forEach((pin) => {
      const option = activeSurvey.options.find((o) => o.id === pin.answerOptionId) || activeSurvey.options[0];
      const pinColor = option ? option.color : '#007afc';
      const isFamilyCluster = pin.familyMembers && pin.familyMembers.length > 1;
      const memberCount = pin.familyMembers?.length || 1;
      const isSelected = selectedPin?.id === pin.id;

      let iconHtml = '';

      if (isFamilyCluster) {
        // Multi-person Family cluster marker (Page 3 of PDF: "Pin agrupado · misma dirección")
        iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="absolute w-10 h-10 rounded-full bg-[#f59e0b]/25 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-[#15171b] border-2 border-[#f59e0b] shadow-lg flex items-center justify-center text-white font-bold text-xs">
              <span class="text-[#f59e0b] font-black">${memberCount}</span>
            </div>
            <div class="absolute -bottom-1 w-2 h-2 rounded-full bg-[#f59e0b]"></div>
          </div>
        `;
      } else if (pin.locationType === 'neighborhood_only') {
        // "Solo el barrio" (Page 3: Pin general en la zona con halo)
        iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-6 h-6 rounded-full opacity-30" style="background-color: ${pinColor}"></div>
            <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center" style="background-color: ${pinColor}">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
        `;
      } else {
        // Exact address pin colored by response (Page 4)
        iconHtml = `
          <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${pinColor}">
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="w-1 h-2 -mt-0.5 rounded-b-sm" style="background-color: ${pinColor}"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-voxpin-marker',
        iconSize: isFamilyCluster ? [32, 32] : [24, 28],
        iconAnchor: isFamilyCluster ? [16, 16] : [12, 28],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedPin(pin);
      });

      marker.addTo(layer);
    });
  }, [filteredPins, activeSurvey, selectedPin, setSelectedPin]);

  // Quick reset to Kennedy view
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([4.629, -74.152], 14, { duration: 1.2 });
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#0e1012]">
      
      {/* Top Filter Bar (Directly from Page 3: Filtros de Visualización: Barrios, Calles, Conjuntos, Localidades) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-[#15171b]/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-[#1c1f24] shadow-2xl">
          <Filter className="w-4 h-4 text-[#007afc]" />
          <span className="text-xs font-semibold text-white tracking-wide uppercase hidden sm:inline">
            Filtros Geo:
          </span>

          {/* Localidad Filter */}
          <select
            value={selectedLocality}
            onChange={(e) => {
              setSelectedLocality(e.target.value);
              setSelectedNeighborhood('todos');
            }}
            className="bg-[#1c1f24] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#333943] focus:outline-none focus:border-[#007afc]"
          >
            <option value="todas">Localidad: Todas</option>
            {localities.filter(l => l !== 'todas').map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Barrio Filter */}
          <select
            value={selectedNeighborhood}
            onChange={(e) => setSelectedNeighborhood(e.target.value)}
            className="bg-[#1c1f24] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#333943] focus:outline-none focus:border-[#007afc]"
          >
            <option value="todos">Barrio: Todos</option>
            {neighborhoods.filter(b => b !== 'todos').map((barrio) => (
              <option key={barrio} value={barrio}>
                {barrio}
              </option>
            ))}
          </select>

          {/* Lógica de Ubicación Filter (Dirección Exacta vs Solo Barrio - Page 3) */}
          <div className="hidden md:flex items-center bg-[#1c1f24] rounded-xl p-0.5 border border-[#333943]">
            <button
              onClick={() => setLocationTypeFilter('all')}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                locationTypeFilter === 'all' ? 'bg-[#007afc] text-white' : 'text-[#8b96aa] hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setLocationTypeFilter('exact')}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                locationTypeFilter === 'exact' ? 'bg-[#007afc] text-white' : 'text-[#8b96aa] hover:text-white'
              }`}
              title="Punto en dirección exacta"
            >
              Dir. Exacta
            </button>
            <button
              onClick={() => setLocationTypeFilter('neighborhood_only')}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                locationTypeFilter === 'neighborhood_only' ? 'bg-[#007afc] text-white' : 'text-[#8b96aa] hover:text-white'
              }`}
              title="Pin general en la zona"
            >
              Solo Barrio
            </button>
          </div>

          {/* Toggle Family Clusters */}
          <button
            onClick={() => setOnlyFamilyClusters(!onlyFamilyClusters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border transition-all ${
              onlyFamilyClusters
                ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]'
                : 'bg-[#1c1f24] text-[#8b96aa] border-[#333943] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Agrupación Familiar</span>
          </button>
        </div>

        {/* Survey Response Legend & Quick Filter (Page 4: El Pin guarda la respuesta) */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#15171b]/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-[#1c1f24] shadow-2xl overflow-x-auto max-w-full">
          <span className="text-[11px] text-[#8b96aa] font-medium hidden lg:inline mr-1">
            Respuestas:
          </span>
          <button
            onClick={() => setSelectedOptionFilter('all')}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              selectedOptionFilter === 'all'
                ? 'bg-white text-black border-white'
                : 'text-[#8b96aa] border-[#1c1f24] hover:text-white'
            }`}
          >
            Todas ({filteredPins.length})
          </button>
          {activeSurvey.options.map((opt) => {
            const isOptSelected = selectedOptionFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOptionFilter(isOptSelected ? 'all' : opt.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  isOptSelected
                    ? 'border-white text-white shadow-sm'
                    : 'border-[#1c1f24] text-[#a0aaba] hover:text-white'
                }`}
                style={{
                  backgroundColor: isOptSelected ? `${opt.color}33` : '#1c1f24',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mapbox Inset Vignette Top/Bottom Overlay for deep night look */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-10"
        style={{ cursor: 'crosshair' }}
      />

      {/* Helper Notification Banner on first glance */}
      {showAddPrompt && (
        <div className="absolute bottom-6 left-4 z-20 bg-[#15171b]/95 border border-[#1c1f24] rounded-2xl p-3 shadow-2xl backdrop-blur-md max-w-sm flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-[#007afc]/15 text-[#007afc] rounded-lg mt-0.5">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Modo Mapeo Interactivo</p>
              <p className="text-[11px] text-[#8b96aa] leading-tight mt-0.5">
                Haz clic en cualquier punto del mapa para registrar un encuestado o abre el pin agrupado para ver los habitantes por dirección.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddPrompt(false)}
            className="text-[#566171] hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Control Shortcuts (Bottom Right above Leaflet default controls) */}
      <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-full bg-[#15171b] border border-[#1c1f24] shadow-xl flex items-center justify-center text-[#a0aaba] hover:text-white hover:border-[#007afc] transition-all"
          title="Centrar en Localidad de Kennedy"
        >
          <Compass className="w-5 h-5 text-[#007afc]" />
        </button>
      </div>

      {/* Detail Inspector Drawer / Popup for Selected Pin or Family Cluster */}
      {selectedPin && (
        <div className="absolute top-20 right-4 z-30 w-96 max-w-[calc(100vw-2rem)] bg-[#15171b] border border-[#1c1f24] rounded-3xl shadow-2xl p-5 overflow-y-auto max-h-[calc(100vh-8rem)] animate-slide-left">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1c1f24]">
            <div className="flex items-center gap-2.5">
              {selectedPin.familyMembers && selectedPin.familyMembers.length > 1 ? (
                <div className="w-9 h-9 rounded-2xl bg-[#f59e0b]/15 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b]">
                  <Users className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-[#007afc]/15 border border-[#007afc]/40 flex items-center justify-center text-[#007afc]">
                  <MapPin className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#007afc]">
                  {selectedPin.familyMembers && selectedPin.familyMembers.length > 1
                    ? 'Pin Agrupado · Misma Dirección'
                    : 'Pin Individual Geolocalizado'}
                </span>
                <h3 className="text-sm font-bold text-white">
                  {selectedPin.neighborhood} · {selectedPin.locality}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-[#8b96aa] hover:text-white p-1 rounded-lg bg-[#1c1f24]"
            >
              ✕
            </button>
          </div>

          {/* Location info */}
          <div className="py-3 border-b border-[#1c1f24] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8b96aa]">Dirección registrada:</span>
              <span className="font-semibold text-white">{selectedPin.address}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b96aa]">Lógica de ubicación:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                selectedPin.locationType === 'exact'
                  ? 'bg-[#007afc]/20 text-[#007afc]'
                  : 'bg-[#f59e0b]/20 text-[#f59e0b]'
              }`}>
                {selectedPin.locationType === 'exact' ? 'Dirección Exacta' : 'Solo Barrio'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b96aa]">Encuestador responsable:</span>
              <span className="text-[#bbc2ce]">{selectedPin.surveyorName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b96aa]">Fecha / Hora:</span>
              <span className="text-[#bbc2ce]">{selectedPin.timestamp}</span>
            </div>
          </div>

          {/* Family Cluster Display (Page 3 of PDF: Agrupación familiar / Clustering) */}
          {selectedPin.familyMembers && selectedPin.familyMembers.length > 1 ? (
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Habitantes del Hogar ({selectedPin.familyMembers.length})
                </span>
                <span className="text-[10px] text-[#228a56] font-medium bg-[#228a56]/15 px-2 py-0.5 rounded">
                  Cluster Unificado
                </span>
              </div>
              <p className="text-[11px] text-[#8b96aa] mb-3">
                Si varias personas viven en la misma dirección, el mapa las reúne en un solo pin para evitar saturación de la interfaz.
              </p>

              <div className="space-y-2.5">
                {selectedPin.familyMembers.map((member, idx) => {
                  const memberAnswer = activeSurvey.options.find((o) => o.id === member.answerOptionId);
                  return (
                    <div
                      key={member.id}
                      className="p-3 rounded-2xl bg-[#1c1f24] border border-[#23262d] flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#007afc]/20 text-[#007afc] flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </div>
                          <span className="font-semibold text-white text-xs">{member.name}</span>
                        </div>
                        <span className="text-[11px] text-[#f59e0b] font-medium">{member.age} años</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8b96aa] pt-1">
                        <div>Cédula: <span className="text-white">{member.cedula}</span></div>
                        <div>Tel: <span className="text-white">{member.phone}</span></div>
                      </div>

                      {/* Member's survey answer */}
                      <div className="mt-1 pt-1 border-t border-[#23262d] flex items-center justify-between">
                        <span className="text-[10px] text-[#8b96aa]">Respuesta:</span>
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: memberAnswer?.color || '#007afc' }}
                          />
                          <span className="text-[11px] font-semibold text-white">
                            {memberAnswer?.text || 'Sin respuesta'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Single Respondent Details */
            <div className="pt-3 space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#1c1f24] border border-[#23262d] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8b96aa]">Nombre completo:</span>
                  <span className="font-bold text-white">{selectedPin.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b96aa]">Edad:</span>
                  <span className="text-white">{selectedPin.age} años</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b96aa]">Cédula:</span>
                  <span className="text-white">{selectedPin.cedula}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b96aa]">Teléfono de contacto:</span>
                  <span className="text-white">{selectedPin.phone}</span>
                </div>
              </div>

              {/* Individual Respondent Answer */}
              <div className="p-3.5 rounded-2xl bg-[#1c1f24] border border-[#23262d]">
                <p className="text-[10px] text-[#8b96aa] uppercase font-bold tracking-wider mb-1">
                  Pregunta: {activeSurvey.question}
                </p>
                {(() => {
                  const ans = activeSurvey.options.find((o) => o.id === selectedPin.answerOptionId);
                  return (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: ans?.color || '#007afc' }} />
                      <span className="text-sm font-bold text-white">{ans?.text || 'Sin respuesta'}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Action button inside drawer */}
          <div className="mt-4 pt-3 border-t border-[#1c1f24] flex gap-2">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([selectedPin.lat, selectedPin.lng], 16, { duration: 1 });
                }
              }}
              className="flex-1 py-2 rounded-xl bg-[#23262d] hover:bg-[#333943] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5 text-[#007afc]" />
              <span>Acercar al Pin</span>
            </button>
            <button
              onClick={() => setSelectedPin(null)}
              className="px-4 py-2 rounded-xl bg-[#1c1f24] hover:bg-[#23262d] text-[#8b96aa] hover:text-white text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
