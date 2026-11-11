import React from 'react';
import { ArrowLeft, X, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import { AdminPlanTier, Interviewer, PLAN_CONFIGS, SurveyRecord } from '../../types/votality';

interface VotalityStatisticsModalProps {
  records: SurveyRecord[];
  interviewers?: Interviewer[];
  onClose: () => void;
  adminTier?: AdminPlanTier;
  isFreePlan?: boolean;
  projectName?: string;
  onUpgrade?: () => void;
}

export const VotalityStatisticsModal: React.FC<VotalityStatisticsModalProps> = ({
  records,
  interviewers = [],
  onClose,
  adminTier = 'comunal',
  isFreePlan = false,
  projectName,
}) => {
  // Para el Plan Básico (Free): tomar estrictamente las personas encuestadas hasta el límite de 100
  const personasEncuestadas = isFreePlan ? records.slice(0, 100) : [];

  // 1. Configuración de Capacidad según el Plan
  const planConfig = isFreePlan ? PLAN_CONFIGS.free : PLAN_CONFIGS[adminTier];
  const maxPins = planConfig.maxPins;
  const planName = planConfig.name;

  // Total de pines en el sistema
  const totalPinesRegistrados = records.length;
  
  // Porcentaje visible de ocupación territorial
  const rawPercentage = maxPins > 0 ? (totalPinesRegistrados / maxPins) * 100 : 0;
  const displayPercentage =
    rawPercentage === 0
      ? '0%'
      : rawPercentage < 0.1
      ? `${rawPercentage.toFixed(2)}%`
      : `${rawPercentage.toFixed(1)}%`;

  const progressWidth = Math.min(100, Math.max(totalPinesRegistrados > 0 ? 0.8 : 0, rawPercentage));

  // 2. Mapeo del Desglose de Rendimiento por Entrevistador
  // Contabilizamos encuestas reales asociadas por nombre o id de encuestador
  const countsBySurveyor: Record<string, number> = {};
  records.forEach((r) => {
    const surveyor = r.surveyorName?.trim() || 'Encuestador General';
    countsBySurveyor[surveyor] = (countsBySurveyor[surveyor] || 0) + 1;
  });

  // Consolidar lista de encuestadores vinculados
  interface SurveyorRow {
    id: string;
    name: string;
    surveys: number;
  }

  const rows: SurveyorRow[] = [];
  const processedNames = new Set<string>();

  // Primero agregamos los encuestadores registrados en el equipo
  interviewers.forEach((interviewer) => {
    const count =
      countsBySurveyor[interviewer.name] !== undefined
        ? countsBySurveyor[interviewer.name]
        : interviewer.totalSurveys || 0;

    rows.push({
      id: interviewer.id,
      name: interviewer.name,
      surveys: count,
    });
    processedNames.add(interviewer.name.toLowerCase());
  });

  // Agregar cualquier encuestador que tenga registros pero no esté en la lista formal de vinculados
  Object.entries(countsBySurveyor).forEach(([name, count], index) => {
    if (!processedNames.has(name.toLowerCase())) {
      rows.push({
        id: `surv-${index}`,
        name: name,
        surveys: count,
      });
      processedNames.add(name.toLowerCase());
    }
  });

  // Si no hay encuestadores aún vinculados
  if (rows.length === 0) {
    rows.push({
      id: 'default-admin',
      name: 'Equipo de Campo / Administrador',
      surveys: totalPinesRegistrados,
    });
  }

  // 3. Fila de Total Consolidado: Suma matemática exacta de todas las encuestas realizadas
  const totalConsolidado = rows.reduce((acc, row) => acc + row.surveys, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none font-sans animate-in fade-in duration-150">
      <div 
        className="bg-[#000000] border-2 border-white w-full max-w-3xl rounded-[3.6px] shadow-[0_0_50px_rgba(255,255,255,0.12)] flex flex-col overflow-hidden max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between gap-4 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-white text-white hover:text-black border border-[#333333] hover:border-white font-mono text-xs uppercase tracking-wider rounded-[3px] transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Mapa</span>
            </button>
            <div className="hidden sm:block h-4 w-[1px] bg-[#333333]" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
                {isFreePlan ? 'LISTA DE PERSONAS ENCUESTADAS' : 'ESTADÍSTICAS SIMPLIFICADAS'}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight">
                {isFreePlan ? 'Personas Encuestadas (Plan Básico)' : projectName ? `Proyecto: ${projectName}` : 'Rendimiento y Capacidad de Campo'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-[2.6px] bg-[#141414] border border-[#333333] font-mono text-[11px] text-[#cccccc] uppercase">
              {planName}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-[#777777] hover:text-white hover:bg-[#1a1a1a] rounded-sm transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isFreePlan ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-[#888888] px-1">
              <span>Lista de Encuestados en Terreno</span>
              <span className="text-white font-bold">
                {personasEncuestadas.length} / 100 Registradas
              </span>
            </div>

            {personasEncuestadas.length === 0 ? (
              <div className="p-12 text-center border border-[#222222] bg-[#0a0a0a] rounded-[3.6px] space-y-2">
                <Users className="w-8 h-8 text-[#555555] mx-auto" />
                <p className="text-sm text-white font-medium">Aún no hay personas encuestadas registradas.</p>
                <p className="text-xs text-[#777777] font-mono max-w-sm mx-auto">
                  Agrega pines en el mapa para registrar a tus encuestados. Tu Plan Básico te permite registrar hasta 100 personas.
                </p>
              </div>
            ) : (
              <div className="border border-[#262626] rounded-[3.6px] overflow-hidden bg-[#000000]">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#121212] border-b border-[#262626] text-[11px] uppercase tracking-wider text-[#888888]">
                      <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-3 px-4 font-semibold">Nombre de la Persona Encuestada</th>
                      <th className="py-3 px-4 font-semibold">Dirección</th>
                      <th className="py-3 px-4 font-semibold text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {personasEncuestadas.map((persona, index) => (
                      <tr 
                        key={persona.id || index}
                        className="hover:bg-[#111111] transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-[#666666] font-bold">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {persona.name || 'Sin nombre registrado'}
                        </td>
                        <td className="py-3 px-4 text-[#aaaaaa]">
                          {persona.address || 'Ubicación en mapa'}
                        </td>
                        <td className="py-3 px-4 text-[#888888] text-right">
                          {persona.createdAt
                            ? new Date(persona.createdAt).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : 'Reciente'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {/* SECCIÓN A: Barra de Progreso y Contador de Capacidad de Pines */}
            <div className="p-4 sm:p-5 bg-[#0a0a0a] border border-[#333333] rounded-[3.6px] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="font-mono text-xs sm:text-sm text-white font-bold tracking-wide">
                  Pines Registrados: {totalPinesRegistrados.toLocaleString('es-CO')} / {maxPins.toLocaleString('es-CO')} (Tope Máximo)
                </div>
                <div className="font-mono text-xs text-[#aaaaaa]">
                  <span className="text-white font-bold">{displayPercentage}</span> de capacidad utilizada
                </div>
              </div>

              {/* Barra de Progreso Horizontal */}
              <div className="w-full bg-[#181818] h-3.5 border border-[#333333] rounded-[2px] overflow-hidden p-0.5">
                <div
                  className="bg-white h-full transition-all duration-500 rounded-[1px]"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            {/* SECCIÓN B & C: Desglose de Rendimiento por Entrevistador y Total Consolidado */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#888888] px-1">
                <span>Desglose de Rendimiento por Entrevistador</span>
                <span>{rows.length} {rows.length === 1 ? 'persona' : 'personas'}</span>
              </div>

              <div className="border border-[#262626] rounded-[3.6px] overflow-hidden bg-[#000000]">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#121212] border-b border-[#262626] text-[11px] uppercase tracking-wider text-[#888888]">
                      <th className="py-3 px-4 font-semibold">Entrevistador</th>
                      <th className="py-3 px-4 font-semibold text-right">Encuestas Realizadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {rows.map((row) => (
                      <tr 
                        key={row.id} 
                        className="hover:bg-[#111111] transition-colors"
                      >
                        <td className="py-3 px-4 text-white font-medium flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                          <span>{row.name}</span>
                        </td>
                        <td className="py-3 px-4 text-white font-bold text-right">
                          {row.surveys.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}

                    {/* SECCIÓN C: Fila de Total Consolidado */}
                    <tr className="bg-[#161616] border-t-2 border-white text-white font-bold">
                      <td className="py-3.5 px-4 uppercase tracking-wider text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Total de Encuestas Realizadas:</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-extrabold tracking-tight">
                        {totalConsolidado.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#222222] bg-[#0a0a0a] flex items-center justify-between font-mono text-[11px] text-[#666666]">
          <span>{isFreePlan ? `Total encuestados: ${personasEncuestadas.length} de 100 permitidos` : 'Métricas consolidadas en tiempo real'}</span>
          <span>VOTALITY // {isFreePlan ? 'PLAN BÁSICO' : 'CONTROL DE CAMPO'}</span>
        </div>
      </div>
    </div>
  );
};
