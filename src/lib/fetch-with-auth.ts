/**
 * Fetch wrapper with automatic token refresh on 401 errors
 *
 * This utility automatically handles token refresh when the access token expires.
 * When a 401 error is received:
 * 1. Calls /auth/refresh to get a new access token
 * 2. Retries the original request with the new token
 * 3. Returns the result seamlessly to the caller
 *
 * If token refresh fails (refresh token expired), redirects to login.
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh the access token using the refresh token cookie
 * @returns Promise<boolean> - true if refresh succeeded, false otherwise
 */
async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      console.log('🔄 Refreshing access token...');

      const refreshResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          method: 'POST',
          credentials: 'include', // Sends refresh_token cookie
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (refreshResponse.ok) {
        console.log('✅ Token refresh successful');
        return true;
      } else {
        console.error('❌ Token refresh failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch with automatic authentication and token refresh
 * @param url - The URL to fetch
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Promise<Response> - The fetch response
 * @throws Error if the request fails after retry
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure credentials are included to send cookies
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };

  // Make the initial request
  let response = await fetch(url, fetchOptions);

  // If 401 Unauthorized, attempt token refresh and retry
  if (response.status === 401) {
    console.log('🔐 Received 401, attempting token refresh...');

    // Attempt to refresh the token
    const refreshSucceeded = await refreshAccessToken();

    if (refreshSucceeded) {
      console.log('♻️  Retrying original request with new token...');

      // Retry the original request with the new access token
      response = await fetch(url, fetchOptions);

      if (response.ok) {
        console.log('✅ Request succeeded after token refresh');
      }
    } else {
      // Refresh failed - clear any stale state and redirect to login
      console.error('🚪 Token refresh failed, redirecting to login...');

      // Small delay to prevent multiple redirects
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);

      throw new Error('Session expired, please login again');
    }
  }

  return response;
}

/**
 * Check if the current session is valid
 * This can be used to proactively check auth status
 * @returns Promise<boolean> - true if session is valid
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
      {
        method: 'GET',
      }
    );
    return response.ok;
  } catch (error) {
    return false;
  }
}
