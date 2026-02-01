
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Upload, CheckCircle2, Loader2, XCircle, ShieldAlert, Square, CloudUpload, RefreshCw, Hash, User, Building2, Briefcase, Mail, ShieldCheck, ChevronDown, FileDown, AlertTriangle, Check, Fingerprint, Download, Sparkles, Bot } from 'lucide-react';
import { Employee } from '../types';
import * as XLSX from 'xlsx';
import { normalizeCargoKey } from '../utils';
import { GoogleGenAI } from "@google/genai";

const SYSTEM_FIELDS = {
  id: { label: 'ID Sistema (Opcional)', icon: Fingerprint, color: 'text-purple-600', bgColor: 'bg-purple-50/50', borderColor: 'border-purple-200' },
  matricula: { label: 'Matrícula', icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50/50', borderColor: 'border-blue-200' },
  nome: { label: 'Nome', icon: User, color: 'text-emerald-600', bgColor: 'bg-emerald-50/50', borderColor: 'border-emerald-200' },
  setor: { label: 'Setor', icon: Building2, color: 'text-indigo-600', bgColor: 'bg-indigo-50/50', borderColor: 'border-indigo-200' },
  cargo: { label: 'Cargo', icon: Briefcase, color: 'text-amber-600', bgColor: 'bg-amber-50/50', borderColor: 'border-amber-200' },
  email: { label: 'E-mail (Opcional)', icon: Mail, color: 'text-slate-600', bgColor: 'bg-slate-50/50', borderColor: 'border-slate-200' },
};

const UploadTab: React.FC = () => {
  const { bulkImportEmployees, employees, settings } = useAppStore();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ready' | 'finishing' | 'completed'>('idle');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [mappedHeaders, setMappedHeaders] = useState<Record<string, keyof typeof SYSTEM_FIELDS | null>>({});
  const [rawData, setRawData] = useState<any[]>([]);
  const [restrictedNormalizedKeys, setRestrictedNormalizedKeys] = useState<Set<string>>(new Set());
  
  // States for Summary
  const [summaryStats, setSummaryStats] = useState({ total: 0, success: 0, failed: 0 });
  const [failedRecords, setFailedRecords] = useState<any[]>([]);
  
  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Função auxiliar para validar UUID
  const isValidUUID = (uuid: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  };

  const autoMapHeaders = (headers: string[]) => {
    const map: Record<string, keyof typeof SYSTEM_FIELDS | null> = {};
    headers.forEach(header => {
        const h = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        
        if (h === 'id' || h === 'uuid' || h === 'code' || h === 'codigo' || h === 'identificador') map[header] = 'id';
        else if (h.includes('matricula') || h === 'mat' || h === 'registro' || h.includes('funcional') || h === 're' || h === 'cracha') map[header] = 'matricula';
        else if (h.includes('nome') || h.includes('funcionario') || h.includes('colaborador') || h === 'name' || h === 'employee') map[header] = 'nome';
        else if (h.includes('setor') || h.includes('departamento') || h.includes('area') || h === 'cc' || h === 'unidade' || h === 'centro de custo') map[header] = 'setor';
        else if (h.includes('cargo') || h.includes('funcao') || h.includes('posicao') || h === 'role' || h === 'job' || h === 'occupation') map[header] = 'cargo';
        else if (h.includes('mail') || h.includes('correio') || h.includes('endereco eletronico') || h === 'usuario' || h === 'login') map[header] = 'email';
        else map[header] = null;
    });
    return map;
  };

  const handleDownloadTemplate = () => {
    const headers = ["MATRICULA", "NOME", "SETOR", "CARGO", "EMAIL"];
    const sampleData = [
      ["123456", "JOAO DA SILVA", "OPERACIONAL", "OPERADOR DE MAQUINAS", "joao@empresa.com.br"],
      ["654321", "MARIA OLIVEIRA", "ADMINISTRATIVO", "ANALISTA DE RH", "maria@empresa.com.br"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    ws['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 30 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Importacao");
    XLSX.writeFile(wb, "Modelo_Importacao_CIPA.xlsx");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = String(workbook.SheetNames[0]);
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
        if (rows.length < 2) throw new Error("Arquivo insuficiente.");
        const headers: string[] = rows[0].map((h: any) => String(h || '').trim()).filter(h => h !== '');
        setFileHeaders(headers);
        setRawData(rows.slice(1).map((row) => {
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = row[i] ? String(row[i]).trim() : '');
          return obj;
        }).filter(o => Object.values(o).some(v => v !== '')));
        
        setMappedHeaders(autoMapHeaders(headers));
        setStatus('ready');
      } catch (err) { alert("Erro ao processar arquivo."); setStatus('idle'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const validationResults = useMemo(() => {
    return rawData.map((row) => {
      const extracted: any = {};
      Object.entries(mappedHeaders).forEach(([fh, sf]) => { 
        if (sf) extracted[sf as string] = (row as any)[fh]; 
      });
      const errors = [];
      
      if (!extracted.matricula) errors.push("Matrícula vazia");
      if (!extracted.nome) errors.push("Nome vazio");
      if (!extracted.setor) errors.push("Setor vazio");
      if (!extracted.cargo) errors.push("Cargo vazio");
      
      return { isValid: errors.length === 0, errors, extracted };
    });
  }, [rawData, mappedHeaders]);

  const cargoGroups = useMemo(() => {
    const groups: Record<string, string> = {};
    validationResults.forEach(v => {
      if (v.isValid && v.extracted.cargo) {
        const key = normalizeCargoKey(v.extracted.cargo);
        if (!groups[key] || v.extracted.cargo.length > groups[key].length) groups[key] = v.extracted.cargo.toUpperCase();
      }
    });
    return Object.entries(groups).sort((a, b) => a[1].localeCompare(b[1]));
  }, [validationResults]);

  const runAiAnalysis = async (records: any[]) => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    
    try {
      const sectors: Record<string, number> = {};
      const roles: Record<string, number> = {};
      
      records.forEach(r => {
        const s = r.setor || 'Não informado';
        const c = r.cargo || 'Não informado';
        sectors[s] = (sectors[s] || 0) + 1;
        roles[c] = (roles[c] || 0) + 1;
      });

      const topSectors = Object.entries(sectors).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([k,v]) => `${k} (${v})`).join(', ');
      const topRoles = Object.entries(roles).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([k,v]) => `${k} (${v})`).join(', ');

      const prompt = `
        Analise brevemente os dados importados para o Portal CIPA da empresa ${settings.companyName}.
        Total Colaboradores Importados: ${records.length}.
        Principais Setores: ${topSectors}.
        Principais Cargos: ${topRoles}.
        
        Gere um parágrafo executivo e sofisticado (máximo 3 frases) confirmando o sucesso da importação e comentando sobre a representatividade e diversidade dos setores para a formação de uma CIPA equilibrada conforme NR-5. Use tom profissional e encorajador. Não use markdown, apenas texto corrido.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiAnalysis(response.text || 'Análise concluída com sucesso.');
    } catch (error) {
      console.error("Erro na análise IA:", error);
      setAiAnalysis("Importação concluída. A análise inteligente está temporariamente indisponível.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalize = async () => {
    setStatus('finishing');
    
    const validRecords = validationResults.filter(v => v.isValid);
    const invalidRecords = validationResults.filter(v => !v.isValid);

    const validToImport = validRecords.map(v => ({
      // CORREÇÃO CRÍTICA: Se o ID fornecido não for um UUID válido, ignoramos e geramos um novo
      // para evitar erro de sintaxe 'invalid input syntax for type uuid' no PostgreSQL.
      id: (v.extracted.id && isValidUUID(String(v.extracted.id))) 
          ? String(v.extracted.id) 
          : crypto.randomUUID(), 
      matricula: String(v.extracted.matricula), 
      nome: v.extracted.nome, 
      setor: v.extracted.setor,
      cargo: v.extracted.cargo, 
      email: v.extracted.email || '', 
      status: 'active' as const,
      isRestricted: restrictedNormalizedKeys.has(normalizeCargoKey(v.extracted.cargo)), 
      createdAt: new Date().toISOString()
    }));

    try {
      if (validToImport.length > 0) {
        await bulkImportEmployees(validToImport);
        runAiAnalysis(validToImport);
      } else {
         setAiAnalysis("Nenhum registro válido para análise.");
      }
      
      setSummaryStats({
        total: validationResults.length,
        success: validToImport.length,
        failed: invalidRecords.length
      });

      setFailedRecords(invalidRecords.map(rec => ({
        ...rec.extracted,
        'MOTIVO_ERRO': rec.errors.join(', ')
      })));

      setStatus('completed');
    } catch (e: any) {
      alert(`Erro crítico na importação: ${e.message}`);
      setStatus('ready');
    }
  };

  const downloadErrorReport = () => {
    if (failedRecords.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(failedRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Erros de Importação");
    XLSX.writeFile(wb, "Relatorio_Erros_Importacao.xlsx");
  };

  const handleReset = () => {
    setStatus('idle');
    setRawData([]);
    setFileHeaders([]);
    setMappedHeaders({});
    setFailedRecords([]);
    setAiAnalysis('');
    setSummaryStats({ total: 0, success: 0, failed: 0 });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Upload de Dados</h1></div>
        <div className="flex items-center gap-3">
           <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors">
             <Download className="w-3.5 h-3.5" /> Baixar Modelo (.xlsx)
           </button>
           {status === 'ready' && (
             <button onClick={() => setStatus('idle')} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-400 bg-slate-100 rounded-lg hover:bg-slate-200">
               <RefreshCw className="w-3 h-3" /> Alterar Arquivo
             </button>
           )}
        </div>
      </header>

      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="max-w-xl w-full border-2 border-dashed border-slate-200 rounded-[24px] p-16 flex flex-col items-center text-center group hover:border-blue-300 relative bg-white transition-colors">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
            <div className="w-16 h-16 bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-2xl flex items-center justify-center mb-6 transition-colors"><Upload className="w-8 h-8" /></div>
            <h3 className="text-lg font-bold text-slate-800 uppercase">Carregar Planilha</h3>
            <p className="text-xs text-slate-400 font-medium mt-2">Suporte a arquivos .CSV e .XLSX</p>
          </div>
          <div className="mt-8 text-center max-w-lg">
             <p className="text-xs text-slate-400 font-medium leading-relaxed">
               Certifique-se que sua planilha contenha as colunas obrigatórias: <strong className="text-slate-600">Matrícula, Nome, Setor e Cargo</strong>. O sistema tentará identificar as colunas automaticamente.
             </p>
          </div>
        </div>
      )}

      {(status === 'uploading' || status === 'finishing') && (
        <div className="py-40 flex flex-col items-center text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{status === 'uploading' ? 'Processando Arquivo' : 'Salvando Dados'}</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">Aguarde um momento...</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slideUp">
          <div className="lg:col-span-8 space-y-6">
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                <div className="overflow-auto flex-1 custom-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-white sticky top-0 z-20">
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-white w-20">Status</th>
                            {fileHeaders.map(h => (
                               <th key={h} className="px-4 py-4 border-b border-slate-100 min-w-[220px]">
                                  <div className="relative">
                                    <select 
                                      className={`w-full appearance-none bg-white border-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none transition-colors ${mappedHeaders[h] ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-slate-200 text-slate-500'}`}
                                      value={mappedHeaders[h] || 'ignore'} 
                                      onChange={(e) => setMappedHeaders({ ...mappedHeaders, [h]: e.target.value === 'ignore' ? null : e.target.value as any })}
                                    >
                                       <option value="ignore">--- IGNORAR ---</option>
                                       {Object.entries(SYSTEM_FIELDS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                                  </div>
                               </th>
                            ))}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {rawData.map((row, i) => (
                            <tr key={i} className={!validationResults[i].isValid ? 'bg-red-50/20' : ''}>
                               <td className="px-6 py-4">{validationResults[i].isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</td>
                               {fileHeaders.map(h => <td key={h} className="px-4 py-4 text-[11px] font-bold text-slate-500">{row[h] || '-'}</td>)}
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 sticky top-28">
                <div className="flex items-center gap-4"><div className="p-3 bg-red-50 text-red-600 rounded-xl"><ShieldAlert className="w-6 h-6" /></div><div><h3 className="text-lg font-bold text-slate-900 leading-tight">Configuração NR-5</h3></div></div>
                <div className="space-y-1 max-h-[300px] overflow-auto pr-2 custom-scrollbar border border-slate-100 rounded-xl bg-slate-50/30">
                   {cargoGroups.map(([key, displayName]) => (
                     <button key={key} onClick={() => { const s = new Set(restrictedNormalizedKeys); if (s.has(key)) s.delete(key); else s.add(key); setRestrictedNormalizedKeys(s); }} className={`w-full flex items-center justify-between p-4 border-b ${restrictedNormalizedKeys.has(key) ? 'bg-red-50 text-red-700' : 'bg-white'}`}>
                        <span className="text-[10px] font-black uppercase">{displayName}</span>
                        {restrictedNormalizedKeys.has(key) ? <ShieldCheck className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-0" />}
                     </button>
                   ))}
                </div>
                <button onClick={handleFinalize} disabled={validationResults.filter(v => v.isValid).length === 0} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-slate-200">
                   <CloudUpload className="w-5 h-5" /> Confirmar Importação
                </button>
             </div>
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="max-w-4xl mx-auto py-10 animate-popIn">
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
              <div className="bg-emerald-600 p-10 text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                 <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 text-white border border-white/30 shadow-lg">
                    <Check className="w-10 h-10" />
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Processamento Concluído</h2>
                 <p className="text-emerald-100 text-sm font-medium">Os dados foram sincronizados com a base de colaboradores.</p>
              </div>
              
              <div className="p-10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Processado</p>
                       <p className="text-4xl font-black text-slate-800">{summaryStats.total}</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Sucesso</p>
                       <p className="text-4xl font-black text-emerald-600">{summaryStats.success}</p>
                    </div>
                    <div className={`p-6 rounded-2xl border text-center ${summaryStats.failed > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${summaryStats.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>Falhas / Ignorados</p>
                       <p className={`text-4xl font-black ${summaryStats.failed > 0 ? 'text-red-600' : 'text-slate-300'}`}>{summaryStats.failed}</p>
                    </div>
                 </div>

                 {summaryStats.success > 0 && (
                   <div className="mb-10 relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                     <div className="px-6 py-4 border-b border-indigo-50 flex items-center gap-3">
                       <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                         <Sparkles className="w-4 h-4" />
                       </div>
                       <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Análise Preliminar de Elegibilidade (IA)</h3>
                     </div>
                     <div className="p-6">
                       {isAnalyzing ? (
                         <div className="flex items-center gap-3 text-slate-400">
                           <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                           <span className="text-xs font-bold uppercase tracking-wide">Gerando parecer técnico...</span>
                         </div>
                       ) : (
                         <div className="flex gap-4">
                           <Bot className="w-8 h-8 text-indigo-200 flex-shrink-0" />
                           <p className="text-sm text-slate-600 leading-relaxed font-medium">
                             {aiAnalysis || "Análise indisponível no momento."}
                           </p>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 <div className="space-y-4">
                    {summaryStats.failed > 0 && (
                       <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4 mb-6">
                          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                          <div>
                             <h4 className="text-sm font-black text-amber-800 uppercase mb-1">Atenção Necessária</h4>
                             <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                {summaryStats.failed} registro(s) não puderam ser importados devido a campos obrigatórios faltantes (Matrícula, Nome, Setor ou Cargo). 
                                Baixe o relatório detalhado para corrigir os dados.
                             </p>
                             <button onClick={downloadErrorReport} className="mt-4 flex items-center gap-2 bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors shadow-sm">
                                <FileDown className="w-4 h-4" /> Baixar Relatório de Erros
                             </button>
                          </div>
                       </div>
                    )}

                    <div className="flex gap-4">
                       <button onClick={handleReset} className="flex-1 bg-white border-2 border-slate-100 text-slate-500 p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center justify-center gap-3">
                          <RefreshCw className="w-4 h-4" /> Novo Upload
                       </button>
                       <button onClick={handleReset} className="flex-1 bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3">
                          <Check className="w-5 h-5" /> Concluído
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default UploadTab;
