"use client";

import React from 'react';
import { SelectedElementData } from '@/types/editor';
import { ColorControl } from '../controls/color-control';
import { NumberControl } from '../controls/number-control';
import { SelectControl } from '../controls/select-control';
import { TextControl } from '../controls/text-control';

interface TextControlsProps {
  element: SelectedElementData;
  onUpdate: (property: string, value: string) => void;
}

const FONT_WEIGHTS = [
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
];

const TEXT_ALIGNS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

export const TextControls = React.memo(function TextControls({
  element,
  onUpdate
}: TextControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">Text</h3>
        <div className="space-y-3">
          <TextControl
            label="Content"
            value={element.textContent}
            onChange={(val) => onUpdate('textContent', val)}
            multiline
            placeholder="Enter text..."
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">Typography</h3>
        <div className="space-y-3">
          <NumberControl
            label="Font Size"
            value={element.styles.fontSize}
            onChange={(val) => onUpdate('fontSize', val)}
            min={8}
            max={96}
          />
          <SelectControl
            label="Font Weight"
            value={element.styles.fontWeight}
            options={FONT_WEIGHTS}
            onChange={(val) => onUpdate('fontWeight', val)}
          />
          <SelectControl
            label="Text Align"
            value={element.styles.textAlign}
            options={TEXT_ALIGNS}
            onChange={(val) => onUpdate('textAlign', val)}
          />
          <ColorControl
            label="Text Color"
            value={element.styles.color}
            onChange={(val) => onUpdate('color', val)}
          />
        </div>
      </div>
    </div>
  );
});
