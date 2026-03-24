import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppState } from '../context/AppState';
import { PSRReport } from '../components/PSRReport';
import { ProfileSwitcher } from '../components/ProfileSwitcher';
import {
  getPMOProjects, getPipelineStats, EXEC_SUMMARY_ROWS, NGI_EXEC_ROW,
  type DashboardProject, type ReportingStatus,
} from '../data/pmoDashboardData';

type SortField = 'name' | 'pm' | 'businessUnit' | 'status' | 'submittedAt';
type GroupBy = 'none' | 'businessUnit' | 'program' | 'pm';

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

function PipelineBar({ projects, filterStatus, onFilter }: {
  projects: DashboardProject[];
  filterStatus: string;
  onFilter: (s: ReportingStatus | 'all') => void;
}) {
  const stats = getPipelineStats(projects);
  const stages: { key: ReportingStatus | 'all'; label: string; count: number; color: string }[] = [
    { key: 'notified', label: 'Email Notified', count: stats.notified, color: 'border-slate-300 hover:border-slate-400' },
    { key: 'clicked', label: 'CTA Clicked', count: stats.clicked, color: 'border-blue-300 hover:border-blue-400' },
    { key: 'submitted', label: 'Report Submitted', count: stats.submitted, color: 'border-amber-300 hover:border-amber-400' },
    { key: 'approved', label: 'PMO Approved', count: stats.approved, color: 'border-green-300 hover:border-green-400' },
    { key: 'sent', label: 'Sent to Executive', count: stats.sent, color: 'border-teal-400 hover:border-teal-500' },
  ];
  return (
    <div className="flex items-stretch gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {stages.map((stage, i) => {
        const isActive = filterStatus === stage.key;
        const pct = Math.round((stage.count / stats.total) * 100);
        return (
          <button
            key={stage.key}
            onClick={() => onFilter(isActive ? 'all' : stage.key as ReportingStatus)}
            className={`flex-1 flex flex-col items-center px-3 py-3 text-center transition-all border-b-4 relative
              ${isActive ? 'bg-[#eef4fb] border-[#2a9fd6]' : 'border-transparent hover:bg-slate-50 ' + stage.color}
              ${i > 0 ? 'border-l border-l-slate-100' : ''}`}
          >
            <span className="text-2xl font-bold text-[#1a2456]">{stage.count}</span>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">{stage.label}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{pct}% of portfolio</span>
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
            <p className="text-xs text-[#8aaccc]">Report Draft — Q1 2026</p>
            <p className="text-white font-semibold text-sm">{project.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {project.reportingStatus === 'submitted' && (
              <button
                onClick={onApprove}
                className="px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
              >
                ✓ Approve Report
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
                <div className="text-xs text-slate-500">Subject: <span className="text-slate-700 font-medium">Friendly Reminder — Q1 2026 PSR Due 8 Apr 2026</span></div>
                <div className="border-t border-slate-200 pt-2 text-slate-600 text-xs leading-relaxed">
                  <p>Hi {projects.length === 1 ? projects[0].projectManager.split(' ')[0] : '[Name]'},</p>
                  <p className="mt-2">Just a friendly nudge — your Q1 2026 Project Status Report
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

function ExecSummaryModal({ projects, onClose, onSent }: {
  projects: DashboardProject[];
  onClose: () => void;
  onSent: () => void;
}) {
  const { ngiSubmitted } = useAppState();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(projects.filter(p => p.reportingStatus === 'approved' || p.reportingStatus === 'sent').map(p => p.id))
  );
  const [showPrompt, setShowPrompt] = useState(false);

  const rows = useMemo(() => {
    const base = EXEC_SUMMARY_ROWS.filter(r =>
      projects.some(p => p.name === r.project && selectedIds.has(p.id))
    );
    if (ngiSubmitted && projects.some(p => p.id === 'proj-1' && selectedIds.has('proj-1'))) {
      return [NGI_EXEC_ROW, ...base];
    }
    return base;
  }, [selectedIds, projects, ngiSubmitted]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2800);
  };

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); onSent(); }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!generating && !sending ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#1a2456] px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">AI Executive Summary — Q1 2026</h2>
              <p className="text-[#8aaccc] text-xs mt-0.5">Portfolio Report · StrategyDotZero PMO Intelligence</p>
            </div>
            {!generating && (
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-lg">×</button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!generated ? (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Select projects to include:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {projects.filter(p => p.reportingStatus === 'approved' || p.reportingStatus === 'sent' ||
                    (p.id === 'proj-1' && ngiSubmitted)).map(p => (
                    <label key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={e => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) next.add(p.id);
                          else next.delete(p.id);
                          setSelectedIds(next);
                        }}
                        className="rounded accent-[#2a9fd6]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.projectManager}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <button
                  className="flex items-center gap-1.5 text-xs text-[#2a9fd6] hover:underline"
                  onClick={() => setShowPrompt(s => !s)}
                >
                  <span>{showPrompt ? '▼' : '▶'}</span> AI Prompt Template
                </button>
                {showPrompt && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
{`Transform portfolio PSR data into a clean 2-column executive table:
- Column 1: Project / Program (bold)
- Column 2: Status — 30–40 word summary using ONLY status text (no risks), then blank line, then KEY RISKS & CHALLENGES with hyphen bullets.

Rules: Extract risks ONLY when a dependency verb (awaiting, pending, requires, blocked) AND a decision noun (approval, PO, contract, budget transfer) appear together. Normalise all dates to DD MMM YY. Keep writing concise and professional.`}
                  </div>
                )}
              </div>

              {generating ? (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-10 h-10 border-3 border-[#2a9fd6] border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Dotz is compiling your executive summary…</p>
                    <p className="text-xs text-slate-500 mt-1">Applying PMO prompt template · normalising dates · extracting risks</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={selectedIds.size === 0}
                    className="px-5 py-2 rounded-lg bg-[#2a9fd6] hover:bg-[#2490c5] text-white text-sm font-semibold transition-colors disabled:opacity-40"
                  >
                    ✦ Generate Summary ({selectedIds.size} projects)
                  </button>
                </div>
              )}
            </>
          ) : !sent ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Generated Executive Summary</p>
                  <p className="text-xs text-slate-500">Ready for review and dispatch · {rows.length} projects included</p>
                </div>
                <span className="text-xs text-[#2a9fd6] bg-[#e0f0fb] px-2 py-0.5 rounded-full font-medium">AI Generated</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2456] text-white">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold w-[35%]">Project / Program</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold">Status</th>
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
                              {row.risks.map((r, ri) => (
                                <p key={ri} className="text-xs text-slate-600">— {r}</p>
                              ))}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  To: <span className="font-medium text-slate-700">Margaret Chen, Executive Director</span>
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-5 py-2 rounded-lg bg-[#1a2456] hover:bg-[#232f6b] text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                  ) : '📤 Send to Executive'}
                </button>
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-3xl">✓</span>
              </div>
              <p className="text-lg font-bold text-slate-800">Executive Summary Sent</p>
              <p className="text-sm text-slate-500 mt-1">Margaret Chen (Executive Director) has been notified with the Q1 2026 portfolio summary.</p>
              <div className="mt-4 inline-block bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-xs text-slate-600 text-left">
                <p>✉ Sent to: <strong>margaret.chen@strategydotzero.gov</strong></p>
                <p className="mt-1">📎 Attachments: Q1 2026 Executive Summary · {rows.length} Project Status Reports</p>
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
            <p className="text-xs text-slate-600 mt-0.5">{project.projectManager} has submitted the Q1 2026 PSR for <strong>{project.name}</strong>.</p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={onView}
                className="px-3 py-1.5 rounded-lg bg-[#2a9fd6] text-white text-xs font-semibold hover:bg-[#2490c5] transition-colors"
              >
                View Report
              </button>
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-100">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1a2456] border-b border-[#0f1740] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#2a9fd6] flex items-center justify-center text-white text-xs font-bold">S</div>
          <span className="text-white text-sm font-semibold">StrategyDotZero</span>
          <span className="text-[#6cb4e4] text-sm">/ PMO Intelligence</span>
          <span className="text-[#6cb4e4]">/</span>
          <span className="text-white text-sm">Compliance Dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2a9fd6] bg-opacity-20 border border-[#2a9fd6] border-opacity-40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2a9fd6]" />
            <span className="text-[11px] text-[#6cb4e4] font-medium">Q1 2026 · 01 Jan – 31 Mar 2026</span>
          </div>
          <ProfileSwitcher currentRole="pmo" />
        </div>
      </div>

      {/* Page header */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-[#1a2456]">Reporting Compliance Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring {projects.length} projects · Deadline: <span className="font-medium text-slate-700">Wednesday, 8 April 2026</span>
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
            <span className="text-slate-400 text-sm">🔍</span>
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
              📣 Send Reminder{selectedIds.size > 0 ? ` (${selectedIds.size})` : ` (${reminderTargets.length})`}
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
                              className="px-2.5 py-1 rounded-lg bg-[#e0f0fb] text-[#2a9fd6] text-[11px] font-semibold hover:bg-[#c8e4f4] transition-colors"
                            >View</button>
                          )}
                          {p.reportingStatus === 'submitted' && (
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-[11px] font-semibold hover:bg-green-200 transition-colors"
                            >Approve</button>
                          )}
                          {(p.reportingStatus === 'notified' || p.reportingStatus === 'clicked') && (
                            <button
                              onClick={() => { setSelectedIds(new Set([p.id])); setShowReminder(true); }}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-semibold hover:bg-amber-200 transition-colors"
                            >Nudge</button>
                          )}
                          {(p.reportingStatus === 'approved') && (
                            <button
                              onClick={() => setShowExec(true)}
                              className="px-2.5 py-1 rounded-lg bg-[#e8ecf8] text-[#1a2456] text-[11px] font-semibold hover:bg-[#d8def2] transition-colors"
                            >↑ Exec</button>
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
