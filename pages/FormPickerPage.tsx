import { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, FileText, Calendar, MapPin, User, DollarSign, X, Eye } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { list as getFormList } from '../features/forms/services/forms.service';
import { useProject } from '../contexts/ProjectContext';
import { useFormGenerator } from '../contexts/FormGeneratorContext';
import { getSelectedFormsFromUrl, navigateWithSelectedForms } from '../utils/urlParams';
import type { FormItem } from '../features/forms/types';
import type { Project } from '../features/projects/types';

export function FormPickerPage() {
  const { selectedProject: contextProject } = useProject();
  const { state: formGenState, setCurrentStep, setSelectedForms: setFormGenSelectedForms } = useFormGenerator();
  const [selectedProject, setSelectedProject] = useState<Project | null>(contextProject);
  const [forms, setForms] = useState<FormItem[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hasMounted = useRef(false);

  // Set current step when component mounts
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setCurrentStep('form-picker');
    }
  }, []);

  useEffect(() => {
    // Priority: Use context project first, then fallback to URL params
    if (contextProject) {
      console.log('📋 FormPickerPage: Using project from context:', contextProject);
      setSelectedProject(contextProject);
    } else {
      // Get data from URL params (could be project or full data from PrefillPreview)
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      const projectParam = urlParams.get('project');
      
      if (dataParam) {
        try {
          const data = JSON.parse(decodeURIComponent(dataParam));
          console.log('📋 FormPickerPage: Using data from URL params:', data);
          if (data.project) {
            setSelectedProject(data.project);
          }
          if (data.selectedForms && Array.isArray(data.selectedForms)) {
            setSelectedForms(data.selectedForms);
            console.log('📋 FormPickerPage: Restored selected forms:', data.selectedForms);
          }
        } catch (error) {
          console.error('📋 FormPickerPage: Failed to parse data from URL:', error);
        }
      } else if (projectParam) {
        try {
          const project = JSON.parse(decodeURIComponent(projectParam));
          console.log('📋 FormPickerPage: Using project from URL params:', project);
          setSelectedProject(project);
        } catch (error) {
          console.error('📋 FormPickerPage: Failed to parse project data from URL:', error);
        }
      } else {
        console.warn('📋 FormPickerPage: No project selected and no URL data found');
      }
    }

    // Load selected forms from URL if available
    const urlSelectedForms = getSelectedFormsFromUrl();
    if (urlSelectedForms.length > 0) {
      console.log('📋 FormPickerPage: Restoring selected forms from URL:', urlSelectedForms);
      setSelectedForms(urlSelectedForms);
      // Also sync to FormGeneratorContext
      setFormGenSelectedForms(urlSelectedForms);
    } else if (formGenState.selectedForms.length > 0) {
      // If no URL params but FormGeneratorContext has selected forms, restore from context
      console.log('📋 FormPickerPage: Restoring selected forms from FormGeneratorContext:', formGenState.selectedForms);
      setSelectedForms(formGenState.selectedForms);
      // Update URL to reflect the context state
      navigateWithSelectedForms('/forms/picker', formGenState.selectedForms);
    }

    // Load forms
    loadForms();
  }, [contextProject]);

  useEffect(() => {
    // Filter forms based on search term
    if (searchTerm.trim() === '') {
      setFilteredForms(forms);
    } else {
      const filtered = forms.filter(form =>
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredForms(filtered);
    }
  }, [searchTerm, forms]);

  const loadForms = async () => {
    try {
      console.log('📋 FormPickerPage: Starting to load forms...');
      console.log('📋 FormPickerPage: Calling getFormList()');
      
      const formData = await getFormList();
      
      console.log('📋 FormPickerPage: Raw response received');
      console.log('📋 FormPickerPage: Type of received data:', typeof formData);
      console.log('📋 FormPickerPage: Is array check:', Array.isArray(formData));
      console.log('📋 FormPickerPage: Is null/undefined:', formData === null || formData === undefined);
      console.log('📋 FormPickerPage: Data length (if array):', Array.isArray(formData) ? formData.length : 'N/A');
      console.log('📋 FormPickerPage: First item preview:', Array.isArray(formData) ? formData[0] : formData);
      
      // Ensure we have valid form data
      let validFormData: any[] = [];
      
      if (!formData) {
        console.warn('📋 FormPickerPage: Received null/undefined data');
        validFormData = [];
      } else if (Array.isArray(formData)) {
        console.log('📋 FormPickerPage: Data is valid array with', formData.length, 'items');
        validFormData = formData;
      } else {
        console.warn('📋 FormPickerPage: Data is not an array, received:', typeof formData);
        console.log('📋 FormPickerPage: Full data content:', formData);
        validFormData = [];
      }
      
      setForms(validFormData);
      setFilteredForms(validFormData);
      console.log('📋 FormPickerPage: Final state - forms count:', validFormData.length);
      
    } catch (error) {
      console.error('📋 FormPickerPage: Exception occurred while loading forms:', error);
      setForms([]);
      setFilteredForms([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFormSelection = (formId: string) => {
    setSelectedForms(prev => {
      const newSelection = prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId];
      
      // Update FormGeneratorContext as well
      setFormGenSelectedForms(newSelection);
      console.log('📋 FormPickerPage: Updated selected forms in context:', newSelection);
      
      // Update URL with new selection
      navigateWithSelectedForms('/forms/picker', newSelection);
      
      return newSelection;
    });
  };

  const removeSelectedForm = (formId: string) => {
    setSelectedForms(prev => {
      const newSelection = prev.filter(id => id !== formId);
      
      // Update FormGeneratorContext as well
      setFormGenSelectedForms(newSelection);
      console.log('📋 FormPickerPage: Updated selected forms in context:', newSelection);
      
      // Update URL with new selection
      navigateWithSelectedForms('/forms/picker', newSelection);
      
      return newSelection;
    });
  };

  const clearAllSelections = () => {
    setSelectedForms([]);
    
    // Update FormGeneratorContext as well
    setFormGenSelectedForms([]);
    console.log('📋 FormPickerPage: Cleared all selected forms from context');
    
    // Update URL to remove selection
    navigateWithSelectedForms('/forms/picker', []);
  };

  const getSelectedFormItems = () => {
    return forms.filter(form => selectedForms.includes(form.id));
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateToProjectSearch = () => {
    if ((window as any).manualNavigate) {
      (window as any).manualNavigate('/forms/project-search');
    } else {
      // Fallback
      window.history.pushState({}, '', '/forms/project-search');
      window.dispatchEvent(new Event('navigate'));
    }
  };

  const proceedToPreview = () => {
    if (selectedForms.length === 0) return;
    
    // Save to FormGeneratorContext for persistence across page navigation
    setFormGenSelectedForms(selectedForms);
    console.log('📋 FormPickerPage: Saved selected forms to context:', selectedForms);
    
    // Navigate to prefill preview with selected forms in URL
    navigateWithSelectedForms('/forms/prefill-preview', selectedForms);
    
    // Also pass project data as before for backward compatibility
    const previewData = {
      project: selectedProject,
      selectedForms: selectedForms
    };
    const encodedData = encodeURIComponent(JSON.stringify(previewData));
    const url = new URL(window.location.href);
    url.pathname = '/forms/prefill-preview';
    url.searchParams.set('selected', selectedForms.join(','));
    url.searchParams.set('data', encodedData);
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('navigate'));
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
      {/* Header with Back Button and Next Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToProjectSearch}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl text-gray-900">Form Picker</h1>
            <p className="text-gray-600">Pick one or more forms to generate for this project</p>
          </div>
        </div>

        {/* Next Button - Only show when forms are selected */}
        {selectedForms.length > 0 && (
          <Button 
            onClick={proceedToPreview}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            Next to Prefill Preview
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              {selectedForms.length}
            </span>
          </Button>
        )}
      </div>

      {/* Selected Project Information */}
      {selectedProject && (
        <Card className="border-l-4 border-l-green-600 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {selectedProject.pi_short_description?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <h3 className="text-lg text-gray-900">{selectedProject.pi_short_description}</h3>
                  <Badge className={getStatusColor(selectedProject.pi_park_contract_status)}>
                    {selectedProject.pi_park_contract_status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">Contract: {selectedProject.pi_park_contract_no}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedProject.pi_park_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{selectedProject.pi_managing_design_team_unit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(selectedProject.pi_total_project_funding_amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedProject.phase_end_date}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm text-gray-600">{selectedProject.pi_progress_to_date}%</span>
                  </div>
                  <Progress value={selectedProject.pi_progress_to_date} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Selection Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg text-gray-900 mb-2">Choose forms</h3>
              <p className="text-sm text-gray-600">Pick one or more forms to generate for this project.</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {filteredForms.length} available
                </div>
                
                {/* Selected Forms Display */}
                {selectedForms.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <Eye className="h-4 w-4" />
                        {selectedForms.length} selected
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">Selected Forms</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllSelections}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Clear all
                          </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {getSelectedFormItems().map((form) => (
                            <div
                              key={form.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {form.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {form.id} • {form.category}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSelectedForm(form.id)}
                                className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            
            {/* Selected Forms Pills (for smaller selections) */}
            {selectedForms.length > 0 && selectedForms.length <= 3 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-gray-600">Selected:</span>
                {getSelectedFormItems().map((form) => (
                  <Badge 
                    key={form.id}
                    variant="secondary"
                    className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200"
                  >
                    <span className="truncate max-w-[150px]">{form.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedForm(form.id)}
                      className="h-3 w-3 p-0 ml-1 text-green-600 hover:text-green-800"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Forms Summary (for larger selections) */}
      {selectedForms.length > 3 && (
        <Card className="border-l-4 border-l-blue-600 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    {selectedForms.length} forms selected
                  </h4>
                  <p className="text-xs text-blue-700">
                    {getSelectedFormItems().slice(0, 2).map(f => f.title).join(', ')}
                    {selectedForms.length > 2 && ` and ${selectedForms.length - 2} more...`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                      View All
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">All Selected Forms</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllSelections}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear all
                        </Button>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getSelectedFormItems().map((form) => (
                          <div
                            key={form.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {form.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {form.id} • {form.category}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedForm(form.id)}
                              className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllSelections}
                  className="text-blue-700 hover:text-blue-900"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loading && filteredForms && filteredForms.length > 0 ? filteredForms.map((form) => (
          <Card 
            key={form.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedForms.includes(form.id) 
                ? 'ring-2 ring-green-600 bg-green-50' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => toggleFormSelection(form.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900 line-clamp-1">{form.title}</h4>
                    <p className="text-xs text-gray-500">{form.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedForms.includes(form.id) && (
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{form.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {form.category}
                  </Badge>
                  {form.phase && (
                    <Badge variant="secondary" className="text-xs">
                      {form.phase}
                    </Badge>
                  )}
                  {form.templateType && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        form.templateType === 'Excel' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {form.templateType}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {form.fieldCount !== undefined && form.fieldCount > 0 && (
                    <span>{form.fieldCount} fields</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full text-center py-8">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="text-gray-500">Loading forms...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-12 w-12 text-gray-300" />
                <div>
                  <p className="text-gray-500 mb-1">
                    {searchTerm ? 'No forms match your search' : 'No forms available'}
                  </p>
                  {searchTerm && (
                    <p className="text-sm text-gray-400">
                      Try adjusting your search terms
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {selectedForms.length} form{selectedForms.length !== 1 ? 's' : ''} selected
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={navigateToProjectSearch}>
            Cancel
          </Button>
          <Button 
            onClick={proceedToPreview}
            disabled={selectedForms.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Next to Prefill Preview
          </Button>
        </div>
      </div>
    </div>
  );
}