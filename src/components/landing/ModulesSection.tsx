import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  BarChart3, 
  FileSpreadsheet, 
  FileDown, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Search, 
  Users, 
  Crosshair, 
  CheckCircle2, 
  ArrowRight,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { ScrollReveal } from '../ui/ScrollReveal';
import { useSkeleton } from '../../context/SkeletonContext';
import { Skeleton, SkeletonBadge, SkeletonText } from '../ui/Skeleton';

export const ModulesSection: React.FC = () => {
  const { isSkeleton } = useSkeleton();
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);

  // Slide 1 interactive survey demo state
  const [selectedAnswer, setSelectedAnswer] = useState<string>('candidato_a');
  
  // Slide 2 interactive map pin demo state
  const [activePinDemo, setActivePinDemo] = useState<number>(1);
  const [pinMode, setPinMode] = useState<'address' | 'manual'>('manual');
  
  // Slide 3 demographic comparison zone selector
  const [selectedZone, setSelectedZone] = useState<'norte' | 'centro' | 'sur'>('centro');

  const slides = [
    {
      id: '01',
      badge: 'PASO 01 · CONFIGURACIÓN',
      tabLabel: '[01] CREAR ENCUESTA',
      title: 'Crea tu encuesta personalizada',
      subtitle: 'Diseña cuestionarios adaptados a tu necesidad: política, comercial o comunitaria.',
      description: 'Define preguntas dinámicas de opción múltiple, escala de valoración o campos abiertos. Configura preguntas obligatorias como rango de edad, género o estrato socioeconómico para el posterior cruce de datos.',
      features: [
        'Editor ágil de preguntas con lógica condicional',
        'Filtros demográficos clave para control de muestra',
        'Despliegue instantáneo hacia la app móvil de los encuestadores'
      ],
      icon: SlidersHorizontal
    },
    {
      id: '02',
      badge: 'PASO 02 · GEOLOCALIZACIÓN',
      tabLabel: '[02] MARCAR CON PIN',
      title: 'Marca cada respuesta con un PIN en el mapa',
      subtitle: 'Por dirección escrita o tocando directamente en el mapa manual.',
      description: 'Cada persona que responde se convierte en un PIN georreferenciado con coordenadas exactas. El encuestador puede buscar la dirección con autocompletado inteligente o colocar el PIN manualmente en el mapa si está en zonas rurales o sin numeración.',
      features: [
        'Doble método: búsqueda por dirección o marcación manual en mapa',
        'Clustering inteligente: agrupa encuestados que viven en el mismo predio',
        'Captura de coordenadas GPS de alta precisión en tiempo real'
      ],
      icon: MapPin
    },
    {
      id: '03',
      badge: 'PASO 03 · RIGOR DEMOGRÁFICO',
      tabLabel: '[03] CRUCE VS. HABITANTES',
      title: 'Cruza los pines contra los habitantes reales',
      subtitle: 'Mide la representatividad estadística comparando tu muestra con la población de la zona.',
      description: 'El sistema calcula automáticamente la proporción entre las personas que marcaste con PIN y la cantidad total de habitantes censados en esa comuna, barrio o polígono territorial. Sabrás de inmediato qué porcentaje de la población real cubriste.',
      features: [
        'Índice de cobertura: pines marcados vs. población total censada',
        'Detección de sectores vacíos o sobre-muestreados en el mapa',
        'Cálculo dinámico de margen de error y representatividad estadística'
      ],
      icon: Users
    },
    {
      id: '04',
      badge: 'PASO 04 · TOMA DE DECISIONES',
      tabLabel: '[04] ESTADÍSTICAS & REPORTES',
      title: 'Estadísticas territoriales y reportes en 1 clic',
      subtitle: 'Convierte los pines en mapas de calor, gráficos comparativos y reportes exportables.',
      description: 'Alimenta paneles analíticos en tiempo real. Observa tendencias por sector geográfico, genera mapas de calor de concentración y exporta informes ejecutivos en formato PDF para presentaciones o bases tabuladas en Excel para análisis profundo.',
      features: [
        'Mapas de calor interactivos y segmentación por zonas',
        'Filtros cruzados instantáneos por edad, fecha o territorio',
        'Descarga directa en informe PDF ejecutivo y base Excel/CSV'
      ],
      icon: BarChart3
    }
  ];

  // Autoplay timer
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isAutoplay, slides.length]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Zone statistics data for Slide 3
  const zoneData = {
    norte: {
      nombre: 'Sector Norte · Distrito 01',
      habitantes: 34500,
      pines: 2415,
      cobertura: '7.0%',
      margen: '±2.1%',
      hombres: '48%',
      mujeres: '52%',
    },
    centro: {
      nombre: 'Sector Centro · Comuna 04',
      habitantes: 52000,
      pines: 4680,
      cobertura: '9.0%',
      margen: '±1.4%',
      hombres: '51%',
      mujeres: '49%',
    },
    sur: {
      nombre: 'Sector Sur · Corredor 09',
      habitantes: 28000,
      pines: 1120,
      cobertura: '4.0%',
      margen: '±2.9%',
      hombres: '47%',
      mujeres: '53%',
    }
  };

  const activeZoneInfo = zoneData[selectedZone];

  return (
    <section id="modulos" className="py-24 border-b border-[#2e2e2e] relative bg-transparent">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <ScrollReveal delay={0} className="max-w-3xl mb-10">
          {isSkeleton ? (
            <div className="space-y-4">
              <SkeletonBadge width={220} />
              <Skeleton className="h-10 sm:h-12 w-3/4 rounded-[3.6px]" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
              </div>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3.6px] bg-white text-black font-mono text-[11px] font-bold tracking-wider uppercase mb-3">
                CARRUSEL EXPLICATIVO // PASO A PASO
              </div>
              <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.03em] leading-[0.95]">
                ¿Cómo funciona la plataforma?
              </h2>
              <p className="text-base sm:text-[17px] text-[#8a8a8a] mt-3 leading-[1.6]">
                Crea tu encuesta, marca cada respuesta con un <strong className="text-white font-medium">PIN en el mapa</strong> (mediante dirección o marcación manual), y calcula automáticamente las estadísticas <strong className="text-white font-medium">midiendo los encuestados contra los habitantes reales</strong> de cada zona.
              </p>
            </>
          )}
        </ScrollReveal>

        {/* Carousel Navigation Tabs (4 Step Buttons) */}
        <ScrollReveal delay={60}>
          {isSkeleton ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 sm:p-4 rounded-[3.6px] bg-[#141414] border border-[#2e2e2e] skeleton-shimmer">
                  <Skeleton className="h-3 w-28 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
              {slides.map((slide, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={slide.id}
                    onClick={() => {
                      setCurrentSlide(idx);
                      setIsAutoplay(false);
                    }}
                    className={`text-left p-3.5 sm:p-4 rounded-[3.6px] border transition-all cursor-pointer font-mono ${
                      isActive
                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                        : 'bg-[#141414] text-[#8a8a8a] border-[#2e2e2e] hover:border-[#444] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span>{slide.tabLabel}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-black' : 'bg-[#444]'}`} />
                    </div>
                    <div className={`text-xs font-sans font-medium line-clamp-1 ${isActive ? 'text-black' : 'text-[#d4d4d4]'}`}>
                      {slide.title}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollReveal>


        {/* Main Carousel Slide Card with Luminous White Contour */}
        <ScrollReveal delay={120}>
          <div className="bg-[#141414] rounded-[3.6px] border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.28),0_0_80px_rgba(255,255,255,0.12)] ring-1 ring-white/40 p-6 sm:p-8 lg:p-10 relative overflow-hidden transition-all">
            {/* Luminous Glow Accents */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_14px_#ffffff] pointer-events-none" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-white/[0.07] blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            
            {isSkeleton ? (
              <div className="space-y-8">
                {/* Top Skeleton Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#2e2e2e]">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-32" />
                    <SkeletonBadge width={140} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-28 rounded-[3.6px]" />
                    <Skeleton className="h-7 w-16 rounded-[3.6px]" />
                  </div>
                </div>

                {/* Body 2 Columns Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                  {/* Left Column */}
                  <div className="lg:col-span-5 space-y-5">
                    <Skeleton className="h-10 w-4/5 rounded-[3.6px]" />
                    <Skeleton className="h-5 w-3/5 rounded-[3.6px]" />
                    <div className="space-y-2 pt-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                    <div className="pt-3 space-y-2.5">
                      <Skeleton className="h-3 w-40 mb-2" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-[1px] shrink-0" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-[1px] shrink-0" />
                        <Skeleton className="h-4 w-10/12" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-[1px] shrink-0" />
                        <Skeleton className="h-4 w-4/5" />
                      </div>
                    </div>
                    <div className="pt-4 flex items-center gap-2">
                      <Skeleton className="h-2 w-8" />
                      <Skeleton className="h-2 w-8" />
                      <Skeleton className="h-2 w-8" />
                      <Skeleton className="h-2 w-8" />
                    </div>
                  </div>

                  {/* Right Column: Wireframe GIS / Demographic interactive simulation */}
                  <div className="lg:col-span-7 bg-[#0c0c0c] border border-[#2e2e2e] rounded-[3.6px] p-6 space-y-4 skeleton-shimmer">
                    <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                      <Skeleton className="h-4 w-48" />
                      <SkeletonBadge width={70} />
                    </div>
                    <Skeleton className="h-10 w-full rounded-[3.6px]" />
                    <div className="h-52 rounded-[3.6px] border border-[#222] bg-[#141414] p-4 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between items-center z-10">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex justify-around items-end h-28 gap-4 pt-4 z-10">
                        <Skeleton className="h-16 w-14" />
                        <Skeleton className="h-24 w-14" />
                        <Skeleton className="h-12 w-14" />
                        <Skeleton className="h-28 w-14" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Skeleton className="h-11 w-full rounded-[3.6px]" />
                      <Skeleton className="h-11 w-full rounded-[3.6px]" />
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#222]">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Top Carousel Bar: Slide Counter, Progress Indicator & Autoplay controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#2e2e2e]">

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#8a8a8a] uppercase tracking-wider">
                  PASO {slides[currentSlide].id} DE 04
                </span>
                <span className="text-[#444]">|</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3.6px] bg-[#1f1f1f] border border-[#2e2e2e] font-mono text-[10px] text-white">
                  {slides[currentSlide].badge}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  title={isAutoplay ? 'Pausar avance automático' : 'Activar avance automático'}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3.6px] border border-[#2e2e2e] hover:border-white font-mono text-[10px] text-[#8a8a8a] hover:text-white transition-colors cursor-pointer"
                >
                  {isAutoplay ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>AUTO: ACTIVO</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>AUTO: PAUSADO</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      goToPrev();
                      setIsAutoplay(false);
                    }}
                    className="p-1.5 rounded-[3.6px] border border-[#2e2e2e] hover:border-white text-white transition-colors cursor-pointer"
                    aria-label="Paso anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      goToNext();
                      setIsAutoplay(false);
                    }}
                    className="p-1.5 rounded-[3.6px] border border-[#2e2e2e] hover:border-white text-white transition-colors cursor-pointer"
                    aria-label="Paso siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Body: 2 Columns (Explanation + Live Interactive Mockup) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Left Column (5 Cols): Text, details & bullets */}
              <div className="lg:col-span-5 space-y-5">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-white tracking-[-0.03em] leading-tight font-sans">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-sm font-medium text-white/90">
                  {slides[currentSlide].subtitle}
                </p>
                <p className="text-sm text-[#8a8a8a] leading-[1.62]">
                  {slides[currentSlide].description}
                </p>

                {/* Key Points */}
                <div className="pt-2 space-y-2.5">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#8a8a8a] block">
                    CARACTERÍSTICAS PRINCIPALES:
                  </span>
                  <div className="space-y-2">
                    {slides[currentSlide].features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#d4d4d4]">
                        <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="pt-4 flex items-center gap-2">
                  {slides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => {
                        setCurrentSlide(dotIdx);
                        setIsAutoplay(false);
                      }}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentSlide === dotIdx ? 'w-8 bg-white' : 'w-2 bg-[#2e2e2e] hover:bg-[#555]'
                      }`}
                      aria-label={`Ir al paso ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column (7 Cols): Custom Interactive Visual Mockup for each slide */}
              <div className="lg:col-span-7">
                
                {/* MOCKUP SLIDE 0: CREACIÓN DE ENCUESTA */}
                {currentSlide === 0 && (
                  <div className="bg-[#0e0e0e] border border-[#2e2e2e] rounded-[3.6px] p-5 sm:p-6 space-y-5 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
                          GENERADOR DE FORMULARIO
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#8a8a8a] px-2 py-0.5 border border-[#2e2e2e] rounded-[3.6px]">
                        ID: #ENC-2025-VOTE
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-mono text-[#8a8a8a] uppercase tracking-wider">
                        TÍTULO DE LA ENCUESTA
                      </div>
                      <div className="p-3 bg-[#141414] border border-[#2e2e2e] rounded-[3.6px] text-sm text-white font-medium">
                        Sondeo de Opinión Ciudadana e Intención de Voto
                      </div>
                    </div>

                    {/* Question Interactive Simulator */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[#8a8a8a] uppercase tracking-wider">
                          PREGUNTA ACTIVA [01/05] · OPCIÓN MÚLTIPLE
                        </span>
                        <span className="text-[10px] font-mono text-white bg-[#1f1f1f] px-1.5 py-0.5 rounded-[3.6px]">
                          CAMPO OBLIGATORIO
                        </span>
                      </div>
                      <div className="p-3 bg-[#141414] border border-[#2e2e2e] rounded-[3.6px] space-y-3">
                        <p className="text-xs sm:text-sm text-white font-medium">
                          ¿Por cuál de los siguientes candidatos o propuestas votaría usted en las próximas elecciones?
                        </p>
                        
                        <div className="space-y-2 pt-1 font-mono text-xs">
                          {[
                            { id: 'candidato_a', label: 'Candidato A (Opción Democrática)', pct: '48.2%' },
                            { id: 'candidato_b', label: 'Candidato B (Alianza Cívica)', pct: '34.5%' },
                            { id: 'candidato_c', label: 'Candidato C (Sector Independiente)', pct: '11.3%' },
                            { id: 'indeciso', label: 'No sabe / No responde (Indeciso)', pct: '6.0%' },
                          ].map((opt) => (
                            <div
                              key={opt.id}
                              onClick={() => setSelectedAnswer(opt.id)}
                              className={`flex items-center justify-between p-2.5 rounded-[3.6px] border cursor-pointer transition-colors ${
                                selectedAnswer === opt.id
                                  ? 'bg-white text-black border-white font-bold'
                                  : 'bg-[#0a0a0a] text-[#8a8a8a] border-[#222] hover:border-[#444] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                  selectedAnswer === opt.id ? 'border-black bg-black' : 'border-[#555]'
                                }`}>
                                  {selectedAnswer === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </span>
                                <span>{opt.label}</span>
                              </div>
                              <span className="text-[10px] opacity-80">{opt.pct}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Meta Footer */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#2e2e2e] text-[11px] font-mono text-[#8a8a8a]">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Validación demográfica activa (Edad + Género + Cédula)</span>
                      </div>
                      <span className="text-white">LISTO PARA CAMPO →</span>
                    </div>
                  </div>
                )}

                {/* MOCKUP SLIDE 1: MARCAR PIN EN MAPA (DIRECCIÓN O MANUAL) */}
                {currentSlide === 1 && (
                  <div className="bg-[#0e0e0e] border border-[#2e2e2e] rounded-[3.6px] p-5 sm:p-6 space-y-4 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2e2e2e] pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-white" />
                        <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
                          GEOLOCALIZADOR DE ENCUESTAS
                        </span>
                      </div>

                      {/* Mode Switcher: Address vs Manual */}
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <button
                          onClick={() => setPinMode('address')}
                          className={`px-2.5 py-1 rounded-[3.6px] border transition-colors cursor-pointer ${
                            pinMode === 'address'
                              ? 'bg-white text-black border-white font-bold'
                              : 'bg-transparent text-[#8a8a8a] border-[#2e2e2e] hover:text-white'
                          }`}
                        >
                          POR DIRECCIÓN
                        </button>
                        <button
                          onClick={() => setPinMode('manual')}
                          className={`px-2.5 py-1 rounded-[3.6px] border transition-colors cursor-pointer ${
                            pinMode === 'manual'
                              ? 'bg-white text-black border-white font-bold'
                              : 'bg-transparent text-[#8a8a8a] border-[#2e2e2e] hover:text-white'
                          }`}
                        >
                          PIN MANUAL EN MAPA
                        </button>
                      </div>
                    </div>

                    {/* Address input / coordinates bar */}
                    {pinMode === 'address' ? (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#8a8a8a] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          readOnly
                          value="Calle 45 # 12-38, Sector Centro (Geocodificado)"
                          className="w-full bg-[#141414] border border-[#2e2e2e] rounded-[3.6px] pl-9 pr-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-[#141414] border border-[#2e2e2e] rounded-[3.6px] text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-white">
                          <Crosshair className="w-3.5 h-3.5 text-white animate-pulse" />
                          <span>MODO PUNTERO ACTIVO: Haz clic en el mapa para fijar PIN</span>
                        </div>
                        <span className="text-[#8a8a8a]">LAT 4.6097 · LNG -74.0817</span>
                      </div>
                    )}

                    {/* Interactive Simulated Map Grid */}
                    <div className="relative w-full h-56 bg-[#121212] border border-[#2e2e2e] rounded-[3.6px] overflow-hidden flex items-center justify-center">
                      {/* Grid lines background */}
                      <div 
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                          backgroundSize: '24px 24px'
                        }}
                      />

                      {/* Radar rings */}
                      <div className="absolute w-44 h-44 rounded-full border border-white/10 pointer-events-none" />
                      <div className="absolute w-24 h-24 rounded-full border border-white/15 pointer-events-none" />

                      {/* Map Pins Simulation */}
                      {/* Pin 1: Single respondent */}
                      <div 
                        onClick={() => setActivePinDemo(1)}
                        className={`absolute top-10 left-16 p-1.5 rounded-[3.6px] border cursor-pointer transition-transform ${
                          activePinDemo === 1
                            ? 'bg-white text-black border-white scale-110 z-20 shadow-lg'
                            : 'bg-[#1c1c1c] text-white border-[#333] hover:border-white z-10'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                          <MapPin className="w-3 h-3" />
                          <span>PIN #101</span>
                        </div>
                      </div>

                      {/* Pin 2: Clustered home (3 respondents at same address) */}
                      <div 
                        onClick={() => setActivePinDemo(2)}
                        className={`absolute top-24 right-20 p-1.5 rounded-[3.6px] border cursor-pointer transition-transform ${
                          activePinDemo === 2
                            ? 'bg-white text-black border-white scale-110 z-20 shadow-lg'
                            : 'bg-[#1c1c1c] text-white border-[#333] hover:border-white z-10'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                          <MapPin className="w-3 h-3" />
                          <span>PIN #204 [3 PERSONAS]</span>
                        </div>
                      </div>

                      {/* Pin 3: Manual Pin Dropped */}
                      <div 
                        onClick={() => setActivePinDemo(3)}
                        className={`absolute bottom-8 left-1/3 p-1.5 rounded-[3.6px] border cursor-pointer transition-transform ${
                          activePinDemo === 3
                            ? 'bg-white text-black border-white scale-110 z-20 shadow-lg'
                            : 'bg-[#1c1c1c] text-white border-[#333] hover:border-white z-10'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                          <MapPin className="w-3 h-3" />
                          <span>PIN #305 [MANUAL]</span>
                        </div>
                      </div>

                      {/* Active Pin Detailed Inspector Tooltip */}
                      <div className="absolute bottom-2 right-2 bg-black/90 border border-[#2e2e2e] p-2.5 rounded-[3.6px] font-mono text-[10px] max-w-[210px] space-y-1 backdrop-blur-sm z-30">
                        <div className="text-white font-bold flex items-center justify-between">
                          <span>DETALLE DEL PIN</span>
                          <span className="text-[#8a8a8a]">ID #{activePinDemo === 1 ? '101' : activePinDemo === 2 ? '204' : '305'}</span>
                        </div>
                        <div className="text-[#d4d4d4]">
                          {activePinDemo === 1 && '1 encuestado · Carrera 14 # 32-10'}
                          {activePinDemo === 2 && '3 encuestados (Mismo predio / Clustering familiar)'}
                          {activePinDemo === 3 && 'Marcación manual en mapa · GPS ±2m'}
                        </div>
                        <div className="text-[#8a8a8a] text-[9px]">
                          Voto: Opción A · Edad: 34 años
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8a8a8a] pt-1">
                      <span>✓ Clustering automático en misma dirección</span>
                      <span className="text-white">SIN LÍMITE DE PINES</span>
                    </div>
                  </div>
                )}

                {/* MOCKUP SLIDE 2: CRUCE DEMOGRÁFICO VS. HABITANTES */}
                {currentSlide === 2 && (
                  <div className="bg-[#0e0e0e] border border-[#2e2e2e] rounded-[3.6px] p-5 sm:p-6 space-y-5 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2e2e2e] pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white" />
                        <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
                          CRUCE DEMOGRÁFICO TERRITORIAL
                        </span>
                      </div>

                      {/* Zone Selector Pills */}
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        {(['norte', 'centro', 'sur'] as const).map((z) => (
                          <button
                            key={z}
                            onClick={() => setSelectedZone(z)}
                            className={`px-2.5 py-1 rounded-[3.6px] border uppercase transition-colors cursor-pointer ${
                              selectedZone === z
                                ? 'bg-white text-black border-white font-bold'
                                : 'bg-transparent text-[#8a8a8a] border-[#2e2e2e] hover:text-white'
                            }`}
                          >
                            {z}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Zone Heading */}
                    <div className="flex items-center justify-between bg-[#141414] p-3 rounded-[3.6px] border border-[#2e2e2e]">
                      <div>
                        <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-wider">
                          ZONA SELECCIONADA
                        </div>
                        <div className="text-sm font-semibold text-white font-sans">
                          {activeZoneInfo.nombre}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-[#8a8a8a]">CONFIABILIDAD</div>
                        <div className="text-xs text-white font-bold">95% (Nivel A)</div>
                      </div>
                    </div>

                    {/* Comparison Cards: Habitantes Censados vs Pines Marcados */}
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="p-3.5 bg-[#141414] border border-[#2e2e2e] rounded-[3.6px]">
                        <span className="text-[10px] text-[#8a8a8a] uppercase block">
                          HABITANTES DE LA ZONA
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-white block mt-1">
                          {activeZoneInfo.habitantes.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#8a8a8a] block mt-0.5">
                          Base de censo poblacional oficial
                        </span>
                      </div>

                      <div className="p-3.5 bg-[#141414] border border-white rounded-[3.6px]">
                        <span className="text-[10px] text-white uppercase block font-bold">
                          PINES MARCADOS
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-white block mt-1">
                          {activeZoneInfo.pines.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#a3a3a3] block mt-0.5">
                          Encuestas georreferenciadas
                        </span>
                      </div>
                    </div>

                    {/* Representativeness Meter */}
                    <div className="space-y-2 p-3.5 bg-[#141414] border border-[#2e2e2e] rounded-[3.6px]">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-[#8a8a8a] uppercase tracking-wider">
                          TASA DE REPRESENTATIVIDAD TERRITORIAL
                        </span>
                        <span className="text-white font-bold">{activeZoneInfo.cobertura} de la población</span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-2.5 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#2e2e2e]">
                        <div 
                          className="h-full bg-white transition-all duration-500 rounded-full"
                          style={{ width: activeZoneInfo.cobertura }}
                        />
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px] text-[#8a8a8a] pt-1">
                        <span>Margen de error muestral: <strong className="text-white">{activeZoneInfo.margen}</strong></span>
                        <span>Muestra: {activeZoneInfo.hombres} H / {activeZoneInfo.mujeres} M</span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-[#8a8a8a]">
                      * El cálculo contrasta en tiempo real cada PIN con la cartografía censal para evitar sesgos o zonas sin cubrir.
                    </div>
                  </div>
                )}

                {/* MOCKUP SLIDE 3: ESTADÍSTICAS & REPORTES */}
                {currentSlide === 3 && (
                  <div className="bg-[#0e0e0e] border border-[#2e2e2e] rounded-[3.6px] p-5 sm:p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-white" />
                        <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
                          PANEL DE RESULTADOS & EXPORTACIÓN
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-white bg-[#1f1f1f] px-2 py-0.5 rounded-[3.6px] border border-[#2e2e2e]">
                        EN VIVO
                      </span>
                    </div>

                    {/* Sector Performance Bars */}
                    <div className="space-y-3 p-3.5 bg-[#141414] border border-[#2e2e2e] rounded-[3.6px]">
                      <div className="text-xs font-mono text-white font-bold uppercase tracking-wider mb-2">
                        DISTRIBUCIÓN POR SECTOR TERRITORIAL
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <div>
                          <div className="flex justify-between text-[#d4d4d4] mb-1">
                            <span>Sector Norte (6,240 hab. encuestados)</span>
                            <span className="text-white font-bold">54.2% A favor</span>
                          </div>
                          <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#2e2e2e]">
                            <div className="h-full bg-white w-[54.2%]" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[#d4d4d4] mb-1">
                            <span>Sector Centro (4,680 hab. encuestados)</span>
                            <span className="text-white font-bold">68.1% A favor</span>
                          </div>
                          <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#2e2e2e]">
                            <div className="h-full bg-white w-[68.1%]" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[#d4d4d4] mb-1">
                            <span>Sector Sur (3,890 hab. encuestados)</span>
                            <span className="text-white font-bold">41.8% A favor</span>
                          </div>
                          <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#2e2e2e]">
                            <div className="h-full bg-white w-[41.8%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Export Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-[#141414] border border-[#2e2e2e] hover:border-white transition-colors rounded-[3.6px] flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <FileDown className="w-4 h-4 text-white" />
                          <div>
                            <div className="text-xs font-mono font-bold text-white uppercase">INFORME EJECUTIVO</div>
                            <div className="text-[10px] font-mono text-[#8a8a8a]">Formato PDF vectorial</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8a8a8a] group-hover:text-white transition-colors" />
                      </div>

                      <div className="p-3 bg-[#141414] border border-[#2e2e2e] hover:border-white transition-colors rounded-[3.6px] flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-white" />
                          <div>
                            <div className="text-xs font-mono font-bold text-white uppercase">BASE DE DATOS</div>
                            <div className="text-[10px] font-mono text-[#8a8a8a]">Excel (.xlsx) / CSV crudo</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8a8a8a] group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#2e2e2e] text-[10px] font-mono text-[#8a8a8a]">
                      <span>Auditoría georreferenciada garantizada</span>
                      <span className="text-white font-bold">100% EXPORTABLE</span>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </>
        )}

      </div>
    </ScrollReveal>


      </div>
    </section>
  );
};
