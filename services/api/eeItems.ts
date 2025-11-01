import { httpGet } from './http';
import { EMBEDDED_EE_ITEMS } from '../embedded_dataset/eeItems';
import type { EEItem } from '../embedded_dataset/eeItems';

/**
 * Get all available EE items
 */
export async function getEEItems(): Promise<EEItem[]> {
  console.log('📋 EE Items Service: Fetching EE items');
  
  try {
    // Try HTTP API first
    const data = await httpGet<EEItem[]>('/eeItems');
    console.log('✅ EE Items Service: HTTP API succeeded');
    return data;
  } catch (error) {
    // Fall back to embedded dataset
    console.warn('⚠️ EE Items Service: HTTP API failed, using embedded dataset:', error);
    return EMBEDDED_EE_ITEMS;
  }
}
