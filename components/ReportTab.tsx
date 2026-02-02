import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { 
  Trophy, Medal, FileDown, Loader2, FileText, Calendar, 
  AlertCircle, Users, PenTool, Maximize2, X, CloudCheck, 
  CloudUpload, Layout, Copy, Check, ChevronRight, Settings2,
  Signature, ListChecks
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ReportType = 'election' | 'ordinary' | 'extraordinary';

const ReportTab: React.FC = () => {
  const { votes, employees, registrations, settings, updateSettings, isSaving } = useAppStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportType>('election');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isEditingRef = useRef(false);
  const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localReportConfig, setLocalReportConfig] = useState(() => settings.reportConfig || {
    electedCount: 3,
    meetingData: {
      number: '1',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      local: 'Sala de Reuniões 1',
      membersPresent: 'Membros da CIPA (Titulares e Suplentes)',
      agenda: '1. Leitura e aprovação da ata anterior;\n2. Análise dos acidentes ocorridos no mês;\n3. Discussão sobre novos EPIs.',
      deliberations: 'Ficou definido que a próxima inspeção ocorrerá no dia 15.',
      extraordinaryReason: 'Acidente grave ocorrido no setor de produção.',
      signatoriesCount: 2,
      attendanceRows: 10
    }
  });

  useEffect(() => {
    if (!isEditingRef.current && settings.reportConfig) {
       const externalStr = JSON.stringify(settings.reportConfig);
       const localStr = JSON.stringify(localReportConfig);
       if (externalStr !== localStr) {
         setLocalReportConfig(settings.reportConfig);
       }
    }
  }, [settings.reportConfig]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const externalStr = JSON.stringify(settings.reportConfig);
      const localStr = JSON.stringify(localReportConfig);
      if (externalStr !== localStr) {
        updateSettings({ reportConfig: localReportConfig });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [localReportConfig, updateSettings, settings.reportConfig]);

  const startEditing = () => {
    isEditingRef.current = true;
    if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current);
    editTimeoutRef.current = setTimeout(() => {
      isEditingRef.current = false;
    }, 3000);
  };

  const updateLocalConfig = (key: string, value: any) => {
    startEditing();
    setLocalReportConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateMeetingData = (key: string, value: any) => {
    startEditing();
    setLocalReportConfig(prev => ({
      ...prev,
      meetingData: { ...prev.meetingData, [key]: value }
    }));
  };

  const { electedCount, meetingData } = localReportConfig;
  const signatoriesCount = meetingData.signatoriesCount || 2;
  const attendanceRows = meetingData.attendanceRows || 10;

  const results = registrations
    .filter(r => r.status === 'approved')
    .map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const count = votes.filter(v => v.candidateId === r.employeeId).length;
      return { id: r.employeeId, name: emp?.nome || 'Desconhecido', setor: emp?.setor || '', votes: count };
    })
    .sort((a, b) => b.votes - a.votes);
  
  const handleDownloadPDF = async (elementId: string, fileName: string) => {
    const reportElement = document.getElementById(elementId);
    if (!reportElement) return;
    setIsDownloading(true);

    try {
        // Obter dimensões reais do elemento para precisão de DPI
        const rect = reportElement.getBoundingClientRect();
        
        const canvas = await html2canvas(reportElement, { 
            scale: 2, // 2x para nitidez em telas retina e impressão
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: -window.scrollY, // Corrigir offset de scroll
            width: reportElement.offsetWidth,
            height: reportElement.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({ 
            orientation: 'p', 
            unit: 'mm', 
            format: 'a4',
            compress: true
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // Adicionar primeira página
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        // Loop de fatiamento matemático sem repetições
        // Cada nova página desloca o "eixo Y" da imagem original exatamente uma altura de página PDF (pdfHeight)
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${fileName}_${settings.mandate.replace('/', '-')}.pdf`);
    } catch (error) {
        console.error("PDF Precision Error:", error);
        alert("Erro técnico na geração do documento A4.");
    } finally {
        setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '___/___/___';
    const date = new Date(dateString + 'T12:00:00'); 
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all uppercase mb-4 placeholder:text-slate-300";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

  const renderAtaHeader = () => (
    <div className="text-center mb-16 flex flex-col items-center">
      {settings.logoBase64 && (
        <img src={settings.logoBase64} alt="Logo" className="h-14 mb-8 object-contain" />
      )}
      <h1 className="text-xl font-black text-[#002B54] uppercase tracking-tight leading-none mb-3">
        {settings.companyName}
      </h1>
      <h2 className="text-sm font-black text-[#002B54]/80 uppercase tracking-widest mb-2">
        ATA DA {meetingData.number}ª REUNIÃO {activeReport === 'ordinary' ? 'ORDINÁRIA' : 'EXTRAORDINÁRIA'} DA CIPA
      </h2>
      <p className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-[0.4em]">
        GESTÃO {settings.mandate}
      </p>
      <div className="w-full h-px bg-[#E2E8F0] mt-10 mb-2"></div>
    </div>
  );

  const renderPresenca = () => (
    <div className="mt-auto pt-10 border-t border-slate-200" style={{ breakInside: 'avoid' }}>
      <p className="text-center font-black uppercase text-[10px] mb-10 tracking-[0.2em] text-[#8E9AAF]">Lista de Presença Oficial</p>
      <div className="grid grid-cols-1 gap-6 mb-12">
        {Array.from({ length: attendanceRows }).map((_, i) => (
            <div key={i} className="border-b border-slate-200 h-8 flex justify-between items-end pb-1 text-[9px] font-bold text-[#8E9AAF]" style={{ breakInside: 'avoid' }}>
              <span className="uppercase">NOME: ____________________________________________________________________</span>
              <span className="uppercase">RUBRICA: ______________________</span>
            </div>
        ))}
      </div>
      <div className="mt-8 text-center pb-8">
         <p className="text-[8px] font-black text-[#CBD5E1] uppercase tracking-[0.3em]">Documento gerado eletronicamente em conformidade com a NR-5</p>
      </div>
    </div>
  );

  const renderSignatories = (type: ReportType) => {
    const titles = type === 'extraordinary' 
      ? ['Presidente da CIPA', 'Vice-Presidente', 'Secretário(a)', 'Membro Titular', 'Membro Suplente', 'Testemunha']
      : ['Presidente da CIPA', 'Secretário(a) da CIPA', 'Membro Eleito', 'Membro Designado', 'Membro Suplente', 'Apoiador'];

    return (
      <div className="grid grid-cols-2 gap-x-16 gap-y-12 pt-12 pb-20 text-[10px] font-black uppercase text-slate-900" style={{ breakInside: 'avoid' }}>
        {Array.from({ length: signatoriesCount }).map((_, i) => (
           <div key={i} className="text-center" style={{ breakInside: 'avoid' }}>
             <div className="border-t-2 border-slate-900 pt-3">
               {titles[i] || `Assinatura ${i + 1}`}
             </div>
           </div>
        ))}
      </div>
    );
  };

  const renderOrdinaryContent = (id?: string) => (
    <div id={id} className="bg-white p-16 md:p-24 shadow-xl min-h-[297mm] flex flex-col text-justify leading-relaxed text-slate-800 font-serif w-full max-w-[210mm] mx-auto print:shadow-none print:border-0 overflow-hidden">
      {renderAtaHeader()}
      <div className="flex-1 px-4">
        <p className="mb-8 indent-12 text-sm md:text-base leading-relaxed">
          Aos <strong>{formatDate(meetingData.date)}</strong>, às <strong>{meetingData.startTime}</strong> horas, no local <strong>{meetingData.local}</strong>, 
          reuniram-se os membros da Comissão Interna de Prevenção de Acidentes – CIPA da empresa {settings.companyName}, conforme lista de presença anexa para tratativa dos itens de pauta agendados para este período.
        </p>

        <p className="mb-4 font-black uppercase text-[11px] tracking-widest text-[#002B54] underline underline-offset-4">1. Pauta da Reunião:</p>
        <div className="mb-10 whitespace-pre-line pl-6 border-l-2 border-slate-200 italic text-slate-600 text-xs md:text-sm">
          {meetingData.agenda}
        </div>

        <p className="mb-4 font-black uppercase text-[11px] tracking-widest text-[#002B54] underline underline-offset-4">2. Discussões e Deliberações:</p>
        <p className="mb-6 text-sm leading-relaxed">
          Dando início aos trabalhos, o Presidente da CIPA cumprimentou a todos e iniciou a leitura da pauta. Após ampla discussão dos itens técnicos e de segurança, ficaram definidas as seguintes deliberações e encaminhamentos:
        </p>
        <div className="mb-10 whitespace-pre-line bg-slate-50 p-8 rounded-2xl border border-slate-100 text-xs md:text-sm italic text-slate-700 leading-relaxed font-medium">
          {meetingData.deliberations || "Nenhuma deliberação registrada para este encontro."}
        </div>

        <p className="mb-16 text-sm">
          Nada mais havendo a tratar, a reunião foi encerrada às <strong>{meetingData.endTime}</strong> horas, sendo lavrada a presente ata que, lida e aprovada, segue assinada pelos presentes para os devidos fins legais.
        </p>

        {renderSignatories('ordinary')}
      </div>

      {renderPresenca()}
    </div>
  );

  const renderExtraordinaryContent = (id?: string) => (
    <div id={id} className="bg-white p-16 md:p-24 shadow-xl min-h-[297mm] flex flex-col text-justify leading-relaxed text-slate-800 font-serif w-full max-w-[210mm] mx-auto print:shadow-none print:border-0 overflow-hidden">
      {renderAtaHeader()}
      <div className="flex-1 px-4">
        <p className="mb-8 indent-12 text-sm md:text-base leading-relaxed">
          Em caráter de urgência, aos <strong>{formatDate(meetingData.date)}</strong>, às <strong>{meetingData.startTime}</strong> horas, no local <strong>{meetingData.local}</strong>, 
          reuniram-se extraordinariamente os membros da Comissão Interna de Prevenção de Acidentes (CIPA) da empresa {settings.companyName}.
        </p>

        <div className="mb-10 p-8 bg-red-50 border border-red-100 rounded-2xl" style={{ breakInside: 'avoid' }}>
          <p className="font-black uppercase text-red-800 text-[10px] mb-2 tracking-[0.2em]">Motivo da Convocação Extraordinária:</p>
          <p className="text-red-900 italic text-sm font-medium">{meetingData.extraordinaryReason}</p>
        </div>

        {meetingData.agenda && (
          <div className="mb-10">
            <p className="mb-4 font-black uppercase text-[11px] tracking-widest text-[#002B54] underline underline-offset-4">Pauta da Reunião:</p>
            <div className="whitespace-pre-line pl-6 border-l-2 border-slate-200 italic text-slate-600 text-xs md:text-sm">
              {meetingData.agenda}
            </div>
          </div>
        )}

        <p className="mb-4 font-black uppercase text-[11px] tracking-widest text-[#002B54] underline underline-offset-4">Discussão e Encaminhamentos Imediatos:</p>
        <p className="mb-8 text-sm leading-relaxed">
          O Presidente da CIPA abriu a sessão explicando a criticidade do evento que motivou a convocação. Após análise técnica da situação, foram tomadas as seguintes decisões para mitigação de riscos:
        </p>
        
        <div className="mb-10 whitespace-pre-line pl-6 border-l-4 border-slate-900 italic text-xs md:text-sm font-medium text-slate-700 leading-relaxed">
          {meetingData.deliberations || "Nenhuma ação corretiva registrada."}
        </div>

        <p className="mb-16 text-sm">
          A reunião foi encerrada às <strong>{meetingData.endTime}</strong> horas. A presente ata foi lida e validada por todos, comprometendo os responsáveis às ações citadas.
        </p>

        {renderSignatories('extraordinary')}
      </div>

      {renderPresenca()}
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-[1440px] mx-auto pb-32">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 no-print bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm sticky top-24">
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-2">Documentação</h2>
            <div className="space-y-2">
              {[
                { id: 'election', label: 'Relatório Eleição', icon: Trophy },
                { id: 'ordinary', label: 'Ata Ordinária', icon: Calendar },
                { id: 'extraordinary', label: 'Ata Extraordinária', icon: AlertCircle }
              ].map(btn => (
                <button 
                    key={btn.id}
                    onClick={() => setActiveReport(btn.id as ReportType)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all ${activeReport === btn.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                    <span className="flex items-center gap-3"><btn.icon className="w-4 h-4" /> {btn.label}</span>
                    {activeReport === btn.id && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#414856] rounded-3xl p-6 shadow-lg shadow-[#414856]/10">
             <button 
               onClick={() => handleDownloadPDF(`report-${activeReport}`, `Ata_Oficial`)}
               disabled={isDownloading}
               className="w-full py-4 bg-[#F1F5F9] text-[#1E293B] rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white shadow-sm disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
             >
               {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
               Gerar PDF
             </button>
          </div>
        </aside>

        {/* Workspace */}
        <div className="flex-1 w-full">
          
          {activeReport === 'election' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm no-print flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pl-2 flex items-center gap-2"><Trophy className="w-4 h-4 text-blue-600" /> Resultados Finais</h3>
                   <div className="h-6 w-px bg-slate-200"></div>
                   <div className="flex items-center gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite de Eleitos:</label>
                      <input 
                        type="number" min="1" max={results.length || 1}
                        value={electedCount}
                        onChange={(e) => updateLocalConfig('electedCount', Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 outline-none w-16 px-3 py-1.5 rounded-xl focus:border-blue-500"
                      />
                   </div>
                </div>
              </div>

              <div id="report-election" className="bg-white p-16 md:p-24 shadow-2xl w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
                <div className="flex-1 space-y-10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4">Classificação dos Candidatos</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{results.length} Candidatos Homologados</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {results.map((res, idx) => (
                      <div key={res.id} className={`flex items-center justify-between p-6 rounded-[24px] border-2 transition-all ${idx < electedCount ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-white text-slate-400'}`}>
                             {idx === 0 ? <Trophy className="w-6 h-6" /> : <span className="font-black text-sm">#{idx + 1}</span>}
                           </div>
                           <div>
                             <div className="font-black text-slate-900 uppercase text-sm tracking-tight flex items-center gap-3">
                                {res.name} 
                                {idx < electedCount && <span className="px-2 py-0.5 bg-emerald-600 text-white text-[8px] rounded-full">ELEITO</span>}
                             </div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{res.setor}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-3xl font-black text-slate-900 leading-none">{res.votes}</div>
                           <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-2">Votos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-20 pt-32 pb-20">
                  <div className="text-center"><div className="border-t-2 border-slate-900 pt-3 text-[11px] font-black uppercase text-slate-900">Presidente da Mesa Eleitoral</div></div>
                  <div className="text-center"><div className="border-t-2 border-slate-900 pt-3 text-[11px] font-black uppercase text-slate-900">Secretário(a) Ad Hoc</div></div>
                </div>
                
                <div className="mt-auto text-center border-t border-slate-100 pt-6">
                   <p className="text-[8px] font-black text-[#CBD5E1] uppercase tracking-[0.3em]">Relatório Final de Apuração - Processo CIPA</p>
                </div>
              </div>
            </div>
          )}

          {(activeReport === 'ordinary' || activeReport === 'extraordinary') && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Form Editor */}
              <div className="xl:col-span-4 space-y-6 no-print bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-fit sticky top-24">
                <header className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 text-white rounded-xl"><Settings2 className="w-4 h-4" /></div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Editor de Ata</h3>
                   </div>
                   <button onClick={() => setLocalReportConfig(settings.reportConfig!)} className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors">Resetar</button>
                </header>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Ata Nº</label><input type="number" className={inputClass} value={meetingData.number} onChange={e => updateMeetingData('number', e.target.value)} /></div>
                    <div><label className={labelClass}>Data do Evento</label><input type="date" className={inputClass} value={meetingData.date} onChange={e => updateMeetingData('date', e.target.value)} /></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Início</label><input type="time" className={inputClass} value={meetingData.startTime} onChange={e => updateMeetingData('startTime', e.target.value)} /></div>
                    <div><label className={labelClass}>Término</label><input type="time" className={inputClass} value={meetingData.endTime} onChange={e => updateMeetingData('endTime', e.target.value)} /></div>
                  </div>

                  <div className="space-y-2 mb-4">
                     <label className={labelClass}>Assinaturas (Rodapé)</label>
                     <div className="flex items-center gap-3">
                        <PenTool className="w-4 h-4 text-slate-400" />
                        <input 
                          type="range" min="1" max="6" 
                          value={signatoriesCount} 
                          onChange={e => updateMeetingData('signatoriesCount', Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900" 
                        />
                        <span className="text-xs font-black text-slate-900 w-6">{signatoriesCount}</span>
                     </div>
                  </div>

                  <div className="space-y-2 mb-4">
                     <label className={labelClass}>Linhas de Presença</label>
                     <div className="flex items-center gap-3">
                        <ListChecks className="w-4 h-4 text-slate-400" />
                        <input 
                          type="range" min="1" max="30" 
                          value={attendanceRows} 
                          onChange={e => updateMeetingData('attendanceRows', Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                        <span className="text-xs font-black text-slate-900 w-6">{attendanceRows}</span>
                     </div>
                  </div>
                  
                  <div><label className={labelClass}>Local da Reunião</label><input type="text" className={inputClass} value={meetingData.local} onChange={e => updateMeetingData('local', e.target.value)} /></div>

                  {activeReport === 'extraordinary' && (
                    <div>
                      <label className={labelClass}>Motivo da Urgência</label>
                      <textarea rows={3} className={inputClass} value={meetingData.extraordinaryReason} onChange={e => updateMeetingData('extraordinaryReason', e.target.value)} placeholder="Descreva o motivo..." />
                    </div>
                  )}

                  <div><label className={labelClass}>Pauta do Dia</label><textarea rows={4} className={inputClass} value={meetingData.agenda} onChange={e => updateMeetingData('agenda', e.target.value)} /></div>
                  <div><label className={labelClass}>Deliberações</label><textarea rows={6} className={inputClass} value={meetingData.deliberations} onChange={e => updateMeetingData('deliberations', e.target.value)} /></div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-center">
                   <button 
                     onClick={() => setIsFullscreen(true)}
                     className="w-full flex items-center justify-center gap-3 bg-slate-100 text-slate-600 py-4 rounded-2xl hover:bg-slate-200 transition-all text-[11px] font-black uppercase tracking-widest mb-3 shadow-inner"
                   >
                     <Maximize2 className="w-4 h-4" /> Expandir Preview
                   </button>
                </div>
              </div>

              {/* Document Preview */}
              <div className="xl:col-span-8 w-full overflow-hidden">
                 <div className="bg-[#F8FAFC] rounded-[48px] p-12 md:p-16 border-4 border-dashed border-slate-200 flex flex-col items-center">
                    <div className="flex items-center justify-between w-full max-w-[210mm] mb-8 px-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Módulo de Visualização Profissional (ISO 216)</span>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sincronizado com Editor</span>
                       </div>
                    </div>
                    <div className="w-full shadow-[0_32px_128px_rgba(0,0,0,0.1)] scale-[0.85] md:scale-100 origin-top overflow-x-auto scrollbar-hide">
                       <div className="min-w-[700px]">
                          {activeReport === 'ordinary' ? renderOrdinaryContent('report-ordinary') : renderExtraordinaryContent('report-extraordinary')}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/98 backdrop-blur-2xl overflow-y-auto p-4 md:p-16 flex items-start justify-center animate-fadeIn">
          <div className="relative w-full max-w-5xl my-auto">
             <div className="absolute -top-20 right-0 flex items-center gap-4">
               <button 
                 onClick={() => setIsFullscreen(false)}
                 className="bg-white/10 hover:bg-white/20 text-white p-5 rounded-full transition-all flex items-center gap-4 pr-10 backdrop-blur-2xl border border-white/10 shadow-2xl"
               >
                 <X className="w-7 h-7" />
                 <span className="text-[12px] font-black uppercase tracking-[0.2em]">Encerrar Visualização</span>
               </button>
             </div>
             <div className="shadow-[0_64px_256px_rgba(0,0,0,0.6)] rounded-[48px] overflow-hidden scale-95 md:scale-100 origin-top">
                {activeReport === 'ordinary' && renderOrdinaryContent('fs-ord')}
                {activeReport === 'extraordinary' && renderExtraordinaryContent('fs-ext')}
                {activeReport === 'election' && (
                  <div className="bg-white p-24 shadow-2xl min-h-[297mm] max-w-[210mm] mx-auto overflow-hidden flex flex-col items-center justify-center">
                      <div className="p-10 border-4 border-dashed border-slate-100 rounded-[48px] text-center">
                         <FileText className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                         <p className="font-black text-slate-200 uppercase tracking-[0.4em]">Visualização A4 de Alta Definição</p>
                      </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTab;