import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  KeyRound,
  HelpCircle,
  Smartphone
} from 'lucide-react';

export interface UserSession {
  name: string;
  email?: string;
  phone?: string;
  provider: 'google' | 'phone' | 'email';
}

interface AuthPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: (user: UserSession) => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'forgot_email';
type LoginMethod = 'email' | 'phone';

const COUNTRY_CODES = [
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+1', country: 'EE. UU. / Canadá', flag: '🇺🇸' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ 
  onBackToLanding, 
  onLoginSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [method, setMethod] = useState<LoginMethod>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Phone auth states
  const [selectedCountry, setSelectedCountry] = useState('+57');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Recovery states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'new_password' | 'success'>('request');
  const [recoveryCode, setRecoveryCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [recoveredEmailResult, setRecoveredEmailResult] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Countdown for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneStep === 'otp' && timerSeconds > 0) {
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
  }, [phoneStep, timerSeconds]);

  // Reset errors when changing mode
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [mode, method]);

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

  // Handle Google Sign-in simulation
  const handleGoogleAuth = (selectedEmail?: string) => {
    setIsLoading(true);
    setShowGoogleModal(false);
    setTimeout(() => {
      setIsLoading(false);
      const userEmail = selectedEmail || 'juandavidparadavargas30@gmail.com';
      const userName = userEmail.split('@')[0].replace(/[0-9]/g, '').replace('.', ' ') || 'Usuario VoxPin';
      onLoginSuccess({
        name: userName.charAt(0).toUpperCase() + userName.slice(1),
        email: userEmail,
        provider: 'google'
      });
    }, 900);
  };

  // Handle Email + Password submit
  const handleEmailAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Por favor ingresa tu nombre completo.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden.');
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const name = mode === 'register' ? fullName : email.split('@')[0];
      onLoginSuccess({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email,
        provider: 'email'
      });
    }, 1000);
  };

  // Handle Phone Submit (Step 1: Request SMS)
  const handlePhoneRequestSms = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setErrorMessage('Por favor ingresa un número de teléfono válido.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPhoneStep('otp');
      setTimerSeconds(45);
      setCanResend(false);
      setSuccessMessage(`Código enviado vía SMS al ${selectedCountry} ${phoneNumber}`);
    }, 800);
  };

  // Handle OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const nextOtp = [...otpCode];
    nextOtp[index] = value;
    setOtpCode(nextOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = otpCode.join('');
    if (code.length < 6) {
      setErrorMessage('Ingresa el código completo de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const name = mode === 'register' && fullName.trim() ? fullName : `Usuario ${phoneNumber.slice(-4)}`;
      onLoginSuccess({
        name,
        phone: `${selectedCountry} ${phoneNumber}`,
        provider: 'phone'
      });
    }, 900);
  };

  // Handle Password Recovery flow
  const handlePasswordRecoveryRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      setErrorMessage('Ingresa el correo electrónico asociado a tu cuenta.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoveryStep('verify');
      setSuccessMessage(`Hemos enviado un código de recuperación a ${recoveryEmail}`);
    }, 900);
  };

  const handlePasswordRecoveryVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = recoveryCode.join('');
    if (code.length < 6) {
      setErrorMessage('Ingresa el código de 6 dígitos recibido.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoveryStep('new_password');
    }, 800);
  };

  const handlePasswordRecoverySave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoveryStep('success');
    }, 800);
  };

  // Handle Email Recovery (Find email by phone)
  const handleEmailRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanPhone = recoveryPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setErrorMessage('Ingresa tu número de teléfono registrado.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoveredEmailResult('juandavidparadavargas30@gmail.com');
      setSuccessMessage('¡Cuenta localizada con éxito en el sistema!');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between selection:bg-white selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Top Bar / Navigation */}
      <header className="relative z-20 border-b border-[#2e2e2e] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={onBackToLanding}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-white rounded-[1px] rotate-45 inline-block shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
              <span className="text-xl font-bold tracking-[-0.03em] text-white font-sans uppercase">
                Voxpin
              </span>
            </div>
            <span className="hidden sm:inline-block font-mono text-[11px] text-[#8a8a8a] tracking-wider uppercase border-l border-[#2e2e2e] pl-3 py-0.5">
              // ACCESO A PLATAFORMA
            </span>
          </div>

          {/* Back button */}
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[3.6px] border border-[#2e2e2e] hover:border-white text-xs font-mono uppercase tracking-wider text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la web</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-[460px]">
          
          {/* Brutalist Frame Card with luminous contour */}
          <div className="relative rounded-[3.6px] bg-[#0e0e0e] border border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.08)] p-6 sm:p-8 backdrop-blur-xl transition-all">
            
            {/* Corner Decorative Crosshairs */}
            <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-white" />
            <span className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-white" />
            <span className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-white" />
            <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-white" />

            {/* Header Badge */}
            <div className="flex items-center justify-between font-mono text-[11px] text-[#8a8a8a] border-b border-[#222222] pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white font-bold tracking-wider">
                  {mode === 'login' && 'INICIAR SESIÓN'}
                  {mode === 'register' && 'REGISTRO DE USUARIO'}
                  {mode === 'forgot_password' && 'RECUPERAR CONTRASEÑA'}
                  {mode === 'forgot_email' && 'RECUPERAR CUENTA'}
                </span>
              </div>
              <span className="text-[#555] tracking-widest">[ID:VOXPIN_SEC]</span>
            </div>

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
            {/* VIEW: LOGIN OR REGISTER */}
            {/* ======================================================== */}
            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-5">
                
                {/* 1. Google One-Click Auth Button */}
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-[3.6px] bg-[#141414] hover:bg-[#1f1f1f] border border-[#333333] hover:border-white text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-3 cursor-pointer group shadow-sm disabled:opacity-50"
                >
                  {/* Google SVG Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>
                    {mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
                  </span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#262626] w-full" />
                  <span className="bg-[#0e0e0e] px-3 font-mono text-[10px] text-[#666666] uppercase tracking-widest shrink-0">
                    O con credenciales
                  </span>
                  <div className="border-t border-[#262626] w-full" />
                </div>

                {/* Method Switch: Correo vs Teléfono */}
                <div className="flex border-b border-[#222] pb-2 font-mono text-xs gap-4">
                  <button
                    type="button"
                    onClick={() => { setMethod('email'); setPhoneStep('input'); }}
                    className={`pb-1 font-semibold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                      method === 'email'
                        ? 'text-white border-b-2 border-white'
                        : 'text-[#666] hover:text-[#aaa]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Correo electrónico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMethod('phone'); setPhoneStep('input'); }}
                    className={`pb-1 font-semibold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                      method === 'phone'
                        ? 'text-white border-b-2 border-white'
                        : 'text-[#666] hover:text-[#aaa]'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Número de teléfono</span>
                  </button>
                </div>

                {/* ================= EMAIL METHOD FORM ================= */}
                {method === 'email' && (
                  <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                    {/* Full Name (Only on Register) */}
                    {mode === 'register' && (
                      <div className="space-y-1.5">
                        <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                          Nombre Completo
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Ej. Juan David Parada"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="tu.correo@voxpin.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                          Contraseña
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setMode('forgot_password'); setRecoveryEmail(email); }}
                            className="font-mono text-[11px] text-[#888] hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            ¿Olvidaste contraseña?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••••••"
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

                      {/* Password strength bar on register */}
                      {mode === 'register' && password && (
                        <div className="pt-1.5 space-y-1">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`flex-1 rounded-[1px] transition-all ${
                                  passwordScore >= level
                                    ? level <= 2
                                      ? 'bg-amber-400'
                                      : 'bg-white'
                                    : 'bg-[#222]'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[10px] text-[#777]">
                            Fuerza: {['Muy corta', 'Débil', 'Media', 'Fuerte', 'Excelente'][passwordScore]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password (Register only) */}
                    {mode === 'register' && (
                      <div className="space-y-1.5">
                        <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                          Confirmar Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Remember me & Forgot Email Link */}
                    {mode === 'login' && (
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#8a8a8a] hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-3.5 h-3.5 rounded bg-[#181818] border border-[#333] text-white focus:ring-0 cursor-pointer"
                          />
                          <span>Recordar sesión</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setMode('forgot_email')}
                          className="font-mono text-[11px] text-[#888] hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          ¿Olvidaste tu correo?
                        </button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <span>{mode === 'login' ? 'Entrar a Voxpin' : 'Crear Cuenta Geoespacial'}</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ================= PHONE METHOD FORM ================= */}
                {method === 'phone' && (
                  <div>
                    {phoneStep === 'input' ? (
                      <form onSubmit={handlePhoneRequestSms} className="space-y-4">
                        {mode === 'register' && (
                          <div className="space-y-1.5">
                            <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                              Nombre Completo
                            </label>
                            <div className="relative">
                              <User className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                required
                                placeholder="Ej. Juan David Parada"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                            Número de Teléfono Móvil
                          </label>
                          <div className="flex gap-2">
                            {/* Country prefix dropdown */}
                            <select
                              value={selectedCountry}
                              onChange={(e) => setSelectedCountry(e.target.value)}
                              className="bg-[#141414] border border-[#2e2e2e] focus:border-white rounded-[3.6px] px-2.5 py-2.5 text-xs font-mono text-white outline-none cursor-pointer"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code} className="bg-[#141414] text-white">
                                  {c.flag} {c.code}
                                </option>
                              ))}
                            </select>

                            {/* Phone Input */}
                            <div className="relative flex-1">
                              <Phone className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="tel"
                                required
                                placeholder="310 123 4567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                              />
                            </div>
                          </div>
                          <span className="font-mono text-[10px] text-[#666]">
                            Te enviaremos un código de seguridad de 6 dígitos vía SMS.
                          </span>
                        </div>

                        {/* Submit Phone SMS */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full mt-2 py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Enviando código...</span>
                            </>
                          ) : (
                            <>
                              <span>Solicitar Código SMS</span>
                              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* PHONE OTP CODE STEP */
                      <form onSubmit={handleVerifyPhoneOtp} className="space-y-5">
                        <div className="text-center space-y-1">
                          <Smartphone className="w-8 h-8 mx-auto text-white" />
                          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                            Código de Verificación SMS
                          </h3>
                          <p className="font-mono text-[11px] text-[#8a8a8a]">
                            Enviado al {selectedCountry} {phoneNumber}
                          </p>
                        </div>

                        {/* 6 Digit Inputs */}
                        <div className="flex justify-between gap-1.5 sm:gap-2">
                          {otpCode.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-input-${idx}`}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !digit && idx > 0) {
                                  const prev = document.getElementById(`otp-input-${idx - 1}`);
                                  if (prev) prev.focus();
                                }
                              }}
                              className="w-10 sm:w-12 h-12 text-center text-lg font-mono font-bold bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] outline-none text-white transition-all"
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <button
                            type="button"
                            onClick={() => setPhoneStep('input')}
                            className="text-[#888] hover:text-white underline cursor-pointer"
                          >
                            Cambiar número
                          </button>

                          {canResend ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTimerSeconds(45);
                                setCanResend(false);
                                setSuccessMessage('Nuevo código SMS enviado.');
                              }}
                              className="text-white font-bold hover:underline cursor-pointer"
                            >
                              Reenviar SMS
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
                              <span>Verificando...</span>
                            </>
                          ) : (
                            <>
                              <span>Verificar e Ingresar</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW: FORGOT PASSWORD RECOVERY */}
            {/* ======================================================== */}
            {mode === 'forgot_password' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 font-mono text-xs text-[#8a8a8a] border-b border-[#222] pb-3">
                  <KeyRound className="w-4 h-4 text-white" />
                  <span>RECUPERACIÓN // REESTABLECER CLAVE</span>
                </div>

                {recoveryStep === 'request' && (
                  <form onSubmit={handlePasswordRecoveryRequest} className="space-y-4">
                    <p className="font-mono text-xs text-[#a0a0a0] leading-relaxed">
                      Ingresa el correo electrónico o número vinculado a tu cuenta. Te enviaremos un código de seguridad para restaurar tu acceso.
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
                          placeholder="usuario@voxpin.com"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
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
                          <span>Enviando código...</span>
                        </>
                      ) : (
                        <>
                          <span>Enviar Código de Recuperación</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {recoveryStep === 'verify' && (
                  <form onSubmit={handlePasswordRecoveryVerify} className="space-y-5">
                    <p className="font-mono text-xs text-[#a0a0a0]">
                      Ingresa el código de 6 dígitos enviado a <strong className="text-white">{recoveryEmail}</strong>:
                    </p>

                    <div className="flex justify-between gap-1.5 sm:gap-2">
                      {recoveryCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`rec-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.slice(-1);
                            const next = [...recoveryCode];
                            next[idx] = val;
                            setRecoveryCode(next);
                            if (val && idx < 5) {
                              const nextInput = document.getElementById(`rec-otp-${idx + 1}`);
                              if (nextInput) nextInput.focus();
                            }
                          }}
                          className="w-10 sm:w-12 h-12 text-center text-lg font-mono font-bold bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] outline-none text-white transition-all"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validando...</span>
                        </>
                      ) : (
                        <>
                          <span>Continuar</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {recoveryStep === 'new_password' && (
                  <form onSubmit={handlePasswordRecoverySave} className="space-y-4">
                    <p className="font-mono text-xs text-[#a0a0a0]">
                      Crea tu nueva contraseña segura para tu cuenta:
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
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-10 py-2.5 text-sm font-sans text-white outline-none"
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

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white hover:bg-[#e0e0e0] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Actualizando...</span>
                        </>
                      ) : (
                        <>
                          <span>Guardar Nueva Contraseña</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {recoveryStep === 'success' && (
                  <div className="text-center space-y-4 py-3">
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                      <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-mono text-sm font-bold uppercase text-white tracking-wider">
                        ¡Contraseña Reestablecida!
                      </h4>
                      <p className="font-mono text-xs text-[#8a8a8a] mt-1">
                        Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setRecoveryStep('request');
                      }}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white text-black font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#e0e0e0] cursor-pointer"
                    >
                      Iniciar Sesión Ahora
                    </button>
                  </div>
                )}

                {/* Back to Login link */}
                <div className="pt-2 border-t border-[#222] text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setRecoveryStep('request'); }}
                    className="font-mono text-xs text-[#8a8a8a] hover:text-white underline cursor-pointer"
                  >
                    ← Volver a iniciar sesión
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW: FORGOT EMAIL RECOVERY */}
            {/* ======================================================== */}
            {mode === 'forgot_email' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 font-mono text-xs text-[#8a8a8a] border-b border-[#222] pb-3">
                  <HelpCircle className="w-4 h-4 text-white" />
                  <span>RECUPERACIÓN // LOCALIZAR CORREO</span>
                </div>

                {!recoveredEmailResult ? (
                  <form onSubmit={handleEmailRecovery} className="space-y-4">
                    <p className="font-mono text-xs text-[#a0a0a0] leading-relaxed">
                      Si olvidaste cuál es tu correo electrónico de acceso, ingresa el número de teléfono vinculado para que el sistema localice tu cuenta.
                    </p>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider">
                        Número de Teléfono Vinculado
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="Ej. +57 310 123 4567"
                          value={recoveryPhone}
                          onChange={(e) => setRecoveryPhone(e.target.value)}
                          className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-white focus:ring-1 focus:ring-white rounded-[3.6px] pl-9 pr-3 py-2.5 text-sm font-sans text-white placeholder-[#555] transition-all outline-none"
                        />
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
                          <span>Buscando en base de datos...</span>
                        </>
                      ) : (
                        <>
                          <span>Buscar Correo Vinculado</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* RESULT REVEAL */
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-[3.6px] bg-[#141414] border border-white/30 space-y-2">
                      <div className="flex items-center gap-2 font-mono text-xs text-white">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>CUENTA ENCONTRADA:</span>
                      </div>
                      <div className="font-mono text-sm text-white font-bold tracking-wider bg-black/60 p-2.5 rounded-[2px] border border-[#333]">
                        {recoveredEmailResult}
                      </div>
                      <p className="font-mono text-[11px] text-[#8a8a8a]">
                        Este es el correo que tienes registrado en Voxpin.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail(recoveredEmailResult);
                        setMode('login');
                        setRecoveredEmailResult(null);
                      }}
                      className="w-full py-3 px-4 rounded-[3.6px] bg-white text-black font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#e0e0e0] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Usar este correo para Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                )}

                {/* Back to Login link */}
                <div className="pt-2 border-t border-[#222] text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setRecoveredEmailResult(null); }}
                    className="font-mono text-xs text-[#8a8a8a] hover:text-white underline cursor-pointer"
                  >
                    ← Volver a iniciar sesión
                  </button>
                </div>
              </div>
            )}

            {/* Footer Security Badges */}
            <div className="mt-6 pt-4 border-t border-[#222] flex items-center justify-between font-mono text-[10px] text-[#555]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#888]" />
                <span>AES-256-GCM SSL</span>
              </div>
              <span>VOXPIN // GEO-AUTH</span>
            </div>

          </div>

        </div>
      </main>

      {/* Interactive Google Sign-In Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121212] border border-white/20 rounded-[3.6px] p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 border-b border-[#262626] pb-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z" />
              </svg>
              <div>
                <h4 className="font-sans font-bold text-sm text-white">Acceder con Google</h4>
                <p className="font-mono text-[10px] text-[#888]">Selecciona una cuenta para VoxPin</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Account 1 (Active User) */}
              <button
                type="button"
                onClick={() => handleGoogleAuth('juandavidparadavargas30@gmail.com')}
                className="w-full text-left p-3 rounded-[3.6px] bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-white transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center font-mono text-xs">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-white truncate">
                    Juan David Parada
                  </div>
                  <div className="text-[11px] font-mono text-[#888] truncate">
                    juandavidparadavargas30@gmail.com
                  </div>
                </div>
              </button>

              {/* Account 2 (Generic Demo) */}
              <button
                type="button"
                onClick={() => handleGoogleAuth('analista.geo@voxpin.com')}
                className="w-full text-left p-3 rounded-[3.6px] bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-white transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#333] text-white font-bold flex items-center justify-center font-mono text-xs">
                  VP
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-white truncate">
                    Analista Geoespacial
                  </div>
                  <div className="text-[11px] font-mono text-[#888] truncate">
                    analista.geo@voxpin.com
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-3 py-1.5 rounded-[3.6px] font-mono text-xs text-[#888] hover:text-white border border-[#333] hover:border-[#666] cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="relative z-20 border-t border-[#1f1f1f] py-4 text-center font-mono text-[11px] text-[#555]">
        <span>VOXPIN &copy; 2026 // PLATAFORMA DE GEO-ENCUESTAS Y DEMOGRAFÍA</span>
      </footer>

    </div>
  );
};
