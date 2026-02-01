
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import { Vote, CheckCircle2, User, ShieldAlert, Fingerprint, Lock, CalendarClock, RefreshCw, ArrowRight, ShieldX, UserX } from 'lucide-react';
import { Employee } from '../types';
import { getEventStatus } from '../utils';

const VotingTab: React.FC = () => {
  const { registrations, employees, votes, castVote, settings } = useAppStore();
  const [voterMatricula, setVoterMatricula] = useState('');
  const [authenticatedVoter, setAuthenticatedVoter] = useState<Employee | null>(null);
  const [error, setError] = useState<{title: string, msg: string, icon: 'alert' | 'shield'} | null>(null);
  const [voted, setVoted] = useState(false);
  
  const candidates = useMemo(() => registrations
    .filter(r => r.status === 'approved')
    .map(r => ({ ...r, employee: employees.find(e => e.id === r.employeeId) })), [registrations, employees]);

  const scheduleStatus = useMemo(() => {
    return getEventStatus(
      settings.timelineEvents, 
      'votação', 
      'A votação ainda não foi iniciada.', 
      'O período de votação está encerrado.'
    );
  }, [settings.timelineEvents]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (voted) {
      timer = setTimeout(() => {
        setVoted(false);
        setAuthenticatedVoter(null);
        setVoterMatricula('');
        setError(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [voted]);

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const voter = employees.find(e => e.matricula.toLowerCase() === voterMatricula.toLowerCase());
    if (!voter) {
      setError({ title: "Não Localizado", msg: "Matrícula não encontrada em nossa base.", icon: 'alert' });
      return;
    }
    if (voter.isRestricted) {
      setError({ title: "Voto Impedido", msg: "Matrícula com restrição ativa (NR-5).", icon: 'shield' });
      return;
    }
    if (voter.status !== 'active') {
      setError({ title: "Cadastro Inativo", msg: "Colaborador inativo.", icon: 'alert' });
      return;
    }
    if (votes.some(v => v.voterMatricula === voter.matricula)) {
      setError({ title: "Voto já Registrado", msg: "Seu voto já foi computado.", icon: 'alert' });
      return;
    }
    setAuthenticatedVoter(voter);
  };

  const handleVote = async (candidateId: string) => {
    if (!authenticatedVoter) return;
    const newVote = {
      id: crypto.randomUUID(), candidateId, voterMatricula: authenticatedVoter.matricula, timestamp: new Date().toISOString()
    };
    try {
      await castVote(newVote);
      setVoted(true);
    } catch (e) {
      alert("Erro ao computar voto.");
    }
  };

  const handleResetAuth = () => {
    setAuthenticatedVoter(null);
    setVoterMatricula('');
    setError(null);
  };

  if (!scheduleStatus.isOpen) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn text-center max-w-lg mx-auto">
        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-[32px] flex items-center justify-center mb-8"><Lock className="w-10 h-10" /></div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Urna Fechada</h2>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-8">{scheduleStatus.message}</p>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg w-full">
           <div className="flex items-center gap-3 mb-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest"><CalendarClock className="w-4 h-4" /> Cronograma Oficial</div>
           <div className="text-xl font-black text-slate-800 uppercase">{scheduleStatus.dates}</div>
        </div>
      </div>
    );
  }

  if (voted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-green-100"><CheckCircle2 className="w-12 h-12" /></div>
        <h2 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Voto Confirmado!</h2>
        <button onClick={handleResetAuth} className="mt-12 text-blue-600 font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all"><RefreshCw className="w-4 h-4" /> Finalizar</button>
      </div>
    );
  }

  if (!authenticatedVoter) {
    return (
      <div className="max-w-md mx-auto py-12 animate-fadeIn">
        <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
             {settings.votingScreenLogoBase64 ? <img src={settings.votingScreenLogoBase64} alt="Logo" className="w-full h-full object-contain p-1" /> : <Fingerprint className="w-8 h-8 text-blue-600" />}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{settings.votingScreenTitle}</h2>
          <form onSubmit={handleIdentify} className="space-y-6 text-left mt-10">
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Matrícula Funcional</label>
               <input type="text" required placeholder="DIGITE SUA MATRÍCULA" className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 outline-none focus:border-blue-500 font-bold text-slate-800 text-lg uppercase" value={voterMatricula} onChange={(e) => setVoterMatricula(e.target.value)} />
            </div>
            {error && (
              <div className={`p-5 rounded-xl flex gap-4 items-start animate-shake border-2 ${error.icon === 'shield' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                {error.icon === 'shield' ? <ShieldX className="w-5 h-5 text-amber-500 flex-shrink-0" /> : <UserX className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <div><h4 className={`text-xs font-black uppercase mb-1 ${error.icon === 'shield' ? 'text-amber-700' : 'text-red-700'}`}>{error.title}</h4><p className={`text-[10px] font-bold leading-relaxed ${error.icon === 'shield' ? 'text-amber-800' : 'text-red-800'}`}>{error.msg}</p></div>
              </div>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 shadow-xl transition-all flex items-center justify-center gap-2"><ArrowRight className="w-4 h-4" /> Iniciar Votação</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm border-l-8 border-l-emerald-500">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">{authenticatedVoter.nome.charAt(0)}</div>
           <div><h1 className="text-xl font-black text-gray-900 leading-none uppercase">{authenticatedVoter.nome}</h1><div className="flex items-center gap-3 mt-1.5"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Matrícula: {authenticatedVoter.matricula}</span></div></div>
        </div>
        <button onClick={handleResetAuth} className="px-6 py-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Cancelar e Sair</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {candidates.map(c => (
            <div key={c.id} className="bg-white p-10 rounded-[48px] border-4 border-transparent hover:border-blue-600 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between min-h-[360px] relative overflow-hidden">
               <div className="space-y-6 relative z-10">
                  <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-inner"><User className="w-14 h-14" /></div>
                  <div className="space-y-2"><h3 className="font-black text-gray-900 text-2xl leading-tight group-hover:text-blue-800 transition-colors uppercase">{c.employee?.nome}</h3><div className="flex flex-col gap-1"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.employee?.setor}</span></div></div>
               </div>
               <div className="pt-8 mt-6 border-t border-gray-50 relative z-10">
                  <button onClick={() => handleVote(c.employeeId)} className="w-full bg-blue-700 text-white py-5 rounded-[24px] hover:bg-blue-800 font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3"><CheckCircle2 className="w-5 h-5" /> Confirmar Voto</button>
               </div>
            </div>
          ))}
      </div>
    </div>
  );
};
export default VotingTab;
