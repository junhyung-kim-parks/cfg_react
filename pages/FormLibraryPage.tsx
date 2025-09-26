import { useState, useEffect } from 'react';
import { Search, Upload, Filter, MoreVertical, Edit, Save, X, FileText, Hash, Calendar, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { list as getFormList } from '../features/forms/services/forms.service';
import { formFieldMappingsService } from '../features/forms/services/formFieldMappings.service';
import type { FormItem } from '../features/forms/types';

interface FormFieldMapping {
  pdf: string;
  fields: Record<string, any>;
}

export function FormLibraryPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // Field Editor State
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null);
  const [formMapping, setFormMapping] = useState<FormFieldMapping | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [loadingMapping, setLoadingMapping] = useState(false);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    filterForms();
  }, [forms, searchQuery, selectedCategory]);

  const loadForms = async () => {
    try {
      const formList = await getFormList();
      setForms(formList);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterForms = () => {
    let filtered = forms;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(form => 
        form.id.toLowerCase().includes(query) ||
        form.title.toLowerCase().includes(query) ||
        form.description?.toLowerCase().includes(query) ||
        form.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All Categories') {
      filtered = filtered.filter(form => form.category === selectedCategory);
    }

    setFilteredForms(filtered);
  };

  const getCategories = () => {
    const categories = ['All Categories', ...Array.from(new Set(forms.map(form => form.category)))];
    return categories;
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXCEL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WORD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditFields = async (form: FormItem) => {
    setSelectedForm(form);
    setLoadingMapping(true);
    setIsFieldEditorOpen(true);
    
    try {
      const mappings = await formFieldMappingsService.getFormMappings([form.id]);
      const mapping = mappings[form.id];
      
      if (mapping) {
        setFormMapping(mapping);
        setEditedFields({ ...mapping.fields });
      } else {
        setFormMapping(null);
        setEditedFields({});
      }
    } catch (error) {
      console.error('Failed to load form mapping:', error);
      setFormMapping(null);
      setEditedFields({});
    } finally {
      setLoadingMapping(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSaveFields = () => {
    // In a real application, this would save to the backend
    console.log('Saving fields for', selectedForm?.id, ':', editedFields);
    
    // Update the form mapping
    if (formMapping) {
      setFormMapping({
        ...formMapping,
        fields: editedFields
      });
    }
    
    // Show success message (in a real app, you'd use a toast)
    alert('Fields saved successfully!');
  };

  const handleCloseEditor = () => {
    setIsFieldEditorOpen(false);
    setSelectedForm(null);
    setFormMapping(null);
    setEditedFields({});
  };

  const getFieldIcon = (value: any) => {
    if (typeof value === 'boolean') return CheckSquare;
    if (typeof value === 'number') return Hash;
    if (typeof value === 'string' && value.includes('-') && value.length === 10) return Calendar;
    return FileText;
  };

  const renderFieldInput = (fieldName: string, value: any) => {
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={fieldName}
            checked={editedFields[fieldName] || false}
            onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
          />
          <Label htmlFor={fieldName} className="text-sm font-normal">
            {editedFields[fieldName] ? 'Yes' : 'No'}
          </Label>
        </div>
      );
    }
    
    if (typeof value === 'number') {
      return (
        <Input
          type="number"
          value={editedFields[fieldName] || ''}
          onChange={(e) => handleFieldChange(fieldName, Number(e.target.value))}
          className="text-sm"
        />
      );
    }
    
    return (
      <Input
        type="text"
        value={editedFields[fieldName] || ''}
        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
        className="text-sm"
        placeholder={`Enter ${fieldName}`}
      />
    );
  };

  if (loading) {
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
          <h1 className="text-2xl text-gray-900">Form Library</h1>
          <p className="text-gray-600">
            Upload, configure, and manage form templates. Supports both PDF forms and Word documents.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Button */}
          <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New Template
          </Button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredForms.length} of {forms.length} templates
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form) => (
          <Card key={form.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              {/* Header with ID and Type Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-base text-gray-900 mb-1">{form.id}</h3>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">{form.title}</p>
                </div>
                <Badge 
                  variant="outline"
                  className={`ml-2 text-xs px-2 py-1 ${getTemplateTypeColor(form.templateType || 'PDF')}`}
                >
                  {form.templateType || 'PDF'}
                </Badge>
              </div>

              {/* Form Details */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Category:</span> {form.category}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Fields:</span> {form.fieldCount || 0}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Version:</span> {form.version || '1.0'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs h-8 border-gray-300 hover:bg-gray-50"
                  onClick={() => handleEditFields(form)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Fields
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs h-8 border-gray-300 hover:bg-gray-50"
                >
                  Preview
                </Button>
              </div>

              {/* Footer */}
              <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                Modified: 2025-01-15 by System Admin
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredForms.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg text-gray-600 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || selectedCategory !== 'All Categories'
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by uploading your first template.'}
          </p>
          {(!searchQuery && selectedCategory === 'All Categories') && (
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Template
            </Button>
          )}
        </div>
      )}

      {/* Field Editor Side Panel */}
      <Sheet open={isFieldEditorOpen} onOpenChange={setIsFieldEditorOpen}>
        <SheetContent className="w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-600" />
              Edit Form Fields
            </SheetTitle>
            <SheetDescription>
              {selectedForm && (
                <>
                  Edit field mappings for <strong>{selectedForm.id}</strong> - {selectedForm.title}
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-6">
            {loadingMapping ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : formMapping ? (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4 pr-4">
                  {/* PDF Template Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">PDF Template</span>
                    </div>
                    <p className="text-sm text-gray-600">{formMapping.pdf}</p>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Form Fields ({Object.keys(editedFields).length})
                    </h4>
                    
                    {Object.keys(editedFields).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(editedFields).map(([fieldName, value]) => {
                          const FieldIcon = getFieldIcon(value);
                          return (
                            <div key={fieldName} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <FieldIcon className="h-4 w-4 text-gray-500" />
                                <Label className="text-sm font-medium text-gray-700">
                                  {fieldName}
                                </Label>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs ml-auto"
                                >
                                  {typeof value}
                                </Badge>
                              </div>
                              
                              {renderFieldInput(fieldName, value)}
                              
                              {/* Current Value Display */}
                              <div className="text-xs text-gray-500">
                                Current: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No field mappings found for this form</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No field mappings available for this form</p>
                <p className="text-xs text-gray-400 mt-1">
                  This form may not have been configured yet.
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleCloseEditor}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveFields}
              disabled={!formMapping || Object.keys(editedFields).length === 0}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}