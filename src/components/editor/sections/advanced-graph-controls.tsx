/**
 * Advanced Graph Controls Section
 * Advanced controls for editing chart data and configuration
 */

import React, { useMemo } from 'react';
import { SelectedElementData } from '@/types/editor';
import { TextControl } from '../controls/text-control';
import { detectChartLibrary, extractChartData } from '@/lib/graph-editor-utils';
import { AlertCircle, Info } from 'lucide-react';

interface AdvancedGraphControlsProps {
  element: SelectedElementData;
  onUpdate: (property: string, value: string) => void;
}

export const AdvancedGraphControls: React.FC<AdvancedGraphControlsProps> = React.memo(({ element, onUpdate }) => {
  const detection = useMemo(() => detectChartLibrary(element), [element]);
  const chartData = useMemo(() => extractChartData(element), [element]);

  const handleDataUpdate = React.useCallback(
    (value: string) => {
      try {
        // Validate JSON
        JSON.parse(value);
        onUpdate('chartData', value);
      } catch (error) {
        console.error('Invalid JSON:', error);
      }
    },
    [onUpdate]
  );

  if (!detection.canEdit) {
    return (
      <div className="space-y-2 p-3 bg-muted/30 rounded-md">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          <span>Advanced editing not available for this chart type</span>
        </div>
        {detection.library !== 'unknown' && (
          <div className="text-[10px] text-muted-foreground/70">
            Detected: {detection.library}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Advanced Graph Data
      </div>

      <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
        <div className="flex items-start gap-2 text-[10px] text-blue-600 dark:text-blue-400">
          <AlertCircle className="size-3 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">Experimental Feature</div>
            <div className="text-blue-600/70 dark:text-blue-400/70 mt-0.5">
              Chart library detected: <span className="font-mono">{detection.library}</span>
            </div>
          </div>
        </div>
      </div>

      {chartData && (
        <div className="space-y-2">
          <TextControl
            label="Chart Data (JSON)"
            value={JSON.stringify(chartData, null, 2)}
            onChange={handleDataUpdate}
            multiline
            rows={8}
            placeholder="Enter valid JSON data"
          />
          <div className="text-[10px] text-muted-foreground/70">
            Edit the JSON data to modify the chart. Changes apply on blur.
          </div>
        </div>
      )}

      {!chartData && (
        <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded">
          No editable data found. You can still modify styling properties above.
        </div>
      )}

      <div className="pt-2 border-t border-border/50">
        <div className="text-[10px] text-muted-foreground/70 space-y-1">
          <div>Tip: For complete control, you may need to:</div>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>Access the chart instance directly</li>
            <li>Use the chart library's API</li>
            <li>Re-render with new configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
});

AdvancedGraphControls.displayName = 'AdvancedGraphControls';
