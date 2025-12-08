/**
 * Dimension Controls Section
 * Controls for width and height of elements (graphs, images, containers)
 */

import React from 'react';
import { SelectedElementData } from '@/types/editor';
import { TextControl } from '../controls/text-control';

interface DimensionControlsProps {
  element: SelectedElementData;
  onUpdate: (property: string, value: string) => void;
}

export const DimensionControls: React.FC<DimensionControlsProps> = React.memo(({ element, onUpdate }) => {
  const currentWidth = element.styles.width || 'auto';
  const currentHeight = element.styles.height || 'auto';

  const handleWidthChange = React.useCallback(
    (value: string) => {
      // Add 'px' if numeric value without unit
      const finalValue = /^\d+$/.test(value) ? `${value}px` : value;
      onUpdate('width', finalValue);
    },
    [onUpdate]
  );

  const handleHeightChange = React.useCallback(
    (value: string) => {
      // Add 'px' if numeric value without unit
      const finalValue = /^\d+$/.test(value) ? `${value}px` : value;
      onUpdate('height', finalValue);
    },
    [onUpdate]
  );

  // Extract numeric value from width/height strings (e.g., "200px" -> "200")
  const extractNumericValue = (value: string): string => {
    if (!value || value === 'auto') return '';
    const match = value.match(/^(\d+(?:\.\d+)?)/);
    return match ? match[1] : value;
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground mb-2">Dimensions</div>

      <TextControl
        label="Width"
        value={extractNumericValue(currentWidth)}
        onChange={handleWidthChange}
        placeholder="auto"
        type="text"
      />

      <TextControl
        label="Height"
        value={extractNumericValue(currentHeight)}
        onChange={handleHeightChange}
        placeholder="auto"
        type="text"
      />

      <div className="text-[10px] text-muted-foreground/70 mt-1">
        Enter values in px (e.g., 300) or use auto, %, etc.
      </div>
    </div>
  );
});

DimensionControls.displayName = 'DimensionControls';
