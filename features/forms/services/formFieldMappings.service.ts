import { httpPost } from '../../../services/api/http';
import { type FormFieldMappings, generateFormFieldMappings } from '../../../services/embedded_dataset/form_field_mappings';
import type { Project } from '../../../features/projects/types';

/**
 * Service for managing form field mappings
 * Uses POST API with project context and embedded dataset fallback
 */
class FormFieldMappingsService {

  /**
   * Get form field mappings with project context via POST API
   * This method sends both form IDs and project data to get customized mappings
   */
  async getFormMappingsWithProject(formIds: string[], project?: Project): Promise<FormFieldMappings> {
    try {
      console.log('FormFieldMappingsService: Attempting POST API with project context...');
      
      const requestBody = {
        formIds,
        projectId: project?.project_id || project?.id
      };
      
      console.log('📋 POST Request Body:', requestBody);
      console.log('📋 Project details:', {
        hasProject: !!project,
        projectId: project?.project_id,
        projectIdAlt: project?.id,
        projectName: project?.name || project?.pi_short_description,
        finalProjectId: requestBody.projectId
      });
      
      const httpMappings = await httpPost<FormFieldMappings>('/cfg/form_field_mappings', requestBody);
      
      console.log(`FormFieldMappingsService: Successfully loaded ${Object.keys(httpMappings).length} form mappings from POST API`);
      
      return httpMappings;
    } catch (error) {
      console.warn('FormFieldMappingsService: POST API failed, falling back to embedded dataset:', error);
      
      // Convert project data to embedded dataset format
      const projectForEmbedded = project ? {
        name: project.pi_short_description || project.name || 'Unknown Project',
        id: project.project_id || project.id || 'unknown',
        description: project.pi_short_description || project.description || '',
        location: project.pi_park_name || project.location || '',
        manager: project.pi_managing_design_team_unit || project.manager || '',
        status: project.status || 'active',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        budget: project.budget || 0,
        progress: project.progress || 0
      } : undefined;
      
      // Generate embedded mappings with actual project data
      const embeddedMappings = generateFormFieldMappings(projectForEmbedded);
      console.log('📋 FormFieldMappingsService: Using embedded dataset with project data:', {
        projectData: projectForEmbedded,
        hasProjectData: !!projectForEmbedded,
        mappingsGenerated: Object.keys(embeddedMappings).length
      });
      
      // Filter for requested forms only
      const result: FormFieldMappings = {};
      formIds.forEach(formId => {
        if (embeddedMappings[formId]) {
          result[formId] = embeddedMappings[formId];
        }
      });
      
      return result;
    }
  }


}

// Export singleton instance
export const formFieldMappingsService = new FormFieldMappingsService();
export default formFieldMappingsService;