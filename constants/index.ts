export const API_TIMEOUT = 30000; // 30 seconds

export const FORM_CATEGORIES = [
  'Safety',
  'Maintenance', 
  'Logistics',
  'Reporting',
  'Quality Control',
  'Environmental'
] as const;

export const FORM_STATUSES = [
  'active',
  'draft', 
  'archived'
] as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;