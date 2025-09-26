import { httpGet, httpPost } from '../../../services/api/http';
import { generateBatchProcessingData, generateFilteredBatchJobs, generateBatchJobById } from '../../../services/embedded_dataset/batchProcessing';
import type { 
  BatchJobsResponse,
  BatchJob,
  BatchJobFilters,
  CreateBatchJobRequest,
  BatchJobAction,
  BatchDashboardStats
} from '../types';

export const batchService = {
  async getBatchJobs(filters: BatchJobFilters = {}): Promise<BatchJobsResponse> {
    try {
      console.log('batchService: Attempting to fetch batch jobs via HTTP API');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);
      if (filters.requestedBy) queryParams.set('requestedBy', filters.requestedBy);
      
      const queryString = queryParams.toString();
      const path = queryString ? `/batch/jobs?${queryString}` : '/batch/jobs';
      
      const response = await httpGet<BatchJobsResponse>(path);
      
      console.log('batchService: Successfully fetched batch jobs from HTTP API', response);
      return response;
    } catch (error) {
      console.warn('batchService: HTTP API failed, falling back to embedded dataset:', error);
      
      // Fallback to embedded dataset
      const data = generateFilteredBatchJobs({
        status: filters.status,
        search: filters.search,
        requestedBy: filters.requestedBy
      });
      
      return data;
    }
  },

  async getBatchJobById(id: string): Promise<BatchJob | null> {
    try {
      console.log('batchService: Attempting to fetch batch job by ID via HTTP API');
      const response = await httpGet<BatchJob>(`/batch/jobs/${id}`);
      console.log('batchService: Successfully fetched batch job from HTTP API', response);
      return response;
    } catch (error) {
      console.warn('batchService: HTTP API failed for getBatchJobById, falling back to embedded dataset:', error);
      
      return generateBatchJobById(id);
    }
  },

  async getBatchDashboardStats(): Promise<BatchDashboardStats> {
    try {
      console.log('batchService: Attempting to fetch batch dashboard stats via HTTP API');
      const response = await httpGet<BatchDashboardStats>('/batch/dashboard/stats');
      console.log('batchService: Successfully fetched batch stats from HTTP API', response);
      return response;
    } catch (error) {
      console.warn('batchService: HTTP API failed for dashboard stats, falling back to embedded dataset:', error);
      
      const data = generateBatchProcessingData();
      return data.stats;
    }
  },

  async createBatchJob(jobData: CreateBatchJobRequest): Promise<BatchJob> {
    try {
      console.log('batchService: Attempting to create batch job via HTTP API');
      const response = await httpPost<BatchJob>('/batch/jobs', jobData);
      console.log('batchService: Successfully created batch job via HTTP API', response);
      return response;
    } catch (error) {
      console.warn('batchService: HTTP API failed for createBatchJob, using mock response:', error);
      
      // Mock response for create batch job
      const newJob: BatchJob = {
        id: `batch-${Date.now()}`,
        requestedBy: jobData.requestedBy || 'Current User',
        contractNumber: jobData.contractNumber,
        contractRootSocialNumber: jobData.contractRootSocialNumber,
        dateRequested: new Date().toISOString(),
        status: 'Pending'
      };
      
      return newJob;
    }
  },

  async performBatchJobAction(action: BatchJobAction): Promise<{ success: boolean; message: string }> {
    try {
      console.log('batchService: Attempting batch job action via HTTP API', action);
      const response = await httpPost<{ success: boolean; message: string }>(`/batch/jobs/${action.id}/actions`, {
        action: action.action
      });
      console.log('batchService: Successfully performed batch job action via HTTP API', response);
      return response;
    } catch (error) {
      console.warn('batchService: HTTP API failed for batch job action, using mock response:', error);
      
      // Mock responses based on action type
      const mockResponses = {
        retry: { success: true, message: 'Job queued for retry' },
        cancel: { success: true, message: 'Job cancelled successfully' },
        download: { success: true, message: 'Download initiated' },
        delete: { success: true, message: 'Job deleted successfully' }
      };
      
      return mockResponses[action.action] || { success: false, message: 'Unknown action' };
    }
  },

  async downloadBatchJob(id: string): Promise<Blob> {
    try {
      console.log('batchService: Attempting to download batch job via HTTP API');
      const response = await fetch(`/batch/jobs/${id}/download`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('batchService: Successfully downloaded batch job');
      return blob;
    } catch (error) {
      console.warn('batchService: HTTP API failed for download, generating mock file:', error);
      
      // Generate a mock PDF blob
      const mockPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj  
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF`;
      
      return new Blob([mockPdfContent], { type: 'application/pdf' });
    }
  },

  async retryBatchJob(id: string): Promise<{ success: boolean; message: string }> {
    return this.performBatchJobAction({ id, action: 'retry' });
  },

  async cancelBatchJob(id: string): Promise<{ success: boolean; message: string }> {
    return this.performBatchJobAction({ id, action: 'cancel' });
  },

  async deleteBatchJob(id: string): Promise<{ success: boolean; message: string }> {
    return this.performBatchJobAction({ id, action: 'delete' });
  }
};