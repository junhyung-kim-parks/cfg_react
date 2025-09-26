import { httpGet } from '../../../services/api/http';
import type { ProjectCatalog } from '../types';
import { projectCatalog } from '../../../services/embedded_dataset/projectCatalog';

/**
 * Project service that handles all project-related API calls.
 * Automatically falls back to embedded dataset when HTTP API fails.
 */
export class ProjectsService {
  /**
   * Fetch project catalog with stats and project list
   */
  static async getProjectCatalog(): Promise<ProjectCatalog> {
    console.log('🔧 ProjectsService: getProjectCatalog() called');
    try {
      console.log('🔧 ProjectsService: About to call httpGet with /projectCatalog');
      const data = await httpGet<ProjectCatalog>('/projectCatalog');
      console.log('🔧 ProjectsService: httpGet returned successfully:', data);
      return data;
    } catch (error) {
      console.warn('🔧 ProjectsService: httpGet failed, using direct embedded dataset fallback:', error);
      console.log('🔧 ProjectsService: Using embedded projectCatalog:', projectCatalog);
      console.log('🔧 ProjectsService: Embedded data type check - projects array length:', projectCatalog?.projects?.length);
      console.log('🔧 ProjectsService: Embedded data type check - stats:', projectCatalog?.stats);
      
      // Ensure we have valid data structure
      if (!projectCatalog || !projectCatalog.projects) {
        console.error('🔧 ProjectsService: Invalid embedded dataset structure, creating fallback');
        return {
          projects: [],
          stats: {
            total: 0,
            active: 0,
            completed: 0,
            planning: 0,
            totalBudget: 0,
            totalSpent: 0
          }
        };
      }
      
      return projectCatalog;
    }
  }

  /**
   * Search projects by various criteria
   */
  static async searchProjects(query: string): Promise<ProjectCatalog> {
    // For now, get all projects and filter client-side
    // In a real API, this would be a server-side search
    const catalog = await this.getProjectCatalog();
    
    if (!query.trim()) {
      return catalog;
    }

    const filteredProjects = catalog.projects.filter(project =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.location.toLowerCase().includes(query.toLowerCase()) ||
      project.manager.toLowerCase().includes(query.toLowerCase()) ||
      project.type.toLowerCase().includes(query.toLowerCase()) ||
      project.status.toLowerCase().includes(query.toLowerCase())
    );

    // Recalculate stats for filtered results
    const stats = {
      total: filteredProjects.length,
      active: filteredProjects.filter(p => p.status.toLowerCase() === 'active').length,
      completed: filteredProjects.filter(p => p.status.toLowerCase() === 'completed').length,
      planning: filteredProjects.filter(p => p.status.toLowerCase() === 'planning').length,
      totalBudget: filteredProjects.reduce((sum, p) => sum + p.budget, 0),
      totalSpent: filteredProjects.reduce((sum, p) => sum + p.spent, 0)
    };

    return {
      projects: filteredProjects,
      stats
    };
  }
}