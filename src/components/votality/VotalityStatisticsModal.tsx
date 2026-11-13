import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  X,
  BarChart3,
  Users,
  CheckCircle2,
  MapPin,
  Download,
  FileSpreadsheet,
  Printer,
  Filter,
  Sparkles,
  PieChart as PieChartIcon,
  Building2,
  TrendingUp,
  Percent,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  AdminPlanTier,
  FormField,
  Interviewer,
  PLAN_CONFIGS,
  SurveyRecord,
  UserRole,
} from '../../types/votality';
import { UserSession } from '../auth/AuthPage';
import {
  obtenerPoblacionDepartamento,
  obtenerPoblacionMunicipio,
  calcularMuestraObjetivo,
} from '../../data/colombiaPopulationData';

export interface VotalityStatisticsModalProps {
  records: SurveyRecord[];
  interviewers?: Interviewer[];
  onClose: () => void;
  onLocateOnMap?: (record: SurveyRecord) => void;
  adminTier?: AdminPlanTier;
  isFreePlan?: boolean;
  projectName?: string;
  onUpgrade?: () => void;
  userRole?: UserRole;
  currentUser?: UserSession | null;
  formFields?: FormField[];
}

// Paleta de colores de alto contraste para gráficos en torta y barras
const CHART_COLORS = [
  '#00FF85', // Verde esmeralda neón principal
  '#38BDF8', // Azul celeste
  '#F59E0B', // Ámbar dorado
  '#EC4899', // Rosa vibrante
  '#A855F7', // Púrpura
  '#10B981', // Verde jade
  '#F43F5E', // Rojo coral
  '#06B6D4', // Cian
  '#84CC16', // Lima
  '#6366F1', // Índigo
];

