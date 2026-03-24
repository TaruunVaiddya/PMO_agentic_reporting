import type { PSRReportData } from '../types';

export type ReportingStatus = 'notified' | 'clicked' | 'submitted' | 'approved' | 'sent';

export interface DashboardProject {
  id: string;
  name: string;
  projectManager: string;
  projectDirector: string;
  businessUnit: string;
  program: string;
  reportingStatus: ReportingStatus;
  notifiedAt: string;
  clickedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  sentAt?: string;
  overallStatus?: 'on-track' | 'alert' | 'off-track';
  submittedReport?: PSRReportData;
}

function makeReport(
  projectName: string,
  projectManager: string,
  projectDirector: string,
  deliveryFunction: string,
  overallStatus: 'on-track' | 'alert' | 'off-track',
  summary: string,
  reportDate: string,
  statusOverrides: Partial<PSRReportData['projectStatus']> = {},
  risks: PSRReportData['risks'] = [],
  milestones: PSRReportData['milestones'] = [],
  financial: Partial<PSRReportData['financial']> = {},
  keyAchievements = '',
  plannedActivities = '',
): PSRReportData {
  return {
    projectName,
    reportingPeriod: '01/01/2026 to 31/03/2026',
    baselineStart: '01/01/2024',
    baselineEnd: '31/12/2027',
    reportDate,
    projectManager,
    projectDirector,
    projectDeliveryFunction: deliveryFunction,
    programManager: '',
    projectState: 'Active',
    overallStatus,
    overallStatusSummary: summary,
    projectStatus: {
      dependency: 'on-track',
      issues: 'on-track',
      resource: 'on-track',
      benefits: 'on-track',
      risks: risks.length > 0 ? 'alert' : 'on-track',
      budget: 'on-track',
      scope: 'on-track',
      schedule: overallStatus === 'alert' ? 'alert' : 'on-track',
      ...statusOverrides,
    },
    projectStatusComments: {},
    financial: {
      capex: { baseline: '200.00 K', forecast: '197.00 K', forecastVariance: '+3.00 K (1.50%)', ytdBaseline: '50.00 K', ytdActual: '49.20 K', actualVariance: '+0.80 K' },
      opex: { baseline: '50.00 K', forecast: '49.00 K', forecastVariance: '+1.00 K (2.00%)', ytdBaseline: '12.50 K', ytdActual: '12.10 K', actualVariance: '+0.40 K' },
      total: { baseline: '250.00 K', forecast: '246.00 K', forecastVariance: '+4.00 K (1.60%)', ytdBaseline: '62.50 K', ytdActual: '61.30 K', actualVariance: '+1.20 K' },
      ...financial,
    },
    keyAchievements: keyAchievements || 'Q1 2026 objectives delivered on schedule with key milestones met.',
    plannedActivities: plannedActivities || 'Continue Q2 2026 delivery programme. Finalise outstanding governance approvals.',
    milestones,
    endProducts: [],
    managementProducts: [],
    risks,
    issues: [],
    projectBackground: `${projectName} is a strategic programme delivering key outcomes for the organisation.`,
  };
}

