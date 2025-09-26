export interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  progress: number;
  budget: number;
  spent: number;
  manager: string;
  priority: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  planning: number;
  totalBudget: number;
  totalSpent: number;
}

export interface ProjectCatalog {
  projects: Project[];
  stats: ProjectStats;
}

export type ProjectStatus = 'Active' | 'Completed' | 'Planning' | 'On Hold';
export type ProjectPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ProjectType = 'Commercial' | 'Residential' | 'Infrastructure' | 'Educational';