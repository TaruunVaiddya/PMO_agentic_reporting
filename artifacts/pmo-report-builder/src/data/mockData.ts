import type { PSRReportData, Project } from '../types';

const ess_feb2026: PSRReportData = {
  projectName: 'Enterprise Security Services (ESS)',
  reportingPeriod: '01/02/2026 to 28/02/2026',
  baselineStart: '01/07/2025',
  baselineEnd: '30/06/2027',
  reportDate: '05/03/2026',
  projectManager: 'Sarah Mitchell',
  projectDirector: 'David Chen',
  projectDeliveryFunction: 'IT Operations',
  programManager: 'Neil Okafor',
  projectState: 'Active',
  overallStatus: 'on-track',
  overallStatusSummary: 'Phase 1 security framework fully deployed. All 1,247 enterprise endpoints secured. External penetration testing completed with satisfactory results — minor low-severity findings remediated. Phase 2 Go-Live achieved on 28 February as planned.',
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
    risks: 'Phase 3 vendor delivering identity management module approximately 2 weeks behind schedule. Recovery plan in place.',
    benefits: 'Phase 2 Go-Live achieved. All endpoints secured — first benefits milestone delivered.',
  },
  financial: {
    capex: { baseline: '680.00 K', forecast: '672.00 K', forecastVariance: '+8.00 K (1.18%)', ytdBaseline: '340.00 K', ytdActual: '335.50 K', actualVariance: '+4.50 K' },
    opex: { baseline: '150.00 K', forecast: '147.00 K', forecastVariance: '+3.00 K (2.00%)', ytdBaseline: '75.00 K', ytdActual: '73.20 K', actualVariance: '+1.80 K' },
    total: { baseline: '830.00 K', forecast: '819.00 K', forecastVariance: '+11.00 K (1.33%)', ytdBaseline: '415.00 K', ytdActual: '408.70 K', actualVariance: '+6.30 K' },
  },
  keyAchievements: 'Phase 2 Go-Live achieved on 28 February — on schedule. All 1,247 endpoints fully secured across the enterprise. External penetration testing completed with zero critical findings. Security audit finalised in January with satisfactory outcome.',
  plannedActivities: 'Commence Phase 3 — Identity and Access Management rollout. Complete Security Operations Centre (SOC) integration. Begin enterprise-wide user awareness training program. Resolve Phase 3 vendor delivery delay.',
  milestones: [
    { name: 'Security Audit Completion', priority: 'HP', dueDate: '15/01/2026', currentDueDate: '15/01/2026', status: 'Completed' },
    { name: 'Endpoint Security — Full Coverage', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '31/01/2026', status: 'Completed' },
    { name: 'Phase 2 Go-Live', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'Completed' },
    { name: 'Phase 3 IAM Rollout Start', priority: 'HP', dueDate: '31/03/2026', currentDueDate: '14/04/2026', status: 'Delayed' },
  ],
  endProducts: [
    { name: 'Endpoint Security Platform', owner: 'Marcus Tanaka', startDate: '01/08/2025', endDate: '28/02/2026', status: 'Completed', completion: 100 },
    { name: 'Security Audit Report', owner: 'Priya Nair', startDate: '01/12/2025', endDate: '15/01/2026', status: 'Completed', completion: 100 },
  ],
  managementProducts: [
    { name: 'Phase 3 Delivery Plan', owner: 'Neil Okafor', startDate: '01/02/2026', endDate: '31/03/2026', status: 'In Progress', completion: 60 },
  ],
  risks: [
    { id: 'R101', name: 'Phase 3 vendor delivery delay — IAM module', actualRisk: 'HIGH', treatment: 'Escalated to vendor management. Weekly delivery reviews scheduled. Buffer built into Phase 3 plan.', residualRisk: 'MEDIUM' },
    { id: 'R102', name: 'Skilled resource availability for Phase 3', actualRisk: 'MEDIUM', treatment: 'Resource plan confirmed. Two additional security engineers engaged.', residualRisk: 'LOW' },
  ],
  issues: [
    { id: 'I12', name: '', description: 'Legacy system compatibility with new endpoint agent', type: 'Technical', criticality: 'MEDIUM', resolution: 'Custom integration developed — deployed to 98% of legacy endpoints', status: 'Closed' },
  ],
  projectBackground: 'Enterprise Security Services (ESS) is a multi-phase program to uplift the organisation\'s security posture across all IT assets. Phase 1 covered governance and policy frameworks. Phase 2 delivered endpoint protection across the enterprise. Phase 3 will deliver Identity and Access Management, SOC integration, and a security awareness program for all staff.',
};

