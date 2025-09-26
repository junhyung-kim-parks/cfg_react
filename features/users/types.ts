export type UserRole = 'Admin' | 'Editor' | 'Viewer';

export type UserStatus = 'Active' | 'Inactive';

export interface UserPermissions {
  // Form Generation Access
  form_generate: boolean;
  form_modify_templates: boolean;
  form_upload_templates: boolean;
  form_batch_process: boolean;
  
  // System Access
  user_management: boolean;
  audit_logs: boolean;
  settings: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  permissions: UserPermissions;
  lastLogin?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  department?: string;
  phone?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  department?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  permissions?: Partial<UserPermissions>;
  department?: string;
  phone?: string;
}

export interface PermissionLevel {
  role: UserRole;
  title: string;
  description: string;
  color: string;
}

export interface PermissionCategory {
  title: string;
  permissions: {
    key: keyof UserPermissions;
    label: string;
    roles: UserRole[];
  }[];
}