import { Switch } from '../../../components/ui/switch';
import { Card, CardContent } from '../../../components/ui/card';
import type { BatchStatusCount } from '../types';

interface BatchStatusCardProps {
  statusData: BatchStatusCount;
  onToggle: (status: string, enabled: boolean) => void;
}

export function BatchStatusCard({ statusData, onToggle }: BatchStatusCardProps) {
  const { status, count, enabled } = statusData;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-50 border-yellow-200';
      case 'Completed':
        return 'bg-green-50 border-green-200';
      case 'Pending':
        return 'bg-gray-50 border-gray-200';
      case 'Error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getCountColor = (status: string) => {
    switch (status) {
      case 'Processing':
        return 'text-yellow-700 bg-yellow-100';
      case 'Completed':
        return 'text-green-700 bg-green-100';
      case 'Pending':
        return 'text-gray-700 bg-gray-100';
      case 'Error':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getTextColor = (status: string) => {
    switch (status) {
      case 'Processing':
        return 'text-yellow-800';
      case 'Completed':
        return 'text-green-800';
      case 'Pending':
        return 'text-gray-800';
      case 'Error':
        return 'text-red-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <Card className={`${getStatusColor(status)} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-medium ${getTextColor(status)}`}>{status}</h3>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => onToggle(status, checked)}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
        
        <div className="flex items-center justify-center">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center 
            ${getCountColor(status)} 
            text-2xl font-bold
          `}>
            {count}
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className={`text-sm ${getTextColor(status)} opacity-75`}>
            {count === 1 ? 'Job' : 'Jobs'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}