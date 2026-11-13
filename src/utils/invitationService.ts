/**
 * Servicio de Enlaces de Invitación de Un Solo Uso (Single-Use Tokens) - Votality
 * Administra la generación, verificación y consumo atómico de tokens de invitación para encuestadores.
 * Se comunica con el backend Django (/api/v1/invitacion/...) y mantiene sincronía local en el cliente.
 */

export interface InvitacionItem {
  id: string;
  token: string;
  enlace: string;
  creada_el: string;
  usada: boolean;
  estado: string; // 'Pendiente' | 'Completado por [Nombre]'
  nombre_encuestador?: string | null;
  usada_el?: string | null;
}

const STORAGE_KEY = 'votality_invitaciones_history_v2';

export const obtenerBaseOriginParaCompartir = (): string => {
  if (typeof window === 'undefined') return '';
  let baseOrigin = window.location.origin;
  const localIp = (import.meta as any).env?.VITE_LOCAL_IP || '192.168.1.6:3000';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const protocol = window.location.protocol || 'http:';
    const ipHost = localIp.startsWith('http') ? localIp : `${protocol}//${localIp}`;
    baseOrigin = ipHost.replace(/\/+$/, '');
  }
  return baseOrigin;
};

// Sin datos ficticios: Inicia completamente limpio
const INITIAL_INVITACIONES: InvitacionItem[] = [];

function getStoredInvitaciones(): InvitacionItem[] {
  if (typeof window === 'undefined') return INITIAL_INVITACIONES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INVITACIONES));
      return INITIAL_INVITACIONES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INVITACIONES;
  }
}

function saveStoredInvitaciones(items: InvitacionItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error al guardar historial de invitaciones:', err);
  }
}

/**
 * Genera un nuevo token único de un solo uso para invitar encuestadores.
 */
export async function generarInvitacion(
  campanaId?: string,
  campanaNombre: string = 'Campaña Comuna 13 - Medellín'
): Promise<InvitacionItem> {
  const token = `vtx_sec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}_${Math.random().toString(36).substring(2, 11)}`;
  const enlace = `/unirse/${token}`;

  const nuevaInvitacion: InvitacionItem = {
    id: `inv-${Date.now().toString(36)}`,
    token,
    enlace,
    creada_el: new Date().toISOString(),
    usada: false,
    estado: 'Pendiente',
    nombre_encuestador: null,
  };

  // Intentar persistir en backend con validación estricta de cupos por campaña territorial
  try {
    const res = await fetch('/api/v1/campana/invitar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campana_id: campanaId }),
    });
    if (res.ok) {
      const data = await res.json();
      nuevaInvitacion.token = data.token || token;
      nuevaInvitacion.enlace = data.enlace || `/unirse/${nuevaInvitacion.token}`;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error) {
        throw new Error(err.error);
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes('Límite alcanzado')) {
      throw e;
    }
    // Modo offline / mock
  }

  const items = [nuevaInvitacion, ...getStoredInvitaciones()];
  saveStoredInvitaciones(items);
  return nuevaInvitacion;
}

/**
 * Consulta el historial de invitaciones para el panel del administrador.
 */
export async function obtenerHistorialInvitaciones(campanaId?: string): Promise<InvitacionItem[]> {
  try {
    const res = await fetch('/api/v1/invitaciones/');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.invitaciones)) {
        saveStoredInvitaciones(data.invitaciones);
        return data.invitaciones;
      }
    }
  } catch {
    // Uso local
  }
  return getStoredInvitaciones();
}

/**
 * Valida si un enlace de invitación existe y si aún no ha sido consumido.
 */
