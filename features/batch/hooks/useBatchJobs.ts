import { useState, useEffect, useCallback } from 'react';
import { batchService } from '../services/batch.service';
import type { BatchJobsResponse, BatchJobFilters, BatchDashboardStats } from '../types';

export function useBatchJobs(initialFilters: BatchJobFilters = {}) {
  const [data, setData] = useState<BatchJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BatchJobFilters>(initialFilters);

  const fetchJobs = useCallback(async (currentFilters: BatchJobFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      console.log('useBatchJobs: Fetching batch jobs with filters:', currentFilters);
      
      const response = await batchService.getBatchJobs(currentFilters);
      
      console.log('useBatchJobs: Successfully fetched batch jobs:', response);
      setData(response);
    } catch (err) {
      console.error('useBatchJobs: Failed to fetch batch jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch batch jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<BatchJobFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchJobs(updatedFilters);
  }, [filters, fetchJobs]);

  const refresh = useCallback(() => {
    fetchJobs(filters);
  }, [fetchJobs, filters]);

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refresh
  };
}

export function useBatchDashboardStats() {
  const [stats, setStats] = useState<BatchDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('useBatchDashboardStats: Fetching dashboard stats');
      
      const response = await batchService.getBatchDashboardStats();
      
      console.log('useBatchDashboardStats: Successfully fetched stats:', response);
      setStats(response);
    } catch (err) {
      console.error('useBatchDashboardStats: Failed to fetch stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh
  };
}