interface DonutSlice {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Componente SVG interactivo para Gráfico en Torta / Donut
 */
const SvgDonutChart: React.FC<{
  slices: DonutSlice[];
  total: number;
  centerLabel?: string;
  size?: number;
}> = ({ slices, total, centerLabel = 'Total', size = 180 }) => {
  const radius = 60;
  const strokeWidth = 24;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Fondo del anillo */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#181818"
            strokeWidth={strokeWidth}
          />
          {total === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#2a2a2a"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
            />
          ) : (
            slices.map((slice, idx) => {
              const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += slice.percentage;

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-90"
                />
              );
            })
          )}
        </svg>

        {/* Etiqueta central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-bold font-mono text-white leading-none">
            {total.toLocaleString('es-CO')}
          </span>
          <span className="text-[10px] font-mono uppercase text-[#888888] mt-1">
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="w-full mt-3 grid grid-cols-2 gap-1.5 text-xs font-mono">
        {slices.slice(0, 6).map((slice, idx) => (
          <div key={idx} className="flex items-center gap-1.5 truncate" title={`${slice.label}: ${slice.count} (${slice.percentage.toFixed(1)}%)`}>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-[#aaaaaa] truncate text-[11px]">{slice.label}:</span>
            <span className="text-white font-bold ml-auto text-[11px]">
              {slice.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const VotalityStatisticsModal: React.FC<VotalityStatisticsModalProps> = ({
  records,
  interviewers = [],
  onClose,
  onLocateOnMap,
  adminTier = 'comunal',
  isFreePlan = false,
  projectName,
  userRole = 'admin',
  currentUser,
  formFields = [],
}) => {
  // Filtros interactivos
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('todos');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('todos');
  const [selectedSurveyor, setSelectedSurveyor] = useState<string>('todos');

  const isEncuestador = userRole === 'encuestador';

  // 1. RESTRICCIÓN DE ROL:
  // Si es Encuestador, SOLO puede mirar los que él encuestó.
  // El Administrador ve el TOTAL de todos.
  const baseRecords = useMemo(() => {
    if (!isEncuestador) {
      return records;
    }

    const currentUserId = (currentUser?.id || '').toLowerCase();
    const currentUserName = (currentUser?.name || '').trim().toLowerCase();

    return records.filter((r) => {
      const surveyorId = (r.surveyorId || '').toLowerCase();
      const surveyorName = (r.surveyorName || '').trim().toLowerCase();

      return (
        (currentUserId && surveyorId === currentUserId) ||
        (currentUserName && surveyorName === currentUserName) ||
        (currentUserName && surveyorName.includes(currentUserName))
      );
    });
  }, [records, isEncuestador, currentUser]);

  // Lista de departamentos y municipios disponibles en los registros
  const departamentosDisponibles = useMemo(() => {
    const set = new Set<string>();
    baseRecords.forEach((r) => {
      if (r.departamento) set.add(r.departamento.trim());
      else if (r.censusSector) set.add(r.censusSector.trim());
    });
    return Array.from(set).sort();
  }, [baseRecords]);

  const municipiosDisponibles = useMemo(() => {
    const set = new Set<string>();
    baseRecords.forEach((r) => {
      if (
        selectedDepartamento === 'todos' ||
        r.departamento?.toLowerCase() === selectedDepartamento.toLowerCase()
      ) {
        if (r.municipio) set.add(r.municipio.trim());
      }
    });
    return Array.from(set).sort();
  }, [baseRecords, selectedDepartamento]);

  // 2. APLICACIÓN DE FILTROS EN TIEMPO REAL
  const filteredRecords = useMemo(() => {
    return baseRecords.filter((r) => {
      if (
        selectedDepartamento !== 'todos' &&
        r.departamento?.toLowerCase() !== selectedDepartamento.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedMunicipio !== 'todos' &&
        r.municipio?.toLowerCase() !== selectedMunicipio.toLowerCase()
      ) {
        return false;
      }
      if (
        !isEncuestador &&
        selectedSurveyor !== 'todos' &&
        r.surveyorName?.toLowerCase() !== selectedSurveyor.toLowerCase() &&
        r.surveyorId?.toLowerCase() !== selectedSurveyor.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [baseRecords, selectedDepartamento, selectedMunicipio, selectedSurveyor, isEncuestador]);

  // 3. CAPACIDAD DEL PLAN
  const planConfig = isFreePlan ? PLAN_CONFIGS.free : PLAN_CONFIGS[adminTier];
  const maxPins = planConfig.maxPins;
  const planName = planConfig.name;

  const totalPinesRegistrados = filteredRecords.length;
  const rawPercentage = maxPins > 0 ? (totalPinesRegistrados / maxPins) * 100 : 0;
  const displayPercentage =
    rawPercentage === 0
      ? '0%'
      : rawPercentage < 0.1
      ? `${rawPercentage.toFixed(2)}%`
      : `${rawPercentage.toFixed(1)}%`;

  // 4. DATOS DEMOGRÁFICOS CENSO DANE Y CÁLCULO DE MUESTRA
  // Total de personas que viven en tal departamento / municipio
  const demographicStats = useMemo(() => {
    const targetMun = selectedMunicipio !== 'todos' ? selectedMunicipio : '';
    const targetDep = selectedDepartamento !== 'todos' ? selectedDepartamento : '';

    let poblacionTotal = 0;
    let labelTerritorio = 'Territorio Nacional / Consolidado';

    if (targetMun) {
      poblacionTotal = obtenerPoblacionMunicipio(targetMun, targetDep);
      labelTerritorio = `${targetMun}${targetDep ? `, ${targetDep}` : ''}`;
    } else if (targetDep) {
      poblacionTotal = obtenerPoblacionDepartamento(targetDep);
      labelTerritorio = `Departamento de ${targetDep}`;
    } else {
      poblacionTotal = 50000000; // Colombia
      labelTerritorio = 'Colombia (Campaña General)';
    }

    // Tamaño de muestra estadístico representativo (95% confianza, e=4% o 5%)
    const muestraRecomendada = calcularMuestraObjetivo(poblacionTotal, 0.045);
    const encuestasRealizadas = filteredRecords.length;
    const faltantesParaMuestra = Math.max(0, muestraRecomendada - encuestasRealizadas);
    const avanceMuestral =
      muestraRecomendada > 0
        ? Math.min(100, (encuestasRealizadas / muestraRecomendada) * 100)
        : 0;

    const representatividadPoblacional =
      poblacionTotal > 0 ? (encuestasRealizadas / poblacionTotal) * 100 : 0;

    return {
      labelTerritorio,
      poblacionTotal,
      encuestasRealizadas,
      muestraRecomendada,
      faltantesParaMuestra,
      avanceMuestral,
      representatividadPoblacional,
    };
  }, [selectedMunicipio, selectedDepartamento, filteredRecords]);

  // 5. PREGUNTAS PERSONALIZADAS Y DISTRIBUCIÓN
  const customQuestions = useMemo(() => {
    return formFields.filter((f) => !f.isDefault && f.id !== 'nombre' && f.id !== 'direccion');
  }, [formFields]);

  // Conteo de respuestas para cada pregunta personalizada
  const customQuestionMetrics = useMemo(() => {
    return customQuestions.map((q) => {
      const tally: Record<string, number> = {};
      let totalAnswered = 0;
      const numericValues: number[] = [];

      filteredRecords.forEach((r) => {
        const ans = r.answers?.[q.id];
        if (ans !== undefined && ans !== null && ans !== '') {
          totalAnswered++;
          const strAns = typeof ans === 'boolean' ? (ans ? 'Sí' : 'No') : String(ans).trim();
          tally[strAns] = (tally[strAns] || 0) + 1;

          if (q.type === 'number') {
            const num = Number(ans);
            if (!isNaN(num)) numericValues.push(num);
          }
        }
      });

      // Crear slices para torta
      const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1]);
      const slices: DonutSlice[] = sortedTally.map(([label, count], idx) => ({
        label,
        count,
        percentage: totalAnswered > 0 ? (count / totalAnswered) * 100 : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }));

      // Métricas numéricas
      let numAvg = 0;
      let numMin = 0;
      let numMax = 0;
      if (numericValues.length > 0) {
        numMin = Math.min(...numericValues);
        numMax = Math.max(...numericValues);
        numAvg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      }

      return {
        question: q,
        totalAnswered,
        slices,
        sortedTally,
        numAvg,
        numMin,
        numMax,
      };
    });
  }, [customQuestions, filteredRecords]);

  // 6. DISTRIBUCIÓN POR MUNICIPIO PARA GRÁFICO EN TORTA
  const municipioSlices: DonutSlice[] = useMemo(() => {
    const munCount: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const mun = r.municipio || r.censusSector || 'Sin Municipio';
      munCount[mun] = (munCount[mun] || 0) + 1;
    });

    const total = filteredRecords.length;
    return Object.entries(munCount)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], idx) => ({
        label,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }));
  }, [filteredRecords]);

  // 7. DESGLOSE DE RENDIMIENTO POR ENCUESTADOR
  const countsBySurveyor = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const surveyor = r.surveyorName?.trim() || 'Encuestador de Campo';
      map[surveyor] = (map[surveyor] || 0) + 1;
    });
    return map;
  }, [filteredRecords]);

  const rowsSurveyors = useMemo(() => {
    return Object.entries(countsBySurveyor)
      .sort((a, b) => b[1] - a[1])
      .map(([name, surveys], idx) => ({
        id: `surv-${idx}`,
        name,
        surveys,
        percentage:
          filteredRecords.length > 0 ? (surveys / filteredRecords.length) * 100 : 0,
      }));
  }, [countsBySurveyor, filteredRecords]);

  // 8. EXPORTAR A EXCEL (.CSV compatible con Microsoft Excel)
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('No hay encuestas en el filtro actual para exportar.');
      return;
    }

    // Cabeceras base
    const headers = [
      'ID Encuesta',
      'Fecha',
      'Encuestador',
      'Nombre Encuestado',
      'Direccion Completa',
      'Departamento',
      'Municipio',
      'Barrio',
      'Latitud',
      'Longitud',
      'Nivel Precision',
      'Fuente Ubicacion',
    ];

    // Cabeceras de preguntas personalizadas
    customQuestions.forEach((q) => {
      headers.push(`Pregunta: ${q.label}`);
    });

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.map(escapeCsv).join(';')];

    filteredRecords.forEach((r) => {
      const dateStr = r.createdAt
        ? new Date(r.createdAt).toLocaleString('es-CO')
        : 'Reciente';

      const row = [
        escapeCsv(r.id),
        escapeCsv(dateStr),
        escapeCsv(r.surveyorName || 'Encuestador'),
        escapeCsv(r.name),
        escapeCsv(r.address),
        escapeCsv(r.departamento || ''),
        escapeCsv(r.municipio || ''),
        escapeCsv(r.barrio || ''),
        escapeCsv(r.lat.toFixed(6)),
        escapeCsv(r.lng.toFixed(6)),
        escapeCsv(r.nivelPrecision || 'EXACTA'),
        escapeCsv(r.fuente || 'satelital'),
      ];

      // Respuestas personalizadas
      customQuestions.forEach((q) => {
        const ans = r.answers?.[q.id];
        const formattedAns =
          typeof ans === 'boolean'
            ? ans
              ? 'Sí'
              : 'No'
            : ans !== undefined && ans !== null
            ? String(ans)
            : 'Sin responder';
        row.push(escapeCsv(formattedAns));
      });

      csvRows.push(row.join(';'));
    });

    // Agregar BOM UTF-8 (\uFEFF) para que Excel reconozca tildes y caracteres en español
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timeStamp = new Date().toISOString().slice(0, 10);
    link.download = `Votality_Estadisticas_${selectedMunicipio !== 'todos' ? selectedMunicipio : 'Campana'}_${timeStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 9. EXPORTAR A PDF (Impresión ejecutiva en alta calidad)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none font-sans animate-in fade-in duration-150">
      <div
        id="votality-printable-report"
        className="bg-[#050505] border-2 border-white w-full max-w-5xl rounded-[3.6px] shadow-[0_0_50px_rgba(255,255,255,0.12)] flex flex-col overflow-hidden max-h-[94vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera Principal */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-white text-white hover:text-black border border-[#333333] hover:border-white font-mono text-xs uppercase tracking-wider rounded-[3px] transition-all cursor-pointer active:scale-95 no-print"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Mapa</span>
            </button>
            <div className="hidden sm:block h-4 w-[1px] bg-[#333333] no-print" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FF85] font-bold">
                  SISTEMA DE ESTADÍSTICAS Y CENSO DANE
                </span>
                {isEncuestador ? (
                  <span className="text-[9px] font-mono uppercase bg-[#002B36] text-[#2AA198] border border-[#2AA198]/40 px-2 py-0.2 rounded-xs">
                    Tus Encuestas Propias
                  </span>
                ) : (
                  <span className="text-[9px] font-mono uppercase bg-[#003820] text-[#00FF85] border border-[#00FF85]/40 px-2 py-0.2 rounded-xs">
                    Consolidado Total Campaña
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight mt-0.5">
                {projectName ? `Proyecto: ${projectName}` : 'Rendimiento y Cobertura Territorial'}
              </h2>
            </div>
          </div>

          {/* Botones de Exportación PDF / Excel y Cierre */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003820] hover:bg-[#00FF85] text-[#00FF85] hover:text-black border border-[#00FF85]/50 font-mono text-xs uppercase font-bold tracking-wider rounded-xs transition-all cursor-pointer shadow-sm no-print"
              title="Descargar datos tabulados en Excel (.CSV con UTF-8)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-white text-white hover:text-black border border-[#444444] hover:border-white font-mono text-xs uppercase font-bold tracking-wider rounded-xs transition-all cursor-pointer shadow-sm no-print"
              title="Generar informe imprimible en PDF con gráficos"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#777777] hover:text-white hover:bg-[#1a1a1a] rounded-sm transition-colors cursor-pointer no-print ml-1"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros Territoriales en Tiempo Real */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0d0d0d] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3 text-xs font-mono no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[#888888] font-bold">
              <Filter className="w-3.5 h-3.5 text-[#00FF85]" />
              <span>FILTROS:</span>
            </div>

            {/* Filtro Departamento */}
            <select
              value={selectedDepartamento}
              onChange={(e) => {
                setSelectedDepartamento(e.target.value);
                setSelectedMunicipio('todos'); // Reiniciar municipio
              }}
              className="bg-[#181818] border border-[#333333] text-white px-2.5 py-1 rounded-xs focus:border-[#FFFFFF] outline-none"
            >
              <option value="todos">Todos los Departamentos</option>
              {departamentosDisponibles.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>

            {/* Filtro Municipio */}
            <select
              value={selectedMunicipio}
              onChange={(e) => setSelectedMunicipio(e.target.value)}
              className="bg-[#181818] border border-[#333333] text-white px-2.5 py-1 rounded-xs focus:border-[#FFFFFF] outline-none"
            >
              <option value="todos">Todos los Municipios</option>
              {municipiosDisponibles.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>

            {/* Filtro Encuestador (Solo para Administrador) */}
            {!isEncuestador && rowsSurveyors.length > 1 && (
              <select
                value={selectedSurveyor}
                onChange={(e) => setSelectedSurveyor(e.target.value)}
                className="bg-[#181818] border border-[#333333] text-white px-2.5 py-1 rounded-xs focus:border-[#FFFFFF] outline-none"
              >
                <option value="todos">Todos los Encuestadores</option>
                {rowsSurveyors.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.surveys})
                  </option>
                ))}
              </select>
            )}

            {(selectedDepartamento !== 'todos' ||
              selectedMunicipio !== 'todos' ||
              selectedSurveyor !== 'todos') && (
              <button
                onClick={() => {
                  setSelectedDepartamento('todos');
                  setSelectedMunicipio('todos');
                  setSelectedSurveyor('todos');
                }}
                className="text-[11px] text-[#00FF85] hover:underline cursor-pointer ml-1"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="text-[11px] text-[#888888]">
            Mostrando <span className="text-white font-bold">{filteredRecords.length}</span> de{' '}
            <span className="text-white font-bold">{baseRecords.length}</span> encuestas
          </div>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECCIÓN 1: CONTRASTE DEMOGRÁFICO CENSO DANE VS MUESTRA LEVANTADA */}
          <div className="p-4 sm:p-5 bg-[#0a0a0a] border border-[#333333] rounded-[3.6px] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00FF85]" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                    Representatividad Demográfica DANE
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {demographicStats.labelTerritorio}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#141414] border border-[#333333] text-[11px] font-mono text-[#cccccc] rounded-xs">
                  Censo Poblacional Oficial
                </span>
              </div>
            </div>

            {/* Comparativa Población vs Muestra */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 bg-[#111111] border border-[#222222] rounded-xs space-y-1">
                <div className="text-[10px] text-[#888888] uppercase">Población Total (DANE)</div>
                <div className="text-lg sm:text-xl font-bold text-white">
                  {demographicStats.poblacionTotal.toLocaleString('es-CO')}
                </div>
                <div className="text-[10px] text-[#666666]">Habitantes del territorio</div>
              </div>

              <div className="p-3 bg-[#111111] border border-[#222222] rounded-xs space-y-1">
                <div className="text-[10px] text-[#00FF85] uppercase">Encuestas Realizadas</div>
                <div className="text-lg sm:text-xl font-bold text-[#00FF85]">
                  {demographicStats.encuestasRealizadas.toLocaleString('es-CO')}
                </div>
                <div className="text-[10px] text-[#666666]">
                  {demographicStats.representatividadPoblacional < 0.01
                    ? '< 0.01%'
                    : `${demographicStats.representatividadPoblacional.toFixed(2)}%`}{' '}
                  de la población
                </div>
              </div>

              <div className="p-3 bg-[#111111] border border-[#222222] rounded-xs space-y-1">
                <div className="text-[10px] text-[#38BDF8] uppercase">Muestra Objetivo (95% Conf.)</div>
                <div className="text-lg sm:text-xl font-bold text-[#38BDF8]">
                  {demographicStats.muestraRecomendada.toLocaleString('es-CO')}
                </div>
                <div className="text-[10px] text-[#666666]">Meta estadística del pueblo</div>
              </div>

              <div className="p-3 bg-[#111111] border border-[#222222] rounded-xs space-y-1">
                <div className="text-[10px] text-[#F59E0B] uppercase">Faltantes para Meta</div>
                <div className="text-lg sm:text-xl font-bold text-[#F59E0B]">
                  {demographicStats.faltantesParaMuestra.toLocaleString('es-CO')}
                </div>
                <div className="text-[10px] text-[#666666]">
                  {demographicStats.faltantesParaMuestra === 0
                    ? '✓ Muestra Completa'
                    : 'Encuestas por completar'}
                </div>
              </div>
            </div>

            {/* Barra de Avance de la Muestra del Pueblo */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#aaaaaa]">
                  Avance hacia la muestra representativa del pueblo:
                </span>
                <span className="text-white font-bold">
                  {demographicStats.avanceMuestral.toFixed(1)}% completado
                </span>
              </div>
              <div className="w-full bg-[#181818] h-3 border border-[#333333] rounded-[2px] overflow-hidden p-0.5">
                <div
                  className="bg-[#00FF85] h-full transition-all duration-500 rounded-[1px] shadow-[0_0_8px_rgba(0,255,133,0.5)]"
                  style={{ width: `${Math.max(1, demographicStats.avanceMuestral)}%` }}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: BLOQUES ESTADÍSTICOS (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-sm space-y-1">
              <div className="text-[10px] font-mono text-[#888888] uppercase tracking-wider flex items-center justify-between">
                <span>Total Encuestas Filtro</span>
                <Users className="w-4 h-4 text-[#FFFFFF]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {totalPinesRegistrados.toLocaleString('es-CO')}
              </div>
              <div className="text-[11px] font-mono text-[#aaaaaa]">
                {isEncuestador ? 'Registradas por ti en campo' : 'Total acumulado en el proyecto'}
              </div>
            </div>

            <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-sm space-y-1">
              <div className="text-[10px] font-mono text-[#888888] uppercase tracking-wider flex items-center justify-between">
                <span>Capacidad del Plan</span>
                <BarChart3 className="w-4 h-4 text-[#00FF85]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {displayPercentage}
              </div>
              <div className="text-[11px] font-mono text-[#aaaaaa]">
                {totalPinesRegistrados} / {maxPins.toLocaleString('es-CO')} pines máximos
              </div>
            </div>

            <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-sm space-y-1">
              <div className="text-[10px] font-mono text-[#888888] uppercase tracking-wider flex items-center justify-between">
                <span>Cobertura Territorial</span>
                <MapPin className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {municipioSlices.length}{' '}
                <span className="text-sm font-normal text-[#888888]">municipios</span>
              </div>
              <div className="text-[11px] font-mono text-[#aaaaaa]">
                Presencia activa registrada
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: GRÁFICOS EN TORTA Y BLOQUES DE PREGUNTAS PERSONALIZADAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#00FF85]" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                  Estadísticas de Preguntas Personalizadas ({customQuestions.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#777777]">
                Distribución en torta y frecuencias
              </span>
            </div>

            {customQuestions.length === 0 ? (
              <div className="p-8 text-center bg-[#0a0a0a] border border-[#222222] rounded-sm space-y-1">
                <Sparkles className="w-6 h-6 text-[#555555] mx-auto" />
                <p className="text-xs font-mono text-white">
                  No se han configurado preguntas personalizadas en esta campaña.
                </p>
                <p className="text-[11px] font-mono text-[#666666]">
                  El Administrador puede añadir preguntas adicionales desde el botón Crear/Editar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customQuestionMetrics.map((item, idx) => (
                  <div
                    key={item.question.id || idx}
                    className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase text-[#00FF85] bg-[#002b15] px-1.5 py-0.2 rounded border border-[#00FF85]/30">
                          Pregunta #{idx + 1} · Tipo: {item.question.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-[#888888]">
                          {item.totalAnswered} respuestas
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {item.question.label}
                      </h4>
                    </div>

                    {item.totalAnswered === 0 ? (
                      <div className="p-6 text-center text-xs font-mono text-[#666666] bg-[#111111] rounded-xs">
                        Aún no hay respuestas registradas para esta pregunta.
                      </div>
                    ) : item.question.type === 'number' ? (
                      /* Desglose para pregunta numérica */
                      <div className="space-y-3 font-mono text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 bg-[#111111] border border-[#222222] rounded-xs text-center">
                            <div className="text-[9px] text-[#888888] uppercase">Promedio</div>
                            <div className="text-base font-bold text-[#00FF85]">
                              {item.numAvg.toFixed(1)}
                            </div>
                          </div>
                          <div className="p-2.5 bg-[#111111] border border-[#222222] rounded-xs text-center">
                            <div className="text-[9px] text-[#888888] uppercase">Mínimo</div>
                            <div className="text-base font-bold text-white">{item.numMin}</div>
                          </div>
                          <div className="p-2.5 bg-[#111111] border border-[#222222] rounded-xs text-center">
                            <div className="text-[9px] text-[#888888] uppercase">Máximo</div>
                            <div className="text-base font-bold text-white">{item.numMax}</div>
                          </div>
                        </div>

                        {/* Top valores numéricos */}
                        <div className="space-y-1.5 pt-2 border-t border-[#1c1c1c]">
                          {item.sortedTally.slice(0, 4).map(([val, count], sIdx) => {
                            const pct = (count / item.totalAnswered) * 100;
                            return (
                              <div key={sIdx} className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-[#cccccc]">Valor: {val}</span>
                                  <span className="text-white font-bold">
                                    {count} ({pct.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#00FF85] h-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Gráfico en Torta / Donut y Barras Horizontales para Select y Boolean */
                      <div className="space-y-4">
                        <SvgDonutChart
                          slices={item.slices}
                          total={item.totalAnswered}
                          centerLabel="Respuestas"
                          size={160}
                        />

                        {/* Barras Horizontales de Desglose */}
                        <div className="space-y-2 pt-2 border-t border-[#1c1c1c] font-mono text-xs">
                          {item.slices.map((slice, sIdx) => (
                            <div key={sIdx} className="space-y-0.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white truncate max-w-[180px]">
                                  {slice.label}
                                </span>
                                <span className="text-[#aaaaaa] font-bold">
                                  {slice.count} encuestados ({slice.percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-[#161616] h-2 rounded-xs overflow-hidden">
                                <div
                                  className="h-full transition-all duration-500 rounded-xs"
                                  style={{
                                    width: `${slice.percentage}%`,
                                    backgroundColor: slice.color,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN 4: GRÁFICO EN TORTA DE DISTRIBUCIÓN POR MUNICIPIO */}
          {municipioSlices.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#0a0a0a] border border-[#262626] rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#38BDF8]" />
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                    Distribución de Encuestas por Municipio
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#888888]">
                  {municipioSlices.length} sectores territoriales
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <SvgDonutChart
                  slices={municipioSlices}
                  total={filteredRecords.length}
                  centerLabel="Pines"
                  size={170}
                />

                <div className="space-y-2 font-mono text-xs">
                  {municipioSlices.map((slice, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white truncate max-w-[200px]">{slice.label}</span>
                        <span className="text-[#aaaaaa] font-bold">
                          {slice.count} encuestas ({slice.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#181818] h-2 rounded-xs overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${slice.percentage}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 5: DESGLOSE DE RENDIMIENTO POR ENCUESTADOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#888888] px-1">
              <span>
                {isEncuestador
                  ? 'Tu Rendimiento Individual'
                  : 'Desglose de Rendimiento por Entrevistador'}
              </span>
              <span>
                {rowsSurveyors.length} {rowsSurveyors.length === 1 ? 'persona' : 'personas'}
              </span>
            </div>

            <div className="border border-[#262626] rounded-[3.6px] overflow-hidden bg-[#000000]">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121212] border-b border-[#262626] text-[11px] uppercase tracking-wider text-[#888888]">
                    <th className="py-3 px-4 font-semibold">Entrevistador</th>
                    <th className="py-3 px-4 font-semibold text-center">Porcentaje</th>
                    <th className="py-3 px-4 font-semibold text-right">Encuestas Realizadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {rowsSurveyors.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-[#666666]">
                        No hay encuestas registradas bajo este filtro.
                      </td>
                    </tr>
                  ) : (
                    rowsSurveyors.map((row) => (
                      <tr key={row.id} className="hover:bg-[#111111] transition-colors">
                        <td className="py-3 px-4 text-white font-medium flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-[#00FF85]" />
                          <span>{row.name}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-[#aaaaaa]">
                          {row.percentage.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-white font-bold text-right">
                          {row.surveys.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Fila de Total Consolidado */}
                  <tr className="bg-[#161616] border-t-2 border-white text-white font-bold">
                    <td className="py-3.5 px-4 uppercase tracking-wider text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00FF85]" />
                      <span>Total Encuestas Filtro:</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-[#00FF85]">100%</td>
                    <td className="py-3.5 px-4 text-right text-sm font-extrabold tracking-tight">
                      {filteredRecords.length.toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#222222] bg-[#0a0a0a] flex items-center justify-between font-mono text-[11px] text-[#666666] no-print">
          <span>
            {isEncuestador
              ? `Tus encuestas: ${filteredRecords.length} realizadas`
              : `Consolidado: ${filteredRecords.length} de ${maxPins.toLocaleString('es-CO')} capacidad`}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF85]"></span>
            <span>VOTALITY // {isEncuestador ? 'MODO ENCUESTADOR' : 'ESTADÍSTICAS TOTALES'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