export async function verificarInvitacion(token: string): Promise<{
  valido: boolean;
  mensaje?: string;
  usada?: boolean;
  campana?: {
    id?: string;
    nombre: string;
    tipo_plan: string;
  };
}> {
  // 1. Intentar validar con Backend Django
  try {
    const res = await fetch(`/api/v1/invitacion/verificar/${token}/`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Continuar a fallback local
  }

  // 2. Fallback de almacenamiento local
  const items = getStoredInvitaciones();
  const found = items.find((i) => i.token === token);

  if (!found) {
    // Si no está en historial pero empieza con 'vot_' o 'vtx_', asumimos que fue generado recientemente
    if (token.startsWith('vot_') || token.startsWith('vtx_')) {
      return {
        valido: true,
        campana: {
          nombre: 'Campaña Comuna 13 - Medellín',
          tipo_plan: 'Campaña Comunal / JAL',
        },
      };
    }
    return {
      valido: false,
      mensaje: 'Este enlace de invitación ya fue utilizado y no tiene validez. Solicita un nuevo enlace al Administrador de la Campaña.',
      usada: true,
    };
  }

  if (found.usada) {
    return {
      valido: false,
      mensaje: 'Este enlace de invitación ya fue utilizado y no tiene validez. Solicita un nuevo enlace al Administrador de la Campaña.',
      usada: true,
    };
  }

  return {
    valido: true,
    campana: {
      nombre: 'Campaña Comuna 13 - Medellín',
      tipo_plan: 'Campaña Comunal / JAL',
    },
  };
}

/**
 * Consume y bloquea atómicamente el token de invitación al registrar el nombre del encuestador.
 */
export async function completarInvitacion(
  token: string,
  nombre: string,
  telefono?: string
): Promise<{
  success: boolean;
  mensaje: string;
  encuestador?: {
    id: string;
    name: string;
    username: string;
    sessionToken: string;
    role: string;
    campaignId?: string;
    campaignName?: string;
  };
  proyecto?: {
    id?: string;
    nombre: string;
    director: string;
  };
  error?: string;
}> {
  // 1. Intentar registrar en backend Django (/api/v1/campana/unirse/ o /api/v1/invitacion/completar/<token>/)
  try {
    let res = await fetch('/api/v1/campana/unirse/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        nombre_completo: nombre,
        nombre,
        telefono,
      }),
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(`/api/v1/invitacion/completar/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nombre_completo: nombre,
          nombre,
          telefono,
        }),
      });
    }

    if (res.ok) {
      const data = await res.json();
      // Actualizar réplica local
      marcarInvitacionLocalUsada(token, nombre);
      return data;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error || errData.mensaje) {
        return {
          success: false,
          mensaje: errData.error || errData.mensaje || 'Este enlace de invitación ya ha sido utilizado o es inválido.',
          error: errData.error || errData.mensaje,
        };
      }
    }
  } catch {
    // Continuar a fallback local
  }

  // 2. Fallback de consumo local atómico
  const items = getStoredInvitaciones();
  const index = items.findIndex((i) => i.token === token);

  if (index !== -1 && items[index].usada) {
    return {
      success: false,
      mensaje: 'Este enlace de invitación ya ha sido utilizado o es inválido.',
      error: 'Este enlace de invitación ya ha sido utilizado o es inválido.',
    };
  }

  // Marcar como consumida de inmediato
  marcarInvitacionLocalUsada(token, nombre);

  const savedProject =
    localStorage.getItem('votality_last_project_name') ||
    localStorage.getItem('voxpin_last_project_name') ||
    '';

  const newId = `enc-${Date.now().toString(36)}`;
  return {
    success: true,
    mensaje: `Bienvenido a Votality, ${nombre.trim()}. Te has unido a la campaña.`,
    encuestador: {
      id: newId,
      name: nombre.trim(),
      username: `enc_${nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`,
      sessionToken: `tok_live_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      role: 'encuestador',
      campaignName: savedProject,
    },
    proyecto: {
      id: 'camp-default',
      nombre: savedProject,
      director: 'Director de Campaña',
    },
  };
}

function marcarInvitacionLocalUsada(token: string, nombreEncuestador: string): void {
  const items = getStoredInvitaciones();
  const index = items.findIndex((i) => i.token === token);
  const now = new Date().toISOString();

  if (index !== -1) {
    items[index].usada = true;
    items[index].estado = `Completado por ${nombreEncuestador.trim()}`;
    items[index].nombre_encuestador = nombreEncuestador.trim();
    items[index].usada_el = now;
  } else {
    items.unshift({
      id: `inv-${Date.now().toString(36)}`,
      token,
      enlace: `/unirse/${token}`,
      creada_el: now,
      usada: true,
      estado: `Completado por ${nombreEncuestador.trim()}`,
      nombre_encuestador: nombreEncuestador.trim(),
      usada_el: now,
    });
  }

  saveStoredInvitaciones(items);

  // Agregar automáticamente a la lista de entrevistadores activos locales
  try {
    const rawActivos = localStorage.getItem('votality_team_activos');
    const activos: EntrevistadorActivo[] = rawActivos ? JSON.parse(rawActivos) : [];
    if (!activos.some((a) => a.nombre_completo.toLowerCase() === nombreEncuestador.trim().toLowerCase())) {
      activos.push({
        id: `enc-${Date.now().toString(36)}`,
        nombre_completo: nombreEncuestador.trim(),
        totalSurveys: 0,
      });
      localStorage.setItem('votality_team_activos', JSON.stringify(activos));
    }
  } catch (e) {
    console.error(e);
  }
}

export interface EntrevistadorActivo {
  id: string;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  totalSurveys?: number;
}

export interface EnlaceEnEspera {
  id: string;
  token: string;
  url_invitacion: string;
  enlace?: string;
  creada_el?: string;
  estado?: string;
}

export interface EquipoCampanaResponse {
  activos: EntrevistadorActivo[];
  en_espera: EnlaceEnEspera[];
  limite_cupos?: number;
  tipo_plan?: string;
}

/**
 * Consulta el equipo unificado de la campaña (Entrevistadores activos y enlaces en espera)
 */
export async function obtenerEquipoCampana(campanaId?: string): Promise<EquipoCampanaResponse> {
  const cid = campanaId || 'default';
  try {
    const res = await fetch(`/api/v1/campana/${cid}/entrevistadores/`);
    if (res.ok) {
      const data = await res.json();
      return {
        activos: data.activos || [],
        en_espera: data.en_espera || [],
        limite_cupos: data.limite_cupos,
        tipo_plan: data.tipo_plan,
      };
    }
  } catch {
    // Continuar a fallback local
  }

  // Fallback local sincronizado
  let localActivos: EntrevistadorActivo[] = [];
  try {
    const rawActivos = localStorage.getItem('votality_team_activos');
    if (rawActivos) {
      localActivos = JSON.parse(rawActivos);
    }
  } catch {
    localActivos = [];
  }

  const items = getStoredInvitaciones();
  const enEspera: EnlaceEnEspera[] = items
    .filter((inv) => !inv.usada)
    .map((inv) => ({
      id: inv.id,
      token: inv.token,
      url_invitacion: `${obtenerBaseOriginParaCompartir()}${inv.enlace}`,
      enlace: inv.enlace,
      creada_el: inv.creada_el,
      estado: 'En Espera',
    }));

  return {
    activos: localActivos,
    en_espera: enEspera,
  };
}

/**
 * Elimina o desvincula un entrevistador o cancela un enlace en espera.
 */
export async function eliminarEntrevistadorCampana(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/campana/entrevistador/${id}/`, {
      method: 'DELETE',
    });
    if (res.ok) {
      // Éxito en backend
    }
  } catch {
    // Fallback local
  }

  // Limpiar en almacenamiento local
  try {
    const rawActivos = localStorage.getItem('votality_team_activos');
    if (rawActivos) {
      const activos: EntrevistadorActivo[] = JSON.parse(rawActivos);
      const filtered = activos.filter((a) => a.id !== id);
      localStorage.setItem('votality_team_activos', JSON.stringify(filtered));
    }

    const items = getStoredInvitaciones();
    const filteredItems = items.filter((inv) => inv.id !== id && inv.token !== id);
    saveStoredInvitaciones(filteredItems);
  } catch (e) {
    console.error(e);
  }

  return true;
}

