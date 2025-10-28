import { useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { BatchStatusCard } from '../features/batch/components/BatchStatusCard';
import { BatchJobsTable } from '../features/batch/components/BatchJobsTable';
import { useBatchJobs, useBatchDashboardStats } from '../features/batch/hooks/useBatchJobs';
import { useDebounce } from '../hooks/useDebounce';
import type { BatchStatus } from '../features/batch/types';

export function BatchProcessingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all');
  const [requestedByFilter, setRequestedByFilter] = useState('');
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedRequestedBy = useDebounce(requestedByFilter, 300);
  
  const { data, loading, error, refresh, updateFilters } = useBatchJobs({
    search: debouncedSearch,
    status: statusFilter,
    requestedBy: debouncedRequestedBy
  });
  
  const { stats, loading: statsLoading, refresh: refreshStats } = useBatchDashboardStats();

  const handleStatusToggle = (status: string, enabled: boolean) => {
    console.log(`Toggle ${status}: ${enabled}`);
    // In a real implementation, this would update the backend configuration
    // For now, we'll just show a console log
  };

  const handleRefresh = () => {
    refresh();
    refreshStats();
  };

  const handleStatusFilterChange = (value: string) => {
    const newStatus = value as BatchStatus | 'all';
    setStatusFilter(newStatus);
    updateFilters({ status: newStatus });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // The debounced value will trigger the filter update
  };

  const handleRequestedByChange = (value: string) => {
    setRequestedByFilter(value);
    // The debounced value will trigger the filter update
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading batch processing data: {error}</p>
          <Button 
            onClick={handleRefresh} 
            className="mt-2 bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6"> {/* mobile-only: reduced padding */}
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0"> {/* mobile-only: stack on mobile */}
        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-foreground">Batch Processing</h1> {/* mobile-only: smaller heading */}
          <p className="text-muted-foreground mt-1 text-sm lg:text-base"> {/* mobile-only: smaller text */}
            Monitor and manage batch form generation jobs
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto"> {/* mobile-only: full width */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={loading || statsLoading}
            className="min-h-[44px] lg:min-h-0 text-sm lg:text-base" /* mobile-only: touch target */
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading || statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          

        </div>
      </div>

      {/* Status Dashboard */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mx-auto w-12"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.statusCounts.map((statusData) => (
            <BatchStatusCard
              key={statusData.status}
              statusData={statusData}
              onToggle={handleStatusToggle}
            />
          ))}
        </div>
      ) : null}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Batch Process
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by contract serial number or username..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Error">Error</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Filter by requested by..."
              value={requestedByFilter}
              onChange={(e) => handleRequestedByChange(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
          
          {/* Active Filters */}
          {(searchTerm || statusFilter !== 'all' || requestedByFilter) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button 
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button 
                    onClick={() => handleStatusFilterChange('all')}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {requestedByFilter && (
                <Badge variant="secondary" className="gap-1">
                  Requested by: {requestedByFilter}
                  <button 
                    onClick={() => handleRequestedByChange('')}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading batch jobs...</p>
            </div>
          ) : data ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {data.jobs.length} of {data.total} batch jobs
                  </p>
                  {data.stats.lastUpdated && (
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(data.stats.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <BatchJobsTable jobs={data.jobs} onRefresh={handleRefresh} />
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No batch jobs available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}