/**
 * Mock download implementations for testing and development
 * These are fallbacks when the real API is unavailable
 */

import type { DownloadRequest, SingleFormDownloadRequest } from '../api/download';

/**
 * Generate a mock PDF content string
 */
function generateMockPdfContent(
  title: string,
  metadata: { [key: string]: string },
  fieldsText: string
): string {
  return `%PDF-1.4
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
/Length 300
>>
stream
BT
/F1 12 Tf
72 720 Td
(${title}) Tj
0 -20 Td
${Object.entries(metadata)
  .map(([key, value]) => `(${key}: ${value}) Tj\n0 -20 Td`)
  .join('\n')}
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
500
%%EOF`;
}

/**
 * Trigger browser download with a Blob
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up after 1 second
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Mock implementation for downloading multiple form templates
 */
export function mockDownloadTemplate(request: DownloadRequest): {
  success: boolean;
  filename: string;
  downloadedFiles: number;
  message: string;
} {
  const formNames = request.formIds.map(id => id.replace('FORM-', 'Form ')).join(', ');
  const projectName = request.projectData?.name || 'Project';
  const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Forms_${request.formIds.join('_')}.pdf`;
  
  // Create a more detailed mock PDF with form field data
  const fieldsText = request.formIds
    .map(formId => {
      const fields = request.formFieldsData?.[formId] || {};
      const fieldEntries = Object.entries(fields).slice(0, 5); // Show first 5 fields
      return `Form ${formId}:\n${fieldEntries.map(([key, value]) => `  ${key}: ${value}`).join('\n')}`;
    })
    .join('\n\n');
  
  const mockPdfContent = generateMockPdfContent(
    `Generated Forms: ${formNames}`,
    {
      'Project': projectName,
      'Generated on': new Date().toLocaleString()
    },
    `Sample Field Data:\n${fieldsText}`
  );

  const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
  triggerBrowserDownload(blob, filename);
  
  console.log('📄 Mock Download: Multi-form template downloaded:', filename);
  
  return {
    success: true,
    filename: filename,
    downloadedFiles: request.formIds.length,
    message: `Successfully generated ${request.formIds.length} form template(s)`
  };
}

/**
 * Mock implementation for downloading a single filled PDF form
 */
export function mockDownloadSingleFormPdf(request: SingleFormDownloadRequest): void {
  const fieldsText = request.fields
    .slice(0, 10) // Show first 10 fields
    .map(field => `  ${field.label}: ${field.value}`)
    .join('\n');
  
  const mockPdfContent = generateMockPdfContent(
    `Form: ${request.form_id}`,
    {
      'PDF': request.pdf,
      'Generated': new Date().toLocaleString()
    },
    `Field Data:\n${fieldsText}`
  );

  const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
  triggerBrowserDownload(blob, request.pdf);
  
  console.log('📄 Mock Download: Single form PDF downloaded:', request.pdf);
}