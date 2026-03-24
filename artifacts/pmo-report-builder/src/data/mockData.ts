import type { PSRReportData, Project } from '../types';

const q3_2025: PSRReportData = {
  projectName: 'New Global Initiative',
  reportingPeriod: '01/07/2025 to 30/09/2025',
  baselineStart: '01/11/2022',
  baselineEnd: '01/07/2028',
  reportDate: '05/10/2025',
  projectManager: 'Sarah Mitchell',
  projectDirector: 'Ashraf Clark',
  projectDeliveryFunction: 'Biosecurity',
  programManager: '',
  projectState: 'Active',
  overallStatus: 'on-track',
  overallStatusSummary: 'Project remains on track. Phase 2 market entry commenced successfully with 3 new partnerships signed. Budget remains within approved thresholds. One risk escalated from MEDIUM to HIGH related to regulatory approval timelines.',
  projectStatus: {
    dependency: 'on-track',
    issues: 'on-track',
    resource: 'on-track',
    benefits: 'on-track',
    risks: 'alert',
    budget: 'on-track',
    scope: 'on-track',
    schedule: 'on-track',
  },
  projectStatusComments: {
    risks: 'Regulatory approval timeline extended by 6 weeks — mitigation plan in place.',
    benefits: 'First benefits realisation milestone achieved — 3 companies successfully entered target markets.',
  },
  financial: {
    capex: { baseline: '120.00 K', forecast: '118.00 K', forecastVariance: '+2.00 K (1.67%)', ytdBaseline: '60.00 K', ytdActual: '58.50 K', actualVariance: '+1.50 K' },
    opex: { baseline: '30.00 K', forecast: '29.00 K', forecastVariance: '+1.00 K (3.33%)', ytdBaseline: '15.00 K', ytdActual: '14.20 K', actualVariance: '+0.80 K' },
    total: { baseline: '150.00 K', forecast: '147.00 K', forecastVariance: '+3.00 K (2.00%)', ytdBaseline: '75.00 K', ytdActual: '72.70 K', actualVariance: '+2.30 K' },
  },
  keyAchievements: 'Phase 2 market entry commenced. 3 new international partnerships signed in priority markets. Trade mission to Southeast Asia completed with 12 business matching sessions conducted. Phase 1 Post-implementation review completed with positive outcomes.',
  plannedActivities: 'Begin Phase 3 scoping — advanced market intelligence program. Finalise regulatory approval documentation. Conduct Q4 stakeholder review sessions. Onboard 2 additional partner organisations.',
  milestones: [
    { name: 'Phase 2 Market Entry', priority: 'HP', dueDate: '01/07/2025', currentDueDate: '01/07/2025', status: 'Completed' },
    { name: 'Southeast Asia Trade Mission', priority: 'MP', dueDate: '15/08/2025', currentDueDate: '15/08/2025', status: 'Completed' },
    { name: 'Phase 1 PIR', priority: 'LP', dueDate: '30/09/2025', currentDueDate: '30/09/2025', status: 'Completed' },
    { name: 'Phase 3 Scoping Sign-off', priority: 'HP', dueDate: '31/10/2025', currentDueDate: '31/10/2025', status: 'Pending' },
  ],
  endProducts: [
    { name: 'Connecting with People Training', owner: 'Richelle Hilton', startDate: '01/01/2023', endDate: '28/06/2023', status: 'Completed', completion: 100 },
    { name: 'Market Intelligence Report v2', owner: 'James Tran', startDate: '15/06/2025', endDate: '30/09/2025', status: 'Completed', completion: 100 },
  ],
  managementProducts: [
    { name: 'Phase 3 Business Case', owner: 'Canning Santos', startDate: '01/09/2025', endDate: '31/10/2025', status: 'In Progress', completion: 45 },
  ],
  risks: [
    { id: 'R613', name: 'Regulatory approval timeline extension', actualRisk: 'HIGH', treatment: 'Engaged regulatory consultants; fast-track application submitted.', residualRisk: 'MEDIUM' },
    { id: 'R822', name: 'Dependence on partner readiness', actualRisk: 'MEDIUM', treatment: 'Partner readiness assessment completed; dedicated support assigned.', residualRisk: 'LOW' },
    { id: 'R835', name: 'Insufficient market intelligence', actualRisk: 'LOW', treatment: 'Market intelligence platform subscribed; quarterly report commissioned.', residualRisk: 'LOW' },
  ],
  issues: [
    { id: 'I59', name: '', description: 'Companies unfamiliar with target market setup procedures', type: 'Stakeholders', criticality: 'LOW', resolution: 'Onboarding guide developed and distributed', status: 'Closed' },
  ],
  projectBackground: 'New Global Initiative is a strategic initiative designed to help companies set up and expand internationally. The program provides end-to-end support including market intelligence, strategic connections, trade missions, expert advisory, and business matching services.',
};

