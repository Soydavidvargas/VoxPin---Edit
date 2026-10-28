import React, { useState } from 'react';
import { 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Building2, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Lock,
  Flag,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { PlanType, CompanyVerification } from '../types/voxpin';

interface PricingPlansProps {
  currentPlan: PlanType;
  setCurrentPlan: (plan: PlanType) => void;
  verification: CompanyVerification;
  setVerification: React.Dispatch<React.SetStateAction<CompanyVerification>>;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  currentPlan,
  setCurrentPlan,
  verification,
  setVerification,
}) => {
  const [activeFlowTab, setActiveFlowTab] = useState<'automatico' | 'manual'>('automatico');
  
  // Verification form state
  const [corpEmail, setCorpEmail] = useState('contacto@consultoriaandina.com');
  const [nit, setNit] = useState('901.442.890-3');
  const [compName, setCompName] = useState('Consultoría Andina & Asociados S.A.S.');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [verifyingProcess, setVerifyingProcess] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAutomaticVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingProcess(true);
    setTimeout(() => {
      setVerification({
        type: 'automatic',
        companyName: compName,
        nit: nit,
        corporateEmail: corpEmail,
        status: 'verified',
      });
      setCurrentPlan('premium');
      setVerifyingProcess(false);
      setSuccessMsg('¡Empresa verificada automáticamente con éxito! Plan Premium activado.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1200);
  };

  const handleManualVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      alert('Por favor selecciona o arrastra tu archivo RUT o Cámara de Comercio');
      return;
    }
    setVerifyingProcess(true);
    setTimeout(() => {
      setVerification({
        type: 'manual',
        companyName: compName,
        nit: nit,
        corporateEmail: corpEmail,
        documentName: uploadedFile,
        status: 'verified',
      });
      setCurrentPlan('premium');
      setVerifyingProcess(false);
      setSuccessMsg('¡Documento recibido! Activación inmediata en modo revisión institucional.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1400);
  };

  return (
    <div className="max-w-[1344px] mx-auto px-4 sm:px-6 py-8">
      
      {/* Eyebrow & Title from Page 6 */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0062ca]/20 text-[#007afc] border border-[#0062ca]/40 text-xs font-semibold tracking-wider uppercase mb-2">
          SAAS CON COBRO MENSUAL · MÓDULO 4
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Modelo de negocio y suscripciones
        </h1>
        <p className="text-sm sm:text-base text-[#a0aaba] max-w-3xl mt-2 leading-relaxed">
          Requiere inicio de sesión (estándar o Google) y genera un código de acceso único por cliente. Los administradores crean y gestionan los permisos de sus encuestadores en campo.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-[#228a56]/20 border border-[#228a56] text-white flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#228a56] shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* 3 SaaS Plans Grid strictly implementing Page 6 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Plan 1: Plan Básico (Gratuito) - Teal/Cyan Header */}
        <div className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
          currentPlan === 'basico'
            ? 'bg-[#15171b] border-[#00d2b5] shadow-2xl shadow-[#00d2b5]/10'
            : 'bg-[#15171b] border-[#1c1f24] hover:border-[#333943]'
        }`}>
          <div>
            {/* Header pill banner */}
            <div className="p-6 bg-[#00d2b5] text-black">
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">Gratuito</div>
              <h2 className="text-2xl font-black mt-0.5">Plan Básico</h2>
              <div className="text-xs font-medium opacity-90 mt-1">Para proyectos piloto & barriales</div>
            </div>

            {/* Checklist from Page 6 */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#00d2b5]/20 text-[#00d2b5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span><strong className="text-white">Hasta 100 usuarios / pines</strong> en el mapa</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#00d2b5]/20 text-[#00d2b5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Filtros: barrio/localidad, grupo o evento</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#00d2b5]/20 text-[#00d2b5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Estadísticas generales y censuradas</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#00d2b5]/20 text-[#00d2b5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Monetización con anuncios en la app</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#00d2b5]/20 text-[#00d2b5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Pago por evento para exportar estadísticas</span>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            <button
              onClick={() => setCurrentPlan('basico')}
              className={`w-full py-3 rounded-full text-xs font-bold transition-all ${
                currentPlan === 'basico'
                  ? 'bg-[#1c1f24] text-[#00d2b5] border border-[#00d2b5]'
                  : 'bg-[#1c1f24] text-white hover:bg-[#23262d] border border-[#333943]'
              }`}
            >
              {currentPlan === 'basico' ? '✓ Plan Activo' : 'Seleccionar Básico'}
            </button>
          </div>
        </div>

        {/* Plan 2: Plan Premium (Empresarial / Institucional) - Blue / Purple Header */}
        <div className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden relative ${
          currentPlan === 'premium'
            ? 'bg-[#15171b] border-[#007afc] shadow-2xl shadow-[#007afc]/20 ring-1 ring-[#007afc]'
            : 'bg-[#15171b] border-[#1c1f24] hover:border-[#333943]'
        }`}>
          {/* Badge */}
          <div className="absolute top-3 right-3 bg-[#0e1012] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
            Recomendado
          </div>

          <div>
            {/* Header pill banner */}
            <div className="p-6 bg-gradient-to-r from-[#007afc] to-[#0052ad] text-white">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-200">Empresarial / Institucional</div>
              <h2 className="text-2xl font-black mt-0.5">Plan Premium</h2>
              <div className="text-xs font-medium text-blue-100 mt-1">Con verificación de empresa</div>
            </div>

            {/* Checklist from Page 6 */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#007afc]/20 text-[#007afc] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span><strong className="text-white">Verificación de empresa</strong> (automática o manual)</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#007afc]/20 text-[#007afc] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Registro de trabajadores con validación tipo SheerID</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#007afc]/20 text-[#007afc] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span><strong className="text-white">Acceso ilimitado</strong> a estadísticas e informes</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#007afc]/20 text-[#007afc] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Campos personalizados en encuestas (fecha nacimiento, número de hijos, etc.)</span>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            <button
              onClick={() => setCurrentPlan('premium')}
              className={`w-full py-3 rounded-full text-xs font-bold transition-all shadow-lg ${
                currentPlan === 'premium'
                  ? 'bg-[#007afc] text-white shadow-[#007afc]/30'
                  : 'bg-[#007afc] hover:bg-[#0062ca] text-white shadow-[#007afc]/20'
              }`}
            >
              {currentPlan === 'premium' ? '✓ Plan Activo (Empresarial)' : 'Activar Plan Premium'}
            </button>
          </div>
        </div>

        {/* Plan 3: Modo Campaña (Político / Nacional) - Coral / Crimson Header */}
        <div className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
          currentPlan === 'campana'
            ? 'bg-[#15171b] border-[#ef4444] shadow-2xl shadow-[#ef4444]/20 ring-1 ring-[#ef4444]'
            : 'bg-[#15171b] border-[#1c1f24] hover:border-[#333943]'
        }`}>
          <div>
            {/* Header pill banner */}
            <div className="p-6 bg-[#ef4444] text-white">
              <div className="text-xs font-bold uppercase tracking-wider text-red-100">Político / Nacional</div>
              <h2 className="text-2xl font-black mt-0.5">Modo Campaña</h2>
              <div className="text-xs font-medium text-red-100 mt-1">Despliegues masivos por toda Colombia</div>
            </div>

            {/* Checklist from Page 6 */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span><strong className="text-white">Despliegues masivos</strong> en simultáneo</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Uso ilimitado en cualquier barrio, pueblo o toda Colombia</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Modificación total de encuestas y métricas, sin restricciones</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#a0aaba]">
                <div className="w-4 h-4 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Servidores dedicados y sincronización masiva con PostGIS</span>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            <button
              onClick={() => setCurrentPlan('campana')}
              className={`w-full py-3 rounded-full text-xs font-bold transition-all ${
                currentPlan === 'campana'
                  ? 'bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/20'
                  : 'bg-[#1c1f24] text-white hover:bg-[#23262d] border border-[#333943]'
              }`}
            >
              {currentPlan === 'campana' ? '✓ Plan Activo (Nacional)' : 'Activar Modo Campaña'}
            </button>
          </div>
        </div>

      </div>

      {/* Verificación de Empresa en Premium Section (Page 6 of PDF) */}
      <div className="bg-[#15171b] rounded-3xl border border-[#1c1f24] p-6 sm:p-8 shadow-2xl">
        
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#007afc]">
            VERIFICACIÓN DE EMPRESA EN PREMIUM · EL CLIENTE ELIGE EL FLUJO
          </span>
          <h3 className="text-xl font-bold text-white mt-1">
            Validación de entidad jurídica e institucional
          </h3>
          <p className="text-xs text-[#8b96aa] mt-1">
            Estado actual: {verification.status === 'verified' ? (
              <span className="text-[#228a56] font-bold">✓ Verificado ({verification.companyName})</span>
            ) : (
              <span className="text-[#f59e0b] font-bold">Sin verificar</span>
            )}
          </p>
        </div>

        {/* Tab switch between Automático vs Manual */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#1c1f24] pb-4">
          <button
            onClick={() => setActiveFlowTab('automatico')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeFlowTab === 'automatico'
                ? 'bg-[#007afc] text-white shadow-md'
                : 'bg-[#1c1f24] text-[#a0aaba] hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Flujo 1: Automático</span>
          </button>

          <button
            onClick={() => setActiveFlowTab('manual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeFlowTab === 'manual'
                ? 'bg-[#007afc] text-white shadow-md'
                : 'bg-[#1c1f24] text-[#a0aaba] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Flujo 2: Manual (RUT / Cámara de Comercio)</span>
          </button>
        </div>

        {/* Flow 1: Automático (Page 6: Validadores de identidad, correos corporativos o pasarelas de pago, para activación inmediata) */}
        {activeFlowTab === 'automatico' && (
          <form onSubmit={handleAutomaticVerification} className="space-y-4 max-w-2xl animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#1c1f24] border border-[#23262d] text-xs text-[#a0aaba] mb-4">
              <strong className="text-white block mb-0.5">Validación Instantánea:</strong>
              Validadores de identidad corporativa, dominio de correo de empresa y pasarela de pago para activación inmediata.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                  Razón Social / Empresa:
                </label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                  NIT o Identificador Tributario:
                </label>
                <input
                  type="text"
                  required
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                Correo Corporativo (@empresa.com):
              </label>
              <input
                type="email"
                required
                value={corpEmail}
                onChange={(e) => setCorpEmail(e.target.value)}
                className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
              />
              <span className="text-[11px] text-[#566171] mt-1 block">
                Se enviará un token de autenticación institucional SheerID.
              </span>
            </div>

            <button
              type="submit"
              disabled={verifyingProcess}
              className="px-6 py-2.5 rounded-full bg-[#007afc] hover:bg-[#0062ca] text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
            >
              {verifyingProcess ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Validando con Cámara de Comercio & SheerID...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificar y Activar Premium Inmediato</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Flow 2: Manual (Page 6: Carga de documentación RUT o Cámara de Comercio para validación interna del equipo) */}
        {activeFlowTab === 'manual' && (
          <form onSubmit={handleManualVerification} className="space-y-4 max-w-2xl animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#1c1f24] border border-[#23262d] text-xs text-[#a0aaba] mb-4">
              <strong className="text-white block mb-0.5">Validación Documental por Equipo Interno:</strong>
              Carga tu RUT actualizado o Certificado de Existencia y Representación Legal (Cámara de Comercio vigente).
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                  Empresa o Institución:
                </label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b96aa] mb-1">
                  NIT:
                </label>
                <input
                  type="text"
                  required
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full bg-[#1c1f24] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#23262d] focus:border-[#007afc] focus:outline-none"
                />
              </div>
            </div>

            {/* Document Drag / Upload Box */}
            <div className="border-2 border-dashed border-[#333943] hover:border-[#007afc] rounded-2xl p-6 text-center cursor-pointer bg-[#1c1f24]/50 transition-colors">
              <Upload className="w-8 h-8 text-[#007afc] mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">
                {uploadedFile ? `Archivo seleccionado: ${uploadedFile}` : 'Arrastra o haz clic para subir RUT o Cámara de Comercio'}
              </p>
              <p className="text-[11px] text-[#8b96aa] mt-1">
                Formatos permitidos: PDF, PNG, JPG (máx. 10MB)
              </p>
              <button
                type="button"
                onClick={() => setUploadedFile('RUT_CamaraComercio_2026_Verificado.pdf')}
                className="mt-3 px-4 py-1.5 rounded-full bg-[#23262d] text-white text-[11px] font-medium hover:bg-[#333943]"
              >
                Simular subida de archivo RUT
              </button>
            </div>

            <button
              type="submit"
              disabled={verifyingProcess}
              className="px-6 py-2.5 rounded-full bg-[#007afc] hover:bg-[#0062ca] text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
            >
              {verifyingProcess ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Enviando a equipo de auditoría...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Enviar Documentación para Validación</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
