import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Trophy, Medal, FileDown, Loader2, FileText, Calendar, AlertCircle, Users, Layout, PenTool, Maximize2, X, Printer, Calculator, CloudCheck, CloudUpload } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ReportType = 'election' | 'ordinary' | 'extraordinary';

const ReportTab: React.FC = () => {
  const { votes, employees, registrations, settings, updateSettings, isSaving } = useAppStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportType>('election');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Local state initialized from settings for immediate UI responsiveness
  // Using a fallback for safety if settings are not yet fully loaded/migrated
  const [localReportConfig, setLocalReportConfig] = useState(settings.reportConfig || {
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
      extraordinaryReason: 'Acidente grave ocorrido no setor de produção.'
    }
  });

  // Effect to update local state if settings change externally (e.g. initial load)
  useEffect(() => {
    if (settings.reportConfig && JSON.stringify(settings.reportConfig) !== JSON.stringify(localReportConfig)) {
       // Only update if significantly different to avoid cursor jumps
       // We skip this check usually for inputs, but here it helps on first load
       if (!isSaving) {
         setLocalReportConfig(settings.reportConfig);
       }
    }
  }, [settings.reportConfig]);

  // Debounced Save Mechanism
  useEffect(() => {
    const timer = setTimeout(() => {
      // Comparação profunda simples para evitar updates desnecessários
      if (JSON.stringify(settings.reportConfig) !== JSON.stringify(localReportConfig)) {
        updateSettings({ reportConfig: localReportConfig });
      }
    }, 1000); // 1 segundo de debounce

    return () => clearTimeout(timer);
  }, [localReportConfig, updateSettings, settings.reportConfig]);

  // Helper para atualizar parte do config local
  const updateLocalConfig = (key: string, value: any) => {
     setLocalReportConfig(prev => ({
       ...prev,
       [key]: value
     }));
  };

  const updateMeetingData = (key: string, value: any) => {
    setLocalReportConfig(prev => ({
      ...prev,
      meetingData: {
        ...prev.meetingData,
        [key]: value
      }
    }));
  };

  // Alias para facilitar leitura no render
  const { electedCount, meetingData } = localReportConfig;

  // Lógica do Relatório de Eleição (Existente)
  const voteCounts = votes.reduce((acc: any, vote) => {
    acc[vote.candidateId] = (acc[vote.candidateId] || 0) + 1;
    return acc;
  }, {});

  const results = registrations
    .filter(r => r.status === 'approved')
    .map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return {
        id: r.employeeId,
        name: emp?.nome || 'Desconhecido',
        setor: emp?.setor || '',
        votes: voteCounts[r.employeeId] || 0
      };
    })
    .sort((a, b) => b.votes - a.votes);
  
  const handleDownloadPDF = async (elementId: string, fileName: string) => {
    const reportElement = document.getElementById(elementId);
    if (!reportElement) return;

    setIsDownloading(true);

    try {
        const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth - 20; // with margin
        let imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 10; // top margin

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
            position = -heightLeft - 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }
        
        pdf.save(`${fileName}_${settings.mandate.replace('/', '-')}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
        setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '___/___/___';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const inputClass = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all uppercase mb-4";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1";

  // --- Templates de Renderização para Reuso (Inline e Modal) ---

  const renderOrdinaryContent = (id?: string) => (
    <div id={id} className="bg-white p-16 rounded-xl border border-gray-100 shadow-sm min-h-[297mm] text-justify leading-relaxed text-slate-800 font-serif w-full max-w-[210mm] mx-auto">
      <div className="text-center mb-10">
        {settings.logoBase64 && (
          <img src={settings.logoBase64} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-xl font-bold uppercase">{settings.companyName}</h1>
        <h2 className="text-lg font-bold uppercase mt-2">ATA DA {meetingData.number}ª REUNIÃO ORDINÁRIA DA CIPA</h2>
        <p className="text-sm font-medium mt-1">Gestão {settings.mandate}</p>
      </div>

      <p className="mb-6 indent-8">
        Aos <strong>{formatDate(meetingData.date)}</strong>, com início às <strong>{meetingData.startTime}</strong> horas, no local <strong>{meetingData.local}</strong>, 
        reuniram-se os membros da Comissão Interna de Prevenção de Acidentes – CIPA da empresa {settings.companyName}, conforme lista de presença anexa.
      </p>

      <p className="mb-4 font-bold uppercase">1. Pauta da Reunião:</p>
      <div className="mb-6 whitespace-pre-line pl-4 border-l-2 border-slate-200 italic text-slate-600">
        {meetingData.agenda}
      </div>

      <p className="mb-4 font-bold uppercase">2. Discussões e Deliberações:</p>
      <p className="mb-6">
        Dando início aos trabalhos, o Presidente da CIPA cumprimentou a todos e iniciou a leitura da pauta. Após discussão dos itens, ficaram definidas as seguintes deliberações:
      </p>
      <div className="mb-8 whitespace-pre-line bg-slate-50 p-6 rounded-lg border border-slate-100 text-sm">
        {meetingData.deliberations || "Nenhuma deliberação registrada."}
      </div>

      <p className="mb-12">
        Nada mais havendo a tratar, a reunião foi encerrada às <strong>{meetingData.endTime}</strong> horas, sendo lavrada a presente ata que, lida e aprovada, segue assinada pelos presentes.
      </p>

      <div className="grid grid-cols-2 gap-16 pt-10">
        <div className="text-center">
          <div className="border-t border-black pt-2">Presidente da CIPA</div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2">Secretário(a) da CIPA</div>
        </div>
      </div>
      
      <div className="mt-20 pt-10 border-t-2 border-slate-100">
        <p className="text-center font-bold uppercase text-xs mb-6">Lista de Presença</p>
        <div className="space-y-4">
          {[1,2,3,4,5,6].map(i => (
              <div key={i} className="border-b border-slate-300 h-8 flex justify-between items-end pb-1 text-xs">
                <span>Nome: __________________________________________________</span>
                <span>Assinatura: _________________________</span>
              </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExtraordinaryContent = (id?: string) => (
    <div id={id} className="bg-white p-16 rounded-xl border border-gray-100 shadow-sm min-h-[297mm] text-justify leading-relaxed text-slate-800 font-serif w-full max-w-[210mm] mx-auto">
      <div className="text-center mb-10">
        {settings.logoBase64 && (
          <img src={settings.logoBase64} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-xl font-bold uppercase">{settings.companyName}</h1>
        <h2 className="text-lg font-bold uppercase mt-2 text-red-700">ATA DE REUNIÃO EXTRAORDINÁRIA DA CIPA</h2>
        <p className="text-sm font-medium mt-1">Gestão {settings.mandate}</p>
      </div>

      <p className="mb-6 indent-8">
        Aos <strong>{formatDate(meetingData.date)}</strong>, às <strong>{meetingData.startTime}</strong> horas, no local <strong>{meetingData.local}</strong>, 
        reuniram-se extraordinariamente os membros da Comissão Interna de Prevenção de Acidentes (CIPA) da empresa {settings.companyName}.
      </p>

      <div className="mb-6 p-6 bg-red-50 border border-red-100 rounded-lg">
        <p className="font-bold uppercase text-red-800 text-sm mb-2">Motivo da Convocação:</p>
        <p className="text-red-900 italic">{meetingData.extraordinaryReason}</p>
      </div>

      <p className="mb-4 font-bold uppercase">Discussão e Encaminhamentos:</p>
      <p className="mb-6">
        O Presidente da CIPA abriu a sessão explicando a urgência da reunião. Após análise detalhada da situação pelos membros presentes, foram tomadas as seguintes decisões imediatas:
      </p>
      
      <div className="mb-8 whitespace-pre-line pl-4 border-l-4 border-slate-900">
        {meetingData.deliberations || "Nenhuma ação registrada."}
      </div>

      <p className="mb-12">
        A reunião foi encerrada às <strong>{meetingData.endTime}</strong> horas. A presente ata foi lida, aprovada e assinada por todos os presentes, comprometendo-se os responsáveis a executar as ações nos prazos estipulados.
      </p>

      <div className="grid grid-cols-2 gap-16 pt-10">
        <div className="text-center">
          <div className="border-t border-black pt-2">Presidente da CIPA</div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2">Vice-Presidente da CIPA</div>
        </div>
      </div>
      
      <div className="mt-20 pt-10 border-t-2 border-slate-100">
        <p className="text-center font-bold uppercase text-xs mb-6">Membros Presentes</p>
        <div className="space-y-4">
          {[1,2,3,4,5,6].map(i => (
              <div key={i} className="border-b border-slate-300 h-8 flex justify-between items-end pb-1 text-xs">
                <span>Nome: __________________________________________________</span>
                <span>Assinatura: _________________________</span>
              </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar de Navegação */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4 no-print">
          <div className="mb-2 px-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Documentação</h2>
            <div className="flex items-center gap-2 mt-2">
               {isSaving ? (
                 <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                   <CloudUpload className="w-3 h-3 animate-bounce" /> Salvando...
                 </span>
               ) : (
                 <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                   <CloudCheck className="w-3 h-3" /> Salvo
                 </span>
               )}
            </div>
          </div>
          
          <div className="space-y-2">
            <button 
                onClick={() => setActiveReport('election')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeReport === 'election' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
            >
                <Trophy className="w-4 h-4" /> Relatório de Eleição
            </button>
            
            <button 
                onClick={() => setActiveReport('ordinary')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeReport === 'ordinary' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
            >
                <Calendar className="w-4 h-4" /> Reunião Ordinária
            </button>
            
            <button 
                onClick={() => setActiveReport('extraordinary')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeReport === 'extraordinary' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
            >
                <AlertCircle className="w-4 h-4" /> Reunião Extraordinária
            </button>
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1">
          
          {/* ================= RELATÓRIO DE ELEIÇÃO ================= */}
          {activeReport === 'election' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm no-print gap-4">
                <div className="flex items-center gap-6">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest pl-2">Visualização do Documento</h3>
                  
                  {/* Controle de Eleitos */}
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <div className="p-1.5 bg-green-100 text-green-700 rounded-lg">
                       <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Eleitos (NR-5)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={results.length > 0 ? results.length : 1}
                        value={electedCount}
                        onChange={(e) => updateLocalConfig('electedCount', Math.max(1, Number(e.target.value)))}
                        className="bg-transparent text-sm font-black text-slate-900 outline-none w-16 border-b border-slate-300 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDownloadPDF('report-election', 'Relatorio_Eleicao')}
                  disabled={isDownloading}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
                >
                  {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                  Exportar PDF
                </button>
              </div>

              <div id="report-election" className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm space-y-8 min-h-[297mm]">
                <div className="text-center space-y-2 pb-6 border-b border-gray-100">
                   {settings.logoBase64 && (
                     <img src={settings.logoBase64} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                   )}
                   <h2 className="text-3xl font-black text-blue-900 uppercase">{settings.companyName}</h2>
                   <h3 className="text-xl font-bold text-gray-700 tracking-widest uppercase">{settings.documentTitle}</h3>
                   <p className="text-sm font-medium text-gray-500">Mandato: {settings.mandate}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-800 border-l-4 border-blue-600 pl-4">Classificação Final</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {results.map((res, idx) => (
                      <div key={res.id} className={`flex items-center justify-between p-4 rounded-xl border ${idx < electedCount ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 flex items-center justify-center">
                             {idx === 0 && <Trophy className="w-8 h-8 text-yellow-500" />}
                             {idx === 1 && <Medal className="w-8 h-8 text-gray-400" />}
                             {idx === 2 && <Medal className="w-8 h-8 text-amber-600" />}
                             {idx > 2 && <span className="font-bold text-gray-400">#{idx + 1}</span>}
                           </div>
                           <div>
                             <div className="font-bold text-gray-900 uppercase flex items-center gap-2">
                                {res.name} 
                                {idx < electedCount && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full shadow-sm border border-green-200">ELEITO</span>
                                )}
                             </div>
                             <div className="text-xs text-gray-500 uppercase">{res.setor}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-2xl font-black text-gray-900">{res.votes}</div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold">Votos Recebidos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
                  <div className="text-center space-y-12">
                    <div className="border-t border-gray-900 mx-10 mt-10"></div>
                    <div className="text-sm font-bold uppercase">Presidente da Mesa</div>
                  </div>
                  <div className="text-center space-y-12">
                     <div className="border-t border-gray-900 mx-10 mt-10"></div>
                     <div className="text-sm font-bold uppercase">Secretário</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= REUNIÃO ORDINÁRIA ================= */}
          {activeReport === 'ordinary' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Controles de Edição */}
              <div className="xl:col-span-1 space-y-4 no-print bg-white p-6 rounded-2xl border border-slate-100 h-fit sticky top-24">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><PenTool className="w-4 h-4" /> Dados da Reunião</h3>
                
                <div>
                  <label className={labelClass}>Número da Reunião</label>
                  <input type="number" className={inputClass} value={meetingData.number} onChange={e => updateMeetingData('number', e.target.value)} />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>Data</label>
                    <input type="date" className={inputClass} value={meetingData.date} onChange={e => updateMeetingData('date', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Início</label>
                    <input type="time" className={inputClass} value={meetingData.startTime} onChange={e => updateMeetingData('startTime', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Término</label>
                    <input type="time" className={inputClass} value={meetingData.endTime} onChange={e => updateMeetingData('endTime', e.target.value)} />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Local</label>
                  <input type="text" className={inputClass} value={meetingData.local} onChange={e => updateMeetingData('local', e.target.value)} />
                </div>

                <div>
                  <label className={labelClass}>Pauta (Tópicos)</label>
                  <textarea rows={4} className={inputClass} value={meetingData.agenda} onChange={e => updateMeetingData('agenda', e.target.value)} />
                </div>

                <div>
                  <label className={labelClass}>Deliberações</label>
                  <textarea rows={4} className={inputClass} value={meetingData.deliberations} onChange={e => updateMeetingData('deliberations', e.target.value)} />
                </div>

                <button 
                  onClick={() => handleDownloadPDF('report-ordinary', 'Ata_Ordinaria')}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 text-[10px] font-black uppercase tracking-widest mt-4"
                >
                  {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                  Baixar Ata (PDF)
                </button>
              </div>

              {/* Visualização do Documento (Inline) */}
              <div className="xl:col-span-2 relative">
                 <div className="absolute top-4 right-4 z-10 no-print">
                   <button 
                     onClick={() => setIsFullscreen(true)}
                     className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors flex items-center gap-2"
                     title="Visualizar em Tela Cheia"
                   >
                     <Maximize2 className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-wider">Tela Cheia</span>
                   </button>
                 </div>
                 {renderOrdinaryContent('report-ordinary')}
              </div>
            </div>
          )}

          {/* ================= REUNIÃO EXTRAORDINÁRIA ================= */}
          {activeReport === 'extraordinary' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Controles de Edição */}
              <div className="xl:col-span-1 space-y-4 no-print bg-white p-6 rounded-2xl border border-slate-100 h-fit sticky top-24">
                 <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-xs font-black uppercase">Modo Extraordinário</span>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>Data</label>
                    <input type="date" className={inputClass} value={meetingData.date} onChange={e => updateMeetingData('date', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Início</label>
                    <input type="time" className={inputClass} value={meetingData.startTime} onChange={e => updateMeetingData('startTime', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Término</label>
                    <input type="time" className={inputClass} value={meetingData.endTime} onChange={e => updateMeetingData('endTime', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Motivo da Convocação</label>
                  <textarea rows={3} className={inputClass} value={meetingData.extraordinaryReason} onChange={e => updateMeetingData('extraordinaryReason', e.target.value)} />
                </div>

                <div>
                  <label className={labelClass}>Deliberações e Ações</label>
                  <textarea rows={6} className={inputClass} value={meetingData.deliberations} onChange={e => updateMeetingData('deliberations', e.target.value)} />
                </div>

                <button 
                  onClick={() => handleDownloadPDF('report-extraordinary', 'Ata_Extraordinaria')}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 text-[10px] font-black uppercase tracking-widest mt-4"
                >
                  {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                  Baixar Ata (PDF)
                </button>
              </div>

               {/* Visualização do Documento (Inline) */}
               <div className="xl:col-span-2 relative">
                 <div className="absolute top-4 right-4 z-10 no-print">
                   <button 
                     onClick={() => setIsFullscreen(true)}
                     className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors flex items-center gap-2"
                     title="Visualizar em Tela Cheia"
                   >
                     <Maximize2 className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-wider">Tela Cheia</span>
                   </button>
                 </div>
                 {renderExtraordinaryContent('report-extraordinary')}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ================= MODAL DE TELA CHEIA ================= */}
      {isFullscreen && (activeReport === 'ordinary' || activeReport === 'extraordinary') && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex items-start justify-center animate-fadeIn">
          <div className="relative w-full max-w-5xl my-auto">
             <div className="absolute -top-12 right-0 flex items-center gap-4">
               <button 
                 onClick={() => setIsFullscreen(false)}
                 className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors flex items-center gap-2 pr-4 backdrop-blur-md"
               >
                 <X className="w-5 h-5" />
                 <span className="text-xs font-bold uppercase tracking-widest">Fechar</span>
               </button>
             </div>
             
             {/* Renderiza o conteúdo sem ID para evitar duplicidade no DOM se o de fundo ainda existir, ou usa um ID diferente se necessário */}
             <div className="shadow-2xl rounded-2xl overflow-hidden transform scale-100 transition-all">
                {activeReport === 'ordinary' && renderOrdinaryContent('fullscreen-ordinary')}
                {activeReport === 'extraordinary' && renderExtraordinaryContent('fullscreen-extraordinary')}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportTab;