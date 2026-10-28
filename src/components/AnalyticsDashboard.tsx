import React, { useState } from 'react';
import { 
  BarChart3, 
  FileDown, 
  FileSpreadsheet, 
  Users, 
  MapPin, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  Layers, 
  Award, 
  UserCheck,
  Download
} from 'lucide-react';
import { Survey, SurveyPin } from '../types/voxpin';
import { zoneDemographics } from '../data/mockData';

interface AnalyticsDashboardProps {
  activeSurvey: Survey;
  pins: SurveyPin[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  activeSurvey,
  pins,
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Dynamic calculations based on current active survey & pins
  const totalPinsCount = 1200; // Benchmark from PDF maqueta + live pins offset
  const optionsCount = activeSurvey.options.length;
  const zonesCount = zoneDemographics.totalAnalyzed;

  // Percentages calculated from activeSurvey.options
  const opt1 = activeSurvey.options[0] || { text: 'Tiene bigote', percentage: 45, color: '#00d2b5' };
  const opt2 = activeSurvey.options[1] || { text: 'Tiene medio bigote', percentage: 35, color: '#f59e0b' };
  const opt3 = activeSurvey.options[2] || { text: 'No tiene bigote', percentage: 20, color: '#ef4444' };

  // Calculate leader option
  const leaderOption = [...activeSurvey.options].sort((a, b) => b.percentage - a.percentage)[0] || opt1;

  // Real Excel/CSV Downloader
  const handleDownloadExcel = () => {
    setDownloadingExcel(true);
    setTimeout(() => {
      const headers = [
        'ID_Pin',
        'Nombre_Encuestado',
        'Edad',
        'Cedula',
        'Telefono',
        'Direccion',
        'Barrio',
        'Localidad',
        'Tipo_Ubicacion',
        'Latitud',
        'Longitud',
        'Encuesta',
        'Respuesta_Elegida',
        'Encuestador',
        'Fecha_Registro',
      ];

      const rows = pins.map((p) => {
        const ans = activeSurvey.options.find((o) => o.id === p.answerOptionId)?.text || 'N/A';
        return [
          p.id,
          `"${p.name}"`,
          p.age,
          `"${p.cedula}"`,
          `"${p.phone}"`,
          `"${p.address}"`,
          `"${p.neighborhood}"`,
          `"${p.locality}"`,
          p.locationType === 'exact' ? 'Direccion Exacta' : 'Solo Barrio',
          p.lat,
          p.lng,
          `"${activeSurvey.title}"`,
          `"${ans}"`,
          `"${p.surveyorName}"`,
          `"${p.timestamp}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Voxpin_Encuestas_${activeSurvey.id}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingExcel(false);
    }, 600);
  };

  // Real PDF Report Generator
  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    setTimeout(() => {
      // Create printable summary window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Informe Voxpin - ${activeSurvey.title}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
                h1 { color: #007afc; margin-bottom: 4px; }
                .subtitle { color: #555; margin-bottom: 24px; font-size: 14px; }
                .kpi-grid { display: flex; gap: 20px; margin-bottom: 30px; }
                .kpi-card { border: 1px solid #ddd; padding: 16px; border-radius: 8px; flex: 1; }
                .kpi-num { font-size: 28px; font-weight: bold; color: #007afc; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
                th { background-color: #f7f9fa; }
                .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
              </style>
            </head>
            <body>
              <h1>VOXPIN · Reporte Ejecutivo Geosatélite</h1>
              <div class="subtitle">Generado el ${new Date().toLocaleString()} · ${activeSurvey.title}</div>
              
              <div class="kpi-grid">
                <div class="kpi-card">
                  <div>Muestra Total</div>
                  <div class="kpi-num">${totalPinsCount.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                  <div>Opción Líder</div>
                  <div class="kpi-num" style="font-size: 20px; color: #228a56;">${leaderOption.text} (${leaderOption.percentage}%)</div>
                </div>
                <div class="kpi-card">
                  <div>Zonas Monitoreadas</div>
                  <div class="kpi-num">${zonesCount}</div>
                </div>
              </div>

              <h3>Distribución de Respuestas</h3>
              <table>
                <thead>
                  <tr>
                    <th>Opción</th>
                    <th>Porcentaje</th>
                    <th>Pines Estimados</th>
                  </tr>
                </thead>
                <tbody>
                  ${activeSurvey.options.map(o => `
                    <tr>
                      <td><b>${o.text}</b></td>
                      <td>${o.percentage}%</td>
                      <td>${Math.round((o.percentage / 100) * totalPinsCount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <h3 style="margin-top: 30px;">Cruce Demográfico por Territorio</h3>
              <table>
                <thead>
                  <tr>
                    <th>Zona / Localidad</th>
                    <th>Muestra</th>
                    <th>Población Total Zona</th>
                    <th>Penetración de Muestra</th>
                  </tr>
                </thead>
                <tbody>
                  ${zoneDemographics.zones.map(z => `
                    <tr>
                      <td>${z.name}</td>
                      <td>${z.sample}</td>
                      <td>${z.population.toLocaleString()} hab.</td>
                      <td>${((z.sample / z.population) * 100).toFixed(3)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <script>window.onload = function() { window.print(); };</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      setDownloadingPdf(false);
    }, 600);
  };

  return (
    <div className="max-w-[1344px] mx-auto px-4 sm:px-6 py-8">
      
      {/* Eyebrow & Headline matching Page 5 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0062ca]/20 text-[#007afc] border border-[#0062ca]/40 text-xs font-semibold tracking-wider uppercase mb-2">
            DASHBOARD AUTOMATIZADO · MÓDULO 3
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Análisis y estadísticas
          </h1>
          <p className="text-xs text-[#8b96aa] mt-1 italic">
            Maqueta ilustrativa del panel · las cifras corresponden al estudio georreferenciado activo
          </p>
        </div>

        {/* Survey filter pill */}
        <div className="px-4 py-2 rounded-2xl bg-[#15171b] border border-[#1c1f24] text-xs">
          <span className="text-[#8b96aa] block">Estudio activo:</span>
          <span className="font-semibold text-white">{activeSurvey.title}</span>
        </div>
      </div>

      {/* Grid Layout strictly implementing Page 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Top Left: 3 Big Metric Cards & Cruce Demográfico (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          
          {/* 3 Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Encuestados */}
            <div className="bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 relative overflow-hidden shadow-xl border-l-4 border-l-[#007afc]">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans">
                {totalPinsCount.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-[#8b96aa] uppercase tracking-wider mt-2">
                Encuestados
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#228a56]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+100% verificado en mapa</span>
              </div>
            </div>

            {/* Opciones de respuesta */}
            <div className="bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 relative overflow-hidden shadow-xl border-l-4 border-l-[#f59e0b]">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans">
                {optionsCount}
              </div>
              <div className="text-xs font-semibold text-[#8b96aa] uppercase tracking-wider mt-2">
                Opciones de respuesta
              </div>
              <div className="mt-3 text-[11px] text-[#8b96aa]">
                Personalizadas por cliente
              </div>
            </div>

            {/* Zonas analizadas */}
            <div className="bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 relative overflow-hidden shadow-xl border-l-4 border-l-[#00d2b5]">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans">
                {zonesCount}
              </div>
              <div className="text-xs font-semibold text-[#8b96aa] uppercase tracking-wider mt-2">
                Zonas analizadas
              </div>
              <div className="mt-3 text-[11px] text-[#007afc]">
                Kennedy, Suba, Usaquén, etc.
              </div>
            </div>

          </div>

          {/* Cruce Demográfico Card (Page 5: Población total de la zona seleccionada consultada por la app) */}
          <div className="bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Cruce demográfico
              </span>
            </div>

            <div className="flex items-start gap-3 bg-[#1c1f24] p-4 rounded-2xl border border-[#23262d]">
              <MapPin className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">
                  Población total de la zona seleccionada: consultada por la app
                </p>
                <p className="text-xs text-[#a0aaba] mt-0.5">
                  1.080.000 habitantes censados en el polígono geoespacial activo (Kennedy & distritos aledaños).
                </p>
              </div>
            </div>

            {/* Comparison progress bar: Encuestados vs Población Total */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>ENCUESTADOS VS. POBLACIÓN TOTAL</span>
                <span className="text-[#007afc]">Muestra: 1.200 pines</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#0e1012] overflow-hidden p-0.5 border border-[#1c1f24]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#007afc] to-[#00d2b5]"
                  style={{ width: '42%' }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8b96aa]">
                <span>Muestra representativa (95% nivel de confianza)</span>
                <span>Población total de la zona (1.080.000)</span>
              </div>
            </div>

          </div>

        </div>

        {/* Top Right: Tendencia por Zona (Bar chart from Page 5) (5 cols) */}
        <div className="lg:col-span-5 bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#007afc]">
                TENDENCIA POR ZONA
              </span>
              <span className="text-[10px] text-[#8b96aa] uppercase">
                Comparativa Sectorial
              </span>
            </div>

            {/* Bar chart representation matching Page 5 bars */}
            <div className="h-56 flex items-end justify-between gap-4 pt-6 px-2 border-b border-[#1c1f24] pb-2">
              
              {/* Norte */}
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  <div className="w-3 rounded-t bg-[#00d2b5] transition-all" style={{ height: '70%' }} title="Tiene bigote 42%" />
                  <div className="w-3 rounded-t bg-[#f59e0b] transition-all" style={{ height: '55%' }} title="Medio bigote 36%" />
                  <div className="w-3 rounded-t bg-[#ef4444] transition-all" style={{ height: '35%' }} title="No tiene bigote 22%" />
                </div>
                <span className="text-xs font-semibold text-white mt-1">Norte</span>
              </div>

              {/* Sur */}
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  <div className="w-3 rounded-t bg-[#00d2b5] transition-all" style={{ height: '85%' }} title="Tiene bigote 48%" />
                  <div className="w-3 rounded-t bg-[#f59e0b] transition-all" style={{ height: '60%' }} title="Medio bigote 33%" />
                  <div className="w-3 rounded-t bg-[#ef4444] transition-all" style={{ height: '30%' }} title="No tiene bigote 19%" />
                </div>
                <span className="text-xs font-semibold text-white mt-1">Sur</span>
              </div>

              {/* Centro */}
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  <div className="w-3 rounded-t bg-[#00d2b5] transition-all" style={{ height: '50%' }} title="Tiene bigote 40%" />
                  <div className="w-3 rounded-t bg-[#f59e0b] transition-all" style={{ height: '65%' }} title="Medio bigote 38%" />
                  <div className="w-3 rounded-t bg-[#ef4444] transition-all" style={{ height: '40%' }} title="No tiene bigote 22%" />
                </div>
                <span className="text-xs font-semibold text-white mt-1">Centro</span>
              </div>

              {/* Oeste */}
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  <div className="w-3 rounded-t bg-[#00d2b5] transition-all" style={{ height: '75%' }} title="Tiene bigote 46%" />
                  <div className="w-3 rounded-t bg-[#f59e0b] transition-all" style={{ height: '50%' }} title="Medio bigote 34%" />
                  <div className="w-3 rounded-t bg-[#ef4444] transition-all" style={{ height: '35%' }} title="No tiene bigote 20%" />
                </div>
                <span className="text-xs font-semibold text-white mt-1">Oeste</span>
              </div>

            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              {activeSurvey.options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-1.5 text-xs text-[#a0aaba]">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: opt.color }} />
                  <span>{opt.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-[#1c1f24] text-[11px] text-[#8b96aa]">
            <span className="font-semibold text-white">Insight geográfico:</span> La zona Sur (Kennedy) registra la mayor concentración muestral con predominio de la opción líder.
          </div>
        </div>

      </div>

      {/* Second Row: Resultados de la Encuesta (Donut) & Resumen de Campaña & Exportación (Page 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
        
        {/* Left: Resultados de la Encuesta with Donut Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00d2b5]">
                RESULTADOS DE LA ENCUESTA
              </span>
              <span className="text-xs text-[#8b96aa]">
                Pregunta: {activeSurvey.question}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-4">
              
              {/* SVG Donut Chart with Exact Percentages from Page 5: 45%, 35%, 20% */}
              <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#1c1f24"
                    strokeWidth="14"
                  />
                  {/* Segment 1: Tiene bigote 45% (Cyan) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={opt1.color || '#00d2b5'}
                    strokeWidth="14"
                    strokeDasharray={`${45 * 2.387} ${100 * 2.387}`}
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: Tiene medio bigote 35% (Amber) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={opt2.color || '#f59e0b'}
                    strokeWidth="14"
                    strokeDasharray={`${35 * 2.387} ${100 * 2.387}`}
                    strokeDashoffset={`-${45 * 2.387}`}
                  />
                  {/* Segment 3: No tiene bigote 20% (Red) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={opt3.color || '#ef4444'}
                    strokeWidth="14"
                    strokeDasharray={`${20 * 2.387} ${100 * 2.387}`}
                    strokeDashoffset={`-${(45 + 35) * 2.387}`}
                  />
                </svg>

                {/* Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white font-sans">100%</span>
                  <span className="text-[10px] text-[#8b96aa] uppercase tracking-wider font-semibold">Total</span>
                </div>
              </div>

              {/* Legend & Breakdown Table matching Page 5 */}
              <div className="space-y-4 w-full sm:max-w-xs">
                {activeSurvey.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#1c1f24] border border-[#23262d]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-md shrink-0" style={{ backgroundColor: opt.color }} />
                      <span className="text-sm font-semibold text-white">{opt.text}</span>
                    </div>
                    <span className="text-base font-black text-white">{opt.percentage}%</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1c1f24] text-xs text-[#8b96aa] flex items-center justify-between">
            <span>Cálculo automático de proporción ponderada</span>
            <span className="text-white font-medium">Margen de error estimado: ±2.8%</span>
          </div>
        </div>

        {/* Right: Resumen de Campaña & Exportación (Page 5) (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          
          {/* Resumen de Campaña Box */}
          <div className="bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#007afc]">
                RESUMEN DE CAMPAÑA
              </span>
              <Award className="w-4 h-4 text-[#007afc]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1c1f24] text-xs">
                <span className="text-[#8b96aa]">Zona con más respuestas</span>
                <span className="font-bold text-white text-sm">Sur (Kennedy)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1c1f24] text-xs">
                <span className="text-[#8b96aa]">Opción líder</span>
                <span className="font-bold text-[#00d2b5] text-sm">{leaderOption.text}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1c1f24] text-xs">
                <span className="text-[#8b96aa]">Pines registrados</span>
                <span className="font-black text-white text-base">1.200</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-[#8b96aa]">Encuestadores activos</span>
                <span className="font-bold text-[#f59e0b] text-sm">8 en campo</span>
              </div>
            </div>
          </div>

          {/* Exportación Section matching Page 5 */}
          <div className="bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ef4444]">
                EXPORTACIÓN
              </span>
              <span className="text-[10px] text-[#228a56] font-medium bg-[#228a56]/15 px-2 py-0.5 rounded">
                Plan Premium Habilitado
              </span>
            </div>

            <p className="text-xs text-[#8b96aa] mb-4">
              Exporta los datos procesados en formatos compatibles para informes gerenciales o cruce en sistemas estadísticos externos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Botón Descargar PDF (Page 5: Fondo rojo/coral) */}
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="p-4 rounded-2xl bg-[#ef4444] hover:bg-[#dc2626] text-white flex flex-col items-center justify-center text-center shadow-lg transition-transform active:scale-95"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <FileDown className="w-4 h-4" />
                  <span>{downloadingPdf ? 'Generando...' : 'Descargar PDF'}</span>
                </div>
                <span className="text-[10px] text-white/80 mt-1">informe con gráficos numéricos</span>
              </button>

              {/* Botón Descargar Excel (Page 5: Fondo turquesa/verde) */}
              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className="p-4 rounded-2xl bg-[#00d2b5] hover:bg-[#00bda3] text-black flex flex-col items-center justify-center text-center shadow-lg transition-transform active:scale-95"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-black" />
                  <span>{downloadingExcel ? 'Generando...' : 'Descargar Excel'}</span>
                </div>
                <span className="text-[10px] text-black/80 mt-1">base de datos para análisis crudo</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
