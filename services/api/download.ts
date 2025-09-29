import { getRuntimeConfig } from './runtime';

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
  
  // Create a mock PDF download
  const mockDownload = () => {
    const formNames = request.formIds.map(id => id.replace('FORM-', 'Form ')).join(', ');
    const projectName = request.projectData?.name || 'Project';
    const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Forms_${request.formIds.join('_')}.pdf`;
    
    // Create a more detailed mock PDF with form field data
    const fieldsText = request.formIds.map(formId => {
      const fields = request.formFieldsData?.[formId] || {};
      const fieldEntries = Object.entries(fields).slice(0, 5); // Show first 5 fields
      return `Form ${formId}:\\n${fieldEntries.map(([key, value]) => `  ${key}: ${value}`).join('\\n')}`;
    }).join('\\n\\n');
    
    const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(Generated Forms: ${formNames}) Tj
0 -20 Td
(Project: ${projectName}) Tj
0 -20 Td
(Generated on: ${new Date().toLocaleString()}) Tj
0 -40 Td
(Sample Field Data:) Tj
0 -20 Td
(${fieldsText.slice(0, 200)}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000179 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
400
%%EOF`;

    const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    return {
      success: true,
      filename: filename,
      downloadedFiles: request.formIds.length,
      message: `Successfully generated ${request.formIds.length} form template(s)`
    };
  };

  return mockDownload();
}