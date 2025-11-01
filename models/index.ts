export interface FormItem {
  form_id: string;
  form_title: string;
  form_description: string;
  form_category: string;
  form_status: 'Active' | 'Draft' | 'Archived' | 'active' | 'draft' | 'archived';
  form_version: string;
  form_phase: string;
  form_template_type: string;
  form_file_path: string;
  // Optional fields for backward compatibility or additional data
  fieldCount?: number;
  createdAt?: string;
  updatedAt?: string;
  hasEEItems?: boolean;  // True if form supports EE Items (FORM-022A)
}

// Engineer's Estimate (EE) Item for Change Orders
export interface EEItemEntry {
  id: string;
  ee_item_id: string;
  description: string;
  unit: string;
  bid_price: number;
  qty: number;
  total: number;
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