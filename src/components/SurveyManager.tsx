import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Palette, 
  Sparkles, 
  MapPin, 
  Check, 
  RotateCcw,
  Layers
} from 'lucide-react';
import { Survey, SurveyOption } from '../types/voxpin';

interface SurveyManagerProps {
  surveys: Survey[];
  activeSurvey: Survey;
  setActiveSurvey: (survey: Survey) => void;
  onUpdateSurvey: (updatedSurvey: Survey) => void;
  onCreateNewSurvey: (newSurvey: Survey) => void;
}

const PRESET_COLORS = [
  '#00d2b5', // Cyan / Turquesa (Tiene bigote)
  '#f59e0b', // Naranja / Ámbar (Tiene medio bigote)
  '#ef4444', // Rojo / Coral (No tiene bigote)
  '#007afc', // Signal Blue
  '#228a56', // Map Green
  '#a855f7', // Violet
  '#ec4899', // Pink
  '#8b96aa', // Ash Gray
];

export const SurveyManager: React.FC<SurveyManagerProps> = ({
  surveys,
  activeSurvey,
  setActiveSurvey,
  onUpdateSurvey,
  onCreateNewSurvey,
}) => {
  const [editingSurvey, setEditingSurvey] = useState<Survey>(activeSurvey);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync editing survey if active survey changes outside
  React.useEffect(() => {
    setEditingSurvey(activeSurvey);
  }, [activeSurvey.id]);

  const handleOptionTextChange = (optionId: string, newText: string) => {
    setEditingSurvey((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.id === optionId ? { ...opt, text: newText } : opt)),
    }));
  };

  const handleOptionColorChange = (optionId: string, newColor: string) => {
    setEditingSurvey((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.id === optionId ? { ...opt, color: newColor } : opt)),
    }));
  };

  const handleAddOption = () => {
    const newId = `opt-${Date.now()}`;
    const nextColor = PRESET_COLORS[editingSurvey.options.length % PRESET_COLORS.length];
    const newOption: SurveyOption = {
      id: newId,
      text: `Nueva opción ${editingSurvey.options.length + 1}`,
      color: nextColor,
      count: 0,
      percentage: 0,
    };
    setEditingSurvey((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }));
  };

  const handleRemoveOption = (optionId: string) => {
    if (editingSurvey.options.length <= 2) {
      alert('Una encuesta debe tener al menos dos opciones de respuesta.');
      return;
    }
    setEditingSurvey((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== optionId),
    }));
  };

  const handleSaveAndApply = () => {
    onUpdateSurvey(editingSurvey);
    setActiveSurvey(editingSurvey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreateFresh = () => {
    const newSurvey: Survey = {
      id: `survey-${Date.now()}`,
      title: 'Nueva Encuesta Personalizada',
      question: '¿Cuál es su preferencia principal?',
      targetArea: 'Zona Metropolitana',
      category: 'mercado',
      totalResponses: 0,
      options: [
        { id: `opt-a-${Date.now()}`, text: 'Opción A (Favorable)', color: '#00d2b5', count: 0, percentage: 50 },
        { id: `opt-b-${Date.now()}`, text: 'Opción B (Desfavorable)', color: '#ef4444', count: 0, percentage: 50 },
      ],
    };
    onCreateNewSurvey(newSurvey);
    setEditingSurvey(newSurvey);
    setActiveSurvey(newSurvey);
  };

  return (
    <div className="max-w-[1344px] mx-auto px-4 sm:px-6 py-8">
      
      {/* Eyebrow & Headline matching DESIGN.md Cera Pro specs */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0062ca]/20 text-[#007afc] border border-[#0062ca]/40 text-xs font-semibold tracking-wider uppercase mb-2">
          CADA CLIENTE DEFINE SUS OPCIONES · MÓDULO 2
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Personalización dinámica de encuestas
        </h1>
        <p className="text-sm sm:text-base text-[#a0aaba] max-w-3xl mt-2 leading-relaxed">
          El sistema no se limita a respuestas estáticas como «Voy a votar» o «No voy a votar». El cliente crea sus propias opciones según su necesidad, y el pin de cada persona en el mapa guarda automáticamente su respuesta individual.
        </p>
      </div>

      {/* Survey Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#15171b] border border-[#1c1f24] mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#8b96aa] uppercase tracking-wide mr-2">
            Encuesta Activa:
          </span>
          {surveys.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSurvey(s);
                setEditingSurvey(s);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeSurvey.id === s.id
                  ? 'bg-[#007afc] text-white shadow-lg shadow-[#007afc]/20'
                  : 'bg-[#1c1f24] text-[#a0aaba] hover:text-white border border-[#23262d]'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        <button
          onClick={handleCreateFresh}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1c1f24] text-white hover:bg-[#23262d] border border-[#333943] text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#007afc]" />
          <span>+ Crear Nueva Encuesta</span>
        </button>
      </div>

      {/* Main Grid: Left = PDF Configurator, Right = Interactive Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): The Exact Configurator from Page 4 */}
        <div className="lg:col-span-7 bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 sm:p-8 shadow-2xl relative">
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00d2b5]">
              CONFIGURADOR DE ENCUESTA
            </span>
            <span className="text-xs text-[#8b96aa] font-medium">
              ID: {editingSurvey.id}
            </span>
          </div>

          {/* Form fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] uppercase tracking-wider mb-1">
                Contexto / Territorio de Estudio:
              </label>
              <input
                type="text"
                value={editingSurvey.title}
                onChange={(e) => setEditingSurvey({ ...editingSurvey, title: e.target.value })}
                className="w-full bg-[#1c1f24] text-white text-sm px-4 py-2.5 rounded-xl border border-[#23262d] focus:outline-none focus:border-[#007afc]"
                placeholder="Ejemplo: Estudio en la localidad de Kennedy (Bogotá)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] uppercase tracking-wider mb-1">
                Pregunta Principal del Encuestador:
              </label>
              <input
                type="text"
                value={editingSurvey.question}
                onChange={(e) => setEditingSurvey({ ...editingSurvey, question: e.target.value })}
                className="w-full bg-[#1c1f24] text-white text-base font-medium px-4 py-2.5 rounded-xl border border-[#23262d] focus:outline-none focus:border-[#007afc]"
                placeholder="Pregunta: ¿cuánta gente tiene bigote?"
              />
            </div>
          </div>

          {/* Dynamic Options List with colors (Matching Page 4 buttons) */}
          <div className="space-y-3 mb-6">
            <label className="block text-xs font-semibold text-[#8b96aa] uppercase tracking-wider">
              Opciones de Respuesta y Color de Pines:
            </label>

            {editingSurvey.options.map((option, index) => (
              <div
                key={option.id}
                className="group relative rounded-2xl p-4 transition-all border border-transparent hover:border-[#333943] flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{
                  backgroundColor: `${option.color}15`,
                  borderLeft: `6px solid ${option.color}`,
                }}
              >
                {/* Number & Input */}
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md"
                    style={{ backgroundColor: option.color }}
                  >
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    className="w-full bg-[#15171b]/80 text-white font-semibold text-sm px-3.5 py-2 rounded-xl border border-[#23262d] focus:outline-none focus:border-white"
                  />
                </div>

                {/* Color swatches & delete */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="flex items-center gap-1 bg-[#15171b] p-1 rounded-xl border border-[#23262d]">
                    {PRESET_COLORS.slice(0, 5).map((clr) => (
                      <button
                        key={clr}
                        type="button"
                        onClick={() => handleOptionColorChange(option.id, clr)}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          option.color === clr ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: clr }}
                        title={clr}
                      />
                    ))}
                    {/* Native color picker */}
                    <input
                      type="color"
                      value={option.color}
                      onChange={(e) => handleOptionColorChange(option.id, e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      title="Color personalizado"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveOption(option.id)}
                    className="p-2 text-[#8b96aa] hover:text-[#ef4444] rounded-lg transition-colors"
                    title="Eliminar opción"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Option Button (Page 4) */}
            <button
              onClick={handleAddOption}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-[#23262d] hover:border-[#007afc] text-xs font-semibold text-[#8b96aa] hover:text-white flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <Plus className="w-4 h-4 text-[#007afc]" />
              <span>+ Agregar otra opción</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1c1f24]">
            <span className="text-xs text-[#8b96aa]">
              {editingSurvey.options.length} opciones configuradas
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingSurvey(activeSurvey)}
                className="px-4 py-2 rounded-full text-xs text-[#8b96aa] hover:text-white transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={handleSaveAndApply}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#007afc] hover:bg-[#0062ca] text-white text-xs font-bold shadow-lg shadow-[#007afc]/25 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>¡Aplicado al Mapa!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Guardar y Aplicar a Pines</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): "EL PIN GUARDA LA RESPUESTA" Map Preview Illustration (Page 4) */}
        <div className="lg:col-span-5 bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#f59e0b]">
                EL PIN GUARDA LA RESPUESTA
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#228a56]/20 text-[#228a56]">
                En vivo
              </span>
            </div>

            {/* Response Color Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {editingSurvey.options.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1f24] border border-[#23262d] text-xs font-medium text-white"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                  <span>{opt.text}</span>
                </div>
              ))}
            </div>

            {/* Stylized Map Canvas Simulation as shown in Page 4 */}
            <div className="relative w-full h-80 rounded-2xl bg-[#0e1012] border border-[#1c1f24] overflow-hidden p-4">
              
              {/* Grid Lines simulating spatial polygons */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                <div className="border-r border-b border-[#333943]"></div>
                <div className="border-r border-b border-[#333943]"></div>
                <div className="border-b border-[#333943]"></div>
                <div className="border-r border-b border-[#333943]"></div>
                <div className="border-r border-b border-[#333943]"></div>
                <div className="border-b border-[#333943]"></div>
                <div className="border-r border-[#333943]"></div>
                <div className="border-r border-[#333943]"></div>
                <div></div>
              </div>

              {/* Polygons and Zone tags matching Page 4 illustration */}
              <span className="absolute top-4 left-4 text-[10px] font-bold text-[#566171] uppercase tracking-wider">
                Barrio Norte
              </span>
              <span className="absolute top-4 right-20 text-[10px] font-bold text-[#566171] uppercase tracking-wider">
                Conjunto Sur
              </span>
              <span className="absolute top-4 right-4 text-[10px] font-bold text-[#566171] uppercase tracking-wider">
                Localidad C
              </span>
              <span className="absolute bottom-4 left-4 text-[10px] font-bold text-[#566171] uppercase tracking-wider">
                Barrio Oeste
              </span>
              <span className="absolute bottom-4 right-8 text-[10px] font-bold text-[#566171] uppercase tracking-wider">
                Zona Centro
              </span>

              {/* Simulated Map Pins with current option colors */}
              <div className="absolute top-16 left-16 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: editingSurvey.options[0]?.color || '#00d2b5' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="w-1 h-2 rounded-b" style={{ backgroundColor: editingSurvey.options[0]?.color || '#00d2b5' }}></div>
              </div>

              <div className="absolute top-28 right-24 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: editingSurvey.options[2]?.color || '#ef4444' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="w-1 h-2 rounded-b" style={{ backgroundColor: editingSurvey.options[2]?.color || '#ef4444' }}></div>
              </div>

              <div className="absolute top-20 right-48 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: editingSurvey.options[0]?.color || '#00d2b5' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="w-1 h-2 rounded-b" style={{ backgroundColor: editingSurvey.options[0]?.color || '#00d2b5' }}></div>
              </div>

              <div className="absolute bottom-20 left-28 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: editingSurvey.options[1]?.color || '#f59e0b' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="w-1 h-2 rounded-b" style={{ backgroundColor: editingSurvey.options[1]?.color || '#f59e0b' }}></div>
              </div>

              <div className="absolute bottom-16 right-20 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: editingSurvey.options[2]?.color || '#ef4444' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="w-1 h-2 rounded-b" style={{ backgroundColor: editingSurvey.options[2]?.color || '#ef4444' }}></div>
              </div>

              <div className="absolute bottom-24 right-44 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: editingSurvey.options[1]?.color || '#f59e0b' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="w-1 h-2 rounded-b" style={{ backgroundColor: editingSurvey.options[1]?.color || '#f59e0b' }}></div>
              </div>

              <div className="absolute top-36 left-48 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: editingSurvey.options[0]?.color || '#00d2b5' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="w-1 h-2 rounded-b" style={{ backgroundColor: editingSurvey.options[0]?.color || '#00d2b5' }}></div>
              </div>

              {/* Watermark quote */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="text-7xl font-black text-white">Voxpin</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8b96aa] italic text-center mt-3">
              Ilustración conceptual: los colores representan la opción elegida por cada persona.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-[#1c1f24] border border-[#23262d] text-xs text-[#a0aaba]">
            <p className="font-semibold text-white mb-1">Impacto espacial:</p>
            Al cambiar o agregar opciones de respuesta, cada nuevo registro en campo asignará automáticamente el pin cartográfico con el color seleccionado para alimentar los mapas de calor y filtros demográficos.
          </div>

        </div>

      </div>

    </div>
  );
};