const ESS_REPORT = makeReport(
  'Enterprise Security Services (ESS)',
  'Marcus Chen',
  'David Kim',
  'IT Operations',
  'on-track',
  'Phase 1 security framework fully deployed across all endpoints. Zero-trust architecture implementation 75% complete. Penetration testing cleared with all critical findings resolved. Phase 2 go-live achieved 28 Feb 26 one week ahead of schedule.',
  '22/03/2026',
  {},
  [{ id: 'R101', name: 'Third-party vendor SLA non-compliance', actualRisk: 'MEDIUM', treatment: 'SLA review initiated; escalation clause invoked. Fortnightly performance reviews mandated.', residualRisk: 'LOW' }],
  [
    { name: 'Zero-Trust Architecture Phase 1', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '31/01/2026', status: 'Completed' },
    { name: 'Phase 2 Go-Live', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Completed' },
    { name: 'SOC Integration Milestone', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'Phase 1 security framework deployed. Pen-test completed with zero critical findings. Phase 2 Go-Live delivered 28 Feb 26 ahead of schedule. 1,400 endpoints fully secured under zero-trust policy.',
  'Commence Zero-Trust Phase 2 — cloud workload segmentation. Complete SOC integration. Vendor SLA review.',
);

const TRADE_GATEWAY_REPORT = makeReport(
  'Trade Gateway Platform',
  'Aisha Khan',
  'Peter Nguyen',
  'Trade & Investment',
  'alert',
  'Digital trade portal Phase 2 live with 1,240 registered exporters. Integration with partner agencies progressing at 60%. Budget on track. Schedule under pressure due to delayed API specifications from Customs — recovery plan activated.',
  '21/03/2026',
  { schedule: 'alert', dependency: 'alert' },
  [{ id: 'R201', name: 'API specification delivery delay from Customs', actualRisk: 'MEDIUM', treatment: 'Escalation to Deputy Secretary level. Manual workaround designed for interim go-live.', residualRisk: 'MEDIUM' }],
  [
    { name: 'Trade Portal Phase 2 Go-Live', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '15/03/2026', status: 'Delayed' },
    { name: 'Customs API Integration', priority: 'HP', dueDate: '31/03/2026', currentDueDate: '30/04/2026', status: 'Delayed' },
    { name: 'Exporter Onboarding — 1,000 registrations', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  '1,240 exporters registered on Trade Gateway Platform. Phase 2 portal launched with self-service certification module. Three agency integrations complete. Exporter satisfaction score 4.2/5.',
  'Resolve Customs API integration. Launch Phase 3 — advanced analytics. Complete remaining 4 agency integrations.',
);

const DWT_REPORT = makeReport(
  'Digital Workplace Transformation',
  'Tom Reid',
  'Sandra Chu',
  'Digital Transformation',
  'on-track',
  'Phase 2 M365 rollout completed across all 3 divisions ahead of schedule. 850 staff migrated to new platform with 92% adoption rate. Change management programme on track. Phase 3 scope confirmed and funding approved.',
  '19/03/2026',
  {},
  [{ id: 'R301', name: 'Phase 3 budget transfer pending Finance approval', actualRisk: 'LOW', treatment: 'Business case submitted to Finance committee. Approval expected by 15 Apr 26.', residualRisk: 'LOW' }],
  [
    { name: 'M365 Rollout — Division A', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '31/01/2026', status: 'Completed' },
    { name: 'M365 Rollout — Division B & C', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '24/02/2026', status: 'Completed' },
    { name: 'Phase 3 Scope Sign-off', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'Phase 2 M365 rollout completed 4 days ahead of schedule. 850 staff migrated. 92% adoption rate achieved within 3 weeks. Change management training delivered to all 12 functional groups. Phase 3 scope signed off by steering committee.',
  'Commence Phase 3 — Teams telephony rollout. Initiate SharePoint migration. Begin data governance uplift integration.',
);

const INFRA_MOD_REPORT = makeReport(
  'Infrastructure Modernisation',
  'Priya Patel',
  'Brendan Walsh',
  'Infrastructure',
  'on-track',
  'Network infrastructure uplift completed for 4 major sites. Data centre Phase 1 commissioned 28 Feb 26. All service level KPIs met. Q2 Phase 2 scoping finalised with vendor selection complete.',
  '18/03/2026',
  {},
  [{ id: 'R401', name: 'Site access road completion blocking Phase 2 works', actualRisk: 'MEDIUM', treatment: 'Contract award to Roads Authority pending. Interim access arrangement confirmed.', residualRisk: 'LOW' }],
  [
    { name: 'Site Network Uplift — 4 Sites', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Completed' },
    { name: 'Data Centre Phase 1 Commission', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Completed' },
    { name: 'Phase 2 Vendor Selection', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'Network uplift delivered for all 4 sites. Data centre commissioned on schedule. 99.97% uptime recorded in Q1. Phase 2 vendor selection finalised — contract award 01 Apr 26.',
  'Commence Phase 2 — data centre expansion. Award construction contract. Finalise access road arrangements.',
);

const DATA_GOV_REPORT = makeReport(
  'Data Governance Framework',
  'James Liu',
  'Nicole Torres',
  'Corporate Services',
  'alert',
  'Data governance policy framework endorsed by data council. Classification tagging tool deployment delayed 3 weeks due to integration complexity with legacy systems. Data steward training completed for all 6 divisions. Legal review of data sharing MOU in progress.',
  '21/03/2026',
  { schedule: 'alert', issues: 'alert' },
  [{ id: 'R305', name: 'Policy implementation blocked pending legal MOU review', actualRisk: 'HIGH', treatment: 'Legal review commissioned — outcome expected 15 Apr 26. Partial implementation approved in interim.', residualRisk: 'MEDIUM' }],
  [
    { name: 'Governance Policy Framework Endorsement', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '31/01/2026', status: 'Completed' },
    { name: 'Data Classification Tool Deployment', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '21/03/2026', status: 'Delayed' },
    { name: 'Data Steward Training — All Divisions', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'Policy framework endorsed by data council. 180 data stewards trained across 6 divisions. Data catalogue Phase 1 complete with 2,400 assets registered. Classification tool delayed pending legal clearance.',
  'Resolve MOU legal review. Deploy classification tagging tool. Launch data quality dashboard.',
);

const CYBER_REPORT = makeReport(
  'Cyber Resilience Program',
  'Nathan Brooks',
  'Leila Ahmed',
  'IT Operations',
  'on-track',
  'SOC 2 Type II certification achieved. Incident response playbooks updated and successfully tested in tabletop exercise. Security awareness training completion rate at 94%. Phase 3 threat intelligence programme commencing Q2 2026.',
  '20/03/2026',
  {},
  [],
  [
    { name: 'SOC 2 Type II Certification', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '31/01/2026', status: 'Completed' },
    { name: 'Incident Response Playbook Update', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Completed' },
    { name: 'Security Awareness Training — 94% target', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'SOC 2 Type II achieved. All 47 incident response playbooks updated and tested. 94% staff training completion rate — highest in agency history. Threat intelligence platform RFP shortlisted to 3 vendors.',
  'Launch Phase 3 threat intelligence programme. Finalise vendor selection for SIEM uplift. Conduct red team exercise.',
);

const HR_SYSTEMS_REPORT = makeReport(
  'HR Systems Upgrade',
  'Wei Zhang',
  'Carolyn Marsh',
  'Corporate Services',
  'on-track',
  'Oracle HCM Phase 1 go-live achieved 01 Mar 26 with 98% data migration accuracy. Payroll parallel run completed and signed off. Phase 2 scope approved by executive sponsor. Integration with finance modules in planning.',
  '14/03/2026',
  {},
  [{ id: 'R501', name: 'Phase 2 system integration PO not yet raised', actualRisk: 'LOW', treatment: 'Finance approval submission lodged. PO expected by 08 Apr 26.', residualRisk: 'LOW' }],
  [
    { name: 'Oracle HCM Phase 1 Go-Live', priority: 'HP', dueDate: '01/03/2026', currentDueDate: '01/03/2026', status: 'Completed' },
    { name: 'Payroll Parallel Run Sign-off', priority: 'HP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
    { name: 'Phase 2 Scope Approval', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'Oracle HCM Phase 1 delivered on schedule. 98% data migration accuracy. Payroll parallel run signed off with zero variances. 1,800 staff records migrated. Self-service portal live with 78% adoption in first 2 weeks.',
  'Raise PO for Phase 2 integration. Commence finance module integration. Begin Phase 2 change management activities.',
);

const SMART_BUILDINGS_REPORT = makeReport(
  'Smart Buildings Initiative',
  'Oliver Grant',
  'Fiona McDermott',
  'Infrastructure',
  'on-track',
  'IoT sensor network commissioned across 6 buildings. Energy usage reduction of 18% against baseline recorded. Building management system integration Phase 1 complete. Facilities management team fully onboarded and operational.',
  '15/03/2026',
  {},
  [],
  [
    { name: 'IoT Sensor Network — 6 Buildings', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Completed' },
    { name: 'BMS Integration Phase 1', priority: 'HP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
    { name: 'Energy Reduction Target — 15%', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'IoT network live across 6 buildings with 842 sensors deployed. 18% energy reduction achieved against 15% target. BMS integration Phase 1 complete. Facilities team onboarded and managing via new platform.',
  'Extend IoT network to remaining 4 buildings. Commence Phase 2 — predictive maintenance integration.',
);

const BIOSEC_INTEL_REPORT = makeReport(
  'Biosecurity Intelligence',
  'Rachel Kim',
  'Ashraf Clark',
  'Biosecurity',
  'on-track',
  'Intelligence platform v2 live across all border processing units. 14,000 risk assessments processed in Q1. Integration with all partner agency data feeds complete. Q2 expansion to air cargo screening approved by governance board.',
  '17/03/2026',
  {},
  [],
  [
    { name: 'Platform v2 Go-Live — Border Units', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '31/01/2026', status: 'Completed' },
    { name: 'Agency Data Feed Integration', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Completed' },
    { name: 'Q2 Air Cargo Scope Approval', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Completed' },
  ],
  {},
  'Platform v2 operational across all 8 border units. 14,000 risk assessments processed — 23% increase on Q4 2025. Partner agency data feeds fully integrated. 98.9% platform uptime recorded.',
  'Expand to air cargo screening. Integrate real-time vessel manifest data. Commence Phase 3 predictive analytics scoping.',
);

export const BASE_PMO_PROJECTS: DashboardProject[] = [
  {
    id: 'proj-1',
    name: 'New Global Initiative',
    projectManager: 'Sarah Mitchell',
    projectDirector: 'Ashraf Clark',
    businessUnit: 'Biosecurity',
    program: 'Trade & Growth Portfolio',
    reportingStatus: 'clicked',
    notifiedAt: '10/03/2026',
    clickedAt: '11/03/2026',
  },
  {
    id: 'proj-2',
    name: 'Enterprise Security Services (ESS)',
    projectManager: 'Marcus Chen',
    projectDirector: 'David Kim',
    businessUnit: 'IT Operations',
    program: 'Digital Uplift Portfolio',
    reportingStatus: 'submitted',
    notifiedAt: '10/03/2026',
    clickedAt: '10/03/2026',
    submittedAt: '22/03/2026',
    overallStatus: 'on-track',
    submittedReport: ESS_REPORT,
  },
  {
    id: 'proj-3',
    name: 'Trade Gateway Platform',
    projectManager: 'Aisha Khan',
    projectDirector: 'Peter Nguyen',
    businessUnit: 'Trade & Investment',
    program: 'Trade & Growth Portfolio',
    reportingStatus: 'submitted',
    notifiedAt: '10/03/2026',
    clickedAt: '11/03/2026',
    submittedAt: '21/03/2026',
    overallStatus: 'alert',
    submittedReport: TRADE_GATEWAY_REPORT,
  },
  {
    id: 'proj-4',
    name: 'Digital Workplace Transformation',
    projectManager: 'Tom Reid',
    projectDirector: 'Sandra Chu',
    businessUnit: 'Digital Transformation',
    program: 'Digital Uplift Portfolio',
    reportingStatus: 'approved',
    notifiedAt: '10/03/2026',
    clickedAt: '11/03/2026',
    submittedAt: '19/03/2026',
    approvedAt: '23/03/2026',
    overallStatus: 'on-track',
    submittedReport: DWT_REPORT,
  },
  {
    id: 'proj-5',
    name: 'Infrastructure Modernisation',
    projectManager: 'Priya Patel',
    projectDirector: 'Brendan Walsh',
    businessUnit: 'Infrastructure',
    program: 'Infrastructure Delivery',
    reportingStatus: 'approved',
    notifiedAt: '10/03/2026',
    clickedAt: '11/03/2026',
    submittedAt: '18/03/2026',
    approvedAt: '22/03/2026',
    overallStatus: 'on-track',
    submittedReport: INFRA_MOD_REPORT,
  },
  {
    id: 'proj-6',
    name: 'Data Governance Framework',
    projectManager: 'James Liu',
    projectDirector: 'Nicole Torres',
    businessUnit: 'Corporate Services',
    program: 'Digital Uplift Portfolio',
    reportingStatus: 'submitted',
    notifiedAt: '10/03/2026',
    clickedAt: '12/03/2026',
    submittedAt: '21/03/2026',
    overallStatus: 'alert',
    submittedReport: DATA_GOV_REPORT,
  },
  {
    id: 'proj-7',
    name: 'Cyber Resilience Program',
    projectManager: 'Nathan Brooks',
    projectDirector: 'Leila Ahmed',
    businessUnit: 'IT Operations',
    program: 'Digital Uplift Portfolio',
    reportingStatus: 'submitted',
    notifiedAt: '10/03/2026',
    clickedAt: '10/03/2026',
    submittedAt: '20/03/2026',
    overallStatus: 'on-track',
    submittedReport: CYBER_REPORT,
  },
  {
    id: 'proj-8',
    name: 'Export Facilitation Hub',
    projectManager: 'Elena Santos',
    projectDirector: 'Peter Nguyen',
    businessUnit: 'Trade & Investment',
    program: 'Trade & Growth Portfolio',
    reportingStatus: 'notified',
    notifiedAt: '10/03/2026',
  },
  {
    id: 'proj-9',
    name: 'HR Systems Upgrade',
    projectManager: 'Wei Zhang',
    projectDirector: 'Carolyn Marsh',
    businessUnit: 'Corporate Services',
    program: 'Corporate Excellence',
    reportingStatus: 'sent',
    notifiedAt: '10/03/2026',
    clickedAt: '10/03/2026',
    submittedAt: '14/03/2026',
    approvedAt: '18/03/2026',
    sentAt: '20/03/2026',
    overallStatus: 'on-track',
    submittedReport: HR_SYSTEMS_REPORT,
  },
  {
    id: 'proj-10',
    name: 'Smart Buildings Initiative',
    projectManager: 'Oliver Grant',
    projectDirector: 'Fiona McDermott',
    businessUnit: 'Infrastructure',
    program: 'Infrastructure Delivery',
    reportingStatus: 'sent',
    notifiedAt: '10/03/2026',
    clickedAt: '11/03/2026',
    submittedAt: '15/03/2026',
    approvedAt: '19/03/2026',
    sentAt: '21/03/2026',
    overallStatus: 'on-track',
    submittedReport: SMART_BUILDINGS_REPORT,
  },
  {
    id: 'proj-11',
    name: 'Biosecurity Intelligence',
    projectManager: 'Rachel Kim',
    projectDirector: 'Ashraf Clark',
    businessUnit: 'Biosecurity',
    program: 'Trade & Growth Portfolio',
    reportingStatus: 'approved',
    notifiedAt: '10/03/2026',
    clickedAt: '11/03/2026',
    submittedAt: '17/03/2026',
    approvedAt: '21/03/2026',
    overallStatus: 'on-track',
    submittedReport: BIOSEC_INTEL_REPORT,
  },
];

export function getPMOProjects(ngiSubmitted: boolean, ngiReportData?: PSRReportData): DashboardProject[] {
  return BASE_PMO_PROJECTS.map(p => {
    if (p.id === 'proj-1' && ngiSubmitted) {
      return {
        ...p,
        reportingStatus: 'submitted' as ReportingStatus,
        submittedAt: '24/03/2026',
        overallStatus: 'on-track' as const,
        submittedReport: ngiReportData || undefined,
      };
    }
    return p;
  });
}

export interface PipelineStats {
  notified: number;
  clicked: number;
  submitted: number;
  approved: number;
  sent: number;
  total: number;
}

export function getPipelineStats(projects: DashboardProject[]): PipelineStats {
  const total = projects.length;
  const stages: Record<ReportingStatus, number> = { notified: 0, clicked: 0, submitted: 0, approved: 0, sent: 0 };
  for (const p of projects) stages[p.reportingStatus]++;
  const notified = total;
  const clicked = total - stages.notified;
  const submitted = clicked - stages.clicked;
  const approved = submitted - stages.submitted;
  const sent = stages.sent;
  return { notified, clicked, submitted, approved, sent, total };
}

export const EXEC_SUMMARY_ROWS = [
  {
    project: 'Digital Workplace Transformation',
    summary: 'Phase 2 M365 rollout completed across all three divisions ahead of schedule. 850 staff migrated with 92% adoption rate. Change management programme on track. Q2 Phase 3 scope confirmed and funding approved.',
    risks: ['Pending Finance committee approval for Phase 3 budget transfer by 15 Apr 26 — approval submission lodged.'],
  },
  {
    project: 'Infrastructure Modernisation',
    summary: 'Network infrastructure uplift completed for four major sites on schedule. Data centre Phase 1 commissioned 28 Feb 26. All service KPIs met. Q2 Phase 2 scoping complete with vendor selection finalised.',
    risks: ['Site access road completion awaiting contract award from Roads Authority — expected 30 Apr 26.'],
  },
  {
    project: 'Biosecurity Intelligence',
    summary: 'Intelligence platform v2 live across all border processing units. 14,000 risk assessments processed in Q1 — 23% increase on Q4 2025. Agency data feed integrations complete. Q2 expansion to air cargo screening approved.',
    risks: [],
  },
  {
    project: 'HR Systems Upgrade',
    summary: 'Oracle HCM Phase 1 go-live achieved 01 Mar 26 with 98% data migration accuracy. Payroll parallel run cleared with zero variances. 1,800 staff records migrated. Phase 2 scope approved by executive sponsor.',
    risks: ['Awaiting PO for Phase 2 system integration with legacy finance modules — Finance approval submission lodged.'],
  },
  {
    project: 'Smart Buildings Initiative',
    summary: 'IoT sensor network commissioned across six buildings with 842 sensors deployed. Energy usage reduction of 18% achieved against 15% target. Building management system integration Phase 1 complete. Facilities team fully onboarded.',
    risks: [],
  },
];

export const NGI_EXEC_ROW = {
  project: 'New Global Initiative',
  summary: 'Phase 4 regulatory clearance received 31 Jan 26. Advanced Market Intelligence Platform launched 28 Feb 26. Partner Cohort 3 onboarding underway with 12 companies enrolled. Budget tracking within approved thresholds.',
  risks: ['Dependence on partner readiness — dedicated partner support programme activated. Residual risk LOW.'],
};
