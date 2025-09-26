import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, FileText, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { list as getFormList } from '../features/forms/services/forms.service';
import { formFieldMappingsService } from '../features/forms/services/formFieldMappings.service';
import { useFormGenerator } from '../contexts/FormGeneratorContext';
import { getSelectedFormsFromUrl, navigateWithSelectedForms } from '../utils/urlParams';
import { generateFormFieldMappings, type ProjectData } from '../services/embedded_dataset/form_field_mappings';
import type { FormItem } from '../features/forms/types';
import type { Project } from '../features/projects/types';

interface PrefillData {
  project: Project;
  selectedForms: string[];
}

interface FormFieldData {
  [key: string]: string | number | boolean;
}

export function PrefillPreviewPage() {
  const { setCurrentStep } = useFormGenerator();
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);
  const [selectedFormItems, setSelectedFormItems] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormFieldData>({});
  const [formFieldsData, setFormFieldsData] = useState<{[formId: string]: FormFieldData}>({});
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [formMappings, setFormMappings] = useState<{[formId: string]: any}>({});
  const hasMounted = useRef(false);

  // Set current step when component mounts
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setCurrentStep('prefill-preview');
    }
  }, []);

  useEffect(() => {
    loadPrefillData();
  }, []);

  const loadPrefillData = async () => {
    try {
      // Get data from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      const selectedFormsFromUrl = getSelectedFormsFromUrl();
      
      let data: PrefillData | null = null;
      let selectedFormIds: string[] = [];

      // First priority: Use URL selected parameter
      if (selectedFormsFromUrl.length > 0) {
        selectedFormIds = selectedFormsFromUrl;
        console.log('📋 PrefillPreviewPage: Using selected forms from URL:', selectedFormIds);
      }

      // Second priority: Use data parameter (backward compatibility)
      if (dataParam) {
        try {
          data = JSON.parse(decodeURIComponent(dataParam)) as PrefillData;
          setPrefillData(data);
          
          // If no URL selected forms but data has selected forms, use those
          if (selectedFormIds.length === 0 && data.selectedForms) {
            selectedFormIds = data.selectedForms;
            console.log('📋 PrefillPreviewPage: Using selected forms from data:', selectedFormIds);
          }
        } catch (error) {
          console.error('📋 PrefillPreviewPage: Failed to parse data param:', error);
        }
      }

      // If we have form IDs, proceed with loading
      if (selectedFormIds.length > 0) {
        // Create mock prefill data if none exists
        if (!data) {
          data = {
            project: {
              id: 'mock-project',
              name: 'Sample Project',
              description: 'Sample project description',
              location: 'New York, NY',
              manager: 'John Doe',
              status: 'active',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '2025-12-31',
              budget: 5000000,
              progress: 25
            },
            selectedForms: selectedFormIds
          };
          setPrefillData(data);
        }

        // Initialize form data with project information
        const initialFormData = {
          projectName: data.project?.name || 'Sample Project',
          projectId: `PROJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          contractor: 'ABC Construction Inc.',
          projectManager: data.project?.manager || 'John Doe',
          startDate: new Date().toISOString().split('T')[0],
          location: data.project?.location || 'New York, NY',
          description: data.project?.description || 'Sample project description'
        };
        setFormData(initialFormData);

        // Load all forms to get details of selected forms
        const allForms = await getFormList();
        const selectedItems = allForms.filter(form => 
          selectedFormIds.includes(form.id)
        );
        setSelectedFormItems(selectedItems);

        // Convert project data to embedded dataset format
        const projectForEmbedded: ProjectData | undefined = data.project ? {
          name: data.project.name,
          id: data.project.id,
          description: data.project.description,
          location: data.project.location,
          manager: data.project.manager,
          status: data.project.status,
          startDate: data.project.startDate,
          endDate: data.project.endDate,
          budget: data.project.budget,
          progress: data.project.progress
        } : undefined;

        // Load actual form field mappings with embedded dataset fallback
        let loadedFormMappings: any = {};
        try {
          loadedFormMappings = await formFieldMappingsService.getFormMappings(selectedFormIds);
          console.log('📋 PrefillPreviewPage: HTTP mapping service succeeded');
        } catch (error) {
          console.warn('📋 PrefillPreviewPage: HTTP mapping service failed, using embedded dataset:', error);
        }
        
        // Generate embedded mappings with actual project data
        const embeddedMappings = generateFormFieldMappings(projectForEmbedded);
        console.log('📋 PrefillPreviewPage: Generated embedded mappings for project:', projectForEmbedded?.name);
        
        // Initialize form fields data for each selected form using actual mappings
        const fieldsData: {[formId: string]: FormFieldData} = {};
        const finalMappings: {[formId: string]: any} = {};
        
        selectedItems.forEach(form => {
          // Try HTTP mapping first, then fallback to embedded dataset with project data
          let mapping = loadedFormMappings[form.id];
          if (!mapping && embeddedMappings[form.id]) {
            mapping = embeddedMappings[form.id];
            console.log(`📋 PrefillPreviewPage: Using embedded mapping for ${form.id} with project: ${projectForEmbedded?.name || 'default'}`);
          }
          
          finalMappings[form.id] = mapping;
          
          if (mapping && mapping.fields) {
            // Use actual mapping fields directly
            fieldsData[form.id] = {
              ...mapping.fields
            };
          } else {
            // Fallback to generated fields if no mapping found
            fieldsData[form.id] = generateFormFields(form, initialFormData);
          }
        });
        
        setFormMappings(finalMappings);
        setFormFieldsData(fieldsData);

        // Set the first form as active, or prioritize FORM-003 if it exists
        const activeForm = selectedItems.find(f => f.id === 'FORM-003') || selectedItems[0];
        if (activeForm) {
          setActiveFormId(activeForm.id);
        }
      } else {
        console.warn('📋 PrefillPreviewPage: No selected forms found in URL or data');
      }
    } catch (error) {
      console.error('Failed to load prefill data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate sample form fields based on form type and prefill data
  const generateFormFields = (form: FormItem, projectData: FormFieldData): FormFieldData => {
    const baseFields = {
      ContractNo: `Q123-456M`,
      TimeAllowedCCD: 365,
      ConstructionSupervision: 'Consultant',
      Design: 'Jane Designer',
      AwardDate: '2025-06-01',
      BidPrice: 5000000,
      Req_ProgressSchedule_Y: true,
      Insurance_CGL_Y: true,
      DoT_MPT_Y: false
    };

    // Add project-specific fields
    return {
      ...baseFields,
      ProjectName: projectData.projectName,
      ProjectManager: projectData.projectManager,
      Location: projectData.location,
      ContractorName: projectData.contractor || 'ABC Construction Inc.'
    };
  };

  const navigateToFormPicker = () => {
    // Get selected forms from URL or state
    const selectedFormIds = getSelectedFormsFromUrl() || (prefillData?.selectedForms || []);
    
    if (selectedFormIds.length > 0) {
      // Navigate to form picker with selected forms in URL
      navigateWithSelectedForms('/forms/picker', selectedFormIds);
      
      // Also include project data for backward compatibility
      if (prefillData) {
        const dataToPass = {
          project: prefillData.project,
          selectedForms: selectedFormIds
        };
        const encodedData = encodeURIComponent(JSON.stringify(dataToPass));
        const url = new URL(window.location.href);
        url.pathname = '/forms/picker';
        url.searchParams.set('selected', selectedFormIds.join(','));
        url.searchParams.set('data', encodedData);
        window.history.pushState({}, '', url.toString());
        window.dispatchEvent(new Event('navigate'));
      }
    } else {
      // Fallback: just go to form picker
      window.history.pushState({}, '', '/forms/picker');
      window.dispatchEvent(new Event('navigate'));
    }
  };



  const handleFormFieldChange = (formId: string, field: string, value: string | number | boolean) => {
    setFormFieldsData(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: value
      }
    }));
  };



  // Render form fields for the active form
  const renderFormFields = (formId: string) => {
    const fields = formFieldsData[formId] || {};
    const entries = Object.entries(fields);
    
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No field mappings available for this form</p>
          <p className="text-xs text-gray-400 mt-1">
            Form template: {formMappings[formId]?.pdf || `${formId}.pdf`}
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {entries.map(([key, value]) => {
          return (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-gray-600 font-medium">
                {key}
              </Label>
              {typeof value === 'boolean' ? (
                <div className="flex items-center gap-2 min-h-[32px]">
                  <Checkbox
                    checked={value}
                    onCheckedChange={(checked) => handleFormFieldChange(formId, key, checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {value ? 'Yes' : 'No'}
                  </span>
                </div>
              ) : typeof value === 'number' ? (
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleFormFieldChange(formId, key, Number(e.target.value))}
                  className="text-sm h-8 border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                />
              ) : (
                <Input
                  type="text"
                  value={String(value)}
                  onChange={(e) => handleFormFieldChange(formId, key, e.target.value)}
                  className="text-sm h-8 border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!prefillData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No prefill data found</p>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToFormPicker}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl text-gray-900">Prefill Preview</h1>
            <p className="text-gray-600">Review the values that will be written into the PDF fields</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Forms Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <FileText className="h-5 w-5" />
              1. Selected Forms
            </CardTitle>
            <p className="text-sm text-gray-600">Forms that will be generated with prefilled data</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedFormItems.length > 0 ? (
                selectedFormItems.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => setActiveFormId(form.id)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      form.id === activeFormId
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {form.id}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No forms selected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Data Section - Combined project info and form fields */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <FileText className="h-5 w-5" />
                  2. Form Data
                  {activeFormId && (
                    <span className="text-sm text-gray-600 font-normal">
                      - {activeFormId}
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Form fields that will be populated in the PDF template
                </p>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            {/* Form Fields for Active Form */}
            {activeFormId && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {activeFormId} Fields
                  </h4>
                  <div className="text-xs text-gray-500">
                    Template: {formMappings[activeFormId]?.pdf || `${activeFormId}.pdf`}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div>
                    {renderFormFields(activeFormId)}
                  </div>
                  
                  {Object.keys(formFieldsData[activeFormId] || {}).length > 10 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        {Object.keys(formFieldsData[activeFormId] || {}).length} fields total
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </CardContent>
        </Card>


      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t bg-white p-6 rounded-lg">
        <Button variant="outline" onClick={navigateToFormPicker}>
          ← Back
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() => {
              // Mock download functionality
              const selectedFormIds = getSelectedFormsFromUrl() || (prefillData?.selectedForms || []);
              alert(`Downloading template for forms: ${selectedFormIds.join(', ')}`);
            }}
          >
            📄 Download Template
          </Button>
        </div>
      </div>
    </div>
  );
}