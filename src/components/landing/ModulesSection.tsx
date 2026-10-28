import React, { useState } from 'react';
import { 
  MapPin, 
  SlidersHorizontal, 
  BarChart3, 
  CreditCard, 
  FileDown, 
  FileSpreadsheet
} from 'lucide-react';

export const ModulesSection: React.FC = () => {
  const [activeModuleTab, setActiveModuleTab] = useState<number>(1);

  return (
    <section id="modulos" className="py-24 border-b border-[#2e2e2e] relative bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold tracking-wider uppercase mb-3">
            CAPACIDADES DEL SISTEMA
          </div>
          <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.03em] leading-[0.95]">
            Los 4 Módulos de la Plataforma
          </h2>
          <p className="text-base text-[#8a8a8a] mt-3 leading-[1.6]">
            Estructura modular neutral diseñada para adaptarse tanto a encuestas de opinión como a investigaciones de mercado en calle.
          </p>

          {/* Module Selector in JetBrains Mono with 3.6px radius */}
          <div className="flex flex-wrap items-center gap-2 mt-8 font-mono text-xs">
            <button
              onClick={() => setActiveModuleTab(1)}
              className={`px-4 py-2 rounded-[3.6px] uppercase tracking-wider transition-colors ${
                activeModuleTab === 1
                  ? 'bg-white text-black font-bold'
                  : 'bg-transparent text-[#8a8a8a] hover:text-white border border-[#2e2e2e]'
              }`}
            >
              [M1] GEOLOCALIZACIÓN
            </button>
            <button
              onClick={() => setActiveModuleTab(2)}
              className={`px-4 py-2 rounded-[3.6px] uppercase tracking-wider transition-colors ${
                activeModuleTab === 2
                  ? 'bg-white text-black font-bold'
                  : 'bg-transparent text-[#8a8a8a] hover:text-white border border-[#2e2e2e]'
              }`}
            >
              [M2] ENCUESTAS DINÁMICAS
            </button>
            <button
              onClick={() => setActiveModuleTab(3)}
              className={`px-4 py-2 rounded-[3.6px] uppercase tracking-wider transition-colors ${
                activeModuleTab === 3
                  ? 'bg-white text-black font-bold'
                  : 'bg-transparent text-[#8a8a8a] hover:text-white border border-[#2e2e2e]'
              }`}
            >
              [M3] ANÁLISIS & DASHBOARD
            </button>
            <button
              onClick={() => setActiveModuleTab(4)}
              className={`px-4 py-2 rounded-[3.6px] uppercase tracking-wider transition-colors ${
                activeModuleTab === 4
                  ? 'bg-white text-black font-bold'
                  : 'bg-transparent text-[#8a8a8a] hover:text-white border border-[#2e2e2e]'
              }`}
            >
              [M4] PLANES SAAS
            </button>
          </div>
        </div>

        {/* Detailed Module Showcase in Monochrome */}
        
        {/* Module 1: Registro y geolocalización (Page 3) */}
        {activeModuleTab === 1 && (
          <div className="bg-[#141414] rounded-[3.6px] border border-[#2e2e2e] p-6 sm:p-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-block px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[10px] font-bold uppercase tracking-wider">
                  EL NÚCLEO DEL MAPA · MÓDULO 1
                </div>
                <h3 className="text-3xl sm:text-4xl font-normal text-white tracking-[-0.03em] leading-tight">
                  Registro y geolocalización con clustering familiar
                </h3>
                <p className="text-sm text-[#8a8a8a] leading-[1.6]">
                  Permite mapear con precisión cada opinión en el territorio, resolviendo la acumulación de puntos en zonas densas mediante agrupación por misma dirección.
                </p>

                {/* Data Captured Pills */}
                <div className="space-y-2 pt-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-[#8a8a8a] tracking-wider block">
                    DATOS QUE SE CAPTURAN:
                  </span>
                  <div className="flex flex-wrap gap-2 font-mono text-xs text-white">
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Nombre completo</span>
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Edad</span>
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Cédula</span>
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Teléfono</span>
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Dirección o barrio</span>
                  </div>
                </div>

                {/* Location Logic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                    <div className="font-mono text-xs font-bold text-white mb-1">
                      [+] Dirección exacta
                    </div>
                    <p className="text-xs text-[#8a8a8a]">El pin se ubica en ese punto específico de la cuadrícula urbana.</p>
                  </div>

                  <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                    <div className="font-mono text-xs font-bold text-[#8a8a8a] mb-1">
                      [+] Solo el barrio
                    </div>
                    <p className="text-xs text-[#8a8a8a]">Pin general de zona para encuestas sin número de casa fijo.</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="pt-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-[#8a8a8a] tracking-wider block mb-2">
                    FILTROS DE VISUALIZACIÓN:
                  </span>
                  <div className="flex flex-wrap gap-2 font-mono text-xs text-white">
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Barrios</span>
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Calles</span>
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Conjuntos residenciales</span>
                    <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a]">Localidades</span>
                  </div>
                </div>
              </div>

              {/* Right: Graphic representation of Family Cluster (Page 3) */}
              <div className="lg:col-span-6 bg-[#0a0a0a] p-6 rounded-[3.6px] border border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2e2e2e]">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    AGRUPACIÓN FAMILIAR (CLUSTERING)
                  </span>
                  <span className="font-mono text-[10px] text-[#8a8a8a] px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e]">
                    MISMA DIRECCIÓN
                  </span>
                </div>
                <p className="text-xs text-[#8a8a8a] mb-4">
                  Si varias personas viven en la misma dirección, el mapa las reúne en un solo pin interactivo para no saturar la interfaz.
                </p>

                {/* Cluster list from Page 3 */}
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Persona 1</div>
                      <div className="text-[11px] text-[#8a8a8a]">nombre, cédula, teléfono...</div>
                    </div>
                    <span className="text-xs font-bold text-white">52 años</span>
                  </div>

                  <div className="p-3 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Persona 2</div>
                      <div className="text-[11px] text-[#8a8a8a]">nombre, cédula, teléfono...</div>
                    </div>
                    <span className="text-xs font-bold text-white">49 años</span>
                  </div>

                  <div className="p-3 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Persona 3</div>
                      <div className="text-[11px] text-[#8a8a8a]">nombre, cédula, teléfono...</div>
                    </div>
                    <span className="text-xs font-bold text-white">24 años</span>
                  </div>

                  <div className="p-3 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Persona 4</div>
                      <div className="text-[11px] text-[#8a8a8a]">nombre, cédula, teléfono...</div>
                    </div>
                    <span className="text-xs font-bold text-white">17 años</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="font-mono text-[11px] text-white">
                    // Un clic despliega a cada habitante individualmente
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Module 2: Personalización dinámica de encuestas (Page 4) */}
        {activeModuleTab === 2 && (
          <div className="bg-[#141414] rounded-[3.6px] border border-[#2e2e2e] p-6 sm:p-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-block px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[10px] font-bold uppercase tracking-wider">
                  CADA CLIENTE DEFINE SUS OPCIONES · MÓDULO 2
                </div>
                <h3 className="text-3xl sm:text-4xl font-normal text-white tracking-[-0.03em] leading-tight">
                  Personalización dinámica de encuestas
                </h3>
                <p className="text-sm text-[#8a8a8a] leading-[1.6]">
                  El sistema no se limita a respuestas estáticas como «Voy a votar» o «No voy a votar». El cliente crea sus propias opciones según su necesidad, y el pin de cada persona guarda su respuesta a esa encuesta específica.
                </p>

                {/* Example from Page 4 */}
                <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] space-y-1">
                  <span className="font-mono text-[10px] text-white uppercase tracking-wider block">
                    CONFIGURADOR DE ENCUESTA:
                  </span>
                  <div className="text-xs text-[#8a8a8a]">
                    Ejemplo: estudio en la localidad de Kennedy (Bogotá)
                  </div>
                  <div className="text-sm font-sans font-medium text-white pt-1">
                    Pregunta: ¿cuánta gente tiene bigote?
                  </div>
                </div>

                {/* Option Buttons in Neutral Grayscale */}
                <div className="space-y-2 pt-2 font-mono text-xs">
                  <div className="p-3 rounded-[3.6px] bg-white text-black font-bold flex items-center justify-between">
                    <span>1) Tiene bigote</span>
                    <span className="text-[11px] opacity-75">[PINES BLANCOS]</span>
                  </div>
                  <div className="p-3 rounded-[3.6px] bg-[#2e2e2e] text-white font-bold flex items-center justify-between">
                    <span>2) Tiene medio bigote</span>
                    <span className="text-[11px] opacity-75">[PINES GRIS CLARO]</span>
                  </div>
                  <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] text-white border border-[#2e2e2e] font-bold flex items-center justify-between">
                    <span>3) No tiene bigote</span>
                    <span className="text-[11px] text-[#8a8a8a]">[PINES GRIS OSCURO]</span>
                  </div>
                </div>
              </div>

              {/* Right: Map Simulation in Monochrome */}
              <div className="lg:col-span-6 bg-[#0a0a0a] p-6 rounded-[3.6px] border border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    EL PIN GUARDA LA RESPUESTA
                  </span>
                  <span className="font-mono text-[10px] text-white">
                    [MONOCHROME]
                  </span>
                </div>

                {/* Simulated Polygons with grayscale pin indicators */}
                <div className="h-64 rounded-[3.6px] border border-[#2e2e2e] bg-[#141414] relative p-4 flex items-center justify-center font-mono">
                  <div className="absolute top-3 left-4 text-[10px] text-[#8a8a8a] uppercase">Barrio Norte</div>
                  <div className="absolute top-3 right-4 text-[10px] text-[#8a8a8a] uppercase">Localidad C</div>
                  <div className="absolute bottom-3 left-4 text-[10px] text-[#8a8a8a] uppercase">Barrio Oeste</div>
                  <div className="absolute bottom-3 right-4 text-[10px] text-[#8a8a8a] uppercase">Zona Centro</div>

                  {/* Monochrome Pin markers */}
                  <div className="absolute top-12 left-16 w-5 h-5 rounded-[2px] bg-white text-black font-bold flex items-center justify-center text-[10px]">1</div>
                  <div className="absolute top-10 right-28 w-5 h-5 rounded-[2px] bg-white text-black font-bold flex items-center justify-center text-[10px]">1</div>
                  <div className="absolute bottom-16 left-28 w-5 h-5 rounded-[2px] bg-[#8a8a8a] text-black font-bold flex items-center justify-center text-[10px]">2</div>
                  <div className="absolute bottom-12 right-20 w-5 h-5 rounded-[2px] bg-[#2e2e2e] text-white border border-[#525252] font-bold flex items-center justify-center text-[10px]">3</div>
                  <div className="absolute top-28 right-16 w-5 h-5 rounded-[2px] bg-[#8a8a8a] text-black font-bold flex items-center justify-center text-[10px]">2</div>
                </div>

                <p className="font-mono text-[11px] text-[#8a8a8a] text-center mt-4">
                  // Ilustración conceptual: tonalidades neutrales para evitar conflictos partidistas.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Module 3: Análisis y estadísticas (Page 5) */}
        {activeModuleTab === 3 && (
          <div className="bg-[#141414] rounded-[3.6px] border border-[#2e2e2e] p-6 sm:p-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-block px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[10px] font-bold uppercase tracking-wider">
                  DASHBOARD AUTOMATIZADO · MÓDULO 3
                </div>
                <h3 className="text-3xl sm:text-4xl font-normal text-white tracking-[-0.03em] leading-tight">
                  Análisis y estadísticas en tiempo real
                </h3>
                <p className="text-sm text-[#8a8a8a] leading-[1.6]">
                  Cada pin recolectado alimenta instantáneamente el cuadro de mando gerencial con métricas automáticas, tendencias sectoriales y doble formato de exportación.
                </p>

                {/* Metrics Highlights from Page 5 */}
                <div className="grid grid-cols-3 gap-3 pt-2 font-mono">
                  <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                    <div className="text-3xl font-light text-white">1.200</div>
                    <div className="text-[10px] text-[#8a8a8a] uppercase mt-1">Encuestados</div>
                  </div>
                  <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                    <div className="text-3xl font-light text-white">3</div>
                    <div className="text-[10px] text-[#8a8a8a] uppercase mt-1">Opciones</div>
                  </div>
                  <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                    <div className="text-3xl font-light text-white">5</div>
                    <div className="text-[10px] text-[#8a8a8a] uppercase mt-1">Zonas</div>
                  </div>
                </div>

                {/* Cruce demográfico */}
                <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] text-xs text-[#8a8a8a] space-y-1">
                  <div className="font-mono font-bold text-white">
                    [+] Cruce demográfico:
                  </div>
                  <p className="text-white">Población total de la zona seleccionada: consultada por la app</p>
                </div>

                {/* Export Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                  <div className="p-3.5 rounded-[3.6px] bg-white text-black font-bold text-xs flex items-center justify-center gap-2 uppercase tracking-wider">
                    <FileDown className="w-4 h-4" />
                    <span>Descargar PDF</span>
                  </div>
                  <div className="p-3.5 rounded-[3.6px] bg-[#0a0a0a] text-white border border-[#2e2e2e] font-bold text-xs flex items-center justify-center gap-2 uppercase tracking-wider">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    <span>Descargar Excel</span>
                  </div>
                </div>
              </div>

              {/* Right: Percentages & Breakdown */}
              <div className="lg:col-span-6 bg-[#0a0a0a] p-6 rounded-[3.6px] border border-[#2e2e2e] space-y-4 font-mono">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  RESULTADOS DE LA ENCUESTA (DONUT 100%)
                </div>

                <div className="p-4 rounded-[3.6px] border border-[#2e2e2e] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white">1) Tiene bigote</span>
                    <span className="text-white font-bold text-sm">45%</span>
                  </div>
                  <div className="w-full bg-[#141414] h-2 border border-[#2e2e2e] rounded-[2px] overflow-hidden">
                    <div className="bg-white h-full" style={{ width: '45%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-white">2) Tiene medio bigote</span>
                    <span className="text-[#a3a3a3] font-bold text-sm">35%</span>
                  </div>
                  <div className="w-full bg-[#141414] h-2 border border-[#2e2e2e] rounded-[2px] overflow-hidden">
                    <div className="bg-[#a3a3a3] h-full" style={{ width: '35%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-white">3) No tiene bigote</span>
                    <span className="text-[#525252] font-bold text-sm">20%</span>
                  </div>
                  <div className="w-full bg-[#141414] h-2 border border-[#2e2e2e] rounded-[2px] overflow-hidden">
                    <div className="bg-[#525252] h-full" style={{ width: '20%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold uppercase text-white">Resumen de Campaña</div>
                  <div className="flex justify-between"><span className="text-[#8a8a8a]">Zona con más respuestas:</span> <strong className="text-white">Norte</strong></div>
                  <div className="flex justify-between"><span className="text-[#8a8a8a]">Opción líder:</span> <strong className="text-white">Tiene bigote</strong></div>
                  <div className="flex justify-between"><span className="text-[#8a8a8a]">Encuestadores activos:</span> <strong className="text-white">8</strong></div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Module 4: Modelo de negocio y suscripciones (Page 6) */}
        {activeModuleTab === 4 && (
          <div className="bg-[#141414] rounded-[3.6px] border border-[#2e2e2e] p-6 sm:p-10 animate-fade-in">
            <div className="max-w-2xl mb-8">
              <div className="inline-block px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[10px] font-bold uppercase tracking-wider mb-2">
                SAAS CON COBRO MENSUAL · MÓDULO 4
              </div>
              <h3 className="text-3xl sm:text-4xl font-normal text-white tracking-[-0.03em]">
                Modelo de negocio y suscripciones
              </h3>
              <p className="text-xs font-mono text-[#8a8a8a] mt-2">
                // Requiere inicio de sesión (estándar o Google) y genera un código de acceso único por cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Plan Básico */}
              <div className="p-5 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                <div className="text-xs font-bold uppercase text-[#8a8a8a]">Plan Básico (Gratuito)</div>
                <div className="text-sm font-semibold text-white mt-1">Hasta 100 usuarios / pines</div>
                <ul className="text-xs text-[#8a8a8a] space-y-2 mt-4">
                  <li>• Filtros: barrio/localidad, grupo o evento</li>
                  <li>• Estadísticas generales y censuradas</li>
                  <li>• Monetización con anuncios en la app</li>
                  <li>• Pago por evento para exportar</li>
                </ul>
              </div>

              {/* Plan Premium */}
              <div className="p-5 rounded-[3.6px] bg-[#0a0a0a] border-2 border-white">
                <div className="text-xs font-bold uppercase text-white">Plan Premium (Empresarial)</div>
                <div className="text-sm font-semibold text-white mt-1">Verificación SheerID / RUT</div>
                <ul className="text-xs text-[#8a8a8a] space-y-2 mt-4">
                  <li>• Verificación de empresa (automática/manual)</li>
                  <li>• Registro de trabajadores validados</li>
                  <li>• Acceso ilimitado a estadísticas</li>
                  <li>• Campos personalizados en encuestas</li>
                </ul>
              </div>

              {/* Modo Campaña */}
              <div className="p-5 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                <div className="text-xs font-bold uppercase text-white">Modo Campaña (Nacional)</div>
                <div className="text-sm font-semibold text-white mt-1">Despliegues masivos</div>
                <ul className="text-xs text-[#8a8a8a] space-y-2 mt-4">
                  <li>• Uso ilimitado en cualquier barrio o toda Colombia</li>
                  <li>• Modificación total de encuestas y métricas</li>
                  <li>• PostGIS de alta concurrencia</li>
                  <li>• Sin restricciones de volumen</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
