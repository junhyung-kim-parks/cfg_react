import { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { auditLogsService } from '../services/auditLogs.service';
import type { AuditLogEntry, AuditLogFilters } from '../types';

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('last_7_days');
  const [selectedUser, setSelectedUser] = useState('');
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    loadAuditLogs();
  }, [debouncedSearchQuery, selectedActionType, selectedDateRange, selectedUser]);
  
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: AuditLogFilters = {
        search: debouncedSearchQuery || undefined,
        actionType: selectedActionType !== 'all' ? selectedActionType : undefined,
        dateRange: selectedDateRange,
        user: selectedUser || undefined
      };
      
      const response = await auditLogsService.getAuditLogs(filters);
      
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      console.error('useAuditLogs: Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const exportToCSV = async () => {
    try {
      const filters: AuditLogFilters = {
        search: debouncedSearchQuery || undefined,
        actionType: selectedActionType !== 'all' ? selectedActionType : undefined,
        dateRange: selectedDateRange,
        user: selectedUser || undefined
      };
      
      const csvContent = await auditLogsService.exportAuditLogsToCSV(filters);
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('useAuditLogs: Error exporting to CSV:', err);
      setError('Failed to export audit logs');
    }
  };
  
  const refresh = () => {
    loadAuditLogs();
  };
  
  return {
    logs,
    loading,
    error,
    total,
    searchQuery,
    setSearchQuery,
    selectedActionType,
    setSelectedActionType,
    selectedDateRange,
    setSelectedDateRange,
    selectedUser,
    setSelectedUser,
    exportToCSV,
    refresh
  };
}