import React from 'react';
import { 
  Database, 
  Server, 
  Smartphone, 
  Monitor, 
  Layers, 
  CheckCircle2, 
  Shield, 
  Cpu, 
  Globe2, 
  FileSpreadsheet, 
  X,
  CreditCard,
  Mail,
  UserCheck
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#15171b] border border-[#1c1f24] rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1c1f24]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#228a56]/20 text-[#228a56] border border-[#228a56]/40 text-xs font-semibold tracking-wider uppercase mb-2">
              INSUMO PARA LA COTIZACIÓN FINAL · PÁGINA 7
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Arquitectura técnica a evaluar
            </h2>
            <p className="text-xs sm:text-sm text-[#a0aaba] mt-1 max-w-2xl">
              Para estructurar la cotización, el equipo evaluó la arquitectura requerida. A nivel de base de datos, implementar <span className="text-[#007afc] font-semibold">PostGIS sobre PostgreSQL</span> facilita las consultas de radio y el filtrado por polígonos de barrios y localidades.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b96aa] hover:text-white p-2 rounded-xl bg-[#1c1f24] border border-[#23262d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical Architecture Diagram strictly from Page 7 */}
        <div className="my-6 space-y-6">
          
          {/* Level 1: CLIENTES */}
          <div className="p-4 rounded-2xl bg-[#0e1012] border border-[#1c1f24] relative">
            <span className="text-[10px] font-bold text-[#00d2b5] uppercase tracking-wider block mb-3">
              1. CLIENTES
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#15171b] border border-[#23262d] flex items-center gap-3">
                <Monitor className="w-6 h-6 text-[#007afc]" />
                <div>
                  <h4 className="text-sm font-bold text-white">App Web</h4>
                  <p className="text-[11px] text-[#8b96aa]">Dashboard administrador, analítica, mapa y exportación</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#15171b] border border-[#23262d] flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-[#00d2b5]" />
                <div>
                  <h4 className="text-sm font-bold text-white">App Móvil</h4>
                  <p className="text-[11px] text-[#8b96aa]">Captura en campo, geocodificación GPS y modo sin conexión</p>
                </div>
              </div>
            </div>
          </div>

          {/* Level 2: SERVICIOS DE LA PLATAFORMA */}
          <div className="p-4 rounded-2xl bg-[#0e1012] border border-[#1c1f24]">
            <span className="text-[10px] font-bold text-[#007afc] uppercase tracking-wider block mb-3">
              2. SERVICIOS DE LA PLATAFORMA
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#15171b] border border-[#23262d] text-center">
                <Shield className="w-5 h-5 text-[#007afc] mx-auto mb-1.5" />
                <h5 className="text-xs font-bold text-white">Autenticación</h5>
                <p className="text-[10px] text-[#8b96aa] mt-0.5">Estándar & Google OAuth</p>
              </div>
              <div className="p-3 rounded-xl bg-[#15171b] border border-[#23262d] text-center">
                <UserCheck className="w-5 h-5 text-[#f59e0b] mx-auto mb-1.5" />
                <h5 className="text-xs font-bold text-white">Gestión de Planes</h5>
                <p className="text-[10px] text-[#8b96aa] mt-0.5">Permisos por encuestador</p>
              </div>
              <div className="p-3 rounded-xl bg-[#15171b] border border-[#23262d] text-center">
                <Cpu className="w-5 h-5 text-[#00d2b5] mx-auto mb-1.5" />
                <h5 className="text-xs font-bold text-white">Motor Encuestas</h5>
                <p className="text-[10px] text-[#8b96aa] mt-0.5">Preguntas y opciones dinámicas</p>
              </div>
              <div className="p-3 rounded-xl bg-[#15171b] border border-[#23262d] text-center">
                <FileSpreadsheet className="w-5 h-5 text-[#ef4444] mx-auto mb-1.5" />
                <h5 className="text-xs font-bold text-white">Estadísticas</h5>
                <p className="text-[10px] text-[#8b96aa] mt-0.5">Exportación PDF / Excel</p>
              </div>
            </div>
          </div>

          {/* Level 3: DATOS (PostgreSQL + PostGIS) */}
          <div className="p-5 rounded-2xl bg-[#0e1012] border-2 border-[#007afc]/50 relative shadow-lg shadow-[#007afc]/10">
            <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider block mb-2">
              3. CAPA DE DATOS GEOESPACIALES
            </span>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#007afc]/20 border border-[#007afc] flex items-center justify-center text-[#007afc]">
                  <Database className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">PostgreSQL + PostGIS</h4>
                  <p className="text-xs text-[#a0aaba]">
                    Almacenamiento de geometrías espaciales, índices R-Tree (GIST)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-[#1c1f24] text-white border border-[#23262d]">Pines con lat/lng</span>
                <span className="px-3 py-1 rounded-full bg-[#1c1f24] text-white border border-[#23262d]">Polígonos de barrios</span>
                <span className="px-3 py-1 rounded-full bg-[#1c1f24] text-white border border-[#23262d]">Consultas de radio ST_DWithin</span>
              </div>
            </div>
          </div>

          {/* Level 4: INTEGRACIONES POR DEFINIR */}
          <div className="p-4 rounded-2xl bg-[#0e1012] border border-[#1c1f24]">
            <span className="text-[10px] font-bold text-[#8b96aa] uppercase tracking-wider block mb-3">
              4. INTEGRACIONES POR DEFINIR (ROADMAP)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#15171b] border border-[#23262d] text-center text-white">
                Validación de identidad
              </div>
              <div className="p-2.5 rounded-xl bg-[#15171b] border border-[#23262d] text-center text-white">
                Pasarela de pagos
              </div>
              <div className="p-2.5 rounded-xl bg-[#15171b] border border-[#23262d] text-center text-white">
                Correo corporativo
              </div>
              <div className="p-2.5 rounded-xl bg-[#15171b] border border-[#23262d] text-center text-white">
                Anuncios (Plan Básico)
              </div>
              <div className="p-2.5 rounded-xl bg-[#15171b] border border-[#23262d] text-center text-white">
                Datos demográficos DANE
              </div>
            </div>
          </div>

        </div>

        {/* Checklist from Page 7: "QUÉ EVALUAR" */}
        <div className="p-5 rounded-2xl bg-[#1c1f24] border border-[#23262d]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#228a56]" />
            <span>Matriz de Requerimientos Técnicos (Qué Evaluar)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#a0aaba]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Soporte de mapas y geocodificación de direcciones</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Clustering de pines con alto volumen (sin saturación)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Consultas espaciales con PostGIS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Roles: Administrador y Encuestador en campo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Límites por plan (100 pines en Básico)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Verificación de empresa en Plan Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Escala para Modo Campaña nacional</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#228a56]" />
              <span>Generación de informes PDF y Excel</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#007afc] hover:bg-[#0062ca] text-white text-xs font-bold shadow-md"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
