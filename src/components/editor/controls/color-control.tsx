"use client";

import React from 'react';
import { normalizeColor } from '@/lib/color-utils';

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorControl = React.memo(function ColorControl({
  label,
  value,
  onChange
}: ColorControlProps) {
  const hexValue = normalizeColor(value);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-border cursor-pointer"
        />
        <input
          type="text"
          value={hexValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
});
