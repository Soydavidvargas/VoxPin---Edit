import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MapPin,
  Compass,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  Users,
} from 'lucide-react';
import { SurveyRecord, FormField, RespondentRecord } from '../../types/votality';

interface VotalityPinDetailDrawerProps {
  pin: SurveyRecord | null;
  allPinsAtLocation?: SurveyRecord[];
  formFields?: FormField[];
  onClose: () => void;
  onCenterPin: (pin: SurveyRecord) => void;
  onMovePin?: (pin: SurveyRecord) => void;
  onEditPin?: (pin: SurveyRecord) => void;
  canEditOrMove?: boolean;
}

const isSystemMetadataKey = (key: string): boolean => {
  const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  const IGNORED = [
    'nombre',
    'primernombre',
    'segundonombre',
    'primerapellido',
    'segundoapellido',
    'alias',
    'apodo',
    'direccion',
    'direcciondian',
    'nomenclaturadian',
    'direccionnormalizada',
    'departamento',
    'municipio',
    'barrio',
    'sector',
    'comuna',
    'complemento',
    'detalle',
    'fuenteubicacion',
    'fuente',
    'nivelprecision',
    'precision',
    'candidatoelegido',
    'puntaje',
    'score',
    'advertencias',
    'locationtype',
    'questionlabels',
    'subsurveys',
    'respondents',
  ];
  return IGNORED.includes(clean);
};

