"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { SelectedElementData } from '@/types/editor';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTextElement, isImageElement, isGraphElement } from '@/lib/editor-utils';
import { TextControls } from './sections/text-controls';
import { LayoutControls } from './sections/layout-controls';
import { DimensionControls } from './sections/dimension-controls';
import { GraphControls } from './sections/graph-controls';
import { AdvancedGraphControls } from './sections/advanced-graph-controls';

interface EditPanelProps {
  selectedElement: SelectedElementData | null;
  onUpdate?: (property: string, value: string) => void;
  onReset?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Edit Panel - Shows when element is selected in edit mode
 * Replaces chat panel to provide editing controls
 */
export function EditPanel({ selectedElement, onUpdate, onReset, onClose, className }: EditPanelProps) {
  // Local state for current values (syncs with selectedElement)
  const [localElement, setLocalElement] = useState<SelectedElementData | null>(selectedElement);

  // Store original element for reset
  const originalElementRef = useRef<SelectedElementData | null>(null);

  // Sync local state when selectedElement changes
  useEffect(() => {
    if (selectedElement) {
      // Store original only on first selection or when element changes
      if (!originalElementRef.current || originalElementRef.current.tagName !== selectedElement.tagName) {
        originalElementRef.current = JSON.parse(JSON.stringify(selectedElement));
      }
      setLocalElement(selectedElement);
    }
  }, [selectedElement]);

  // Determine which controls to show based on element type
  const elementType = useMemo(() => {
    if (!localElement) return { isText: false, isImage: false, isGraph: false };

    const isText = isTextElement(localElement.tagName);
    const isImage = isImageElement(localElement.tagName);
    const isGraph = isGraphElement(localElement);

    return { isText, isImage, isGraph };
  }, [localElement]);

  const handleUpdate = (property: string, value: string) => {
    // Update local state immediately for UI responsiveness
    if (localElement) {
      setLocalElement({
        ...localElement,
        textContent: property === 'textContent' ? value : localElement.textContent,
        styles: {
          ...localElement.styles,
          [property]: property !== 'textContent' ? value : localElement.styles[property as keyof typeof localElement.styles]
        }
      });
    }

    // Send update to iframe
    onUpdate?.(property, value);
  };

  const handleReset = () => {
    if (originalElementRef.current) {
      // Reset local state to original
      setLocalElement(JSON.parse(JSON.stringify(originalElementRef.current)));
    }
    // Call parent reset handler
    onReset?.();
  };

  if (!localElement) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <span className="text-2xl">✏️</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Element Selected
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Click on any element in the report to start editing its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-sm font-semibold">Edit Properties</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            title="Reset changes"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="space-y-6">
          {/* Text Controls - for text elements */}
          {elementType.isText && (
            <TextControls element={localElement} onUpdate={handleUpdate} />
          )}

          {/* Graph Controls - for SVG/Canvas/Charts */}
          {elementType.isGraph && (
            <>
              <GraphControls element={localElement} onUpdate={handleUpdate} />
              <div className="border-t border-border/50 pt-4">
                <DimensionControls element={localElement} onUpdate={handleUpdate} />
              </div>
              <div className="border-t border-border/50 pt-4">
                <AdvancedGraphControls element={localElement} onUpdate={handleUpdate} />
              </div>
            </>
          )}

          {/* Dimension Controls - for images */}
          {elementType.isImage && (
            <DimensionControls element={localElement} onUpdate={handleUpdate} />
          )}

          {/* Layout Controls - for all elements */}
          {!elementType.isGraph && (
            <LayoutControls element={localElement} onUpdate={handleUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}
