import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { 
  UserPlus, Info, ChevronRight, Check, ShieldAlert, 
  X, FileText, Printer, ShieldCheck, Copy, Lock, CalendarClock
} from 'lucide-react';
import { Registration, Employee, MembershipType, AppSettings } from '../types';
import { getEventStatus } from '../utils';

const PrintableRegistrationForm: React.FC<{ registration: any, settings: AppSettings }> = ({ registration, settings }) => (
  <div className="bg-white w-full h-full p-12 relative">
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase">{settings.companyName}</h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">SESMT - SEGURANÇA DO TRABALHO</p>
      </div>
      {settings.logoBase64 && (
        <img src={settings.logoBase64} alt="Logo" className="h-16 w-auto object-contain" />
      )}
    </div>
    <div className="text-center mb-12">
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Ficha de Inscrição de Candidato</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">CIPA - Mandato {settings.mandate}</p>
    </div>
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase">Nome do Candidato</span>
          <p className="text-sm font-black border-b border-slate-100 pb-2">{registration.employee?.nome}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase">Matrícula</span>
          <p className="text-sm font-black border-b border-slate-100 pb-2">#{registration.employee?.matricula}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase">Setor / Departamento</span>
          <p className="text-sm font-black border-b border-slate-100 pb-2 uppercase">{registration.employee?.setor}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase">Cargo Atual</span>
          <p className="text-sm font-black border-b border-slate-100 pb-2 uppercase">{registration.employee?.cargo}</p>
        </div>
      </div>
      <div className="p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl text-center space-y-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoria do Pleito</span>
        <div className="flex items-center justify-center gap-3">
          {registration.membershipType === 'primary' ? <ShieldCheck className="w-8 h-8 text-blue-600" /> : <Copy className="w-8 h-8 text-emerald-600" />}
          <p className={`text-2xl font-black uppercase tracking-tight ${registration.membershipType === 'primary' ? 'text-blue-900' : 'text-emerald-900'}`}>
            {registration.membershipType === 'primary' ? 'Membro Titular' : 'Membro Suplente'}
          </p>
        </div>
        <p className="text-[9px] text-slate-400 font-bold uppercase">Homologado conforme normas da NR-5 para o período vigente.</p>
      </div>
      <div className="pt-24 grid grid-cols-2 gap-12">
         <div className="text-center">
            <div className="border-t border-slate-900 pt-3">
               <p className="text-[10px] font-black uppercase">{registration.employee?.nome}</p>
               <p className="text-[8px] text-slate-400 uppercase mt-1">Candidato</p>
            </div>
         </div>
         <div className="text-center">
            <div className="border-t border-slate-900 pt-3">
               <p className="text-[10px] font-black uppercase">Responsável SESMT / CIPA</p>
               <p className="text-[8px] text-slate-400 uppercase mt-1">Homologação</p>
            </div>
         </div>
      </div>
    </div>
    <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center text-[8px] font-black text-slate-300 uppercase tracking-widest border-t border-slate-50 pt-4">
       <span>Data: {new Date(registration.createdAt).toLocaleDateString('pt-BR')}</span>
       <span>Documento Gerado Eletronicamente via Portal CIPA</span>
       <span>Protocolo: {registration.id.substring(0,8).toUpperCase()}</span>
    </div>
  </div>
);

