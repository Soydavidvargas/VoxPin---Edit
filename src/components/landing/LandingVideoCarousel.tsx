import React, { useState, useEffect, useRef } from 'react';
import {
  PlayCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Video,
} from 'lucide-react';

interface TutorialVideoItem {
  id: number;
  title: string;
  videoId: string;
  url: string;
  tag: string;
  description: string;
}

const LANDING_VIDEOS: TutorialVideoItem[] = [
  {
    id: 1,
    title: '¿Que es Votality?',
    videoId: 'VkcQuTKK9qc',
    url: 'https://youtu.be/VkcQuTKK9qc',
    tag: 'FUNDAMENTOS DE LA PLATAFORMA',
    description:
      'Descubre cómo funciona la plataforma de georreferenciación electoral, cartografía territorial y consolidación de encuestas en tiempo real.',
  },
  {
    id: 2,
    title: 'Como crear y editar una encuesta?',
    videoId: 'w1UpqiNhZDY',
    url: 'https://youtu.be/w1UpqiNhZDY',
    tag: 'GESTIÓN DE FORMULARIOS Y ESQUEMA',
    description:
      'Aprende a configurar preguntas personalizadas, opciones múltiples y campos dinámicos que se sincronizan con todos tus encuestadores en campo.',
  },
  {
    id: 3,
    title: 'Como agregar una encuesta!',
    videoId: 'SZncDiN6dfQ',
    url: 'https://youtu.be/SZncDiN6dfQ',
    tag: 'LEVANTAMIENTO TERRITORIAL EN CAMPO',
    description:
      'Guía paso a paso para colocar un pin, capturar datos de encuestados, registrar ubicación satelital y acumular registros en un mismo predio.',
  },
];

export const LandingVideoCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Rotación automática cada 5.5 segundos.
  // Si el usuario coloca el cursor encima (isHovered = true) o está reproduciendo el video, el carrusel se detiene.
  // Si quita el cursor, el carrusel vuelve a moverse automáticamente.
  useEffect(() => {
    if (isHovered || isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LANDING_VIDEOS.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isHovered, isPlaying]);

  const currentVideo = LANDING_VIDEOS[currentIndex];

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : LANDING_VIDEOS.length - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % LANDING_VIDEOS.length);
  };

  const handleSelectVideo = (index: number) => {
    setIsPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section
      id="videos-demostracion"
      className="relative z-10 py-12 sm:py-16 border-b border-[#2e2e2e] bg-[#070707]/90 select-none font-sans"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 w-full">
        {/* Encabezado de la Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#141414] border border-[#2e2e2e] text-[#888888] font-mono text-[10px] uppercase tracking-widest mb-2">
              <Video className="w-3.5 h-3.5 text-[#00FF85]" />
              <span>DEMOSTRACIÓN EN VIDEO // TUTORIALES OFICIALES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Conoce Votality en acción
            </h2>
            <p className="text-xs sm:text-sm text-[#888888] font-mono mt-1">
              Guías oficiales paso a paso para el uso de la plataforma territorial.
            </p>
          </div>

          {/* Indicador de Estado del Carrusel Automático */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#777777] hidden sm:inline">
              {isHovered ? '⏸ Pausado por cursor' : '▶ Rotación automática'}
            </span>
            <div className="flex items-center gap-1.5 bg-[#111111] border border-[#2e2e2e] p-1 rounded-sm">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-xs hover:bg-white hover:text-black text-white transition-colors cursor-pointer"
                title="Video anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs text-[#00FF85] font-bold">
                {currentIndex + 1} / {LANDING_VIDEOS.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-xs hover:bg-white hover:text-black text-white transition-colors cursor-pointer"
                title="Video siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carrusel Automático con Detección de Hover (onMouseEnter / onMouseLeave) */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative bg-[#0d0d0d] border-2 border-[#2b2b2b] hover:border-white/50 rounded-sm shadow-[0_12px_45px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Reproductor de Video (16:9) */}
            <div className="lg:col-span-8 bg-black relative aspect-video flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#222222]">
              <iframe
                key={currentVideo.videoId}
                src={`https://www.youtube-nocookie.com/embed/${currentVideo.videoId}?rel=0&modestbranding=1&autoplay=0`}
                title={currentVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsPlaying(false)}
              />
            </div>

            {/* Panel Lateral con Información del Video y Selector de Lista */}
            <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between bg-[#0e0e0e] space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#00FF85] uppercase">
                    {currentVideo.tag}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {currentVideo.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#aaaaaa] font-sans leading-relaxed">
                  {currentVideo.description}
                </p>

                <div className="pt-2">
                  <a
                    href={currentVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#888888] hover:text-white transition-colors"
                  >
                    <span>Ver en YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Lista de Navegación de los 3 Videos */}
              <div className="space-y-2 border-t border-[#222222] pt-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] block font-semibold">
                  VIDEOS DEL TUTORIAL
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {LANDING_VIDEOS.map((vid, idx) => {
                    const isSelected = idx === currentIndex;
                    return (
                      <button
                        key={vid.id}
                        type="button"
                        onClick={() => handleSelectVideo(idx)}
                        className={`w-full p-2.5 rounded-sm border text-left font-mono text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#1a1a1a] border-[#00FF85] text-white shadow-sm'
                            : 'bg-[#0a0a0a] border-[#222222] text-[#888888] hover:text-white hover:border-[#444444]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-[#00FF85] animate-pulse' : 'bg-[#444444]'
                            }`}
                          />
                          <span className="truncate font-semibold">{vid.title}</span>
                        </div>
                        <span className="text-[10px] text-[#666666] shrink-0 font-bold">
                          0{idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Progreso de Tiempo / Auto-Play */}
          {!isHovered && (
            <div className="h-1 bg-[#1a1a1a] w-full overflow-hidden">
              <div
                key={currentIndex}
                className="h-full bg-[#00FF85] animate-[progress_5.5s_linear_infinite]"
                style={{
                  animation: 'progressBar 5.5s linear forwards',
                }}
              />
            </div>
          )}
        </div>

        {/* ADVERTENCIA EN COLOR AMARILLO POR DEBAJO DEL CARRUSEL (REQUERIDO) */}
        <div
          id="advertencia-beta-landing"
          className="mt-6 p-4 sm:p-5 rounded-sm bg-[#161203] border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col sm:flex-row items-start sm:items-center gap-3.5 transition-all"
        >
          <div className="p-2.5 rounded-sm bg-amber-400 text-black shrink-0 font-bold flex items-center justify-center shadow-md">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div className="flex-1 space-y-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-xs border border-amber-500/40">
                SISTEMA EN FUNCIÓN BETA
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-200 leading-relaxed font-sans">
              <strong>Esta es un sistema en funcion BETA</strong> las direcciones automaticas en la geolocalizaciones, no son 100% precisas, se recomienda encuestar en persona y automarcarse.
            </p>
            <p className="text-xs text-[#00FF85] font-semibold flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#00FF85] shrink-0" />
              <span>Las funciones de las estadísticas y otras funciones sí funcionan correctamente y están listas para usarse.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
