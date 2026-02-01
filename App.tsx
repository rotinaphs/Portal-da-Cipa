import React, { useState, useEffect } from 'react';
import { 
  LogOut, RefreshCw, AlertTriangle, Building, CloudCheck, CloudUpload, Loader2,
  LayoutDashboard, Users, FileEdit, Vote, ScrollText, BarChart, Settings, Upload, Shield, Fingerprint, Activity, ClipboardList, Calendar, Briefcase, Sparkles, CalendarClock, ShieldCheck, HelpCircle
} from 'lucide-react';
import { useAppStore, AppProvider } from './store';

// Tabs
import Dashboard from './components/Dashboard';
import EmployeesTab from './components/EmployeesTab';
import RegistrationTab from './components/RegistrationTab';
import VotingTab from './components/VotingTab';
import BallotTab from './components/BallotTab';
import ReportTab from './components/ReportTab';
import SettingsTab from './components/SettingsTab';
import UploadTab from './components/UploadTab';
import AIAssistantTab from './components/AIAssistantTab';
import TimelineTab from './components/TimelineTab';
import Login from './components/Login';

// Mapeamento explícito de ícones
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, FileEdit, Vote, ScrollText, BarChart, Settings, Upload, Shield, Fingerprint, Activity, ClipboardList, Calendar, Briefcase, Sparkles, CalendarClock, MessageSquare: ClipboardList, BookOpen: FileEdit, Calculator: BarChart, Award: Shield
};

const IconRenderer = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent className={className} />;
};

const PortalCIPA: React.FC = () => {
  const { resetData, settings, isSaving, isLoading, session, signOut } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const allTabs = [
    { id: 'dashboard', label: 'Início', Component: Dashboard },
    { id: 'gestao', label: 'Colaboradores', Component: EmployeesTab },
    { id: 'inscricao', label: 'Candidaturas', Component: RegistrationTab },
    { id: 'votar', label: 'Votação', Component: VotingTab },
    { id: 'cedula', label: 'Cédulas', Component: BallotTab },
    { id: 'cronograma', label: 'Cronograma', Component: TimelineTab },
    { id: 'relatorio', label: 'Relatórios', Component: ReportTab },
    { id: 'layouts', label: 'Layouts', Component: SettingsTab },
    { id: 'ai_assistant', label: 'IA Consultiva', Component: AIAssistantTab },
    { id: 'upload', label: 'Importar', Component: UploadTab },
  ];

  const allowedUserTabs = ['inscricao', 'votar'];

  const availableTabs = settings.currentUserRole === 'admin' 
    ? allTabs 
    : allTabs.filter(t => allowedUserTabs.includes(t.id));

  const orderedTabs = settings.menuOrder
    .map(id => availableTabs.find(t => t.id === id))
    .filter(Boolean) as typeof allTabs;

  useEffect(() => {
    const isAllowed = availableTabs.some(t => t.id === activeTab);
    if (!isAllowed && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].id);
    }
  }, [settings.currentUserRole, activeTab, availableTabs]);

  const handleReset = () => {
    resetData();
    setShowResetConfirm(false);
    setActiveTab('dashboard');
  };

  const ActiveComponent = availableTabs.find(t => t.id === activeTab)?.Component || Dashboard;

  if (!session) return <Login />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <div className="text-center">
           <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Sincronizando Base de Dados</h2>
           <p className="text-xs text-slate-400 font-bold mt-1">Conectando ao Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 sm:px-12 py-4 no-print shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-sm overflow-hidden">
              {settings.logoBase64 ? (
                <img src={settings.logoBase64} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-slate-900" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">{settings.portalTitle}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                 <Building className="w-3 h-3 text-slate-400" />
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">{settings.portalSubtitle || settings.companyName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 mr-2 transition-all">
              {isSaving ? (
                <>
                  <CloudUpload className="w-3 h-3 text-blue-500 animate-bounce" />
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Salvando...</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                </>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3 pr-6 mr-6 border-r border-slate-100" title={`Logado como ${session.user.email}`}>
              <div className="text-right">
                <span className="text-xs font-black text-slate-900 block uppercase">{settings.currentUserRole === 'admin' ? 'Administrador' : 'Colaborador'}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[120px] block">{session.user.email}</span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors ${settings.currentUserRole === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {settings.currentUserRole === 'admin' ? 'AD' : 'CO'}
              </div>
            </div>
            
            {settings.currentUserRole === 'admin' && (
              <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-2 text-slate-400 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-all font-bold text-[10px] uppercase tracking-widest">
                <RefreshCw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Zerar</span>
              </button>
            )}

            <button onClick={signOut} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg transition-all font-bold text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200">
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 px-6 sm:px-12 no-print overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 scrollbar-hide">
          {orderedTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-5 text-xs font-black uppercase tracking-[0.1em] border-b-4 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-blue-700 text-blue-700 bg-blue-50/20' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              <IconRenderer name={settings.tabIcons[tab.id]} className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-300'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-12">
        <div className="max-w-full"><ActiveComponent /></div>
      </main>

      {showResetConfirm && settings.currentUserRole === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-popIn border-slate-200">
             <div className="flex items-start gap-4 mb-5">
               <div className="p-3 bg-red-50 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
               <div><h3 className="text-xl font-black uppercase text-red-600">Cuidado Crítico</h3><p className="text-xs font-black text-red-400 uppercase tracking-widest mt-1">Ação Irreversível</p></div>
             </div>
             <p className="text-slate-600 mb-8 leading-relaxed text-sm">A purga do sistema irá apagar <b>todos os colaboradores, votos e configurações</b> do mandato atual. Esta ação não pode ser desfeita.</p>
             <div className="flex gap-4">
               <button onClick={() => setShowResetConfirm(false)} className="flex-1 px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors">Abortar</button>
               <button onClick={handleReset} className="flex-1 px-6 py-4 rounded-xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">Confirmar Reset</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-popIn { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => <AppProvider><PortalCIPA /></AppProvider>;

export default App;