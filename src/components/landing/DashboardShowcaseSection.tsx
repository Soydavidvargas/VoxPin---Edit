import React, { useState } from 'react';
import { 
  BarChart3, 
  MapPin, 
  FileDown, 
  FileSpreadsheet, 
  CheckCircle2, 
  Award
} from 'lucide-react';

export const DashboardShowcaseSection: React.FC = () => {
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const triggerDownloadSim = (type: 'PDF' | 'Excel') => {
    setDownloadMsg(`Generando archivo ${type}...`);
    setTimeout(() => {
      const element = document.createElement('a');
      const file = new Blob([
        `VOXPIN - REPORTE EJECUTIVO GEOLOCALIZADO\nGenerado: ${new Date().toLocaleString()}\nMuestra: 1.200 encuestados\nZona Líder: Norte\nOpción Líder: Tiene bigote (45%)\n`
      ], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `Voxpin_Reporte_${type}_${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setDownloadMsg(`¡Informe ${type} descargado!`);
      setTimeout(() => setDownloadMsg(null), 3000);
    }, 600);
  };

  return (
    <section id="estadisticas" className="py-24 border-b border-[#2e2e2e] relative bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold tracking-wider uppercase mb-3">
              MÓDULO 3 · MAQUETA ILUSTRATIVA
            </div>
            <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.03em] leading-[0.95]">
              Análisis y Estadísticas
            </h2>
            <p className="text-sm font-mono text-[#8a8a8a] mt-3">
              // Maqueta ilustrativa del panel · las cifras son de ejemplo, no datos reales
            </p>
          </div>

          {/* Download Notification */}
          {downloadMsg && (
            <div className="p-2.5 rounded-[3.6px] bg-[#141414] border border-white text-white font-mono text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{downloadMsg}</span>
            </div>
          )}
        </div>

        {/* Dashboard Grid (Page 5 of PDF in Neutral Black & White) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Side: KPIs and Cruce Demográfico (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
                <div className="text-3xl sm:text-4xl font-light text-white">1.200</div>
                <div className="text-[11px] text-[#8a8a8a] uppercase tracking-wider mt-1">Encuestados</div>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
                <div className="text-3xl sm:text-4xl font-light text-white">3</div>
                <div className="text-[11px] text-[#8a8a8a] uppercase tracking-wider mt-1">Opciones</div>
              </div>

              <div className="p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
                <div className="text-3xl sm:text-4xl font-light text-white">5</div>
                <div className="text-[11px] text-[#8a8a8a] uppercase tracking-wider mt-1">Zonas</div>
              </div>
            </div>

            {/* Cruce Demográfico */}
            <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                <span className="w-2 h-2 bg-white rounded-[1px]" />
                <span>Cruce Demográfico</span>
              </div>

              <div className="flex items-start gap-3 bg-[#0a0a0a] p-4 rounded-[3.6px] border border-[#2e2e2e]">
                <MapPin className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <p className="text-xs text-[#8a8a8a]">
                  <strong className="text-white">Población total de la zona seleccionada:</strong> consultada por la app
                </p>
              </div>

              {/* Progress Comparison */}
              <div>
                <div className="flex justify-between font-mono text-xs text-white mb-1.5">
                  <span>ENCUESTADOS VS. POBLACIÓN TOTAL</span>
                  <span className="text-white">Muestra</span>
                </div>
                <div className="w-full h-2 rounded-[2px] bg-[#0a0a0a] border border-[#2e2e2e] overflow-hidden">
                  <div className="h-full bg-white" style={{ width: '45%' }} />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-[#8a8a8a] mt-1">
                  <span>Muestra</span>
                  <span>Población total de la zona</span>
                </div>
              </div>
            </div>

            {/* Donut Chart Result Box in Grayscale */}
            <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] flex flex-col sm:flex-row items-center justify-around gap-6 font-mono">
              
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#2e2e2e" strokeWidth="12" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="12" strokeDasharray="107 238" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8a8a8a" strokeWidth="12" strokeDasharray="83 238" strokeDashoffset="-107" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3e3e3e" strokeWidth="12" strokeDasharray="48 238" strokeDashoffset="-190" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-light text-white">100%</span>
                  <span className="text-[9px] text-[#8a8a8a] uppercase">Total</span>
                </div>
              </div>

              <div className="space-y-2 text-xs w-full sm:max-w-xs">
                <div className="flex items-center justify-between p-2.5 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-white rounded-[1px]" />
                    <span className="text-white">Tiene bigote</span>
                  </div>
                  <strong className="text-white text-sm">45%</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#8a8a8a] rounded-[1px]" />
                    <span className="text-white">Medio bigote</span>
                  </div>
                  <strong className="text-[#8a8a8a] text-sm">35%</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-[3.6px] bg-[#0a0a0a] border border-[#2e2e2e]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#3e3e3e] rounded-[1px]" />
                    <span className="text-[#8a8a8a]">No tiene bigote</span>
                  </div>
                  <strong className="text-[#8a8a8a] text-sm">20%</strong>
                </div>
              </div>

            </div>

          </div>

          {/* Right Side: Tendencia por Zona, Resumen y Exportación (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 font-mono">
            
            {/* Tendencia por Zona */}
            <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  TENDENCIA POR ZONA
                </span>
                <span className="text-[10px] text-[#8a8a8a] uppercase">SECTORIAL</span>
              </div>

              {/* Bar visualization in grayscale */}
              <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-[#2e2e2e] pb-2 text-xs">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div className="w-2.5 bg-white" style={{ height: '70%' }} />
                    <div className="w-2.5 bg-[#8a8a8a]" style={{ height: '55%' }} />
                    <div className="w-2.5 bg-[#3e3e3e]" style={{ height: '35%' }} />
                  </div>
                  <span className="text-[11px] text-white mt-1">Norte</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div className="w-2.5 bg-white" style={{ height: '90%' }} />
                    <div className="w-2.5 bg-[#8a8a8a]" style={{ height: '60%' }} />
                    <div className="w-2.5 bg-[#3e3e3e]" style={{ height: '30%' }} />
                  </div>
                  <span className="text-[11px] text-white mt-1">Sur</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div className="w-2.5 bg-white" style={{ height: '50%' }} />
                    <div className="w-2.5 bg-[#8a8a8a]" style={{ height: '65%' }} />
                    <div className="w-2.5 bg-[#3e3e3e]" style={{ height: '40%' }} />
                  </div>
                  <span className="text-[11px] text-white mt-1">Centro</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div className="w-2.5 bg-white" style={{ height: '75%' }} />
                    <div className="w-2.5 bg-[#8a8a8a]" style={{ height: '50%' }} />
                    <div className="w-2.5 bg-[#3e3e3e]" style={{ height: '35%' }} />
                  </div>
                  <span className="text-[11px] text-white mt-1">Oeste</span>
                </div>
              </div>
            </div>

            {/* Resumen de Campaña */}
            <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] space-y-2 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-2 flex items-center justify-between">
                <span>Resumen de Campaña</span>
                <Award className="w-4 h-4 text-white" />
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#2e2e2e]"><span className="text-[#8a8a8a]">Zona con más respuestas:</span> <strong className="text-white">Norte</strong></div>
              <div className="flex justify-between py-1.5 border-b border-[#2e2e2e]"><span className="text-[#8a8a8a]">Opción líder:</span> <strong className="text-white">Tiene bigote</strong></div>
              <div className="flex justify-between py-1.5 border-b border-[#2e2e2e]"><span className="text-[#8a8a8a]">Pines registrados:</span> <strong className="text-white">1.200</strong></div>
              <div className="flex justify-between py-1.5"><span className="text-[#8a8a8a]">Encuestadores activos:</span> <strong className="text-white">8</strong></div>
            </div>

            {/* Exportación (Page 5) in Monochrome */}
            <div className="p-6 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                EXPORTACIÓN
              </div>
              <p className="text-xs text-[#8a8a8a]">
                Descarga de archivos para informe final y análisis de campo:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => triggerDownloadSim('PDF')}
                  className="p-3.5 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                    <FileDown className="w-4 h-4 stroke-[2.5]" />
                    <span>Descargar PDF</span>
                  </div>
                  <span className="text-[10px] opacity-75 mt-0.5">informe con gráficos</span>
                </button>

                <button
                  onClick={() => triggerDownloadSim('Excel')}
                  className="p-3.5 rounded-[3.6px] bg-[#0a0a0a] hover:bg-[#1f1f1f] text-white border border-[#2e2e2e] flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    <span>Descargar Excel</span>
                  </div>
                  <span className="text-[10px] text-[#8a8a8a] mt-0.5">base de datos cruda</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
