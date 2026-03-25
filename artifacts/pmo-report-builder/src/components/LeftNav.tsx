import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    id: 'pm',
    label: 'Report Builder',
    sublabel: 'PM View',
    path: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    id: 'pmo',
    label: 'PMO Dashboard',
    sublabel: 'Compliance View',
    path: '/pmo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'executive',
    label: 'Executive View',
    sublabel: 'Coming Soon',
    path: '/executive',
    disabled: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const PROFILES: Record<string, { name: string; title: string; initial: string }> = {
  '/': { name: 'Sarah Mitchell', title: 'Project Manager', initial: 'S' },
  '/pmo': { name: 'Marcus Webb', title: 'PMO Director', initial: 'M' },
  '/executive': { name: 'Margaret Chen', title: 'Executive Director', initial: 'M' },
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
            <div className="w-8 h-8 rounded-lg bg-[#2a9fd6] flex items-center justify-center text-white text-sm font-bold shrink-0">S</div>
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

          {/* Period badge */}
          <div className="px-2 pt-4 pb-2">
            {expanded ? (
              <div className="px-2.5 py-1.5 rounded-lg bg-[#253470] border border-[#3a4b7a]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2a9fd6] shrink-0" />
                  <span className="text-[10px] text-[#6cb4e4] font-medium whitespace-nowrap">Mar 2026 · Reporting Active</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2a9fd6]" />
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 space-y-0.5 overflow-hidden">
            {NAV_ITEMS.map(item => {
              const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
              return (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      navigate(item.path);
                      setExpanded(false);
                    }
                  }}
                  title={!expanded ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors text-left
                    ${isActive ? 'bg-[#2a9fd6] text-white' : ''}
                    ${!isActive && !item.disabled ? 'text-[#8aaccc] hover:bg-[#253470] hover:text-white' : ''}
                    ${item.disabled ? 'text-[#4a6a9a] opacity-40 cursor-not-allowed' : ''}`}
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

          {/* Profile section */}
          <div className="shrink-0 border-t border-[#253470] p-2">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[#253470]">
              <div className="w-7 h-7 rounded-full bg-[#2a9fd6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {profile.initial}
              </div>
              {expanded && (
                <div className="min-w-0 overflow-hidden whitespace-nowrap">
                  <div className="text-[11px] font-semibold text-white leading-tight">{profile.name}</div>
                  <div className="text-[10px] text-[#6cb4e4] leading-tight">{profile.title}</div>
                </div>
              )}
            </div>
            {expanded && (
              <div className="mt-1.5 space-y-0.5">
                {NAV_ITEMS.filter(item => path !== item.path).map(item => (
                  <button
                    key={item.id}
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) { navigate(item.path); setExpanded(false); }
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors whitespace-nowrap overflow-hidden
                      ${item.disabled ? 'text-[#4a6a9a] cursor-not-allowed opacity-40' : 'text-[#6cb4e4] hover:text-white hover:bg-[#253470]'}`}
                  >
                    Switch to {item.label} {item.disabled ? '(soon)' : '→'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
