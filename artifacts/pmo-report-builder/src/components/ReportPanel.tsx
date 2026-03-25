import React, { useState, useRef } from 'react';
import type { Project, PSRReportData } from '../types';
import { PSRReport } from './PSRReport';

interface ReportPanelProps {
  project: Project;
  currentReport: PSRReportData;
  updatedFields: Set<string>;
  isComplete: boolean;
  onSubmit: () => void;
}

type DownloadFormat = 'pdf' | 'word' | 'pptx';

function SubmitBar({ onSubmit }: { onSubmit: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit();
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border-t border-emerald-200 px-6 py-4 flex items-center justify-center gap-3">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-sm font-semibold text-emerald-700">Report submitted to PMO!</p>
          <p className="text-xs text-emerald-600">The PMO team has been notified. You'll receive a confirmation email shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between gap-3">
      <p className="text-xs text-slate-500">Review the report above, then submit to the PMO or download.</p>
      <div className="flex items-center gap-2 shrink-0">
        <DownloadMenu />
        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded-lg bg-[#1a2456] text-white text-sm font-semibold hover:bg-[#2a9fd6] transition-colors"
        >
          Submit to PMO →
        </button>
      </div>
    </div>
  );
}

function DownloadMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formats: Array<{ fmt: DownloadFormat; label: string; icon: string }> = [
    { fmt: 'pdf', label: 'Download as PDF', icon: '📄' },
    { fmt: 'word', label: 'Download as Word', icon: '📝' },
    { fmt: 'pptx', label: 'Download as PowerPoint', icon: '📊' },
  ];

  const handleDownload = (fmt: DownloadFormat) => {
    // Simulated download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `PSR_Q1_2026.${fmt === 'word' ? 'docx' : fmt}`;
    alert(`Downloading as ${fmt.toUpperCase()}... (This is a demo — export functionality would be wired in production)`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
      >
        <span>⬇</span> Download
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[200px] z-10">
          {formats.map(({ fmt, label, icon }) => (
            <button
              key={fmt}
              onClick={() => handleDownload(fmt)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportPanel({ project, currentReport, updatedFields, isComplete, onSubmit }: ReportPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { label: 'Current Report — Mar 2026', isCurrent: true },
    ...project.pastReports.map(r => ({ label: r.label, isCurrent: false })),
  ];

  const activeData = activeTab === 0 ? currentReport : project.pastReports[activeTab - 1]?.data;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-200 bg-white px-4 pt-3 shrink-0 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`
              px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap mr-1
              ${activeTab === i
                ? 'border-[#2a9fd6] text-[#2a9fd6]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }
              ${i === 0 ? 'flex items-center gap-1.5' : ''}
            `}
          >
            {i === 0 && (
              <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            )}
            {tab.label}
          </button>
        ))}

        <div className="ml-auto pl-4 pb-1 shrink-0 flex items-center gap-2">
          {activeTab === 0 && (
            <span className="text-xs text-slate-400 italic">
              {isComplete ? '✅ Ready to submit' : '⏳ In progress...'}
            </span>
          )}
          {activeTab > 0 && (
            <span className="text-xs text-slate-400">Past report — read only</span>
          )}
        </div>
      </div>

      {/* Tab hint for past reports */}
      {activeTab > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 shrink-0">
          <p className="text-xs text-blue-600">
            📋 This is your <strong>{tabs[activeTab].label}</strong> report — for reference only. Switch back to "Current Report" to continue filling in March 2026.
          </p>
        </div>
      )}

      {/* Report content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeData ? (
          <PSRReport
            data={activeData}
            isBlank={activeTab === 0 && !isComplete}
            updatedFields={activeTab === 0 ? updatedFields : undefined}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>No report data available.</p>
          </div>
        )}
      </div>

      {/* Submit bar — only on current tab when complete */}
      {activeTab === 0 && isComplete && (
        <SubmitBar onSubmit={onSubmit} />
      )}

      {/* Progress indicator when in progress */}
      {activeTab === 0 && !isComplete && updatedFields.size > 0 && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-2 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2a9fd6] rounded-full transition-all duration-700"
              style={{ width: `${Math.min((updatedFields.size / 10) * 100, 85)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 shrink-0">
            {Math.min(Math.round((updatedFields.size / 10) * 100), 85)}% filled
          </span>
        </div>
      )}
    </div>
  );
}
