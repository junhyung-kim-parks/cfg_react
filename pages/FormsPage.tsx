import { useEffect, useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { FormCard } from '../features/forms/components/FormCard';
import { useFormSearch } from '../features/forms/hooks/useFormSearch';
import { list } from '../features/forms/services/forms.service';
import type { FormItem } from '../features/forms/types';
import './styles/FormsPage.css';

export function FormsPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    status,
    setStatus,
    paginatedForms,
    totalItems
  } = useFormSearch({ forms });

  useEffect(() => {
    const loadForms = async () => {
      try {
        const data = await list();
        setForms(data);
      } catch (error) {
        console.error('Failed to load forms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadForms();
  }, []);

  const handleEditForm = (form: FormItem) => {
    console.log('Edit form:', form);
    // Navigate to form editor
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Form Library</h1>
          <p className="text-muted-foreground">Browse and manage your construction forms</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Form
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">Search & Filter</h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Logistics">Logistics</SelectItem>
                <SelectItem value="Reporting">Reporting</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedForms.length} of {totalItems} forms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onEdit={handleEditForm}
            />
          ))}
        </div>

        {paginatedForms.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No forms found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}