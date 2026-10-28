import React from 'react';
import { 
  Database, 
  Monitor, 
  Smartphone, 
  Shield, 
  Layers, 
  Cpu, 
  FileSpreadsheet
} from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="arquitectura" className="py-24 border-b border-[#2e2e2e] relative bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            INSUMO PARA LA COTIZACIÓN FINAL · PÁGINA 7
          </div>
          <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.03em] leading-[0.95]">
            Arquitectura Técnica a Evaluar
          </h2>
          <p className="text-base text-[#8a8a8a] mt-4 leading-[1.6]">
            Para estructurar la cotización, el equipo debe evaluar la arquitectura requerida. A nivel de base de datos, implementar <strong className="text-white font-medium">PostGIS sobre PostgreSQL</strong> facilita las consultas de radio y el filtrado por polígonos de barrios y localidades.
          </p>
        </div>

        {/* Stack Layers in Monochrome */}
        <div className="space-y-4 mb-14 font-mono text-xs">
          
          {/* Layer 1: Clientes */}
          <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-4">
              [CAPA 1] CLIENTES
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] flex items-center gap-4">
                <Monitor className="w-6 h-6 text-white" />
                <div>
                  <h4 className="text-sm font-sans font-bold text-white">App Web (Dashboard & Mapa)</h4>
                  <p className="text-xs text-[#8a8a8a] mt-0.5">Supervisión en tiempo real, cruce demográfico, exportación.</p>
                </div>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] flex items-center gap-4">
                <Smartphone className="w-6 h-6 text-white" />
                <div>
                  <h4 className="text-sm font-sans font-bold text-white">App Móvil (Encuestadores)</h4>
                  <p className="text-xs text-[#8a8a8a] mt-0.5">Captura en campo, geocodificación GPS y formulario dinámico.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 2: Servicios */}
          <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-4">
              [CAPA 2] SERVICIOS DE LA PLATAFORMA
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] text-center space-y-1">
                <Shield className="w-5 h-5 text-white mx-auto mb-2" />
                <h5 className="font-bold text-white">Autenticación</h5>
                <p className="text-[10px] text-[#8a8a8a]">Estándar y Google OAuth</p>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] text-center space-y-1">
                <Cpu className="w-5 h-5 text-white mx-auto mb-2" />
                <h5 className="font-bold text-white">Gestión Planes</h5>
                <p className="text-[10px] text-[#8a8a8a]">Permisos por encuestador</p>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] text-center space-y-1">
                <Layers className="w-5 h-5 text-white mx-auto mb-2" />
                <h5 className="font-bold text-white">Motor Encuestas</h5>
                <p className="text-[10px] text-[#8a8a8a]">Opciones dinámicas</p>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e] text-center space-y-1">
                <FileSpreadsheet className="w-5 h-5 text-white mx-auto mb-2" />
                <h5 className="font-bold text-white">Estadísticas</h5>
                <p className="text-[10px] text-[#8a8a8a]">Exportación PDF / Excel</p>
              </div>
            </div>
          </div>

          {/* Layer 3: PostGIS */}
          <div className="p-6 rounded-[3.6px] bg-[#141414] border-2 border-white">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-3">
              [CAPA 3] DATOS GEOESPACIALES // MOTOR CENTRAL
            </span>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Database className="w-8 h-8 text-white shrink-0" />
                <div>
                  <h4 className="text-xl font-sans font-bold text-white">PostgreSQL + PostGIS</h4>
                  <p className="text-xs text-[#8a8a8a] mt-0.5">
                    Consultas espaciales optimizadas, indexación R-Tree e intersecciones de polígonos.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a] text-white">Pines con coordenadas</span>
                <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a] text-white">Polígonos de barrios</span>
                <span className="px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] bg-[#0a0a0a] text-white">Consultas ST_DWithin</span>
              </div>
            </div>
          </div>

        </div>

        {/* Checklist */}
        <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] font-mono text-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-white rounded-[1px]" />
            <h4 className="font-bold uppercase tracking-wider text-white">
              QUÉ EVALUAR · MATRIZ TÉCNICA
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[#8a8a8a]">
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Soporte mapas y geocodificación</div>
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Clustering con alto volumen</div>
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Consultas espaciales PostGIS</div>
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Roles administrador y encuestador</div>
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Límites por plan (100 en Básico)</div>
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Verificación de empresa en Premium</div>
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Escala para Modo Campaña nacional</div>
            <div className="p-3 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">• Generación PDF y Excel</div>
          </div>
        </div>

      </div>
    </section>
  );
};