const RegistrationTab: React.FC = () => {
  const { employees, registrations, addRegistration, deleteRegistration, settings } = useAppStore();
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [membershipType, setMembershipType] = useState<MembershipType>('primary');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [tempEmployee, setTempEmployee] = useState<Employee | null>(null);
  const [previewRegistration, setPreviewRegistration] = useState<any>(null);

  const eligibleEmployees = employees.filter(e => e.status === 'active' && !e.isRestricted);

  const scheduleStatus = useMemo(() => {
    return getEventStatus(
      settings.timelineEvents, 
      'inscriç', 
      'O período de inscrições ainda não iniciou.', 
      'O período de inscrições já foi encerrado.'
    );
  }, [settings.timelineEvents]);

  const handleOpenConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;
    
    // Verifica duplicidade
    if (registrations.some(r => r.employeeId === selectedEmpId)) {
      setShowErrorModal(true);
      return;
    }
    
    setTempEmployee(emp);
    setShowConfirmModal(true);
  };

  const finalizeRegistration = async () => {
    if (!tempEmployee) return;
    const newReg: Registration = {
      id: crypto.randomUUID(),
      employeeId: tempEmployee.id,
      status: 'approved',
      membershipType: membershipType,
      createdAt: new Date().toISOString()
    };
    try {
      await addRegistration(newReg);
      setSelectedEmpId('');
      setMembershipType('primary');
      setShowConfirmModal(false);
      setTempEmployee(null);
    } catch (e) {
      alert("Erro ao registrar candidatura.");
    }
  };

  const approvedRegistrations = registrations.map(reg => ({
    ...reg, employee: employees.find(e => e.id === reg.employeeId)
  }));

  const removeRegistration = async (id: string) => {
    if (window.confirm("CONFIRMAÇÃO EXECUTIVA: Deseja anular este registro?")) {
      await deleteRegistration(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn pb-20">
      <div className="lg:col-span-4 space-y-6 no-print">
        {scheduleStatus.isOpen ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-700"><UserPlus className="w-6 h-6" /></div>
              <div><h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">Registro Oficial</h2></div>
            </div>
            <form onSubmit={handleOpenConfirmation} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Selecionar Colaborador</label>
                <div className="relative">
                  <select className="w-full bg-white border-2 border-slate-200 rounded-xl px-5 py-4 text-black font-bold text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer uppercase" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} required>
                    <option value="" disabled>SELECIONE O NOME...</option>
                    {eligibleEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.nome} (MAT: {emp.matricula})</option>)}
                  </select>
                  <ChevronRight className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Tipo de Candidatura</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  <button type="button" onClick={() => setMembershipType('primary')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${membershipType === 'primary' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400'}`}>Titular</button>
                  <button type="button" onClick={() => setMembershipType('alternate')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${membershipType === 'alternate' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>Suplente</button>
                </div>
              </div>
              <button type="submit" disabled={!selectedEmpId} className="w-full bg-blue-700 text-white px-4 py-5 rounded-2xl hover:bg-blue-800 transition-all font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50">Homologar Candidato</button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 shadow-inner sticky top-24 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center"><Lock className="w-8 h-8 text-slate-500" /></div>
            <div><h3 className="text-xl font-black text-slate-900 uppercase">Inscrições Bloqueadas</h3><p className="text-xs text-slate-500 font-bold uppercase mt-2">{scheduleStatus.message}</p></div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200"><CalendarClock className="w-4 h-4 text-slate-400" /><span className="text-[10px] font-black text-slate-600 uppercase">{scheduleStatus.dates}</span></div>
          </div>
        )}
      </div>

      <div className="lg:col-span-8 space-y-6 no-print">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
           <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Candidatos Homologados</h2>
           <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest">{registrations.length} Registros</div>
        </div>
        {registrations.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[48px] p-24 flex flex-col items-center text-center"><Info className="w-10 h-10 text-slate-200 mb-6" /><p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Nenhuma candidatura homologada.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvedRegistrations.map(reg => (
              <div key={reg.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">{reg.membershipType === 'primary' ? <ShieldCheck className="w-16 h-16" /> : <Copy className="w-16 h-16" />}</div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${reg.membershipType === 'primary' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{reg.membershipType === 'primary' ? 'Membro Titular' : 'Membro Suplente'}</span>
                  </div>
                  <div className="flex items-center gap-5 mb-8">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border ${reg.membershipType === 'primary' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{reg.employee?.nome.charAt(0)}</div>
                     <div><div className="text-sm font-black text-slate-900 uppercase tracking-tight">{reg.employee?.nome || 'INVÁLIDO'}</div><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{reg.employee?.setor}</div></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 relative z-10">
                   <button onClick={() => setPreviewRegistration(reg)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] bg-slate-900 text-white hover:bg-slate-800 transition-all"> <FileText className="w-4 h-4" /> Visualizar Ficha</button>
                   <button onClick={() => removeRegistration(reg.id)} className="w-full text-[9px] font-black uppercase tracking-[0.2em] px-4 py-3 rounded-xl transition-all text-slate-400 hover:text-red-600 hover:bg-red-50">Anular Registro</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirmModal && tempEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[6px] z-[200] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[40px] max-w-lg w-full p-12 shadow-[0_0_80px_rgba(0,0,0,0.15)] animate-popIn border border-slate-100 text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100"><Check className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Protocolo de Confirmação</h3>
            <div className="bg-slate-50 rounded-3xl p-8 mb-10 space-y-6 text-left border border-slate-100">
              <div className="space-y-1"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador Selecionado</span><p className="text-lg font-black text-slate-900 uppercase">{tempEmployee.nome}</p></div>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={finalizeRegistration} className="w-full py-5 rounded-2xl bg-[#1e40af] text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-800 transition-all shadow-2xl">Efetivar Homologação</button>
              <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-[0.25em] hover:text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[6px] z-[300] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl animate-popIn border border-slate-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Ação Bloqueada</h3>
            <p className="text-sm font-medium text-slate-500 mb-8">
              Este colaborador já possui uma candidatura ativa.
            </p>
            <button 
              onClick={() => setShowErrorModal(false)} 
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {previewRegistration && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-slate-100 rounded-[32px] max-w-4xl w-full p-4 md:p-10 shadow-2xl animate-popIn flex flex-col md:flex-row gap-10">
            <div className="bg-white w-full aspect-[1/1.4142] shadow-inner border border-slate-200 overflow-hidden"><PrintableRegistrationForm registration={previewRegistration} settings={settings} /></div>
            <div className="flex flex-col justify-center gap-6 md:min-w-[200px]">
               <button onClick={() => window.print()} className="flex items-center justify-center gap-3 bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl"><Printer className="w-5 h-5" /> Imprimir</button>
               <button onClick={() => setPreviewRegistration(null)} className="flex items-center justify-center gap-3 bg-white text-slate-400 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-slate-600"><X className="w-4 h-4" /> Fechar</button>
            </div>
          </div>
        </div>
      )}
      <div className="hidden print:block">{previewRegistration && <div className="print-full-page-container"><PrintableRegistrationForm registration={previewRegistration} settings={settings} /></div>}</div>
    </div>
  );
};
export default RegistrationTab;