const q2_2025: PSRReportData = {
  ...q3_2025,
  reportingPeriod: '01/04/2025 to 30/06/2025',
  reportDate: '05/07/2025',
  overallStatus: 'alert',
  overallStatusSummary: 'Project facing schedule pressures due to resource availability constraints in Q2. Risk R834 (extreme) requires executive attention. Budget tracking slightly over forecast due to additional consultant engagement. Corrective actions have been initiated.',
  projectStatus: {
    dependency: 'on-track',
    issues: 'alert',
    resource: 'alert',
    benefits: 'on-track',
    risks: 'off-track',
    budget: 'alert',
    scope: 'on-track',
    schedule: 'alert',
  },
  projectStatusComments: {
    risks: 'R834 escalated to EXTREME — delays in business setup processes. Executive steering committee notified.',
    budget: 'Forecast over baseline by 8.5% due to additional consultant engagement for regulatory pathway.',
    schedule: 'Phase 2 start delayed by 3 weeks due to resource shortfall in technical team.',
    resource: 'Two key resources unavailable for 6 weeks. Replacement sourced but onboarding time impact schedule.',
    issues: 'New issue raised relating to partner country compliance requirements — resolution in progress.',
  },
  financial: {
    capex: { baseline: '100.00 K', forecast: '108.00 K', forecastVariance: '-8.00 K (-8.00%)', ytdBaseline: '50.00 K', ytdActual: '54.00 K', actualVariance: '-4.00 K' },
    opex: { baseline: '25.00 K', forecast: '27.50 K', forecastVariance: '-2.50 K (-10.00%)', ytdBaseline: '12.50 K', ytdActual: '13.50 K', actualVariance: '-1.00 K' },
    total: { baseline: '125.00 K', forecast: '135.50 K', forecastVariance: '-10.50 K (-8.40%)', ytdBaseline: '62.50 K', ytdActual: '67.50 K', actualVariance: '-5.00 K' },
  },
  keyAchievements: 'Successfully onboarded 2 new partner organisations. Strategic advisory framework v1 finalised and approved by steering committee. First cohort of 8 companies enrolled in the international expansion programme.',
  plannedActivities: 'Phase 2 market entry — commence July 2025. Trade mission scoping for Southeast Asia. Complete regulatory approval documentation. Resolve resource shortfall by end of Q3.',
  milestones: [
    { name: 'Partner Onboarding Cohort 1', priority: 'HP', dueDate: '30/04/2025', currentDueDate: '15/05/2025', status: 'Completed' },
    { name: 'Strategic Advisory Framework v1 Approval', priority: 'HP', dueDate: '30/05/2025', currentDueDate: '30/05/2025', status: 'Completed' },
    { name: 'Phase 2 Market Entry', priority: 'HP', dueDate: '01/07/2025', currentDueDate: '22/07/2025', status: 'Delayed' },
  ],
  risks: [
    { id: 'R834', name: 'Delays in business setup processes', actualRisk: 'EXTREME', treatment: 'Executive escalation. Dedicated task force formed. Weekly steering committee updates.', residualRisk: 'HIGH' },
    { id: 'R613', name: 'Regulatory approval timeline extension', actualRisk: 'HIGH', treatment: 'Engaged regulatory consultants; application under review.', residualRisk: 'MEDIUM' },
    { id: 'R822', name: 'Dependence on partner readiness', actualRisk: 'MEDIUM', treatment: 'Partner readiness assessment underway.', residualRisk: 'MEDIUM' },
  ],
  issues: [
    { id: 'I70', name: '', description: 'Partner country compliance requirements ambiguous', type: 'Project Change Management', criticality: 'MEDIUM', resolution: 'Legal review commissioned — outcome expected Q3', status: 'Open' },
    { id: 'I59', name: '', description: 'Companies unfamiliar with target market setup procedures', type: 'Stakeholders', criticality: 'LOW', resolution: 'Onboarding guide in development', status: 'In Progress' },
  ],
};

