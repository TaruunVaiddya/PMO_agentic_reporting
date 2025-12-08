"use client";

import React from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectControlProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export const SelectControl = React.memo(function SelectControl({
  label,
  value,
  options,
  onChange
}: SelectControlProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});
