// Central export for all embedded datasets
export { dashboardStatsData } from './dashboardStats';
export { formCatalogData } from './formCatalog';
export { projectCatalog } from './projectCatalog';
export { generateAuditLogs } from './auditLogs';
export { generateUsers } from './users';
export { generateBatchProcessingData } from './batchProcessing';

// Dataset registry for dynamic lookups
export const datasetRegistry = {
  'dashboardStats': () => import('./dashboardStats').then(m => m.dashboardStatsData),
  'formCatalog': () => import('./formCatalog').then(m => m.formCatalogData),
  'projectCatalog': () => import('./projectCatalog').then(m => m.projectCatalog),
  'auditLogs': () => import('./auditLogs').then(m => m.generateAuditLogs),
  'users': () => import('./users').then(m => m.generateUsers),
  'batchProcessing': () => import('./batchProcessing').then(m => m.generateBatchProcessingData),
} as const;

export type DatasetKey = keyof typeof datasetRegistry;