import { FileText, Calendar, Edit } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import type { FormItem } from '../types';

interface FormCardProps {
  form: FormItem;
  onEdit?: (form: FormItem) => void;
}

export function FormCard({ form, onEdit }: FormCardProps) {
  const formattedDate = form.updatedAt 
    ? new Date(form.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'N/A';

  const getStatusVariant = (status: FormItem['form_status']) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium text-card-foreground">{form.form_title}</h3>
          </div>
          <Badge variant={getStatusVariant(form.form_status)} className="capitalize">
            {form.form_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {form.form_description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Updated {formattedDate}</span>
          </div>
          <span>{form.fieldCount || 0} fields</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {form.form_category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {form.form_phase}
            </Badge>
            <span className="text-xs text-muted-foreground">v{form.form_version}</span>
          </div>
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(form)}
              className="h-7 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}