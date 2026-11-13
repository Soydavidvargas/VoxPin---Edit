import type { Plugin, ViteDevServer } from 'vite';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OTP_FILE = path.join(DATA_DIR, 'otp_codes.json');
const SURVEYS_FILE = path.join(DATA_DIR, 'surveys.json');

// Asegurar existencia del directorio de persistencia
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readSurveys(): any[] {
  try {
    if (!fs.existsSync(SURVEYS_FILE)) return [];
    const data = fs.readFileSync(SURVEYS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[AUTH API] Error al leer surveys.json:', err);
    return [];
  }
}

function saveSurveys(surveys: any[]): void {
  try {
    fs.writeFileSync(SURVEYS_FILE, JSON.stringify(surveys, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AUTH API] Error al guardar surveys.json:', err);
  }
}

interface StoredUser {
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

interface StoredOtp {
  code: string;
  email: string;
  expiresAt: number;
  verified?: boolean;
}

function readUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[AUTH API] Error al leer users.json:', err);
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AUTH API] Error al escribir users.json:', err);
  }
}

function readOtps(): Record<string, StoredOtp> {
  try {
    if (!fs.existsSync(OTP_FILE)) return {};
    const data = fs.readFileSync(OTP_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function saveOtps(otps: Record<string, StoredOtp>): void {
  try {
    fs.writeFileSync(OTP_FILE, JSON.stringify(otps, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AUTH API] Error al guardar otps:', err);
  }
}

async function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const SMTP_CONFIG_FILE = path.join(DATA_DIR, 'smtp_config.json');

interface SmtpConfig {
  backend?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

function readSmtpConfig(): SmtpConfig {
  try {
    let fileConfig: SmtpConfig = {};
    if (fs.existsSync(SMTP_CONFIG_FILE)) {
      fileConfig = JSON.parse(fs.readFileSync(SMTP_CONFIG_FILE, 'utf-8'));
    }
    const finalPass = fileConfig.pass !== undefined ? fileConfig.pass : (process.env.SMTP_PASS || '');
    return {
      backend: fileConfig.backend || process.env.EMAIL_BACKEND || process.env.DJANGO_EMAIL_BACKEND || 'console',
      host: fileConfig.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: fileConfig.port || Number(process.env.SMTP_PORT) || 465,
      secure: fileConfig.secure !== undefined ? fileConfig.secure : process.env.SMTP_SECURE !== 'false',
      user: fileConfig.user || process.env.SMTP_USER || '',
      pass: finalPass.trim(),
    };
  } catch {
    return {
      backend: process.env.EMAIL_BACKEND || process.env.DJANGO_EMAIL_BACKEND || 'console',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      user: process.env.SMTP_USER || '',
      pass: (process.env.SMTP_PASS || '').trim(),
    };
  }
}

function saveSmtpConfig(config: Partial<SmtpConfig>) {
  try {
    const current = readSmtpConfig();
    const updated = { ...current, ...config };
    if (updated.pass) {
      updated.pass = updated.pass.replace(/\s+/g, '');
    }
    fs.writeFileSync(SMTP_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    if (updated.pass) process.env.SMTP_PASS = updated.pass;
    if (updated.user) process.env.SMTP_USER = updated.user;
    console.log('[SMTP CONFIG] Configuración guardada en backend/data/smtp_config.json.');
  } catch (err) {
    console.error('[SMTP CONFIG] Error al guardar smtp_config.json:', err);
  }
}

function sendJsonResponse(res: any, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function authApiPlugin(): Plugin {
  return {
    name: 'votality-auth-api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || '';

        // 1. REGISTRO DE USUARIOS
        if (req.method === 'POST' && (url === '/api/v1/auth/registro/' || url === '/api/auth/registro/')) {
          const body = await parseJsonBody(req);
          const email = (body.email || '').trim().toLowerCase();
          const nombre = (body.nombre || body.name || '').trim();
          const password = (body.password || '').trim();
          const tipoPlan = (body.tipo_plan || body.planTier || 'FREE').toUpperCase();
          const telefono = (body.telefono || body.phone || '').trim();

          if (!email || !email.includes('@')) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'Ingresa un correo electrónico válido.',
            });
          }

          if (!password || password.length < 6) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'La contraseña debe tener al menos 6 caracteres.',
            });
          }

          const users = readUsers();
          const existing = users.find((u) => u.email.toLowerCase() === email);

          if (existing) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o recupera tu contraseña.',
            });
          }

          const esCampana = ['COMUNAL', 'MUNICIPAL', 'DEPARTAMENTAL'].includes(tipoPlan);
          const rol = esCampana ? 'ADMIN_CAMPANA' : 'USUARIO_FREE';
          const planFinal = esCampana ? tipoPlan : 'FREE';

          const planObj = {
            codigo: planFinal,
            nombre: planFinal === 'FREE' ? 'Plan Gratuito / Básico' : `Campaña ${planFinal}`,
            limite_encuestadores: planFinal === 'FREE' ? 0 : planFinal === 'MUNICIPAL' ? 50 : planFinal === 'DEPARTAMENTAL' ? 200 : 15,
            limite_pines: planFinal === 'FREE' ? 1000 : planFinal === 'MUNICIPAL' ? 50000 : planFinal === 'DEPARTAMENTAL' ? 250000 : 10000,
          };

          const newUser: StoredUser = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: nombre || email.split('@')[0],
            email: email,
            password: password,
            phone: telefono,
            role: rol,
            planTier: planFinal,
            plan: planObj,
            campana_id: esCampana ? `camp_${Date.now()}` : null,
            createdAt: new Date().toISOString(),
          };

          users.push(newUser);
          saveUsers(users);

          return sendJsonResponse(res, 201, {
            success: true,
            token: `tok_live_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            mensaje: `Registro exitoso para ${newUser.name}.`,
            usuario: {
              id: newUser.id,
              nombre_completo: newUser.name,
              email: newUser.email,
              rol: newUser.role,
              plan: newUser.plan,
              campana_id: newUser.campana_id,
            },
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone,
              role: newUser.role,
              planTier: newUser.planTier,
              plan: newUser.plan,
              campana_id: newUser.campana_id,
            },
          });
        }

        // 2. INICIO DE SESIÓN
        if (req.method === 'POST' && (url === '/api/v1/auth/login/' || url === '/api/auth/login/')) {
          const body = await parseJsonBody(req);
          const email = (body.email || '').trim().toLowerCase();
          const password = (body.password || '').trim();

          const users = readUsers();
          const user = users.find((u) => u.email.toLowerCase() === email);

          if (!user) {
            return sendJsonResponse(res, 404, {
              success: false,
              error: 'No existe una cuenta registrada con este correo electrónico. Por favor regístrate primero.',
            });
          }

          if (user.password && user.password !== password) {
            return sendJsonResponse(res, 401, {
              success: false,
              error: 'Contraseña incorrecta. Por favor verifica tus credenciales o recupera tu contraseña.',
            });
          }

          return sendJsonResponse(res, 200, {
            success: true,
            token: `tok_live_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            usuario: {
              id: user.id,
              nombre_completo: user.name,
              email: user.email,
              rol: user.role,
              plan: user.plan,
              campana_id: user.campana_id,
            },
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
              planTier: user.planTier,
              plan: user.plan,
              campana_id: user.campana_id,
            },
          });
        }

        // 2.2 ASCENSO DE SUSCRIPCIÓN (PLAN FREE -> CAMPAÑA DE PAGO)
        if (req.method === 'POST' && (url === '/api/v1/campana/upgrade/' || url === '/api/campana/upgrade/')) {
          const body = await parseJsonBody(req);
          const email = (body.email || '').trim().toLowerCase();
          const tipoPlan = (body.tipo_plan || body.plan || 'COMUNAL').toUpperCase();

          const users = readUsers();
          const userIdx = users.findIndex((u) => u.email.toLowerCase() === email);

          if (userIdx === -1) {
            return sendJsonResponse(res, 404, {
              success: false,
              error: 'Usuario no encontrado para ascender de plan.',
            });
          }

          const planCode = ['COMUNAL', 'MUNICIPAL', 'DEPARTAMENTAL'].includes(tipoPlan) ? tipoPlan : 'COMUNAL';
          const planSpecs: Record<string, any> = {
            COMUNAL: {
              codigo: 'COMUNAL',
              nombre: 'Campaña Comunal',
              limite_encuestadores: 15,
              limite_pines: 10000,
            },
            MUNICIPAL: {
              codigo: 'MUNICIPAL',
              nombre: 'Campaña Municipal',
              limite_encuestadores: 50,
              limite_pines: 50000,
            },
            DEPARTAMENTAL: {
              codigo: 'DEPARTAMENTAL',
              nombre: 'Campaña Departamental',
              limite_encuestadores: 200,
              limite_pines: 250000,
            },
          };

          const planObj = planSpecs[planCode];
          users[userIdx].role = 'ADMIN_CAMPANA';
          users[userIdx].planTier = planCode;
          users[userIdx].plan = planObj;
          users[userIdx].campana_id = users[userIdx].campana_id || `camp_${Date.now()}`;
          saveUsers(users);

          return sendJsonResponse(res, 200, {
            success: true,
            mensaje: `Suscripción ascendida exitosamente a ${planObj.nombre}. Pines históricos conservados y parámetros operativos listos.`,
            usuario: {
              id: users[userIdx].id,
              nombre_completo: users[userIdx].name,
              email: users[userIdx].email,
              rol: 'ADMIN_CAMPANA',
              plan: planObj,
              campana_id: users[userIdx].campana_id,
            },
            user: {
              id: users[userIdx].id,
              name: users[userIdx].name,
              email: users[userIdx].email,
              phone: users[userIdx].phone,
              role: 'ADMIN_CAMPANA',
              planTier: planCode,
              plan: planObj,
              campana_id: users[userIdx].campana_id,
            },
          });
        }

        // 2.5 ESTADO DE CONFIGURACIÓN SMTP
        if (req.method === 'GET' && (url === '/api/v1/auth/smtp-status/' || url === '/api/auth/smtp-status/')) {
          const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
          return sendJsonResponse(res, 200, {
            configured: isConfigured,
            user: process.env.SMTP_USER || '',
          });
        }

        // 3. SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA (SOPORTE MODO CONSOLA Y SMTP NATIVO)
        if (req.method === 'POST' && (url === '/api/v1/auth/password/solicitar/' || url === '/api/auth/password/solicitar/')) {
          const body = await parseJsonBody(req);
          const email = (body.email || '').trim().toLowerCase();
          const submittedPass = (body.smtp_pass || body.app_password || '').trim();

          if (!email || !email.includes('@')) {
            return sendJsonResponse(res, 400, {
              success: false,
              detail: 'Por favor ingresa un correo electrónico válido.',
              error: 'Por favor ingresa un correo electrónico válido.',
            });
          }

          // Si el usuario proporcionó la contraseña de aplicación de Gmail, guardarla
          if (submittedPass) {
            saveSmtpConfig({ pass: submittedPass, user: email, backend: 'smtp' });
          }

          // Respuesta genérica por seguridad
          const mensajeExito = "Si el correo está registrado, recibirás un código de recuperación en breve.";

          // 1. Verificar si el usuario existe registrado
          const users = readUsers();
          const user = users.find((u) => u.email.toLowerCase() === email);

          if (!user) {
            return sendJsonResponse(res, 200, {
              success: true,
              detail: mensajeExito,
              mensaje: mensajeExito,
            });
          }

          // 2. Generar código numérico de 6 dígitos
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

          // Guardar OTP con validez de 15 minutos
          const otps = readOtps();
          otps[email] = {
            code: otpCode,
            email: email,
            expiresAt: Date.now() + 15 * 60 * 1000,
            verified: false,
          };
          saveOtps(otps);

          // Obtener configuración de backend (console o smtp)
          const smtpConfig = readSmtpConfig();
          const emailBackend = (smtpConfig.backend || process.env.EMAIL_BACKEND || process.env.DJANGO_EMAIL_BACKEND || 'console').trim().toLowerCase();

          // 3A. Modo Consola: Imprimir el código OTP directamente en la terminal para desarrollo/pruebas
          if (emailBackend === 'console') {
            console.log(`
================================================================================
[MODO CONSOLA - EMAIL OTP VOTALITY]
Para:     ${email}
Asunto:   Código de recuperación: ${otpCode} - Votality
Mensaje:  Hola ${user.name || 'Usuario'},
          Tu código de recuperación es: ${otpCode}
          Tiene una vigencia de 15 minutos.
================================================================================
`);
            return sendJsonResponse(res, 200, {
              success: true,
              detail: mensajeExito,
              mensaje: mensajeExito,
              email: email,
              expira_en_minutos: 15,
              correo_enviado: true,
              console_mode: true,
            });
          }

          // 3B. Modo SMTP: Envío real a través de Gmail / Servidor SMTP
          const smtpUser = smtpConfig.user || process.env.SMTP_USER || email;
          const smtpPass = smtpConfig.pass || process.env.SMTP_PASS || '';

          const asunto = `Código de recuperación: ${otpCode} - Votality`;
          const cuerpo = `Hola ${user.name || 'Usuario'},\n\nTu código de recuperación es: ${otpCode}\n\nTiene una vigencia de 15 minutos.`;

          try {
            if (!smtpPass) {
              throw new Error("Contraseña de aplicación de Gmail no configurada (SMTP_PASS vacío en .env). Configúrala o cambia EMAIL_BACKEND=console.");
            }

            const transporter = nodemailer.createTransport({
              host: smtpConfig.host || process.env.SMTP_HOST || 'smtp.gmail.com',
              port: Number(smtpConfig.port || process.env.SMTP_PORT || 465),
              secure: (smtpConfig.secure !== false && (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true'),
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            });

            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>Código de Seguridad VOTALITY</title>
              </head>
              <body style="background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px;">
                <div style="max-width: 520px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 32px;">
                  <div style="border-bottom: 1px solid #262626; padding-bottom: 20px; margin-bottom: 24px;">
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 3px; margin: 0; text-transform: uppercase;">VOTALITY</h1>
                    <p style="color: #737373; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px;">Sistema de Inteligencia Electoral & Geoespacial</p>
                  </div>
                  <p style="color: #d4d4d4; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                    Hola <strong>${user.name || 'Usuario'}</strong>, has solicitado restablecer tu contraseña en Votality.
                  </p>
                  <p style="color: #d4d4d4; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                    Tu código de seguridad de 6 dígitos es:
                  </p>
                  <div style="background-color: #000000; border: 1px solid #404040; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; display: inline-block;">
                      ${otpCode}
                    </span>
                  </div>
                  <p style="color: #a3a3a3; font-size: 12px; line-height: 18px; margin: 0 0 16px 0;">
                    • Este código es de un solo uso y expirará en <strong>15 minutos</strong>.<br/>
                    • Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
                  </p>
                  <div style="border-top: 1px solid #262626; padding-top: 20px; margin-top: 28px; text-align: center;">
                    <p style="color: #525252; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                      © VOTALITY · Plataforma SIG Territorial
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `;

            await transporter.sendMail({
              from: process.env.SMTP_FROM || `"Votality" <${smtpUser}>`,
              to: email,
              subject: asunto,
              text: cuerpo,
              html: htmlContent,
            });

            console.log(`[SMTP SUCCESS] Código de recuperación enviado exitosamente a ${email}`);

            return sendJsonResponse(res, 200, {
              success: true,
              detail: mensajeExito,
              mensaje: mensajeExito,
              email: email,
              expira_en_minutos: 15,
              correo_enviado: true,
            });
          } catch (e: any) {
            console.error(`Error despachando correo SMTP: ${e?.message || e}`);
            return sendJsonResponse(res, 500, {
              detail: "Error de conexión con el servidor de correo. Verifica la configuración SMTP.",
              debug_error: e?.message || String(e),
              success: false,
              error: "Error de conexión con el servidor de correo. Verifica la configuración SMTP.",
            });
          }
        }

        // 4. VERIFICACIÓN DE CÓDIGO OTP
        if (req.method === 'POST' && (url === '/api/v1/auth/password/verificar/' || url === '/api/auth/password/verificar/')) {
          const body = await parseJsonBody(req);
          const email = (body.email || '').trim().toLowerCase();
          const codigo = (body.codigo || body.code || '').trim();

          if (!email || !codigo || codigo.length !== 6) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'Ingresa el código completo de 6 dígitos.',
            });
          }

          const otps = readOtps();
          const record = otps[email];

          if (!record) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'No hay ninguna solicitud de recuperación activa para este correo. Solicita un nuevo código.',
            });
          }

          if (Date.now() > record.expiresAt) {
            delete otps[email];
            saveOtps(otps);
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'El código ha expirado (validez de 15 minutos). Por favor solicita uno nuevo.',
            });
          }

          if (record.code !== codigo) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'El código ingresado es incorrecto. Verifica el código recibido en tu Gmail.',
            });
          }

          record.verified = true;
          saveOtps(otps);

          return sendJsonResponse(res, 200, {
            success: true,
            mensaje: 'Código verificado correctamente. Ahora puedes definir tu nueva contraseña.',
          });
        }

        // 5. RESTABLECER CONTRASEÑA DEFINITIVA
        if (req.method === 'POST' && (url === '/api/v1/auth/password/restablecer/' || url === '/api/auth/password/restablecer/')) {
          const body = await parseJsonBody(req);
          const email = (body.email || '').trim().toLowerCase();
          const codigo = (body.codigo || body.code || '').trim();
          const nuevaClave = (body.nueva_clave || body.nueva_contrasena || body.newPassword || '').trim();

          if (!email || !nuevaClave || nuevaClave.length < 6) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'La nueva contraseña debe tener al menos 6 caracteres.',
            });
          }

          const otps = readOtps();
          const record = otps[email];

          if (!record || record.code !== codigo) {
            return sendJsonResponse(res, 400, {
              success: false,
              error: 'Código inválido o sesión de recuperación no autorizada.',
            });
          }

          const users = readUsers();
          const userIdx = users.findIndex((u) => u.email.toLowerCase() === email);

          if (userIdx === -1) {
            return sendJsonResponse(res, 404, {
              success: false,
              error: 'Usuario no encontrado.',
            });
          }

          // Actualizar contraseña
          users[userIdx].password = nuevaClave;
          saveUsers(users);

          // Consumir e invalidar código OTP
          delete otps[email];
          saveOtps(otps);

          return sendJsonResponse(res, 200, {
            success: true,
            mensaje: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
          });
        }

        // =========================================================================
        // GESTIÓN DE ENCUESTAS (SURVEY RECORDS / PADRÓN DE ENCUESTADOS)
        // =========================================================================

        // GET /api/v1/surveys/ o /api/surveys/ -> Listar encuestas privadas por cuenta/campaña
        if (req.method === 'GET' && (url.startsWith('/api/v1/surveys') || url.startsWith('/api/surveys'))) {
          const list = readSurveys();
          const parsedUrl = new URL(req.url || '', 'http://localhost');
          const campaignFilter = parsedUrl.searchParams.get('campaignId') || (req.headers['x-campaign-id'] as string);

          const filtered = campaignFilter
            ? list.filter((s) => s.campaignId === campaignFilter || (!s.campaignId && campaignFilter === 'camp-votality-2026'))
            : list;

          return sendJsonResponse(res, 200, {
            success: true,
            results: filtered,
          });
        }

        // POST /api/v1/surveys/ o /api/surveys/ -> Crear encuesta privada en la campaña correspondiente
        if (req.method === 'POST' && (url.startsWith('/api/v1/surveys') || url.startsWith('/api/surveys'))) {
          const body = await parseJsonBody(req);
          const list = readSurveys();
          const campaignId = body.campaignId || (req.headers['x-campaign-id'] as string) || 'camp-votality-2026';
          const newSurvey = {
            id: body.id || `pin-${Date.now().toString(36)}`,
            campaignId,
            name: (body.name || '').trim(),
            address: (body.address || '').trim(),
            lat: typeof body.lat === 'number' ? body.lat : parseFloat(body.lat || 0),
            lng: typeof body.lng === 'number' ? body.lng : parseFloat(body.lng || 0),
            answers: body.answers || {},
            surveyorId: body.surveyorId || 'admin-001',
            surveyorName: body.surveyorName || 'Director de Campaña',
            censusSector: body.censusSector || '',
            createdAt: body.createdAt || new Date().toISOString(),
          };

          list.unshift(newSurvey);
          saveSurveys(list);

          return sendJsonResponse(res, 201, {
            success: true,
            data: newSurvey,
          });
        }

        // PUT /api/v1/surveys/:id o /api/surveys/:id -> Actualizar encuesta
        const updateSurveyMatch = url.match(/^\/api\/(?:v1\/)?surveys\/([^\/]+)\/?$/);
        if (req.method === 'PUT' && updateSurveyMatch) {
          const surveyId = updateSurveyMatch[1];
          const body = await parseJsonBody(req);
          const list = readSurveys();
          const idx = list.findIndex((s) => String(s.id) === String(surveyId));

          if (idx === -1) {
            return sendJsonResponse(res, 404, {
              success: false,
              error: 'Encuesta no encontrada en la base de datos.',
            });
          }

          const existing = list[idx];
          const updated = {
            ...existing,
            ...body,
            id: existing.id, // ID inmutable
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          };

          // Actualizar answers si vinieron campos base
          if (body.name) updated.name = body.name.trim();
          if (body.address) updated.address = body.address.trim();
          if (body.censusSector !== undefined) updated.censusSector = body.censusSector;
          if (body.answers) {
            updated.answers = {
              ...existing.answers,
              ...body.answers,
              nombre: updated.name,
              direccion: updated.address,
            };
          }

          list[idx] = updated;
          saveSurveys(list);

          return sendJsonResponse(res, 200, {
            success: true,
            data: updated,
            mensaje: 'Encuesta actualizada correctamente.',
          });
        }

        // DELETE /api/v1/surveys/:id o /api/surveys/:id -> Eliminar definitivamente de la base de datos
        if (req.method === 'DELETE' && updateSurveyMatch) {
          const surveyId = updateSurveyMatch[1];
          const list = readSurveys();
          const filtered = list.filter((s) => String(s.id) !== String(surveyId));

          saveSurveys(filtered);

          return sendJsonResponse(res, 200, {
            success: true,
            deletedId: surveyId,
            mensaje: 'Encuesta eliminada permanentemente de la base de datos.',
          });
        }

        next();
      });
    },
  };
}

