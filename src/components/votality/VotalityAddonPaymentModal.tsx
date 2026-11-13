import React, { useState } from 'react';
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
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface VotalityAddonPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  currentMaxPins: number;
  purchasedCount: number; // 0, 1, 2
  userEmail?: string;
  userName?: string;
}

type PaymentMethodType = 'pse' | 'card' | 'wallet' | 'cash';

export const VotalityAddonPaymentModal: React.FC<VotalityAddonPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  currentMaxPins,
  purchasedCount,
  userEmail = 'campana@votality.com',
  userName = 'Director de Campaña',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('pse');
  const [bank, setBank] = useState('Bancolombia');
  const [personType, setPersonType] = useState<'natural' | 'juridica'>('natural');
  const [phone, setPhone] = useState('3001234567');
  const [docNumber, setDocNumber] = useState('1098765432');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const nextPurchaseNumber = purchasedCount + 1;
  const newMaxPins = currentMaxPins + 1000;

  const handlePay = () => {
    setIsProcessing(true);
    // Simulación de respuesta bancaria segura y pasarela de pago en línea
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
      id="modal-pago-addon-pines"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none font-sans animate-in fade-in duration-150"
    >
      <div className="bg-[#050505] border-2 border-[#D4AF37] w-full max-w-xl rounded-sm shadow-[0_0_50px_rgba(212,175,55,0.3)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#0a0a0a] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                MÉTODOS DE PAGO // AMPLIACIÓN DE CUOTA
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Comprar 1.000 Pines más</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#241a05] text-amber-300 border border-[#D4AF37]/50">
                  Recarga {nextPurchaseNumber} de 3
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
                  Concepto de compra
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Paquete adicional de 1.000 Pines
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider block">
                  Valor a pagar
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#D4AF37] tracking-tight">
                  $350.000 COP
                </span>
              </div>
            </div>

            {/* Comparativa de capacidad */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xs bg-[#141414] border border-[#222222]">
                <span className="text-[10px] text-[#777777] block">Capacidad Actual:</span>
                <span className="text-white font-bold">{currentMaxPins.toLocaleString('es-CO')} Pines</span>
              </div>
              <div className="p-2 rounded-xs bg-[#191505] border border-[#D4AF37]/40">
                <span className="text-[10px] text-amber-400/80 block">Nueva Capacidad:</span>
                <span className="text-[#D4AF37] font-bold">+{1000} → {newMaxPins.toLocaleString('es-CO')} Pines</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#999999] flex items-center justify-between pt-1">
              <span>Compras disponibles restantes:</span>
              <span className="text-white font-bold">{3 - nextPurchaseNumber} recarga(s) más</span>
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#aaaaaa] block font-semibold">
              Seleccione el método de pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
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
                <span className="text-[9px] text-[#777777]">Crédito/Débito</span>
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
                <Smartphone className={`w-4 h-4 ${selectedMethod === 'wallet' ? 'text-[#D4AF37]' : ''}`} />
                <span className="font-bold text-[11px]">Billeteras</span>
                <span className="text-[9px] text-[#777777]">Nequi/Daviplata</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-2.5 rounded-sm border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'border-[#D4AF37] bg-[#1a1505] text-white shadow-sm'
                    : 'border-[#262626] bg-[#0d0d0d] text-[#888888] hover:text-white hover:border-[#444444]'
                }`}
              >
                <Wallet className={`w-4 h-4 ${selectedMethod === 'cash' ? 'text-[#D4AF37]' : ''}`} />
                <span className="font-bold text-[11px]">Efectivo</span>
                <span className="text-[9px] text-[#777777]">Efecty/SuRed</span>
              </button>
            </div>
          </div>

          {/* Formulario según Método */}
          {selectedMethod === 'pse' && (
            <div className="space-y-3 p-3.5 bg-[#0a0a0a] border border-[#222222] rounded-sm font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Entidad Bancaria</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none cursor-pointer"
                  >
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="BBVA Colombia">BBVA Colombia</option>
                    <option value="Banco de Occidente">Banco de Occidente</option>
                    <option value="Nequi">Nequi (Débito PSE)</option>
                    <option value="Daviplata">Daviplata (Débito PSE)</option>
                    <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Tipo de Persona</label>
                  <select
                    value={personType}
                    onChange={(e) => setPersonType(e.target.value as any)}
                    className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none cursor-pointer"
                  >
                    <option value="natural">Persona Natural</option>
                    <option value="juridica">Persona Jurídica (Empresa/Campaña)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Número de Documento / NIT</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none font-mono"
                    placeholder="1098765432"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Celular / Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none font-mono"
                    placeholder="300 123 4567"
                  />
                </div>
              </div>

              <div className="text-[10px] text-[#777777] flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Transacción encriptada con certificación SSL bancaria directa.</span>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-3 p-3.5 bg-[#0a0a0a] border border-[#222222] rounded-sm font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#888888] block mb-1">Nombre en la Tarjeta</label>
                <input
                  type="text"
                  defaultValue={userName}
                  className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#888888] block mb-1">Número de Tarjeta</label>
                <input
                  type="text"
                  placeholder="•••• •••• •••• 4242"
                  defaultValue="4532 8912 3456 4242"
                  className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Expiración (MM/AA)</label>
                  <input
                    type="text"
                    defaultValue="12/28"
                    className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    defaultValue="888"
                    maxLength={4}
                    className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'wallet' && (
            <div className="p-3.5 bg-[#0a0a0a] border border-[#222222] rounded-sm font-mono text-xs space-y-3">
              <p className="text-[#cccccc] text-[11px]">
                Recibirás una notificación push en tu aplicación móvil (Nequi o Daviplata) para autorizar el débito instantáneo de <strong>$350.000 COP</strong>.
              </p>
              <div>
                <label className="text-[10px] text-[#888888] block mb-1">Número Celular de la Cuenta</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] focus:border-[#D4AF37] text-white p-2 rounded-xs outline-none font-mono"
                />
              </div>
            </div>
          )}

          {selectedMethod === 'cash' && (
            <div className="p-3.5 bg-[#0a0a0a] border border-[#222222] rounded-sm font-mono text-xs space-y-2">
              <p className="text-[#cccccc] text-[11px]">
                Se generará un número de convenio y código de pago para pagar <strong>$350.000 COP</strong> en cualquier punto Efecty, SuRed o Baloto del país.
              </p>
              <div className="p-2.5 bg-[#141414] border border-[#333333] rounded-xs text-[11px] text-[#aaaaaa]">
                Convenio Nacional: <strong className="text-white">#110982</strong> · Referencia: <strong className="text-white">998234-P1000</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Botón de Confirmación */}
        <div className="p-4 bg-[#0a0a0a] border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#777777]">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Pago protegido // Activación inmediata</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-2 rounded-sm bg-[#141414] hover:bg-[#202020] text-white text-xs font-mono uppercase tracking-wider border border-[#333333] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing || isSuccess}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#FBBF24] text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Procesando pago...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>¡Pago Aprobado!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Pagar $350.000 COP y Activar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
