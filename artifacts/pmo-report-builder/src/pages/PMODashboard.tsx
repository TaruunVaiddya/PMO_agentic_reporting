import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppState } from '../context/AppState';
import { PSRReport } from '../components/PSRReport';
import { LeftNav } from '../components/LeftNav';
import {
  getPMOProjects, getPipelineStats, EXEC_SUMMARY_ROWS, NGI_EXEC_ROW,
  type DashboardProject, type ReportingStatus,
} from '../data/pmoDashboardData';

type SortField = 'name' | 'pm' | 'businessUnit' | 'status' | 'submittedAt';
type GroupBy = 'none' | 'businessUnit' | 'program' | 'pm';
type SummaryTemplate = 'tabular' | 'bu-head' | 'exec-snapshot';

const STATUS_LABELS: Record<ReportingStatus, string> = {
  notified: 'Notified', clicked: 'CTA Clicked', submitted: 'Submitted',
  approved: 'PMO Approved', sent: 'Sent to Exec',
};
const STATUS_COLORS: Record<ReportingStatus, string> = {
  notified: 'bg-slate-100 text-slate-600',
  clicked: 'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  sent: 'bg-teal-100 text-teal-700',
};
const OVERALL_COLORS = {
  'on-track': { dot: 'bg-green-500', label: 'On Track', text: 'text-green-700' },
  'alert': { dot: 'bg-amber-500', label: 'Alert', text: 'text-amber-700' },
  'off-track': { dot: 'bg-red-500', label: 'Off Track', text: 'text-red-700' },
};
const STATUS_ORDER: Record<ReportingStatus, number> = {
  notified: 0, clicked: 1, submitted: 2, approved: 3, sent: 4,
};

const TEMPLATE_META: Record<SummaryTemplate, { label: string; usageCount: number; description: string; bestFor: string }> = {
  tabular: {
    label: 'Exec Tabular Summary',
    usageCount: 24,
    description: 'A structured two-column table listing each project with its delivery narrative and key risks — suited for executives who prefer concise, comparable entries.',
    bestFor: 'Executive Directors · Steering Committees',
  },
  'bu-head': {
    label: 'BU Head Summary',
    usageCount: 11,
    description: 'Groups projects by portfolio area with colour-coded status indicators. Ideal for BU Heads reviewing their own stream alongside the broader portfolio.',
    bestFor: 'BU Leads · Deputy Secretaries',
  },
  'exec-snapshot': {
    label: 'Exec Snapshot',
    usageCount: 8,
    description: 'Pulse-style view with compliance % cards, context bullets per portfolio, and a flagged risk list — designed for time-poor executives who want the highlights only.',
    bestFor: 'CEOs · COOs · Secretaries',
  },
};

