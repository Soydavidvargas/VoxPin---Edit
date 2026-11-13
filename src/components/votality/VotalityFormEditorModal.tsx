import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Lock, AlertCircle, Save } from 'lucide-react';
import { FormField, UserRole } from '../../types/votality';

interface VotalityFormEditorModalProps {
  fields: FormField[];
  onSaveFields: (fields: FormField[]) => void;
  onClose: () => void;
  userRole: UserRole;
}

export const VotalityFormEditorModal: React.FC<VotalityFormEditorModalProps> = ({
  fields,
  onSaveFields,
  onClose,
  userRole,
}) => {
  const [localFields, setLocalFields] = useState<FormField[]>(() =>
    JSON.parse(JSON.stringify(fields))
  );
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<FormField['type']>('text');
  const [newOptionsText, setNewOptionsText] = useState('');
  const [newRequired, setNewRequired] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isReadOnly = userRole === 'encuestador';

  // Añadir nuevo campo personalizado
  const handleAddField = () => {
    setValidationError(null);
    const trimmedLabel = newLabel.trim();
    if (!trimmedLabel) {
      setValidationError('Ingresa el nombre o enunciado de la pregunta.');
      return;
    }

    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    let options: string[] | undefined = undefined;

    if (newType === 'select') {
      options = newOptionsText
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (!options || options.length === 0) {
        options = ['Opción A', 'Opción B'];
      }
    }

    const newField: FormField = {
      id,
      label: trimmedLabel,
      type: newType,
      options,
      required: newRequired,
      isDefault: false,
    };

    setLocalFields([...localFields, newField]);
    setNewLabel('');
    setNewOptionsText('');
    setNewRequired(false);
  };

  // Eliminar únicamente campos creados por el usuario (no los base)
  const handleDeleteField = (id: string) => {
    // Protección estricta: los campos base son inmutables
    if (id === 'nombre' || id === 'direccion') return;
    setLocalFields(localFields.filter((f) => f.id !== id));
  };

  // Guardar esquema en memoria / estado persistente y sincronizar en tiempo real
  const handleSave = () => {
    try {
      localStorage.setItem('votality_active_form_fields', JSON.stringify(localFields));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('votality_form_schema_channel');
        bc.postMessage({ type: 'SCHEMA_UPDATED', fields: localFields });
        bc.close();
      }
    } catch (err) {
      console.error('Error al sincronizar esquema:', err);
    }
    onSaveFields(localFields);
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div
      id="modal-editar-formulario"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none font-sans"
    >
      <div className="bg-[#000000] border border-[#FFFFFF] w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
              {isReadOnly ? 'MODO PREPARACIÓN DE CAPTURA' : 'CONFIGURADOR DE ESQUEMA DINÁMICO'}
            </div>
            <h2 className="text-base font-bold text-[#FFFFFF] mt-0.5">
              {isReadOnly
                ? 'Esquema de Formulario de Terreno'
                : 'Editar Formulario de Encuesta'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1a1a1a] rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {isReadOnly ? (
            <div className="p-3 bg-[#111111] border border-[#333333] rounded-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#FFFFFF] shrink-0 mt-0.5" />
              <div className="text-[#cccccc] text-[11px] leading-relaxed">
                Como encuestador, visualizas la plantilla configurada por el Administrador. Los campos{' '}
                <strong className="text-[#FFFFFF]">Nombres y Apellidos</strong> (Primer Nombre y Primer Apellido obligatorios) y{' '}
                <strong className="text-[#FFFFFF]">Dirección</strong> son requeridos para el registro en campo.
              </div>
            </div>
          ) : (
            <div className="text-[#aaaaaa] font-mono text-[11px] leading-relaxed">
              El formulario base contiene exclusivamente los dos campos obligatorios predeterminados (Nombre y Dirección). Puedes añadir preguntas personalizadas para tu campaña.
            </div>
          )}

          {/* Active Fields List */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#888888] flex items-center justify-between">
              <span>Campos del Esquema Activo ({localFields.length})</span>
              <span className="text-[#555555]">
                {localFields.filter((f) => f.isDefault || f.id === 'nombre' || f.id === 'direccion').length} Base +{' '}
                {localFields.filter((f) => !f.isDefault && f.id !== 'nombre' && f.id !== 'direccion').length} Personalizados
              </span>
            </div>

            <div className="space-y-2">
              {localFields.map((field, idx) => {
                const isBase = field.isDefault || field.id === 'nombre' || field.id === 'direccion';
                return (
                  <div
                    key={field.id}
                    className="p-3 bg-[#0d0d0d] border border-[#222222] rounded-sm flex items-center justify-between gap-3 hover:border-[#333333] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-[#666666] w-5">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-[#FFFFFF] flex items-center gap-2">
                          {field.label}
                          {isBase ? (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-[#1a1a1a] text-[#ffffff] border border-[#444444] rounded-xs flex items-center gap-1 font-bold">
                              <Lock className="w-2.5 h-2.5" />
                              Fijo / Inmutable
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-[#141414] text-[#aaaaaa] border border-[#2e2e2e] rounded-xs">
                              Personalizado
                            </span>
                          )}
                          {field.required && (
                            <span className="text-[9px] font-mono text-[#aaaaaa] italic">
                              (Requerido)
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-[#777777] mt-0.5">
                          Tipo:{' '}
                          <span className="text-[#cccccc]">
                            {field.type === 'text'
                              ? 'Texto'
                              : field.type === 'number'
                              ? 'Número'
                              : field.type === 'select'
                              ? 'Selección'
                              : field.type === 'boolean'
                              ? 'Booleano (Sí / No)'
                              : field.type}
                          </span>
                          {field.options && ` • Opciones: [${field.options.join(', ')}]`}
                        </div>
                      </div>
                    </div>

                    {/* Solo se pueden borrar campos creados por el usuario */}
                    {!isReadOnly && !isBase && (
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 text-[#777777] hover:text-[#FFFFFF] hover:bg-[#1a1a1a] rounded-sm transition-colors cursor-pointer"
                        title="Eliminar campo personalizado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario para Añadir Pregunta Personalizada (Admin / Free) */}
          {!isReadOnly && (
            <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-sm space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Añadir Nueva Pregunta Personalizada
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] text-[#888888] mb-1">
                    Nombre de la pregunta *
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ej: Prioridad Barrial / Necesidad Comunitaria"
                    className="w-full bg-[#141414] text-[#FFFFFF] text-xs p-2 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#888888] mb-1">
                    Tipo de campo
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FormField['type'])}
                    className="w-full bg-[#141414] text-[#FFFFFF] text-xs p-2 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none font-mono"
                  >
                    <option value="text">Texto (Abierta)</option>
                    <option value="number">Número</option>
                    <option value="select">Selección (Opciones)</option>
                    <option value="boolean">Booleano (Sí / No)</option>
                  </select>
                </div>
              </div>

              {newType === 'select' && (
                <div>
                  <label className="block font-mono text-[10px] text-[#888888] mb-1">
                    Opciones de selección (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={newOptionsText}
                    onChange={(e) => setNewOptionsText(e.target.value)}
                    placeholder="Opción 1, Opción 2, Opción 3, Opción 4"
                    className="w-full bg-[#141414] text-[#FFFFFF] text-xs p-2 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none font-mono"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1a1a1a]">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-[11px] text-[#cccccc]">
                  <input
                    type="checkbox"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="accent-white"
                  />
                  <span>Respuesta obligatoria</span>
                </label>

                {/* Botón obligatorio según especificación: "+ Añadir Campo" */}
                <button
                  type="button"
                  id="btn-anadir-campo"
                  onClick={handleAddField}
                  className="px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded-sm transition-all border bg-[#FFFFFF] text-[#000000] border-[#FFFFFF] hover:bg-[#e5e5e5] font-bold cursor-pointer active:scale-95"
                >
                  + Añadir Campo
                </button>
              </div>

              {validationError && (
                <div className="p-2 bg-[#222222] border border-[#444444] text-[#FFFFFF] font-mono text-[11px] rounded-sm">
                  {validationError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con Botón Obligatorio: "Guardar Esquema" */}
        <div className="p-4 border-t border-[#262626] bg-[#0a0a0a] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-[#FFFFFF] cursor-pointer"
          >
            Cancelar
          </button>

          {!isReadOnly && (
            <button
              id="btn-guardar-esquema"
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#FFFFFF] text-[#000000] hover:bg-[#e5e5e5] font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              {hasSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Esquema Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Esquema</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
