import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  FileText,
  Clock,
  Lock,
  CreditCard,
  AlertTriangle,
  Mail,
  Scale,
  Database,
  Building,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { ThreeBackground } from '../ThreeBackground';

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#070707] text-white font-sans selection:bg-white selection:text-black flex flex-col antialiased">
      {/* Dynamic 3D Background */}
      <ThreeBackground />

      {/* Header Sticky */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222222] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-white hover:text-black text-white text-xs font-mono font-bold uppercase rounded-sm border border-[#333333] hover:border-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Inicio</span>
          </button>
          <div className="h-4 w-[1px] bg-[#333333] hidden sm:block" />
          <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
            <span className="w-2 h-2 rounded-[1px] bg-[#00FF85] inline-block" />
            <span className="text-white font-bold tracking-wider">VOTALITY // LEGAL</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#777777] hidden md:block">
          Última actualización: Noviembre 2026
        </div>
      </header>

      {/* Hero Section Legal */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121212] border border-[#2a2a2a] text-[#00FF85] text-[11px] font-mono font-bold uppercase tracking-wider rounded-xs mb-4">
          <Scale className="w-3.5 h-3.5 text-[#00FF85]" />
          <span>Marco Legal y Normativo</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans mb-4">
          Términos y Condiciones, Suscripciones y Políticas
        </h1>
        <p className="text-sm sm:text-base text-[#aaaaaa] font-sans leading-relaxed">
          Bienvenido a <strong className="text-white">Votality</strong>. Este documento regula el acceso, uso de la plataforma de recolección georreferenciada de datos, las condiciones de suscripción, políticas de retención, respaldo y tratamiento de datos personales.
        </p>
      </div>

      {/* Content Body */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-10 text-xs sm:text-sm text-[#cccccc] font-sans">
        
        {/* 1. Naturaleza del Servicio */}
        <section className="bg-[#0c0c0c] border border-[#222222] rounded-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold font-mono text-sm sm:text-base uppercase tracking-wider border-b border-[#1f1f1f] pb-3">
            <Database className="w-4 h-4 text-[#00FF85]" />
            <span>1. Naturaleza de la Plataforma</span>
          </div>
          <p className="leading-relaxed">
            Votality es una plataforma tecnológica SaaS neutral diseñada para la captura territorial, visualización cartográfica en tiempo real y análisis demográfico de encuestas para campañas electorales, estudios de mercado, organizaciones comunitarias, empresas e instituciones.
          </p>
          <p className="leading-relaxed text-[#999999]">
            Votality no tiene filiación ni sesgo partidista alguno. La plataforma actúa como proveedor neutral de infraestructura de procesamiento y almacenamiento de datos georreferenciados.
          </p>
        </section>

        {/* 2. Planes, Tarifas y Políticas de Suscripción */}
        <section className="bg-[#0c0c0c] border border-[#222222] rounded-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5 text-white font-bold font-mono text-sm sm:text-base uppercase tracking-wider border-b border-[#1f1f1f] pb-3">
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            <span>2. Políticas de Suscripciones y Tarifas</span>
          </div>

          {/* Subapartado: Plan Free */}
          <div className="space-y-2 bg-[#121212] p-4 rounded-sm border border-[#242424]">
            <div className="text-white font-bold font-mono text-xs uppercase flex items-center justify-between">
              <span>A. Plan Básico (Gratuito / Jamás Pagas)</span>
              <span className="text-[#00FF85]">$0 COP · Tiempo Ilimitado</span>
            </div>
            <p className="text-xs text-[#999999] leading-relaxed">
              El Plan Básico cuenta con <strong className="text-white">vigencia de tiempo ilimitado (acceso para siempre sin caducidad)</strong> y costo de $0 COP. El usuario acepta expresamente que este nivel contiene publicidad y anuncios comerciales integrados, y cuenta con un límite operativo de hasta 100 pines propios de uso estrictamente individual (sin habilitación para invitar encuestadores externos). Estas limitaciones se liberan al contratar cualquiera de los planes de pago.
            </p>
          </div>

          {/* Subapartado: Planes por Campaña */}
          <div className="space-y-2 bg-[#121212] p-4 rounded-sm border border-[#242424]">
            <div className="text-white font-bold font-mono text-xs uppercase flex items-center justify-between">
              <span>B. Planes por Campaña (Comunal, Municipal y Departamental)</span>
              <span className="text-[#D4AF37]">Pago Único · 6 Meses de Licencia</span>
            </div>
            <p className="text-xs text-[#999999] leading-relaxed">
              Los planes por campaña operan bajo la modalidad de pago único por nivel territorial para un período de vigencia de seis (6) meses. La inversión contempla el acceso a infraestructura de alta capacidad, coordinación de múltiples encuestadores en campo, formularios avanzados y cruces estadísticos en tiempo real.
            </p>
          </div>

          {/* Subapartado: Paquetes Adicionales de Pines */}
          <div className="space-y-2 bg-[#121212] p-4 rounded-sm border border-[#242424]">
            <div className="text-white font-bold font-mono text-xs uppercase flex items-center justify-between">
              <span>C. Paquetes Adicionales de Pines</span>
              <span className="text-amber-300">$350.000 COP / 1.000 Pines</span>
            </div>
            <p className="text-xs text-[#999999] leading-relaxed">
              Durante la vigencia de la campaña, el titular podrá adquirir paquetes adicionales de 1.000 pines por un valor de $350.000 COP cada uno. Por políticas de capacidad y dimensionamiento, esta opción tiene un tope máximo estricto de tres (3) adquisiciones por campaña (hasta un máximo acumulado de 3.000 pines adicionales).
            </p>
          </div>

          {/* Subapartado: Plan Premium y Empresarial */}
          <div className="space-y-2 bg-[#121212] p-4 rounded-sm border border-[#242424]">
            <div className="text-white font-bold font-mono text-xs uppercase flex items-center justify-between">
              <span>D. Plan Premium y Empresarial / Institucional</span>
              <span className="text-white">Mensual & Corporativo</span>
            </div>
            <p className="text-xs text-[#999999] leading-relaxed">
              El <strong>Plan Premium</strong> se factura de forma mensual flexible sin cláusula de permanencia para eventos masivos y grupos de trabajo profesional sin publicidad. El <strong>Plan Empresarial e Institucional</strong> se rige bajo acuerdos privados y protocolos de confidencialidad (NDA) para sondeos corporativos e institucionales protegidos.
            </p>
          </div>
        </section>

        {/* 3. Privacidad Absoluta e Inviolabilidad de PINES por Cuenta */}
        <section className="bg-[#0b100d] border-2 border-[#00FF85]/60 rounded-sm p-6 sm:p-8 space-y-4 shadow-[0_0_30px_rgba(0,255,133,0.08)]">
          <div className="flex items-center gap-2.5 text-[#00FF85] font-bold font-mono text-sm sm:text-base uppercase tracking-wider border-b border-[#14291e] pb-3">
            <Lock className="w-4 h-4 text-[#00FF85]" />
            <span>3. Privacidad Absoluta e Inviolabilidad de PINES por Cuenta</span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-[#dcdcdc]">
            <p>
              En Votality, <strong className="text-white">los PINES son 100% privados para cada cuenta registrada en la plataforma</strong>. No se pueden compartir ni ser visualizados por ningún usuario ajeno bajo ninguna circunstancia.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 bg-[#0e1712] border border-[#1b3b29] rounded-sm space-y-1.5">
                <div className="text-white font-mono font-bold text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF85]" />
                  <span>Plataforma Privada e Impenetrable</span>
                </div>
                <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
                  Todos los usuarios tienen su plataforma completamente privada. Ningún candidato, partido, empresa u organización registrada podrá ver los PINES ajenos de otra cuenta. Cada cartografía opera en un entorno lógico hermético y blindado.
                </p>
              </div>

              <div className="p-3.5 bg-[#0e1712] border border-[#1b3b29] rounded-sm space-y-1.5">
                <div className="text-white font-mono font-bold text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF85]" />
                  <span>Acceso Exclusivo Mediante Token Oficial</span>
                </div>
                <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
                  Únicamente podrá ver los pines privados de una cuenta Administrador aquella persona a la que dicho Administrador le haya otorgado directamente un <strong className="text-white">token o link oficial de invitación</strong> que lo faculta como encuestador de ese equipo.
                </p>
              </div>
            </div>

            <p className="text-[#aaaaaa] pt-1">
              Sin excepción alguna e independientemente del tipo de licencia contratada (Plan Básico Gratuito, Campaña Comunal, Municipal, Departamental, Premium o Empresarial), <strong className="text-white">nadie podrá ver los PINES ajenos</strong> a menos que sea un encuestador formalmente validado con token por el administrador de esa cuenta.
            </p>
          </div>
        </section>

        {/* 4. Duración de Licencia, Borrado Seguro y Respaldo por Correo */}
        <section className="bg-[#121008] border-2 border-[#D4AF37]/60 rounded-sm p-6 sm:p-8 space-y-4 shadow-[0_0_30px_rgba(212,175,55,0.08)]">
          <div className="flex items-center gap-2.5 text-amber-300 font-bold font-mono text-sm sm:text-base uppercase tracking-wider border-b border-[#2e260c] pb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>4. Duración de la Licencia (6 Meses), Depuración y Respaldo Garantizado</span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-[#dcdcdc]">
            <p>
              <strong className="text-white">A. Vigencia de 6 Meses:</strong> La licencia de los planes por campaña electoral tiene una duración ininterrumpida de <span className="text-amber-300 font-bold">seis (6) meses calendario</span> a partir de la fecha de activación del servicio.
            </p>

            <div className="p-4 bg-[#1a1505] border border-amber-500/40 rounded-sm flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 uppercase font-mono text-[11px] mb-1">
                  Respaldo Obligatorio Antes de 15 Días del Cierre
                </strong>
                Con el propósito de proteger la confidencialidad estratégica de la campaña y en cumplimiento del protocolo de inmutabilidad y soberanía de datos, <strong className="text-white">quince (15) días antes</strong> de que finalicen los seis meses de vigencia, toda la información levantada será depurada de forma definitiva y segura de nuestros servidores activos.
              </div>
            </div>

            <p>
              <strong className="text-white">B. Envío Automatizado en PDF y Excel:</strong> Previo al borrado de seguridad, la plataforma remitirá automáticamente a la dirección de correo electrónico registrada del Administrador de la Campaña un <strong className="text-white">informe consolidado en PDF</strong> (con estadísticas, cruces y mapas) junto con la <strong className="text-white">base de datos completa tabulada en Excel</strong> con la última información guardada.
            </p>
          </div>
        </section>

        {/* 5. Política de Privacidad y Tratamiento de Datos Personales */}
        <section className="bg-[#0c0c0c] border border-[#222222] rounded-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold font-mono text-sm sm:text-base uppercase tracking-wider border-b border-[#1f1f1f] pb-3">
            <Lock className="w-4 h-4 text-[#00FF85]" />
            <span>5. Tratamiento de Datos Personales y Habeas Data</span>
          </div>

          <p className="leading-relaxed">
            En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> de la República de Colombia y su Decreto Reglamentario 1377 de 2013, el cliente y sus encuestadores autorizados asumen la calidad de <span className="text-white font-medium">Responsables del Tratamiento de los Datos</span> recolectados en campo, debiendo garantizar la autorización previa, expresa e informada de cada ciudadano encuestado.
          </p>

          <ul className="space-y-2 text-xs text-[#aaaaaa] list-disc pl-5">
            <li>
              <strong className="text-white">Aislamiento de Información:</strong> Cada perfil de campaña cuenta con aislamiento lógico estricto. Ninguna otra organización o usuario tiene acceso a los pines, nombres ni respuestas capturados por su equipo.
            </li>
            <li>
              <strong className="text-white">Enlaces de Invitación de Un Solo Uso:</strong> Los enlaces emitidos para encuestadores son de uso único y quedan asociados al primer dispositivo que los activa para evitar fugas de información o intrusiones de terceros.
            </li>
            <li>
              <strong className="text-white">No Comercialización:</strong> Votality jamás comercializa, vende, cede ni transfiere a terceras entidades las bases de datos de personas encuestadas generadas por sus usuarios.
            </li>
          </ul>
        </section>

        {/* 6. Geolocalización y Advertencia Técnica BETA */}
        <section className="bg-[#0c0c0c] border border-[#222222] rounded-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold font-mono text-sm sm:text-base uppercase tracking-wider border-b border-[#1f1f1f] pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>6. Geolocalización y Advertencia de Precisión en Función BETA</span>
          </div>

          <p className="leading-relaxed">
            La georreferenciación satelital y la normalización de direcciones colombianas opera con modelos de aproximación cartográfica. El usuario comprende y acepta que:
          </p>

          <div className="p-3.5 bg-[#141414] border border-[#2e2e2e] rounded-xs text-xs text-[#aaaaaa] leading-relaxed">
            <span className="text-amber-400 font-bold uppercase font-mono block mb-1">
              ADVERTENCIA DE SERVICIO BETA EN GEOLOCALIZACIÓN:
            </span>
            Las direcciones automáticas en las geolocalizaciones no son 100% infalibles ni exactas debido a variaciones en la nomenclatura urbana y rural colombiana. Por tal razón, se recomienda encuestar presencialmente en terreno y utilizar la opción de automarcación satelital GPS en puerta o calibración en el minimapa. Las funciones estadísticas, analíticas y métricas territoriales se encuentran operativas y listas para su uso.
          </div>
        </section>

        {/* 6. Contacto y Soporte */}
        <section className="bg-[#0c0c0c] border border-[#222222] rounded-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-white font-bold font-mono text-sm uppercase mb-1">
              ¿Dudas legales o requerimientos especiales?
            </div>
            <p className="text-xs text-[#888888]">
              Nuestro equipo legal y de soporte técnico atiende solicitudes de titulares y administradores.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase font-mono tracking-wider rounded-sm hover:bg-[#e0e0e0] transition-colors shrink-0 cursor-pointer"
          >
            Aceptar y Continuar
          </button>
        </section>

      </main>

      {/* Footer Mínimo */}
      <footer className="relative z-10 border-t border-[#1f1f1f] py-6 text-center text-xs text-[#666666] font-mono">
        © {new Date().getFullYear()} Votality · Sistema Territorial Neutral · Todos los derechos reservados.
      </footer>
    </div>
  );
};
