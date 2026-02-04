/**
 * API utilities for report operations
 */

import { fetchWithAuth } from './fetch-with-auth'

/**
 * Fetches a report's HTML content by report ID
 * @param reportId - The unique identifier of the report
 * @returns Promise containing the report HTML code
 * @throws Error if the request fails or response is invalid
 */
export async function fetchReportById(reportId: string): Promise<string> {
  let response: Response;

  try {
    response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/get-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ report_id: reportId }),
    });
  } catch (networkError) {
    throw networkError instanceof Error
      ? networkError
      : new Error('Network error while fetching report');
  }

  if (!response.ok) {
    const bodyText = await response.json().catch(() => ({}));
    const detail = bodyText?.detail;
    let errorMessage = 'Failed to fetch report';

    if (typeof detail === 'object' && detail !== null) {
      errorMessage = detail.error || detail.message || JSON.stringify(detail);
    } else if (typeof detail === 'string') {
      errorMessage = detail;
    }

    throw new Error(errorMessage);
  }

  try {
    const data = await response.json();

    // Validate response structure
    if (!data || typeof data.report_code?.html !== 'string') {
      throw new Error('Invalid report response format');
    }

    return data.report_code.html;
  } catch (parseError) {
    throw new Error('Failed to parse report response');
  }
}

/**
 * Type guard to check if report output is a report ID reference
 * @param output - The report output to check
 * @returns true if output is an object with report_id field
 */
export function isReportIdReference(
  output: unknown
): output is { report_id: string } {
  return (
    typeof output === 'object' &&
    output !== null &&
    'report_id' in output &&
    typeof (output as any).report_id === 'string'
  );
}

/**
 * Type guard to check if report output is direct HTML content
 * @param output - The report output to check
 * @returns true if output is a string
 */
export function isDirectHtmlContent(output: unknown): output is string {
  return typeof output === 'string';
}

/**
 * Report data structure from the API
 * Note: Some fields can be null/undefined from the backend
 */
export interface Report {
  id: string;
  created_at?: string | null;
  session_id?: string | null;
  chat_id?: string | null;
  snapshot_url?: string | null;
  status?: string | null;
  name?: string | null;
  description?: string | null;
}

/**
 * API response for fetching all reports
 */
export interface FetchReportsResponse {
  reports: Report[];
  count: number;
}

/**
 * Fetches all user reports
 * @returns Promise containing reports array and count
 * @throws Error if the request fails or response is invalid
 */
export async function fetchAllReports(): Promise<FetchReportsResponse> {
  let response: Response;

  try {
    response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  } catch (networkError) {
    throw networkError instanceof Error
      ? networkError
      : new Error('Network error while fetching reports');
  }

  if (!response.ok) {
    const bodyText = await response.json().catch(() => ({}));
    const detail = bodyText?.detail;
    let errorMessage = 'Failed to fetch reports';

    if (typeof detail === 'object' && detail !== null) {
      errorMessage = detail.error || detail.message || JSON.stringify(detail);
    } else if (typeof detail === 'string') {
      errorMessage = detail;
    }

    throw new Error(errorMessage);
  }

  try {
    const data = await response.json();

    // Validate response structure
    if (!data || !Array.isArray(data.reports)) {
      throw new Error('Invalid reports response format');
    }

    return {
      reports: data.reports,
      count: data.count || data.reports.length,
    };
  } catch (parseError) {
    throw new Error('Failed to parse reports response');
  }
}
