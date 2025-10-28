import { useState, useEffect } from 'react';
import { Search, Upload, Filter, MoreVertical, Edit, Save, X, FileText, Hash, Calendar, CheckSquare, Plus, AlertCircle } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { list as getFormList, uploadTemplate } from '../features/forms/services/forms.service';
import { formFieldMappingsService } from '../features/forms/services/formFieldMappings.service';
import type { FormItem } from '../features/forms/types';

interface FormFieldMapping {
  pdf: string;
  fields: Record<string, any>;
}

interface NewTemplateData {
  id: string;
  title: string;
  category: string;
  description: string;
  templateType: 'PDF' | 'EXCEL' | 'WORD';
  file: File | null;
}

interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
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
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [loadingMapping, setLoadingMapping] = useState(false);

  // Upload Template State
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState<NewTemplateData>({
    id: '',
    title: '',
    category: '',
    description: '',
    templateType: 'PDF',
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        form.form_id.toLowerCase().includes(query) ||
        form.form_title.toLowerCase().includes(query) ||
        form.form_description?.toLowerCase().includes(query) ||
        form.form_category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All Categories') {
      filtered = filtered.filter(form => form.form_category === selectedCategory);
    }

    setFilteredForms(filtered);
  };

  const getCategories = () => {
    const categories = ['All Categories', ...Array.from(new Set(forms.map(form => form.form_category)))];
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
      const mappings = await formFieldMappingsService.getFormMappingsWithProject([form.form_id]);
      const mapping = mappings[form.form_id];
      
      if (mapping) {
        setFormMapping(mapping);
        // Convert existing fields to field definitions
        const definitions: FieldDefinition[] = Object.entries(mapping.fields).map(([name, value]) => ({
          name,
          type: getFieldType(value)
        }));
        setFieldDefinitions(definitions);
      } else {
        setFormMapping(null);
        setFieldDefinitions([]);
      }
    } catch (error) {
      console.error('Failed to load form mapping:', error);
      setFormMapping(null);
      setFieldDefinitions([]);
    } finally {
      setLoadingMapping(false);
    }
  };

  const getFieldType = (value: any): 'string' | 'number' | 'boolean' | 'date' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date';
    return 'string';
  };

  const handleFieldNameChange = (index: number, newName: string) => {
    setFieldDefinitions(prev => prev.map((field, i) => 
      i === index ? { ...field, name: newName } : field
    ));
  };

  const handleFieldTypeChange = (index: number, newType: 'string' | 'number' | 'boolean' | 'date') => {
    setFieldDefinitions(prev => prev.map((field, i) => 
      i === index ? { ...field, type: newType } : field
    ));
  };

  const handleAddField = () => {
    setFieldDefinitions(prev => [...prev, { name: '', type: 'string' }]);
  };

  const handleRemoveField = (index: number) => {
    setFieldDefinitions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveFields = () => {
    // In a real application, this would save to the backend
    console.log('Saving field definitions for', selectedForm?.form_id, ':', fieldDefinitions);
    
    // Update the form mapping
    if (formMapping) {
      // Convert field definitions back to fields object with default values
      const newFields: Record<string, any> = {};
      fieldDefinitions.forEach(field => {
        if (field.name.trim()) {
          switch (field.type) {
            case 'boolean':
              newFields[field.name] = false;
              break;
            case 'number':
              newFields[field.name] = 0;
              break;
            case 'date':
              newFields[field.name] = new Date().toISOString().split('T')[0];
              break;
            default:
              newFields[field.name] = '';
          }
        }
      });

      setFormMapping({
        ...formMapping,
        fields: newFields
      });
    }
    
    // Show success message (in a real app, you'd use a toast)
    alert('Field definitions saved successfully!');
  };

  const handleCloseEditor = () => {
    setIsFieldEditorOpen(false);
    setSelectedForm(null);
    setFormMapping(null);
    setFieldDefinitions([]);
  };

  // Upload functions
  const handleOpenUploadDialog = () => {
    setIsUploadDialogOpen(true);
    setUploadData({
      id: '',
      title: '',
      category: '',
      description: '',
      templateType: 'PDF',
      file: null
    });
    setUploadError(null);
    setUploadProgress(0);
  };

  const handleReplaceTemplate = () => {
    if (!selectedForm) return;
    
    setIsUploadDialogOpen(true);
    setUploadData({
      id: selectedForm.form_id,
      title: selectedForm.form_title,
      category: selectedForm.form_category,
      description: selectedForm.form_description || '',
      templateType: selectedForm.form_template_type || 'PDF',
      file: null
    });
    setUploadError(null);
    setUploadProgress(0);
  };

  const handleCloseUploadDialog = () => {
    if (isUploading) return; // Prevent closing during upload
    setIsUploadDialogOpen(false);
    setUploadData({
      id: '',
      title: '',
      category: '',
      description: '',
      templateType: 'PDF',
      file: null
    });
    setUploadError(null);
    setUploadProgress(0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = {
      'PDF': ['application/pdf'],
      'EXCEL': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      'WORD': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    };

    const fileType = file.type;
    let detectedType: 'PDF' | 'EXCEL' | 'WORD' = 'PDF';

    if (validTypes.PDF.includes(fileType)) {
      detectedType = 'PDF';
    } else if (validTypes.EXCEL.includes(fileType)) {
      detectedType = 'EXCEL';
    } else if (validTypes.WORD.includes(fileType)) {
      detectedType = 'WORD';
    }

    setUploadData(prev => ({
      ...prev,
      file,
      templateType: detectedType,
      // Auto-generate ID from filename if empty
      id: prev.id || file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').toUpperCase(),
      // Auto-generate title from filename if empty  
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    }));
    setUploadError(null);
  };

  const handleUploadDataChange = (field: keyof NewTemplateData, value: string) => {
    setUploadData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateUploadData = (): string | null => {
    if (!uploadData.file) return 'Please select a file to upload';
    if (!uploadData.id.trim()) return 'Template ID is required';
    if (!uploadData.title.trim()) return 'Template title is required';
    if (!uploadData.category.trim()) return 'Category is required';
    
    // Check if ID already exists (only for new templates, not replacements)
    const isReplacement = selectedForm && selectedForm.form_id === uploadData.id;
    if (!isReplacement && forms.some(form => form.form_id.toLowerCase() === uploadData.id.toLowerCase())) {
      return 'A template with this ID already exists';
    }

    return null;
  };

  const handleUploadTemplate = async () => {
    const validationError = validateUploadData();
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    if (!uploadData.file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    // Determine if this is a replacement operation
    const isReplacement = selectedForm && selectedForm.form_id === uploadData.id;

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call upload service
      const newForm = await uploadTemplate({
        id: uploadData.id,
        title: uploadData.title,
        category: uploadData.category,
        description: uploadData.description,
        templateType: uploadData.templateType,
        file: uploadData.file
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to forms list or replace existing
      if (isReplacement) {
        setForms(prev => prev.map(form => 
          form.form_id === uploadData.id ? newForm : form
        ));
      } else {
        setForms(prev => [newForm, ...prev]);
      }
      
      // Show success message
      alert(isReplacement ? 'Template replaced successfully!' : 'Template uploaded successfully!');
      
      // Close dialog
      handleCloseUploadDialog();

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            onClick={handleOpenUploadDialog}
          >
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
          <Card key={form.form_id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              {/* Header with ID and Type Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-base text-gray-900 mb-1">{form.form_id}</h3>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">{form.form_title}</p>
                </div>
                <Badge 
                  variant="outline"
                  className={`ml-2 text-xs px-2 py-1 ${getTemplateTypeColor(form.form_template_type || 'PDF')}`}
                >
                  {form.form_template_type || 'PDF'}
                </Badge>
              </div>

              {/* Form Details */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Category:</span> {form.form_category}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Fields:</span> {form.fieldCount || 0}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Version:</span> {form.form_version || '1.0'}
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
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleOpenUploadDialog}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Template
            </Button>
          )}
        </div>
      )}

      {/* Field Editor Side Panel */}
      <Sheet open={isFieldEditorOpen} onOpenChange={setIsFieldEditorOpen}>
        <SheetContent className="w-[600px] sm:w-[800px] max-w-[90vw]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-green-600" />
                  Edit Form Fields
                </SheetTitle>
                <SheetDescription>
                  {selectedForm && (
                    <>
                      Edit field mappings for <strong>{selectedForm.form_id}</strong> - {selectedForm.form_title}
                    </>
                  )}
                </SheetDescription>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shrink-0"
                onClick={handleReplaceTemplate}
              >
                <Upload className="h-4 w-4" />
                Upload New Template
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 py-6">
            {loadingMapping ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : formMapping ? (
              <ScrollArea className="h-[calc(100vh-250px)]">
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
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Form Fields ({fieldDefinitions.length})
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddField}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Field
                      </Button>
                    </div>
                    
                    {fieldDefinitions.length > 0 ? (
                      <div className="space-y-3">
                        {fieldDefinitions.map((field, index) => {
                          const getTypeIcon = (type: string) => {
                            switch (type) {
                              case 'boolean': return CheckSquare;
                              case 'number': return Hash;
                              case 'date': return Calendar;
                              default: return FileText;
                            }
                          };
                          const TypeIcon = getTypeIcon(field.type);
                          
                          return (
                            <div key={index} className="border rounded-lg p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600">Field Name</Label>
                                  <Input
                                    value={field.name}
                                    onChange={(e) => handleFieldNameChange(index, e.target.value)}
                                    placeholder="Enter field name"
                                    className="text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600">Data Type</Label>
                                  <div className="flex gap-2">
                                    <Select 
                                      value={field.type} 
                                      onValueChange={(value: 'string' | 'number' | 'boolean' | 'date') => 
                                        handleFieldTypeChange(index, value)
                                      }
                                    >
                                      <SelectTrigger className="text-sm">
                                        <div className="flex items-center gap-2">
                                          <TypeIcon className="h-3 w-3" />
                                          <SelectValue />
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="string">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-3 w-3" />
                                            Text
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="number">
                                          <div className="flex items-center gap-2">
                                            <Hash className="h-3 w-3" />
                                            Number
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="boolean">
                                          <div className="flex items-center gap-2">
                                            <CheckSquare className="h-3 w-3" />
                                            Boolean
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="date">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            Date
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveField(index)}
                                      className="px-2 hover:bg-red-50 hover:border-red-200"
                                    >
                                      <X className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No fields defined for this form</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddField}
                          className="mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add First Field
                        </Button>
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
              disabled={!formMapping || fieldDefinitions.length === 0}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Upload Template Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={handleCloseUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              {uploadData.id && forms.some(f => f.id === uploadData.id) ? 'Replace Template' : 'Upload New Template'}
            </DialogTitle>
            <DialogDescription>
              {uploadData.id && forms.some(f => f.id === uploadData.id) 
                ? `Replace the existing template "${uploadData.id}" with a new file.`
                : 'Upload a new form template. Supports PDF, Word, and Excel files.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Template File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="template-file"
                  disabled={isUploading}
                />
                <label htmlFor="template-file" className="cursor-pointer">
                  {uploadData.file ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <p className="text-sm font-medium text-gray-900">{uploadData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB • {uploadData.templateType}
                      </p>
                      <Button variant="outline" size="sm" type="button">
                        <Plus className="h-4 w-4 mr-1" />
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">Click to select a file or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, Word, or Excel files up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Template Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-id">Template ID *</Label>
                <Input
                  id="template-id"
                  value={uploadData.id}
                  onChange={(e) => handleUploadDataChange('id', e.target.value)}
                  placeholder="e.g., PERMIT_APPLICATION_2024"
                  disabled={isUploading || (selectedForm && selectedForm.id === uploadData.id)}
                  className={selectedForm && selectedForm.id === uploadData.id ? 'bg-gray-50 text-gray-500' : ''}
                />
                {selectedForm && selectedForm.id === uploadData.id && (
                  <p className="text-xs text-gray-500">ID cannot be changed when replacing an existing template</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select 
                  value={uploadData.templateType} 
                  onValueChange={(value: 'PDF' | 'EXCEL' | 'WORD') => handleUploadDataChange('templateType', value)}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="WORD">Word Document</SelectItem>
                    <SelectItem value="EXCEL">Excel Spreadsheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-title">Template Title *</Label>
              <Input
                id="template-title"
                value={uploadData.title}
                onChange={(e) => handleUploadDataChange('title', e.target.value)}
                placeholder="e.g., Park Event Permit Application"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Category *</Label>
              <Select 
                value={uploadData.category} 
                onValueChange={(value) => handleUploadDataChange('category', value)}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {getCategories().filter(cat => cat !== 'All Categories').map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Parks">Parks</SelectItem>
                  <SelectItem value="Permits">Permits</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={uploadData.description}
                onChange={(e) => handleUploadDataChange('description', e.target.value)}
                placeholder="Brief description of this template..."
                rows={3}
                disabled={isUploading}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading template...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Error Display */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseUploadDialog}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadTemplate}
              disabled={isUploading || !uploadData.file}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}