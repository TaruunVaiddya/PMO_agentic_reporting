import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Role {
  id: string;
  label: string;
  name: string;
  title: string;
  path: string;
  disabled?: boolean;
}

const ROLES: Role[] = [
  { id: 'pm', label: 'PM', name: 'Sarah Mitchell', title: 'Project Manager', path: '/' },
  { id: 'pmo', label: 'PMO', name: 'Marcus Webb', title: 'PMO Director', path: '/pmo' },
  { id: 'executive', label: 'Executive', name: 'Margaret Chen', title: 'Executive Director', path: '/executive', disabled: true },
];

interface ProfileSwitcherProps {
  currentRole: 'pm' | 'pmo' | 'executive';
}

export function ProfileSwitcher({ currentRole }: ProfileSwitcherProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const current = ROLES.find(r => r.id === currentRole) || ROLES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#253470] border border-[#3a4b7a] hover:bg-[#2e3e87] transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-[#2a9fd6] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {current.name.charAt(0)}
        </span>
        <div className="text-left hidden sm:block">
          <div className="text-[11px] text-white font-semibold leading-tight">{current.name}</div>
          <div className="text-[10px] text-[#8aaccc] leading-tight">{current.title}</div>
        </div>
        <svg className="w-3 h-3 text-[#8aaccc] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Switch Role</p>
            </div>
            {ROLES.map(role => {
              const isActive = role.id === currentRole;
              return (
                <button
                  key={role.id}
                  disabled={role.disabled}
                  onClick={() => {
                    if (!role.disabled && !isActive) {
                      navigate(role.path);
                    }
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${isActive ? 'bg-[#eef4fb]' : role.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0
                    ${isActive ? 'bg-[#2a9fd6]' : 'bg-slate-300'}`}>
                    {role.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 leading-tight">{role.name}</div>
                    <div className="text-xs text-slate-500 leading-tight">{role.title}</div>
                    {role.disabled && <div className="text-[10px] text-slate-400 mt-0.5">Coming soon</div>}
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-[#2a9fd6] bg-[#e0f0fb] px-2 py-0.5 rounded-full">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
