/**
 * Graph Editor Utilities
 * Advanced utilities for detecting and modifying chart/graph data
 */

import { SelectedElementData } from '@/types/editor';

export interface ChartDetectionResult {
  library: 'chartjs' | 'recharts' | 'd3' | 'plotly' | 'highcharts' | 'unknown';
  hasDataAttribute: boolean;
  canEdit: boolean;
  dataPath?: string;
}

/**
 * Detect chart library and data structure
 */
export function detectChartLibrary(element: SelectedElementData): ChartDetectionResult {
  const result: ChartDetectionResult = {
    library: 'unknown',
    hasDataAttribute: false,
    canEdit: false
  };

  const className = element.className?.toLowerCase() || '';
  const innerHTML = element.innerHTML?.toLowerCase() || '';

  // Chart.js detection
  if (className.includes('chartjs') || innerHTML.includes('chartjs-')) {
    result.library = 'chartjs';
    result.canEdit = true;
  }
  // Recharts (React charting library)
  else if (className.includes('recharts')) {
    result.library = 'recharts';
    result.canEdit = false; // React component, harder to edit
  }
  // D3.js
  else if (className.includes('d3') || element.dataset?.d3 !== undefined) {
    result.library = 'd3';
    result.canEdit = true;
  }
  // Plotly
  else if (className.includes('plotly') || className.includes('js-plotly')) {
    result.library = 'plotly';
    result.canEdit = true;
  }
  // Highcharts
  else if (className.includes('highcharts')) {
    result.library = 'highcharts';
    result.canEdit = true;
  }

  // Check for data attributes
  if (element.dataset) {
    const hasData = element.dataset.chart ||
                   element.dataset.chartData ||
                   element.dataset.graphData;
    result.hasDataAttribute = !!hasData;
    if (hasData) {
      result.canEdit = true;
    }
  }

  return result;
}

/**
 * Extract chart data if available
 */
export function extractChartData(element: SelectedElementData): any {
  try {
    // Try to get data from data attributes
    if (element.dataset?.chartData) {
      return JSON.parse(element.dataset.chartData);
    }
    if (element.dataset?.graphData) {
      return JSON.parse(element.dataset.graphData);
    }
  } catch (error) {
    console.error('Failed to parse chart data:', error);
  }

  return null;
}

/**
 * Generate a message to parent to update chart data
 * This requires custom implementation in iframe-editor.ts
 */
export function createChartUpdateMessage(
  property: string,
  value: any
): { type: string; property: string; value: any } {
  return {
    type: 'UPDATE_CHART_DATA',
    property,
    value
  };
}

/**
 * Get editable properties based on chart type
 */
export function getEditableChartProperties(detection: ChartDetectionResult): string[] {
  const baseProperties = ['backgroundColor', 'borderColor', 'opacity'];

  switch (detection.library) {
    case 'chartjs':
      return [...baseProperties, 'data', 'labels', 'type'];
    case 'd3':
      return [...baseProperties, 'fill', 'stroke', 'strokeWidth'];
    case 'plotly':
      return [...baseProperties, 'data', 'layout'];
    case 'highcharts':
      return [...baseProperties, 'series', 'title'];
    default:
      return baseProperties;
  }
}
