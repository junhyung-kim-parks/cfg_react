import { httpGet } from '../../../services/api/http';
import embeddedMappings, { type FormFieldMappings } from '../../../services/embedded_dataset/form_field_mappings';

/**
 * Service for managing form field mappings
 * Provides fallback to embedded dataset when HTTP API fails
 */
class FormFieldMappingsService {
  private cache: FormFieldMappings | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get form field mappings from HTTP API with embedded fallback
   */
  async getMappings(): Promise<FormFieldMappings> {
    // Return cached data if still fresh
    if (this.cache && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      console.log('FormFieldMappingsService: Attempting to fetch from HTTP API...');
      
      const httpMappings = await httpGet<FormFieldMappings>('/form_field_mappings');
      
      console.log(`FormFieldMappingsService: Successfully loaded ${Object.keys(httpMappings).length} form mappings from HTTP API`);
      
      // Cache the result
      this.cache = httpMappings;
      this.cacheTimestamp = Date.now();
      
      return httpMappings;
    } catch (error) {
      console.warn('FormFieldMappingsService: HTTP API failed, falling back to embedded dataset:', error);
      
      // Use embedded dataset as fallback
      this.cache = embeddedMappings;
      this.cacheTimestamp = Date.now();
      
      return embeddedMappings;
    }
  }

  /**
   * Get mapping for a specific form ID
   */
  async getFormMapping(formId: string) {
    const mappings = await this.getMappings();
    return mappings[formId] || null;
  }

  /**
   * Get mappings for multiple form IDs
   */
  async getFormMappings(formIds: string[]) {
    const mappings = await this.getMappings();
    const result: FormFieldMappings = {};
    
    formIds.forEach(formId => {
      if (mappings[formId]) {
        result[formId] = mappings[formId];
      }
    });
    
    return result;
  }

  /**
   * Clear cache to force fresh data on next request
   */
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

// Export singleton instance
export const formFieldMappingsService = new FormFieldMappingsService();
export default formFieldMappingsService;