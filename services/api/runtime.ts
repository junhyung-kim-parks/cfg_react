export type AppConfig = { API_BASE: string; routing?: boolean };

let runtimeConfig: AppConfig = { API_BASE: '', routing: false };

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('/app-config.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load app-config.json: ${response.status}`);
    }
    runtimeConfig = await response.json();
  } catch (error) {
    console.warn('Failed to load runtime config, using defaults:', error);
    runtimeConfig = { API_BASE: '', routing: false };
  }
}

export function getRuntimeConfig(): AppConfig {
  return runtimeConfig;
}