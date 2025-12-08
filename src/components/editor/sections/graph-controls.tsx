/**
 * Graph Controls Section
 * Controls for SVG/Canvas graphs and charts
 */

import React from 'react';
import { SelectedElementData } from '@/types/editor';
import { ColorControl } from '../controls/color-control';
import { NumberControl } from '../controls/number-control';
import { SelectControl } from '../controls/select-control';
import { rgbToHex } from '@/lib/color-utils';

interface GraphControlsProps {
  element: SelectedElementData;
  onUpdate: (property: string, value: string) => void;
}

export const GraphControls: React.FC<GraphControlsProps> = React.memo(({ element, onUpdate }) => {
  const backgroundColor = rgbToHex(element.styles.backgroundColor || '#ffffff');
  const borderColor = rgbToHex(element.styles.borderColor || '#000000');
  const borderWidth = parseInt(element.styles.borderWidth || '0', 10);
  const opacity = parseFloat(element.styles.opacity || '1');

  const handleBackgroundColorChange = React.useCallback(
    (value: string) => onUpdate('backgroundColor', value),
    [onUpdate]
  );

  const handleBorderColorChange = React.useCallback(
    (value: string) => onUpdate('borderColor', value),
    [onUpdate]
  );

  const handleBorderWidthChange = React.useCallback(
    (value: number) => onUpdate('borderWidth', `${value}px`),
    [onUpdate]
  );

  const handleBorderStyleChange = React.useCallback(
    (value: string) => onUpdate('borderStyle', value),
    [onUpdate]
  );

  const handleOpacityChange = React.useCallback(
    (value: number) => onUpdate('opacity', value.toString()),
    [onUpdate]
  );

  const handleBorderRadiusChange = React.useCallback(
    (value: number) => onUpdate('borderRadius', `${value}px`),
    [onUpdate]
  );

  const currentBorderStyle = element.styles.borderStyle || 'solid';
  const borderRadius = parseInt(element.styles.borderRadius || '0', 10);

  return (
    <div className="space-y-4">
      <div className="text-xs font-medium text-muted-foreground mb-2">Graph Styling</div>

      <ColorControl
        label="Background"
        value={backgroundColor}
        onChange={handleBackgroundColorChange}
      />

      <NumberControl
        label="Opacity"
        value={opacity}
        onChange={handleOpacityChange}
        min={0}
        max={1}
        step={0.1}
      />

      <div className="space-y-2 pt-2 border-t border-border/50">
        <div className="text-xs font-medium text-muted-foreground">Border</div>

        <ColorControl
          label="Border Color"
          value={borderColor}
          onChange={handleBorderColorChange}
        />

        <NumberControl
          label="Border Width"
          value={borderWidth}
          onChange={handleBorderWidthChange}
          min={0}
          max={10}
          step={1}
        />

        <SelectControl
          label="Border Style"
          value={currentBorderStyle}
          onChange={handleBorderStyleChange}
          options={[
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
            { value: 'none', label: 'None' }
          ]}
        />

        <NumberControl
          label="Border Radius"
          value={borderRadius}
          onChange={handleBorderRadiusChange}
          min={0}
          max={50}
          step={1}
        />
      </div>
    </div>
  );
});

GraphControls.displayName = 'GraphControls';
