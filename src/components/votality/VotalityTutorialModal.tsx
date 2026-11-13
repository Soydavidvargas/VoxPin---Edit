import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  HelpCircle,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export interface VotalityTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

interface TutorialVideo {
  id: number;
  title: string;
  videoId: string;
  url: string;
  tag: string;
  description: string;
}

const TUTORIAL_VIDEOS: TutorialVideo[] = [
  {
    id: 1,
    title: '¿Que es Votality?',
    videoId: 'VkcQuTKK9qc',
    url: 'https://youtu.be/VkcQuTKK9qc',
    tag: 'Fundamentos de la Plataforma',
    description:
      'Descubre la visión de Votality: un sistema de información geográfica de alto rendimiento para georreferenciación de encuestas, censo barrial y seguimiento electoral en tiempo real con precisión satelital.',
  },
  {
    id: 2,
    title: 'Como crear y editar una encuesta?',
    videoId: 'w1UpqiNhZDY',
    url: 'https://youtu.be/w1UpqiNhZDY',
    tag: 'Gestión y Configuración de Formularios',
    description:
      'Aprende a utilizar el editor de preguntas: añade campos de texto, opciones múltiples, escalas de valoración y ajusta los parámetros de tu cuestionario antes del despliegue en campo.',
  },
  {
    id: 3,
    title: 'Como agregar una encuesta!',
    videoId: 'SZncDiN6dfQ',
    url: 'https://youtu.be/SZncDiN6dfQ',
    tag: 'Captura y Levantamiento Territorial',
    description:
      'Guía práctica para registrar una nueva encuesta georreferenciada en el mapa satelital: asignación de departamento, municipio, barrio, autocompletado y guardado inmutable.',
  },
];

export const VotalityTutorialModal: React.FC<VotalityTutorialModalProps> = ({
  isOpen,
  onClose,
  isFirstTime = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState<number>(isFirstTime ? 5 : 0);

  // Manejo del contador regresivo de 5 segundos si es la primera vez
  useEffect(() => {
    if (!isOpen) return;

    if (isFirstTime) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [isOpen, isFirstTime]);

  // Si no está abierto, no renderizar
  if (!isOpen) return null;

  const currentVideo = TUTORIAL_VIDEOS[currentIndex];
  const isCloseLocked = isFirstTime && countdown > 0;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : TUTORIAL_VIDEOS.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < TUTORIAL_VIDEOS.length - 1 ? prev + 1 : 0));
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isCloseLocked) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-3xl bg-[#090909] border border-[#333333] shadow-2xl rounded-sm flex flex-col max-h-[92vh] overflow-hidden font-sans">
        {/* Header Superior */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#222222] bg-[#0d0d0d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#002b15] border border-[#00FF85]/30 rounded-xs text-[#00FF85]">
              <PlayCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#00FF85] font-bold">
                  Tutoriales Oficiales
                </span>
                {isFirstTime && (
                  <span className="text-[9px] font-mono uppercase bg-[#181818] text-[#e0e0e0] border border-[#333333] px-1.5 py-0.2 rounded-xs">
                    Bienvenido a Votality
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#FFFFFF] mt-0.5">
                Centro de Aprendizaje en Video
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isCloseLocked}
            className={`p-1.5 rounded-sm border transition-all ${
              isCloseLocked
                ? 'opacity-30 cursor-not-allowed border-[#333333] text-[#666666]'
                : 'hover:bg-[#1a1a1a] text-[#888888] hover:text-[#FFFFFF] border-transparent hover:border-[#444444] cursor-pointer'
            }`}
            title={isCloseLocked ? `Disponible en ${countdown}s` : 'Cerrar ventana'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Selección Rápida de Video */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#070707] border-b border-[#1c1c1c] flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin">
          {TUTORIAL_VIDEOS.map((vid, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={vid.id}
                onClick={() => setCurrentIndex(idx)}
                className={`px-3 py-1.5 rounded-xs text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#000000] font-bold shadow-md'
                    : 'bg-[#141414] text-[#888888] hover:text-[#FFFFFF] border border-[#222222] hover:border-[#444444]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-[#00FF85]' : 'bg-[#555555]'
                  }`}
                />
                <span>
                  {idx + 1}. {vid.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cuerpo del Video (Área del Carrusel) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Contenedor del Reproductor con Navegación Lateral */}
          <div className="relative w-full aspect-video bg-[#000000] border border-[#2a2a2a] rounded-sm overflow-hidden shadow-xl group">
            <iframe
              key={currentVideo.videoId}
              src={`https://www.youtube.com/embed/${currentVideo.videoId}?rel=0&modestbranding=1`}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />

            {/* Controles de Navegación del Carrusel (Prev / Next Flotantes) */}
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black text-white rounded-full border border-white/20 hover:border-[#00FF85] transition-all opacity-80 hover:opacity-100 cursor-pointer shadow-lg z-10"
              title="Video anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black text-white rounded-full border border-white/20 hover:border-[#00FF85] transition-all opacity-80 hover:opacity-100 cursor-pointer shadow-lg z-10"
              title="Siguiente video"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Ficha Descriptiva del Video Actual */}
          <div className="p-3.5 bg-[#0d0d0d] border border-[#222222] rounded-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-[#181818] text-[#00FF85] border border-[#00FF85]/30 px-2 py-0.5 rounded-xs">
                  {currentVideo.tag}
                </span>
                <span className="text-[10px] font-mono text-[#666666]">
                  Video {currentIndex + 1} de {TUTORIAL_VIDEOS.length}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#FFFFFF]">
                {currentVideo.title}
              </h3>
              <p className="text-xs text-[#999999] leading-relaxed font-sans">
                {currentVideo.description}
              </p>
            </div>

            <a
              href={currentVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1f1f1f] border border-[#333333] hover:border-[#555555] text-xs font-mono text-[#cccccc] hover:text-[#FFFFFF] rounded-xs transition-colors shrink-0 self-start cursor-pointer"
            >
              <span>Ver en YouTube</span>
              <ExternalLink className="w-3 h-3 text-[#888888]" />
            </a>
          </div>

          {/* Aviso especial cuando es primera vez */}
          {isCloseLocked && (
            <div className="p-2.5 bg-[#141000] border border-[#664d00] rounded-sm text-xs font-mono text-[#ffcc00] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0 text-[#ffcc00]" />
                <span className="text-[11px]">
                  Como es tu primera vez en la plataforma, te sugerimos ver este tutorial.
                </span>
              </div>
              <span className="px-2 py-0.5 bg-[#ffcc00] text-[#000000] text-[10px] font-bold rounded-xs shrink-0 animate-pulse">
                Desbloqueo en {countdown}s
              </span>
            </div>
          )}
        </div>

        {/* Footer Inferior */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#222222] bg-[#0a0a0a] flex items-center justify-between gap-3">
          {/* Indicador de Posición en Carrusel */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_VIDEOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-[#00FF85]'
                    : 'w-2 bg-[#333333] hover:bg-[#666666]'
                }`}
                title={`Ir al video ${idx + 1}`}
              />
            ))}
          </div>

          {/* Botón Principal de Salida */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isCloseLocked}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 font-bold cursor-pointer ${
                isCloseLocked
                  ? 'bg-[#181818] text-[#555555] border border-[#2a2a2a] cursor-not-allowed'
                  : 'bg-[#00FF85] hover:bg-[#00e075] text-[#000000] shadow-[0_0_12px_rgba(0,255,133,0.3)]'
              }`}
            >
              {isCloseLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Espera {countdown}s para continuar</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isFirstTime ? 'Comenzar a usar Votality' : 'Cerrar Tutorial'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
