import React, { useState, useEffect } from 'react';
import {
  obtenerEquipoCampana,
  eliminarEntrevistadorCampana,
  obtenerBaseOriginParaCompartir,
  EntrevistadorActivo,
  EnlaceEnEspera,
} from '../../utils/invitationService';

export interface ModuloEntrevistadoresProps {
  campanaId?: string;
  tipoPlan?: string;
  limiteCupos?: number;
  onSyncInterviewers?: (activos: EntrevistadorActivo[]) => void;
  onNavigateToJoin?: (token: string) => void;
}

export const ModuloEntrevistadores: React.FC<ModuloEntrevistadoresProps> = ({
  campanaId = 'camp-default',
  tipoPlan = 'Campaña Comunal',
  limiteCupos = 15,
  onSyncInterviewers,
  onNavigateToJoin,
}) => {
  const [entrevistadores, setEntrevistadores] = useState<EntrevistadorActivo[]>([]);
  const [enlacesEnEspera, setEnlacesEnEspera] = useState<EnlaceEnEspera[]>([]);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consultar lista actual (activos y pendientes)
  const cargarEquipo = async () => {
    const baseOrigin = obtenerBaseOriginParaCompartir();
    try {
      const res = await fetch(`/api/v1/campana/${campanaId}/entrevistadores/`);
      if (res.ok) {
        const data = await res.json();
        const acts: EntrevistadorActivo[] = data.activos || [];
        const espRaw: EnlaceEnEspera[] = data.en_espera || [];
        const tokensUsados = new Set(data.tokens_usados || []);
        const esp: EnlaceEnEspera[] = espRaw.map((item) => {
          let u = item.url_invitacion;
          if (!u || u.includes('localhost') || u.includes('127.0.0.1')) {
            u = `${baseOrigin}/unirse/${item.token}`;
          }
          return { ...item, url_invitacion: u };
        });
        setEntrevistadores(acts);
        // Preservar invitaciones locales pendientes que aún no están en el backend o en la lista de activos,
        // y descartar de inmediato cualquier enlace cuyo token ya haya sido utilizado
        setEnlacesEnEspera((prev) => {
          const serverTokens = new Set(esp.map((s) => s.token));
          const localOnly = prev.filter(
            (p) =>
              !tokensUsados.has(p.token) &&
              !serverTokens.has(p.token) &&
              !acts.some((a) => a.id === p.id)
          );
          return [...localOnly, ...esp];
        });
        if (onSyncInterviewers) {
          onSyncInterviewers(acts);
        }
        return;
      }
    } catch {
      // Continuar a fallback robusto
    }

    try {
      const fallback = await obtenerEquipoCampana(campanaId);
      const fallbackEsp: EnlaceEnEspera[] = fallback.en_espera.map((item) => {
        let u = item.url_invitacion;
        if (!u || u.includes('localhost') || u.includes('127.0.0.1')) {
          u = `${baseOrigin}/unirse/${item.token}`;
        }
        return { ...item, url_invitacion: u };
      });
      setEntrevistadores(fallback.activos);
      setEnlacesEnEspera((prev) => {
        const fallbackTokens = new Set(fallbackEsp.map((f) => f.token));
        const localOnly = prev.filter((p) => !fallbackTokens.has(p.token));
        return [...localOnly, ...fallbackEsp];
      });
      if (onSyncInterviewers) {
        onSyncInterviewers(fallback.activos);
      }
    } catch (err) {
      console.error('Error al cargar equipo:', err);
    }
  };

  useEffect(() => {
    cargarEquipo();
    // Sondeo periódico cada 4 segundos para actualizar automáticamente cuando el entrevistador ingrese
    const intervalo = setInterval(cargarEquipo, 4000);
    return () => clearInterval(intervalo);
  }, [campanaId]);

  // Portapapeles con fallback seguro (execCommand si clipboard API falla)
  const copiarFallback = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      console.warn('Fallback execCommand falló:', err);
      return false;
    }
  };

  // Copiar enlace con confirmación inmediata
  const handleCopiar = (id: string, url: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiadoId(id);
          setTimeout(() => setCopiadoId(null), 2000);
        })
        .catch(() => {
          copiarFallback(url);
          setCopiadoId(id);
          setTimeout(() => setCopiadoId(null), 2000);
        });
    } else {
      copiarFallback(url);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    }
  };

  const ejecutarCopiadoSeguro = (url: string, id: string) => {
    handleCopiar(id, url);
  };

  // 1. Generador de Enlace Directo e Inmediato (Sin bloqueo de red)
  const handleGenerarEnlaceDirecto = async () => {
    if (totalOcupados >= limiteCupos) {
      setErrorMessage(`Límite alcanzado. Tu plan ${tipoPlan} permite un máximo de ${limiteCupos} encuestadores.`);
      return;
    }
    setErrorMessage(null);

    // 1. Crear token único inmediato en frontend
    const tokenLocal = 'vot_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

    // Detectar si estamos en localhost y reemplazar por la IP local si está definida,
    // o asegurar protocolo explícito:
    let baseOrigin = window.location.origin;
    const localIp = (import.meta as any).env?.VITE_LOCAL_IP || '192.168.1.6:3000';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const protocol = window.location.protocol || 'http:';
      const ipHost = localIp.startsWith('http') ? localIp : `${protocol}//${localIp}`;
      baseOrigin = ipHost.replace(/\/+$/, '');
    }

    const urlParaCompartir = `${baseOrigin}/unirse/${tokenLocal}`;
    const urlLocal = urlParaCompartir;
    const idTemporal = Date.now().toString();

    const nuevaInvitacion: EnlaceEnEspera = {
      id: idTemporal,
      token: tokenLocal,
      url_invitacion: urlParaCompartir,
      enlace: `/unirse/${tokenLocal}`,
      creada_el: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'en_espera',
    };

    // 2. Insertar inmediatamente en pantalla (no esperar respuesta de red)
    setEnlacesEnEspera((prev) => [nuevaInvitacion, ...prev]);

    // Copiar automáticamente al portapapeles de inmediato para máxima rapidez
    handleCopiar(idTemporal, urlParaCompartir);

    // Guardar en localStorage para que el servicio de invitaciones lo conozca
    try {
      const raw = localStorage.getItem('votality_invitaciones_history_v2');
      const items = raw ? JSON.parse(raw) : [];
      items.unshift({
        id: idTemporal,
        token: tokenLocal,
        enlace: `/unirse/${tokenLocal}`,
        creada_el: new Date().toISOString(),
        usada: false,
        estado: 'Pendiente',
        nombre_encuestador: null,
      });
      localStorage.setItem('votality_invitaciones_history_v2', JSON.stringify(items));
    } catch (e) {
      // Ignorar
    }

    // 3. Notificar al backend en segundo plano (silencioso si falla)
    try {
      const res = await fetch('/api/v1/campana/invitar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campana_id: campanaId || 'campana-activa',
          token: tokenLocal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url_invitacion) {
        let finalUrl = data.url_invitacion;
        if (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1')) {
          finalUrl = urlParaCompartir;
        }
        // Actualizar con la URL oficial si el backend entregó una distinta
        setEnlacesEnEspera((prev) =>
          prev.map((item) =>
            item.id === idTemporal
              ? { ...item, url_invitacion: finalUrl, id: data.id || idTemporal }
              : item
          )
        );
      }
    } catch (err) {
      console.warn('Backend no respondió para guardar token, se mantiene enlace local:', err);
    }
  };

  // 3. Eliminar entrevistador
  const handleEliminar = async (encuestadorId: string) => {
    if (!window.confirm('¿Deseas desvincular a este entrevistador?')) return;
    try {
      await fetch(`/api/v1/campana/entrevistador/${encuestadorId}/`, { method: 'DELETE' });
    } catch {
      // Ignorar error de red y limpiar local
    }
    await eliminarEntrevistadorCampana(encuestadorId);
    await cargarEquipo();
  };

  const totalOcupados = entrevistadores.length + enlacesEnEspera.length;

  return (
    <div className="bg-black border border-white/20 p-5 font-mono text-white max-w-xl mx-auto space-y-4">
      {/* Cabecera y contador de cupos */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <span className="text-xs uppercase text-gray-400">Equipo {tipoPlan}</span>
        <span className="text-xs font-bold">
          {entrevistadores.length} / {limiteCupos} Activos
        </span>
      </div>

      {/* Alerta de error o límite de cupos */}
      {errorMessage && (
        <div className="p-2.5 bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex justify-between items-center">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white ml-2 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Botón único para invitar */}
      <button
        onClick={handleGenerarEnlaceDirecto}
        disabled={cargando || totalOcupados >= limiteCupos}
        className="w-full bg-white text-black py-2.5 text-xs font-bold uppercase hover:bg-gray-200 transition-colors disabled:opacity-30 cursor-pointer active:scale-98"
      >
        + Generar Enlace de Invitación
      </button>

      {/* Listado Unificado */}
      <div className="space-y-2 pt-2">
        {/* Enlaces en espera */}
        {enlacesEnEspera.map((item) => (
          <div 
            key={item.id} 
            className="bg-neutral-950 border border-white/20 p-2.5 flex items-center justify-between gap-2 mt-2"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-[10px] text-amber-400 font-mono font-bold tracking-wider uppercase">
                ● EN ESPERA
              </span>

              {/* Enlace interactivo en color azul, subrayado y con apertura en nueva pestaña */}
              <a
                href={item.url_invitacion}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir enlace en pestaña nueva"
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-mono truncate max-w-[150px] transition-colors cursor-pointer"
              >
                {item.url_invitacion}
              </a>
            </div>

            {/* Botón de respaldo para copiar */}
            <button
              type="button"
              onClick={() => ejecutarCopiadoSeguro(item.url_invitacion, item.id)}
              className="bg-white text-black font-mono font-bold text-[10px] px-2 py-1 uppercase tracking-wide hover:bg-neutral-200 transition-colors shrink-0 cursor-pointer"
            >
              {copiadoId === item.id ? '¡COPIADO!' : 'COPIAR'}
            </button>
          </div>
        ))}

        {/* Entrevistadores ya registrados */}
        {entrevistadores.map((ent) => (
          <div
            key={ent.id}
            className="flex justify-between items-center bg-neutral-900 border border-white/20 p-3"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-white truncate mr-2">
              {ent.nombre_completo}
            </span>
            <button
              onClick={() => handleEliminar(ent.id)}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 transition-colors cursor-pointer shrink-0"
              title="Eliminar entrevistador"
            >
              Eliminar [X]
            </button>
          </div>
        ))}

        {totalOcupados === 0 && (
          <p className="text-center text-xs text-gray-500 py-4">
            No hay entrevistadores vinculados ni invitaciones activas.
          </p>
        )}
      </div>
    </div>
  );
};