const q1_2025: PSRReportData = {
  ...q3_2025,
  reportingPeriod: '01/01/2025 to 31/03/2025',
  reportDate: '05/04/2025',
  overallStatus: 'on-track',
  overallStatusSummary: 'Strong start to FY2025. Phase 1 activities progressing well with all key deliverables on schedule. Stakeholder engagement programme launched successfully. Budget remains on track.',
  projectStatus: {
    dependency: 'on-track',
    issues: 'on-track',
    resource: 'on-track',
    benefits: 'on-track',
    risks: 'on-track',
    budget: 'on-track',
    scope: 'on-track',
    schedule: 'on-track',
  },
  projectStatusComments: {},
  financial: {
    capex: { baseline: '80.00 K', forecast: '79.00 K', forecastVariance: '+1.00 K (1.25%)', ytdBaseline: '40.00 K', ytdActual: '39.50 K', actualVariance: '+0.50 K' },
    opex: { baseline: '20.00 K', forecast: '20.00 K', forecastVariance: '0.00 K (0.00%)', ytdBaseline: '10.00 K', ytdActual: '9.80 K', actualVariance: '+0.20 K' },
    total: { baseline: '100.00 K', forecast: '99.00 K', forecastVariance: '+1.00 K (1.00%)', ytdBaseline: '50.00 K', ytdActual: '49.30 K', actualVariance: '+0.70 K' },
  },
  keyAchievements: 'Phase 1 programme structure finalised and approved. Stakeholder engagement framework launched. First government partner signed MOU. Project website and communications collateral developed.',
  plannedActivities: 'Commence partner recruitment — target 5 organisations. Develop strategic advisory framework v1. Launch market intelligence capability. Begin regulatory pathway mapping for 3 target markets.',
  milestones: [
    { name: 'Phase 1 Programme Structure Approval', priority: 'HP', dueDate: '31/01/2025', currentDueDate: '31/01/2025', status: 'Completed' },
    { name: 'Government Partner MOU', priority: 'HP', dueDate: '28/02/2025', currentDueDate: '28/02/2025', status: 'Completed' },
    { name: 'Stakeholder Engagement Launch', priority: 'MP', dueDate: '31/03/2025', currentDueDate: '31/03/2025', status: 'Completed' },
  ],
  risks: [
    { id: 'R822', name: 'Dependence on partner readiness', actualRisk: 'MEDIUM', treatment: 'Partner selection criteria tightened. Readiness assessment tool developed.', residualRisk: 'LOW' },
    { id: 'R835', name: 'Insufficient market intelligence', actualRisk: 'MEDIUM', treatment: 'Market intelligence RFP issued — 3 vendors shortlisted.', residualRisk: 'MEDIUM' },
  ],
  issues: [],
};

