import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Eye,
  MapPin,
  Calendar,
  User,
  FileText,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { SurveyRecord, FormField } from '../../types/votality';

interface VotalityRespondentsModalProps {
  records: SurveyRecord[];
  formFields?: FormField[];
  onClose: () => void;
  onLocateOnMap?: (record: SurveyRecord) => void;
  onUpdateRecord?: (record: SurveyRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

export const VotalityRespondentsModal: React.FC<VotalityRespondentsModalProps> = ({
  records,
  formFields = [],
  onClose,
  onLocateOnMap,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SurveyRecord | null>(null);

  const getQuestionLabel = (key: string, rec?: SurveyRecord | null) => {
    const f = formFields.find((field) => field.id === key);
    if (f?.label) return f.label;
    if (rec?.questionLabels?.[key]) return rec.questionLabels[key];
    if ((rec?.answers?.__question_labels as any)?.[key]) return (rec?.answers?.__question_labels as any)[key];
    if (key.startsWith('custom_')) return 'Pregunta Personalizada';
    return key.replace(/_/g, ' ');
  };

  const isInternalKey = (k: string) => {
    return (
      k === 'nombre' ||
      k === 'primer_nombre' ||
      k === 'segundo_nombre' ||
      k === 'primer_apellido' ||
      k === 'segundo_apellido' ||
      k === 'alias' ||
      k === 'direccion' ||
      k === 'direccion_dian' ||
      k === 'nomenclatura_dian' ||
      k === 'direccion_normalizada' ||
      k === 'departamento' ||
      k === 'municipio' ||
      k === 'barrio' ||
      k === 'complemento' ||
      k === 'detalle' ||
      k === 'fuente_ubicacion' ||
      k === 'nivel_precision' ||
      k === '__question_labels'
    );
  };

  // Estados para Edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    address: string;
    censusSector: string;
    answers: Record<string, any>;
  }>({
    name: '',
    address: '',
    censusSector: '',
    answers: {},
  });
  const [editSuccessMsg, setEditSuccessMsg] = useState(false);

  // Estados para Modal de Advertencia de Eliminación con cuenta regresiva de 5 segundos
  const [recordToDelete, setRecordToDelete] = useState<SurveyRecord | null>(null);
  const [countdown, setCountdown] = useState<number>(5);

  // Sincronizar formulario de edición cuando se selecciona o cambia un registro
  useEffect(() => {
    if (selectedRecord) {
      setEditForm({
        name: selectedRecord.name || '',
        address: selectedRecord.address || '',
        censusSector: selectedRecord.censusSector || '',
        answers: { ...(selectedRecord.answers || {}) },
      });
      setIsEditing(false);
      setEditSuccessMsg(false);
    }
  }, [selectedRecord]);

  // Manejador del temporizador de 5 segundos para desbloquear el botón de eliminar
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (recordToDelete) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(5);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [recordToDelete]);

  // Guardar cambios de edición
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !onUpdateRecord) return;

    const trimmedName = editForm.name.trim();
    const trimmedAddress = editForm.address.trim();

    if (!trimmedName || !trimmedAddress) return;

    const updated: SurveyRecord = {
      ...selectedRecord,
      name: trimmedName,
      address: trimmedAddress,
      censusSector: editForm.censusSector.trim() || selectedRecord.censusSector,
      answers: {
        ...selectedRecord.answers,
        ...editForm.answers,
        nombre: trimmedName,
        direccion: trimmedAddress,
      },
    };

