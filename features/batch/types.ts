export type BatchStatus = 'Processing' | 'Completed' | 'Pending' | 'Error';

export interface BatchJob {
  id: string;
  requestedBy: string;
  contractNumber: string;
  contractRootSocialNumber: string;
  dateRequested: string;
  dateGenerationStarted?: string;
  dateGenerationCompleted?: string;
  status: BatchStatus;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface BatchStatusCount {
  status: BatchStatus;
  count: number;
  enabled: boolean;
}

export interface BatchDashboardStats {
  statusCounts: BatchStatusCount[];
  totalJobs: number;
  lastUpdated: string;
}

export interface BatchJobsResponse {
  jobs: BatchJob[];
  total: number;
  stats: BatchDashboardStats;
}

export interface BatchJobFilters {
  status?: BatchStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  requestedBy?: string;
}

export interface CreateBatchJobRequest {
  contractNumber: string;
  contractRootSocialNumber: string;
  requestedBy?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface BatchJobAction {
  id: string;
  action: 'retry' | 'cancel' | 'download' | 'delete';
}