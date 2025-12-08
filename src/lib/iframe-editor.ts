/**
 * Iframe Editor Utility
 * Handles element selection and hover effects for iframe content editing
 */

export interface EditorConfig {
  hoverBorderColor?: string;
  hoverBorderWidth?: string;
  hoverBorderStyle?: string;
  selectedBorderColor?: string;
  selectedBorderWidth?: string;
  zIndex?: string;
}

const DEFAULT_CONFIG: EditorConfig = {
  hoverBorderColor: 'rgba(0, 0, 0, 0.3)',
  hoverBorderWidth: '2px',
  hoverBorderStyle: 'dashed',
  selectedBorderColor: 'rgba(0, 0, 0, 0.5)',
  selectedBorderWidth: '2px',
  zIndex: '9999',
};

/**
 * Injects element selection capability into an iframe
 */
export function injectEditorScript(
  iframeElement: HTMLIFrameElement,
  config: EditorConfig = {}
): boolean {
  try {
    const iframeDoc =
      iframeElement.contentDocument ||
      iframeElement.contentWindow?.document;

    if (!iframeDoc) {
      console.error('Cannot access iframe document');
      return false;
    }

    // Check if script already exists
    if (iframeDoc.getElementById('editor-script')) {
      console.log('Editor script already injected');
      return true;
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Create and inject the selection script
    const script = iframeDoc.createElement('script');
    script.id = 'editor-script';
    script.textContent = createEditorScript(finalConfig);

    iframeDoc.body.appendChild(script);

    // Initialize the editor
    const initScript = iframeDoc.createElement('script');
    initScript.textContent = 'if (window.initEditor) window.initEditor();';
    iframeDoc.body.appendChild(initScript);

    console.log('Editor script injected successfully');
    return true;
  } catch (error) {
    console.error('Failed to inject editor script:', error);
    return false;
  }
}

/**
 * Removes editor functionality from iframe
 */
export function removeEditorScript(iframeElement: HTMLIFrameElement): boolean {
  try {
    const iframeDoc =
      iframeElement.contentDocument ||
      iframeElement.contentWindow?.document;

    if (!iframeDoc) {
      return false;
    }

    // Call cleanup if available
    const cleanupScript = iframeDoc.createElement('script');
    cleanupScript.textContent = 'if (window.cleanupEditor) window.cleanupEditor();';
    iframeDoc.body.appendChild(cleanupScript);

    // Remove the script elements
    const editorScript = iframeDoc.getElementById('editor-script');
    if (editorScript) {
      editorScript.remove();
    }

    console.log('Editor script removed successfully');
    return true;
  } catch (error) {
    console.error('Failed to remove editor script:', error);
    return false;
  }
}

/**
 * Creates the editor script content that will run inside the iframe
 */
function createEditorScript(config: EditorConfig): string {
  return `
    (function() {
      'use strict';

      // Store references
      let hoveredElement = null;
      let selectedElement = null;
      const originalOutlines = new WeakMap();
      const originalCursors = new WeakMap();
      const originalStyles = new WeakMap(); // Store original styles for reset

      // Elements to ignore
      const IGNORE_ELEMENTS = ['HTML', 'BODY', 'SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE'];

      // Minimum element size to be selectable (in pixels)
      const MIN_ELEMENT_SIZE = 10;

      // Maximum percentage of viewport an element can occupy
      const MAX_VIEWPORT_COVERAGE = 0.85; // 85%

      /**
       * Check if element should be ignored
       */
      function shouldIgnoreElement(element) {
        if (!element || !element.tagName) return true;

        // Ignore specific tags
        if (IGNORE_ELEMENTS.includes(element.tagName.toUpperCase())) {
          return true;
        }

        // Get element dimensions
        const rect = element.getBoundingClientRect();

        // Ignore elements that are too small
        if (rect.width < MIN_ELEMENT_SIZE || rect.height < MIN_ELEMENT_SIZE) {
          return true;
        }

        // Ignore elements that cover most of the viewport (likely containers)
        const viewportArea = window.innerWidth * window.innerHeight;
        const elementArea = rect.width * rect.height;
        const coverage = elementArea / viewportArea;

        if (coverage > MAX_VIEWPORT_COVERAGE) {
          return true;
        }

        // Ignore elements with no visible content (hidden, display none, etc.)
        const styles = window.getComputedStyle(element);
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
          return true;
        }

        return false;
      }

      /**
       * Save original outline style
       */
      function saveOriginalOutline(element) {
        if (!originalOutlines.has(element)) {
          originalOutlines.set(element, {
            outline: element.style.outline || '',
            outlineOffset: element.style.outlineOffset || ''
          });
        }
      }

      /**
       * Restore original outline style
       */
      function restoreOriginalOutline(element) {
        const original = originalOutlines.get(element);
        if (original) {
          element.style.outline = original.outline;
          element.style.outlineOffset = original.outlineOffset;
        }
      }

      /**
       * Apply hover effect to element
       */
      function applyHoverEffect(element) {
        if (shouldIgnoreElement(element) || element === selectedElement) {
          return;
        }

        saveOriginalOutline(element);

        element.style.outline = '${config.hoverBorderWidth} ${config.hoverBorderStyle} ${config.hoverBorderColor}';
        element.style.outlineOffset = '-${config.hoverBorderWidth}';
        element.style.cursor = 'pointer';

        hoveredElement = element;
      }

      /**
       * Store original styles of element for reset
       */
      function storeOriginalStyles(element) {
        if (!originalStyles.has(element)) {
          const computed = window.getComputedStyle(element);
          originalStyles.set(element, {
            textContent: element.textContent,
            fontSize: element.style.fontSize || computed.fontSize,
            fontWeight: element.style.fontWeight || computed.fontWeight,
            color: element.style.color || computed.color,
            backgroundColor: element.style.backgroundColor || computed.backgroundColor,
            textAlign: element.style.textAlign || computed.textAlign,
            // Add more as needed
          });
        }
      }

      /**
       * Apply selection effect to element
       */
      function applySelectionEffect(element) {
        if (shouldIgnoreElement(element)) {
          return;
        }

        saveOriginalOutline(element);
        storeOriginalStyles(element); // Store original styles

        // Solid border for selected element (different from hover)
        element.style.outline = '${config.selectedBorderWidth} dashed ${config.selectedBorderColor}';
        element.style.outlineOffset = '-${config.selectedBorderWidth}';
        element.style.cursor = 'pointer';

        selectedElement = element;
      }

      /**
       * Remove selection effect from element
       */
      function removeSelectionEffect(element) {
        if (!element) return;

        restoreOriginalOutline(element);
        element.style.cursor = '';
      }

      /**
       * Remove hover effect from element
       */
      function removeHoverEffect(element) {
        if (shouldIgnoreElement(element) || element === selectedElement) {
          return;
        }

        restoreOriginalOutline(element);
        element.style.cursor = '';

        if (hoveredElement === element) {
          hoveredElement = null;
        }
      }

      /**
       * Handle mouse over event
       */
      function handleMouseOver(event) {
        const element = event.target;

        if (shouldIgnoreElement(element)) {
          return;
        }

        // Remove hover from previous element
        if (hoveredElement && hoveredElement !== element) {
          removeHoverEffect(hoveredElement);
        }

        applyHoverEffect(element);
      }

      /**
       * Handle mouse out event
       */
      function handleMouseOut(event) {
        const element = event.target;

        if (shouldIgnoreElement(element)) {
          return;
        }

        removeHoverEffect(element);
      }

      /**
       * Extract element information for editing
       */
      function getElementInfo(element) {
        const rect = element.getBoundingClientRect();
        const computedStyles = window.getComputedStyle(element);

        // Get text content (limited to prevent huge payloads)
        let textContent = element.textContent || '';
        if (textContent.length > 500) {
          textContent = textContent.substring(0, 500) + '...';
        }

        // Get innerHTML (limited)
        let innerHTML = element.innerHTML || '';
        if (innerHTML.length > 1000) {
          innerHTML = innerHTML.substring(0, 1000) + '...';
        }

        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          className: element.className || null,
          textContent: textContent.trim(),
          innerHTML: innerHTML,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          styles: {
            fontSize: computedStyles.fontSize,
            fontWeight: computedStyles.fontWeight,
            color: computedStyles.color,
            backgroundColor: computedStyles.backgroundColor,
            padding: computedStyles.padding,
            margin: computedStyles.margin,
            display: computedStyles.display,
            textAlign: computedStyles.textAlign,
            lineHeight: computedStyles.lineHeight,
            fontFamily: computedStyles.fontFamily,
            borderRadius: computedStyles.borderRadius,
            border: computedStyles.border,
            borderColor: computedStyles.borderColor,
            borderWidth: computedStyles.borderWidth,
            borderStyle: computedStyles.borderStyle,
            width: computedStyles.width,
            height: computedStyles.height,
            opacity: computedStyles.opacity,
          },
          // Add data attributes if any
          dataset: element.dataset ? { ...element.dataset } : {},
        };
      }

      /**
       * Handle click event to select element
       */
      function handleClick(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.target;

        if (shouldIgnoreElement(element)) {
          return;
        }

        // Remove hover effect from current element
        if (hoveredElement === element) {
          removeHoverEffect(element);
        }

        // Remove selection from previously selected element
        if (selectedElement && selectedElement !== element) {
          removeSelectionEffect(selectedElement);
        }

        // Apply selection to new element
        applySelectionEffect(element);

        // Get element information
        const elementInfo = getElementInfo(element);

        // Send element info to parent window
        window.parent.postMessage({
          type: 'ELEMENT_SELECTED',
          data: elementInfo,
        }, '*');
      }

      /**
       * Initialize editor
       */
      function initEditor() {
        console.log('Initializing iframe editor');

        // Add event listeners with capture phase for better control
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        document.addEventListener('click', handleClick, true);

        // Prevent default text selection during editing
        document.addEventListener('selectstart', (e) => {
          if (hoveredElement || selectedElement) {
            e.preventDefault();
          }
        }, true);
      }

      /**
       * Cleanup editor
       */
      function cleanupEditor() {
        console.log('Cleaning up iframe editor');

        // Remove event listeners
        document.removeEventListener('mouseover', handleMouseOver, true);
        document.removeEventListener('mouseout', handleMouseOut, true);
        document.removeEventListener('click', handleClick, true);

        // Restore all modified elements
        if (hoveredElement) {
          removeHoverEffect(hoveredElement);
        }

        if (selectedElement) {
          removeSelectionEffect(selectedElement);
        }

        // Clear references
        hoveredElement = null;
        selectedElement = null;
      }

      /**
       * Handle messages from parent window
       */
      function handleParentMessage(event) {
        if (event.data.type === 'APPLY_STYLE' && selectedElement) {
          const { property, value } = event.data;

          // Apply style to selected element
          if (property === 'textContent') {
            selectedElement.textContent = value;
          } else if (property === 'chartData') {
            // Handle chart data updates
            try {
              const parsedData = typeof value === 'string' ? JSON.parse(value) : value;
              if (selectedElement.dataset) {
                selectedElement.dataset.chartData = JSON.stringify(parsedData);
              }
              // Trigger re-render if chart library exposes update method
              if (selectedElement.__chart && typeof selectedElement.__chart.update === 'function') {
                selectedElement.__chart.update(parsedData);
              }
            } catch (error) {
              console.error('Failed to update chart data:', error);
            }
          } else {
            selectedElement.style[property] = value;
          }
        } else if (event.data.type === 'RESET_ELEMENT' && selectedElement) {
          // Reset only the selected element to its original styles
          const original = originalStyles.get(selectedElement);
          if (original) {
            selectedElement.textContent = original.textContent;
            selectedElement.style.fontSize = original.fontSize;
            selectedElement.style.fontWeight = original.fontWeight;
            selectedElement.style.color = original.color;
            selectedElement.style.backgroundColor = original.backgroundColor;
            selectedElement.style.textAlign = original.textAlign;
          }
        }
      }

      // Listen for messages from parent
      window.addEventListener('message', handleParentMessage);

      // Expose functions to window
      window.initEditor = initEditor;
      window.cleanupEditor = cleanupEditor;

    })();
  `;
}

/**
 * Check if iframe is ready for editor injection
 */
export function isIframeReady(iframeElement: HTMLIFrameElement): boolean {
  try {
    const iframeDoc =
      iframeElement.contentDocument ||
      iframeElement.contentWindow?.document;

    return !!(
      iframeDoc &&
      iframeDoc.body &&
      iframeDoc.readyState === 'complete'
    );
  } catch {
    return false;
  }
}

/**
 * Wait for iframe to be ready
 */
export function waitForIframeReady(
  iframeElement: HTMLIFrameElement,
  timeout = 5000
): Promise<boolean> {
  return new Promise((resolve) => {
    if (isIframeReady(iframeElement)) {
      resolve(true);
      return;
    }

    const startTime = Date.now();

    const checkReady = () => {
      if (isIframeReady(iframeElement)) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        console.error('Iframe ready timeout');
        resolve(false);
      } else {
        requestAnimationFrame(checkReady);
      }
    };

    // Listen for load event
    iframeElement.addEventListener('load', () => {
      setTimeout(() => checkReady(), 100);
    });

    checkReady();
  });
}
