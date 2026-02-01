import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, FileDown, Loader2, Check, HelpCircle,
  MessageSquare, FileEdit, BookOpen, Vote, Calculator, Award, Calendar
} from 'lucide-react';
import { useAppStore } from '../store';
import { TimelineEvent, AppSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Mapa local de ícones suportados pelo cronograma padrão e outros comuns
const TIMELINE_ICONS: Record<string, React.ElementType> = {
  MessageSquare, FileEdit, BookOpen, Vote, Calculator, Award,
  HelpCircle
};

const Icon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = TIMELINE_ICONS[name] || HelpCircle;
  return <IconComponent className={className} />;
};

const PrintableTimeline: React.FC<{ events: TimelineEvent[], settings: AppSettings, printRef: React.RefObject<HTMLDivElement> }> = ({ events, settings, printRef }) => (
  <div ref={printRef} className="bg-white p-8 w-[210mm]">
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase">{settings.companyName}</h1>
        <p className="text-sm font-bold text-slate-500 uppercase mt-1">Gestão {settings.mandate}</p>
      </div>
      {settings.logoBase64 && <img src={settings.logoBase64} alt="Logo" className="h-16 w-auto object-contain" />}
    </div>
    <div className="space-y-6">
      {events.map(item => (
        <div key={item.id} className="flex items-start gap-6 p-4 border border-slate-100 rounded-lg">
          <div className={`w-12 h-12 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}><Icon name={item.icon} className={`w-6 h-6 ${item.color}`} /></div>
          <div className="flex-1 pt-1"><h3 className="text-base font-black text-slate-900 uppercase">{item.activity}</h3><p className="text-sm font-bold text-slate-500 mt-1">{item.dateTime}</p></div>
        </div>
      ))}
    </div>
  </div>
);

const TimelineTab: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const [localEvents, setLocalEvents] = useState<TimelineEvent[]>(() => JSON.parse(JSON.stringify(settings.timelineEvents)));
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDirty(JSON.stringify(settings.timelineEvents) !== JSON.stringify(localEvents));
  }, [localEvents, settings.timelineEvents]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
        const canvas = await html2canvas(printRef.current, { scale: 2 });
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
        pdf.save(`Cronograma_CIPA.pdf`);
    } catch (error) { alert("Erro ao gerar PDF."); } finally { setIsDownloading(false); }
  };
  
  const handleSaveChanges = async () => {
    try {
      await updateSettings({ timelineEvents: localEvents });
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2500);
    } catch (e) { alert("Erro ao salvar."); }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-40 no-print">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 no-print bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div><h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Editor de Cronograma</h1></div>
          <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-3 bg-white text-slate-500 border border-slate-200 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest">{isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Exportar PDF</button>
        </header>

        <div className="bg-white p-6 sm:p-12 rounded-[40px] border border-slate-100 shadow-sm relative space-y-6">
            {/* Input de Mandato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Mandato / Gestão
                </label>
                <input 
                  type="text" 
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-5 py-4 text-black font-bold text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all uppercase placeholder:text-slate-300"
                  value={settings.mandate} 
                  onChange={(e) => updateSettings({ mandate: e.target.value })} 
                  placeholder="EX: 2025/2026" 
                />
              </div>
              <div className="flex items-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-800 text-xs font-medium leading-relaxed">
                 Defina o período de vigência da gestão da CIPA. Esta informação será exibida em todos os documentos oficiais e cabeçalhos do sistema.
              </div>
            </div>
            
            <div className="space-y-2">
                {localEvents.map((item) => (
                  <div key={item.id} className="flex items-start gap-6 relative group transition-all rounded-2xl p-1">
                    <div className={`w-14 h-14 ${item.bg} rounded-full flex items-center justify-center border-4 border-white shadow-md`}><Icon name={item.icon} className={`w-6 h-6 ${item.color}`} /></div>
                    <div className="pt-3 flex-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.activity}</h3>
                      <input type="text" value={item.dateTime} onChange={(e) => setLocalEvents(localEvents.map(ev => ev.id === item.id ? { ...ev, dateTime: e.target.value } : ev))} className="w-full bg-transparent text-xs font-bold text-slate-400 mt-1 p-1 -ml-1 rounded-md outline-none focus:bg-slate-100 focus:text-blue-700 transition-all" />
                    </div>
                  </div>
                ))}
            </div>
        </div>
        {isDirty && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg p-2 z-50 no-print">
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-4 flex items-center justify-between animate-popIn border border-slate-700">
              <p className="text-white font-bold text-sm ml-2">Alterações não salvas.</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setLocalEvents(JSON.parse(JSON.stringify(settings.timelineEvents)))} className="px-4 py-2 rounded-lg text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-700">Descartar</button>
                <button onClick={handleSaveChanges} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${showSaveSuccess ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>{showSaveSuccess ? <><Check className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar</>}</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="absolute -left-[9999px] -top-[9999px]"><PrintableTimeline events={localEvents} settings={settings} printRef={printRef} /></div>
    </>
  );
};
export default TimelineTab;