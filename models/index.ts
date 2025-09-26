export interface FormItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'Active' | 'Draft' | 'Archived' | 'active' | 'draft' | 'archived';
  version: string;
  fieldCount?: number; // New field from your data
  fields?: number; // Keep for backward compatibility
  // New fields from your data
  phase?: string;
  templateType?: string;
  // Optional timestamp fields
  createdAt?: string;
  updatedAt?: string;
}

export interface FormCatalog {
  forms: FormItem[];
  metadata: {
    totalForms: number;
    categories: string[];
    phases: string[];
    templateTypes: string[];
    lastUpdated: string;
  };
}

export interface DashboardStats {
  formsGenerated: {
    total: number;
    thisMonth: number;
    change: string;
  };
  activeProjects: {
    total: number;
    inProgress: number;
    change: string;
  };
  processingTime: {
    average: string;
    unit: string;
    change: string;
  };
  lastUpdated: string;
}

// Re-export project types
export type {
  Project,
  ProjectStats,
  ProjectCatalog,
  ProjectStatus,
  ProjectPriority,
  ProjectType
} from './project';