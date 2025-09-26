export interface AuditLogUser {
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  user: AuditLogUser;
  action: string;
  actionType: 'form_template_updated' | 'form_generated' | 'form_library_upload' | 'user_permission_updated' | 'batch_processing_completed' | 'field_mapping_updated' | 'template_deleted' | 'user_login' | 'system_backup';
  target: string;
  details: string;
  ipAddress: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditLogFilters {
  search?: string;
  actionType?: string;
  dateRange?: string;
  user?: string;
}