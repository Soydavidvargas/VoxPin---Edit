import React, { useState, useEffect } from 'react';
import {
  Link2Off,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Building2,
  Users,
  CheckCircle2,
  Home,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { verificarInvitacion, completarInvitacion } from '../../utils/invitationService';

interface VotalityJoinPageProps {
  token: string;
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
  onBackToHome: () => void;
}

export const VotalityJoinPage: React.FC<VotalityJoinPageProps> = ({
  token,
  onJoined,
  onBackToHome,
}) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [campaignInfo, setCampaignInfo] = useState<{
    nombre: string;
    tipo_plan: string;
  } | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Verificar validez del token de un solo uso
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      setLoading(true);
      setFormError(null);
      try {
        const result = await verificarInvitacion(token);
        if (!isMounted) return;

        if (result.valido && !result.usada) {
          setIsValid(true);
          if (result.campana) {
            setCampaignInfo(result.campana);
          }
        } else {
          setIsValid(false);
          setErrorMessage(
            result.mensaje ||
              'Este enlace único ya fue registrado en otro dispositivo. Comunícate con el Administrador de la Campaña para que te genere una nueva invitación.'
          );
        }
      } catch (err: any) {
        if (!isMounted) return;
        setIsValid(false);
        setErrorMessage(
          'Error al validar el enlace de invitación. Intenta nuevamente o contacta al administrador.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      checkToken();
    } else {
      setIsValid(false);
      setErrorMessage('Token de invitación no proporcionado.');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Manejar el envío del formulario para consumir el enlace de un solo uso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError('Por favor ingresa tu nombre completo para el registro en campo.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await completarInvitacion(token, nombre.trim(), telefono.trim());
      if (res.success && res.encuestador) {
        onJoined({
          ...res.encuestador,
          projectName: res.proyecto?.nombre || res.encuestador.campaignName,
          campaignName: res.proyecto?.nombre || res.encuestador.campaignName,
          director: res.proyecto?.director,
        });
      } else {
        // Si el enlace ya fue usado entretanto (race condition mitigada en backend)
        setIsValid(false);
        setErrorMessage(
          res.mensaje ||
            'Este enlace único ya fue registrado en otro dispositivo. Comunícate con el Administrador de la Campaña para que te genere una nueva invitación.'
        );
      }
    } catch (err: any) {
      setFormError(err.message || 'Error al completar el registro. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Estado de Carga
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-4 font-mono">
        <div className="flex flex-col items-center gap-4 bg-[#0a0a0a] border border-[#222222] p-8 rounded-sm max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-white">
              Validando Enlace Único
            </h3>
            <p className="text-xs text-[#888888] mt-1">
              Verificando autenticidad satelital y cuota de campaña...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. PANTALLA DE BLOQUEO: Enlace Expirado / Consumido
  // (No muestra formulario ni aviso de cookies, pantalla limpia monocromática)
  if (isValid === false) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
        {/* Top Minimal Branding */}
        <div className="mb-8 flex items-center gap-2 text-xs font-mono text-[#666666] uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#FFFFFF]"></span>
          <span>VOTALITY • PROTOCOLO DE SEGURIDAD</span>
        </div>

        {/* Card Monocromática de Enlace Expirado */}
        <div className="max-w-md w-full bg-[#0a0a0a] border border-[#262626] rounded-sm p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.8)] flex flex-col items-center text-center animate-in fade-in duration-300">
          {/* Icono de Enlace Roto / Candado con estilo técnico */}
          <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#333333] flex items-center justify-center mb-6 shadow-inner">
            <Link2Off className="w-8 h-8 text-white stroke-[1.75]" />
          </div>

          {/* Título Oficial */}
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white font-mono">
            Enlace de Invitación Expirado
          </h1>

          {/* Línea divisoria minimalista */}
          <div className="w-12 h-0.5 bg-white/30 my-4"></div>

          {/* Mensaje de Explicación */}
          <p className="text-sm text-[#AAAAAA] leading-relaxed font-sans mb-8">
            {errorMessage ||
              'Este enlace único ya fue registrado en otro dispositivo. Comunícate con el Administrador de la Campaña para que te genere una nueva invitación.'}
          </p>

          {/* Detalles del Token en formato mono */}
          <div className="w-full bg-[#111111] border border-[#222222] px-3.5 py-2.5 rounded-sm text-left font-mono text-[11px] text-[#777777] mb-8 flex items-center justify-between">
            <span className="truncate">TOKEN: {token}</span>
            <span className="text-[#FFFFFF] uppercase tracking-wider font-bold">INVÁLIDO</span>
          </div>

          {/* Botón: Volver al Inicio */}
          <button
            onClick={onBackToHome}
            className="w-full py-3 px-6 bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#000000] font-mono text-xs uppercase font-bold tracking-widest transition-all rounded-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>
        </div>

        {/* Footer legal discreto */}
        <p className="mt-8 text-[11px] font-mono text-[#555555]">
          SISTEMA DE SEGURIDAD ELECTORAL • TOKEN DE UN SOLO USO
        </p>
      </div>
    );
  }

  // 3. PANTALLA DE REGISTRO DE ENCUESTADOR (Token Válido)
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      {/* Top Branding */}
      <div className="mb-6 flex items-center gap-2 text-xs font-mono text-[#888888] uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse"></span>
        <span>VOTALITY • ACCESO DE ENCUESTADOR EN CAMPO</span>
      </div>

      <div className="max-w-md w-full bg-[#0a0a0a] border border-[#262626] rounded-sm p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.8)] animate-in fade-in duration-300">
        {/* Cabecera de la Campaña */}
        <div className="mb-6 pb-5 border-b border-[#222222]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] border border-[#333333] text-[10px] font-mono text-white rounded-sm uppercase tracking-wider mb-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Invitación Oficial Verificada</span>
          </div>
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">
            {campaignInfo?.nombre || 'Campaña Electoral Activa'}
          </h2>
          <p className="text-xs text-[#888888] font-mono mt-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>{campaignInfo?.tipo_plan || 'Plan Territorial Vigente'}</span>
          </p>
        </div>

        {/* Advertencia técnica de token de un solo uso */}
        <div className="bg-[#111111] border-l-2 border-[#FFFFFF] px-3.5 py-2.5 rounded-sm text-xs font-mono text-[#AAAAAA] mb-6 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-bold block mb-0.5">ENLACE DE UN SOLO USO:</span>
            Apenas confirmes tu registro, este enlace quedará bloqueado permanentemente.
          </div>
        </div>

        {formError && (
          <div className="mb-6 p-3 bg-[#161616] border border-[#444444] text-[#FFFFFF] text-xs font-mono rounded-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FFFFFF] shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Formulario de Captura de Nombre */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#CCCCCC] mb-2">
              Nombre Completo del Encuestador <span className="text-white">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Carlos Alberto Mendoza"
              className="w-full bg-[#111111] border border-[#333333] focus:border-[#FFFFFF] text-white px-3.5 py-2.5 text-sm rounded-sm outline-none transition-colors font-sans placeholder:text-[#555555]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#CCCCCC] mb-2">
              Teléfono / WhatsApp (Opcional)
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: +57 310 123 4567"
              className="w-full bg-[#111111] border border-[#333333] focus:border-[#FFFFFF] text-white px-3.5 py-2.5 text-sm rounded-sm outline-none transition-colors font-sans placeholder:text-[#555555]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#000000] font-mono text-xs uppercase font-bold tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vinculando a Campaña...</span>
                </>
              ) : (
                <>
                  <span>Confirmar y Entrar a Campo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-[#222222] flex justify-between items-center text-[11px] font-mono text-[#666666]">
          <span>ID: {token.slice(0, 14)}...</span>
          <button
            type="button"
            onClick={onBackToHome}
            className="text-[#888888] hover:text-white underline cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

