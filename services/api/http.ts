import { getRuntimeConfig } from './runtime';
import { getXsrfToken } from '../../utils/csrf';

// Access token storage (in-memory, not localStorage)
let accessToken: string | null = null;

// Token refresh promise to prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  console.log('🔑 Access token updated:', token ? 'SET' : 'CLEARED');
}

export function getAccessToken(): string | null {
  return accessToken;
}

function resolveUrl(path: string): string {
  const config = getRuntimeConfig();
  const base = (config?.API_BASE || (import.meta?.env?.VITE_API_BASE) || '').trim();

  // absolute URL → use as-is
  if (/^https?:\/\//i.test(path)) return path;

  // server mode: prepend base
  if (base) {
    const cleaned = path.replace(/^\//, '');
    return new URL((base.endsWith('/') ? base : base + '/') + cleaned).toString();
  }

  // mock mode: map logical paths to /mock/*.json
  let cleaned = path.replace(/^\//, '').replace(/^mock\//, '');
  
  // Special mapping for auth endpoints
  if (cleaned.startsWith('auth/')) {
    cleaned = cleaned.replace(/\//g, '_');
  }
  
  const file = cleaned.endsWith('.json') ? cleaned : `${cleaned}.json`;
  return `/mock/${file}`;
}

/**
 * Build headers with Authorization and CSRF tokens
 */
function buildHeaders(init: RequestInit = {}, skipCsrf = false): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> || {})
  };

  // Add Authorization header if access token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Add CSRF header for non-login requests (if token exists)
  if (!skipCsrf) {
    const xsrfToken = getXsrfToken();
    if (xsrfToken) {
      headers['X-CSRF-Token'] = xsrfToken;
    }
  }

  return headers;
}

export async function httpGet<T>(path: string, init: RequestInit = {}, skipAuth = false): Promise<T> {
  const url = resolveUrl(path);
  console.log(`🚀 HTTP GET: ${path} -> ${url}`);
  
  const headers = skipAuth ? { Accept: 'application/json', ...(init.headers || {}) } : buildHeaders(init);
  
  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers,
    credentials: 'include', // Important: Send cookies (for RT)
  });
  
  // Handle 401 Unauthorized - attempt token refresh
  if (res.status === 401 && !skipAuth && accessToken) {
    console.log('⚠️ HTTP GET received 401, attempting token refresh...');
    const refreshed = await attemptTokenRefresh();
    
    if (refreshed) {
      console.log('🔄 Retrying GET request with new access token...');
      // Retry request with new token
      return httpGet<T>(path, init, skipAuth);
    } else {
      console.log('❌ Token refresh failed, throwing 401 error');
      throw new Error(`GET ${url} -> 401 Unauthorized (refresh failed)`);
    }
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText} | body: ${text.slice(0, 180)}`);
  }
  
  console.log(`✅ HTTP GET successful: ${url}`);
  const data = await res.json() as T;
  console.log(`📊 Data received:`, data);
  return data;
}

export async function httpPost<T>(
  path: string, 
  body?: any, 
  init: RequestInit = {}, 
  skipAuth = false,
  skipCsrf = false
): Promise<T> {
  const config = getRuntimeConfig();
  const base = (config?.API_BASE || (import.meta?.env?.VITE_API_BASE) || '').trim();
  
  // In mock mode, POST requests will fail and should use fallback logic in services
  if (!base) {
    console.log(`🚀 HTTP POST (Mock Mode): ${path} - will throw for fallback`);
    throw new Error(`Mock mode: POST ${path} not supported, use embedded dataset fallback`);
  }
  
  const url = resolveUrl(path);
  console.log(`🚀 HTTP POST: ${path} -> ${url}`);
  console.log(`📋 POST Body:`, body);
  
  const headers = skipAuth 
    ? { 
        'Content-Type': 'application/json',
        Accept: 'application/json', 
        ...(init.headers || {}) 
      }
    : {
        'Content-Type': 'application/json',
        ...buildHeaders(init, skipCsrf)
      };
  
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers,
    credentials: 'include', // Important: Send cookies (for RT)
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // Handle 401 Unauthorized - attempt token refresh (but not for refresh endpoint itself)
  if (res.status === 401 && !skipAuth && accessToken && path !== '/auth/refresh') {
    console.log('⚠️ HTTP POST received 401, attempting token refresh...');
    const refreshed = await attemptTokenRefresh();
    
    if (refreshed) {
      console.log('🔄 Retrying POST request with new access token...');
      // Retry request with new token
      return httpPost<T>(path, body, init, skipAuth, skipCsrf);
    } else {
      console.log('❌ Token refresh failed, throwing 401 error');
      throw new Error(`POST ${url} -> 401 Unauthorized (refresh failed)`);
    }
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${url} -> ${res.status} ${res.statusText} | body: ${text.slice(0, 180)}`);
  }
  
  console.log(`✅ HTTP POST successful: ${url}`);
  const data = await res.json() as T;
  console.log(`📊 Data received:`, data);
  return data;
}

/**
 * Attempt to refresh the access token using the refresh token cookie
 * Returns true if refresh was successful, false otherwise
 */
async function attemptTokenRefresh(): Promise<boolean> {
  // If already refreshing, wait for that promise
  if (refreshPromise) {
    console.log('🔄 Token refresh already in progress, waiting...');
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log('🔄 Attempting to refresh access token...');
      
      // The refresh endpoint itself needs CSRF but not Authorization
      const xsrfToken = getXsrfToken();
      if (!xsrfToken) {
        console.log('❌ No XSRF token found, cannot refresh');
        return false;
      }

      const url = resolveUrl('/auth/refresh');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': xsrfToken,
        },
        credentials: 'include', // Send RT cookie
      });

      if (!res.ok) {
        console.log('❌ Token refresh failed:', res.status, res.statusText);
        // Clear access token on refresh failure
        accessToken = null;
        return false;
      }

      const data = await res.json() as { access: string };
      console.log('✅ Token refresh successful');
      
      // Update in-memory access token
      accessToken = data.access;
      
      return true;
    } catch (error) {
      console.log('❌ Token refresh error:', error);
      accessToken = null;
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}