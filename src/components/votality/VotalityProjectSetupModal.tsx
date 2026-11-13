import React, { useState } from 'react';
import { ArrowRight, FolderGit2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface VotalityProjectSetupModalProps {
  isOpen: boolean;
  userEmail?: string;
  userId?: string;
  onProjectSaved: (projectName: string) => void;
}

export const VotalityProjectSetupModal: React.FC<VotalityProjectSetupModalProps> = ({
  isOpen,
  userEmail,
  userId,
  onProjectSaved,
}) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = projectName.trim();
    if (!cleanName) {
      setError('Por favor ingresa un nombre para tu proyecto de investigación.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Intentar persistir en backend Django si está disponible
      await fetch('/api/v1/proyecto/definir/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: cleanName,
          email: userEmail,
          user_id: userId,
        }),
      }).catch(() => null);
    } catch {
      // Modo offline transparente
    } finally {
      setLoading(false);
      onProjectSaved(cleanName);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans select-none">
      <div 
        className="w-full max-w-lg bg-[#000000] border-2 border-white rounded-[3.6px] shadow-[0_0_50px_rgba(255,255,255,0.15)] p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Monochromatic Tag */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[2.6px] bg-[#1a1a1a] border border-[#333333] font-mono text-[11px] text-[#cccccc] uppercase tracking-wider mb-4">
          <FolderGit2 className="w-3.5 h-3.5 text-white" />
          <span>CONFIGURACIÓN INICIAL OBLIGATORIA</span>
        </div>

        {/* Modal Titles */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase font-sans">
          DEFINIR PROYECTO DE INVESTIGACIÓN
        </h2>
        <p className="text-xs sm:text-sm text-[#888888] font-mono mt-2 leading-relaxed">
          Asigna un nombre identificador a tu despliegue de campo para continuar.
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-[#160000] border border-red-500/50 rounded-[3px] text-red-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#aaaaaa] mb-2">
              Nombre del Proyecto / Estudio *
            </label>
            <input
              type="text"
              autoFocus
              required
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej: Censo de Infraestructura Barrio Norte"
              className="w-full bg-[#111111] hover:bg-[#141414] focus:bg-[#000000] text-white text-sm font-mono px-4 py-3 border border-[#444444] focus:border-white rounded-[3.6px] transition-all focus:outline-none placeholder:text-[#555555]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !projectName.trim()}
              className="w-full py-3.5 px-4 bg-white hover:bg-[#e0e0e0] disabled:bg-[#333333] disabled:text-[#777777] disabled:cursor-not-allowed text-black font-mono text-xs uppercase font-bold tracking-wider rounded-[3.6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GUARDANDO PROYECTO...</span>
                </>
              ) : (
                <>
                  <span>INGRESAR AL MAPA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Informative Micro-copy */}
        <div className="mt-5 pt-4 border-t border-[#222222] text-center font-mono text-[10px] text-[#666666]">
          Este nombre se fijará permanentemente en el header superior de tu visor georreferenciado.
        </div>
      </div>
    </div>
  );
};

