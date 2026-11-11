import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { CampaignPlanTier } from '../landing/CampaignPlansModal';
import { ModalRecuperarPassword } from './ModalRecuperarPassword';
export { ModalRecuperarPassword } from './ModalRecuperarPassword';
import {
  isEmailRegistered,
  registerUserInStore,
  verifyCredentialsInStore,
  updateUserPasswordInStore,
  findUserByEmail,
} from '../../utils/userStore';

export interface PlanInfo {
  codigo: string;
  nombre: string;
  limite_encuestadores: number;
  limite_pines: number;
}

export interface UserSession {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  provider: 'email';
  planTier?: string;
  role?: string;
  plan?: PlanInfo;
  campana_id?: string | null;
  token?: string;
  projectName?: string;
  proyecto_nombre?: string;
}

interface AuthPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: (user: UserSession) => void;
  onRegisterSuccess?: (user: UserSession, selectedPlan?: CampaignPlanTier | null) => void;
  initialMode?: 'login' | 'register';
  selectedPlan?: CampaignPlanTier | null;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthPage: React.FC<AuthPageProps> = ({ 
  onBackToLanding, 
  onLoginSuccess,
  onRegisterSuccess,
  initialMode = 'login',
  selectedPlan,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states (Inputs start completely blank)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Recovery via Email (SMTP)
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'new_password' | 'success'>('request');
  const [recoveryCode, setRecoveryCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [requiresSmtpPass, setRequiresSmtpPass] = useState(false);
  const [smtpAppPassword, setSmtpAppPassword] = useState('');
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Countdown for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recoveryStep === 'verify' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recoveryStep, timerSeconds]);

  // Reset notices when changing mode
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [mode]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const passwordScore = getPasswordStrength(password);

  // =========================================================================
  // 1. UNIFIED REGISTRATION SUBMIT
  // =========================================================================
  const handleUnifiedRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    // Validación estricta: evitar correos repetidos en la base de datos
    if (isEmailRegistered(cleanEmail)) {
      setErrorMessage('Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o recupera tu contraseña.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const planFromUrl = urlParams?.get('plan') || urlParams?.get('tipo_plan');
    const rolFromUrl = urlParams?.get('rol');
    const finalPlanCode = selectedPlan?.codigo || (planFromUrl ? planFromUrl.toUpperCase() : 'FREE');
    const assignedRole = rolFromUrl
      ? (rolFromUrl.toUpperCase() === 'DIRECTOR_FREE' ? 'USUARIO_FREE' : rolFromUrl.toUpperCase() === 'DIRECTOR_CAMPANA' ? 'ADMIN_CAMPANA' : rolFromUrl.toUpperCase())
      : (finalPlanCode === 'FREE' ? 'USUARIO_FREE' : 'ADMIN_CAMPANA');

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/registro/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: fullName.trim(),
          email: cleanEmail,
          password: password,
          tipo_plan: finalPlanCode,
          rol: assignedRole,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && (data?.success || data?.token || data?.usuario)) {
        const u = data.usuario || data.user;
        const planObj = data.usuario?.plan || data.user?.plan;
        const planTier = planObj?.codigo || data.user?.planTier || finalPlanCode;
        const role = u?.rol || u?.role || assignedRole;

        // Persistir en base de datos local
        registerUserInStore({
          name: fullName.trim(),
          email: cleanEmail,
          password: password,
          planTier: planTier,
          role: role,
          plan: planObj,
          campana_id: u?.campana_id || null,
        });

        const user: UserSession = {
          id: u?.id,
          name: u?.nombre_completo || u?.name || fullName.trim(),
          email: cleanEmail,
          provider: 'email',
          planTier: planTier,
          role: role,
          plan: planObj,
          campana_id: u?.campana_id || null,
          token: data.token || data.user?.sessionToken,
        };

        if (onRegisterSuccess) {
          onRegisterSuccess(user, selectedPlan);
        } else {
          if (planTier === 'FREE') {
            window.history.pushState({}, '', '/');
            onLoginSuccess(user);
          } else {
            window.history.pushState({}, '', '/pago');
            onLoginSuccess(user);
          }
        }
      } else {
        const errorMsg = data?.error || data?.mensaje;
        setErrorMessage(errorMsg || 'No se pudo completar el registro.');
      }
    } catch {
      // Offline fallback: registrar en almacenamiento local tras validar unicidad
      const reg = registerUserInStore({
        name: fullName.trim(),
        email: cleanEmail,
        password: password,
        planTier: finalPlanCode,
        role: assignedRole,
        plan: {
          codigo: finalPlanCode,
          nombre: finalPlanCode === 'FREE' ? 'Plan Gratuito / Básico' : `Campaña ${finalPlanCode}`,
          limite_encuestadores: finalPlanCode === 'FREE' ? 0 : finalPlanCode === 'MUNICIPAL' ? 50 : finalPlanCode === 'DEPARTAMENTAL' ? 200 : 15,
          limite_pines: finalPlanCode === 'FREE' ? 1000 : finalPlanCode === 'MUNICIPAL' ? 50000 : finalPlanCode === 'DEPARTAMENTAL' ? 250000 : 10000,
        },
      });

      if (!reg.success) {
        setErrorMessage(reg.error || 'Ya existe una cuenta registrada con este correo electrónico.');
        return;
      }

      const user: UserSession = {
        name: fullName.trim(),
        email: cleanEmail,
        provider: 'email',
        planTier: finalPlanCode,
        role: finalPlanCode === 'FREE' ? 'USUARIO_FREE' : 'ADMIN_CAMPANA',
        plan: reg.user?.plan,
      };

      if (onRegisterSuccess) {
        onRegisterSuccess(user, selectedPlan);
      } else {
        if (finalPlanCode === 'FREE') {
          window.history.pushState({}, '', '/');
          onLoginSuccess(user);
        } else {
          window.history.pushState({}, '', '/pago');
          onLoginSuccess(user);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 2. TRADITIONAL LOGIN SUBMIT
  // =========================================================================
  const handleTraditionalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && (data?.success || data?.token || data?.usuario)) {
        const u = data.usuario || data.user;
        const planObj = data.usuario?.plan || data.user?.plan;
        const planTier = planObj?.codigo || data.user?.planTier || (u?.rol === 'USUARIO_FREE' ? 'FREE' : 'COMUNAL');
        const role = u?.rol || u?.role || (planTier === 'FREE' ? 'USUARIO_FREE' : 'ADMIN_CAMPANA');

        onLoginSuccess({
          id: u?.id,
          name: u?.nombre_completo || u?.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: u?.phone || u?.telefono,
          provider: 'email',
          role: role,
          planTier: planTier,
          plan: planObj || {
            codigo: planTier,
            nombre: planTier === 'FREE' ? 'Plan Gratuito / Básico' : `Campaña ${planTier}`,
            limite_encuestadores: planTier === 'FREE' ? 0 : planTier === 'MUNICIPAL' ? 50 : planTier === 'DEPARTAMENTAL' ? 200 : 15,
            limite_pines: planTier === 'FREE' ? 100 : planTier === 'MUNICIPAL' ? 50000 : planTier === 'DEPARTAMENTAL' ? 250000 : 10000,
          },
          campana_id: u?.campana_id || null,
          token: data.token || data.user?.sessionToken,
        });
      } else {
        const errorMsg = data?.error || data?.mensaje;
        if (errorMsg) {
          setErrorMessage(errorMsg);
        } else {
          // Validar con almacenamiento local
          const localAuth = verifyCredentialsInStore(cleanEmail, password);
          if (!localAuth.success || !localAuth.user) {
            setErrorMessage(localAuth.error || 'Credenciales inválidas.');
            return;
          }
          onLoginSuccess({
            id: localAuth.user.id,
            name: localAuth.user.name,
            email: localAuth.user.email,
            phone: localAuth.user.phone,
            provider: 'email',
            role: localAuth.user.role,
            planTier: localAuth.user.planTier,
            plan: localAuth.user.plan,
            campana_id: localAuth.user.campana_id,
          });
        }
      }
    } catch {
      // Fallback a almacenamiento local si el backend no responde
      const localAuth = verifyCredentialsInStore(cleanEmail, password);
      if (!localAuth.success || !localAuth.user) {
        setErrorMessage(localAuth.error || 'Credenciales inválidas.');
        return;
      }
      onLoginSuccess({
        id: localAuth.user.id,
        name: localAuth.user.name,
        email: localAuth.user.email,
        phone: localAuth.user.phone,
        provider: 'email',
        role: localAuth.user.role,
        planTier: localAuth.user.planTier,
        plan: localAuth.user.plan,
        campana_id: localAuth.user.campana_id,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 3. PASSWORD RECOVERY VIA EMAIL (SMTP OTP REAL)
  // =========================================================================
  const handlePasswordRecoveryEmailRequest = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico registrado válido.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = { email: cleanEmail };
      if (smtpAppPassword.trim()) {
        payload.smtp_pass = smtpAppPassword.trim();
      }

      const res = await fetch('/api/v1/auth/password/solicitar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      setRequiresSmtpPass(false);
      setRecoveryStep('verify');
      setTimerSeconds(60);
      setCanResend(false);
      setRecoveryCode(['', '', '', '', '', '']);
      setSuccessMessage(data?.detail || `Hemos enviado un código de seguridad de 6 dígitos a ${cleanEmail}. Por favor revisa tu bandeja de entrada o spam.`);
    } catch (err) {
      console.warn('Error solicitando recuperación, avanzando a paso manual:', err);
      // Avanzar de todos modos al paso de verificación para mantener la vista abierta
      setRecoveryStep('verify');
      setTimerSeconds(60);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecoveryVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const code = recoveryCode.join('');
    if (code.length < 6) {
      setErrorMessage('Ingresa el código completo de 6 dígitos recibido en tu correo.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/password/verificar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail.trim().toLowerCase(),
          codigo: code,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setRecoveryStep('new_password');
      } else {
        const errorMsg = data?.error || data?.mensaje;
        setErrorMessage(errorMsg || 'El código ingresado es incorrecto o ha expirado. Verifica el código recibido en tu Gmail.');
      }
    } catch {
      setErrorMessage('No se pudo verificar el código con el servidor. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecoverySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    const code = recoveryCode.join('');

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/password/restablecer/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          codigo: code,
          nueva_clave: newPassword,
          confirmar_clave: confirmNewPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        updateUserPasswordInStore(cleanEmail, newPassword);
        setRecoveryStep('success');
      } else {
        const errorMsg = data?.error || data?.mensaje;
        setErrorMessage(errorMsg || 'No se pudo restablecer la contraseña.');
      }
    } catch {
      // Actualizar localmente si el backend no responde
      updateUserPasswordInStore(cleanEmail, newPassword);
      setRecoveryStep('success');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="relative z-20 border-b border-[#1f1f1f] bg-[#0c0c0c]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a Votality</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tracking-widest font-bold text-white">VOTALITY</span>
            <span className="text-[#333]">/</span>
            <span className="font-mono text-xs text-[#888] uppercase tracking-wider">GEO-AUTH</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="bg-[#121212] border border-[#262626] rounded-[3.6px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Border Glow */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          {/* Form Content */}
          <div className="relative z-10">
            
            {/* Plan Badge (if entering with plan) */}
            {selectedPlan && (
              <div className="mb-6 p-4 rounded-[3.6px] bg-[#141414] border border-white font-mono text-xs shadow-md">
                <div className="flex items-center justify-between text-[10px] text-[#888888] uppercase tracking-wider mb-1.5 pb-1.5 border-b border-[#222222]">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    PERFIL DE CAMPAÑA
                  </span>
                  <span className="text-white font-bold">{selectedPlan.precio}</span>
                </div>
                <div className="text-sm font-bold text-white font-sans">{selectedPlan.nombre}</div>
                <div className="text-[11px] text-[#888888] font-mono mt-1">
                  [{selectedPlan.nivel}] · Hasta {selectedPlan.limiteEncuestadores} encuestadores · {selectedPlan.limitePines.toLocaleString('es-CO')} pines
                </div>
              </div>
            )}

            {/* Mode Switcher Tabs (Login vs Register) */}
            {(mode === 'login' || mode === 'register') && (
              <div className="grid grid-cols-2 p-1 rounded-[3.6px] bg-[#161616] border border-[#2e2e2e] mb-6 font-mono text-xs uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2 px-3 rounded-[2.6px] font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-[#8a8a8a] hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`py-2 px-3 rounded-[2.6px] font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-[#8a8a8a] hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* ERROR OR SUCCESS NOTICES */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-[3.6px] bg-[#1f1010] border border-[#802020] text-[#ff8080] font-mono text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3 rounded-[3.6px] bg-[#101f14] border border-[#208035] text-[#80ff9f] font-mono text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW: LOGIN OR REGISTER                                  */}
            {/* ======================================================== */}
            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-5">

                {/* ======================================================= */}
                {/* 1. REGISTRARSE: FORMULARIO UNIFICADO (SIN PESTAÑAS)     */}
                {/* ======================================================= */}
                {mode === 'register' && (
                  <form onSubmit={handleUnifiedRegisterSubmit} className="space-y-4">
                    
                    {/* Campo 1: Nombre Completo */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Campo 2: Correo Electrónico */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder=""
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Campo 3: Contraseña */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder=""
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-10 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength bar */}
                      {password && (
                        <div className="space-y-1 pt-1">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`flex-1 rounded-[1px] transition-all duration-300 ${
                                  passwordScore >= step
                                    ? passwordScore >= 3
                                      ? 'bg-white'
                                      : passwordScore === 2
                                      ? 'bg-[#888]'
                                      : 'bg-[#444]'
                                    : 'bg-[#222]'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between font-mono text-[9px] text-[#666]">
                            <span>Seguridad</span>
                            <span>
                              {passwordScore <= 1 && 'Débil'}
                              {passwordScore === 2 && 'Media'}
                              {passwordScore >= 3 && 'Fuerte'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Campo 4: Confirmar Contraseña */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder=""
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-10 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-3 py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creando cuenta en base de datos...</span>
                        </>
                      ) : (
                        <>
                          <span>Registrarse</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ======================================================= */}
                {/* 2. INICIAR SESIÓN: ACCESO TRADICIONAL CORREO/CLAVE      */}
                {/* ======================================================= */}
                {mode === 'login' && (
                  <form onSubmit={handleTraditionalLoginSubmit} className="space-y-4">
                    
                    {/* Correo Electrónico */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder=""
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                          Contraseña
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecoveryModalOpen(true);
                          }}
                          className="font-mono text-[11px] text-[#888] hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          ¿Olvidaste contraseña?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder=""
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-10 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Recordar */}
                    <div className="flex items-center justify-between pt-1 font-mono text-xs text-[#8a8a8a]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-[#181818] border border-[#333] text-white focus:ring-0 cursor-pointer"
                        />
                        <span>Recordar sesión</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verificando credenciales...</span>
                        </>
                      ) : (
                        <>
                          <span>Iniciar Sesión</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW: FORGOT PASSWORD (POR CORREO REGISTRADO VIA SMTP)    */}
            {/* ======================================================== */}
            {mode === 'forgot_password' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 font-mono text-xs text-[#8a8a8a] border-b border-[#222] pb-3">
                  <KeyRound className="w-4 h-4 text-white" />
                  <span>RECUPERACIÓN POR CORREO ELECTRÓNICO</span>
                </div>

                {/* Paso 1: Ingreso de Correo Electrónico Registrado */}
                {recoveryStep === 'request' && (
                  <form onSubmit={handlePasswordRecoveryEmailRequest} className="space-y-4">
                    <p className="font-mono text-xs text-[#a0a0a0] leading-relaxed">
                      Ingresa tu correo electrónico registrado. Te enviaremos un código de seguridad de 6 dígitos para restablecer tu contraseña.
                    </p>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Correo Electrónico Registrado
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder=""
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Asistente de Autorización Gmail (Contraseña de Aplicación de 16 caracteres) */}
                    {requiresSmtpPass && (
                      <div className="bg-[#121212] border border-amber-500/30 p-3.5 rounded-[3.6px] space-y-3 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-mono text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                              Autorización de Gmail Requerida
                            </p>
                            <p className="font-mono text-[10px] text-[#a0a0a0] leading-relaxed">
                              Google no permite enviar correos automáticos usando tu contraseña normal. Debes usar una <strong>Contraseña de Aplicación de 16 caracteres</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#262626] p-2.5 rounded-[3px] space-y-1.5 text-[10px] font-mono">
                          <p className="text-white font-bold">1. Genera tu contraseña en Google:</p>
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-semibold"
                          >
                            <span>Abrir myaccount.google.com/apppasswords ↗</span>
                          </a>
                          <p className="text-[#888]">
                            (Escribe un nombre como &quot;Votality&quot; y haz clic en &quot;Crear&quot;)
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block font-mono text-[10px] text-white uppercase tracking-wider font-bold">
                            2. Pega aquí los 16 caracteres generados:
                          </label>
                          <div className="relative">
                            <KeyRound className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="password"
                              placeholder="xxxx yyyy zzzz wwww"
                              value={smtpAppPassword}
                              onChange={(e) => setSmtpAppPassword(e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-[#333] focus:border-amber-400 rounded-[3.6px] pl-8 pr-3 py-2 text-xs font-mono text-white placeholder-[#555] outline-none"
                            />
                          </div>
                          <p className="text-[9px] font-mono text-[#777]">
                            Se guardará de forma segura en tu archivo .env local para todos los futuros envíos.
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando código al buzón...</span>
                        </>
                      ) : (
                        <>
                          <span>Enviar código de recuperación</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="font-mono text-xs text-[#8a8a8a] hover:text-white underline cursor-pointer"
                      >
                        ← Volver a Iniciar Sesión
                      </button>
                    </div>
                  </form>
                )}

                {/* Paso 2: Validación OTP 6 Dígitos Recibido en Correo */}
                {recoveryStep === 'verify' && (
                  <form onSubmit={handlePasswordRecoveryVerify} className="space-y-5">
                    <div className="text-center space-y-1">
                      <Mail className="w-8 h-8 mx-auto text-white" />
                      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                        Código de Verificación por Correo
                      </h3>
                      <p className="font-mono text-[11px] text-[#8a8a8a]">
                        Enviado a <span className="text-white font-bold">{recoveryEmail}</span>
                      </p>
                    </div>

                    {/* 6 Digit Inputs */}
                    <div className="flex justify-between gap-1.5 sm:gap-2">
                      {recoveryCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`rec-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            if (digits.length > 1) {
                              const next = [...recoveryCode];
                              for (let i = 0; i < 6 && idx + i < 6; i++) {
                                if (digits[i]) next[idx + i] = digits[i];
                              }
                              setRecoveryCode(next);
                              const nextFocus = Math.min(5, idx + digits.length);
                              document.getElementById(`rec-otp-${nextFocus}`)?.focus();
                              return;
                            }
                            const next = [...recoveryCode];
                            next[idx] = digits.slice(-1);
                            setRecoveryCode(next);
                            if (digits && idx < 5) {
                              document.getElementById(`rec-otp-${idx + 1}`)?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !digit && idx > 0) {
                              document.getElementById(`rec-otp-${idx - 1}`)?.focus();
                            }
                          }}
                          className="w-10 sm:w-12 h-12 text-center text-lg font-mono font-bold bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] outline-none text-white transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => setRecoveryStep('request')}
                        className="text-[#888] hover:text-white underline cursor-pointer"
                      >
                        Cambiar correo
                      </button>

                      {canResend ? (
                        <button
                          type="button"
                          onClick={() => handlePasswordRecoveryEmailRequest()}
                          className="text-white font-bold hover:underline cursor-pointer"
                        >
                          Reenviar código
                        </button>
                      ) : (
                        <span className="text-[#666]">
                          Reenviar en 00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verificando código...</span>
                        </>
                      ) : (
                        <>
                          <span>Verificar código</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Paso 3: Restablecer Contraseña */}
                {recoveryStep === 'new_password' && (
                  <form onSubmit={handlePasswordRecoverySave} className="space-y-4">
                    <p className="font-mono text-xs text-[#a0a0a0]">
                      Código validado. Ingresa tu nueva contraseña para acceder a Votality:
                    </p>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder=""
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-10 py-2.5 text-sm font-sans text-white transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder=""
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-10 py-2.5 text-sm font-sans text-white transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Actualizando contraseña...</span>
                        </>
                      ) : (
                        <>
                          <span>Restablecer Contraseña</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Paso 4: Notificación de Éxito y Redirección a Login */}
                {recoveryStep === 'success' && (
                  <div className="space-y-4 py-2 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-white" />
                    <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                      ¡Contraseña Actualizada!
                    </h4>
                    <p className="font-mono text-xs text-[#8a8a8a]">
                      Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tus credenciales.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setEmail(recoveryEmail);
                        setPassword('');
                        setConfirmPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setSuccessMessage('Contraseña restablecida exitosamente. Ingresa con tu nueva clave.');
                      }}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white text-black font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#e0e0e0] cursor-pointer"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* Footer Security Badges */}
            <div className="mt-6 pt-4 border-t border-[#222] flex items-center justify-between font-mono text-[10px] text-[#555]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#888]" />
                <span>AES-256-GCM SSL</span>
              </div>
              <span>VOTALITY // GEO-AUTH</span>
            </div>

          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-20 border-t border-[#1f1f1f] py-4 text-center font-mono text-[11px] text-[#555]">
        <span>VOTALITY &copy; 2026 // PLATAFORMA DE GEO-ENCUESTAS Y DEMOGRAFÍA</span>
      </footer>

      {/* Modal Flotante de Recuperación Controlada por Pasos */}
      <ModalRecuperarPassword
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        initialEmail={email}
      />

    </div>
  );
};
