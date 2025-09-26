import { httpGet } from '../../../services/api/http';
import { generateUsers } from '../../../services/embedded_dataset/users';
import type { 
  UsersResponse, 
  UserFilters, 
  User, 
  CreateUserRequest, 
  UpdateUserRequest,
  UserRole,
  UserPermissions 
} from '../types';

export const usersService = {
  async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    try {
      console.log('usersService: Attempting to fetch users via HTTP API');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.role && filters.role !== 'all') queryParams.set('role', filters.role);
      if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.department) queryParams.set('department', filters.department);
      
      const queryString = queryParams.toString();
      const path = queryString ? `/users?${queryString}` : '/users';
      
      const response = await httpGet<UsersResponse>(path);
      
      console.log('usersService: Successfully fetched users from HTTP API', response);
      return response;
    } catch (error) {
      console.warn('usersService: HTTP API failed, falling back to embedded dataset:', error);
      
      // Fallback to embedded dataset
      const users = generateUsers();
      
      // Apply client-side filtering if filters are provided
      if (filters.search || filters.role || filters.status || filters.department) {
        const filteredUsers = users.users.filter(user => {
          const matchesSearch = !filters.search || 
            user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
            (user.department && user.department.toLowerCase().includes(filters.search.toLowerCase()));
          
          const matchesRole = !filters.role || 
            filters.role === 'all' ||
            user.role === filters.role;
          
          const matchesStatus = !filters.status ||
            filters.status === 'all' ||
            user.status === filters.status;
          
          const matchesDepartment = !filters.department ||
            user.department === filters.department;
          
          return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
        });
        
        return {
          ...users,
          users: filteredUsers,
          total: filteredUsers.length
        };
      }
      
      return users;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await httpGet<User>(`/users/${id}`);
      return response;
    } catch (error) {
      console.warn('usersService: HTTP API failed for getUserById, falling back to embedded dataset:', error);
      
      const users = generateUsers();
      return users.users.find(user => user.id === id) || null;
    }
  },

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // In a real implementation, this would be a POST request
      const response = await httpGet<User>('/users/create');
      return response;
    } catch (error) {
      console.warn('usersService: HTTP API failed for createUser, using mock response:', error);
      
      // Mock response for create user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: 'Active',
        permissions: this.getDefaultPermissions(userData.role),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        department: userData.department,
        phone: userData.phone
      };
      
      return newUser;
    }
  },

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    try {
      // In a real implementation, this would be a PUT/PATCH request
      const response = await httpGet<User>(`/users/${id}/update`);
      return response;
    } catch (error) {
      console.warn('usersService: HTTP API failed for updateUser, using embedded dataset:', error);
      
      const users = generateUsers();
      const user = users.users.find(u => u.id === id);
      
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      
      // Merge updates
      const updatedUser: User = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
        permissions: updates.permissions ? { ...user.permissions, ...updates.permissions } : user.permissions
      };
      
      return updatedUser;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await httpGet<void>(`/users/${id}/delete`);
    } catch (error) {
      console.warn('usersService: HTTP API failed for deleteUser:', error);
      // In mock mode, we just simulate success
    }
  },

  async activateUser(id: string): Promise<User> {
    return this.updateUser(id, { status: 'Active' });
  },

  async deactivateUser(id: string): Promise<User> {
    return this.updateUser(id, { status: 'Inactive' });
  },

  getDefaultPermissions(role: UserRole): UserPermissions {
    switch (role) {
      case 'Admin':
        return {
          form_generate: true,
          form_modify_templates: true,
          form_upload_templates: true,
          form_batch_process: true,
          user_management: true,
          audit_logs: true,
          settings: true
        };
      case 'Editor':
        return {
          form_generate: true,
          form_modify_templates: true,
          form_upload_templates: false,
          form_batch_process: true,
          user_management: false,
          audit_logs: false,
          settings: false
        };
      case 'Viewer':
        return {
          form_generate: false,
          form_modify_templates: false,
          form_upload_templates: false,
          form_batch_process: false,
          user_management: false,
          audit_logs: false,
          settings: false
        };
      default:
        return {
          form_generate: false,
          form_modify_templates: false,
          form_upload_templates: false,
          form_batch_process: false,
          user_management: false,
          audit_logs: false,
          settings: false
        };
    }
  },

  async exportUsersToCSV(filters: UserFilters = {}): Promise<string> {
    try {
      const response = await this.getUsers(filters);
      
      const headers = ['Name', 'Email', 'Role', 'Status', 'Department', 'Phone', 'Last Login', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...response.users.map(user => [
          `"${user.name}"`,
          `"${user.email}"`,
          user.role,
          user.status,
          `"${user.department || ''}"`,
          `"${user.phone || ''}"`,
          user.lastLogin || '',
          user.createdAt
        ].join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('usersService: Failed to export users to CSV:', error);
      throw error;
    }
  }
};