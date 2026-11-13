import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  ArrowRight,
  CreditCard,
  Lock,
  Sparkles,
  Crown,
  Building2,
  Smartphone,
  Wallet,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  FileText,
  Check,
  Clock,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';
import { CampaignPlanTier, CAMPAIGN_PLAN_TIERS } from '../landing/CampaignPlansModal';
import { UserSession } from '../auth/AuthPage';
import { updateUserPlanInStore } from '../../utils/userStore';

interface CheckoutPageProps {
  user?: UserSession | null;
  selectedPlan?: CampaignPlanTier | null;
  onContinueToWorkspace: () => void;
  onBackToLanding: () => void;
}

type PaymentMethodType = 'pse' | 'card' | 'wallet';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  user,
  selectedPlan,
  onContinueToWorkspace,
  onBackToLanding,
}) => {
  const isPremiumRequested =
    (user?.planTier || '').toLowerCase() === 'premium' ||
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('plan')?.toLowerCase() === 'premium');

  const activePlan =
    selectedPlan ||
    (isPremiumRequested
      ? {
          id: 'plan-premium',
          codigo: 'PREMIUM' as any,
          nombre: 'Plan Premium',
          nivel: 'Eventos, Grupos y Profesionales',
          precio: '$350.000 COP / mes',
          precioNumero: 350000,
          limiteEncuestadores: 30,
          limitePines: 1000,
          beneficioEstadisticas: 'Estadísticas completas con descarga en Excel y PDF.',
          descripcion:
            'Suscripción mensual flexible: hasta 30 encuestadores, 1.000 pines propios, 100% libre de publicidad, estadísticas completas y exportación en Excel y PDF.',
          etiquetaBoton: 'PAGAR $350.000 COP Y CONTINUAR',
        }
      : CAMPAIGN_PLAN_TIERS.find(
          (p) =>
            p.codigo.toLowerCase() === (user?.planTier || '').toLowerCase() ||
            (typeof window !== 'undefined' &&
              new URLSearchParams(window.location.search).get('plan')?.toLowerCase() ===
                p.codigo.toLowerCase())
        ));

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pse');
  const [bank, setBank] = useState('Bancolombia');
  const [docNumber, setDocNumber] = useState('1098765432');
  const [phoneNumber, setPhoneNumber] = useState('3001234567');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(user?.name || 'TITULAR DE CUENTA');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('•••');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  // Alerta de confirmación "¿Está seguro de cambiar el plan?" con 5 segundos de espera
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(5);

  useEffect(() => {
    let timer: any = null;
    if (showConfirmModal) {
      setConfirmCountdown(5);
      timer = setInterval(() => {
        setConfirmCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showConfirmModal]);

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaidSuccess(true);
      const targetPlanCode = (activePlan?.codigo || (isPremiumRequested ? 'PREMIUM' : 'COMUNAL')).toUpperCase();
      try {
        localStorage.removeItem('votality_user_plan');
        if (user?.email) {
          const cleanEmail = user.email.trim().toLowerCase();
          localStorage.setItem(`votality_user_plan_${cleanEmail}`, targetPlanCode);
          updateUserPlanInStore(cleanEmail, targetPlanCode);

          // Actualizar sesión almacenada
          const updatedUser = {
            ...user,
            planTier: targetPlanCode,
            role: targetPlanCode === 'FREE' ? 'USUARIO_FREE' : 'ADMIN_CAMPANA',
            plan: {
              ...(user.plan || {}),
              codigo: targetPlanCode,
              nombre: activePlan?.nombre || `Plan ${targetPlanCode}`,
            },
          };
          localStorage.setItem('votality_user', JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => {
        onContinueToWorkspace();
      }, 1500);
    }, 1800);
  };

  const handleInitiatePayment = () => {
    if (user) {
      setShowConfirmModal(true);
    } else {
      handleProcessPayment();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="relative z-20 border-b border-[#1f1f1f] bg-[#0c0c0c]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLanding}
              disabled={isProcessing}
              className="p-1.5 rounded-[3.6px] border border-[#262626] hover:border-white text-[#888888] hover:text-white transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-widest font-bold text-white">VOTALITY</span>
              <span className="text-[#333]">/</span>
              <span className="font-mono text-xs text-[#888] uppercase tracking-wider">
                MÉTODOS DE PAGO // SUSCRIPCIÓN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF85] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#aaaaaa]">
              Pasarela de Pago Segura
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="bg-[#121212] border border-[#262626] rounded-[3.6px] p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Status Header */}
          <div className="border-b border-[#222222] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold mb-1">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <span>PAGO DE LICENCIA // SUSCRIPCIÓN PROFESIONAL</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white">
                Métodos de Pago Oficiales
              </h1>
              <p className="text-xs font-mono text-[#888888] mt-1">
                {user
                  ? `Usuario en sesión: ${user.name} (${user.email})`
                  : 'Completa el pago para activar tu Plan Premium y crear tu cuenta.'}
              </p>
            </div>

            <div className="shrink-0 p-3 bg-[#171717] border border-[#2e2e2e] rounded-sm text-right">
              <span className="text-[10px] font-mono uppercase text-[#888888] block">Total a Pagar</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[#D4AF37]">
                {activePlan?.precio || '$350.000 COP'}
              </span>
            </div>
          </div>

          {/* Plan Summary Card */}
          {activePlan && (
            <div className="p-4 sm:p-5 rounded-[3.6px] bg-[#161616] border border-[#333333] font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <span className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>{activePlan.nombre}</span>
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-[#241a05] text-[#FBBF24] border border-[#D4AF37]/50 text-[10px] font-bold uppercase">
                  PAGO MENSUAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#cccccc] font-sans text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00FF85]" />
                  <span>Hasta <strong>{activePlan.limiteEncuestadores} encuestadores</strong> en su equipo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00FF85]" />
                  <span>Hasta <strong>{activePlan.limitePines.toLocaleString('es-CO')} pines</strong> geográficos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00FF85]" />
                  <span>100% Libre de anuncios publicitarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00FF85]" />
                  <span>Descarga de estadísticas en <strong>Excel (.csv) y PDF</strong></span>
                </div>
              </div>

              {/* Resguardo 3 meses */}
              <div className="p-2.5 rounded-sm bg-[#181305] border border-[#D4AF37]/50 flex items-start gap-2 text-[11px] font-mono text-[#dcdcdc] leading-snug">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#D4AF37]">Resguardo de datos por 3 meses:</strong> Si se te acaba la mensualidad, tu información permanecerá guardada 3 meses. Antes de borrarse, te enviaremos por correo el archivo en <strong className="text-white">PDF y Excel</strong> con los últimos datos registrados.
                </span>
              </div>
            </div>
          )}

          {/* Selector de Métodos de Pago */}
          <div className="space-y-4">
            <label className="text-xs font-mono uppercase tracking-wider text-[#aaaaaa] font-bold block">
              Seleccione su medio de pago:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opción 1: PSE */}
              <button
                type="button"
                onClick={() => setPaymentMethod('pse')}
                className={`p-3.5 rounded-sm border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  paymentMethod === 'pse'
                    ? 'bg-[#1f1908] border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'bg-[#141414] border-[#292929] text-[#888888] hover:border-[#444444] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 className={`w-5 h-5 ${paymentMethod === 'pse' ? 'text-[#D4AF37]' : 'text-[#888888]'}`} />
                  {paymentMethod === 'pse' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase">PSE Bancos</div>
                  <div className="text-[10px] text-[#888888]">Débito bancario en línea</div>
                </div>
              </button>

              {/* Opción 2: Tarjeta de Crédito */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-sm border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  paymentMethod === 'card'
                    ? 'bg-[#1f1908] border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'bg-[#141414] border-[#292929] text-[#888888] hover:border-[#444444] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-[#D4AF37]' : 'text-[#888888]'}`} />
                  {paymentMethod === 'card' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase">Tarjeta Débito/Crédito</div>
                  <div className="text-[10px] text-[#888888]">Visa, Mastercard, Amex</div>
                </div>
              </button>

              {/* Opción 3: Nequi / Daviplata */}
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3.5 rounded-sm border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  paymentMethod === 'wallet'
                    ? 'bg-[#1f1908] border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'bg-[#141414] border-[#292929] text-[#888888] hover:border-[#444444] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Smartphone className={`w-5 h-5 ${paymentMethod === 'wallet' ? 'text-[#D4AF37]' : 'text-[#888888]'}`} />
                  {paymentMethod === 'wallet' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase">Nequi / Daviplata</div>
                  <div className="text-[10px] text-[#888888]">Notificación push al celular</div>
                </div>
              </button>
            </div>

            {/* Formulario según método seleccionado */}
            <div className="p-4 rounded-sm bg-[#0d0d0d] border border-[#262626] space-y-3 font-mono text-xs">
              {paymentMethod === 'pse' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase">Entidad Financiera (Banco)</label>
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full bg-[#171717] border border-[#333333] text-white p-2.5 rounded-sm text-xs focus:border-[#D4AF37] outline-none"
                    >
                      <option value="Bancolombia">Bancolombia</option>
                      <option value="Nequi">Nequi</option>
                      <option value="Davivienda">Davivienda</option>
                      <option value="Banco de Bogotá">Banco de Bogotá</option>
                      <option value="BBVA Colombia">BBVA Colombia</option>
                      <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                      <option value="Banco de Occidente">Banco de Occidente</option>
                      <option value="Dale!">Dale!</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase">Número de Identificación (C.C. o NIT)</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full bg-[#171717] border border-[#333333] text-white p-2.5 rounded-sm text-xs focus:border-[#D4AF37] outline-none"
                      placeholder="1098765432"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase">Número de Tarjeta</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#171717] border border-[#333333] text-white p-2.5 rounded-sm text-xs focus:border-[#D4AF37] outline-none"
                      placeholder="4532 •••• •••• 4242"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-[10px] text-[#888888] uppercase">Titular</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-[#171717] border border-[#333333] text-white p-2.5 rounded-sm text-xs focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#888888] uppercase">Vencimiento</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-[#171717] border border-[#333333] text-white p-2.5 rounded-sm text-xs focus:border-[#D4AF37] outline-none"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#888888] uppercase">CVC / CVV</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        maxLength={4}
                        className="w-full bg-[#171717] border border-[#333333] text-white p-2.5 rounded-sm text-xs focus:border-[#D4AF37] outline-none"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'wallet' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase">Número Celular de la Cuenta (Nequi / Daviplata)</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#171717] border border-[#333333] text-white p-2.5 rounded-sm text-xs focus:border-[#D4AF37] outline-none"
                      placeholder="300 123 4567"
                    />
                  </div>
                  <p className="text-[10px] text-[#888888]">
                    Se enviará una notificación de autorización directa a su aplicación móvil por el valor de{' '}
                    <strong className="text-white">{activePlan?.precio || '$350.000 COP'}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Success Banner */}
          {isPaidSuccess && (
            <div className="p-4 rounded-sm bg-[#0a1a0f] border border-[#00FF85] flex items-center gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-[#00FF85] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase font-mono">
                  ¡Transacción Aprobada Exitosamente!
                </div>
                <div className="text-[11px] text-[#cccccc] font-sans">
                  {user
                    ? 'Redirigiendo a tu mesa de trabajo para marcar los pines...'
                    : 'Redirigiendo al formulario para crear tu cuenta con Plan Premium activo...'}
                </div>
              </div>
            </div>
          )}

          {/* Action Button to Complete Payment and Go to Workspace / Account Creation */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#777777]">
              <Lock className="w-3.5 h-3.5 text-[#00FF85]" />
              <span>Transacción cifrada 256-bit SSL · Sin permanencia</span>
            </div>

            <button
              onClick={handleInitiatePayment}
              disabled={isProcessing || isPaidSuccess}
              className="w-full sm:w-auto px-7 py-3.5 rounded-[3.6px] bg-[#D4AF37] hover:bg-[#FBBF24] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando pago seguro...</span>
                </>
              ) : isPaidSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Pago Completado!</span>
                </>
              ) : (
                <>
                  <span>{user ? 'PAGAR Y ACTIVAR EN MI CUENTA' : 'PAGAR Y CREAR MI CUENTA'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>

        </div>
      </main>

      {/* Modal de Advertencia "¿Está Seguro de Cambiar el Plan?" con 5 segundos de espera */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-mono animate-in fade-in duration-150">
          <div className="bg-[#0c0c0c] border-2 border-red-500 w-full max-w-lg rounded-sm shadow-[0_0_60px_rgba(239,68,68,0.4)] p-6 space-y-5">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2 font-bold text-red-500">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="text-sm uppercase tracking-wider">ADVERTENCIA // ¿ESTÁ SEGURO?</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-sm text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                title="Cancelar y mantener plan actual"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo de la alerta */}
            <div className="space-y-3 text-xs">
              <p className="text-white font-bold text-sm">
                ¿Está seguro de cambiar su plan actual?
              </p>

              <div className="p-3.5 bg-[#140b0b] border border-red-500/40 rounded-sm space-y-2 text-[#cccccc] leading-relaxed">
                <div className="flex items-center justify-between pb-2 border-b border-[#291414]">
                  <span className="text-[10px] text-[#888888] uppercase">Plan Actual en Cuenta:</span>
                  <span className="text-white font-bold">{user?.plan?.nombre || user?.planTier || 'Plan Básico (Free)'}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#291414]">
                  <span className="text-[10px] text-[#D4AF37] uppercase font-bold">Nuevo Plan a Pagar:</span>
                  <span className="text-[#D4AF37] font-bold">{activePlan?.nombre} ({activePlan?.precio})</span>
                </div>
                <div className="text-[11px] text-[#e0e0e0] pt-1">
                  Al confirmar, <strong className="text-red-400">su plan anterior será cancelado y reemplazado</strong> por esta nueva licencia. Una vez aprobado el pago, su cuenta se actualizará de inmediato con sus nuevos pines y beneficios.
                </div>
              </div>
            </div>

            {/* Botones de acción con espera de 5 segundos */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-sm bg-[#181818] hover:bg-[#252525] text-[#aaaaaa] hover:text-white text-xs font-mono uppercase cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={confirmCountdown > 0}
                onClick={() => {
                  setShowConfirmModal(false);
                  handleProcessPayment();
                }}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  confirmCountdown > 0
                    ? 'bg-[#222222] text-[#666666] border border-[#333333] cursor-not-allowed opacity-60'
                    : 'bg-red-600 hover:bg-red-500 text-white border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95'
                }`}
              >
                {confirmCountdown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin text-[#aaaaaa]" />
                    <span>Espere {confirmCountdown}s...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Sí, estoy seguro, pagar y cambiar plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="relative z-20 border-t border-[#1f1f1f] py-4 px-6 text-center font-mono text-[11px] text-[#555] flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#888]" />
          <span>ENTORNO SEGURO // INTEGRACIÓN PASARELA BANCARIA COLOMBIA</span>
        </div>
        <span>VOTALITY &copy; 2026</span>
      </footer>
    </div>
  );
};