const ess_jan2026: PSRReportData = {
  ...ess_feb2026,
  reportingPeriod: '01/01/2026 to 31/01/2026',
  reportDate: '05/02/2026',
  overallStatus: 'alert',
  overallStatusSummary: 'Phase 2 progress impacted by vendor delivery delays on endpoint agent software. Escalation in progress. Security audit commenced and on track. Budget tracking within approved thresholds despite additional consultant engagement.',
  projectStatus: {
    dependency: 'alert',
    issues: 'alert',
    resource: 'on-track',
    benefits: 'on-track',
    risks: 'off-track',
    budget: 'alert',
    scope: 'on-track',
    schedule: 'alert',
  },
  projectStatusComments: {
    dependency: 'Vendor delivery of endpoint agent v2.3 delayed by 3 weeks. Dependency on vendor resolution.',
    issues: 'Legacy system compatibility issue raised — 47 endpoints unable to accept new agent. Investigation underway.',
    risks: 'R101 escalated to HIGH. Vendor delays may push Phase 2 Go-Live beyond 28 February.',
    budget: 'Additional consultant engaged to resolve compatibility issues — forecast increased by 22K.',
    schedule: 'Phase 2 Go-Live at risk — contingency window of 2 weeks being assessed.',
  },
  financial: {
    capex: { baseline: '580.00 K', forecast: '596.00 K', forecastVariance: '-16.00 K (-2.76%)', ytdBaseline: '290.00 K', ytdActual: '298.50 K', actualVariance: '-8.50 K' },
    opex: { baseline: '130.00 K', forecast: '136.00 K', forecastVariance: '-6.00 K (-4.62%)', ytdBaseline: '65.00 K', ytdActual: '68.20 K', actualVariance: '-3.20 K' },
    total: { baseline: '710.00 K', forecast: '732.00 K', forecastVariance: '-22.00 K (-3.10%)', ytdBaseline: '355.00 K', ytdActual: '366.70 K', actualVariance: '-11.70 K' },
  },
  keyAchievements: 'Security audit commenced and tracking to plan. 1,200 of 1,247 endpoints successfully onboarded to new agent. Phase 2 governance documentation approved by steering committee.',
  plannedActivities: 'Resolve vendor delivery delay — target endpoint agent v2.3 by 14 January. Complete legacy system compatibility remediation. Finalise security audit. Achieve Phase 2 Go-Live by 28 February.',
  milestones: [
    { name: 'Security Audit Completion', priority: 'HP', dueDate: '15/01/2026', currentDueDate: '15/01/2026', status: 'In Progress' },
    { name: 'Endpoint Security — Full Coverage', priority: 'HP', dueDate: '31/01/2026', currentDueDate: '14/02/2026', status: 'Delayed' },
    { name: 'Phase 2 Go-Live', priority: 'HP', dueDate: '28/02/2026', currentDueDate: '28/02/2026', status: 'At Risk' },
  ],
  endProducts: [
    { name: 'Endpoint Security Platform', owner: 'Marcus Tanaka', startDate: '01/08/2025', endDate: '28/02/2026', status: 'In Progress', completion: 72 },
    { name: 'Security Audit Report', owner: 'Priya Nair', startDate: '01/12/2025', endDate: '15/01/2026', status: 'In Progress', completion: 45 },
  ],
  risks: [
    { id: 'R101', name: 'Phase 3 vendor delivery delay — IAM module', actualRisk: 'HIGH', treatment: 'Escalated to vendor account manager. Daily stand-ups initiated.', residualRisk: 'HIGH' },
    { id: 'R102', name: 'Skilled resource availability for Phase 3', actualRisk: 'MEDIUM', treatment: 'Resource planning underway for Phase 3 commencement.', residualRisk: 'MEDIUM' },
    { id: 'R103', name: 'Legacy system incompatibility', actualRisk: 'HIGH', treatment: 'Custom integration development in progress. Expected resolution: 2 weeks.', residualRisk: 'MEDIUM' },
  ],
  issues: [
    { id: 'I12', name: '', description: 'Legacy system compatibility with new endpoint agent', type: 'Technical', criticality: 'MEDIUM', resolution: 'Custom integration development in progress', status: 'Open' },
  ],
};