export const VotalityPinDetailDrawer: React.FC<VotalityPinDetailDrawerProps> = ({
  pin,
  allPinsAtLocation,
  formFields,
  onClose,
  onCenterPin,
  onMovePin,
  onEditPin,
  canEditOrMove = true,
}) => {
  const [selectedRespondentIndex, setSelectedRespondentIndex] = useState(0);

  // Unificar todos los encuestados registrados en este PIN o en la misma ubicación
  const respondentsList: RespondentRecord[] = useMemo(() => {
    if (!pin) return [];

    const list: RespondentRecord[] = [];
    const seenIds = new Set<string>();

    // 1. Encuestados dentro de pin.respondents
    if (pin.respondents && pin.respondents.length > 0) {
      pin.respondents.forEach((r) => {
        if (!seenIds.has(r.id)) {
          seenIds.add(r.id);
          list.push(r);
        }
      });
    }

    // 2. Encuestados de allPinsAtLocation (si existen registros anteriores en el mismo punto)
    if (allPinsAtLocation && allPinsAtLocation.length > 0) {
      allPinsAtLocation.forEach((p) => {
        if (p.respondents && p.respondents.length > 0) {
          p.respondents.forEach((r) => {
            if (!seenIds.has(r.id)) {
              seenIds.add(r.id);
              list.push(r);
            }
          });
        } else if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          list.push({
            id: p.id,
            name: p.name,
            surveyorId: p.surveyorId,
            surveyorName: p.surveyorName,
            createdAt: p.createdAt,
            answers: p.answers,
            questionLabels: p.questionLabels,
          });
        }
      });
    }

    // 3. Fallback: El pin mismo como primer encuestado
    if (list.length === 0) {
      list.push({
        id: pin.id,
        name: pin.name,
        surveyorId: pin.surveyorId,
        surveyorName: pin.surveyorName,
        createdAt: pin.createdAt,
        answers: pin.answers,
        questionLabels: pin.questionLabels,
      });
    }

    return list;
  }, [pin, allPinsAtLocation]);

  // Resetear al primer encuestado si cambia el pin inspeccionado
  useEffect(() => {
    setSelectedRespondentIndex(0);
  }, [pin?.id]);

  if (!pin) return null;

  const activeRespondent =
    respondentsList[selectedRespondentIndex] || respondentsList[0] || {
      id: pin.id,
      name: pin.name,
      surveyorId: pin.surveyorId,
      surveyorName: pin.surveyorName,
      createdAt: pin.createdAt,
      answers: pin.answers,
      questionLabels: pin.questionLabels,
    };

  // Helper para obtener el Nombre Completo estructurado (Primer Nombre, Segundo Nombre, Apellidos y Alias)
  const getStructuredFullName = (rec: RespondentRecord): string => {
    const ans = rec.answers || {};
    const pNom = ans.primer_nombre != null ? String(ans.primer_nombre).trim() : '';
    const sNom = ans.segundo_nombre != null ? String(ans.segundo_nombre).trim() : '';
    const pApe = ans.primer_apellido != null ? String(ans.primer_apellido).trim() : '';
    const sApe = ans.segundo_apellido != null ? String(ans.segundo_apellido).trim() : '';
    const alias = ans.alias != null ? String(ans.alias).trim() : '';

    const nameParts = [pNom, sNom, pApe, sApe].filter(Boolean);
    if (nameParts.length > 0) {
      const joined = nameParts.join(' ');
      return alias ? `${joined} (${alias})` : joined;
    }

    if (rec.name) {
      const safeAlias = String(alias);
      return safeAlias && !rec.name.includes(safeAlias) ? `${rec.name} (${safeAlias})` : rec.name;
    }

    return 'Persona Encuestada';
  };

  const activeFullName = getStructuredFullName(activeRespondent);

  const rawDate = activeRespondent.createdAt ? new Date(activeRespondent.createdAt) : null;
  const exactTimeStr =
    rawDate && !isNaN(rawDate.getTime())
      ? rawDate.toLocaleString('es-CO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      : 'Hora no registrada';

  const departamentoName =
    (activeRespondent.answers?.departamento as string) ||
    pin.departamento ||
    (pin.answers?.departamento as string) ||
    'Colombia';

  const municipioName =
    (activeRespondent.answers?.municipio as string) ||
    pin.municipio ||
    (pin.answers?.municipio as string) ||
    pin.censusSector ||
    'No especificado';

  const barrioName =
    (activeRespondent.answers?.barrio as string) ||
    pin.barrio ||
    (pin.answers?.barrio as string) ||
    '';

  const dianAddress =
    (pin.answers?.direccion_dian as string) ||
    (pin.answers?.nomenclatura_dian as string) ||
    pin.direccionNormalizada ||
    pin.address;

  const precisionBadge = () => {
    const prec = pin.nivelPrecision || 'EXACTA';
    if (prec === 'EXACTA') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[10px] font-mono font-bold rounded-xs">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          EXACTA (PREDIO / PUERTA)
        </span>
      );
    }
    if (prec === 'APROXIMADA') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/80 border border-amber-500 text-amber-300 text-[10px] font-mono font-bold rounded-xs">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          APROXIMADA (TRAMO VIAL)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-950/80 border border-rose-500 text-rose-300 text-[10px] font-mono font-bold rounded-xs">
        <AlertTriangle className="w-3 h-3 text-rose-400" />
        SOLO MUNICIPIO
      </span>
    );
  };

  const fuenteLabel =
    pin.fuente === 'gps'
      ? 'GPS Satelital en Terreno'
      : pin.fuente === 'ajuste_manual'
      ? 'Ajuste Manual en Mapa'
      : pin.fuente === 'direccion'
      ? 'Geocodificación Nomenclatura DIAN'
      : 'Ubicación Territorial';

  // Obtener el título legible de la pregunta realizada
  const getQuestionTitle = (key: string): string => {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Buscar en formFields proporcionados
    const field = formFields?.find(
      (f) => f.id === key || f.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey
    );
    if (field?.label) return field.label;

    // 2. Buscar en questionLabels guardadas con el encuestado activo
    if (activeRespondent.questionLabels?.[key]) {
      return activeRespondent.questionLabels[key];
    }
    if (activeRespondent.questionLabels) {
      for (const [k, v] of Object.entries(activeRespondent.questionLabels)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey) return v;
      }
    }

    // 3. Buscar en questionLabels del pin
    if (pin.questionLabels?.[key]) {
      return pin.questionLabels[key];
    }
    if (pin.questionLabels) {
      for (const [k, v] of Object.entries(pin.questionLabels)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey) return v;
      }
    }

    // 4. Buscar en __question_labels de answers
    const embeddedLabels = (activeRespondent.answers?.__question_labels ||
      pin.answers?.__question_labels) as unknown as Record<string, string> | undefined;
    if (embeddedLabels?.[key]) {
      return embeddedLabels[key];
    }
    if (embeddedLabels) {
      for (const [k, v] of Object.entries(embeddedLabels)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey) return v;
      }
    }

    // 5. Buscar en localStorage de preguntas activas
    try {
      const stored =
        localStorage.getItem('votality_active_form_fields') ||
        localStorage.getItem('votality_form_fields');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const matched = parsed.find(
            (f: any) =>
              f.id === key ||
              (f.id && f.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey)
          );
          if (matched?.label) return matched.label;
        }
      }
    } catch {}

    if (formFields && formFields.length > 0) {
      const customOnly = formFields.filter(
        (f) => !f.isDefault && f.id !== 'nombre' && f.id !== 'direccion'
      );
      if (customOnly.length === 1) return customOnly[0].label;
    }

    // 6. Si es un identificador técnico (ej. custom_1794553445849_c5en), JAMÁS mostrar el ID crudo
    if (cleanKey.startsWith('custom')) {
      return 'Pregunta Personalizada';
    }

    return key.replace(/_/g, ' ');
  };

  // Filtrar respuestas de la encuesta (excluyendo metadatos de dirección y nombres base)
  const filteredAnswers = Object.entries(activeRespondent.answers || {}).filter(
    ([k]) => !isSystemMetadataKey(k)
  );

  return (
    <div
      id="pin-detail-drawer"
      className="absolute top-4 right-4 z-30 w-full max-w-sm sm:max-w-md bg-[#000000] border-2 border-[#FFFFFF] shadow-[0_12px_40px_rgba(0,0,0,0.95)] rounded-sm flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden font-sans select-none animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Drawer Top Header */}
      <div className="p-3.5 bg-[#0a0a0a] border-b border-[#262626] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="min-w-0">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#888888] truncate">
              {respondentsList.length > 1
                ? `PIN ACUMULADO · ${respondentsList.length} ENCUESTAS`
                : 'DETALLE DE PIN · ENCUESTADO'}
            </div>
            <h3 className="text-sm font-bold text-[#FFFFFF] truncate leading-tight">
              {activeFullName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onCenterPin(pin)}
            className="p-1.5 bg-[#141414] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#333333] hover:border-[#FFFFFF] rounded-xs transition-colors cursor-pointer"
            title="Centrar mapa en este pin"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#141414] hover:bg-[#262626] text-[#888888] hover:text-[#FFFFFF] rounded-xs transition-colors cursor-pointer"
            title="Cerrar panel de información"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de Personas Acumuladas en este PIN (si hay más de 1 persona) */}
      {respondentsList.length > 1 && (
        <div className="p-2.5 bg-[#111111] border-b border-[#262626] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {respondentsList.length} PERSONAS EN ESTA MISMA UBICACIÓN
            </span>
            <span className="text-[#888888] text-[9px] uppercase">Pin Acumulado</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {respondentsList.map((resp, idx) => (
              <button
                key={resp.id || idx}
                type="button"
                onClick={() => setSelectedRespondentIndex(idx)}
                className={`px-2.5 py-1.5 rounded-xs font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedRespondentIndex === idx
                    ? 'bg-[#FFFFFF] text-[#000000] shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                    : 'bg-[#181818] text-[#aaaaaa] hover:text-[#FFFFFF] border border-[#2a2a2a]'
                }`}
              >
                <span>Persona {idx + 1}:</span>
                <span className="truncate max-w-[130px]">{getStructuredFullName(resp)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Nomenclatura y Dirección Principal */}
        <div className="p-3 bg-[#0f0f0f] border border-[#222222] rounded-xs space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#FFFFFF] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono text-[#888888] uppercase">
                Dirección Registrada
              </div>
              <div className="font-mono text-sm font-bold text-[#FFFFFF] leading-snug">
                {pin.address}
              </div>
              {dianAddress && dianAddress !== pin.address && (
                <div className="mt-1 font-mono text-[11px] text-emerald-400 bg-black/60 px-2 py-0.5 rounded-xs border border-emerald-950 inline-block">
                  DIAN: {dianAddress}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1a1a1a] grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-[#666666] block text-[9px] uppercase">Municipio</span>
              <span className="text-[#FFFFFF] truncate block font-bold">
                {municipioName}
              </span>
            </div>
            <div>
              <span className="text-[#666666] block text-[9px] uppercase">Departamento</span>
              <span className="text-[#FFFFFF] truncate block font-bold">
                {departamentoName}
              </span>
            </div>
          </div>

          {barrioName && (
            <div className="pt-1.5 border-t border-[#1a1a1a] text-[10px] font-mono text-[#888888] flex items-center justify-between">
              <span>Barrio / Sector:</span>
              <span className="text-[#cccccc] font-medium">{barrioName}</span>
            </div>
          )}
        </div>

        {/* Calibración de Precisión Cartográfica (Sin coordenadas numéricas en el front-end) */}
        <div className="p-3 bg-[#0f0f0f] border border-[#222222] rounded-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#888888] uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Precisión Cartográfica</span>
            </div>
            {precisionBadge()}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] pt-1 border-t border-[#1a1a1a]">
            <span>Fuente:</span>
            <span className="text-[#dddddd] font-medium">{fuenteLabel}</span>
          </div>
        </div>

        {/* Respuestas de la Encuesta con Pregunta Realizada y Respuesta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[#888888] tracking-wider">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>
                Preguntas y Respuestas (
                {respondentsList.length > 1
                  ? `${activeFullName}`
                  : `${filteredAnswers.length}`}
                )
              </span>
            </div>
          </div>

          {filteredAnswers.length === 0 ? (
            <div className="p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xs text-[11px] text-[#666666] font-mono text-center">
              No hay preguntas personalizadas registradas para esta persona.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredAnswers.map(([key, val]) => {
                const questionTitle = getQuestionTitle(key);
                return (
                  <div
                    key={key}
                    className="p-3 bg-[#0d0d0d] border border-[#222222] border-l-2 border-l-emerald-500 rounded-xs flex flex-col gap-1.5 hover:border-[#333333] transition-colors"
                  >
                    <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-start gap-1.5">
                      <span className="text-emerald-500 font-mono">?</span>
                      <span>{questionTitle}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#FFFFFF] pl-3 py-0.5">
                      {typeof val === 'boolean'
                        ? val
                          ? 'Sí / Afirmativo'
                          : 'No / Negativo'
                        : String(val)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metadatos del Encuestado Activo y Trazabilidad */}
        <div className="p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xs space-y-2 text-[10px] font-mono text-[#777777]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#555555]" />
              Nombre Completo:
            </span>
            <span className="text-[#FFFFFF] font-bold text-xs">{activeFullName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              Hora de Registro:
            </span>
            <span className="text-emerald-400 font-bold">
              {exactTimeStr}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#555555]" />
              Encuestador:
            </span>
            <span className="text-[#cccccc] font-medium">{activeRespondent.surveyorName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Ubicación Territorial:</span>
            <span className="text-[#cccccc]">{municipioName}, {departamentoName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>ID Encuesta:</span>
            <span className="text-[#555555]">{activeRespondent.id}</span>
          </div>

          {pin.auditTrail && pin.auditTrail.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#1a1a1a] text-[#888888]">
              <span className="text-[9px] uppercase text-amber-400 block font-bold">
                Historial de Corrección ({pin.auditTrail.length}):
              </span>
              <div className="text-[9px] text-[#666666] mt-0.5">
                Última reubicación por {pin.auditTrail[pin.auditTrail.length - 1].corregidoPor}
              </div>
            </div>
          )}
        </div>

        {/* Acciones del Pin */}
        {canEditOrMove && onMovePin && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onMovePin(pin)}
              className="w-full py-2.5 px-3 bg-[#111111] hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/50 hover:border-amber-400 font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <span>⇄ Mover / Reubicar Pin en Minimapa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
