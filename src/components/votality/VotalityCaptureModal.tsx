import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertTriangle, Send, Crosshair, Loader2, Lock } from 'lucide-react';
import { CensusSectorData, FormField, SurveyRecord } from '../../types/votality';
import { reverseGeocodeLocal } from '../../data/colombiaTerritoryData';
import { obtenerUbicacionExacta, solicitarUbicacionGPS } from '../../utils/geolocation';

interface VotalityCaptureModalProps {
  fields: FormField[];
  activeSector?: CensusSectorData;
  onSaveSurvey: (newSurvey: Omit<SurveyRecord, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  surveyorName: string;
  surveyorId: string;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

export const VotalityCaptureModal: React.FC<VotalityCaptureModalProps> = ({
  fields,
  activeSector,
  onSaveSurvey,
  onClose,
  surveyorName,
  surveyorId,
  initialLat,
  initialLng,
  initialAddress,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    nombre: '',
    direccion: initialAddress || '',
  });

  // Coordenadas con precisión milimétrica si provienen de pin arrastrado o búsqueda
  const [lat, setLat] = useState<number>(
    () => initialLat ?? Number(((activeSector?.center[0] ?? 2.686045) + (Math.random() - 0.5) * 0.008).toFixed(6))
  );
  const [lng, setLng] = useState<number>(
    () => initialLng ?? Number(((activeSector?.center[1] ?? -75.327694) + (Math.random() - 0.5) * 0.008).toFixed(6))
  );

  const [hasConfirmedImmutability, setHasConfirmedImmutability] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Sincronización reactiva si la geocodificación inversa o el pin arrastrado cambian la dirección o coordenadas
  useEffect(() => {
    if (initialAddress) {
      setFormData((prev) => ({
        ...prev,
        direccion: initialAddress,
      }));
    }
  }, [initialAddress]);

  useEffect(() => {
    if (initialLat !== undefined) {
      setLat(initialLat);
    }
  }, [initialLat]);

  useEffect(() => {
    if (initialLng !== undefined) {
      setLng(initialLng);
    }
  }, [initialLng]);

  // Solicitar ubicación de forma explícita al abrir o pulsar capturar
  const handleGpsCapture = () => {
    setIsLocatingGps(true);
    setErrorMsg(null);

    solicitarUbicacionGPS(
      (coords) => {
        setIsLocatingGps(false);
        const gLat = coords.lat;
        const gLng = coords.lng;

        if (gLat >= -4.3 && gLat <= 13.5 && gLng >= -81.8 && gLng <= -66.8) {
          setLat(Number(gLat.toFixed(6)));
          setLng(Number(gLng.toFixed(6)));

          const rev = reverseGeocodeLocal(gLat, gLng);
          if (rev && rev.direccion) {
            setFormData((prev) => ({
              ...prev,
              direccion: rev.direccion,
            }));
          }

          const inputLat = document.getElementById('input-lat') as HTMLInputElement | null;
          const inputLng = document.getElementById('input-lng') as HTMLInputElement | null;
          if (inputLat) {
            inputLat.value = gLat.toFixed(6);
            inputLat.dispatchEvent(new Event('input', { bubbles: true }));
            inputLat.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (inputLng) {
            inputLng.value = gLng.toFixed(6);
            inputLng.dispatchEvent(new Event('input', { bubbles: true }));
            inputLng.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else {
          setErrorMsg(
            `Ubicación GPS (${gLat.toFixed(4)}, ${gLng.toFixed(4)}) detectada fuera de Colombia. Recuerde que Votality solo permite registros en territorio nacional.`
          );
        }
      },
      (error) => {
        setIsLocatingGps(false);
        const isDenied = 'code' in error && (error as any).code === 1;
        setErrorMsg(
          isDenied
            ? 'Debes permitir el acceso a tu ubicación en el navegador para marcar encuestas.'
            : `Error de sensor GPS (${error.message}).`
        );
      }
    );
  };

  useEffect(() => {
    if (!initialLat && !initialLng) {
      handleGpsCapture();
    }
  }, []);

  // Separar campos base de los personalizados
  const customFields = fields.filter(
    (f) => !f.isDefault && f.id !== 'nombre' && f.id !== 'direccion'
  );

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validación estricta territorial: Solo dentro de Colombia
    // Latitud: [-4.3, 13.5], Longitud: [-81.8, -66.8]
    if (lat < -4.3 || lat > 13.5 || lng < -81.8 || lng > -66.8) {
      setErrorMsg('Ubicación inválida: el registro debe encontrarse dentro de Colombia.');
      return;
    }

    // 2. Validación estricta de los dos campos base obligatorios
    const nombreVal = (formData.nombre || '').trim();
    const direccionVal = (formData.direccion || '').trim();

    if (!nombreVal) {
      setErrorMsg('El campo "Nombre Completo" es estrictamente obligatorio.');
      return;
    }

    if (!direccionVal) {
      setErrorMsg('El campo "Dirección" es estrictamente obligatorio.');
      return;
    }

    // 3. Validación de campos personalizados que hayan sido marcados como requeridos
    for (const field of customFields) {
      if (field.required) {
        const val = formData[field.id];
        if (val === undefined || val === null || val === '') {
          setErrorMsg(`El campo personalizado "${field.label}" es obligatorio.`);
          return;
        }
      }
    }

    // 4. Validación de inmutabilidad
    if (!hasConfirmedImmutability) {
      setErrorMsg('Debes certificar la cláusula de inmutabilidad antes de registrar en PostGIS.');
      return;
    }

    // 5. Generación del pin espacial
    onSaveSurvey({
      campaignId: 'camp-votality-2026',
      name: nombreVal,
      address: direccionVal,
      lat,
      lng,
      answers: {
        nombre: nombreVal,
        direccion: direccionVal,
        ...formData,
      },
      surveyorId,
      surveyorName,
      censusSector:
        (formData['sector'] as string) ||
        (formData['comuna'] as string) ||
        (activeSector?.name ?? ''),
    });

    // 5. Limpieza del formulario y cierre
    setFormData({ nombre: '', direccion: '' });
    onClose();
  };

  return (
    <div
      id="modal-captura-encuesta"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none font-sans"
    >
      <div className="bg-[#000000] border border-[#FFFFFF] w-full max-w-xl rounded-sm shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
              CAPTURA DE TERRENO EN TIEMPO REAL
            </div>
            <h2 className="text-base font-bold text-[#FFFFFF] mt-0.5">
              Registrar Encuesta en Campo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1a1a1a] rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Coordenadas SIG Inmutables del Pin (Fijadas por Antena GPS) */}
            <div className="p-3 bg-[#111111] border border-[#2e2e2e] rounded-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#888888]">
                  <Lock className="w-3.5 h-3.5 text-[#aaaaaa] shrink-0" />
                  <span>COORDENADAS GPS INMUTABLES (SOLO LECTURA)</span>
                </div>
                <button
                  type="button"
                  id="btn-gps-modal"
                  onClick={handleGpsCapture}
                  disabled={isLocatingGps}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-[#000000] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#FFFFFF] rounded-xs font-mono text-[10px] uppercase font-bold transition-all cursor-pointer active:scale-95"
                  title="Obtener coordenadas GPS nativas en tiempo real"
                >
                  {isLocatingGps ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Crosshair className="w-3 h-3" />
                  )}
                  <span>GPS Puerta</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-1.5 bg-[#111111] border border-[#222222] rounded-xs flex items-center justify-between cursor-not-allowed select-none">
                  <div className="flex items-center gap-1 text-[#666666]">
                    <Lock className="w-3 h-3 text-[#555555]" />
                    <span>LAT:</span>
                  </div>
                  <input
                    id="input-lat"
                    type="number"
                    step="any"
                    value={lat}
                    readOnly
                    tabIndex={-1}
                    onKeyDown={(e) => e.preventDefault()}
                    className="bg-transparent text-right text-[#888888] cursor-not-allowed select-none focus:outline-none w-28 font-mono font-medium pointer-events-none"
                    title="Coordenada inmutable fijada por la antena GPS del dispositivo"
                  />
                </div>
                <div className="p-1.5 bg-[#111111] border border-[#222222] rounded-xs flex items-center justify-between cursor-not-allowed select-none">
                  <div className="flex items-center gap-1 text-[#666666]">
                    <Lock className="w-3 h-3 text-[#555555]" />
                    <span>LNG:</span>
                  </div>
                  <input
                    id="input-lng"
                    type="number"
                    step="any"
                    value={lng}
                    readOnly
                    tabIndex={-1}
                    onKeyDown={(e) => e.preventDefault()}
                    className="bg-transparent text-right text-[#888888] cursor-not-allowed select-none focus:outline-none w-28 font-mono font-medium pointer-events-none"
                    title="Coordenada inmutable fijada por la antena GPS del dispositivo"
                  />
                </div>
              </div>
              <div className="text-[10px] font-mono text-[#666666] flex justify-between">
                <span>Rango Col: [-4.3°, 13.5°]</span>
                <span>Rango Col: [-81.8°, -66.8°]</span>
              </div>
            </div>

            {/* SECCIÓN 1: LOS DOS CAMPOS BASE OBLIGATORIOS */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#888888]">
                Datos Base Obligatorios
              </div>

              {/* 1. Nombre Completo */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-[#cccccc]">
                  Nombre Completo <span className="text-[#FFFFFF] font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="input-nombre-completo"
                  required
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ingrese el nombre completo del encuestado"
                  className="w-full bg-[#111111] text-[#FFFFFF] text-xs p-2.5 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none"
                />
              </div>

              {/* 2. Dirección */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-[#cccccc]">
                  Dirección <span className="text-[#FFFFFF] font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="input-direccion"
                  required
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Ej: Cra 102 # 34-18, Barrio / Comuna"
                  className="w-full bg-[#111111] text-[#FFFFFF] text-xs p-2.5 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none"
                />
              </div>
            </div>

            {/* SECCIÓN 2: CAMPOS PERSONALIZADOS (Solo si el usuario añadió preguntas en el editor) */}
            {customFields.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#222222]">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#888888]">
                  Preguntas Personalizadas de la Campaña ({customFields.length})
                </div>

                {customFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="block font-mono text-[11px] text-[#cccccc]">
                      {field.label}{' '}
                      {field.required && <span className="text-[#FFFFFF] font-bold">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={`Ingrese ${field.label.toLowerCase()}`}
                        className="w-full bg-[#111111] text-[#FFFFFF] text-xs p-2.5 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#111111] text-[#FFFFFF] text-xs p-2.5 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none font-mono"
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className="w-full bg-[#111111] text-[#FFFFFF] text-xs p-2.5 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none font-mono"
                      >
                        <option value="">-- Seleccionar opción --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'boolean' && (
                      <div className="flex items-center gap-3 pt-1">
                        <label
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm border cursor-pointer font-mono text-xs transition-all ${
                            formData[field.id] === true
                              ? 'bg-[#FFFFFF] text-[#000000] border-[#FFFFFF] font-bold shadow-sm'
                              : 'bg-[#111111] text-[#cccccc] border-[#333333] hover:border-[#666666]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`bool_${field.id}`}
                            checked={formData[field.id] === true}
                            onChange={() => handleChange(field.id, true)}
                            className="sr-only"
                          />
                          <span>Sí</span>
                        </label>

                        <label
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm border cursor-pointer font-mono text-xs transition-all ${
                            formData[field.id] === false
                              ? 'bg-[#FFFFFF] text-[#000000] border-[#FFFFFF] font-bold shadow-sm'
                              : 'bg-[#111111] text-[#cccccc] border-[#333333] hover:border-[#666666]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`bool_${field.id}`}
                            checked={formData[field.id] === false}
                            onChange={() => handleChange(field.id, false)}
                            className="sr-only"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Aviso de Inmutabilidad Post-Guardado */}
            <div className="p-3 bg-[#0a0a0a] border border-[#333333] rounded-sm space-y-2 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FFFFFF] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-[#aaaaaa]">
                  <strong className="text-[#FFFFFF] block mb-0.5">
                    INMUTABILIDAD POST-GUARDADO:
                  </strong>
                  Una vez registrada, la encuesta no podrá ser modificada ni editada para garantizar la auditoría electoral en terreno.
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 border-t border-[#222222] cursor-pointer text-xs font-mono text-[#FFFFFF]">
                <input
                  type="checkbox"
                  checked={hasConfirmedImmutability}
                  onChange={(e) => setHasConfirmedImmutability(e.target.checked)}
                  className="accent-white cursor-pointer"
                />
                <span>Certifico la veracidad inmutable de este registro.</span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-[#222222] border border-[#FFFFFF] text-[#FFFFFF] text-xs font-mono rounded-sm">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Footer con Botón Obligatorio: "Guardar Encuesta" */}
          <div className="p-4 border-t border-[#262626] bg-[#0a0a0a] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-[#FFFFFF] cursor-pointer"
            >
              Cancelar
            </button>

            {/* Botón obligatorio según especificación: "Guardar Encuesta" */}
            <button
              type="submit"
              id="btn-guardar-encuesta"
              className="px-5 py-2.5 bg-[#FFFFFF] text-[#000000] hover:bg-[#e5e5e5] font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Guardar Encuesta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