const blankReport: PSRReportData = {
  projectName: 'New Global Initiative',
  reportingPeriod: '01/01/2026 to 31/03/2026',
  baselineStart: '01/11/2022',
  baselineEnd: '01/07/2028',
  reportDate: '',
  projectManager: 'Sarah Mitchell',
  projectDirector: 'Ashraf Clark',
  projectDeliveryFunction: 'Biosecurity',
  programManager: '',
  projectState: 'Active',
  overallStatus: 'not-tracked',
  overallStatusSummary: '',
  projectStatus: {
    dependency: 'not-tracked',
    issues: 'not-tracked',
    resource: 'not-tracked',
    benefits: 'not-tracked',
    risks: 'not-tracked',
    budget: 'not-tracked',
    scope: 'not-tracked',
    schedule: 'not-tracked',
  },
  projectStatusComments: {},
  financial: {
    capex: { baseline: '120.00 K', forecast: '', forecastVariance: '', ytdBaseline: '', ytdActual: '', actualVariance: '' },
    opex: { baseline: '30.00 K', forecast: '', forecastVariance: '', ytdBaseline: '', ytdActual: '', actualVariance: '' },
    total: { baseline: '150.00 K', forecast: '', forecastVariance: '', ytdBaseline: '', ytdActual: '', actualVariance: '' },
  },
  keyAchievements: '',
  plannedActivities: '',
  milestones: [
    { name: 'Phase 4 Regulatory Clearance', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '31/01/2026', status: 'Pending' },
    { name: 'Advanced Market Intelligence Launch', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Pending' },
    { name: 'Partner Cohort 3 Onboarding', priority: 'MP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Pending' },
  ],
  endProducts: [
    { name: 'Market Intelligence Platform v2', owner: 'James Tran', startDate: '01/10/2025', endDate: '28/02/2026', status: '', completion: 0 },
    { name: 'Phase 3 Regulatory Dossier', owner: 'Claire Soo', startDate: '01/11/2025', endDate: '31/01/2026', status: '', completion: 0 },
  ],
  managementProducts: [
    { name: 'Phase 4 Business Case', owner: 'Canning Santos', startDate: '01/02/2026', endDate: '31/03/2026', status: '', completion: 0 },
  ],
  risks: [
    { id: 'R613', name: 'Regulatory approval timeline extension', actualRisk: 'MEDIUM', treatment: '', residualRisk: 'Not Rated' },
    { id: 'R822', name: 'Dependence on partner readiness', actualRisk: 'MEDIUM', treatment: '', residualRisk: 'Not Rated' },
    { id: 'R834', name: 'Delays in business setup processes', actualRisk: 'LOW', treatment: '', residualRisk: 'Not Rated' },
  ],
  issues: [
    { id: 'I70', name: '', description: 'Partner country compliance requirements', type: 'Project Change Management', criticality: 'LOW', resolution: '', status: 'Open' },
  ],
  projectBackground: 'New Global Initiative is a strategic initiative designed to help companies set up and expand internationally. The program provides end-to-end support including market intelligence, strategic connections, trade missions, expert advisory, and business matching services.',
};

export const PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'New Global Initiative',
    currentReport: blankReport,
    pastReports: [
      { label: 'Oct – Dec 2025', data: q3_2025 },
      { label: 'Jul – Sep 2025', data: q2_2025 },
      { label: 'Apr – Jun 2025', data: q1_2025 },
    ],
  },
  {
    id: 'proj-2',
    name: 'Enterprise Security Services (ESS)',
    currentReport: {
      ...blankReport,
      projectName: 'Enterprise Security Services (ESS)',
      projectManager: 'Sarah Mitchell',
      projectDirector: 'David Chen',
      projectDeliveryFunction: 'IT Operations',
      overallStatus: 'not-tracked',
      milestones: [
        { name: 'Security Audit Completion', priority: 'HP', dueDate: '15/01/2026', currentDueDate: '15/01/2026', status: 'Pending' },
        { name: 'Phase 2 Go-Live', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Pending' },
      ],
    },
    pastReports: [
      {
        label: 'Oct – Dec 2025',
        data: {
          ...q3_2025,
          projectName: 'Enterprise Security Services (ESS)',
          projectDirector: 'David Chen',
          projectDeliveryFunction: 'IT Operations',
          reportingPeriod: '01/10/2025 to 31/12/2025',
          overallStatus: 'on-track',
          overallStatusSummary: 'Phase 1 security framework fully deployed. All endpoints secured. Penetration testing completed with satisfactory results.',
        }
      },
      {
        label: 'Jul – Sep 2025',
        data: {
          ...q2_2025,
          projectName: 'Enterprise Security Services (ESS)',
          projectDirector: 'David Chen',
          projectDeliveryFunction: 'IT Operations',
          reportingPeriod: '01/07/2025 to 30/09/2025',
          overallStatus: 'alert',
          overallStatusSummary: 'Vendor delivery delays impacting Phase 1 timeline. Escalation in progress.',
        }
      },
      {
        label: 'Apr – Jun 2025',
        data: {
          ...q1_2025,
          projectName: 'Enterprise Security Services (ESS)',
          projectDirector: 'David Chen',
          projectDeliveryFunction: 'IT Operations',
          reportingPeriod: '01/04/2025 to 30/06/2025',
          overallStatus: 'on-track',
          overallStatusSummary: 'Project initiated. Requirements gathering complete. Vendor selection finalised.',
        }
      },
    ],
  },
];
