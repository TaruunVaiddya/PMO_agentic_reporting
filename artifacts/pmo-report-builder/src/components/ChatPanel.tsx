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
      <div className="w-8 h-8 rounded-full bg-[#1a2456] flex items-center justify-center text-white text-xs font-bold">D</div>
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
        ✏️ Type my own answer
      </button>
    </div>
  );
}

function useTypewriter(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return { displayed, done };
}

export function ChatPanel({ project, allProjects, onProjectSelect, onReportUpdate, onComplete }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<ConversationStage>('welcome');
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingSuggestions, setAwaitingSuggestions] = useState<string[] | null>(null);
  const [awaitingCustom, setAwaitingCustom] = useState(false);
  const [memoryDump, setMemoryDump] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

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

  // Initial welcome sequence
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    (async () => {
      await delay(600);
      addMsg('assistant',
        `Hi Sarah! 👋 Welcome — I'm Dotz, your PMO reporting assistant. I'm so excited to help you get this done today!`
      );
      await delay(1200);
      addMsg('assistant',
        `You're submitting project status reports for the reporting interval:\n\n📅 01 Jan 2026 – 31 Mar 2026\n\nI've pulled up your blank report template and your last 3 completed reports on the right panel — take a peek at those for reference anytime!`
      );
      await delay(1200);

      if (allProjects.length > 1) {
        addMsg('assistant',
          `I can see you're managing ${allProjects.length} projects this cycle. Which one would you like to start with?`,
          allProjects.map(p => p.name)
        );
        setAwaitingSuggestions(allProjects.map(p => p.name));
        setStage('project_intro');
      } else {
        addMsg('assistant',
          `You're working on **${project.name}**. Let's get started! 🚀\n\nJust do a brain dump for me — tell me everything that happened this quarter. Milestones you hit, any risks or issues that came up, budget situation, wins, challenges — anything and everything. Don't worry about structure, I'll take care of that. 😊`
        );
        setStage('memory_dump');
      }
    })();
  }, []);

  const processMemoryDump = async (dump: string) => {
    setIsProcessing(true);
    setMemoryDump(dump);

    // Simulate AI processing
    await new Promise(res => setTimeout(res, 2800));

    // Extract information from dump and populate report
    const updatedFields: string[] = ['overallStatusSummary', 'keyAchievements', 'plannedActivities'];
    const partialData: Partial<PSRReportData> = {};

    // Simple extraction logic based on keywords in the dump
    const lower = dump.toLowerCase();

    if (lower.includes('on track') || lower.includes('going well') || lower.includes('good progress') || lower.includes('on schedule')) {
      partialData.overallStatus = 'on-track';
      partialData.projectStatus = {
        dependency: 'on-track', issues: 'on-track', resource: 'on-track',
        benefits: 'on-track', risks: 'on-track', budget: 'on-track',
        scope: 'on-track', schedule: 'on-track',
      };
    } else if (lower.includes('concern') || lower.includes('risk') || lower.includes('issue') || lower.includes('delay')) {
      partialData.overallStatus = 'alert';
    } else {
      partialData.overallStatus = 'on-track';
    }

    partialData.overallStatusSummary = generateSummary(dump, project.name);
    partialData.keyAchievements = extractAchievements(dump);
    partialData.plannedActivities = extractPlannedActivities(dump);
    partialData.reportDate = new Date().toLocaleDateString('en-GB');
    updatedFields.push('reportDate', 'overallStatus');

    // Budget
    if (lower.includes('budget') || lower.includes('spend') || lower.includes('cost') || lower.includes('$') || lower.includes('capex') || lower.includes('opex')) {
      updatedFields.push('financial_capex', 'financial_opex', 'financial_total');
    }

    onReportUpdate(partialData, updatedFields);
    setIsProcessing(false);

    addMsg('assistant',
      `✨ Done! I've filled in the main sections of your report based on what you shared. You can see the report updating on the right panel.\n\nI have a few follow-up questions to complete the remaining sections — I'll go one at a time and give you some suggested answers based on your past reports. Ready?`
    );

    await new Promise(res => setTimeout(res, 800));
    askOverallStatus(partialData.overallStatus || 'on-track');
  };

  const askOverallStatus = async (currentStatus: string) => {
    setStage('followup_overall_status');
    const suggestions = [
      '✅ On Track — all key indicators green',
      '⚠️ Alert — one or two areas need attention',
      '🔴 Off Track — significant concerns to escalate',
    ];
    addMsg('assistant',
      `What is the **overall project status** this quarter? Based on what you told me, I've set it to "${currentStatus === 'on-track' ? 'On Track' : currentStatus === 'alert' ? 'Alert' : 'Off Track'}" — does that sound right?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const askRisksUpdate = async () => {
    setStage('followup_risks');
    const past = project.pastReports[0]?.data;
    const suggestions = past?.risks.slice(0, 3).map(r => `${r.id}: ${r.name} → Now rated ${r.residualRisk}`) || [
      'No new risks this quarter',
      'Existing risks being managed',
      'New risk identified — need to add details',
    ];
    addMsg('assistant',
      `Any changes to the **risk register** this quarter? Here are the active risks from last period — have any changed in severity, or are there new ones to add?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const askBudgetUpdate = async () => {
    setStage('followup_budget');
    const suggestions = [
      'Budget on track — within 5% of forecast',
      'Slightly over forecast — corrective action in place',
      'Significantly over forecast — requires approval',
    ];
    addMsg('assistant',
      `How is the **budget tracking** this quarter? What's the general position vs. the FY baseline?`,
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
      `How is the **schedule** looking? Did you hit your planned milestones for Q1?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const askNextSteps = async () => {
    setStage('followup_next_steps');
    const suggestions = [
      'Continue with Phase 4 rollout as planned',
      'Resolve outstanding risks before next phase',
      'Conduct stakeholder review and get sign-off',
    ];
    addMsg('assistant',
      `Almost done! 🎉 What are the **key priorities and planned activities** for Q2 2026 (next reporting period)?`,
      suggestions
    );
    setAwaitingSuggestions(suggestions);
  };

  const finaliseReport = async (nextSteps: string) => {
    setStage('complete');
    const updateData: Partial<PSRReportData> = {
      plannedActivities: nextSteps.startsWith('Continue') ? 'Continue Phase 4 rollout. Maintain risk mitigation cadence. Conduct Q2 stakeholder reviews.'
        : nextSteps.startsWith('Resolve') ? 'Resolve outstanding risks. Complete pending regulatory approvals. Prepare for Phase 4 commencement.'
        : 'Conduct stakeholder review. Obtain executive sign-off on Phase 4 approach. Update project plan.',
    };
    onReportUpdate(updateData, ['plannedActivities']);

    addMsg('assistant',
      `🎉 Your Project Status Report is complete! Here's a summary of what I've filled in:\n\n✅ Overall Status Summary\n✅ Project Status Indicators\n✅ Key Achievements\n✅ Planned Activities\n✅ Risks & Issues updated\n\nYou can now review the full report on the right panel. When you're happy with it, hit **Submit to PMO** or download it in your preferred format. Great work! 🚀`
    );
    onComplete();
  };

  const handleSuggestionSelect = async (suggestion: string) => {
    if (suggestion === '__custom__') {
      setAwaitingSuggestions(null);
      setAwaitingCustom(true);
      inputRef.current?.focus();
      return;
    }

    setAwaitingSuggestions(null);
    addMsg('user', suggestion);

    if (stage === 'project_intro') {
      const proj = allProjects.find(p => p.name === suggestion);
      if (proj) {
        onProjectSelect(proj.id);
        await new Promise(res => setTimeout(res, 400));
        addMsg('assistant',
          `Great choice! Let's work on **${proj.name}**.\n\nI've loaded the past 3 reports in the right panel for reference. Now — tell me everything that happened this quarter. Just do a brain dump and I'll structure it for you! 🧠`
        );
        setStage('memory_dump');
      }
    } else if (stage === 'followup_overall_status') {
      const statusMap: Record<string, PSRReportData['overallStatus']> = {
        '✅': 'on-track', '⚠️': 'alert', '🔴': 'off-track',
      };
      const emoji = suggestion.split(' ')[0];
      const status = statusMap[emoji] || 'on-track';
      const statusLabel = suggestion.includes('On Track') ? 'On Track' : suggestion.includes('Alert') ? 'Alert' : 'Off Track';
      onReportUpdate({ overallStatus: status }, ['overallStatus']);

      addMsg('assistant', `Got it — overall status set to **${statusLabel}**. ✅`);
      await new Promise(res => setTimeout(res, 600));
      await askRisksUpdate();
    } else if (stage === 'followup_risks') {
      onReportUpdate({}, ['risks']);
      addMsg('assistant', `Risks noted! I'll update the register accordingly. ✅`);
      await new Promise(res => setTimeout(res, 600));
      await askBudgetUpdate();
    } else if (stage === 'followup_budget') {
      const budgetStatus = suggestion.includes('on track') ? 'on-track' : suggestion.includes('Slightly') ? 'alert' : 'off-track';
      onReportUpdate({ projectStatus: { ...project.currentReport.projectStatus, budget: budgetStatus } }, ['status_budget', 'financial_capex', 'financial_opex', 'financial_total']);
      addMsg('assistant', `Budget status recorded. ✅`);
      await new Promise(res => setTimeout(res, 600));
      await askScheduleUpdate();
    } else if (stage === 'followup_schedule') {
      const schedStatus = suggestion.includes('On schedule') ? 'on-track' : suggestion.includes('Minor') ? 'alert' : 'off-track';
      onReportUpdate({ projectStatus: { ...project.currentReport.projectStatus, schedule: schedStatus } }, ['status_schedule']);
      addMsg('assistant', `Schedule status updated. ✅`);
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
    setAwaitingCustom(false);
    setAwaitingSuggestions(null);

    addMsg('user', text);

    const currentStage = stage;

    if (currentStage === 'memory_dump') {
      addMsg('assistant', 'Thanks for sharing! Give me a moment while I process this and fill in your report... 🔄', undefined);
      await new Promise(res => setTimeout(res, 400));
      setIsProcessing(true);
      await processMemoryDump(text);
    } else if (currentStage === 'project_intro') {
      const proj = allProjects.find(p => p.name.toLowerCase() === text.toLowerCase()) || allProjects[0];
      onProjectSelect(proj.id);
      await new Promise(res => setTimeout(res, 400));
      addMsg('assistant',
        `Great choice! Let's work on **${proj.name}**.\n\nI've loaded the past 3 reports in the right panel for reference. Now — tell me everything that happened this quarter. Just do a brain dump and I'll structure it for you! 🧠`
      );
      setStage('memory_dump');
    } else if (currentStage === 'followup_overall_status') {
      await handleSuggestionSelect(text.toLowerCase().includes('on track') ? '✅ On Track — all key indicators green' : '⚠️ Alert — one or two areas need attention');
    } else if (currentStage === 'followup_risks') {
      onReportUpdate({}, ['risks']);
      addMsg('assistant', `Got it — risks updated. ✅`);
      await new Promise(res => setTimeout(res, 600));
      await askBudgetUpdate();
    } else if (currentStage === 'followup_budget') {
      onReportUpdate({}, ['status_budget']);
      addMsg('assistant', `Budget information noted. ✅`);
      await new Promise(res => setTimeout(res, 600));
      await askScheduleUpdate();
    } else if (currentStage === 'followup_schedule') {
      onReportUpdate({}, ['status_schedule']);
      addMsg('assistant', `Schedule status noted. ✅`);
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
                  ? 'E.g., Build a portfolio status report for Q1...'
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
          <p className="text-[11px] text-emerald-600 text-center mt-2 font-medium">✅ Report complete — review on the right, then submit.</p>
        )}
      </div>
    </div>
  );
}

// Helper functions for report generation
function generateSummary(dump: string, projectName: string): string {
  const lower = dump.toLowerCase();
  const hasRisks = lower.includes('risk') || lower.includes('concern') || lower.includes('issue');
  const hasBudget = lower.includes('budget') || lower.includes('cost') || lower.includes('spend');
  const hasSchedule = lower.includes('delay') || lower.includes('schedule') || lower.includes('milestone');

  let summary = `Q1 2026 reporting period for ${projectName}. `;

  if (lower.includes('on track') || lower.includes('going well') || (!hasRisks && !hasSchedule)) {
    summary += 'Project progressing as planned with key deliverables on track. ';
  } else {
    summary += 'Project facing some headwinds this quarter with areas requiring attention. ';
  }

  if (hasBudget) summary += 'Budget position being monitored closely. ';
  if (hasRisks) summary += 'Risk register reviewed and mitigation actions progressing. ';
  if (lower.includes('milestone') || lower.includes('complet') || lower.includes('achieved') || lower.includes('deliverd') || lower.includes('delivered')) {
    summary += 'Key milestones achieved during the quarter. ';
  }

  return summary.trim();
}

function extractAchievements(dump: string): string {
  const sentences = dump.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const achievementKeywords = ['completed', 'achieved', 'delivered', 'launched', 'signed', 'approved', 'finalised', 'onboard', 'success', 'hit', 'milestone'];
  const achievements = sentences.filter(s =>
    achievementKeywords.some(kw => s.toLowerCase().includes(kw))
  ).slice(0, 3);

  return achievements.length > 0
    ? achievements.map(s => s.trim()).join('. ') + '.'
    : 'Q1 activities progressed as planned. Key deliverables advanced toward completion. Stakeholder engagement maintained throughout the quarter.';
}

function extractPlannedActivities(dump: string): string {
  const sentences = dump.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const plannedKeywords = ['next', 'plan', 'upcoming', 'will', 'intend', 'q2', 'april', 'may', 'june'];
  const planned = sentences.filter(s =>
    plannedKeywords.some(kw => s.toLowerCase().includes(kw))
  ).slice(0, 3);

  return planned.length > 0
    ? planned.map(s => s.trim()).join('. ') + '.'
    : 'Continue progressing key deliverables per the project plan. Maintain risk monitoring cadence. Conduct Q2 stakeholder reviews.';
}
