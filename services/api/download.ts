import { getRuntimeConfig } from './runtime';
import { mockDownloadTemplate, mockDownloadSingleFormPdf } from '../mocks/downloadMocks';

export interface DownloadRequest {
  formIds: string[];
  projectData?: {
    name: string;
    id: string;
    manager?: string;
    location?: string;
  };
  formFieldsData?: {[formId: string]: any};
}

export interface SingleFormDownloadRequest {
  form_id: string;
  pdf: string;
  fields: Array<{
    map_id: string;
    label: string;
    value: string | number | boolean;
    source_col: string;
    data_type: 'text' | 'number' | 'boolean' | 'date';
    display_order?: number;
  }>;
}

export interface DownloadResponse {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  message?: string;
  downloadedFiles?: number;
}

// Overloaded function signatures for backward compatibility
export async function downloadTemplate(formIds: string[], formFieldsData: {[formId: string]: any}): Promise<DownloadResponse>;
export async function downloadTemplate(request: DownloadRequest): Promise<DownloadResponse>;
export async function downloadTemplate(
  formIdsOrRequest: string[] | DownloadRequest, 
  formFieldsData?: {[formId: string]: any}
): Promise<DownloadResponse> {
  // Handle both call signatures
  let request: DownloadRequest;
  if (Array.isArray(formIdsOrRequest)) {
    // Legacy call: downloadTemplate(formIds, formFieldsData)
    request = {
      formIds: formIdsOrRequest,
      formFieldsData: formFieldsData || {}
    };
  } else {
    // New call: downloadTemplate(request)
    request = formIdsOrRequest;
  }
  const config = getRuntimeConfig();
  const baseUrl = config.API_BASE?.trim();

  console.log('📄 Download API: Starting download request', {
    formIds: request.formIds,
    baseUrl: baseUrl || 'mock mode',
    formFieldsDataKeys: Object.keys(request.formFieldsData || {})
  });

  // If we have a base URL, try the real API first
  if (baseUrl) {
    try {
      console.log('📄 Download API: Attempting HTTP request to:', `${baseUrl}/api/forms/download`);
      
      const response = await fetch(`${baseUrl}/api/forms/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📄 Download API: HTTP service succeeded:', result);
        return {
          ...result,
          downloadedFiles: request.formIds.length
        };
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn('📄 Download API: HTTP service failed with status:', response.status, errorText);
      }
    } catch (error) {
      console.warn('📄 Download API: HTTP service failed:', error);
    }
  }

  // Fallback: Mock download functionality
  console.log('📄 Download API: Using mock download fallback');
  return mockDownloadTemplate(request);
}

/**
 * Download a single filled PDF form
 * @param request - Single form download request with form_id, pdf name, and fields
 * @returns PDF blob for download
 */
export async function downloadSingleFormPdf(request: SingleFormDownloadRequest): Promise<void> {
  const config = getRuntimeConfig();
  const baseUrl = config.API_BASE?.trim();

  console.log('📄 Single Form Download API: Starting download request', {
    formId: request.form_id,
    pdfName: request.pdf,
    fieldsCount: request.fields.length,
    baseUrl: baseUrl || 'mock mode',
  });

  // If we have a base URL, try the real API first
  if (baseUrl) {
    try {
      console.log('📄 Single Form Download API: Attempting HTTP request to:', `${baseUrl}/api/forms/fill-pdf`);
      
      const response = await fetch(`${baseUrl}/cfg/fill-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        console.log('📄 Single Form Download API: HTTP service succeeded, downloading PDF...');
        
        // Get the PDF blob from response
        const blob = await response.blob();
        
        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = request.pdf;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        // Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('📄 Single Form Download API: PDF downloaded successfully:', filename);
        return;
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn('📄 Single Form Download API: HTTP service failed with status:', response.status, errorText);
        throw new Error(`Failed to download PDF: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('📄 Single Form Download API: HTTP service failed:', error);
      throw error;
    }
  }

  // Mock mode fallback
  console.log('📄 Single Form Download API: Using mock download fallback');
  mockDownloadSingleFormPdf(request);
}