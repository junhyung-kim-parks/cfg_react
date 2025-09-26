import { httpGet } from '../../../services/api/http';
import type { FormItem } from '../types';
import { formCatalogData } from '../../../services/embedded_dataset/formCatalog';

import type { FormCatalog } from '../../../models';

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