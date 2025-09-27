export interface Project {
  project_id: string;
  pi_park_contract_no: string;
  pi_short_description: string;
  pi_park_contract_status: string;
  pi_park_name: string;
  pi_progress_to_date: number;
  pi_total_project_funding_amount: number;
  pi_registration_amount: number;
  pi_managing_design_team_unit: string;
  pi_managing_construction_team_unit: string;
  phase_start_date: string;
  phase_end_date: string;
  pi_scope_of_work: string;
  pi_project_type: string;
  phase_scdacd: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  planning: number;
  design: number;
  construction: number;
  procurement: number;
  totalBudget: number;
  totalSpent: number;
}

export interface ProjectCatalog {
  projects: Project[];
  stats: ProjectStats;
}

export type ProjectStatus = 'Active' | 'Completed' | 'Planning' | 'Design' | 'Construction' | 'Procurement' | 'On Hold';
export type ProjectPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ProjectType = 'Commercial' | 'Residential' | 'Infrastructure' | 'Educational' | 'Civic' | 'Park' | 'Recreation';