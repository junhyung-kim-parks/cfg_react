import { httpGet } from '../../../services/api/http';
import { generateAuditLogs } from '../../../services/embedded_dataset/auditLogs';
import type { AuditLogsResponse, AuditLogFilters } from '../types';

export const auditLogsService = {
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogsResponse> {
    try {
      console.log('auditLogsService: Attempting to fetch audit logs via HTTP API');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.actionType) queryParams.set('actionType', filters.actionType);
      if (filters.dateRange) queryParams.set('dateRange', filters.dateRange);
      if (filters.user) queryParams.set('user', filters.user);
      
      const queryString = queryParams.toString();
      const path = queryString ? `/auditLogs?${queryString}` : '/auditLogs';
      
      const response = await httpGet<AuditLogsResponse>(path);
      
      console.log('auditLogsService: Successfully fetched audit logs from HTTP API', response);
      return response;
    } catch (error) {
      console.warn('auditLogsService: HTTP API failed, falling back to embedded dataset:', error);
      
      // Fallback to embedded dataset
      const auditLogs = generateAuditLogs();
      
      // Apply client-side filtering if filters are provided
      if (filters.search || filters.actionType || filters.user) {
        const filteredLogs = auditLogs.logs.filter(log => {
          const matchesSearch = !filters.search || 
            log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
            log.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            log.target.toLowerCase().includes(filters.search.toLowerCase()) ||
            log.details.toLowerCase().includes(filters.search.toLowerCase());
          
          const matchesActionType = !filters.actionType || 
            filters.actionType === 'all' ||
            log.actionType === filters.actionType;
          
          const matchesUser = !filters.user ||
            log.user.email === filters.user;
          
          return matchesSearch && matchesActionType && matchesUser;
        });
        
        return {
          ...auditLogs,
          logs: filteredLogs,
          total: filteredLogs.length
        };
      }
      
      return auditLogs;
    }
  },

  async exportAuditLogsToCSV(filters: AuditLogFilters = {}): Promise<string> {
    try {
      const response = await this.getAuditLogs(filters);
      
      const headers = ['Timestamp', 'User', 'Action', 'Target', 'Details', 'IP Address'];
      const csvContent = [
        headers.join(','),
        ...response.logs.map(log => [
          log.timestamp,
          `"${log.user.name} (${log.user.email})"`,
          `"${log.action}"`,
          `"${log.target}"`,
          `"${log.details}"`,
          log.ipAddress
        ].join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('auditLogsService: Failed to export audit logs to CSV:', error);
      throw error;
    }
  }
};