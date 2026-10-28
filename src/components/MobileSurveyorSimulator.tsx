import React, { useState } from 'react';
import { 
  Smartphone, 
  MapPin, 
  Send, 
  Users, 
  Compass, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  X,
  Radio,
  Navigation
} from 'lucide-react';
import { Survey, SurveyPin, FamilyMember } from '../types/voxpin';

interface MobileSurveyorSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  activeSurvey: Survey;
  onAddPin: (newPin: SurveyPin) => void;
}

export const MobileSurveyorSimulator: React.FC<MobileSurveyorSimulatorProps> = ({
  isOpen,
  onClose,
  activeSurvey,
  onAddPin,
}) => {
  if (!isOpen) return null;

  // Form State matching Page 3 capture fields
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Carrera 78K # 38 Sur');
  const [neighborhood, setNeighborhood] = useState('Timiza');
  const [locality, setLocality] = useState('Kennedy');
  const [locationType, setLocationType] = useState<'exact' | 'neighborhood_only'>('exact');
  const [selectedOptionId, setSelectedOptionId] = useState<string>(activeSurvey.options[0]?.id || '');
  const [lat, setLat] = useState<number>(4.6210);
  const [lng, setLng] = useState<number>(-74.1530);

  // Agrupación Familiar (Clustering) support
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddFamilyMember, setShowAddFamilyMember] = useState(false);
  const [famName, setFamName] = useState('');
  const [famAge, setFamAge] = useState<number | ''>('');
  const [famCedula, setFamCedula] = useState('');
  const [famPhone, setFamPhone] = useState('');
  const [famRel, setFamRel] = useState('Familiar');
  const [famOptionId, setFamOptionId] = useState(activeSurvey.options[0]?.id || '');

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Get current device GPS if allowed or simulate Bogotá location
  const handleGetGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          // Fallback to random spot in Kennedy
          setLat(4.620 + (Math.random() - 0.5) * 0.02);
          setLng(-74.150 + (Math.random() - 0.5) * 0.02);
        }
      );
    } else {
      setLat(4.620 + (Math.random() - 0.5) * 0.02);
      setLng(-74.150 + (Math.random() - 0.5) * 0.02);
    }
  };

  const handleAddFamilyMemberToList = () => {
    if (!famName || !famAge) {
      alert('Por favor indica nombre y edad del familiar');
      return;
    }
    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: famName,
      age: Number(famAge),
      cedula: famCedula || 'Pendiente',
      phone: famPhone || phone,
      relationship: famRel,
      answerOptionId: famOptionId,
    };
    setFamilyMembers((prev) => [...prev, newMember]);
    setFamName('');
    setFamAge('');
    setFamCedula('');
    setShowAddFamilyMember(false);
  };

  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age) {
      alert('Ingresa el nombre y la edad del encuestado principal');
      return;
    }

    // Build the pin
    const newPin: SurveyPin = {
      id: `pin-mobile-${Date.now()}`,
      name,
      age: Number(age),
      cedula: cedula || '1.020.334.891',
      phone: phone || '+57 310 000 0000',
      address,
      neighborhood,
      locality,
      locationType,
      lat,
      lng,
      surveyId: activeSurvey.id,
      answerOptionId: selectedOptionId,
      surveyorName: 'Luis Alfonso (Encuestador Móvil)',
      surveyorId: 'enc-01',
      timestamp: 'Ahora mismo',
      familyMembers: familyMembers.length > 0 ? [
        {
          id: `head-${Date.now()}`,
          name,
          age: Number(age),
          cedula: cedula || '1.020.334.891',
          phone: phone || '+57 310 000 0000',
          relationship: 'Jefe de hogar',
          answerOptionId: selectedOptionId,
        },
        ...familyMembers,
      ] : undefined,
    };

    onAddPin(newPin);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setName('');
      setAge('');
      setCedula('');
      setPhone('');
      setFamilyMembers([]);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Phone Case Frame */}
      <div className="relative w-full max-w-sm bg-[#15171b] border-4 border-[#23262d] rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[780px] max-h-[92vh] animate-slide-up">
        
        {/* Phone Speaker Notch */}
        <div className="w-full bg-[#0e1012] pt-3 pb-2 px-6 flex items-center justify-between border-b border-[#1c1f24] shrink-0">
          <div className="text-[10px] text-[#8b96aa] font-mono">09:41</div>
          <div className="w-16 h-3 bg-[#1c1f24] rounded-full mx-auto" />
          <button onClick={onClose} className="text-[#8b96aa] hover:text-white text-xs">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* App Bar inside phone */}
        <div className="bg-[#15171b] px-4 py-2.5 border-b border-[#1c1f24] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#007afc] flex items-center justify-center text-white">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Voxpin Móvil</span>
              <span className="text-[9px] text-[#228a56] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#228a56] animate-pulse" />
                GPS Activo · Encuestador 01
              </span>
            </div>
          </div>
          <button
            onClick={handleGetGps}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#1c1f24] text-[#007afc] text-[10px] font-semibold hover:bg-[#23262d]"
            title="Sincronizar GPS actual"
          >
            <Navigation className="w-3 h-3" />
            <span>Fijar GPS</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {submittedSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#228a56]/20 border border-[#228a56] text-[#228a56] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">¡Encuesta Registrada!</h4>
              <p className="text-xs text-[#a0aaba]">
                El pin geolocalizado ha sido transmitido a la nube y ya aparece en el mapa y en el dashboard de estadísticas.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitSurvey} className="space-y-3.5">
              
              {/* Question Banner (Page 4) */}
              <div className="p-3 rounded-2xl bg-[#0e1012] border border-[#1c1f24]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#007afc] block mb-0.5">
                  Pregunta a realizar:
                </span>
                <p className="text-xs font-bold text-white leading-snug">
                  {activeSurvey.question}
                </p>
              </div>

              {/* Big touch options for question (Page 4 buttons) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8b96aa] uppercase tracking-wider block">
                  Respuesta del ciudadano:
                </label>
                {activeSurvey.options.map((opt, i) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-[#1c1f24] text-[#a0aaba] border border-[#23262d]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? opt.color : undefined,
                        borderColor: isSelected ? opt.color : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>

              {/* Lógica de Ubicación (Page 3: Dirección Exacta vs Solo el Barrio) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b96aa] uppercase tracking-wider block">
                  Lógica de Ubicación:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationType('exact')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      locationType === 'exact'
                        ? 'bg-[#007afc]/20 text-[#007afc] border-[#007afc]'
                        : 'bg-[#1c1f24] text-[#8b96aa] border-[#23262d]'
                    }`}
                  >
                    📍 Dirección Exacta
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('neighborhood_only')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      locationType === 'neighborhood_only'
                        ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]'
                        : 'bg-[#1c1f24] text-[#8b96aa] border-[#23262d]'
                    }`}
                  >
                    🏘️ Solo el Barrio
                  </button>
                </div>
              </div>

              {/* Citizen Details (Page 3: Nombre completo, Edad, Cédula, Teléfono) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8b96aa] uppercase tracking-wider block">
                  Datos del encuestado:
                </label>

                <input
                  type="text"
                  required
                  placeholder="Nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Edad"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Cédula"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Barrio (ej: Timiza)"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Dirección (ej: Calle 38 Sur # 78K-22)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                />
              </div>

              {/* Agrupación Familiar (Clustering) Section (Page 3) */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">
                    Agrupación Familiar ({familyMembers.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddFamilyMember(!showAddFamilyMember)}
                    className="text-[10px] font-semibold text-[#007afc] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Añadir familiar</span>
                  </button>
                </div>

                {familyMembers.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {familyMembers.map((m, idx) => (
                      <div key={m.id} className="p-2 rounded-xl bg-[#0e1012] border border-[#23262d] flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-white">{m.name}</span>
                          <span className="text-[#8b96aa] ml-1">({m.age} años · {m.relationship})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFamilyMembers(familyMembers.filter(x => x.id !== m.id))}
                          className="text-[#ef4444] p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-form to add family member */}
                {showAddFamilyMember && (
                  <div className="p-2.5 rounded-xl bg-[#0e1012] border border-[#f59e0b]/40 space-y-2 mb-2">
                    <span className="text-[10px] font-bold text-white block">Nuevo habitante en la misma casa:</span>
                    <input
                      type="text"
                      placeholder="Nombre del familiar"
                      value={famName}
                      onChange={(e) => setFamName(e.target.value)}
                      className="w-full bg-[#1c1f24] text-white text-[11px] px-2.5 py-1.5 rounded-lg border border-[#23262d]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Edad"
                        value={famAge}
                        onChange={(e) => setFamAge(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-[#1c1f24] text-white text-[11px] px-2.5 py-1.5 rounded-lg border border-[#23262d]"
                      />
                      <input
                        type="text"
                        placeholder="Parentesco (Hijo, Cónyuge...)"
                        value={famRel}
                        onChange={(e) => setFamRel(e.target.value)}
                        className="w-full bg-[#1c1f24] text-white text-[11px] px-2.5 py-1.5 rounded-lg border border-[#23262d]"
                      />
                    </div>
                    {/* Familiar's answer */}
                    <div>
                      <span className="text-[9px] text-[#8b96aa] block mb-1">Respuesta del familiar:</span>
                      <select
                        value={famOptionId}
                        onChange={(e) => setFamOptionId(e.target.value)}
                        className="w-full bg-[#1c1f24] text-white text-[11px] px-2 py-1.5 rounded-lg border border-[#23262d]"
                      >
                        {activeSurvey.options.map(o => (
                          <option key={o.id} value={o.id}>{o.text}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFamilyMemberToList}
                      className="w-full py-1.5 rounded-lg bg-[#f59e0b] text-black text-[11px] font-bold"
                    >
                      Guardar Familiar en Pin Agrupado
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#007afc] hover:bg-[#0062ca] text-white font-bold text-xs shadow-lg shadow-[#007afc]/30 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Send className="w-4 h-4" />
                <span>Registrar Pin en Tiempo Real</span>
              </button>

            </form>
          )}

        </div>

        {/* Phone Bottom Home Bar */}
        <div className="bg-[#0e1012] py-2 flex justify-center border-t border-[#1c1f24] shrink-0">
          <div className="w-28 h-1 bg-[#444d5a] rounded-full" />
        </div>

      </div>
    </div>
  );
};
