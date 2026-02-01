
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Bot, User, Loader2, ShieldCheck, Info } from 'lucide-react';

const AIAssistantTab: React.FC = () => {
  const { employees, registrations, votes, settings } = useAppStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: `Olá! Sou seu assistente especializado em NR-5. Como posso ajudar no processo eleitoral da ${settings.companyName} hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `
        Você é um assistente especialista em CIPA e na norma regulamentadora NR-5 brasileira.
        Dados atuais da empresa ${settings.companyName}:
        - Total de colaboradores: ${employees.length}
        - Candidatos inscritos: ${registrations.length}
        - Votos computados: ${votes.length}
        - Mandato atual: ${settings.mandate}

        Responda de forma profissional, clara e baseada na lei. Se o usuário perguntar algo fora do contexto de CIPA ou Segurança do Trabalho, peça gentilmente para focar no tema.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nPergunta do usuário: ${userMessage}`,
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.text || 'Desculpe, não consegui processar sua resposta.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Ocorreu um erro na comunicação com meu cérebro digital. Verifique sua conexão.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-250px)] flex flex-col animate-fadeIn">
      <header className="bg-white p-6 border-b border-slate-100 flex items-center justify-between rounded-t-[32px] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Consultoria IA</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Especialista NR-5 & Processos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Baseado na NR-5</span>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 scroll-smooth custom-scrollbar"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-popIn`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-blue-600 border border-slate-100'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-5 rounded-2xl text-sm leading-relaxed font-medium ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100 shadow-xl' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA está analisando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100 rounded-b-[32px]">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-6 pr-16 py-5 text-sm font-bold placeholder:text-slate-300 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            placeholder="Pergunte sobre dimensionamento, prazos ou regras da CIPA..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-90 disabled:opacity-30"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
          <Info className="w-3 h-3" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">As respostas da IA podem conter imprecisões. Valide com o SESMT.</span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AIAssistantTab;
