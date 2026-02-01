import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { FileDown, Info, Loader2, ShieldCheck, Calendar, LayoutGrid, Columns, Eye, EyeOff, Grid2X2, RectangleVertical, Maximize2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BallotTab: React.FC = () => {
  const { settings, updateSettings, registrations, employees } = useAppStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [candidateCols, setCandidateCols] = useState<1 | 2 | 3>(1);
  const [showMandate, setShowMandate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const approvedCandidates = registrations
    .filter(r => r.status === 'approved')
    .map(r => employees.find(e => e.id === r.employeeId))
    .filter(Boolean)
    .sort((a, b) => a!.nome.localeCompare(b!.nome));

  const votingEvent = settings.timelineEvents.find(e => e.activity === 'Período de Votação');
  const votingDate = votingEvent ? votingEvent.dateTime : '___/___/___';

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);

    try {
      // Pequena pausa para garantir que qualquer renderização pendente termine
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(printRef.current, {
        scale: 3, // Alta densidade para impressão
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794, 
        height: 1123,
        windowWidth: 794, // Força o viewport de renderização
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('ballot-print-container');
          if (el) {
            el.style.display = 'grid';
            el.style.visibility = 'visible';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'SLOW');
      pdf.save(`Cedulas_CIPA_${settings.mandate.replace('/', '-')}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF das cédulas:", error);
      alert("Não foi possível gerar o PDF. Verifique se o logo está carregado corretamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  const setBallotsPerPage = (count: 1 | 2 | 4) => {
    updateSettings({ ballotsPerPage: count });
  };

  const ballotsCount = settings.ballotsPerPage || 2;
  const ballotsArray = Array.from({ length: ballotsCount });

  const SingleBallot: React.FC<{ isCompact?: boolean, isForPrint?: boolean }> = ({ isCompact = false, isForPrint = false }) => {
    const titleSize = isCompact ? "text-[14px]" : "text-[22px]";
    const subtitleSize = isCompact ? "text-[8px]" : "text-[11px]";
    const logoSize = isCompact ? "h-8" : "h-12";
    const padding = isCompact ? "p-4" : "p-8";
    const gap = isCompact ? "gap-2" : "gap-4";
    const candidateNameSize = isCompact ? "text-[10px]" : "text-[13px]";
    const checkSize = isCompact ? "w-5 h-5" : "w-7 h-7";

    return (
      <div 
        className={`bg-white border-[2.5px] border-black ${padding} flex flex-col h-full w-full relative overflow-hidden`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <ShieldCheck className={isCompact ? "w-24 h-24" : "w-40 h-40"} />
        </div>

        <div className={`flex justify-between items-start border-b-[2px] border-black pb-3 mb-3 relative z-10`}>
          <div className="text-left">
            <h2 className={`${titleSize} font-black text-black uppercase leading-[1.1]`}>{settings.companyName}</h2>
            <p className={`${subtitleSize} font-black text-gray-500 uppercase tracking-[0.1em] mt-1`}>Cédula Oficial de Votação</p>
          </div>
          {settings.logoBase64 && (
            <img src={settings.logoBase64} alt="Logo" className={`${logoSize} w-auto object-contain`} />
          )}
        </div>

        <div className="text-center mb-5 relative z-10">
          <h3 className={`${isCompact ? 'text-[11px]' : 'text-[15px]'} font-black text-black uppercase tracking-widest`}>{settings.documentTitle}</h3>
          
          {(showMandate || !isCompact) && (
             <div className="flex items-center justify-center gap-5 mt-1.5">
               {showMandate && <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-600 uppercase`}>Gestão {settings.mandate}</p>}
               <div className="flex items-center gap-1">
                 <Calendar className="w-3 h-3 text-gray-400" />
                 <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-600 uppercase`}>{votingDate}</p>
               </div>
             </div>
          )}
        </div>

        <div className="flex-1 relative z-10">
          {approvedCandidates.length > 0 ? (
            <div className={`grid ${candidateCols === 1 ? 'grid-cols-1' : candidateCols === 2 ? 'grid-cols-2' : 'grid-cols-3'} ${gap} content-start`}>
              {approvedCandidates.map((c, idx) => (
                <div key={c!.id} className="flex items-center gap-3 border-b border-gray-100 last:border-0 pb-1.5 min-w-0">
                  <div className={`${checkSize} border-[2px] border-black rounded-sm flex-shrink-0 bg-white`}></div>
                  <div className="flex-1 min-w-0">
                    <p className={`${candidateNameSize} font-black text-black uppercase leading-tight ${isForPrint ? '' : 'truncate'}`}>{c!.nome}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-0.5">{c!.setor}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 h-full flex flex-col justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-[11px] font-black uppercase">Aguardando homologação de candidatos.</p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-5 relative z-10">
           <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-center border-t border-gray-100 pt-3">
             Assinale apenas um candidato. Em caso de rasura, a cédula será anulada.
           </p>
        </div>
      </div>
    );
  };

  const getPreviewGridClass = () => {
     if (settings.ballotsPerPage === 4) return 'grid-cols-2 gap-4';
     if (settings.ballotsPerPage === 2) return 'grid-cols-1 gap-8';
     return 'grid-cols-1';
  };

  const getPrintGridClass = () => {
     if (settings.ballotsPerPage === 4) return 'grid-cols-2 grid-rows-2';
     if (settings.ballotsPerPage === 2) return 'grid-cols-1 grid-rows-2';
     return 'grid-cols-1 grid-rows-1';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn pb-20">
      
      <div className="lg:col-span-4 no-print space-y-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm sticky top-24 space-y-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cédulas Oficiais</h1>
            <p className="text-sm font-medium text-slate-500 italic mt-1">Configuração para impressão física (A4).</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5" /> Layout da Página
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setBallotsPerPage(1)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${settings.ballotsPerPage === 1 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200 text-slate-400'}`}
                >
                  <div className="w-6 h-8 border-2 border-current rounded-sm"></div>
                  <span className="text-[9px] font-black uppercase">1 por Folha</span>
                </button>
                <button 
                  onClick={() => setBallotsPerPage(2)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${settings.ballotsPerPage === 2 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200 text-slate-400'}`}
                >
                  <div className="w-6 h-8 border-2 border-current rounded-sm flex flex-col"><div className="flex-1 border-b border-current"></div><div className="flex-1"></div></div>
                  <span className="text-[9px] font-black uppercase">2 por Folha</span>
                </button>
                <button 
                  onClick={() => setBallotsPerPage(4)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${settings.ballotsPerPage === 4 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200 text-slate-400'}`}
                >
                  <Grid2X2 className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase">4 por Folha</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Columns className="w-3.5 h-3.5" /> Colunas na Cédula
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 {[1, 2, 3].map(cols => (
                   <button 
                    key={cols}
                    onClick={() => setCandidateCols(cols as 1|2|3)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${candidateCols === cols ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                   >
                     {cols} {cols === 1 ? 'Coluna' : 'Colunas'}
                   </button>
                 ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exibir Mandato</span>
               <button 
                 onClick={() => setShowMandate(!showMandate)} 
                 className={`p-2 rounded-lg transition-colors ${showMandate ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}
               >
                 {showMandate ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <button
              onClick={handleDownloadPDF}
              disabled={isDownloading || approvedCandidates.length === 0}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
              {isDownloading ? 'Gerando PDF...' : 'Baixar para Impressão'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-8 no-print">
        <div className="bg-slate-200/50 p-8 rounded-[32px] border-2 border-dashed border-slate-300 flex flex-col items-center">
          <div className="flex items-center justify-between mb-4 w-full max-w-[210mm] px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualização A4</span>
            <button
               onClick={() => setIsFullscreen(true)}
               className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-blue-600 shadow-sm transition-all"
            >
               <Maximize2 className="w-3.5 h-3.5" /> Tela Cheia
            </button>
          </div>
          
          <div className={`grid ${getPreviewGridClass()} w-full max-w-[210mm] bg-white shadow-2xl aspect-[210/297] overflow-hidden`}>
            {ballotsArray.map((_, i) => (
              <div key={i} className="w-full h-full">
                 <SingleBallot isCompact={settings.ballotsPerPage === 4} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contêiner de Impressão Invisível com Dimensões Rígidas (A4 em 96dpi) */}
      <div className="absolute -left-[9999px] top-0 overflow-hidden" style={{ width: '794px' }}>
        <div 
          id="ballot-print-container"
          ref={printRef} 
          style={{ width: '794px', height: '1123px', display: 'grid' }}
          className={`bg-white p-[40px] grid ${getPrintGridClass()} gap-[20px]`}
        >
          {ballotsArray.map((_, i) => (
            <div key={`print-${i}`} className="w-full h-full overflow-hidden">
                <SingleBallot isCompact={settings.ballotsPerPage === 4} isForPrint={true} />
            </div>
          ))}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm overflow-y-auto p-4 flex items-start justify-center animate-fadeIn">
          <div className="relative w-full max-w-[230mm] my-auto">
             <button 
               onClick={() => setIsFullscreen(false)}
               className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white p-2 px-4 rounded-full transition-colors flex items-center gap-2 backdrop-blur-md"
             >
               <X className="w-5 h-5" />
               <span className="text-xs font-black uppercase tracking-widest">Fechar</span>
             </button>
             <div className={`grid ${getPreviewGridClass()} w-full bg-white shadow-2xl aspect-[210/297]`}>
                {ballotsArray.map((_, i) => (
                  <div key={i} className="w-full h-full">
                     <SingleBallot isCompact={settings.ballotsPerPage === 4} />
                  </div>
                ))}
              </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BallotTab;