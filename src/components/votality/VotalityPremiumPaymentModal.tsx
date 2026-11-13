import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  Smartphone,
  Wallet,
  Loader2,
  Crown,
  Check,
  FileSpreadsheet,
  FileText,
  Clock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

interface VotalityPremiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  userEmail?: string;
  userName?: string;
}

type PaymentMethodType = 'pse' | 'card' | 'wallet';

export const VotalityPremiumPaymentModal: React.FC<VotalityPremiumPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  userEmail = 'usuario@votality.com',
  userName = 'Usuario',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('pse');
  const [bank, setBank] = useState('Bancolombia');
  const [personType, setPersonType] = useState<'natural' | 'juridica'>('natural');
  const [phone, setPhone] = useState('3001234567');
  const [docNumber, setDocNumber] = useState('1098765432');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Alerta de confirmación previa al pago "¿Está seguro de cambiar el plan?" con 5s
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(5);

  useEffect(() => {
    let timer: any = null;
    if (showConfirmAlert) {
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
  }, [showConfirmAlert]);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    // Simulación de procesamiento bancario seguro
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onConfirmPayment();
      }, 1200);
    }, 1500);
  };

  return (
    <div
      id="modal-pago-plan-premium"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none font-sans animate-in fade-in duration-150"
    >
      <div className="bg-[#050505] border-2 border-[#D4AF37] w-full max-w-xl rounded-sm shadow-[0_0_60px_rgba(212,175,55,0.35)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#0a0a0a] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                MÉTODOS DE PAGO // SUSCRIPCIÓN PROFESIONAL
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <span>Mejorar al Plan Premium</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#241a05] text-amber-300 border border-[#D4AF37]/50">
                  MENSUAL
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-sm text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Tarjeta de Resumen y Precio Oficial */}
          <div className="p-4 rounded-sm bg-[#0d0d0d] border border-[#2a2412] shadow-inner space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
              <div>
                <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider block">
                  Suscripción seleccionada
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[#D4AF37]" />
                  Plan Premium (Profesional)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider block">
                  Valor a pagar
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#D4AF37] tracking-tight">
                  $350.000 COP
                </span>
                <span className="text-[10px] text-[#777777] font-mono block">/ mes · Sin permanencia</span>
              </div>
            </div>

            {/* Beneficios Desbloqueados */}
            <div className="space-y-1.5 pt-1 text-xs font-mono">
              <div className="flex items-center gap-2 text-white">
                <Check className="w-3.5 h-3.5 text-[#00FF85] shrink-0" />
                <span>100% libre de anuncios publicitarios</span>
              </div>
              <div className="flex items-center gap-2 text-[#cccccc]">
                <Check className="w-3.5 h-3.5 text-[#00FF85] shrink-0" />
                <span>Hasta <strong>30 encuestadores</strong> en su equipo</span>
              </div>
              <div className="flex items-center gap-2 text-[#cccccc]">
                <Check className="w-3.5 h-3.5 text-[#00FF85] shrink-0" />
                <span>Hasta <strong>1.000 pines</strong> propios guardados</span>
              </div>
              <div className="flex items-center gap-2 text-[#cccccc]">
                <Check className="w-3.5 h-3.5 text-[#00FF85] shrink-0" />
                <span>Formularios con preguntas personalizadas ilimitadas</span>
              </div>
              <div className="flex items-center gap-2 text-[#00FF85]">
                <Check className="w-3.5 h-3.5 text-[#00FF85] shrink-0" />
                <span>Estadísticas completas con descarga en Excel y PDF</span>
              </div>
            </div>

            {/* Aviso Oficial de Resguardo de Información por 3 Meses */}
            <div className="p-2.5 rounded-sm bg-[#141005] border border-[#D4AF37]/50 flex items-start gap-2.5 text-[11px] font-mono text-[#d6d6d6] leading-snug">
              <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#D4AF37] font-bold block mb-0.5">RESGUARDO TEMPORAL (3 MESES):</span>
                <span>Si no renuevas la mensualidad, tu información permanecerá resguardada 3 meses. Antes de borrarse, te enviaremos por correo el respaldo completo en <strong className="text-white">PDF y Excel</strong> con los últimos datos guardados.</span>
              </div>
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#aaaaaa] block font-semibold">
              Seleccione el método de pago
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedMethod('pse')}
                className={`p-2.5 rounded-sm border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'pse'
                    ? 'border-[#D4AF37] bg-[#1a1505] text-white shadow-sm'
                    : 'border-[#262626] bg-[#0d0d0d] text-[#888888] hover:text-white hover:border-[#444444]'
                }`}
              >
                <Building2 className={`w-4 h-4 ${selectedMethod === 'pse' ? 'text-[#D4AF37]' : ''}`} />
                <span className="font-bold text-[11px]">PSE</span>
                <span className="text-[9px] text-[#777777]">Débito banco</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-2.5 rounded-sm border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'border-[#D4AF37] bg-[#1a1505] text-white shadow-sm'
                    : 'border-[#262626] bg-[#0d0d0d] text-[#888888] hover:text-white hover:border-[#444444]'
                }`}
              >
                <CreditCard className={`w-4 h-4 ${selectedMethod === 'card' ? 'text-[#D4AF37]' : ''}`} />
                <span className="font-bold text-[11px]">Tarjeta</span>
                <span className="text-[9px] text-[#777777]">Crédito / Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('wallet')}
                className={`p-2.5 rounded-sm border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'wallet'
                    ? 'border-[#D4AF37] bg-[#1a1505] text-white shadow-sm'
                    : 'border-[#262626] bg-[#0d0d0d] text-[#888888] hover:text-white hover:border-[#444444]'
                }`}
              >
                <Wallet className={`w-4 h-4 ${selectedMethod === 'wallet' ? 'text-[#D4AF37]' : ''}`} />
                <span className="font-bold text-[11px]">Nequi / Dale</span>
                <span className="text-[9px] text-[#777777]">Billetera digital</span>
              </button>
            </div>
          </div>

          {/* Formulario según el método seleccionado */}
          <div className="p-4 rounded-sm bg-[#0a0a0a] border border-[#222222] space-y-3 font-mono text-xs">
            {selectedMethod === 'pse' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#888888] uppercase block">Banco Emisor</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full bg-[#111111] text-white p-2 border border-[#333333] rounded-xs text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="BBVA Colombia">BBVA Colombia</option>
                    <option value="Banco de Occidente">Banco de Occidente</option>
                    <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                    <option value="Banco Popular">Banco Popular</option>
                    <option value="Lulo Bank">Lulo Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase block">Tipo de Persona</label>
                    <select
                      value={personType}
                      onChange={(e) => setPersonType(e.target.value as any)}
                      className="w-full bg-[#111111] text-white p-2 border border-[#333333] rounded-xs text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="natural">Natural</option>
                      <option value="juridica">Jurídica</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase block">Número de Cédula / NIT</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="1098765432"
                      className="w-full bg-[#111111] text-white p-2 border border-[#333333] rounded-xs text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#888888] uppercase block">Número de Tarjeta</label>
                  <input
                    type="text"
                    defaultValue="4532 •••• •••• 8892"
                    className="w-full bg-[#111111] text-white p-2 border border-[#333333] rounded-xs text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase block">Vencimiento (MM/AA)</label>
                    <input
                      type="text"
                      defaultValue="09/28"
                      className="w-full bg-[#111111] text-white p-2 border border-[#333333] rounded-xs text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#888888] uppercase block">CVC / CVV</label>
                    <input
                      type="password"
                      defaultValue="•••"
                      maxLength={4}
                      className="w-full bg-[#111111] text-white p-2 border border-[#333333] rounded-xs text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#888888] uppercase block">Número de Celular Nequi</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full bg-[#111111] text-white p-2 border border-[#333333] rounded-xs text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <p className="text-[10px] text-[#777777] leading-relaxed">
                  Recibirás una notificación en tu app Nequi para autorizar el débito por $350.000 COP.
                </p>
              </div>
            )}

            {/* Email de Notificación y Factura */}
            <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-[11px] text-[#777777]">
              <span>Factura enviada a:</span>
              <span className="text-white font-bold">{userEmail}</span>
            </div>
          </div>

          {/* Garantías y Seguridad */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#666666] pt-1">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#00FF85]" />
              Transacción cifrada SSL 256 bits
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              Cancelable en cualquier momento
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0a0a0a] border-t border-[#262626] flex items-center justify-between gap-3 font-mono">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#202020] text-[#888888] hover:text-white text-xs font-bold uppercase rounded-sm border border-[#2b2b2b] transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmAlert(true)}
            disabled={isProcessing || isSuccess}
            className={`flex-1 py-3 px-5 rounded-sm font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isSuccess
                ? 'bg-emerald-500 text-black'
                : 'bg-[#D4AF37] hover:bg-[#f3ca4d] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Procesando suscripción...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>¡Pago Confirmado! Activando Plan...</span>
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 text-black" />
                <span>Pagar y Activar Plan Premium ($350.000 COP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de confirmación antes de pagar "¿Está seguro de cambiar el plan?" con 5s de espera */}
      {showConfirmAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-mono animate-in fade-in duration-150">
          <div className="bg-[#0c0c0c] border-2 border-red-500 w-full max-w-lg rounded-sm shadow-[0_0_60px_rgba(239,68,68,0.4)] p-6 space-y-5">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2 font-bold text-red-500">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="text-sm uppercase tracking-wider">ADVERTENCIA // ¿ESTÁ SEGURO?</span>
              </div>
              <button
                onClick={() => setShowConfirmAlert(false)}
                className="p-1 rounded-sm text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                title="Cancelar y mantener plan actual"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo de la alerta */}
            <div className="space-y-3 text-xs">
              <p className="text-white font-bold text-sm">
                ¿Está seguro de cambiar al Plan Premium?
              </p>

              <div className="p-3.5 bg-[#140b0b] border border-red-500/40 rounded-sm space-y-2 text-[#cccccc] leading-relaxed">
                <div className="flex items-center justify-between pb-2 border-b border-[#291414]">
                  <span className="text-[10px] text-[#888888] uppercase">Plan Actual:</span>
                  <span className="text-white font-bold">Plan Básico (Free)</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#291414]">
                  <span className="text-[10px] text-[#D4AF37] uppercase font-bold">Nuevo Plan a Activar:</span>
                  <span className="text-[#D4AF37] font-bold">Plan Premium ($350.000 COP / mes)</span>
                </div>
                <div className="text-[11px] text-[#e0e0e0] pt-1">
                  Al confirmar, se procesará el pago seguro por <strong className="text-[#D4AF37]">$350.000 COP</strong> y tu cuenta pasará de inmediato al <strong className="text-white">Plan Premium</strong> con 30 encuestadores, 1.000 pines y descarga de estadísticas en Excel y PDF.
                </div>
              </div>
            </div>

            {/* Acciones con espera de 5 segundos */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setShowConfirmAlert(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-sm bg-[#181818] hover:bg-[#252525] text-[#aaaaaa] hover:text-white text-xs font-mono uppercase cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={confirmCountdown > 0}
                onClick={() => {
                  setShowConfirmAlert(false);
                  handlePay();
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
                    <span>Sí, estoy seguro, pagar y activar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
