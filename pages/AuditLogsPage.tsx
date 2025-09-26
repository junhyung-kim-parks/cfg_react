import { useState } from 'react';
import { Search, Download, RefreshCw, FileText, User, Calendar, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuditLogs } from '../features/audit/hooks/useAuditLogs';
import { formatDate } from '../utils/formatDate';
import type { AuditLogEntry } from '../features/audit/types';

export function AuditLogsPage() {
  const {
    logs,
    loading,
    error,
    total,
    searchQuery,
    setSearchQuery,
    selectedActionType,
    setSelectedActionType,
    selectedDateRange,
    setSelectedDateRange,
    exportToCSV,
    refresh
  } = useAuditLogs();

  const [exportingCSV, setExportingCSV] = useState(false);

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'form_template_updated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'form_generated':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'form_library_upload':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user_permission_updated':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'batch_processing_completed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'field_mapping_updated':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'template_deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'user_login':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'system_backup':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return formatDate(date, 'MMM dd, yyyy HH:mm:ss');
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      await exportToCSV();
    } finally {
      setExportingCSV(false);
    }
  };

  if (loading && logs.length === 0) {
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
          <h1 className="text-2xl text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">
            Track all form library changes and user activities
          </p>
        </div>

        {/* System Activity Log Card */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-gray-600" />
              System Activity Log
            </CardTitle>
            <p className="text-sm text-gray-600">
              Detailed audit trail of all form generation activities and system changes.
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
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                {/* Action Filter */}
                <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="form_template_updated">Form Template Updated</SelectItem>
                    <SelectItem value="form_generated">Form Generated</SelectItem>
                    <SelectItem value="form_library_upload">Form Library Upload</SelectItem>
                    <SelectItem value="user_permission_updated">User Permission Updated</SelectItem>
                    <SelectItem value="batch_processing_completed">Batch Processing</SelectItem>
                    <SelectItem value="field_mapping_updated">Field Mapping Updated</SelectItem>
                    <SelectItem value="template_deleted">Template Deleted</SelectItem>
                    <SelectItem value="user_login">User Login</SelectItem>
                    <SelectItem value="system_backup">System Backup</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 days</SelectItem>
                    <SelectItem value="all_time">All time</SelectItem>
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
                  disabled={exportingCSV || logs.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportingCSV ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {logs.length} of {total} log entries
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
                    <TableHead className="text-xs font-medium text-gray-700 w-40">Timestamp</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-48">User</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-44">Action</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-32">Target</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Details</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 w-32">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs text-gray-600 font-mono">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <div className="text-gray-900 font-medium">{log.user.name}</div>
                            <div className="text-gray-500">{log.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-1 ${getActionBadgeVariant(log.actionType)}`}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-900 font-medium">
                          {log.target}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-xs">
                          <div className="truncate" title={log.details}>
                            {log.details}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 font-mono">
                          {log.ipAddress}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            Loading audit logs...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Activity className="h-8 w-8 mx-auto text-gray-300" />
                            <p>No audit logs found</p>
                            <p className="text-xs text-gray-400">
                              {searchQuery || selectedActionType !== 'all'
                                ? 'Try adjusting your search criteria or filters.'
                                : 'No activity has been logged yet.'}
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