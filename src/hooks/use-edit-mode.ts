/**
 * Edit Mode Hook
 * Manages edit mode state for report preview
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  injectEditorScript,
  removeEditorScript,
  waitForIframeReady,
  type EditorConfig,
} from '@/lib/iframe-editor';
import type { SelectedElementData, EditorMessage } from '@/types/editor';

export type PreviewMode = 'view' | 'edit';

export interface UseEditModeOptions {
  editorConfig?: EditorConfig;
  onModeChange?: (mode: PreviewMode) => void;
  onElementSelected?: (element: SelectedElementData) => void;
}

export interface UseEditModeReturn {
  mode: PreviewMode;
  isEditMode: boolean;
  isViewMode: boolean;
  selectedElement: SelectedElementData | null;
  setMode: (mode: PreviewMode) => void;
  toggleMode: () => void;
  enableEditMode: (iframe: HTMLIFrameElement) => Promise<boolean>;
  disableEditMode: (iframe: HTMLIFrameElement) => boolean;
  clearSelection: () => void;
}

/**
 * Custom hook for managing edit mode functionality
 */
export function useEditMode(
  options: UseEditModeOptions = {}
): UseEditModeReturn {
  const { editorConfig, onModeChange, onElementSelected } = options;

  const [mode, setModeState] = useState<PreviewMode>('view');
  const [selectedElement, setSelectedElement] = useState<SelectedElementData | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';

  /**
   * Set the preview mode
   */
  const setMode = useCallback(
    (newMode: PreviewMode) => {
      if (newMode === mode) return;

      setModeState(newMode);
      onModeChange?.(newMode);
    },
    [mode, onModeChange]
  );

  /**
   * Toggle between view and edit modes
   */
  const toggleMode = useCallback(() => {
    setMode(mode === 'view' ? 'edit' : 'view');
  }, [mode, setMode]);

  /**
   * Enable edit mode for an iframe
   */
  const enableEditMode = useCallback(
    async (iframe: HTMLIFrameElement): Promise<boolean> => {
      try {
        // Store iframe reference
        iframeRef.current = iframe;

        // Wait for iframe to be ready
        const ready = await waitForIframeReady(iframe, 5000);
        if (!ready) {
          console.error('Iframe not ready for edit mode');
          return false;
        }

        // Inject editor script
        const success = injectEditorScript(iframe, editorConfig);

        if (success) {
          setMode('edit');
          console.log('Edit mode enabled successfully');
        }

        return success;
      } catch (error) {
        console.error('Failed to enable edit mode:', error);
        return false;
      }
    },
    [editorConfig, setMode]
  );

  /**
   * Disable edit mode for an iframe
   */
  const disableEditMode = useCallback(
    (iframe: HTMLIFrameElement): boolean => {
      try {
        const success = removeEditorScript(iframe);

        if (success) {
          setMode('view');
          setSelectedElement(null);
          console.log('Edit mode disabled successfully');
        }

        return success;
      } catch (error) {
        console.error('Failed to disable edit mode:', error);
        return false;
      }
    },
    [setMode]
  );

  /**
   * Clear the selected element
   */
  const clearSelection = useCallback(() => {
    setSelectedElement(null);
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent<EditorMessage>) => {
      // Basic security check - you may want to validate origin in production
      if (event.data?.type === 'ELEMENT_SELECTED') {
        const elementData = event.data.data;
        setSelectedElement(elementData);
        onElementSelected?.(elementData);
        console.log('Element selected:', elementData);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onElementSelected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current && isEditMode) {
        removeEditorScript(iframeRef.current);
      }
    };
  }, [isEditMode]);

  return {
    mode,
    isEditMode,
    isViewMode,
    selectedElement,
    setMode,
    toggleMode,
    enableEditMode,
    disableEditMode,
    clearSelection,
  };
}
