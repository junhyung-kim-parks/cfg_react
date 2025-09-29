import { getRuntimeConfig } from './runtime';

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

export async function httpGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = resolveUrl(path);
  console.log(`🚀 HTTP GET: ${path} -> ${url}`);
  
  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: { Accept: 'application/json', ...(init.headers || {}) },
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText} | body: ${text.slice(0, 180)}`);
  }
  
  console.log(`✅ HTTP GET successful: ${url}`);
  const data = await res.json() as T;
  console.log(`📊 Data received:`, data);
  return data;
}

export async function httpPost<T>(path: string, body?: any, init: RequestInit = {}): Promise<T> {
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
  
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Accept: 'application/json', 
      ...(init.headers || {}) 
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${url} -> ${res.status} ${res.statusText} | body: ${text.slice(0, 180)}`);
  }
  
  console.log(`✅ HTTP POST successful: ${url}`);
  const data = await res.json() as T;
  console.log(`📊 Data received:`, data);
  return data;
}