import { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { usersService } from '../services/users.service';
import type { User, UserFilters, UserRole, UserStatus } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    loadUsers();
  }, [debouncedSearchQuery, selectedRole, selectedStatus, selectedDepartment]);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: UserFilters = {
        search: debouncedSearchQuery || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        department: selectedDepartment || undefined
      };
      
      const response = await usersService.getUsers(filters);
      
      setUsers(response.users);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('useUsers: Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const activateUser = async (userId: string) => {
    try {
      setError(null);
      await usersService.activateUser(userId);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'Active' as UserStatus } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate user');
      console.error('useUsers: Error activating user:', err);
    }
  };
  
  const deactivateUser = async (userId: string) => {
    try {
      setError(null);
      await usersService.deactivateUser(userId);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'Inactive' as UserStatus } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
      console.error('useUsers: Error deactivating user:', err);
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
      setError(null);
      await usersService.deleteUser(userId);
      
      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      console.error('useUsers: Error deleting user:', err);
    }
  };
  
  const exportToCSV = async () => {
    try {
      const filters: UserFilters = {
        search: debouncedSearchQuery || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        department: selectedDepartment || undefined
      };
      
      const csvContent = await usersService.exportUsersToCSV(filters);
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('useUsers: Error exporting to CSV:', err);
      setError('Failed to export users');
    }
  };
  
  const refresh = () => {
    loadUsers();
  };
  
  return {
    users,
    loading,
    error,
    total,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    selectedStatus,
    setSelectedStatus,
    selectedDepartment,
    setSelectedDepartment,
    activateUser,
    deactivateUser,
    deleteUser,
    exportToCSV,
    refresh
  };
}