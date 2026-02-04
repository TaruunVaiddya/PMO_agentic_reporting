"use client";

import React from 'react';

interface NumberControlProps {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const NumberControl = React.memo(function NumberControl({
  label,
  value,
  onChange,
  min = 0,
  max = 200,
  step = 1,
  unit = 'px'
}: NumberControlProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    // If unit is provided and NOT empty, append it. Otherwise just pass the number.
    if (unit && unit !== '') {
      onChange(`${newVal}${unit}`);
    } else {
      onChange(newVal);
    }
  };

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
        step={step}
        value={numericValue}
        onChange={handleChange}
        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
});