const ess_dec2025: PSRReportData = {
  ...ess_feb2026,
  reportingPeriod: '01/12/2025 to 31/12/2025',
  reportDate: '05/01/2026',
  overallStatus: 'on-track',
  overallStatusSummary: 'Project initiated on schedule. Requirements gathering complete and vendor selection finalised. Phase 1 governance framework approved by steering committee. Phase 2 planning well advanced.',
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
    capex: { baseline: '420.00 K', forecast: '418.00 K', forecastVariance: '+2.00 K (0.48%)', ytdBaseline: '210.00 K', ytdActual: '209.20 K', actualVariance: '+0.80 K' },
    opex: { baseline: '95.00 K', forecast: '94.00 K', forecastVariance: '+1.00 K (1.05%)', ytdBaseline: '47.50 K', ytdActual: '47.00 K', actualVariance: '+0.50 K' },
    total: { baseline: '515.00 K', forecast: '512.00 K', forecastVariance: '+3.00 K (0.58%)', ytdBaseline: '257.50 K', ytdActual: '256.20 K', actualVariance: '+1.30 K' },
  },
  keyAchievements: 'Project formally initiated and governance established. Phase 1 security governance framework approved. Vendor selection finalised — endpoint security platform and IAM solution selected. Requirements gathering complete for all three phases.',
  plannedActivities: 'Begin Phase 2 endpoint deployment — target 1,247 enterprise devices. Commence security audit scoping. Onboard endpoint security vendor. Establish project steering committee cadence.',
  milestones: [
    { name: 'Project Initiation & Governance', priority: 'HP', dueDate: '30/11/2025', currentDueDate: '30/11/2025', status: 'Completed' },
    { name: 'Vendor Selection Finalised', priority: 'HP', dueDate: '15/12/2025', currentDueDate: '15/12/2025', status: 'Completed' },
    { name: 'Phase 2 Endpoint Deployment Start', priority: 'HP', dueDate: '05/01/2026', currentDueDate: '05/01/2026', status: 'Pending' },
  ],
  endProducts: [
    { name: 'Phase 1 Governance Framework', owner: 'Neil Okafor', startDate: '01/07/2025', endDate: '30/11/2025', status: 'Completed', completion: 100 },
    { name: 'Endpoint Security Platform', owner: 'Marcus Tanaka', startDate: '01/08/2025', endDate: '28/02/2026', status: 'In Progress', completion: 15 },
  ],
  risks: [
    { id: 'R102', name: 'Skilled resource availability for Phase 3', actualRisk: 'MEDIUM', treatment: 'Early engagement with internal SMEs and external partners.', residualRisk: 'LOW' },
  ],
  issues: [],
};

const essBlankReport: PSRReportData = {
  projectName: 'Enterprise Security Services (ESS)',
  reportingPeriod: '01/03/2026 to 31/03/2026',
  baselineStart: '01/07/2025',
  baselineEnd: '30/06/2027',
  reportDate: '',
  projectManager: 'Sarah Mitchell',
  projectDirector: 'David Chen',
  projectDeliveryFunction: 'IT Operations',
  programManager: 'Neil Okafor',
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
    capex: { baseline: '830.00 K', forecast: '', forecastVariance: '', ytdBaseline: '', ytdActual: '', actualVariance: '' },
    opex: { baseline: '185.00 K', forecast: '', forecastVariance: '', ytdBaseline: '', ytdActual: '', actualVariance: '' },
    total: { baseline: '1,015.00 K', forecast: '', forecastVariance: '', ytdBaseline: '', ytdActual: '', actualVariance: '' },
  },
  keyAchievements: '',
  plannedActivities: '',
  milestones: [
    { name: 'Phase 3 IAM Rollout Start', priority: 'HP', dueDate: '31/03/2026', currentDueDate: '31/03/2026', status: 'Pending' },
    { name: 'SOC Integration Complete', priority: 'HP', dueDate: '30/04/2026', currentDueDate: '30/04/2026', status: 'Pending' },
    { name: 'User Awareness Training Launch', priority: 'MP', dueDate: '31/05/2026', currentDueDate: '31/05/2026', status: 'Pending' },
  ],
  endProducts: [
    { name: 'Identity & Access Management Platform', owner: 'Marcus Tanaka', startDate: '01/03/2026', endDate: '30/04/2026', status: '', completion: 0 },
    { name: 'SOC Integration Blueprint', owner: 'Priya Nair', startDate: '01/03/2026', endDate: '30/04/2026', status: '', completion: 0 },
    { name: 'Security Awareness Training Program', owner: 'Lisa Chow', startDate: '01/04/2026', endDate: '31/05/2026', status: '', completion: 0 },
  ],
  managementProducts: [
    { name: 'Phase 3 Updated Delivery Plan', owner: 'Neil Okafor', startDate: '01/03/2026', endDate: '14/04/2026', status: '', completion: 0 },
  ],
  risks: [
    { id: 'R101', name: 'Phase 3 vendor delivery delay — IAM module', actualRisk: 'HIGH', treatment: '', residualRisk: 'Not Rated' },
    { id: 'R102', name: 'Skilled resource availability for Phase 3', actualRisk: 'MEDIUM', treatment: '', residualRisk: 'Not Rated' },
  ],
  issues: [
    { id: 'I14', name: '', description: 'Phase 3 IAM vendor SLA terms under negotiation', type: 'Procurement', criticality: 'MEDIUM', resolution: '', status: 'Open' },
  ],
  projectBackground: 'Enterprise Security Services (ESS) is a multi-phase program to uplift the organisation\'s security posture across all IT assets. Phase 1 covered governance and policy frameworks. Phase 2 delivered endpoint protection across the enterprise network (completed February 2026). Phase 3 will deliver Identity and Access Management, Security Operations Centre integration, and an enterprise-wide security awareness training program.',
};

export const PROJECTS: Project[] = [
  {
    id: 'ess',
    name: 'Enterprise Security Services (ESS)',
    currentReport: essBlankReport,
    pastReports: [
      { label: 'Feb 2026', data: ess_feb2026 },
      { label: 'Jan 2026', data: ess_jan2026 },
      { label: 'Dec 2025', data: ess_dec2025 },
    ],
  },
];