    onUpdateRecord(updated);
    setSelectedRecord(updated);
    setIsEditing(false);
    setEditSuccessMsg(true);
    setTimeout(() => setEditSuccessMsg(false), 3000);
  };

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    if (!recordToDelete || countdown > 0 || !onDeleteRecord) return;
    const targetId = recordToDelete.id;
    onDeleteRecord(targetId);
    if (selectedRecord?.id === targetId) {
      setSelectedRecord(null);
      setIsEditing(false);
    }
    setRecordToDelete(null);
  };

  // Alphabetical sort (A-Z) by respondent name
  const sortedRecords = [...records].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

  // Filter by name and address
  const filteredRecords = sortedRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.censusSector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md select-none font-sans">
      <div className="bg-[#000000] border border-[#FFFFFF] w-full max-w-5xl h-[92vh] rounded-sm shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header with Back Button */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#333333] hover:border-[#FFFFFF] font-mono text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Mapa</span>
            </button>
            <div className="hidden sm:block h-4 w-[1px] bg-[#333333]" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
                REGISTRO ALFABÉTICO (A-Z)
              </div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Padrón de Encuestados</h2>
            </div>
          </div>

          <div className="font-mono text-xs text-[#888888]">
            Total registros: <span className="text-[#FFFFFF] font-bold">{records.length}</span>
          </div>
        </div>

        {/* Filter bar by Name and Address */}
        <div className="p-3 bg-[#0a0a0a] border-b border-[#222222] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar específicamente por Nombre del encuestado, Dirección o Sector..."
              className="w-full bg-[#141414] text-[#FFFFFF] text-xs font-mono pl-9 pr-4 py-2 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-[#777777] hover:text-[#FFFFFF] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#777777] shrink-0 hidden md:block">
            {filteredRecords.length} resultado(s)
          </div>
        </div>

        {/* Table & Details Split Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Table View */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-[#666666] font-mono text-xs">
                {records.length === 0
                  ? 'No hay encuestas registradas en el sistema. Los encuestadores las registrarán en terreno.'
                  : 'No se encontraron registros que coincidan con la búsqueda.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#111111] border-b border-[#262626] font-mono text-[10px] uppercase text-[#888888] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Nombre (A-Z)</th>
                    <th className="py-2.5 px-4">Dirección</th>
                    <th className="py-2.5 px-4 hidden sm:table-cell">Sector Censal</th>
                    <th className="py-2.5 px-4 hidden md:table-cell">Encuestador</th>
                    <th className="py-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filteredRecords.map((item, idx) => {
                    const isSelected = selectedRecord?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setSelectedRecord(item);
                          setIsEditing(false);
                        }}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a1a1a] text-[#ffffff] border-l-2 border-l-[#ffffff]'
                            : 'hover:bg-[#111111] text-[#cccccc]'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-[10px] text-[#777777]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-[#FFFFFF]">
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">{item.address}</td>
                        <td className="py-3 px-4 hidden sm:table-cell font-mono text-[11px] opacity-80">
                          {item.censusSector}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] opacity-70">
                          {item.surveyorName}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                if (onLocateOnMap) {
                                  onLocateOnMap(item);
                                  onClose();
                                }
                              }}
                              className="p-1.5 rounded-sm border bg-[#1a1a1a] hover:bg-[#ffffff] text-[#888888] hover:text-[#000000] border-[#333333] hover:border-[#ffffff] transition-all cursor-pointer"
                              title="Centrar y viajar a este PIN en el mapa"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(item);
                                setIsEditing(false);
                              }}
                              className={`p-1.5 rounded-sm border transition-all ${
                                isSelected && !isEditing
                                  ? 'bg-[#ffffff] text-[#000000] border-[#ffffff]'
                                  : 'bg-[#1a1a1a] text-[#888888] border-[#333333] hover:text-[#FFFFFF]'
                              }`}
                              title="Ver detalle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(item);
                                setIsEditing(true);
                              }}
                              className="p-1.5 rounded-sm border bg-[#1a1a1a] hover:bg-[#252525] text-[#888888] hover:text-[#FFFFFF] border-[#333333] transition-all cursor-pointer"
                              title="Editar información"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setRecordToDelete(item)}
                              className="p-1.5 rounded-sm border bg-[#1a1a1a] hover:bg-red-950/40 text-red-400 hover:text-red-300 border-red-900/40 hover:border-red-600 transition-all cursor-pointer"
                              title="Eliminar de la base de datos y mapa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Detail / Edit Drawer */}
          {selectedRecord && (
            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-[#262626] bg-[#0a0a0a] p-5 overflow-y-auto flex flex-col justify-between text-xs font-sans animate-in slide-in-from-right-4 duration-200">
              <div className="space-y-4">
                {/* Header of Drawer */}
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#888888]">
                      {isEditing ? 'Modificar Registro' : 'Detalle de Encuesta'}
                    </div>
                    <div className="text-base font-bold text-[#FFFFFF] mt-0.5">
                      {isEditing ? editForm.name || 'Sin nombre' : selectedRecord.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1a1a1a] rounded-sm transition-all cursor-pointer"
                        title="Editar información"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setRecordToDelete(selectedRecord)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-sm transition-all cursor-pointer"
                      title="Eliminar encuesta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecord(null);
                        setIsEditing(false);
                      }}
                      className="p-1.5 text-[#777777] hover:text-[#FFFFFF] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {editSuccessMsg && (
                  <div className="p-2.5 bg-[#141414] border border-[#ffffff] text-[#ffffff] font-mono text-xs rounded-sm flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span>Cambios guardados en base de datos y encuesta.</span>
                  </div>
                )}

                {/* Vista Modo Edición */}
                {isEditing ? (
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="p-3 bg-[#111111] border border-[#262626] rounded-sm space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#888888] mb-1">
                          Nombre del Encuestado *
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="w-full bg-[#161616] border border-[#333333] focus:border-[#FFFFFF] text-[#FFFFFF] px-2.5 py-1.5 rounded-sm font-sans text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#888888] mb-1">
                          Dirección Domiciliaria *
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.address}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, address: e.target.value }))
                          }
                          className="w-full bg-[#161616] border border-[#333333] focus:border-[#FFFFFF] text-[#FFFFFF] px-2.5 py-1.5 rounded-sm font-sans text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#888888] mb-1">
                          Sector Censal / Barrio
                        </label>
                        <input
                          type="text"
                          value={editForm.censusSector}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, censusSector: e.target.value }))
                          }
                          className="w-full bg-[#161616] border border-[#333333] focus:border-[#FFFFFF] text-[#FFFFFF] px-2.5 py-1.5 rounded-sm font-sans text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Edición de Respuestas de la Encuesta */}
                    <div className="space-y-2">
                      <div className="font-mono text-[10px] uppercase text-[#888888]">
                        Respuestas del Cuestionario
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {Object.entries(editForm.answers)
                          .filter(([k]) => !isInternalKey(k))
                          .map(([key, val]) => (
                            <div
                              key={key}
                              className="p-2.5 bg-[#141414] border border-[#262626] rounded-sm space-y-1"
                            >
                              <label className="text-[10px] font-mono text-[#00FF85] font-bold uppercase block">
                                {getQuestionLabel(key, selectedRecord)}
                              </label>
                              {typeof val === 'boolean' ? (
                                <select
                                  value={val ? 'true' : 'false'}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      answers: {
                                        ...prev.answers,
                                        [key]: e.target.value === 'true',
                                      },
                                    }))
                                  }
                                  className="w-full bg-[#181818] border border-[#333333] text-[#FFFFFF] px-2 py-1 rounded-sm text-xs focus:outline-none"
                                >
                                  <option value="true">Sí / Afirmativo</option>
                                  <option value="false">No / Negativo</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={String(val ?? '')}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      answers: {
                                        ...prev.answers,
                                        [key]: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full bg-[#181818] border border-[#333333] text-[#FFFFFF] px-2 py-1 rounded-sm text-xs focus:outline-none"
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#222222]">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2 px-3 bg-[#111111] hover:bg-[#222222] text-[#cccccc] font-mono text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 px-3 bg-[#FFFFFF] hover:bg-[#e5e5e5] text-[#000000] font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Modo Vista de Detalle Normal */
                  <>
                    {/* Spatial Info */}
                    <div className="p-3 bg-[#111111] border border-[#222222] rounded-sm space-y-2">
                      <div className="flex items-center gap-2 text-[#cccccc] font-mono text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0" />
                        <span>{selectedRecord.address}</span>
                      </div>
                      <div className="font-mono text-[10px] text-[#777777]">
                        Sector: <span className="text-[#cccccc]">{selectedRecord.censusSector}</span>
                      </div>
                    </div>

                    {/* Captured Answers */}
                    <div className="space-y-2">
                      <div className="font-mono text-[10px] uppercase text-[#888888]">
                        Preguntas y Respuestas Registradas
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {Object.entries(selectedRecord.answers)
                          .filter(([key]) => !isInternalKey(key))
                          .map(([key, val]) => (
                            <div
                              key={key}
                              className="p-2.5 bg-[#141414] border border-[#262626] rounded-sm space-y-1"
                            >
                              <div className="text-[10px] font-mono text-[#00FF85] font-bold uppercase">
                                {getQuestionLabel(key, selectedRecord)}
                              </div>
                              <div className="text-xs font-semibold text-[#FFFFFF] mt-0.5">
                                {typeof val === 'boolean' ? (val ? 'Sí / Afirmativo' : 'No / Negativo') : String(val)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Surveyor & Metadata */}
                    <div className="pt-3 border-t border-[#222222] text-[10px] font-mono text-[#666666] space-y-1">
                      <div>Registrado por: {selectedRecord.surveyorName}</div>
                      <div>Fecha y hora: {new Date(selectedRecord.createdAt).toLocaleString()}</div>
                      <div>ID de Encuesta: {selectedRecord.id}</div>
                    </div>

                    {/* Acciones Rápidas en Footer de Drawer */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-2 px-3 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] border border-[#333333] hover:border-[#666666] font-mono text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Información</span>
                      </button>

                      {onLocateOnMap && (
                        <button
                          onClick={() => {
                            onLocateOnMap(selectedRecord);
                            onClose();
                          }}
                          className="w-full py-2.5 px-3 bg-[#FFFFFF] hover:bg-[#e5e5e5] text-[#000000] font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Centrar en Mapa</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Advertencia y Confirmación de Eliminación con Cuenta Regresiva de 5s */}
      {recordToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border-2 border-red-600/80 w-full max-w-md rounded-sm p-5 shadow-[0_0_50px_rgba(220,38,38,0.25)] space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-950/60 border border-red-600/50 rounded-sm shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#FFFFFF]">
                  ¿Confirmar eliminación definitiva?
                </h3>
                <p className="text-xs text-[#aaaaaa] leading-relaxed">
                  Esta acción borrará al encuestado{' '}
                  <strong className="text-[#FFFFFF]">"{recordToDelete.name}"</strong> tanto de la{' '}
                  <strong className="text-red-400">base de datos</strong> como de la{' '}
                  <strong className="text-red-400">encuesta y mapa espacial</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-sm text-[11px] font-mono text-red-300">
              ⚠️ <strong>ADVERTENCIA:</strong> Esta información no se puede devolver ni recuperar una vez eliminada.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 bg-[#141414] hover:bg-[#222222] text-[#cccccc] font-mono text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={countdown > 0}
                onClick={handleConfirmDelete}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center gap-2 transition-all shadow-md ${
                  countdown > 0
                    ? 'bg-red-950/40 text-red-500/50 border border-red-900/30 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white border border-red-500 cursor-pointer animate-pulse'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {countdown > 0
                    ? `Esperar ${countdown}s para borrar`
                    : 'Sí, Borrar Definitivamente'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