const PORTFOLIO_GROUPS = [
  { key: 'digital-uplift', label: 'Digital Uplift Portfolio', snapTag: 'Digital Uplift', snapContextTag: 'Digital Uplift', color: '#0891b2', bg: '#e0f9ff', border: '#a5f3fc', pct: 75, projectCount: 4 },
  { key: 'infrastructure', label: 'Infrastructure Delivery', snapTag: 'Infrastructure', snapContextTag: 'Infrastructure', color: '#4f46e5', bg: '#f0f4ff', border: '#c7d2fe', pct: 100, projectCount: 2 },
  { key: 'trade-corp', label: 'Trade & Investment', snapTag: 'Trade & Investment', snapContextTag: 'Trade & Inv', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', pct: 67, projectCount: 4 },
];
const PORTFOLIO_CONTEXT: Record<string, string> = {
  'digital-uplift': 'Strong delivery across ESS and Cyber Resilience with both programmes meeting March milestones. Data Governance classification tooling gated on legal MOU review — outcome 15 Apr will unblock deployment.',
  'infrastructure': 'Both programmes delivering ahead of plan. Smart Buildings exceeded energy reduction target (18% vs 15%). Infrastructure Modernisation Phase 2 vendor selection complete — contract award 01 Apr.',
  'trade-corp': 'HR Systems go-live delivered cleanly 01 Mar. Trade Gateway under pressure from Customs API delays — recovery plan active. Executive support with Customs escalation would accelerate resolution.',
};
const PORTFOLIO_RISKS: Record<string, string> = {
  'trade-corp': 'Trade Gateway: Customs API integration delays threaten go-live date. Deputy Secretary escalation active — executive support recommended.',
  'digital-uplift': 'Data Governance: Legal MOU review (expected 15 Apr) is sole gate for classification tool deployment — monitoring closely.',
};
const STEP_LABELS = ['Choose format', 'Configure', 'Review & send'] as const;

const EXECUTIVES = [
  { id: 'e1', name: 'Margaret Chen', title: 'Executive Director', email: 'margaret.chen@strategydotzero.gov' },
  { id: 'e2', name: 'David Morrison', title: 'Deputy Secretary', email: 'david.morrison@strategydotzero.gov' },
  { id: 'e3', name: 'Amanda Forsythe', title: 'Chief Executive Officer', email: 'amanda.forsythe@strategydotzero.gov' },
  { id: 'e4', name: 'Robert Kim', title: 'Deputy Director General', email: 'robert.kim@strategydotzero.gov' },
  { id: 'e5', name: 'Sarah Blackwood', title: 'Chief Operating Officer', email: 'sarah.blackwood@strategydotzero.gov' },
  { id: 'e6', name: 'Thomas Nguyen', title: 'Assistant Secretary', email: 'thomas.nguyen@strategydotzero.gov' },
];

type Executive = typeof EXECUTIVES[0];

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function BellSendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function SendUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

function PipelineBar({ projects, filterStatus, onFilter }: {
  projects: DashboardProject[];
  filterStatus: string;
  onFilter: (s: ReportingStatus | 'all') => void;
}) {
  const stats = getPipelineStats(projects);
  const stages: { key: ReportingStatus; label: string; count: number; barColor: string; activeColor: string }[] = [
    { key: 'notified', label: 'Email Notified', count: stats.notified, barColor: 'bg-slate-400', activeColor: 'bg-slate-500' },
    { key: 'clicked', label: 'CTA Clicked', count: stats.clicked, barColor: 'bg-blue-400', activeColor: 'bg-blue-500' },
    { key: 'submitted', label: 'Report Submitted', count: stats.submitted, barColor: 'bg-amber-400', activeColor: 'bg-amber-500' },
    { key: 'approved', label: 'PMO Approved', count: stats.approved, barColor: 'bg-green-400', activeColor: 'bg-green-500' },
    { key: 'sent', label: 'Sent to Executive', count: stats.sent, barColor: 'bg-teal-400', activeColor: 'bg-teal-500' },
  ];

  return (
    <div className="flex items-stretch gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {stages.map((stage, i) => {
        const isActive = filterStatus === stage.key;
        const pct = stats.total > 0 ? Math.round((stage.count / stats.total) * 100) : 0;
        return (
          <button
            key={stage.key}
            onClick={() => onFilter(isActive ? 'all' : stage.key as ReportingStatus)}
            className={`flex-1 flex flex-col items-center px-3 pt-3 pb-2 text-center transition-all relative
              ${isActive ? 'bg-[#eef4fb]' : 'hover:bg-slate-50'}
              ${i > 0 ? 'border-l border-l-slate-100' : ''}`}
          >
            <span className="text-2xl font-bold text-[#1a2456]">{stage.count}</span>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">{stage.label}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 mb-2">{pct}% of portfolio</span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-auto">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isActive ? stage.activeColor : stage.barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {i < stages.length - 1 && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg leading-none">›</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: ReportingStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function OverallBadge({ status }: { status?: 'on-track' | 'alert' | 'off-track' }) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;
  const cfg = OVERALL_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ReportSlideOver({ project, onClose, onApprove }: {
  project: DashboardProject;
  onClose: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[800px] max-w-[90vw] bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1a2456] shrink-0">
          <div>
            <p className="text-xs text-[#8aaccc]">Report Draft — March 2026</p>
            <p className="text-white font-semibold text-sm">{project.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {project.reportingStatus === 'submitted' && (
              <button
                onClick={onApprove}
                className="px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckIcon /> Approve Report
              </button>
            )}
            {project.reportingStatus === 'approved' && (
              <span className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold">PMO Approved</span>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-lg leading-none transition-colors"
            >×</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {project.submittedReport ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <PSRReport data={project.submittedReport} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">No report data available.</div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between text-xs text-slate-500">
          <span>Submitted by {project.projectManager} · {project.submittedAt}</span>
          <button onClick={onClose} className="text-[#2a9fd6] hover:underline">Close</button>
        </div>
      </div>
    </div>
  );
}

function ReminderModal({ projects, onClose }: { projects: DashboardProject[]; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw] overflow-hidden">
        <div className="bg-[#1a2456] px-6 py-4">
          <h2 className="text-white font-semibold">Send Reminder Nudge</h2>
          <p className="text-[#8aaccc] text-xs mt-0.5">
            {projects.length === 1 ? `Sending to ${projects[0].projectManager}` : `Sending to ${projects.length} project managers`}
          </p>
        </div>
        <div className="p-5">
          {!sent ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <span>To:</span>
                  <div className="flex flex-wrap gap-1">
                    {projects.map(p => (
                      <span key={p.id} className="bg-[#e0f0fb] text-[#2a9fd6] px-2 py-0.5 rounded-full text-xs font-medium">
                        {p.projectManager}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-500">Subject: <span className="text-slate-700 font-medium">Friendly Reminder — March 2026 PSR Due 8 Apr 2026</span></div>
                <div className="border-t border-slate-200 pt-2 text-slate-600 text-xs leading-relaxed">
                  <p>Hi {projects.length === 1 ? projects[0].projectManager.split(' ')[0] : '[Name]'},</p>
                  <p className="mt-2">Just a friendly nudge — your March 2026 Project Status Report
                    {projects.length === 1 ? ` for <strong>${projects[0].name}</strong>` : ''} is due by <strong>Wednesday, 8 April 2026</strong>.
                    You&rsquo;re almost there! Dotz is ready to help you wrap it up in minutes.</p>
                  <p className="mt-2">Click below to continue where you left off &rarr;</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-5 py-2 rounded-lg bg-[#2a9fd6] hover:bg-[#2490c5] text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : `Send Reminder${projects.length > 1 ? ` (${projects.length})` : ''}`}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <p className="font-semibold text-slate-800">Reminder sent successfully</p>
              <p className="text-sm text-slate-500 mt-1">
                {projects.length === 1
                  ? `${projects[0].projectManager} has been notified.`
                  : `${projects.length} project managers have been notified.`}
              </p>
              <button onClick={onClose} className="mt-4 px-5 py-2 rounded-lg bg-[#1a2456] text-white text-sm font-semibold hover:bg-[#232f6b] transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BUHeadContent({ rows, selectedGroups }: { rows: typeof EXEC_SUMMARY_ROWS; selectedGroups?: Set<string> }) {
  const allBuGroups = [
    {
      key: 'digital-uplift',
      name: 'Digital Uplift Portfolio',
      color: '#0891b2',
      bgColor: '#e0f9ff',
      projects: [
        { name: 'Enterprise Security Services (ESS)', status: 'on-track', pm: 'James Nguyen', update: 'Phase 2 security framework deployed. SOC 2 Type II certification achieved ahead of schedule. All endpoints secured.' },
        { name: 'Cyber Resilience Program', status: 'on-track', pm: 'Priya Sharma', update: 'SIEM platform fully operational. Penetration testing passed. Q2 threat intelligence roadmap approved.' },
        { name: 'Digital Workplace Transformation', status: 'alert', pm: 'Alex Torres', update: 'Phase 3 scope signed off by steering committee. ICT strategy alignment required before Phase 3 mobilisation.' },
        { name: 'Data Governance Framework', status: 'alert', pm: 'Claire Soo', update: 'Classification tooling development complete. Deployment gated on legal MOU review — outcome expected 15 Apr 2026.' },
      ],
    },
    {
      key: 'infrastructure',
      name: 'Infrastructure Delivery',
      color: '#4f46e5',
      bgColor: '#f0f4ff',
      projects: [
        { name: 'Infrastructure Modernisation', status: 'on-track', pm: 'Ben Yap', update: 'Phase 2 vendor selection finalised. Contract award targeted 01 Apr 2026. Phase 1 decommissioning complete.' },
        { name: 'Smart Buildings Initiative', status: 'on-track', pm: 'Rachel Kim', update: '18% energy reduction achieved vs 15% target. IoT sensor network fully deployed across 3 sites.' },
      ],
    },
    {
      key: 'trade-corp',
      name: 'Trade & Investment',
      color: '#065f46',
      bgColor: '#ecfdf5',
      projects: [
        { name: 'Trade Gateway Platform', status: 'off-track', pm: 'Marcus Webb', update: 'Customs API integration delayed. Manual interim workaround designed. Recovery plan active — Deputy Secretary escalation in progress.' },
        { name: 'Export Facilitation Hub', status: 'on-track', pm: 'Diana Lam', update: 'FTA seminars delivered to 120 exporters. Phase 2 scoping complete. Funding confirmed.' },
        { name: 'HR Systems (Oracle HCM)', status: 'on-track', pm: 'Tom Bradley', update: 'Phase 1 go-live delivered 01 Mar with 98% data migration accuracy. Phase 2 payroll integration on track.' },
        { name: 'New Global Initiative (NGI)', status: 'on-track', pm: 'Sarah Mitchell', update: 'Phase 2 market entry commenced. 3 new international partnerships signed. Southeast Asia trade mission completed.' },
      ],
    },
  ];
  const buGroups = selectedGroups ? allBuGroups.filter(g => selectedGroups.has(g.key)) : allBuGroups;

  const statusColors: Record<string, string> = {
    'on-track': 'text-green-700 bg-green-50 border-green-200',
    'alert': 'text-amber-700 bg-amber-50 border-amber-200',
    'off-track': 'text-red-700 bg-red-50 border-red-200',
  };
  const statusDots: Record<string, string> = {
    'on-track': 'bg-green-500',
    'alert': 'bg-amber-500',
    'off-track': 'bg-red-500',
  };

  return (
    <div className="space-y-4">
      {buGroups.map(group => (
        <div key={group.name} className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: group.bgColor, borderBottom: `2px solid ${group.color}20` }}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
            <span className="text-sm font-bold" style={{ color: group.color }}>{group.name}</span>
            <span className="ml-auto text-xs font-medium text-slate-500">{group.projects.length} projects</span>
          </div>
          <div className="divide-y divide-slate-100">
            {group.projects.map(proj => (
              <div key={proj.name} className="px-4 py-2.5 flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${statusDots[proj.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[#1a2456]">{proj.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColors[proj.status]}`}>
                      {proj.status === 'on-track' ? 'On Track' : proj.status === 'alert' ? 'Alert' : 'Off Track'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{proj.update}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PM: {proj.pm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExecSnapshotContent({ ngiSubmitted, selectedPortfolios }: { ngiSubmitted: boolean; selectedPortfolios?: Set<string> }) {
  const show = (key: string) => !selectedPortfolios || selectedPortfolios.has(key);

  const visibleGroups = PORTFOLIO_GROUPS.filter(pg => show(pg.key));
  const risks = [
    show('trade-corp') ? PORTFOLIO_RISKS['trade-corp'] : null,
    show('digital-uplift') ? PORTFOLIO_RISKS['digital-uplift'] : null,
    ngiSubmitted && show('trade-corp') ? 'NGI: Regulatory approval timeline extended +6 weeks — fast-track application submitted, residual risk MEDIUM.' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${visibleGroups.length === 1 ? 'grid-cols-1 max-w-xs' : visibleGroups.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {visibleGroups.map(pg => (
          <div key={pg.key} className="rounded-xl p-4 text-center border" style={{ backgroundColor: pg.bg, borderColor: pg.border }}>
            <p className="text-3xl font-black leading-none" style={{ color: pg.color }}>
              {pg.key === 'trade-corp' && ngiSubmitted ? 78 : pg.pct}<span className="text-lg">%</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide mt-1.5 mb-0.5" style={{ color: pg.color }}>{pg.snapTag}</p>
            <p className="text-[10px] text-slate-500">Reporting Compliance</p>
          </div>
        ))}
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-[#1a2456] px-4 py-2">
          <p className="text-xs font-bold text-white uppercase tracking-wide">Context This Cycle — March 2026</p>
        </div>
        <div className="divide-y divide-slate-100">
          {visibleGroups.map(pg => (
            <div key={pg.key} className="px-4 py-3 flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" style={{ color: pg.color, backgroundColor: pg.bg }}>{pg.snapContextTag}</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {PORTFOLIO_CONTEXT[pg.key]}{pg.key === 'trade-corp' && ngiSubmitted ? ' NGI Phase 2 market entry commenced successfully.' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {risks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-red-100 border-b border-red-200">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Key Risks Requiring Executive Attention</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                <span className="shrink-0 mt-0.5 font-bold">—</span>
                <span className="leading-relaxed">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Portfolio Summary</p>
        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-700">
          <span><strong className="text-[#1a2456]">{ngiSubmitted ? '10' : '9'}/11</strong> projects reporting</span>
          <span><strong className="text-green-700">4</strong> PMO approved</span>
          <span><strong className="text-amber-700">{ngiSubmitted ? '1' : '2'}</strong> submitted (pending review)</span>
          <span><strong className="text-slate-500">{ngiSubmitted ? '1' : '2'}</strong> awaiting submission</span>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewTabular() {
  const rows = [
    { name: 'Enterprise Security Services', status: 'On Track' },
    { name: 'Digital Workplace Transformation', status: 'Alert' },
    { name: 'Infrastructure Modernisation', status: 'On Track' },
  ];
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 text-[9px]">
      <div className="grid grid-cols-[2fr_3fr] bg-[#1a2456] text-white">
        <div className="px-2 py-1 font-bold">Project</div>
        <div className="px-2 py-1 font-bold border-l border-white/10">Status Narrative</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.name} className={`grid grid-cols-[2fr_3fr] ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
          <div className="px-2 py-1.5 font-semibold text-[#1a2456] border-b border-slate-100 leading-tight">{r.name}</div>
          <div className="px-2 py-1.5 border-b border-l border-slate-100 text-slate-500 leading-tight">
            <span className={`inline-block px-1 py-0.5 rounded text-[8px] font-bold mb-0.5 ${r.status === 'On Track' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
            <div className="bg-slate-200 h-1.5 rounded-full w-full mt-0.5" /><div className="bg-slate-200 h-1.5 rounded-full w-3/4 mt-0.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TemplatePreviewBUHead() {
  const groups = [
    { label: 'Digital Uplift Portfolio', color: '#0891b2', bg: '#e0f9ff', count: 4 },
    { label: 'Infrastructure Delivery', color: '#4f46e5', bg: '#f0f4ff', count: 2 },
    { label: 'Trade & Corporate', color: '#065f46', bg: '#ecfdf5', count: 4 },
  ];
  return (
    <div className="space-y-1.5 text-[9px]">
      {groups.map(g => (
        <div key={g.label} className="rounded-lg overflow-hidden border border-slate-200">
          <div className="px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: g.bg }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
            <span className="font-bold" style={{ color: g.color }}>{g.label}</span>
            <span className="ml-auto text-slate-400">{g.count} projects</span>
          </div>
          <div className="px-2 py-1.5 bg-white space-y-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <div className="bg-slate-200 h-1.5 rounded-full flex-1" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TemplatePreviewSnapshot() {
  return (
    <div className="space-y-2 text-[9px]">
      <div className="grid grid-cols-3 gap-1.5">
        {[{ label: 'Digital Uplift', pct: '75%', color: '#0891b2', bg: '#e0f9ff' }, { label: 'Infrastructure', pct: '100%', color: '#4f46e5', bg: '#f0f4ff' }, { label: 'Trade & Corp', pct: '67%', color: '#065f46', bg: '#ecfdf5' }].map(c => (
          <div key={c.label} className="rounded-lg p-2 text-center border" style={{ backgroundColor: c.bg }}>
            <div className="font-black text-base leading-none" style={{ color: c.color }}>{c.pct}</div>
            <div className="font-bold mt-0.5 leading-tight" style={{ color: c.color }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="bg-[#1a2456] px-2 py-1 text-white font-bold">Context · Mar 2026</div>
        {['Digital Uplift', 'Infrastructure', 'Trade & Corp'].map(tag => (
          <div key={tag} className="flex items-start gap-1.5 px-2 py-1.5 border-b border-slate-100">
            <span className="shrink-0 bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold">{tag}</span>
            <div className="flex-1 space-y-0.5"><div className="bg-slate-200 h-1.5 rounded-full w-full" /><div className="bg-slate-200 h-1.5 rounded-full w-4/5" /></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
        <div className="font-bold text-red-600 mb-1">Key Risks</div>
        {[1, 2].map(i => <div key={i} className="flex gap-1"><span className="text-red-400">—</span><div className="bg-red-200 h-1.5 rounded-full flex-1 mt-0.5" /></div>)}
      </div>
    </div>
  );
}

function RecipientPicker({ recipients, onChange }: {
  recipients: Executive[];
  onChange: (r: Executive[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const suggestions = EXECUTIVES.filter(e =>
    !recipients.some(r => r.id === e.id) &&
    (e.name.toLowerCase().includes(query.toLowerCase()) || e.title.toLowerCase().includes(query.toLowerCase()))
  );

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (exec: Executive) => {
    onChange([...recipients, exec]);
    setQuery('');
    inputRef.current?.focus();
  };

  const remove = (id: string) => {
    onChange(recipients.filter(r => r.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex flex-wrap gap-1.5 items-center min-h-[38px] px-2.5 py-1.5 rounded-lg border transition-colors cursor-text
          ${open ? 'border-[#2a9fd6] ring-1 ring-[#2a9fd6]' : 'border-slate-200 hover:border-slate-300'}`}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {recipients.map(r => (
          <span key={r.id} className="inline-flex items-center gap-1 bg-[#e0f0fb] text-[#1a5a8a] text-xs font-medium pl-2.5 pr-1.5 py-0.5 rounded-full">
            {r.name}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(r.id); }}
              className="w-3.5 h-3.5 rounded-full bg-[#bcd8ef] hover:bg-[#a0c8e5] text-[#1a5a8a] flex items-center justify-center text-[10px] font-bold leading-none"
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={recipients.length === 0 ? 'Type to search executives…' : ''}
          className="flex-1 min-w-[140px] text-xs text-slate-700 outline-none placeholder-slate-400 bg-transparent py-0.5"
        />
      </div>
      {open && (query.length > 0 || recipients.length === 0) && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
          {suggestions.map(exec => (
            <button
              key={exec.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(exec); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#eef4fb] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#1a2456] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {exec.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800">{exec.name}</div>
                <div className="text-[10px] text-slate-500">{exec.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.length > 0 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 px-4 py-3 text-xs text-slate-400 italic">
          No matching executives found.
        </div>
      )}
    </div>
  );
}

function ExecDownloadMenu({ template, projectCount }: { template: string; projectCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formats = [
    { label: 'PDF Document', ext: 'pdf' },
    { label: 'Word Document', ext: 'docx' },
    { label: 'PowerPoint Deck', ext: 'pptx' },
  ];

  const handleDownload = (ext: string) => {
    alert(`Downloading Exec Summary as ${ext.toUpperCase()}… (demo — export would be generated in production)`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[200px] z-20">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Export Format</p>
          </div>
          {formats.map(f => (
            <button
              key={f.ext}
              type="button"
              onClick={() => handleDownload(f.ext)}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <div>
                <div className="text-xs font-medium">{f.label}</div>
                <div className="text-[10px] text-slate-400">.{f.ext} · {projectCount} project{projectCount !== 1 ? 's' : ''} included</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ExecSummaryModal({ projects, onClose, onSent }: {
  projects: DashboardProject[];
  onClose: () => void;
  onSent: () => void;
}) {
  const { ngiSubmitted } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [template, setTemplate] = useState<SummaryTemplate>('tabular');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    new Set(projects.filter(p => p.reportingStatus === 'approved' || p.reportingStatus === 'sent').map(p => p.id))
  );
  const [selectedBUGroups, setSelectedBUGroups] = useState<Set<string>>(new Set(PORTFOLIO_GROUPS.map(pg => pg.key)));
  const [snapshotScope, setSnapshotScope] = useState<'all' | 'specific'>('all');
  const [specificSnapshotPortfolios, setSpecificSnapshotPortfolios] = useState<Set<string>>(new Set(PORTFOLIO_GROUPS.map(pg => pg.key)));
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [recipients, setRecipients] = useState<Executive[]>([]);

  const eligibleProjects = projects.filter(p =>
    p.reportingStatus === 'approved' || p.reportingStatus === 'sent' || (p.id === 'proj-1' && ngiSubmitted)
  );

  const rows = useMemo(() => {
    const base = EXEC_SUMMARY_ROWS.filter(r =>
      projects.some(p => p.name === r.project && selectedProjectIds.has(p.id))
    );
    if (ngiSubmitted && projects.some(p => p.id === 'proj-1' && selectedProjectIds.has('proj-1'))) {
      return [NGI_EXEC_ROW, ...base];
    }
    return base;
  }, [selectedProjectIds, projects, ngiSubmitted]);

  const canProceed = template === 'tabular'
    ? selectedProjectIds.size > 0
    : template === 'bu-head'
    ? selectedBUGroups.size > 0
    : snapshotScope === 'all' || specificSnapshotPortfolios.size > 0;

  const goToStep3 = () => {
    setStep(3);
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2400);
  };

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); onSent(); }, 1800);
  };

  const meta = TEMPLATE_META[template];

  const stepTitle = 'Generate Executive Summary';

  const toggleBU = (bu: string, set: Set<string>, setFn: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(bu)) next.delete(bu); else next.add(bu);
    setFn(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!generating && !sending ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#1a2456] px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#2a9fd6] font-black text-sm tracking-tight">✦ DotZ</span>
              <span className="text-white/25 mx-1">·</span>
              <span className="text-white font-semibold text-sm">{stepTitle}</span>
            </div>
            {!generating && !sending && (
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-lg leading-none">×</button>
            )}
          </div>
          {!sent && (
            <div className="flex items-center gap-2 mt-2.5">
              {([1, 2, 3] as const).map((s, i) => (
                <React.Fragment key={s}>
                  <span className={`text-[11px] transition-colors font-medium ${s === step ? 'text-[#2a9fd6]' : s < step ? 'text-white/40' : 'text-white/20'}`}>
                    {s < step ? '✓' : STEP_LABELS[i]}
                  </span>
                  {s < 3 && <span className="text-white/15 text-xs">›</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── STEP 1: Template selection ── */}
          {step === 1 && (
            <div className="flex" style={{ minHeight: 380 }}>
              {/* Left nav */}
              <div className="w-52 shrink-0 border-r border-slate-100 py-3 px-2 space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-3 pb-1.5">Templates</p>
                {(Object.keys(TEMPLATE_META) as SummaryTemplate[]).map(tid => {
                  const m = TEMPLATE_META[tid];
                  const active = template === tid;
                  return (
                    <button
                      key={tid}
                      onClick={() => setTemplate(tid)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-[#1a2456] shadow-sm' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`text-xs font-semibold leading-snug ${active ? 'text-white' : 'text-slate-800'}`}>{m.label}</div>
                      <div className={`text-[10px] mt-0.5 ${active ? 'text-white/55' : 'text-slate-400'}`}>Generated {m.usageCount} times</div>
                    </button>
                  );
                })}
              </div>

              {/* Right: preview + description */}
              <div className="flex-1 flex flex-col gap-4 p-5">
                <div>
                  <p className="text-sm font-bold text-[#1a2456]">{meta.label}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{meta.description}</p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400 font-semibold">Best for:</span>
                    <span className="text-[#2a9fd6] font-semibold">{meta.bestFor}</span>
                  </div>
                </div>

                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-3 overflow-hidden">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2">Output preview</p>
                  {template === 'tabular' && <TemplatePreviewTabular />}
                  {template === 'bu-head' && <TemplatePreviewBUHead />}
                  {template === 'exec-snapshot' && <TemplatePreviewSnapshot />}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2 rounded-lg bg-[#2a9fd6] hover:bg-[#2490c5] text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
                  >
                    Next <span className="text-base leading-none opacity-80">›</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Configure ── */}
          {step === 2 && (
            <div className="p-5 space-y-4">

              {/* Tabular: select projects */}
              {template === 'tabular' && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-0.5">Select projects to include</p>
                  <p className="text-xs text-slate-400 mb-3">Only approved and submitted reports are available for inclusion</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {eligibleProjects.map(p => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                          ${selectedProjectIds.has(p.id) ? 'border-[#2a9fd6] bg-[#eef4fb]' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.has(p.id)}
                          onChange={e => {
                            const next = new Set(selectedProjectIds);
                            if (e.target.checked) next.add(p.id); else next.delete(p.id);
                            setSelectedProjectIds(next);
                          }}
                          className="rounded accent-[#2a9fd6] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-800 truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.projectManager}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedProjectIds.size > 0 && (
                    <p className="text-[10px] text-slate-400 mt-2">{selectedProjectIds.size} of {eligibleProjects.length} projects selected</p>
                  )}
                </div>
              )}

              {/* BU Head: select portfolio areas */}
              {template === 'bu-head' && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-0.5">Select portfolio areas to include</p>
                  <p className="text-xs text-slate-400 mb-3">DotZ will generate a grouped summary for each selected portfolio</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PORTFOLIO_GROUPS.map(pg => (
                      <label
                        key={pg.key}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                          ${selectedBUGroups.has(pg.key) ? 'border-[#2a9fd6] bg-[#eef4fb]' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBUGroups.has(pg.key)}
                          onChange={() => toggleBU(pg.key, selectedBUGroups, setSelectedBUGroups)}
                          className="rounded accent-[#2a9fd6] shrink-0"
                        />
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pg.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800">{pg.label}</div>
                          <div className="text-[10px] text-slate-400">{pg.projectCount} projects</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Exec Snapshot: scope selection */}
              {template === 'exec-snapshot' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">Scope of snapshot</p>
                    <p className="text-xs text-slate-400 mb-3">Choose whether to cover the full portfolio or focus on specific areas</p>
                    <div className="space-y-1.5">
                      {([
                        { value: 'all', label: 'Full portfolio', sub: 'All portfolio areas included — recommended for exec-level briefings' },
                        { value: 'specific', label: 'Specific portfolio areas', sub: 'Focus the snapshot on selected areas only' },
                      ] as const).map(opt => (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                            ${snapshotScope === opt.value ? 'border-[#2a9fd6] bg-[#eef4fb]' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <input
                            type="radio"
                            name="snapshot-scope"
                            value={opt.value}
                            checked={snapshotScope === opt.value}
                            onChange={() => setSnapshotScope(opt.value)}
                            className="mt-0.5 accent-[#2a9fd6]"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{opt.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {snapshotScope === 'specific' && (
                    <div className="grid grid-cols-1 gap-1.5">
                      {PORTFOLIO_GROUPS.map(pg => (
                        <label
                          key={pg.key}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                            ${specificSnapshotPortfolios.has(pg.key) ? 'border-[#2a9fd6] bg-[#eef4fb]' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={specificSnapshotPortfolios.has(pg.key)}
                            onChange={() => toggleBU(pg.key, specificSnapshotPortfolios, setSpecificSnapshotPortfolios)}
                            className="rounded accent-[#2a9fd6] shrink-0"
                          />
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pg.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-800">{pg.label}</div>
                            <div className="text-[10px] text-slate-400">{pg.projectCount} projects</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                >
                  ‹ Back
                </button>
                <button
                  onClick={goToStep3}
                  disabled={!canProceed}
                  className="px-5 py-2 rounded-lg bg-[#2a9fd6] hover:bg-[#2490c5] text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  ✦ Generate with DotZ
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Preview + Send ── */}
          {step === 3 && !sent && (
            <div className="p-5 space-y-4">
              {generating ? (
                <div className="flex flex-col items-center py-16 gap-5">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#2a9fd6]/20" />
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#2a9fd6] border-t-transparent animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">DotZ is compiling your summary…</p>
                    <p className="text-xs text-slate-400 mt-1">Applying {meta.label} · normalising dates · extracting key risks</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Generated Summary</p>
                      <p className="text-xs text-slate-400 mt-0.5">{meta.label} · March 2026</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#2a9fd6] bg-[#e0f0fb] px-2.5 py-1 rounded-full flex items-center gap-1">
                      ✦ DotZ AI
                    </span>
                  </div>

                  {template === 'tabular' && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#1a2456] text-white">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold w-[35%]">Project / Program</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold">Status Narrative</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={row.project} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="px-4 py-3 align-top text-xs font-semibold text-[#1a2456] leading-snug border-b border-slate-100">{row.project}</td>
                              <td className="px-4 py-3 align-top text-xs text-slate-700 leading-relaxed border-b border-slate-100">
                                <p>{row.summary}</p>
                                {row.risks.length > 0 && (
                                  <>
                                    <p className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Key Risks &amp; Challenges</p>
                                    {row.risks.map((r, ri) => <p key={ri} className="text-xs text-slate-600">— {r}</p>)}
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {template === 'bu-head' && <BUHeadContent rows={rows} selectedGroups={selectedBUGroups} />}
                  {template === 'exec-snapshot' && (
                    <ExecSnapshotContent
                      ngiSubmitted={ngiSubmitted}
                      selectedPortfolios={snapshotScope === 'specific' ? specificSnapshotPortfolios : undefined}
                    />
                  )}

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Send to <span className="text-red-400">*</span>
                      </label>
                      <RecipientPicker recipients={recipients} onChange={setRecipients} />
                      {recipients.length === 0 && (
                        <p className="text-[10px] text-amber-600 mt-1.5">At least one recipient is required to send.</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setStep(2); setGenerated(false); }}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                      >
                        ‹ Back
                      </button>
                      <div className="flex items-center gap-2">
                        <ExecDownloadMenu template={template} projectCount={rows.length || selectedProjectIds.size} />
                        <button
                          onClick={handleSend}
                          disabled={sending || recipients.length === 0}
                          className="px-5 py-2 rounded-lg bg-[#1a2456] hover:bg-[#232f6b] text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {sending
                            ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                            : <><SendUpIcon /> Send to Executive</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── SENT confirmation ── */}
          {sent && (
            <div className="py-12 px-5 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <p className="text-lg font-bold text-slate-800">Summary sent</p>
              <p className="text-sm text-slate-500 mt-1">
                {recipients.length === 1
                  ? `${recipients[0].name} has been notified with the March 2026 portfolio summary.`
                  : `${recipients.length} recipients have been notified with the March 2026 portfolio summary.`}
              </p>
              <div className="mt-4 inline-block bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-xs text-slate-600 text-left">
                <p>✉ Sent to: <strong>{recipients.map(r => r.email).join(', ')}</strong></p>
                <p className="mt-1">📎 Format: {meta.label} · {rows.length || 'All'} projects covered</p>
                <p className="mt-1">⏱ Sent: {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <button onClick={onClose} className="mt-5 px-5 py-2 rounded-lg bg-[#1a2456] text-white text-sm font-semibold hover:bg-[#232f6b] transition-colors">
                Back to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function NotifToast({ project, onDismiss, onView }: {
  project: DashboardProject;
  onDismiss: () => void;
  onView: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 12000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-in">
      <div className="h-1 bg-gradient-to-r from-[#2a9fd6] to-[#1a2456]" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-base shrink-0 mt-0.5">📥</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">New Report Submitted</p>
            <p className="text-xs text-slate-600 mt-0.5">{project.projectManager} has submitted the March 2026 PSR for <strong>{project.name}</strong>.</p>
            <div className="flex gap-2 mt-2.5">
              <button onClick={onView} className="px-3 py-1.5 rounded-lg bg-[#2a9fd6] text-white text-xs font-semibold hover:bg-[#2490c5] transition-colors">
                View Report
              </button>
              <button onClick={onDismiss} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PMODashboard() {
  const { ngiSubmitted, markExecutiveSent } = useAppState();
  const [projects, setProjects] = useState(() => getPMOProjects(ngiSubmitted));
  const [showToast, setShowToast] = useState(false);
  const [toastShown, setToastShown] = useState(ngiSubmitted);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReportingStatus | 'all'>('all');
  const [filterBU, setFilterBU] = useState('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingProject, setViewingProject] = useState<DashboardProject | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [showExec, setShowExec] = useState(false);
  const [approvedToast, setApprovedToast] = useState<string | null>(null);

  useEffect(() => {
    if (ngiSubmitted) {
      setProjects(getPMOProjects(true));
      if (!toastShown) {
        setToastShown(true);
        setTimeout(() => setShowToast(true), 800);
      }
    }
  }, [ngiSubmitted, toastShown]);

  useEffect(() => {
    if (approvedToast) {
      const t = setTimeout(() => setApprovedToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [approvedToast]);

  const businessUnits = useMemo(() => {
    const all = Array.from(new Set(projects.map(p => p.businessUnit)));
    return all.sort();
  }, [projects]);

  const filteredSorted = useMemo(() => {
    let result = projects.filter(p => {
      if (filterStatus !== 'all' && p.reportingStatus !== filterStatus) return false;
      if (filterBU !== 'all' && p.businessUnit !== filterBU) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.projectManager.toLowerCase().includes(q) &&
          !p.businessUnit.toLowerCase().includes(q) && !p.program.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    result = result.sort((a, b) => {
      let av = '', bv = '';
      if (sortField === 'name') { av = a.name; bv = b.name; }
      else if (sortField === 'pm') { av = a.projectManager; bv = b.projectManager; }
      else if (sortField === 'businessUnit') { av = a.businessUnit; bv = b.businessUnit; }
      else if (sortField === 'status') {
        const diff = STATUS_ORDER[a.reportingStatus] - STATUS_ORDER[b.reportingStatus];
        return sortDir === 'asc' ? diff : -diff;
      }
      else if (sortField === 'submittedAt') { av = a.submittedAt || ''; bv = b.submittedAt || ''; }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [projects, filterStatus, filterBU, search, sortField, sortDir]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ label: null, items: filteredSorted }];
    const map = new Map<string, DashboardProject[]>();
    for (const p of filteredSorted) {
      const key = groupBy === 'businessUnit' ? p.businessUnit
        : groupBy === 'program' ? p.program
        : p.projectManager;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items })).sort((a, b) => a.label!.localeCompare(b.label!));
  }, [filteredSorted, groupBy]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selectedIds.size === filteredSorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredSorted.map(p => p.id)));
  };

  const handleApprove = useCallback((id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, reportingStatus: 'approved' as ReportingStatus, approvedAt: '24/03/2026' } : p));
    setViewingProject(prev => prev && prev.id === id ? { ...prev, reportingStatus: 'approved', approvedAt: '24/03/2026' } : prev);
    setApprovedToast('Report approved successfully.');
  }, []);

  const reminderTargets = useMemo(() => {
    if (selectedIds.size > 0) return filteredSorted.filter(p => selectedIds.has(p.id));
    return filteredSorted.filter(p => p.reportingStatus === 'notified' || p.reportingStatus === 'clicked');
  }, [selectedIds, filteredSorted]);

  const pendingExecCount = useMemo(() => projects.filter(p => p.reportingStatus === 'approved' || p.reportingStatus === 'sent').length, [projects]);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={`ml-1 text-[10px] ${sortField === field ? 'text-[#2a9fd6]' : 'text-slate-300'}`}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-100">
      <LeftNav />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Sub-header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h1 className="text-base font-bold text-[#1a2456]">Reporting Compliance Monitor</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring {projects.length} projects · Deadline: <span className="font-medium text-slate-700">Wednesday, 8 April 2026</span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-[#2a9fd6] font-medium">March 2026</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {ngiSubmitted && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                New submission received
              </div>
            )}
            <button
              onClick={() => setShowExec(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a2456] hover:bg-[#232f6b] text-white text-xs font-semibold transition-colors"
            >
              ✦ Generate Exec Summary
              {pendingExecCount > 0 && (
                <span className="bg-[#2a9fd6] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingExecCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Pipeline stats */}
          <PipelineBar projects={projects} filterStatus={filterStatus} onFilter={setFilterStatus} />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects, managers, programs…"
                className="flex-1 text-sm text-slate-700 outline-none placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={filterBU}
                onChange={e => setFilterBU(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#2a9fd6]"
              >
                <option value="all">All Business Units</option>
                {businessUnits.map(bu => <option key={bu} value={bu}>{bu}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as ReportingStatus | 'all')}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#2a9fd6]"
              >
                <option value="all">All Statuses</option>
                {(Object.keys(STATUS_LABELS) as ReportingStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as GroupBy)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#2a9fd6]"
              >
                <option value="none">No Grouping</option>
                <option value="businessUnit">Group by Business Unit</option>
                <option value="program">Group by Program</option>
                <option value="pm">Group by Project Manager</option>
              </select>
            </div>
            {(selectedIds.size > 0 || reminderTargets.length > 0) && (
              <button
                onClick={() => setShowReminder(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
              >
                <BellSendIcon />
                Send Reminder{selectedIds.size > 0 ? ` (${selectedIds.size})` : ` (${reminderTargets.length})`}
              </button>
            )}
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredSorted.length && filteredSorted.length > 0}
                      onChange={toggleAll}
                      className="rounded accent-[#2a9fd6]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800" onClick={() => toggleSort('name')}>
                    Project<SortIcon field="name" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800" onClick={() => toggleSort('pm')}>
                    Project Manager<SortIcon field="pm" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800" onClick={() => toggleSort('businessUnit')}>
                    Business Unit<SortIcon field="businessUnit" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800" onClick={() => toggleSort('status')}>
                    Status<SortIcon field="status" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800" onClick={() => toggleSort('submittedAt')}>
                    Submitted<SortIcon field="submittedAt" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Overall</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(({ label, items }) => (
                  <React.Fragment key={label || 'all'}>
                    {label && (
                      <tr>
                        <td colSpan={9} className="px-4 py-2 bg-slate-50 border-y border-slate-200">
                          <span className="text-xs font-bold text-[#1a2456] uppercase tracking-wide">{label}</span>
                          <span className="ml-2 text-xs text-slate-500">({items.length})</span>
                        </td>
                      </tr>
                    )}
                    {items.map(p => (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-100 transition-colors
                          ${selectedIds.has(p.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}
                          ${p.id === 'proj-1' && ngiSubmitted ? 'ring-1 ring-inset ring-green-300' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded accent-[#2a9fd6]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {p.id === 'proj-1' && ngiSubmitted && (
                              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Recently submitted" />
                            )}
                            {(p.reportingStatus === 'submitted' || p.reportingStatus === 'approved' || p.reportingStatus === 'sent') ? (
                              <button
                                onClick={() => setViewingProject(p)}
                                className="text-sm font-medium text-[#1a2456] hover:text-[#2a9fd6] hover:underline text-left"
                              >{p.name}</button>
                            ) : (
                              <span className="text-sm text-slate-700">{p.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.projectManager}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.businessUnit}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{p.program}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.reportingStatus} /></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{p.submittedAt || '—'}</td>
                        <td className="px-4 py-3"><OverallBadge status={p.overallStatus} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {(p.reportingStatus === 'submitted' || p.reportingStatus === 'approved' || p.reportingStatus === 'sent') && (
                              <button
                                onClick={() => setViewingProject(p)}
                                title="View Report"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#e0f0fb] text-[#2a9fd6] hover:bg-[#c8e4f4] transition-colors"
                              >
                                <EyeIcon />
                              </button>
                            )}
                            {p.reportingStatus === 'submitted' && (
                              <button
                                onClick={() => handleApprove(p.id)}
                                title="Approve Report"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              >
                                <CheckIcon />
                              </button>
                            )}
                            {(p.reportingStatus === 'notified' || p.reportingStatus === 'clicked') && (
                              <button
                                onClick={() => { setSelectedIds(new Set([p.id])); setShowReminder(true); }}
                                title="Send Nudge"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                              >
                                <BellSendIcon />
                              </button>
                            )}
                            {(p.reportingStatus === 'approved') && (
                              <button
                                onClick={() => setShowExec(true)}
                                title="Send to Executive"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#e8ecf8] text-[#1a2456] hover:bg-[#d8def2] transition-colors"
                              >
                                <SendUpIcon />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {filteredSorted.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No projects match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">{filteredSorted.length} of {projects.length} projects shown</span>
              {selectedIds.size > 0 && (
                <span className="text-xs text-[#2a9fd6] font-medium">{selectedIds.size} selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approved toast */}
      {approvedToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium">
          <span>✓</span> {approvedToast}
        </div>
      )}

      {/* Submission notification toast */}
      {showToast && (
        <NotifToast
          project={projects.find(p => p.id === 'proj-1')!}
          onDismiss={() => setShowToast(false)}
          onView={() => {
            setShowToast(false);
            setViewingProject(projects.find(p => p.id === 'proj-1') || null);
          }}
        />
      )}

      {/* Report slide-over */}
      {viewingProject && (
        <ReportSlideOver
          project={viewingProject}
          onClose={() => setViewingProject(null)}
          onApprove={() => handleApprove(viewingProject.id)}
        />
      )}

      {/* Reminder modal */}
      {showReminder && (
        <ReminderModal
          projects={reminderTargets.length > 0 ? reminderTargets : filteredSorted.filter(p => selectedIds.has(p.id))}
          onClose={() => { setShowReminder(false); setSelectedIds(new Set()); }}
        />
      )}

      {/* Exec summary modal */}
      {showExec && (
        <ExecSummaryModal
          projects={projects}
          onClose={() => setShowExec(false)}
          onSent={() => { markExecutiveSent(); }}
        />
      )}
    </div>
  );
}
