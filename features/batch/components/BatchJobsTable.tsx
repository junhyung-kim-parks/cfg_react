import { useState } from 'react';
import { Download, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '../../../components/ui/tooltip';
import { toast } from 'sonner@2.0.3';
import { batchService } from '../services/batch.service';
import type { BatchJob } from '../types';

interface BatchJobsTableProps {
  jobs: BatchJob[];
  onRefresh?: () => void;
}

export function BatchJobsTable({ jobs, onRefresh }: BatchJobsTableProps) {
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: string }>({});

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Processing': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Completed': 'bg-green-100 text-green-800 border-green-300',
      'Pending': 'bg-gray-100 text-gray-800 border-gray-300',
      'Error': 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.Pending} border`}>
        {status}
      </Badge>
    );
  };

  const getRowBackground = (status: string) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'Completed':
        return 'bg-green-50 hover:bg-green-100';
      case 'Pending':
        return 'bg-gray-50 hover:bg-gray-100';
      case 'Error':
        return 'bg-red-50 hover:bg-red-100';
      default:
        return 'hover:bg-gray-50';
    }
  };

  const handleAction = async (jobId: string, action: 'download' | 'retry' | 'cancel' | 'delete') => {
    setLoadingActions(prev => ({ ...prev, [jobId]: action }));
    
    try {
      if (action === 'download') {
        const blob = await batchService.downloadBatchJob(jobId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-job-${jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Download started');
      } else {
        const result = await batchService.performBatchJobAction({ id: jobId, action });
        if (result.success) {
          toast.success(result.message);
          onRefresh?.();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error(`Action ${action} failed for job ${jobId}:`, error);
      toast.error(`Failed to ${action} job`);
    } finally {
      setLoadingActions(prev => {
        const { [jobId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const renderActionButtons = (job: BatchJob) => {
    const currentAction = loadingActions[job.id];
    
    return (
      <div className="flex items-center gap-1">
        {/* Download Button */}
        {job.status === 'Completed' && job.downloadUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={() => handleAction(job.id, 'download')}
                  disabled={currentAction === 'download'}
                >
                  {currentAction === 'download' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}



        {/* Cancel Button */}
        {(job.status === 'Processing' || job.status === 'Pending') && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                  onClick={() => handleAction(job.id, 'cancel')}
                  disabled={currentAction === 'cancel'}
                >
                  {currentAction === 'cancel' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancel</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}


      </div>
    );
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <AlertTriangle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No batch jobs found</h3>
        <p className="text-gray-500">Try adjusting your filters or create a new batch job.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-medium">Requested By</TableHead>
            <TableHead className="font-medium">Contract Number</TableHead>
            <TableHead className="font-medium">Contract Root Social Number</TableHead>
            <TableHead className="font-medium">Date Requested</TableHead>
            <TableHead className="font-medium">Date Generation Started</TableHead>
            <TableHead className="font-medium">Date Generation Completed</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className={`${getRowBackground(job.status)} transition-colors`}>
              <TableCell className="font-medium">{job.requestedBy}</TableCell>
              <TableCell className="font-mono text-sm">{job.contractNumber}</TableCell>
              <TableCell className="font-mono text-sm">{job.contractRootSocialNumber}</TableCell>
              <TableCell>{formatDate(job.dateRequested)}</TableCell>
              <TableCell>{formatDate(job.dateGenerationStarted)}</TableCell>
              <TableCell>{formatDate(job.dateGenerationCompleted)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(job.status)}
                  {job.status === 'Error' && job.errorMessage && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-red-600 cursor-help">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="truncate max-w-24">Error details</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                          <p>{job.errorMessage}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell>{renderActionButtons(job)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}