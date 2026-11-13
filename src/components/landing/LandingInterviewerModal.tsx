import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import { COLOMBIA_DEPARTAMENTOS, COLOMBIA_MUNICIPIOS } from '../../data/colombiaTerritoryData';
import { completarInvitacion } from '../../utils/invitationService';

interface LandingInterviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (encuestador: {
    id: string;
    name: string;
    username: string;
    sessionToken: string;
    role: string;
    projectName?: string;
    campaignName?: string;
    director?: string;
  }) => void;
}

export const LandingInterviewerModal: React.FC<LandingInterviewerModalProps> = ({
  isOpen,
  onClose,
  onJoined,
}) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lista de departamentos ordenados
  const departamentosList = useMemo(() => {
    return [...COLOMBIA_DEPARTAMENTOS]
      .map((d) => d.nombre || '')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));
  }, []);

  // Municipios filtrados por el departamento seleccionado
  const municipiosList = useMemo(() => {
    if (!departamento) return [];
    return COLOMBIA_MUNICIPIOS.filter(
      (m) => (m.departamento || '').trim().toLowerCase() === departamento.trim().toLowerCase()
    )
      .map((m) => m.nombre || '')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));
  }, [departamento]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNombre = nombre.trim();
    const cleanApellido = apellido.trim();
    const cleanToken = token.trim();

    if (!cleanNombre) {
      setErrorMessage('El nombre completo es obligatorio.');
      return;
    }
    if (!cleanApellido) {
      setErrorMessage('El apellido completo es obligatorio.');
      return;
    }
    if (!departamento) {
      setErrorMessage('Seleccione su departamento asignado de encuestas.');
      return;
    }
    if (!municipio) {
      setErrorMessage('Seleccione su municipio asignado.');
      return;
    }
    if (!cleanToken) {
      setErrorMessage('Debe ingresar el token de acceso único proporcionado por el Administrador.');
      return;
    }

    setIsLoading(true);
    const fullName = `${cleanNombre} ${cleanApellido}`;

    try {
      const res = await completarInvitacion(cleanToken, fullName);
      if (res.success && res.encuestador) {
        // Guardar contexto del encuestador para respetar privacidad del administrador
        try {
          if (res.proyecto?.director) {
            localStorage.setItem('votality_encuestador_admin_name', res.proyecto.director);
          }
          localStorage.setItem('votality_encuestador_departamento', departamento);
          localStorage.setItem('votality_encuestador_municipio', municipio);
        } catch (e) {
          console.error(e);
        }

        onJoined({
          id: res.encuestador.id,
          name: fullName,
          username: res.encuestador.username,
          sessionToken: res.encuestador.sessionToken,
          role: 'encuestador',
          projectName: res.proyecto?.nombre || res.encuestador.campaignName,
          campaignName: res.encuestador.campaignName,
          director: res.proyecto?.director || 'Director de Campaña',
        });
        onClose();
      } else {
        setErrorMessage(
          res.mensaje ||
            'El token de invitación ingresado es inválido o ya fue utilizado por otro encuestador. Recuerde que cada token es de uso único.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Error de conexión al validar el token de acceso. Verifique e intente nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="modal-soy-encuestador"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
    >
      <div className="bg-[#080808] border-2 border-white w-full max-w-lg rounded-sm shadow-[0_0_60px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#0e0e0e] border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF85] animate-pulse" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#00FF85] font-bold">
                PORTAL DE VINCULACIÓN EN CAMPO
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00FF85]" />
                <span>Soy Encuestador // Acceso con Token</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-sm text-[#888888] hover:text-white hover:bg-[#1f1f1f] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-[#111111] border border-[#262626] rounded-sm text-xs font-mono text-[#aaaaaa] leading-relaxed">
            Ingresa tus datos personales y el token único generado por el Administrador de tu campaña (Plan Premium, Campañas Comunales, Municipales, Departamentales o Empresariales).
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500 rounded-sm flex items-start gap-2.5 text-xs text-red-200 font-mono animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nombre y Apellido Completo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-[#888888] uppercase block font-bold">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Carlos Andrés"
                className="w-full bg-[#141414] border border-[#333333] focus:border-white text-white p-2.5 rounded-sm outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#888888] uppercase block font-bold">
                Apellido Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej: Morales Rivera"
                className="w-full bg-[#141414] border border-[#333333] focus:border-white text-white p-2.5 rounded-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* Departamento y Municipio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-[#888888] uppercase block font-bold">
                Departamento <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={departamento}
                onChange={(e) => {
                  setDepartamento(e.target.value);
                  setMunicipio('');
                }}
                className="w-full bg-[#141414] border border-[#333333] focus:border-white text-white p-2.5 rounded-sm outline-none transition-colors"
              >
                <option value="">Seleccione Departamento...</option>
                {departamentosList.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#888888] uppercase block font-bold">
                Municipio <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={!departamento}
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="w-full bg-[#141414] border border-[#333333] focus:border-white text-white p-2.5 rounded-sm outline-none transition-colors disabled:opacity-40"
              >
                <option value="">
                  {departamento ? 'Seleccione Municipio...' : 'Elija primero departamento'}
                </option>
                {municipiosList.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Token de Acceso Único */}
          <div className="space-y-1.5 font-mono pt-1">
            <label className="text-[10px] text-[#00FF85] uppercase tracking-wider block font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-[#00FF85]" />
                Token de Invitación del Administrador <span className="text-red-500">*</span>
              </span>
              <span className="text-[9px] text-[#888888] font-normal uppercase">Uso Único</span>
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Ej: vtx_sec_l2k9x8_7a9f4c2e..."
              className="w-full bg-[#121212] border-2 border-[#333333] focus:border-[#00FF85] text-white p-3 rounded-sm font-mono text-xs tracking-wider outline-none transition-colors shadow-inner"
            />
            <p className="text-[10px] text-[#777777] font-mono leading-tight">
              Los tokens son códigos criptográficos largos de uso único y no pueden reutilizarse una vez consumidos.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-sm bg-[#161616] hover:bg-[#222222] text-[#888888] hover:text-white text-xs font-mono uppercase cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-sm bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validando Token...</span>
                </>
              ) : (
                <>
                  <span>Acceder al Equipo</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
