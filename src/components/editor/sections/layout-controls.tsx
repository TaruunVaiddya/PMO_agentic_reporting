"use client";

import React from 'react';
import { SelectedElementData } from '@/types/editor';
import { ColorControl } from '../controls/color-control';

interface LayoutControlsProps {
  element: SelectedElementData;
  onUpdate: (property: string, value: string) => void;
}

export const LayoutControls = React.memo(function LayoutControls({
  element,
  onUpdate
}: LayoutControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">Background</h3>
        <div className="space-y-3">
          <ColorControl
            label="Background Color"
            value={element.styles.backgroundColor}
            onChange={(val) => onUpdate('backgroundColor', val)}
          />
        </div>
      </div>
    </div>
  );
});
