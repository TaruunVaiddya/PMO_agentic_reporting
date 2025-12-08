/**
 * Editor Utilities
 * Helper functions for the editor
 */

import { SelectedElementData } from '@/types/editor';

const TEXT_ELEMENTS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li', 'td', 'th', 'label', 'button'];
const IMAGE_ELEMENTS = ['img'];
const GRAPH_ELEMENTS = ['svg', 'canvas'];
const CONTAINER_ELEMENTS = ['div', 'section', 'article', 'aside', 'main', 'figure'];

export function isTextElement(tagName: string): boolean {
  return TEXT_ELEMENTS.includes(tagName.toLowerCase());
}

export function isImageElement(tagName: string): boolean {
  return IMAGE_ELEMENTS.includes(tagName.toLowerCase());
}

export function isGraphElement(element: SelectedElementData): boolean {
  const tag = element.tagName.toLowerCase();

  // Direct SVG or Canvas elements
  if (GRAPH_ELEMENTS.includes(tag)) {
    return true;
  }

  // Check if it's a container with chart-related classes or data attributes
  if (CONTAINER_ELEMENTS.includes(tag)) {
    const className = element.className?.toLowerCase() || '';
    const hasChartClass = className.includes('chart') ||
                         className.includes('graph') ||
                         className.includes('plot') ||
                         className.includes('visualization');

    // Check for common chart library attributes
    const hasChartData = element.dataset && (
      element.dataset.chart !== undefined ||
      element.dataset.chartType !== undefined ||
      element.dataset.graph !== undefined
    );

    // Check if innerHTML contains SVG or Canvas
    const hasGraphChild = element.innerHTML?.includes('<svg') ||
                         element.innerHTML?.includes('<canvas');

    return hasChartClass || hasChartData || hasGraphChild;
  }

  return false;
}

export function isContainerElement(tagName: string): boolean {
  return CONTAINER_ELEMENTS.includes(tagName.toLowerCase());
}

/**
 * Apply style change to iframe element
 */
export function applyStyleToIframe(
  iframe: HTMLIFrameElement | null,
  elementPath: string,
  property: string,
  value: string
): boolean {
  if (!iframe?.contentWindow) return false;

  try {
    iframe.contentWindow.postMessage({
      type: 'APPLY_STYLE',
      property,
      value
    }, '*');
    return true;
  } catch (error) {
    console.error('Failed to apply style:', error);
    return false;
  }
}
