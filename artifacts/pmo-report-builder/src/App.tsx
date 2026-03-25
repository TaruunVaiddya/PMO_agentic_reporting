import React, { useState, useCallback } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { ReportPanel } from './components/ReportPanel';
import { LeftNav } from './components/LeftNav';
import { useAppState } from './context/AppState';
import { PROJECTS } from './data/mockData';
import type { PSRReportData } from './types';

export default function App() {
  const { markNGISubmitted } = useAppState();
  const [selectedProjectId, setSelectedProjectId] = useState(PROJECTS[0].id);
  const [currentReport, setCurrentReport] = useState<PSRReportData>({ ...PROJECTS[0].currentReport });
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedProject = PROJECTS.find(p => p.id === selectedProjectId) || PROJECTS[0];

  const handleProjectSelect = useCallback((projectId: string) => {
    const proj = PROJECTS.find(p => p.id === projectId);
    if (proj) {
      setSelectedProjectId(projectId);
      setCurrentReport({ ...proj.currentReport });
      setUpdatedFields(new Set());
      setIsComplete(false);
    }
  }, []);

  const handleReportUpdate = useCallback((data: Partial<PSRReportData>, fields: string[]) => {
    setCurrentReport(prev => ({ ...prev, ...data }));
    setUpdatedFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => next.add(f));
      return next;
    });
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    setUpdatedFields(prev => {
      const next = new Set(prev);
      ['overallStatusSummary', 'keyAchievements', 'plannedActivities', 'overallStatus',
        'status_dependency', 'status_issues', 'status_resource', 'status_benefits',
        'status_risks', 'status_budget', 'status_scope', 'status_schedule',
        'financial_capex', 'financial_opex', 'financial_total',
        'reportDate', 'risks', 'milestones'
      ].forEach(f => next.add(f));
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    if (selectedProjectId === PROJECTS[0].id) {
      markNGISubmitted();
    }
  }, [selectedProjectId, markNGISubmitted]);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-100">
      <LeftNav />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Sub-header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h1 className="text-sm font-bold text-[#1a2456]">Report Builder</h1>
            <p className="text-[10px] text-slate-500">March 2026 · PSR due 8 April 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-500">Project:</span>
            <select
              value={selectedProjectId}
              onChange={e => handleProjectSelect(e.target.value)}
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2a9fd6]"
            >
              {PROJECTS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4fb] border border-[#c8def0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2a9fd6]" />
              <span className="text-[11px] text-[#2a9fd6] font-medium">Mar 2026 · 01 Mar – 31 Mar 2026</span>
            </div>
          </div>
        </div>

        {/* Main split panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-[340px] min-w-[300px] max-w-[400px] flex flex-col border-r border-slate-200 shrink-0">
            <ChatPanel
              project={selectedProject}
              allProjects={PROJECTS}
              onProjectSelect={handleProjectSelect}
              onReportUpdate={handleReportUpdate}
              onComplete={handleComplete}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <ReportPanel
              project={selectedProject}
              currentReport={currentReport}
              updatedFields={updatedFields}
              isComplete={isComplete}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>

      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-[#1a2456] mb-2">Report Submitted!</h2>
            <p className="text-slate-600 text-sm mb-1">
              Your March 2026 PSR for <strong>{selectedProject.name}</strong> has been submitted to the PMO.
            </p>
            <p className="text-slate-500 text-xs mb-6">
              The PMO has been notified and will review your draft shortly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 rounded-xl bg-[#1a2456] text-white text-sm font-semibold hover:bg-[#232f6b] transition-colors"
            >
              Back to Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
