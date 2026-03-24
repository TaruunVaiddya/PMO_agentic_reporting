export type ReportStatus = 'on-track' | 'alert' | 'off-track' | 'completed' | 'not-tracked';

export interface StatusIndicator {
  dependency: ReportStatus;
  issues: ReportStatus;
  resource: ReportStatus;
  benefits: ReportStatus;
  risks: ReportStatus;
  budget: ReportStatus;
  scope: ReportStatus;
  schedule: ReportStatus;
}

export interface Milestone {
  name: string;
  priority: string;
  dueDate: string;
  currentDueDate: string;
  status: string;
}

export interface Risk {
  id: string;
  name: string;
  actualRisk: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXTREME' | 'Not Rated';
  treatment: string;
  residualRisk: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXTREME' | 'Not Rated';
}

export interface Issue {
  id: string;
  description: string;
  type: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  resolution: string;
  status: 'Open' | 'Closed' | 'In Progress';
}

export interface EndProduct {
  name: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: string;
  completion: number;
}

export interface FinancialData {
  capex: { baseline: string; forecast: string; forecastVariance: string; ytdBaseline: string; ytdActual: string; actualVariance: string };
  opex: { baseline: string; forecast: string; forecastVariance: string; ytdBaseline: string; ytdActual: string; actualVariance: string };
  total: { baseline: string; forecast: string; forecastVariance: string; ytdBaseline: string; ytdActual: string; actualVariance: string };
}

export interface PSRReportData {
  projectName: string;
  reportingPeriod: string;
  baselineStart: string;
  baselineEnd: string;
  reportDate: string;
  projectManager: string;
  projectDirector: string;
  projectDeliveryFunction: string;
  programManager: string;
  projectState: string;
  overallStatus: ReportStatus;
  overallStatusSummary: string;
  projectStatus: StatusIndicator;
  projectStatusComments: Partial<Record<keyof StatusIndicator, string>>;
  financial: FinancialData;
  keyAchievements: string;
  plannedActivities: string;
  milestones: Milestone[];
  endProducts: EndProduct[];
  managementProducts: EndProduct[];
  risks: Risk[];
  issues: Issue[];
  projectBackground: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isProcessing?: boolean;
}

export type ConversationStage =
  | 'welcome'
  | 'project_intro'
  | 'memory_dump'
  | 'processing'
  | 'followup_overall_status'
  | 'followup_risks'
  | 'followup_budget'
  | 'followup_schedule'
  | 'followup_milestones'
  | 'followup_next_steps'
  | 'complete';

export interface Project {
  id: string;
  name: string;
  currentReport: PSRReportData;
  pastReports: Array<{ label: string; data: PSRReportData }>;
}
