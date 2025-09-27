import { httpGet } from '../../../services/api/http';
import type { FormItem } from '../types';
import { formCatalogData } from '../../../services/embedded_dataset/formCatalog';

import type { FormCatalog } from '../../../models';

export interface UploadTemplateData {
  id: string;
  title: string;
  category: string;
  description: string;
  templateType: 'PDF' | 'EXCEL' | 'WORD';
  file: File;
}

export async function list(): Promise<FormItem[]> {
  console.log('📋 FormsService: Starting form catalog request...');
  
  try {
    console.log('📋 FormsService: Attempting HTTP request to /formCatalog');
    const data = await httpGet<FormCatalog>('/formCatalog');
    console.log('📋 FormsService: HTTP request successful, data received:', !!data);
    console.log('📋 FormsService: HTTP data type:', typeof data);
    console.log('📋 FormsService: HTTP data has forms property:', !!(data && data.forms));
    console.log('📋 FormsService: HTTP forms is array:', Array.isArray(data?.forms));
    
    // Validate and extract forms array
    if (data && data.forms && Array.isArray(data.forms)) {
      console.log('📋 FormsService: ✅ Returning', data.forms.length, 'forms from HTTP response');
      return data.forms;
    } else {
      console.warn('📋 FormsService: ⚠️ Invalid HTTP response structure, falling back to embedded dataset');
      console.log('📋 FormsService: HTTP response data:', data);
    }
  } catch (error) {
    console.warn('📋 FormsService: ❌ HTTP request failed, using embedded dataset fallback');
    console.log('📋 FormsService: Error details:', error);
  }

  // Fallback to embedded dataset
  console.log('📋 FormsService: Using embedded dataset fallback');
  console.log('📋 FormsService: formCatalogData type:', typeof formCatalogData);
  console.log('📋 FormsService: formCatalogData is array:', Array.isArray(formCatalogData));
  console.log('📋 FormsService: formCatalogData length:', formCatalogData?.length);
  console.log('📋 FormsService: formCatalogData first item:', formCatalogData?.[0]?.id);
  
  // Ensure we always return a valid array
  if (Array.isArray(formCatalogData) && formCatalogData.length > 0) {
    console.log('📋 FormsService: ✅ Returning', formCatalogData.length, 'forms from embedded dataset');
    return formCatalogData;
  } else {
    console.error('📋 FormsService: ❌ Embedded dataset is invalid, returning empty array');
    return [];
  }
}

export async function uploadTemplate(data: UploadTemplateData): Promise<FormItem> {
  console.log('📋 FormsService: Starting template upload...', data.id);
  
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('id', data.id);
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('description', data.description);
    formData.append('templateType', data.templateType);

    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch('/api/forms/upload', {
    //   method: 'POST',
    //   body: formData
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Upload failed: ${response.statusText}`);
    // }
    // 
    // const result = await response.json();
    // return result;

    // For now, simulate upload and return mock form item
    console.log('📋 FormsService: Simulating upload process...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newForm: FormItem = {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      templateType: data.templateType,
      fieldCount: Math.floor(Math.random() * 20) + 5, // Random field count for demo
      version: '1.0',
      lastModified: new Date().toISOString().split('T')[0],
      lastModifiedBy: 'Current User'
    };

    console.log('📋 FormsService: ✅ Template upload successful:', newForm.id);
    return newForm;

  } catch (error) {
    console.error('📋 FormsService: ❌ Template upload failed:', error);
    throw new Error(`Failed to upload template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}