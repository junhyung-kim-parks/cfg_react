import type { BatchJobsResponse, BatchJob, BatchDashboardStats } from '../../features/batch/types';

export function generateBatchProcessingData(): BatchJobsResponse {
  const jobs: BatchJob[] = [
    {
      id: 'batch-001',
      requestedBy: 'Shaun Hill',
      contractNumber: 'Q307-22MA',
      contractRootSocialNumber: 'Q307-22MA_ST_20250924M13_ANZ',
      dateRequested: '2025-01-24T14:13:00Z',
      dateGenerationStarted: '2025-01-24T14:13:00Z',
      dateGenerationCompleted: '2025-01-24T16:48:00Z',
      status: 'Completed',
      downloadUrl: '/downloads/Q307-22MA_ST_20250924M13_ANZ.pdf'
    },
    {
      id: 'batch-002',
      requestedBy: 'Rita Coelho',
      contractNumber: 'Q327-22MJ',
      contractRootSocialNumber: 'Q327-22MJ_3C_20250924T106_LAM',
      dateRequested: '2025-01-25T11:05:00Z',
      dateGenerationStarted: '2025-01-25T11:06:00Z',
      dateGenerationCompleted: '2025-01-25T11:06:00Z',
      status: 'Completed',
      downloadUrl: '/downloads/Q327-22MJ_3C_20250924T106_LAM.pdf'
    },
    {
      id: 'batch-003',
      requestedBy: 'Jennifer Nemeak',
      contractNumber: 'X932-121V',
      contractRootSocialNumber: 'X932-121V_IN_20250924T022_LAM',
      dateRequested: '2025-01-25T10:22:00Z',
      dateGenerationStarted: '2025-01-25T10:25:00Z',
      dateGenerationCompleted: '2025-01-25T10:48:00Z',
      status: 'Completed',
      downloadUrl: '/downloads/X932-121V_IN_20250924T022_LAM.pdf'
    },
    {
      id: 'batch-004',
      requestedBy: 'Shaun Hill',
      contractNumber: 'Q307-22MA',
      contractRootSocialNumber: 'Q307-22MA_FT_20250925T12_ARC',
      dateRequested: '2025-01-25T17:12:00Z',
      dateGenerationStarted: '2025-01-25T23:03:00Z',
      status: 'Error',
      errorMessage: 'Contract number validation failed'
    },
    {
      id: 'batch-005',
      requestedBy: 'Shaun Hill',
      contractNumber: 'Q307-22MA',
      contractRootSocialNumber: 'Q307-22MA_ST_20250925T904_ARC',
      dateRequested: '2025-01-25T21:04:00Z',
      dateGenerationStarted: '2025-01-25T21:04:00Z',
      status: 'Error',
      errorMessage: 'Template parsing error'
    },
    {
      id: 'batch-006',
      requestedBy: 'Amber Martinez',
      contractNumber: 'Q156-129MJ',
      contractRootSocialNumber: 'Q156-129MJ_AB_20250925T502_LAM',
      dateRequested: '2025-01-25T17:02:00Z',
      dateGenerationStarted: '2025-01-25T23:23:00Z',
      dateGenerationCompleted: '2025-01-25T23:36:00Z',
      status: 'Completed',
      downloadUrl: '/downloads/Q156-129MJ_AB_20250925T502_LAM.pdf'
    },
    {
      id: 'batch-007',
      requestedBy: 'Processing System',
      contractNumber: 'AUTO-PROC',
      contractRootSocialNumber: 'AUTO-BATCH-PROCESS-001',
      dateRequested: '2025-01-26T09:00:00Z',
      dateGenerationStarted: '2025-01-26T09:00:00Z',
      status: 'Processing'
    },
    {
      id: 'batch-008',
      requestedBy: 'Emily Chen',
      contractNumber: 'R445-33BA',
      contractRootSocialNumber: 'R445-33BA_MN_20250926T015_DEV',
      dateRequested: '2025-01-26T10:15:00Z',
      status: 'Pending'
    },
    {
      id: 'batch-009',
      requestedBy: 'Michael Johnson',
      contractNumber: 'S678-44CA',
      contractRootSocialNumber: 'S678-44CA_TX_20250926T020_PROD',
      dateRequested: '2025-01-26T10:20:00Z',
      dateGenerationStarted: '2025-01-26T10:25:00Z',
      status: 'Processing'
    },
    {
      id: 'batch-010',
      requestedBy: 'Sarah Williams',
      contractNumber: 'T789-55DA',
      contractRootSocialNumber: 'T789-55DA_FL_20250926T030_TEST',
      dateRequested: '2025-01-26T10:30:00Z',
      dateGenerationStarted: '2025-01-26T10:35:00Z',
      status: 'Error',
      errorMessage: 'Network timeout during form generation'
    }
  ];

  // Calculate stats from the jobs data
  const statusCounts = [
    {
      status: 'Processing' as const,
      count: jobs.filter(job => job.status === 'Processing').length,
      enabled: true
    },
    {
      status: 'Completed' as const,
      count: jobs.filter(job => job.status === 'Completed').length,
      enabled: true
    },
    {
      status: 'Pending' as const,
      count: jobs.filter(job => job.status === 'Pending').length,
      enabled: true
    },
    {
      status: 'Error' as const,
      count: jobs.filter(job => job.status === 'Error').length,
      enabled: true
    }
  ];

  const stats: BatchDashboardStats = {
    statusCounts,
    totalJobs: jobs.length,
    lastUpdated: new Date().toISOString()
  };

  return {
    jobs,
    total: jobs.length,
    stats
  };
}

export function generateBatchJobById(id: string): BatchJob | null {
  const data = generateBatchProcessingData();
  return data.jobs.find(job => job.id === id) || null;
}

export function generateFilteredBatchJobs(filters: {
  status?: string;
  search?: string;
  requestedBy?: string;
}): BatchJobsResponse {
  const data = generateBatchProcessingData();
  
  let filteredJobs = data.jobs;
  
  if (filters.status && filters.status !== 'all') {
    filteredJobs = filteredJobs.filter(job => job.status === filters.status);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredJobs = filteredJobs.filter(job =>
      job.contractNumber.toLowerCase().includes(searchLower) ||
      job.requestedBy.toLowerCase().includes(searchLower) ||
      job.contractRootSocialNumber.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.requestedBy) {
    filteredJobs = filteredJobs.filter(job =>
      job.requestedBy.toLowerCase().includes(filters.requestedBy!.toLowerCase())
    );
  }
  
  return {
    jobs: filteredJobs,
    total: filteredJobs.length,
    stats: data.stats
  };
}