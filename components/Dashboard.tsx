
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Users2, CheckCircle2, XCircle, TrendingUp, Vote, Search, X, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const Dashboard: React.FC = () => {
  const { employees, registrations, votes, settings } = useAppStore();
  const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);
  const [voterSearchTerm, setVoterSearchTerm] = useState('');
  const [voterCurrentPage, setVoterCurrentPage] = useState(1);
  const VOTERS_PER_PAGE = 10;

  const totalEmployees = employees.length;
  const aptos = employees.filter(e => e.status === 'active' && !e.isRestricted).length;
  const restritos = employees.filter(e => e.isRestricted).length;
  const totalRegistrations = registrations.filter(r => r.status === 'approved').length;
  const totalVotes = votes.length;
  
  const aptosPercentage = totalEmployees > 0 ? ((aptos / totalEmployees) * 100).toFixed(0) : "0";
  const restritosPercentage = totalEmployees > 0 ? ((restritos / totalEmployees) * 100).toFixed(0) : "0";
  const votesPercentage = aptos > 0 ? ((totalVotes / aptos) * 100).toFixed(0) : "0";

  const votersList = useMemo(() => {
    const votedMatriculas = new Set(votes.map(v => v.voterMatricula));
    return employees.filter(e => votedMatriculas.has(e.matricula)).sort((a,b) => a.nome.localeCompare(b.nome));
  }, [votes, employees]);

  const filteredVoters = useMemo(() => {
    const term = voterSearchTerm.toLowerCase();
    return votersList.filter(v =>
        v.nome.toLowerCase().includes(term) ||
        v.matricula.includes(term) ||
        v.setor.toLowerCase().includes(term)
    );
  }, [votersList, voterSearchTerm]);

  const totalVoterPages = Math.ceil(filteredVoters.length / VOTERS_PER_PAGE);
  const paginatedVoters = useMemo(() => {
    const start = (voterCurrentPage - 1) * VOTERS_PER_PAGE;
    return filteredVoters.slice(start, start + VOTERS_PER_PAGE);
  }, [filteredVoters, voterCurrentPage]);

  const handleOpenModal = () => {
    if (totalVotes > 0) {
      setVoterSearchTerm('');
      setVoterCurrentPage(1);
      setIsVotersModalOpen(true);
    }
  };

  const exportVotersToExcel = () => {
    const dataToExport = votersList.map(v => ({
      'NOME DO COLABORADOR': v.nome.toUpperCase(),
      'MATRÍCULA': v.matricula,
      'SETOR / DEPARTAMENTO': v.setor.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Votantes");
    
    // Configurar larguras das colunas
    ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 25 }];

    XLSX.writeFile(wb, `Relatorio_Votantes_CIPA_${settings.mandate.replace('/', '-')}.xlsx`);
  };

  const stats = [
    { 
      id: 'total-employees',
      label: 'Total de Colaboradores', 
      value: totalEmployees, 
      sub: 'Base de Dados', 
      icon: Users2, 
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      id: 'aptos',
      label: 'Aptos para CIPA', 
      value: aptos, 
      sub: `${aptosPercentage}% do Total`, 
      icon: CheckCircle2, 
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    { 
      id: 'restritos',
      label: 'Com Restrição', 
      value: restritos, 
      sub: `${restritosPercentage}% do Total`, 
      icon: XCircle, 
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    { 
      id: 'registrations',
      label: 'Inscritos na CIPA', 
      value: totalRegistrations, 
      sub: 'Candidatos', 
      icon: TrendingUp, 
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600'
    },
    { 
      id: 'total-votes',
      label: 'Total de Votos', 
      value: totalVotes, 
      sub: `${votesPercentage}% de Participação`, 
      icon: Vote, 
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
  ];

  const votesBySector = useMemo(() => {
    const sectorCounts: { [key: string]: number } = {};
    votes.forEach(vote => {
        const voter = employees.find(e => e.matricula === vote.voterMatricula);
        if (voter && voter.setor) {
            sectorCounts[voter.setor] = (sectorCounts[voter.setor] || 0) + 1;
        }
    });
    return Object.entries(sectorCounts)
      .map(([name, votos]) => ({ name, Votos: votos }))
      .sort((a,b) => b.Votos - a.Votos);
  }, [votes, employees]);

  const registrationsBySector = useMemo(() => {
      const sectorCounts: { [key: string]: number } = {};
      registrations
        .filter(r => r.status === 'approved')
        .forEach(reg => {
            const employee = employees.find(e => e.id === reg.employeeId);
            if (employee && employee.setor) {
                sectorCounts[employee.setor] = (sectorCounts[employee.setor] || 0) + 1;
            }
        });
      return Object.entries(sectorCounts)
        .map(([name, inscricoes]) => ({ name, Inscrições: inscricoes }))
        .sort((a,b) => b.Inscrições - a.Inscrições);
  }, [registrations, employees]);

  const StatCard: React.FC<{ stat: typeof stats[0] }> = ({ stat }) => (
    <div
      onClick={stat.id === 'total-votes' ? handleOpenModal : undefined}
      className={`bg-white p-5 rounded-2xl flex flex-col justify-between h-full relative transition-all duration-300 hover:shadow-lg border border-slate-100/80 ${stat.id === 'total-votes' && totalVotes > 0 ? 'cursor-pointer hover:bg-slate-50/50 group' : ''}`}
    >
      <div className="flex justify-between items-start w-full">
        <p className="text-sm font-bold text-slate-500 max-w-[70%]">{stat.label}</p>
        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${stat.iconBg}`}>
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.sub}</span>
      </div>
      {stat.id === 'total-votes' && totalVotes > 0 && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
           <Search className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold uppercase tracking-wider">{label}</p>
          <p className="mt-1">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Portal CIPA</h1>
          <p className="text-slate-500 text-sm font-medium">Dashboard de Gestão de Eleições</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo Real</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="min-w-0"><StatCard stat={stats[0]} /></div>
        <div className="min-w-0"><StatCard stat={stats[1]} /></div>
        <div className="min-w-0"><StatCard stat={stats[2]} /></div>
        <div className="min-w-0"><StatCard stat={stats[3]} /></div>
        <div className="md:col-span-2 min-w-0"><StatCard stat={stats[4]} /></div>
      </div>
      
      {(votesBySector.length > 0 || registrationsBySector.length > 0) && (
        <div className="space-y-6">
          {votesBySector.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-6">Votos por Setor</h3>
                <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        <BarChart data={votesBySector} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-30} textAnchor="end" height={50} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} />
                            <Bar dataKey="Votos" fill={settings.themeColor || '#1e40af'} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
          )}
          {registrationsBySector.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-6">Inscrições por Setor</h3>
                <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        <BarChart data={registrationsBySector} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-30} textAnchor="end" height={50} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} />
                            <Bar dataKey="Inscrições" fill={settings.themeColor || '#1e40af'} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
          )}
        </div>
      )}

      {isVotersModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-popIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl h-[calc(100vh-6rem)] overflow-hidden border border-slate-200">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Votantes Identificados</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {filteredVoters.length} de {votersList.length} registro(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={exportVotersToExcel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest border border-emerald-100"
                >
                  <FileDown className="w-4 h-4" />
                  Exportar XLSX
                </button>
                <button 
                  onClick={() => setIsVotersModalOpen(false)} 
                  className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex-shrink-0">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, matrícula ou setor..."
                  className="w-full bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold border-2 border-slate-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 uppercase"
                  value={voterSearchTerm}
                  onChange={(e) => {
                    setVoterSearchTerm(e.target.value);
                    setVoterCurrentPage(1);
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 bg-white">
              {paginatedVoters.length > 0 ? (
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Setor</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {paginatedVoters.map(voter => (
                        <tr key={voter.id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="font-black text-slate-800 uppercase text-xs group-hover:text-blue-700 transition-colors">{voter.nome}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider italic">MAT: #{voter.matricula}</div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest group-hover:bg-white group-hover:border group-hover:border-slate-200 transition-all">
                                {voter.setor}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              ) : (
                <div className="text-center py-24 px-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                     <Search className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Nenhum resultado</h4>
                  <p className="text-xs text-slate-400 font-medium mt-2">A busca "{voterSearchTerm}" não retornou nenhum votante registrado.</p>
                </div>
              )}
            </div>

            {totalVoterPages > 1 && (
              <footer className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Página {voterCurrentPage} de {totalVoterPages}
                </span>
                <div className="flex items-center gap-2">
                   <button
                    disabled={voterCurrentPage === 1}
                    onClick={() => setVoterCurrentPage(p => p - 1)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                    <ChevronLeft className="w-4 h-4" />
                   </button>
                   <button
                    disabled={voterCurrentPage === totalVoterPages}
                    onClick={() => setVoterCurrentPage(p => p + 1)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                    <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </footer>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-popIn { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Dashboard;
