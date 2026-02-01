import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Registration, Vote, AppSettings, TimelineEvent } from './types';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

interface AppContextType {
  employees: Employee[];
  registrations: Registration[];
  votes: Vote[];
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  session: Session | null;
  signOut: () => Promise<void>;
  resetData: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Actions
  addEmployee: (emp: Employee) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  bulkImportEmployees: (emps: Employee[]) => Promise<void>;
  
  addRegistration: (reg: Registration) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
  
  castVote: (vote: Vote) => Promise<void>;
  
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const defaultTimelineEvents: TimelineEvent[] = [
  { id: crypto.randomUUID(), activity: 'Comunicação oficial com o sindicato', dateTime: '01/03/2023, 10:00', icon: 'MessageSquare', color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: crypto.randomUUID(), activity: 'Inscrições', dateTime: '06/03/2023 - 17/03/2023, 09:00-17:00', icon: 'FileEdit', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: crypto.randomUUID(), activity: 'Período de Votação', dateTime: '27/03/2023, 08:00 - 17:00', icon: 'Vote', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: crypto.randomUUID(), activity: 'Contagem dos votos', dateTime: '27/03/2023, 17:30', icon: 'Calculator', color: 'text-slate-600', bg: 'bg-slate-50' },
  { id: crypto.randomUUID(), activity: 'Treinamento da NR-5', dateTime: '06/03/2023 - 17/03/2023, 09:00-17:00', icon: 'BookOpen', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: crypto.randomUUID(), activity: 'Instalação e Posse da CIPA', dateTime: '10/04/2023, 14:00', icon: 'Award', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const defaultSettings: AppSettings = {
  companyName: 'Minha Empresa S.A.',
  portalTitle: 'Portal CIPA',
  portalSubtitle: 'Gestão de Eleições NR-5',
  documentTitle: 'Processo Eleitoral CIPA',
  mandate: '2024/2025',
  ballotsPerPage: 2,
  themeColor: '#1e40af',
  menuOrder: ['dashboard', 'gestao', 'inscricao', 'votar', 'cedula', 'cronograma', 'relatorio', 'layouts', 'ai_assistant', 'upload'],
  tabIcons: {
    dashboard: 'LayoutDashboard',
    gestao: 'Users',
    inscricao: 'FileEdit',
    votar: 'Vote',
    cedula: 'ScrollText',
    cronograma: 'CalendarClock',
    relatorio: 'BarChart',
    layouts: 'Settings',
    ai_assistant: 'Sparkles',
    upload: 'Upload'
  },
  votingScreenLogoBase64: '',
  votingScreenTitle: 'Entrar na Urna',
  votingScreenSubtitle: 'Identificação Obrigatória',
  timelineEvents: defaultTimelineEvents,
  currentUserRole: 'user',
  reportConfig: {
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
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // --- Auth & Role Logic ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) determineRole(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) determineRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const determineRole = async (currentSession: Session) => {
    if (!currentSession?.user?.email) {
      setSettings(prev => ({ ...prev, currentUserRole: 'user' }));
      return;
    }
    
    try {
      const { data } = await supabase
        .from('app_admins')
        .select('email')
        .eq('email', currentSession.user.email.toLowerCase())
        .maybeSingle();
      
      setSettings(prev => ({ ...prev, currentUserRole: data ? 'admin' : 'user' }));
    } catch (err) {
      // Falha silenciosa ou log de debug
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSettings(prev => ({ ...prev, currentUserRole: 'user' }));
  };

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [settingsRes, empRes, regRes, voteRes] = await Promise.all([
        supabase.from('app_settings').select('data').eq('id', 1).single(),
        supabase.from('employees').select('*'),
        supabase.from('registrations').select('*'),
        supabase.from('votes').select('*')
      ]);

      if (settingsRes.data?.data) {
        setSettings(prev => ({
          ...defaultSettings,
          ...settingsRes.data.data,
          currentUserRole: session ? prev.currentUserRole : 'user',
          // Garantir que reportConfig exista mesmo se o dado salvo for antigo
          reportConfig: {
             ...defaultSettings.reportConfig,
             ...(settingsRes.data.data.reportConfig || {})
          }
        }));
      }

      if (empRes.data) {
        setEmployees(empRes.data.map(e => ({
          id: e.id,
          matricula: e.matricula,
          nome: e.nome,
          setor: e.setor,
          cargo: e.cargo,
          email: e.email,
          status: e.status,
          isRestricted: e.is_restricted,
          createdAt: e.created_at
        })));
      }

      if (regRes.data) {
        setRegistrations(regRes.data.map(r => ({
          id: r.id,
          employeeId: r.employee_id,
          status: r.status,
          membershipType: r.membership_type,
          createdAt: r.created_at
        })));
      }

      if (voteRes.data) {
        setVotes(voteRes.data.map(v => ({
          id: v.id,
          candidateId: v.candidate_id,
          voterMatricula: v.voter_matricula,
          timestamp: v.timestamp
        })));
      }

    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || 'Falha ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Actions ---

  const addEmployee = async (emp: Employee) => {
    setIsSaving(true);
    try {
      const dbEmp = {
        id: emp.id,
        matricula: emp.matricula,
        nome: emp.nome,
        setor: emp.setor,
        cargo: emp.cargo,
        email: emp.email,
        status: emp.status,
        is_restricted: emp.isRestricted,
        created_at: emp.createdAt
      };
      
      const { error } = await supabase.from('employees').insert(dbEmp);
      if (error) throw error;
      setEmployees(prev => [emp, ...prev]);
    } finally {
      setIsSaving(false);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    setIsSaving(true);
    try {
      const dbUpdates: any = { ...updates };
      if (updates.isRestricted !== undefined) dbUpdates.is_restricted = updates.isRestricted;
      if (updates.createdAt) dbUpdates.created_at = updates.createdAt;
      delete dbUpdates.isRestricted;
      delete dbUpdates.createdAt;

      const { error } = await supabase.from('employees').update(dbUpdates).eq('id', id);
      if (error) throw error;

      setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      
      setEmployees(prev => prev.filter(e => e.id !== id));
      setRegistrations(prev => prev.filter(r => r.employeeId !== id));
      setVotes(prev => prev.filter(v => v.candidateId !== id));
    } finally {
      setIsSaving(false);
    }
  };

  const bulkImportEmployees = async (emps: Employee[]) => {
    setIsSaving(true);
    try {
      // Chunking para evitar erro "Failed to fetch" (payload muito grande)
      const BATCH_SIZE = 50; 
      const batches = [];
      for (let i = 0; i < emps.length; i += BATCH_SIZE) {
        batches.push(emps.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        // 1. Busca IDs existentes para o lote atual
        const matriculas = batch.map(e => e.matricula);
        
        const { data: existingData, error: fetchError } = await supabase
          .from('employees')
          .select('id, matricula')
          .in('matricula', matriculas);
          
        if (fetchError) throw fetchError;

        const existingMap = new Map<string, string>();
        if (existingData) {
          existingData.forEach((row: any) => {
            existingMap.set(String(row.matricula).trim(), row.id);
          });
        }

        // 2. Prepara o payload do upsert
        const dbEmps = batch.map(e => {
          const matchId = existingMap.get(String(e.matricula).trim());
          
          // Sempre enviamos um ID.
          // Se existe no banco (matchId), usamos ele para fazer UPDATE.
          // Se não existe, usamos o e.id (UUID gerado no frontend) para fazer INSERT.
          return {
            id: matchId || e.id, 
            matricula: e.matricula,
            nome: e.nome,
            setor: e.setor,
            cargo: e.cargo,
            email: e.email,
            status: e.status,
            is_restricted: e.isRestricted,
            created_at: e.createdAt
          };
        });

        // 3. Executa o upsert
        const { error } = await supabase
          .from('employees')
          .upsert(dbEmps);

        if (error) throw error;
      }
      
      // 4. Atualiza o estado local
      setEmployees(prev => {
         const newMap = new Map(prev.map(e => [e.matricula, e]));
         emps.forEach((d) => {
           // Atualiza ou adiciona ao mapa local
           newMap.set(d.matricula, d);
         });
         return Array.from(newMap.values());
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addRegistration = async (reg: Registration) => {
    setIsSaving(true);
    try {
      const dbReg = {
        id: reg.id,
        employee_id: reg.employeeId,
        status: reg.status,
        membership_type: reg.membershipType,
        created_at: reg.createdAt
      };
      const { error } = await supabase.from('registrations').insert(dbReg);
      if (error) throw error;
      setRegistrations(prev => [reg, ...prev]);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRegistration = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('registrations').delete().eq('id', id);
      if (error) throw error;
      setRegistrations(prev => prev.filter(r => r.id !== id));
      setVotes(prev => prev.filter(v => v.candidateId !== id));
    } finally {
      setIsSaving(false);
    }
  };

  const castVote = async (vote: Vote) => {
    setIsSaving(true);
    try {
      const dbVote = {
        id: vote.id,
        candidate_id: vote.candidateId,
        voter_matricula: vote.voterMatricula,
        timestamp: vote.timestamp
      };
      const { error } = await supabase.from('votes').insert(dbVote);
      if (error) throw error;
      setVotes(prev => [...prev, vote]);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setIsSaving(true);
    try {
      const updated = { ...settings, ...newSettings };
      const { error } = await supabase.from('app_settings').upsert({ id: 1, data: updated });
      if (error) throw error;
      setSettings(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const resetData = async () => {
    setIsSaving(true);
    try {
      await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      setEmployees([]);
      setRegistrations([]);
      setVotes([]);
      const resetSettings = {
        ...settings,
        mandate: 'Novo Mandato',
        timelineEvents: defaultTimelineEvents
      };
      await updateSettings(resetSettings);
    } catch (e) {
      console.error("Failed to clear database:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppContext.Provider value={{
      employees, registrations, votes, settings,
      isLoading, isSaving, error, session, signOut, resetData, refreshData: fetchData,
      addEmployee, updateEmployee, deleteEmployee, bulkImportEmployees,
      addRegistration, deleteRegistration,
      castVote,
      updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};