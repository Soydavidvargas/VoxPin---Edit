import React, { useState, useEffect } from 'react';
import { MapPin, X, Plus, Users, CheckCircle2, Navigation } from 'lucide-react';
import { Survey, SurveyPin, FamilyMember } from '../types/voxpin';

interface AddPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSurvey: Survey;
  onAddPin: (newPin: SurveyPin) => void;
  initialCoords?: { lat: number; lng: number } | null;
}

export const AddPinModal: React.FC<AddPinModalProps> = ({
  isOpen,
  onClose,
  activeSurvey,
  onAddPin,
  initialCoords,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Carrera 78K # 38 Sur');
  const [neighborhood, setNeighborhood] = useState('Timiza');
  const [locality, setLocality] = useState('Kennedy');
  const [locationType, setLocationType] = useState<'exact' | 'neighborhood_only'>('exact');
  const [selectedOptionId, setSelectedOptionId] = useState<string>(activeSurvey.options[0]?.id || '');
  const [lat, setLat] = useState<number>(initialCoords?.lat || 4.6210);
  const [lng, setLng] = useState<number>(initialCoords?.lng || -74.1530);

  // Clustering / Family members
  const [isFamilyCluster, setIsFamilyCluster] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memName, setMemName] = useState('');
  const [memAge, setMemAge] = useState<number | ''>('');
  const [memCedula, setMemCedula] = useState('');
  const [memPhone, setMemPhone] = useState('');
  const [memRel, setMemRel] = useState('Familiar');
  const [memOptionId, setMemOptionId] = useState(activeSurvey.options[0]?.id || '');

  useEffect(() => {
    if (initialCoords) {
      setLat(initialCoords.lat);
      setLng(initialCoords.lng);
    }
  }, [initialCoords]);

  const handleAddMember = () => {
    if (!memName || !memAge) return;
    const member: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: memName,
      age: Number(memAge),
      cedula: memCedula || 'C.C. Pendiente',
      phone: memPhone || phone,
      relationship: memRel,
      answerOptionId: memOptionId,
    };
    setFamilyMembers([...familyMembers, member]);
    setMemName('');
    setMemAge('');
    setMemCedula('');
    setShowMemberForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age) {
      alert('Ingresa el nombre y la edad del encuestado principal');
      return;
    }

    const newPin: SurveyPin = {
      id: `pin-${Date.now()}`,
      name,
      age: Number(age),
      cedula: cedula || '1.034.882.100',
      phone: phone || '+57 310 123 4567',
      address,
      neighborhood,
      locality,
      locationType,
      lat,
      lng,
      surveyId: activeSurvey.id,
      answerOptionId: selectedOptionId,
      surveyorName: 'Luis Alfonso (Encuestador 01)',
      surveyorId: 'enc-01',
      timestamp: 'Ahora mismo',
      familyMembers: isFamilyCluster && familyMembers.length > 0 ? [
        {
          id: `head-${Date.now()}`,
          name,
          age: Number(age),
          cedula: cedula || '1.034.882.100',
          phone: phone || '+57 310 123 4567',
          relationship: 'Jefe de hogar',
          answerOptionId: selectedOptionId,
        },
        ...familyMembers,
      ] : undefined,
    };

    onAddPin(newPin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#15171b] border border-[#1c1f24] rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[92vh] overflow-y-auto animate-slide-up">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1c1f24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007afc]/15 border border-[#007afc]/30 flex items-center justify-center text-[#007afc]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#007afc]">
                MÓDULO 1 · REGISTRO Y GEOLOCALIZACIÓN
              </span>
              <h2 className="text-xl font-bold text-white">
                Registrar Nuevo Encuestado
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b96aa] hover:text-white p-2 rounded-xl bg-[#1c1f24] border border-[#23262d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Question & Answer Selection */}
          <div className="p-4 rounded-2xl bg-[#1c1f24] border border-[#23262d]">
            <span className="text-[10px] font-bold text-[#8b96aa] uppercase tracking-wider block mb-1">
              Encuesta Activa: {activeSurvey.title}
            </span>
            <p className="text-sm font-bold text-white mb-3">
              {activeSurvey.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {activeSurvey.options.map((opt, i) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-white text-white shadow-md'
                        : 'border-[#23262d] text-[#8b96aa] hover:text-white bg-[#15171b]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${opt.color}25` : undefined,
                      borderColor: isSelected ? opt.color : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />
                      <span className="text-xs font-bold">{opt.text}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Logic (Page 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Lógica de Ubicación (Módulo 1):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('exact')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    locationType === 'exact'
                      ? 'bg-[#007afc]/20 text-[#007afc] border-[#007afc]'
                      : 'bg-[#1c1f24] text-[#8b96aa] border-[#23262d]'
                  }`}
                >
                  Dirección Exacta
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('neighborhood_only')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    locationType === 'neighborhood_only'
                      ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]'
                      : 'bg-[#1c1f24] text-[#8b96aa] border-[#23262d]'
                  }`}
                >
                  Solo el Barrio
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Coordenadas Geoespaciales:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-1/2 bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d]"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-1/2 bg-[#1c1f24] text-white text-xs px-3 py-2 rounded-xl border border-[#23262d]"
                  placeholder="Lng"
                />
              </div>
            </div>
          </div>

          {/* Capture fields from Page 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Nombre Completo:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Carlos Mendoza"
                className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Edad:
              </label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ej: 52"
                className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Cédula de Ciudadanía:
              </label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej: 19.345.892"
                className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Teléfono:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: +57 310 445 1290"
                className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Dirección exacta:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Calle 38 Sur # 78K-22"
                className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Barrio:
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ej: Timiza"
                className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
              />
            </div>
          </div>

          {/* Agrupación Familiar (Clustering) Checkbox & Sub-list */}
          <div className="p-4 rounded-2xl bg-[#1c1f24] border border-[#23262d]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-family"
                  checked={isFamilyCluster}
                  onChange={(e) => setIsFamilyCluster(e.target.checked)}
                  className="rounded text-[#007afc]"
                />
                <label htmlFor="chk-family" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#f59e0b]" />
                  <span>Activar Agrupación Familiar (Clustering de misma dirección)</span>
                </label>
              </div>
              {isFamilyCluster && (
                <button
                  type="button"
                  onClick={() => setShowMemberForm(!showMemberForm)}
                  className="text-xs font-semibold text-[#007afc] hover:underline"
                >
                  + Agregar Habitante
                </button>
              )}
            </div>

            {isFamilyCluster && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-[#8b96aa]">
                  Si varias personas viven en la misma dirección, el mapa las reúne en un solo pin interactivo para no saturar la interfaz.
                </p>

                {familyMembers.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-[#15171b] border border-[#23262d] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{m.name}</span>
                      <span className="text-[#8b96aa] ml-1.5">({m.age} años · {m.relationship})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFamilyMembers(familyMembers.filter(x => x.id !== m.id))}
                      className="text-[#ef4444] text-xs px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {showMemberForm && (
                  <div className="p-3 rounded-xl bg-[#15171b] border border-[#f59e0b]/40 space-y-2">
                    <span className="text-xs font-bold text-white block">Datos del nuevo familiar:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre familiar"
                        value={memName}
                        onChange={(e) => setMemName(e.target.value)}
                        className="bg-[#1c1f24] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#23262d]"
                      />
                      <input
                        type="number"
                        placeholder="Edad"
                        value={memAge}
                        onChange={(e) => setMemAge(e.target.value ? Number(e.target.value) : '')}
                        className="bg-[#1c1f24] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#23262d]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Parentesco"
                        value={memRel}
                        onChange={(e) => setMemRel(e.target.value)}
                        className="bg-[#1c1f24] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#23262d]"
                      />
                      <select
                        value={memOptionId}
                        onChange={(e) => setMemOptionId(e.target.value)}
                        className="bg-[#1c1f24] text-white text-xs px-2 py-1.5 rounded-lg border border-[#23262d]"
                      >
                        {activeSurvey.options.map(o => (
                          <option key={o.id} value={o.id}>{o.text}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="w-full py-1.5 rounded-lg bg-[#f59e0b] text-black font-bold text-xs"
                    >
                      Añadir a la familia
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1c1f24]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#8b96aa] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#007afc] hover:bg-[#0062ca] text-white text-xs font-bold shadow-lg shadow-[#007afc]/30"
            >
              Guardar y Publicar Pin
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
