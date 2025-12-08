"use client";

import React from 'react';

interface NumberControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  unit?: string;
}

export const NumberControl = React.memo(function NumberControl({
  label,
  value,
  onChange,
  min = 0,
  max = 200,
  unit = 'px'
}: NumberControlProps) {
  const numericValue = parseInt(value) || 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground">{numericValue}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={numericValue}
        onChange={(e) => onChange(`${e.target.value}${unit}`)}
        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
});
