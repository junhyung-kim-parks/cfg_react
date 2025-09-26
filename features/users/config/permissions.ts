import type { PermissionLevel, PermissionCategory } from '../types';

export const PERMISSION_LEVELS: PermissionLevel[] = [
  {
    role: 'Admin',
    title: 'Admin',
    description: 'Full access to all features',
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  {
    role: 'Editor', 
    title: 'Editor',
    description: 'Can generate and modify forms',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    role: 'Viewer',
    title: 'Viewer', 
    description: 'Read-only access to forms',
    color: 'text-gray-600 bg-gray-50 border-gray-200'
  }
];

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    title: 'Form Generation Access',
    permissions: [
      {
        key: 'form_generate',
        label: 'Can Generate Forms:',
        roles: ['Admin', 'Editor']
      },
      {
        key: 'form_modify_templates', 
        label: 'Can Modify Templates:',
        roles: ['Admin', 'Editor']
      },
      {
        key: 'form_upload_templates',
        label: 'Can Upload Templates:',
        roles: ['Admin']
      },
      {
        key: 'form_batch_process',
        label: 'Can Batch Process:',
        roles: ['Admin', 'Editor']
      }
    ]
  },
  {
    title: 'System Access',
    permissions: [
      {
        key: 'user_management',
        label: 'User Management:',
        roles: ['Admin']
      },
      {
        key: 'audit_logs',
        label: 'Audit Logs:',
        roles: ['Admin']
      },
      {
        key: 'settings',
        label: 'Settings:',
        roles: ['Admin']
      }
    ]
  }
];

export function formatRoleList(roles: string[]): string {
  if (roles.length === 1) {
    return `${roles[0]} Only`;
  }
  if (roles.length === 2) {
    return roles.join(', ');
  }
  return roles.slice(0, -1).join(', ') + ', ' + roles[roles.length - 1];
}

export function getRoleColor(role: string): string {
  const level = PERMISSION_LEVELS.find(l => l.role === role);
  return level?.color || 'text-gray-600 bg-gray-50 border-gray-200';
}