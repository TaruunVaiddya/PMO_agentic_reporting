import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ConversationStage, Project, PSRReportData } from '../types';

interface ChatPanelProps {
  project: Project;
  allProjects: Project[];
  onProjectSelect: (projectId: string) => void;
  onReportUpdate: (data: Partial<PSRReportData>, updatedFields: string[]) => void;
  onComplete: () => void;
}

function ProcessingAnimation() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200 w-fit">
      <div className="dot-pulse flex gap-1">
        <span /><span /><span />
      </div>
    </div>
  );
}

function DotzAvatar() {
  return (
    <div className="relative w-8 h-8 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2a9fd6 100%)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
    </div>
  );
}

function AssistantBubble({ content, isProcessing }: { content: string; isProcessing?: boolean }) {
  return (
    <div className="flex gap-2.5 items-start">
      <DotzAvatar />
      <div className="flex-1 min-w-0">
        {isProcessing ? (
          <ProcessingAnimation />
        ) : (
          <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200 px-4 py-3 text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#1a2456] px-4 py-3 text-[13px] leading-relaxed text-white whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

function SuggestionButtons({ suggestions, onSelect }: { suggestions: string[]; onSelect: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 ml-10">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="text-xs px-3 py-1.5 rounded-full border border-[#2a9fd6] text-[#2a9fd6] hover:bg-[#2a9fd6] hover:text-white transition-colors font-medium"
        >
          {s}
        </button>
      ))}
      <button
        onClick={() => onSelect('__custom__')}
        className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
      >
        Type my own answer
      </button>
    </div>
  );
}

// Track the live accumulated projectStatus to avoid spreading from stale props
const DEFAULT_PROJECT_STATUS: PSRReportData['projectStatus'] = {
  dependency: 'not-tracked',
  issues: 'not-tracked',
  resource: 'not-tracked',
  benefits: 'not-tracked',
  risks: 'not-tracked',
  budget: 'not-tracked',
  scope: 'not-tracked',
  schedule: 'not-tracked',
};

export function ChatPanel({ project, allProjects, onProjectSelect, onReportUpdate, onComplete }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<ConversationStage>('welcome');
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingSuggestions, setAwaitingSuggestions] = useState<string[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);
  // Tracks the live projectStatus so follow-up handlers never spread from stale props
  const projectStatusRef = useRef<PSRReportData['projectStatus']>({ ...DEFAULT_PROJECT_STATUS });

  const addMsg = (role: 'assistant' | 'user', content: string, suggestions?: string[]) => {
    const msg: ChatMessage = { id: Date.now().toString(), role, content, timestamp: new Date(), suggestions };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages, isProcessing]);

  // Initial welcome — single project, go directly to memory_dump
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    (async () => {
      await delay(600);
      addMsg('assistant',
        `Hi Sarah, welcome back. I'm Dotz, your PMO reporting assistant.`
      );
      await delay(1200);
      addMsg('assistant',
        `You're submitting the Project Status Report for:\n\nEnterprise Security Services (ESS)\nReporting period: 01 March 2026 – 31 March 2026\n\nI've loaded your last three reports on the right for reference. When you're ready, give me a brain dump of everything that happened this quarter — milestones, budget, risks, issues, wins. Don't worry about structure, I will handle that.`
      );
      setStage('memory_dump');
    })();
  }, []);

  const processMemoryDump = async (dump: string) => {
    setIsProcessing(true);

    await new Promise(res => setTimeout(res, 2800));

    const lower = dump.toLowerCase();
    const partialData: Partial<PSRReportData> = {};
    const updatedFields: string[] = [
      'overallStatusSummary', 'keyAchievements', 'plannedActivities',
      'reportDate', 'overallStatus',
      'status_dependency', 'status_issues', 'status_resource', 'status_benefits',
      'status_risks', 'status_budget', 'status_scope', 'status_schedule',
      'financial_capex', 'financial_opex', 'financial_total',
    ];

    // Derive overall status from dump language
    const hasOffTrack = lower.includes('off track') || lower.includes('significant') || lower.includes('escalat') || lower.includes('critical');
    const hasAlert = lower.includes('delay') || lower.includes('risk') || lower.includes('concern') || lower.includes('issue') || lower.includes('behind');

    if (hasOffTrack) {
      partialData.overallStatus = 'off-track';
    } else if (hasAlert) {
      partialData.overallStatus = 'alert';
    } else {
      partialData.overallStatus = 'on-track';
    }

    // Build projectStatus — start on-track, degrade specific indicators based on keywords
    const newStatus: PSRReportData['projectStatus'] = {
      dependency: 'on-track',
      issues: lower.includes('issue') || lower.includes('problem') ? 'alert' : 'on-track',
      resource: lower.includes('resource') || lower.includes('staffing') || lower.includes('headcount') ? 'alert' : 'on-track',
      benefits: 'on-track',
      risks: lower.includes('risk') || lower.includes('concern') || lower.includes('escalat') ? 'alert' : 'on-track',
      budget: lower.includes('over') || lower.includes('overspend') ? 'alert' : 'on-track',
      scope: lower.includes('scope') && (lower.includes('change') || lower.includes('creep')) ? 'alert' : 'on-track',
      schedule: lower.includes('delay') || lower.includes('behind') || lower.includes('slip') ? 'alert' : 'on-track',
    };
    projectStatusRef.current = newStatus;
    partialData.projectStatus = { ...newStatus };

    // Populate financial data with realistic ESS values for the quarter
    partialData.financial = {
      capex: {
        baseline: '830.00 K',
        forecast: lower.includes('over') || lower.includes('overspend') ? '858.00 K' : '824.00 K',
        forecastVariance: lower.includes('over') ? '-28.00 K (-3.37%)' : '+6.00 K (0.72%)',
        ytdBaseline: '415.00 K',
        ytdActual: lower.includes('over') ? '432.00 K' : '411.50 K',
        actualVariance: lower.includes('over') ? '-17.00 K' : '+3.50 K',
      },
      opex: {
        baseline: '185.00 K',
        forecast: lower.includes('over') ? '192.00 K' : '183.00 K',
        forecastVariance: lower.includes('over') ? '-7.00 K (-3.78%)' : '+2.00 K (1.08%)',
        ytdBaseline: '92.50 K',
        ytdActual: lower.includes('over') ? '96.00 K' : '91.20 K',
        actualVariance: lower.includes('over') ? '-3.50 K' : '+1.30 K',
      },
      total: {
        baseline: '1,015.00 K',
        forecast: lower.includes('over') ? '1,050.00 K' : '1,007.00 K',
        forecastVariance: lower.includes('over') ? '-35.00 K (-3.45%)' : '+8.00 K (0.79%)',
        ytdBaseline: '507.50 K',
        ytdActual: lower.includes('over') ? '528.00 K' : '502.70 K',
        actualVariance: lower.includes('over') ? '-20.50 K' : '+4.80 K',
      },
    };

    partialData.overallStatusSummary = generateSummary(dump, project.name);
    partialData.keyAchievements = extractAchievements(dump);
    partialData.plannedActivities = extractPlannedActivities(dump);
    partialData.reportDate = new Date().toLocaleDateString('en-GB');

    onReportUpdate(partialData, updatedFields);
    setIsProcessing(false);

    addMsg('assistant',
      `I have filled in the key sections of your report based on what you shared. You should see the report updating on the right.\n\nI have a few follow-up questions to lock in the remaining details. I'll go through them one at a time and offer some suggested answers. Ready to continue?`
    );

    await new Promise(res => setTimeout(res, 800));
    askOverallStatus(partialData.overallStatus || 'on-track');
  };

  const askOverallStatus = async (currentStatus: string) => {
    setStage('followup_overall_status');
    const statusLabel = currentStatus === 'on-track' ? 'On Track' : currentStatus === 'alert' ? 'Alert' : 'Off Track';
    const suggestions = [
      'On Track — all key indicators green',
      'Alert — one or two areas need attention',
      'Off Track — significant concerns to escalate',
    ];
    addMsg('assistant',
      `What is the overall project status this quarter? Based on what you described, I have set it to "${statusLabel}". Does that sound right?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const askRisksUpdate = async () => {
    setStage('followup_risks');
    const suggestions = [
      'No change — existing risks being managed within tolerance',
      'Risk severity increased — one or more risks escalated',
      'New risk identified this quarter',
    ];
    addMsg('assistant',
      `Any changes to the risk register this quarter? Here are the active risks carried over from last period:\n\n- R101: Phase 3 vendor delivery delay (HIGH)\n- R102: Skilled resource availability for Phase 3 (MEDIUM)\n\nHave any changed in severity, or are there new risks to add?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const askBudgetUpdate = async () => {
    setStage('followup_budget');
    const suggestions = [
      'On track — within 3% of FY forecast',
      'Slightly over forecast — corrective action in place',
      'Significantly over forecast — requires approval',
    ];
    addMsg('assistant',
      `How is the budget tracking this quarter? I have pre-filled figures based on what you described. Please confirm the general position.`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const askScheduleUpdate = async () => {
    setStage('followup_schedule');
    const suggestions = [
      'On schedule — all milestones tracking to plan',
      'Minor delays — within tolerance, recovery plan in place',
      'Schedule slippage — key milestone impacted',
    ];
    addMsg('assistant',
      `How is the schedule looking? Did Phase 3 IAM Rollout commence as planned?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const askNextSteps = async () => {
    setStage('followup_next_steps');
    const suggestions = [
      'Continue Phase 3 IAM rollout and SOC integration as planned',
      'Resolve vendor delay before progressing Phase 3 further',
      'Conduct stakeholder review and update delivery plan',
    ];
    addMsg('assistant',
      `Last question. What are the key priorities and planned activities for next quarter (April – June 2026)?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const finaliseReport = async (nextSteps: string) => {
    setStage('complete');

    let plannedText = 'Continue Phase 3 IAM rollout and SOC integration. Begin user awareness training program. Maintain risk monitoring cadence with vendor.';
    if (nextSteps.includes('vendor') || nextSteps.includes('Resolve')) {
      plannedText = 'Resolve Phase 3 vendor delivery delay. Resume IAM rollout once vendor SLA confirmed. Maintain weekly risk reviews. Update Phase 3 delivery plan.';
    } else if (nextSteps.includes('stakeholder') || nextSteps.includes('review')) {
      plannedText = 'Conduct Q2 stakeholder review. Update Phase 3 delivery plan with revised milestones. Obtain steering committee sign-off. Progress SOC integration scoping.';
    }

    onReportUpdate({ plannedActivities: plannedText }, ['plannedActivities']);

    addMsg('assistant',
      `Your Project Status Report is complete. Here is a summary of what has been filled in:\n\n- Overall Status and Summary\n- All Project Status Indicators\n- Key Achievements\n- Planned Activities\n- Financial Snapshot\n- Risk Register\n\nPlease review the full report on the right. When you are satisfied, use the Submit to PMO button or download in your preferred format.`
    );
    onComplete();
  };

  const handleSuggestionSelect = async (suggestion: string) => {
    if (suggestion === '__custom__') {
      setAwaitingSuggestions(null);
      inputRef.current?.focus();
      return;
    }

    setAwaitingSuggestions(null);
    addMsg('user', suggestion);

    if (stage === 'followup_overall_status') {
      const status: PSRReportData['overallStatus'] =
        suggestion.includes('On Track') ? 'on-track' :
        suggestion.includes('Alert') ? 'alert' : 'off-track';
      const statusLabel = suggestion.includes('On Track') ? 'On Track' : suggestion.includes('Alert') ? 'Alert' : 'Off Track';
      onReportUpdate({ overallStatus: status }, ['overallStatus']);
      addMsg('assistant', `Overall status confirmed as ${statusLabel}.`);
      await new Promise(res => setTimeout(res, 600));
      await askRisksUpdate();

    } else if (stage === 'followup_risks') {
      let riskStatus: PSRReportData['projectStatus']['risks'] = 'on-track';
      if (suggestion.includes('escalated') || suggestion.includes('increased')) riskStatus = 'alert';
      if (suggestion.includes('New risk')) riskStatus = 'alert';

      // Use the ref — never spread from stale props
      const updated = { ...projectStatusRef.current, risks: riskStatus };
      projectStatusRef.current = updated;
      onReportUpdate({ projectStatus: { ...updated } }, ['status_risks', 'risks']);
      addMsg('assistant', `Risk register noted and updated.`);
      await new Promise(res => setTimeout(res, 600));
      await askBudgetUpdate();

    } else if (stage === 'followup_budget') {
      const budgetStatus: PSRReportData['projectStatus']['budget'] =
        suggestion.includes('on track') || suggestion.includes('On track') ? 'on-track' :
        suggestion.includes('Slightly') ? 'alert' : 'off-track';

      const updated = { ...projectStatusRef.current, budget: budgetStatus };
      projectStatusRef.current = updated;
      onReportUpdate({ projectStatus: { ...updated } }, ['status_budget', 'financial_capex', 'financial_opex', 'financial_total']);
      addMsg('assistant', `Budget status recorded.`);
      await new Promise(res => setTimeout(res, 600));
      await askScheduleUpdate();

    } else if (stage === 'followup_schedule') {
      const schedStatus: PSRReportData['projectStatus']['schedule'] =
        suggestion.includes('On schedule') ? 'on-track' :
        suggestion.includes('Minor') ? 'alert' : 'off-track';

      const updated = { ...projectStatusRef.current, schedule: schedStatus };
      projectStatusRef.current = updated;
      onReportUpdate({ projectStatus: { ...updated } }, ['status_schedule']);
      addMsg('assistant', `Schedule status updated.`);
      await new Promise(res => setTimeout(res, 600));
      await askNextSteps();

    } else if (stage === 'followup_next_steps') {
      await finaliseReport(suggestion);
    }
  };

  const handleSubmit = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    setAwaitingSuggestions(null);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '22px';
    }

    addMsg('user', text);

    const currentStage = stage;

    if (currentStage === 'memory_dump') {
      addMsg('assistant', 'Thank you. Give me a moment while I process this and fill in your report.');
      await new Promise(res => setTimeout(res, 400));
      setIsProcessing(true);
      await processMemoryDump(text);
    } else if (currentStage === 'followup_overall_status') {
      const status: PSRReportData['overallStatus'] =
        text.toLowerCase().includes('on track') ? 'on-track' :
        text.toLowerCase().includes('off track') ? 'off-track' : 'alert';
      onReportUpdate({ overallStatus: status }, ['overallStatus']);
      addMsg('assistant', `Overall status noted.`);
      await new Promise(res => setTimeout(res, 600));
      await askRisksUpdate();
    } else if (currentStage === 'followup_risks') {
      const updated = { ...projectStatusRef.current, risks: 'alert' as const };
      projectStatusRef.current = updated;
      onReportUpdate({ projectStatus: { ...updated } }, ['status_risks', 'risks']);
      addMsg('assistant', `Risk register updated.`);
      await new Promise(res => setTimeout(res, 600));
      await askBudgetUpdate();
    } else if (currentStage === 'followup_budget') {
      const budgetStatus: PSRReportData['projectStatus']['budget'] =
        text.toLowerCase().includes('over') ? 'alert' : 'on-track';
      const updated = { ...projectStatusRef.current, budget: budgetStatus };
      projectStatusRef.current = updated;
      onReportUpdate({ projectStatus: { ...updated } }, ['status_budget']);
      addMsg('assistant', `Budget information noted.`);
      await new Promise(res => setTimeout(res, 600));
      await askScheduleUpdate();
    } else if (currentStage === 'followup_schedule') {
      const schedStatus: PSRReportData['projectStatus']['schedule'] =
        text.toLowerCase().includes('delay') || text.toLowerCase().includes('behind') ? 'alert' : 'on-track';
      const updated = { ...projectStatusRef.current, schedule: schedStatus };
      projectStatusRef.current = updated;
      onReportUpdate({ projectStatus: { ...updated } }, ['status_schedule']);
      addMsg('assistant', `Schedule status noted.`);
      await new Promise(res => setTimeout(res, 600));
      await askNextSteps();
    } else if (currentStage === 'followup_next_steps') {
      await finaliseReport(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const lastMsg = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <DotzAvatar />
        <div>
          <p className="text-[10px] text-slate-400 leading-tight uppercase tracking-wide">AI Report Engine</p>
          <p className="text-[13px] font-semibold text-slate-800 leading-tight">Dotz</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Active</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'assistant' ? (
              <AssistantBubble content={msg.content} />
            ) : (
              <UserBubble content={msg.content} />
            )}
            {msg.role === 'assistant' && msg.suggestions && awaitingSuggestions && msg === lastMsg && (
              <SuggestionButtons suggestions={msg.suggestions} onSelect={handleSuggestionSelect} />
            )}
          </div>
        ))}
        {isProcessing && (
          <AssistantBubble content="" isProcessing />
        )}
      </div>

      {/* Input — always visible */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#2a9fd6] focus-within:border-transparent transition-all">
          <button
            type="button"
            disabled
            className="shrink-0 w-6 h-6 flex items-center justify-center text-slate-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              stage === 'complete'
                ? 'Report submitted — ask me anything else...'
                : stage === 'memory_dump'
                  ? 'E.g., Phase 3 IAM rollout started, budget on track, vendor delay on identity module...'
                  : 'Type your answer...'
            }
            disabled={isProcessing}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none leading-relaxed min-h-[22px] max-h-[120px] overflow-y-auto"
            style={{ height: '22px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isProcessing}
            className="shrink-0 w-8 h-8 rounded-full bg-[#1a2456] disabled:bg-slate-200 text-white flex items-center justify-center transition-colors hover:bg-[#2a9fd6] disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        {stage === 'complete' && (
          <p className="text-[11px] text-emerald-600 text-center mt-2 font-medium">Report complete — review on the right, then submit.</p>
        )}
      </div>
    </div>
  );
}

// Helper functions
function generateSummary(dump: string, projectName: string): string {
  const lower = dump.toLowerCase();
  const hasRisks = lower.includes('risk') || lower.includes('concern') || lower.includes('issue');
  const hasDelay = lower.includes('delay') || lower.includes('behind') || lower.includes('slip');
  const hasBudget = lower.includes('budget') || lower.includes('cost') || lower.includes('spend') || lower.includes('forecast');

  let summary = `March 2026 reporting period for ${projectName}. `;

  if (!hasRisks && !hasDelay) {
    summary += 'Project progressing as planned with key deliverables on track. ';
  } else {
    summary += 'Project progressing with some areas requiring active management. ';
  }

  if (hasBudget) summary += 'Budget position being monitored. ';
  if (hasRisks) summary += 'Risk register reviewed and mitigation actions progressing. ';
  if (hasDelay) summary += 'Schedule pressures noted with recovery plans in place. ';

  const completionWords = ['completed', 'achieved', 'delivered', 'launched', 'signed', 'approved', 'finalised', 'live'];
  if (completionWords.some(w => lower.includes(w))) {
    summary += 'Key milestones achieved during the quarter.';
  }

  return summary.trim();
}

function extractAchievements(dump: string): string {
  const sentences = dump.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keywords = ['completed', 'achieved', 'delivered', 'launched', 'signed', 'approved', 'finalised', 'live', 'secured', 'passed', 'success'];
  const achievements = sentences.filter(s =>
    keywords.some(kw => s.toLowerCase().includes(kw))
  ).slice(0, 3);

  return achievements.length > 0
    ? achievements.map(s => s.trim()).join('. ') + '.'
    : 'Quarter activities progressed as planned. Key deliverables advanced toward completion. Stakeholder engagement maintained throughout the period.';
}

function extractPlannedActivities(dump: string): string {
  const sentences = dump.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keywords = ['next', 'plan', 'upcoming', 'will', 'intend', 'q2', 'april', 'may', 'june', 'phase 3', 'focus'];
  const planned = sentences.filter(s =>
    keywords.some(kw => s.toLowerCase().includes(kw))
  ).slice(0, 3);

  return planned.length > 0
    ? planned.map(s => s.trim()).join('. ') + '.'
    : 'Continue Phase 3 delivery per the project plan. Maintain risk monitoring cadence. Conduct Q2 stakeholder reviews.';
}
