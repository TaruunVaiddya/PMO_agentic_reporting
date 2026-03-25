import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const NAV_ITEMS = [
  {
    id: 'pm',
    label: 'Report Builder',
    sublabel: 'PM View',
    path: '/',
    icon: <SparklesIcon />,
    dummy: false,
  },
  {
    id: 'pmo',
    label: 'Compliance Monitor',
    sublabel: 'PMO View',
    path: '/pmo',
    icon: <ClockIcon />,
    dummy: false,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    sublabel: 'Coming Soon',
    path: null,
    icon: <BrainIcon />,
    dummy: true,
  },
  {
    id: 'schedule',
    label: 'Schedule',
    sublabel: 'Coming Soon',
    path: null,
    icon: <CalendarIcon />,
    dummy: true,
  },
];

const PROFILES: Record<string, { name: string; title: string; initial: string }> = {
  '/': { name: 'Sarah Mitchell', title: 'Project Manager', initial: 'S' },
  '/pmo': { name: 'Marcus Webb', title: 'PMO Director', initial: 'M' },
};

export function LeftNav() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const profile = PROFILES[path] || PROFILES['/'];

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
      )}
      <div className="relative z-50 flex-shrink-0 w-14 h-full">
        <div
          className={`absolute left-0 top-0 h-full bg-[#1a2456] flex flex-col shadow-xl transition-[width] duration-300 ease-in-out overflow-hidden ${expanded ? 'w-56 shadow-2xl' : 'w-14'}`}
        >
          {/* Logo */}
          <div className="flex items-center h-14 px-3 border-b border-[#253470] shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              <img src="/images/sdz-symbol.png" alt="StrategyDotZero" className="w-8 h-8 object-contain" />
            </div>
            {expanded && (
              <div className="ml-3 overflow-hidden whitespace-nowrap">
                <div className="text-white text-sm font-bold">StrategyDotZero</div>
                <div className="text-[#6cb4e4] text-[10px]">PMO Intelligence</div>
              </div>
            )}
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="absolute top-[52px] -right-3 z-50 w-6 h-6 rounded-full bg-[#2a9fd6] border-2 border-white flex items-center justify-center shadow-md hover:bg-[#2490c5] transition-colors"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className={`w-3 h-3 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-[#253470] shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#2a9fd6] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {profile.initial}
            </div>
            {expanded && (
              <div className="min-w-0 overflow-hidden whitespace-nowrap">
                <div className="text-[11px] font-semibold text-white leading-tight">{profile.name}</div>
                <div className="text-[10px] text-[#6cb4e4] leading-tight">{profile.title}</div>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 pt-3 space-y-1 overflow-hidden">
            {NAV_ITEMS.map(item => {
              const isActive = item.path !== null && (path === item.path || (item.path !== '/' && path.startsWith(item.path)));
              return (
                <button
                  key={item.id}
                  disabled={item.dummy}
                  onClick={() => {
                    if (!item.dummy && item.path) {
                      navigate(item.path);
                      setExpanded(false);
                    }
                  }}
                  title={!expanded ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors text-left
                    ${isActive ? 'bg-[#2a9fd6] text-white' : ''}
                    ${!isActive && !item.dummy ? 'text-[#8aaccc] hover:bg-[#253470] hover:text-white' : ''}
                    ${item.dummy ? 'text-[#4a6a9a] opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {expanded && (
                    <div className="min-w-0 overflow-hidden whitespace-nowrap">
                      <div className="text-sm font-medium leading-tight">{item.label}</div>
                      <div className={`text-[10px] leading-tight ${isActive ? 'text-white/70' : 'text-[#4a6a9a]'}`}>{item.sublabel}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom utility icons */}
          <div className="shrink-0 px-2 pb-2 space-y-1 border-t border-[#253470] pt-2">
            <button
              disabled
              title={!expanded ? 'Settings' : undefined}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-[#4a6a9a] opacity-40 cursor-not-allowed text-left"
            >
              <span className="shrink-0"><SettingsIcon /></span>
              {expanded && <span className="text-sm font-medium whitespace-nowrap">Settings</span>}
            </button>
            <button
              disabled
              title={!expanded ? 'Log out' : undefined}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-[#4a6a9a] opacity-40 cursor-not-allowed text-left"
            >
              <span className="shrink-0"><LogoutIcon /></span>
              {expanded && <span className="text-sm font-medium whitespace-nowrap">Log out</span>}
            </button>

            {/* SDZ logo mark */}
            <div className="flex items-center justify-center pt-1 pb-1">
              <div className="w-8 h-8 rounded-full overflow-hidden opacity-70">
                <img src="/images/sdz-symbol.png" alt="StrategyDotZero" className="w-8 h-8 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
