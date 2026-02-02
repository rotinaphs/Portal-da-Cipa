
export type Status = 'active' | 'inactive' | 'pending';
export type MembershipType = 'primary' | 'alternate';

export interface Employee {
  id: string;
  matricula: string;
  nome: string;
  setor: string;
  cargo: string;
  email: string;
  status: Status;
  isRestricted: boolean;
  createdAt: string;
}

export interface Registration {
  id: string;
  employeeId: string;
  status: 'approved' | 'rejected' | 'pending';
  membershipType: MembershipType; // Novo campo técnico
  createdAt: string;
}

export interface Vote {
  id: string;
  candidateId: string;
  voterMatricula: string;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  activity: string;
  dateTime: string;
  icon: string;
  color: string;
  bg: string;
}

export interface MeetingData {
  number: string;
  date: string;
  startTime: string;
  endTime: string;
  local: string;
  membersPresent: string;
  agenda: string;
  deliberations: string;
  extraordinaryReason: string;
  attendanceRows?: number; 
  signatoriesCount?: number; // Novo controle de assinaturas
}

export interface ReportConfig {
  electedCount: number;
  meetingData: MeetingData;
}

export interface AppSettings {
  companyName: string;
  portalTitle: string;
  portalSubtitle: string;
  documentTitle: string; 
  logoBase64?: string;
  mandate: string;
  ballotsPerPage: 1 | 2 | 3 | 4;
  themeColor: string;
  menuOrder: string[]; 
  tabIcons: Record<string, string>;
  votingScreenLogoBase64?: string;
  votingScreenTitle: string;
  votingScreenSubtitle: string;
  timelineEvents: TimelineEvent[];
  currentUserRole: 'admin' | 'user';
  reportConfig?: ReportConfig; 
}

export interface DashboardStats {
  totalEmployees: number;
  totalRegistrations: number;
  approvedCandidates: number;
  totalVotes: number;
  votesPercentage: number;
}
