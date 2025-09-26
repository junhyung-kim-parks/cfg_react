import { httpGet } from '../../../services/api/http';
import { dashboardStatsData } from '../../../services/embedded_dataset/dashboardStats';
import type { DashboardStats } from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  console.log('📊 Dashboard Service: Loading dashboard stats...');
  
  try {
    const data = await httpGet<DashboardStats>('/dashboardStats');
    console.log('📊 Dashboard Service: Successfully loaded from HTTP API');
    return data;
  } catch (error) {
    console.warn('📊 Dashboard Service: HTTP API failed, using embedded dataset fallback:', error);
    console.log('📊 Dashboard Service: Loading from embedded dataset...');
    return dashboardStatsData;
  }
}