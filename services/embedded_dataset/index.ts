// Central export for all embedded datasets
export { dashboardStatsData } from './dashboardStats';
export { formCatalogData } from './formCatalog';
export { projectCatalog } from './projectCatalog';
export { generateAuditLogs } from './auditLogs';
export { generateUsers } from './users';
export { generateBatchProcessingData } from './batchProcessing';
export { EMBEDDED_EE_ITEMS } from './eeItems';
export type { EEItem } from './eeItems';

// Dataset registry for dynamic lookups
export const datasetRegistry = {
  'dashboardStats': () => import('./dashboardStats').then(m => m.dashboardStatsData),
  'formCatalog': () => import('./formCatalog').then(m => m.formCatalogData),
  'projectCatalog': () => import('./projectCatalog').then(m => m.projectCatalog),
  'auditLogs': () => import('./auditLogs').then(m => m.generateAuditLogs),
  'users': () => import('./users').then(m => m.generateUsers),
  'batchProcessing': () => import('./batchProcessing').then(m => m.generateBatchProcessingData),
  'eeItems': () => import('./eeItems').then(m => m.EMBEDDED_EE_ITEMS),
} as const;

export type DatasetKey = keyof typeof datasetRegistry;