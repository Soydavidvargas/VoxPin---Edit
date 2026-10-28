import React, { useState } from 'react';
import { 
  ArrowRight, 
  MapPin
} from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  // Pin switch between Cluster and Individual
  const [activePinType, setActivePinType] = useState<'cluster' | 'individual'>('cluster');
  const [selectedResidentIndex, setSelectedResidentIndex] = useState<number>(0);

  // Exact data from Page 3 & Page 4 of PDF in neutral monochrome
  const familyResidents = [
    { label: 'Persona 1', age: '52 años', details: 'nombre, cédula, teléfono...', answer: 'Tiene bigote', color: '#ffffff' },
    { label: 'Persona 2', age: '49 años', details: 'nombre, cédula, teléfono...', answer: 'No tiene bigote', color: '#525252' },
    { label: 'Persona 3', age: '24 años', details: 'nombre, cédula, teléfono...', answer: 'Tiene medio bigote', color: '#a3a3a3' },
    { label: 'Persona 4', age: '17 años', details: 'nombre, cédula, teléfono...', answer: 'No tiene bigote', color: '#525252' },
  ];

  return (
    <section id="hero" className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-16 lg:py-24 border-b border-[#2e2e2e] bg-[#0a0a0a]">
      
      {/* Topographic Hairline Grid Overlay in neutral grayscale */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px]"></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* Left Column (7 cols): Editorial Monochromatic Typography */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Mission Data Tag (Strictly Monochrome) */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span>PROPUESTA TÉCNICA · WEB + MÓVIL</span>
            </div>

            {/* Massive Editorial Headline: 58-72px, weight 400, line-height 0.90, tracking -0.03em */}
            <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-normal text-white tracking-[-0.03em] leading-[0.90] font-sans">
              Encuestas <br />
              <span className="text-[#a3a3a3]">geolocalizadas</span>
            </h1>

            {/* Body text: 18px, lh 1.62, neutral readable */}
            <p className="text-base sm:text-[18px] text-[#d4d4d4] max-w-xl font-normal leading-[1.62] tracking-[-0.03em]">
              Una plataforma SaaS para mapear opiniones, intención de voto y datos de mercado: <strong className="text-white font-medium">cada persona encuestada es un pin en el mapa</strong>, y cada pin alimenta estadísticas en tiempo real.
            </p>

            {/* 3 Metric Cards (Page 1) — Flat, 1px hairline border, monochrome */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
              
              <div className="p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
                <div className="text-3xl font-mono font-light text-white">04</div>
                <div className="text-[11px] font-mono text-[#8a8a8a] uppercase tracking-wider mt-1">
                  MÓDULOS
                </div>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
                <div className="text-3xl font-mono font-light text-white">03</div>
                <div className="text-[11px] font-mono text-[#8a8a8a] uppercase tracking-wider mt-1">
                  PLANES SAAS
                </div>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
                <div className="text-sm font-mono font-medium text-white leading-tight">PDF + EXCEL</div>
                <div className="text-[11px] font-mono text-[#8a8a8a] uppercase tracking-wider mt-2.5">
                  INFORMES
                </div>
              </div>

            </div>

            {/* Action Buttons: White button (black text) + Ghost button (white border) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="px-6 py-3.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-[13px] font-bold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Descubrir cómo funciona</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <a
                href="#modulos"
                className="px-6 py-3.5 rounded-[3.6px] bg-transparent text-white border border-[#2e2e2e] hover:border-white font-mono text-[13px] tracking-wider uppercase transition-colors"
              >
                Ver 4 Módulos →
              </a>
            </div>

            {/* Target Audience Rails (Page 1) — Monochromatic tags */}
            <div className="pt-4 border-t border-[#2e2e2e] flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-[#8a8a8a] uppercase tracking-wider text-[11px] mr-1">
                SECTORES:
              </span>
              <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                Campañas políticas
              </span>
              <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                Estudios de mercado
              </span>
              <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                Empresas
              </span>
              <span className="px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e] font-mono text-[11px] text-[#d4d4d4]">
                Instituciones
              </span>
            </div>

          </div>

          {/* Right Column (5 cols): "AL LADO UN PIN MOSTRANDO LA INFORMACIÓN" (Monochrome Terminal style) */}
          <div className="lg:col-span-5 relative">
            
            <div className="relative rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] p-5">
              
              {/* Header inside Terminal Pin Card */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e] mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-[1px] animate-pulse" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                    PIN // TELEMETRÍA
                  </span>
                </div>
                {/* Switcher: Agrupado vs Individual */}
                <div className="flex items-center bg-[#0a0a0a] border border-[#2e2e2e] rounded-[3.6px] p-0.5 text-[10px] font-mono">
                  <button
                    onClick={() => setActivePinType('cluster')}
                    className={`px-2 py-1 rounded-[2px] transition-colors ${
                      activePinType === 'cluster'
                        ? 'bg-white text-black font-bold'
                        : 'text-[#8a8a8a] hover:text-white'
                    }`}
                  >
                    AGRUPADO [4]
                  </button>
                  <button
                    onClick={() => setActivePinType('individual')}
                    className={`px-2 py-1 rounded-[2px] transition-colors ${
                      activePinType === 'individual'
                        ? 'bg-white text-black font-bold'
                        : 'text-[#8a8a8a] hover:text-white'
                    }`}
                  >
                    INDIVIDUAL [1]
                  </button>
                </div>
              </div>

              {/* Topographic Field Terminal Radar Simulation (Monochrome) */}
              <div className="relative h-44 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] flex items-center justify-center overflow-hidden">
                
                {/* Topographic Polygon Coordinates lines */}
                <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 300 160">
                  <polygon points="50,20 250,10 280,140 20,130" fill="none" stroke="#ffffff" strokeWidth="1" />
                  <line x1="150" y1="10" x2="150" y2="140" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="3 3" />
                  <line x1="20" y1="75" x2="280" y2="75" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="3 3" />
                </svg>

                {/* Radar sweep ring in pure white */}
                <div className="absolute w-24 h-24 rounded-full border border-white/40 animate-ping" />
                <div className="absolute w-40 h-40 rounded-full border border-[#2e2e2e]" />
                <div className="absolute w-56 h-56 rounded-full border border-[#2e2e2e]/60" />

                {/* Secondary markers in neutral tones */}
                <div className="absolute top-6 left-12 w-2 h-2 bg-white rounded-[1px]" />
                <div className="absolute top-10 right-10 w-2 h-2 bg-[#8a8a8a] rounded-[1px]" />
                <div className="absolute bottom-6 left-16 w-2 h-2 bg-[#525252] rounded-[1px]" />
                <div className="absolute bottom-8 right-14 w-2 h-2 bg-[#8a8a8a] rounded-[1px]" />

                {/* THE PIN (Monochrome White Marker) */}
                <div className="relative z-10 flex flex-col items-center cursor-pointer group">
                  {activePinType === 'cluster' ? (
                    <div className="w-10 h-10 rounded-[3.6px] bg-[#0a0a0a] border-2 border-white flex items-center justify-center font-mono font-bold text-white text-sm group-hover:scale-105 transition-transform">
                      4
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-[3.6px] bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MapPin className="w-5 h-5 fill-black" />
                    </div>
                  )}
                  <div className="w-1 h-3 -mt-0.5 bg-white" />
                </div>

                <div className="absolute bottom-2 left-3 font-mono text-[9px] text-[#8a8a8a]">
                  LOG: DIRECCIÓN EXACTA // SOLO BARRIO
                </div>
              </div>

              {/* Information Display Card (Exact PDF fields: Persona 1..4, ¿cuánta gente tiene bigote?) */}
              <div className="mt-4 p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] space-y-3">
                
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-white font-semibold uppercase">
                    {activePinType === 'cluster' ? 'Pin agrupado · misma dirección' : 'Pin individual'}
                  </span>
                  <span className="text-[#8a8a8a]">
                    Estudio de ejemplo (Kennedy)
                  </span>
                </div>

                {/* Example Question from Page 4 */}
                <div className="p-3 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
                  <span className="font-mono text-[10px] text-[#8a8a8a] uppercase block">
                    PREGUNTA:
                  </span>
                  <span className="text-sm font-sans font-medium text-white">
                    ¿cuánta gente tiene bigote?
                  </span>
                </div>

                {/* Residents List in neutral monochrome */}
                {activePinType === 'cluster' ? (
                  <div className="space-y-2">
                    <div className="font-mono text-[10px] text-[#8a8a8a] uppercase flex items-center justify-between">
                      <span>Habitantes agrupados:</span>
                      <span className="text-white">Desplegar habitante</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {familyResidents.map((res, i) => (
                        <button
                          key={res.label}
                          onClick={() => setSelectedResidentIndex(i)}
                          className={`p-2 rounded-[3.6px] text-left border transition-colors font-mono ${
                            selectedResidentIndex === i
                              ? 'bg-[#141414] border-white text-white'
                              : 'bg-[#141414] border-[#2e2e2e] text-[#8a8a8a] hover:border-[#8a8a8a]'
                          }`}
                        >
                          <div className="font-bold text-xs">{res.label}</div>
                          <div className="text-[10px] text-[#8a8a8a]">{res.age}</div>
                        </button>
                      ))}
                    </div>

                    {/* Selected resident detail from Page 3 */}
                    <div className="p-3 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white">{familyResidents[selectedResidentIndex].label}</span>
                        <span className="text-white">{familyResidents[selectedResidentIndex].age}</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#8a8a8a]">
                        {familyResidents[selectedResidentIndex].details}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#2e2e2e] font-mono">
                        <span className="text-[#8a8a8a]">Respuesta:</span>
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-[1px]" 
                            style={{ backgroundColor: familyResidents[selectedResidentIndex].color }} 
                          />
                          <span className="font-bold text-white">
                            {familyResidents[selectedResidentIndex].answer}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Respondent View */
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] space-y-1.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8a8a8a]">Persona 1:</span>
                        <span className="font-bold text-white">52 años</span>
                      </div>
                      <div className="text-[11px] text-[#8a8a8a]">
                        nombre, cédula, teléfono...
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#2e2e2e]">
                        <span className="text-[#8a8a8a]">Opción:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-[1px] bg-white" />
                          <span className="font-bold text-white">1) Tiene bigote</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="font-mono text-[10px] text-[#8a8a8a] text-center pt-1">
                  // Si varias personas viven en la misma dirección, el mapa las reúne en un solo pin.
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>

    </section>
  );
};
