import { useState } from 'react';
import { Search, Download, RefreshCw, UserPlus, Users, Settings, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useUsers } from '../features/users/hooks/useUsers';
import { PERMISSION_LEVELS, PERMISSION_CATEGORIES, formatRoleList, getRoleColor } from '../features/users/config/permissions';
import { formatDate } from '../utils/formatDate';
import type { User, UserRole } from '../features/users/types';

export function UserManagementPage() {
  const {
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
    activateUser,
    deactivateUser,
    exportToCSV,
    refresh
  } = useUsers();

  const [exportingCSV, setExportingCSV] = useState(false);

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      await exportToCSV();
    } finally {
      setExportingCSV(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate') => {
    if (action === 'activate') {
      await activateUser(userId);
    } else {
      await deactivateUser(userId);
    }
  };

  const formatFormAccess = (user: User) => {
    const accesses = [];
    if (user.permissions.form_generate) accesses.push('Generate');
    if (user.permissions.form_modify_templates) accesses.push('Modify');
    if (user.permissions.form_upload_templates) accesses.push('Upload');
    if (user.permissions.form_batch_process) accesses.push('Batch');
    return accesses;
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    return formatDate(date, 'MMM dd, yyyy');
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage user accounts, roles, and form generation permissions
          </p>
        </div>

        {/* Permission Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Permission Levels */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-gray-600" />
                Permission Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PERMISSION_LEVELS.map((level) => (
                <div key={level.role} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={level.color}>
                      {level.title}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 ml-1">{level.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Form Generation Access */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-gray-600" />
                Form Generation Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PERMISSION_CATEGORIES[0].permissions.map((perm) => (
                <div key={perm.key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{perm.label}</span>
                  <span className="text-green-600 font-medium">
                    {formatRoleList(perm.roles)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Access */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-gray-600" />
                System Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PERMISSION_CATEGORIES[1].permissions.map((perm) => (
                <div key={perm.key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{perm.label}</span>
                  <span className="text-green-600 font-medium">
                    {formatRoleList(perm.roles)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* User Accounts Section */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-gray-600" />
              User Accounts
            </CardTitle>
            <p className="text-sm text-gray-600">
              Manage user accounts and their permissions for form generation and modification.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                {/* Role Filter */}
                <Select value={selectedRole} onValueChange={(value: UserRole | 'all') => setSelectedRole(value)}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={exportingCSV || users.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportingCSV ? 'Exporting...' : 'Export CSV'}
                </Button>
                <Button
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Add New User
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {users.length} of {total} users
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">Error: {error}</p>
              </div>
            )}

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-medium text-gray-700 w-48">Name</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-64">Email</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-24">Role</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-48">Form Access</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-24">Status</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell className="text-sm">
                          <div>
                            <div className="text-gray-900 font-medium">{user.name}</div>
                            {user.department && (
                              <div className="text-xs text-gray-500">{user.department}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-1 ${getRoleColor(user.role)}`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-wrap gap-1">
                            {formatFormAccess(user).map((access) => (
                              <span
                                key={access}
                                className="inline-flex items-center gap-1 text-green-700"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {access}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-1 ${
                              user.status === 'Active'
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-gray-600 bg-gray-50 border-gray-200'
                            }`}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1 h-7"
                            >
                              Permissions
                            </Button>
                            {user.status === 'Active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user.id, 'deactivate')}
                                className="text-xs px-2 py-1 h-7 text-gray-600 hover:text-red-600"
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user.id, 'activate')}
                                className="text-xs px-2 py-1 h-7 text-gray-600 hover:text-green-600"
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            Loading users...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Users className="h-8 w-8 mx-auto text-gray-300" />
                            <p>No users found</p>
                            <p className="text-xs text-gray-400">
                              {searchQuery || selectedRole !== 'all'
                                ? 'Try adjusting your search criteria or filters.'
                                : 'No users have been added yet.'}
                            </p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}