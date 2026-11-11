import React, { useState } from 'react';
import { ArrowLeft, Search, Eye, MapPin, Calendar, User, FileText, ChevronRight, X } from 'lucide-react';
import { SurveyRecord } from '../../types/votality';

interface VotalityRespondentsModalProps {
  records: SurveyRecord[];
  onClose: () => void;
  onLocateOnMap?: (record: SurveyRecord) => void;
}

export const VotalityRespondentsModal: React.FC<VotalityRespondentsModalProps> = ({
  records,
  onClose,
  onLocateOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SurveyRecord | null>(null);

  // Alphabetical sort (A-Z) by respondent name
  const sortedRecords = [...records].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  // Filter by name and address
  const filteredRecords = sortedRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.censusSector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md select-none font-sans">
      <div className="bg-[#000000] border border-[#FFFFFF] w-full max-w-5xl h-[92vh] rounded-sm shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header with Back Button */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#000000] border border-[#333333] hover:border-[#FFFFFF] font-mono text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Mapa</span>
            </button>
            <div className="hidden sm:block h-4 w-[1px] bg-[#333333]" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
                REGISTRO ALFABÉTICO (A-Z)
              </div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Padrón de Encuestados</h2>
            </div>
          </div>

          <div className="font-mono text-xs text-[#888888]">
            Total registros: <span className="text-[#FFFFFF] font-bold">{records.length}</span>
          </div>
        </div>

        {/* Filter bar by Name and Address */}
        <div className="p-3 bg-[#0a0a0a] border-b border-[#222222] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar específicamente por Nombre del encuestado, Dirección o Sector..."
              className="w-full bg-[#141414] text-[#FFFFFF] text-xs font-mono pl-9 pr-4 py-2 border border-[#333333] focus:border-[#FFFFFF] rounded-sm focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-[#777777] hover:text-[#FFFFFF] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#777777] shrink-0 hidden md:block">
            {filteredRecords.length} resultado(s)
          </div>
        </div>

        {/* Table & Details Split Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Table View */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-[#666666] font-mono text-xs">
                {records.length === 0
                  ? 'No hay encuestas registradas en el sistema. Los encuestadores las registrarán en terreno.'
                  : 'No se encontraron registros que coincidan con la búsqueda.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#111111] border-b border-[#262626] font-mono text-[10px] uppercase text-[#888888] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Nombre (A-Z)</th>
                    <th className="py-2.5 px-4">Dirección</th>
                    <th className="py-2.5 px-4 hidden sm:table-cell">Sector Censal</th>
                    <th className="py-2.5 px-4 hidden md:table-cell">Encuestador</th>
                    <th className="py-2.5 px-4 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filteredRecords.map((item, idx) => {
                    const isSelected = selectedRecord?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRecord(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFFFFF] text-[#000000]'
                            : 'hover:bg-[#111111] text-[#cccccc]'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-[10px] text-[#777777]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-[#FFFFFF] group-hover:text-white">
                          <span className={isSelected ? 'text-[#000000]' : 'text-[#FFFFFF]'}>
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">{item.address}</td>
                        <td className="py-3 px-4 hidden sm:table-cell font-mono text-[11px] opacity-80">
                          {item.censusSector}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] opacity-70">
                          {item.surveyorName}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(item);
                            }}
                            className={`p-1 rounded-sm border transition-all ${
                              isSelected
                                ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                                : 'bg-[#1a1a1a] text-[#888888] border-[#333333] hover:text-[#FFFFFF]'
                            }`}
                            title="Ver detalle de respuestas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Detail Drawer */}
          {selectedRecord && (
            <div className="w-full md:w-88 border-t md:border-t-0 md:border-l border-[#262626] bg-[#0a0a0a] p-5 overflow-y-auto flex flex-col justify-between text-xs font-sans animate-in slide-in-from-right-4 duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#888888]">Detalle de Encuesta</div>
                    <div className="text-base font-bold text-[#FFFFFF] mt-0.5">{selectedRecord.name}</div>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="p-1 text-[#777777] hover:text-[#FFFFFF] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Spatial Info */}
                <div className="p-3 bg-[#111111] border border-[#222222] rounded-sm space-y-2">
                  <div className="flex items-center gap-2 text-[#cccccc] font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#FFFFFF]" />
                    <span>{selectedRecord.address}</span>
                  </div>
                  <div className="font-mono text-[10px] text-[#777777]">
                    Sector: <span className="text-[#cccccc]">{selectedRecord.censusSector}</span>
                  </div>
                  <div className="font-mono text-[10px] text-[#777777]">
                    Coordenadas SIG: <span className="text-[#FFFFFF]">{selectedRecord.lat.toFixed(5)}, {selectedRecord.lng.toFixed(5)}</span>
                  </div>
                </div>

                {/* Captured Answers */}
                <div className="space-y-2">
                  <div className="font-mono text-[10px] uppercase text-[#888888]">
                    Respuestas Registradas
                  </div>
                  <div className="space-y-2">
                    {Object.entries(selectedRecord.answers).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-2.5 bg-[#141414] border border-[#262626] rounded-sm"
                      >
                        <div className="text-[10px] font-mono text-[#888888] uppercase">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs font-semibold text-[#FFFFFF] mt-0.5">
                          {typeof val === 'boolean' ? (val ? 'Sí / Afirmativo' : 'No / Negativo') : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Surveyor & Metadata */}
                <div className="pt-3 border-t border-[#222222] text-[10px] font-mono text-[#666666] space-y-1">
                  <div>Registrado por: {selectedRecord.surveyorName}</div>
                  <div>Fecha y hora: {new Date(selectedRecord.createdAt).toLocaleString()}</div>
                  <div>Registro inmutable (PostGIS id: {selectedRecord.id})</div>
                </div>
              </div>

              {/* Action: Locate on Map */}
              {onLocateOnMap && (
                <button
                  onClick={() => {
                    onLocateOnMap(selectedRecord);
                    onClose();
                  }}
                  className="mt-4 w-full py-2.5 px-3 bg-[#FFFFFF] hover:bg-[#e5e5e5] text-[#000000] font-mono text-xs uppercase tracking-wider font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Centrar en Mapa</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

