
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { 
  Search, UserPlus, Filter, Trash2, Building2, 
  X, Check, ShieldAlert, UserCheck, UserX, Pencil,
  ChevronLeft, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { Employee, Status } from '../types';

const EmployeesTab: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const ITEMS_PER_PAGE = 15;
  
  const [formValues, setFormValues] = useState<Partial<Employee>>({
    nome: '', matricula: '', setor: '', cargo: '', status: 'active' as Status, isRestricted: false
  });

  const filtered = employees.filter(e => {
    const matchesSearch = e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.matricula.includes(searchTerm) ||
                          e.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'all' || e.setor === sectorFilter;
    return matchesSearch && matchesSector;
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sectorFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const sectors = Array.from(new Set(employees.map(e => e.setor)));

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsProcessing(true);
    try {
      await deleteEmployee(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      alert("Erro ao excluir colaborador.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setFormValues({ ...emp });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormValues({ nome: '', matricula: '', setor: '', cargo: '', status: 'active', isRestricted: false });
    setIsModalOpen(true);
  };

  const toggleRestriction = async (id: string, currentStatus: boolean) => {
    try {
      await updateEmployee(id, { isRestricted: !currentStatus });
    } catch (error) {
      console.error("Erro ao atualizar restrição", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.nome || !formValues.matricula) return;
    setIsProcessing(true);

    try {
      if (editingId) {
        await updateEmployee(editingId, formValues);
      } else {
        const employee: Employee = {
          id: crypto.randomUUID(),
          nome: formValues.nome!,
          matricula: formValues.matricula!,
          setor: formValues.setor || 'Geral',
          cargo: formValues.cargo || 'Colaborador',
          email: '',
          status: 'active',
          isRestricted: !!formValues.isRestricted,
          createdAt: new Date().toISOString()
        };
        await addEmployee(employee);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const inputClass = "w-full bg-white border-2 border-slate-200 rounded-xl px-5 py-4 text-black font-bold text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all uppercase placeholder:text-slate-300";

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Base de Colaboradores</h1>
          <p className="text-slate-500 text-sm font-medium italic mt-1">Gestão estratégica de elegibilidade e conformidade NR-5</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-3 bg-[#1e40af] text-white px-8 py-3 rounded-xl hover:bg-blue-800 transition-all font-black text-[11px] uppercase tracking-[0.15em] shadow-xl shadow-blue-100 active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Novo Registro
        </button>
      </header>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Pesquisar por Nome, Matrícula ou Cargo..." 
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent border rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-bold uppercase placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 flex items-center pr-3 group focus-within:border-blue-500 transition-all">
          <div className="p-3.5 border-r border-slate-100">
            <Filter className="text-slate-400 w-4 h-4" />
          </div>
          <select 
            className="px-4 py-3 bg-transparent text-slate-600 font-black text-[11px] outline-none cursor-pointer min-w-[200px] uppercase tracking-widest"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
          >
            <option value="all">Filtro por Setor</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-6">Elegibilidade</th>
                <th className="px-8 py-6">Colaborador</th>
                <th className="px-8 py-6">Setor / Cargo</th>
                <th className="px-8 py-6 text-right">CONTROLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <Search className="w-12 h-12 text-slate-200" />
                       <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum registro localizado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map(emp => (
                  <tr key={emp.id} className={`hover:bg-blue-50/30 transition-all group ${emp.isRestricted ? 'bg-red-50/10' : ''}`}>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => toggleRestriction(emp.id, emp.isRestricted)}
                        className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl border transition-all min-w-[110px] ${
                          emp.isRestricted 
                            ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm shadow-emerald-100/50'
                        }`}
                      >
                        {emp.isRestricted ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                          {emp.isRestricted ? 'Restrito' : 'Apto'}
                        </span>
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 group-hover:text-blue-800 transition-colors uppercase text-sm tracking-tight">{emp.nome}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">MAT: #{emp.matricula}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-700 font-black text-[11px] uppercase tracking-tighter">
                        <Building2 className="w-3.5 h-3.5 text-slate-300" />
                        {emp.setor}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">{emp.cargo}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(emp); }} 
                          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all shadow-sm" 
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(emp.id); }} 
                          className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all shadow-sm" 
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Página {currentPage} de {totalPages} • Total: {filtered.length}
            </span>
            <div className="flex items-center gap-3">
              <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-3 bg-white border border-slate-200 rounded-xl hover:text-blue-700 disabled:opacity-30">
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className="p-3 bg-white border border-slate-200 rounded-xl hover:text-blue-700 disabled:opacity-30">
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-10 shadow-2xl animate-popIn border border-slate-100">
             <div className="flex items-center gap-5 mb-8">
               <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                 <AlertCircle className="w-8 h-8 text-red-600" />
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-900 leading-tight">Remover Registro?</h3>
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Ação definitiva</p>
               </div>
             </div>
             <p className="text-slate-500 mb-10 leading-relaxed text-sm font-medium">
               Esta ação removerá permanentemente o colaborador, <b>suas candidaturas e votos associados</b>.
             </p>
             <div className="flex gap-4">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-50">Abortar</button>
               <button onClick={handleConfirmDelete} disabled={isProcessing} className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] hover:bg-red-700 flex items-center justify-center gap-2">
                 {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />} Excluir
               </button>
             </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] z-[100] flex items-center justify-end">
          <div className="bg-white h-full max-w-lg w-full shadow-[0_0_60px_rgba(0,0,0,0.1)] animate-slideUp overflow-y-auto border-l border-slate-200 flex flex-col">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingId ? 'Editar Registro' : 'Novo Registro'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Módulo de Controle Administrativo</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 flex-1 space-y-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Nome Completo</label>
                  <input type="text" required placeholder="DIGITE O NOME COMPLETO" className={inputClass} value={formValues.nome} onChange={e => setFormValues({...formValues, nome: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Matrícula</label>
                    <input type="text" required placeholder="000" className={inputClass} value={formValues.matricula} onChange={e => setFormValues({...formValues, matricula: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Setor</label>
                    <input type="text" required placeholder="SETOR" className={inputClass} value={formValues.setor} onChange={e => setFormValues({...formValues, setor: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Cargo</label>
                  <input type="text" required placeholder="CARGO ATUAL" className={inputClass} value={formValues.cargo} onChange={e => setFormValues({...formValues, cargo: e.target.value})} />
                </div>

                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Privilégios NR-5</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Cargos diretivos ou de confiança</p>
                    </div>
                    <button type="button" onClick={() => setFormValues({...formValues, isRestricted: !formValues.isRestricted})} className={`w-14 h-7 rounded-full transition-all relative ${formValues.isRestricted ? 'bg-red-600' : 'bg-slate-300'}`}>
                       <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formValues.isRestricted ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                  {formValues.isRestricted && (
                    <div className="flex gap-3 items-start p-4 bg-red-100/40 rounded-2xl text-red-700 border border-red-100">
                       <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                       <p className="text-[9px] font-black uppercase tracking-tight leading-relaxed">RESTRIÇÃO ATIVA: Bloqueado para candidaturas.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-10">
                  <button type="submit" disabled={isProcessing} className="w-full py-5 rounded-2xl bg-[#1e40af] text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-800 transition-all shadow-2xl shadow-blue-100 flex items-center justify-center gap-3">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {editingId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-5 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-[0.25em] hover:text-slate-600">Cancelar Operação</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesTab;