import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, FileDown, Loader2, Check, HelpCircle,
  MessageSquare, FileEdit, BookOpen, Vote, Calculator, Award, Calendar, X, Trash2, Plus
} from 'lucide-react';
import { useAppStore } from '../store';
import { TimelineEvent, AppSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  MessageSquare, FileEdit, BookOpen, Vote, Calculator, Award, HelpCircle
};

const Icon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = TIMELINE_ICONS[name] || HelpCircle;
  return <IconComponent className={className} />;
};

const TimelineTab: React.FC = () => {
  const { settings, updateSettings, isSaving } = useAppStore();
  
  // Ref para rastrear se o usuário está focado em algum input
  const isEditingRef = useRef(false);
  
  const [localMandate, setLocalMandate] = useState(settings.mandate);
  const [localEvents, setLocalEvents] = useState<TimelineEvent[]>(() => JSON.parse(JSON.stringify(settings.timelineEvents)));
  
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Sincroniza do Global APENAS se não estivermos editando
  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalMandate(settings.mandate);
      setLocalEvents(JSON.parse(JSON.stringify(settings.timelineEvents)));
    }
  }, [settings.mandate, settings.timelineEvents]);

  useEffect(() => {
    const eventsChanged = JSON.stringify(settings.timelineEvents) !== JSON.stringify(localEvents);
    const mandateChanged = settings.mandate !== localMandate;
    setIsDirty(eventsChanged || mandateChanged);
  }, [localEvents, localMandate, settings.timelineEvents, settings.mandate]);

  const handleSaveChanges = async () => {
    try {
      await updateSettings({ mandate: localMandate, timelineEvents: localEvents });
      setShowSaveSuccess(true);
      setIsDirty(false);
      isEditingRef.current = false;
      setTimeout(() => setShowSaveSuccess(false), 2500);
    } catch (e) { alert("Erro ao salvar."); }
  };

  const updateEventDate = (id: string, value: string) => {
    isEditingRef.current = true;
    setLocalEvents(prev => prev.map(ev => ev.id === id ? { ...ev, dateTime: value } : ev));
  };

  const updateEventTitle = (id: string, value: string) => {
    isEditingRef.current = true;
    setLocalEvents(prev => prev.map(ev => ev.id === id ? { ...ev, activity: value } : ev));
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
        const canvas = await html2canvas(printRef.current, { scale: 2 });
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
        pdf.save(`Cronograma_CIPA.pdf`);
    } catch (error) { alert("Erro ao gerar PDF."); } finally { setIsDownloading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-40">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cronograma de Atividades</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão de Prazos Legais (NR-5)</p>
        </div>
        <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-3 bg-white text-slate-500 border border-slate-200 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Exportar PDF
        </button>
      </header>

      <div className="bg-white p-6 sm:p-12 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Mandato Vigente</label>
              <input 
                type="text" 
                className="w-full bg-white border-2 border-slate-200 rounded-xl px-5 py-4 text-black font-bold text-sm outline-none focus:border-blue-500 transition-all uppercase placeholder:text-slate-300"
                value={localMandate} 
                onFocus={() => isEditingRef.current = true}
                onChange={(e) => setLocalMandate(e.target.value)} 
                placeholder="EX: 2025/2026" 
              />
            </div>
            <div className="flex items-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-800 text-[10px] font-black uppercase leading-relaxed tracking-widest">
               Este período será aplicado em todos os cabeçalhos de atas e relatórios oficiais.
            </div>
          </div>
          
          <div className="space-y-4">
              {localEvents.map((item) => (
                <div key={item.id} className="flex items-start gap-6 group transition-all rounded-2xl p-4 hover:bg-slate-50 border border-transparent hover:border-slate-100">
                  <div className={`w-14 h-14 ${item.bg} rounded-full flex items-center justify-center border-4 border-white shadow-md flex-shrink-0`}><Icon name={item.icon} className={`w-6 h-6 ${item.color}`} /></div>
                  <div className="flex-1 space-y-1">
                    <input 
                      type="text" 
                      value={item.activity} 
                      onFocus={() => isEditingRef.current = true}
                      onChange={(e) => updateEventTitle(item.id, e.target.value)} 
                      className="w-full bg-transparent text-sm font-black text-slate-900 uppercase tracking-tight outline-none focus:bg-white px-1 py-0.5 rounded transition-all" 
                    />
                    <input 
                      type="text" 
                      value={item.dateTime} 
                      onFocus={() => isEditingRef.current = true}
                      onChange={(e) => updateEventDate(item.id, e.target.value)} 
                      className="w-full bg-transparent text-[11px] font-bold text-slate-400 uppercase tracking-widest outline-none focus:bg-white px-1 py-0.5 rounded transition-all" 
                    />
                  </div>
                </div>
              ))}
          </div>
      </div>

      {isDirty && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="bg-slate-900 rounded-[24px] shadow-2xl p-4 flex items-center justify-between animate-popIn border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3 ml-2">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
               <p className="text-white font-black uppercase text-[10px] tracking-widest">Alterações Pendentes</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { isEditingRef.current = false; setLocalEvents(JSON.parse(JSON.stringify(settings.timelineEvents))); setLocalMandate(settings.mandate); }} className="px-4 py-2 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors">Descartar</button>
              <button onClick={handleSaveChanges} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${showSaveSuccess ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-blue-50'}`}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : showSaveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {showSaveSuccess ? 'Tudo Salvo!' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Versão Invisível para Impressão */}
      <div className="absolute -left-[9999px] -top-[9999px]">
        <div ref={printRef} className="bg-white p-12 w-[210mm] min-h-[297mm]">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-12">
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{settings.companyName}</h1>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-2">Cronograma Oficial CIPA - Gestão {localMandate}</p>
            </div>
            {settings.logoBase64 && <img src={settings.logoBase64} alt="Logo" className="h-20 w-auto object-contain" />}
          </div>
          <div className="space-y-10">
            {localEvents.map(item => (
              <div key={item.id} className="flex items-start gap-8 p-6 border border-slate-100 rounded-[32px] bg-slate-50/50">
                <div className={`w-16 h-16 ${item.bg} rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm`}><Icon name={item.icon} className={`w-8 h-8 ${item.color}`} /></div>
                <div className="flex-1 pt-1">
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{item.activity}</h3>
                   <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-300" /> {item.dateTime}
                   </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-20 pt-10 border-t border-slate-100 text-center">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Documento Gerado via Portal CIPA - Conformidade NR-5</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TimelineTab;