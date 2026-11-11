/**
 * userStore.ts
 * Servicio centralizado de base de datos de usuarios para VOTALITY.
 * Garantiza persistencia, verificación estricta de unicidad de correo electrónico
 * y autenticación tanto local como sincronizada.
 */

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  planTier: string;
  plan: {
    codigo: string;
    nombre: string;
    limite_encuestadores: number;
    limite_pines: number;
  };
  campana_id?: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'votality_users_db';

export const MASTER_TEST_USERS: RegisteredUser[] = [
  {
    id: 'usr_superadmin_willin',
    name: 'Willin Thomas',
    email: 'willinthomas@gmail.con',
    password: 'Votalyty05',
    phone: '+573000000000',
    role: 'SUPERADMIN',
    planTier: 'DEPARTAMENTAL',
    plan: {
      codigo: 'DEPARTAMENTAL',
      nombre: 'Campaña Departamental (Acceso Total)',
      limite_encuestadores: 999999,
      limite_pines: 999999,
    },
    campana_id: 'camp_master_departamental',
    createdAt: '2026-11-11T00:00:00.000Z',
  },
  {
    id: 'usr_superadmin_willin_com',
    name: 'Willin Thomas',
    email: 'willinthomas@gmail.com',
    password: 'Votalyty05',
    phone: '+573000000000',
    role: 'SUPERADMIN',
    planTier: 'DEPARTAMENTAL',
    plan: {
      codigo: 'DEPARTAMENTAL',
      nombre: 'Campaña Departamental (Acceso Total)',
      limite_encuestadores: 999999,
      limite_pines: 999999,
    },
    campana_id: 'camp_master_departamental',
    createdAt: '2026-11-11T00:00:00.000Z',
  },
];

/**
 * Obtiene la lista completa de usuarios registrados.
 */
export function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === 'undefined') return MASTER_TEST_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MASTER_TEST_USERS));
      return [...MASTER_TEST_USERS];
    }
    const parsed: RegisteredUser[] = JSON.parse(raw);
    // Asegurar que los usuarios master siempre estén presentes
    for (const master of MASTER_TEST_USERS) {
      if (!parsed.some((u) => u.email.toLowerCase() === master.email.toLowerCase())) {
        parsed.push(master);
      }
    }
    return parsed;
  } catch (err) {
    console.error('Error al leer votality_users_db:', err);
    return MASTER_TEST_USERS;
  }
}

/**
 * Guarda la lista de usuarios en localStorage.
 */
export function saveRegisteredUsers(users: RegisteredUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error al guardar votality_users_db:', err);
  }
}

/**
 * Busca un usuario por su correo electrónico (ignora mayúsculas y espacios).
 */
export function findUserByEmail(email: string): RegisteredUser | undefined {
  const cleanEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  return users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
}

/**
 * Verifica si un correo ya se encuentra registrado.
 */
export function isEmailRegistered(email: string): boolean {
  return Boolean(findUserByEmail(email));
}

/**
 * Registra un nuevo usuario asegurando que el correo NO esté duplicado.
 */
export function registerUserInStore(userData: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: string;
  planTier?: string;
  plan?: {
    codigo: string;
    nombre: string;
    limite_encuestadores: number;
    limite_pines: number;
  };
  campana_id?: string | null;
}): { success: boolean; user?: RegisteredUser; error?: string } {
  const cleanEmail = userData.email.trim().toLowerCase();

  // Validación estricta de duplicidad
  if (isEmailRegistered(cleanEmail)) {
    return {
      success: false,
      error: 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o recupera tu contraseña.',
    };
  }

  const planTier = userData.planTier || 'FREE';
  const role = userData.role || (planTier === 'FREE' ? 'USUARIO_FREE' : 'ADMIN_CAMPANA');

  const defaultPlan = {
    codigo: planTier,
    nombre: planTier === 'FREE' ? 'Plan Gratuito / Básico' : `Campaña ${planTier}`,
    limite_encuestadores: planTier === 'FREE' ? 0 : planTier === 'MUNICIPAL' ? 50 : planTier === 'DEPARTAMENTAL' ? 200 : 15,
    limite_pines: planTier === 'FREE' ? 1000 : planTier === 'MUNICIPAL' ? 50000 : planTier === 'DEPARTAMENTAL' ? 250000 : 10000,
  };

  const newUser: RegisteredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: userData.name.trim(),
    email: cleanEmail,
    password: userData.password,
    phone: userData.phone,
    role: role,
    planTier: planTier,
    plan: userData.plan || defaultPlan,
    campana_id: userData.campana_id || null,
    createdAt: new Date().toISOString(),
  };

  const users = getRegisteredUsers();
  users.push(newUser);
  saveRegisteredUsers(users);

  return { success: true, user: newUser };
}

/**
 * Actualiza la contraseña de un usuario registrado.
 */
export function updateUserPasswordInStore(email: string, newPassword: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.email.trim().toLowerCase() === cleanEmail);
  if (idx === -1) return false;

  users[idx].password = newPassword;
  saveRegisteredUsers(users);
  return true;
}

/**
 * Valida credenciales de inicio de sesión de forma local.
 */
export function verifyCredentialsInStore(
  email: string,
  password: string
): { success: boolean; user?: RegisteredUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const user = findUserByEmail(cleanEmail);

  if (!user) {
    return {
      success: false,
      error: 'No existe ninguna cuenta registrada con este correo electrónico. Por favor regístrate.',
    };
  }

  if (user.password && user.password !== password) {
    return {
      success: false,
      error: 'Contraseña incorrecta. Por favor verifica tus credenciales o recupera tu contraseña.',
    };
  }

  return { success: true, user };
}
