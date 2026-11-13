import React from 'react';
import { X, Users } from 'lucide-react';
import { ModuloEntrevistadores } from './ModuloEntrevistadores';
import { EntrevistadorActivo } from '../../utils/invitationService';

interface VotalityInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminTier: string;
  activeInterviewersCount?: number;
  maxInterviewers: number;
  onNavigateToJoin?: (token: string) => void;
  campanaId?: string;
  onSyncInterviewers?: (activos: EntrevistadorActivo[]) => void;
}

export const VotalityInvitationsModal: React.FC<VotalityInvitationsModalProps> = ({
  isOpen,
  onClose,
  adminTier,
  maxInterviewers,
  onNavigateToJoin,
  campanaId = 'camp-default',
  onSyncInterviewers,
}) => {
  if (!isOpen) return null;

  const planLabel =
    adminTier === 'premium'
      ? 'Plan Premium'
      : adminTier === 'departamental'
      ? 'Campaña Departamental'
      : adminTier === 'municipal'
      ? 'Campaña Municipal'
      : 'Campaña Comunal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-black border-2 border-white rounded-[3.6px] shadow-[0_0_50px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#000000]">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-white" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                  Equipo de Entrevistadores
                </h2>
                <span className="px-2 py-0.5 rounded-[2px] bg-[#1a1a1a] border border-[#333333] font-mono text-[10px] text-white font-bold uppercase">
                  {planLabel} (Máx. {maxInterviewers})
                </span>
              </div>
              <p className="text-xs text-[#888888] font-mono mt-0.5">
                Genera el enlace de invitación y se vinculará automáticamente al registrarse.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-white transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Módulo Simplificado de Entrevistadores */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <ModuloEntrevistadores
            campanaId={campanaId}
            tipoPlan={planLabel}
            limiteCupos={maxInterviewers}
            onSyncInterviewers={onSyncInterviewers}
            onNavigateToJoin={onNavigateToJoin}
          />
        </div>
      </div>
    </div>
  );
};
