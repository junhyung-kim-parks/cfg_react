import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, FileText, Building, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { list as getFormList } from '../features/forms/services/forms.service';
import { formFieldMappingsService } from '../features/forms/services/formFieldMappings.service';
import { downloadTemplate } from '../services/api/download';
import { useFormGenerator } from '../contexts/FormGeneratorContext';
import { getSelectedFormsFromUrl, navigateWithSelectedForms } from '../utils/urlParams';
import { generateFormFieldMappings, type ProjectData } from '../services/embedded_dataset/form_field_mappings';
import type { FormItem } from '../features/forms/types';
import type { Project } from '../features/projects/types';
import { toast } from 'sonner@2.0.3';

interface PrefillData {
  project: Project;
  selectedForms: string[];
}

interface FormFieldData {
  [key: string]: string | number | boolean;
}

export function PrefillPreviewPage() {
  const { setCurrentStep, setSelectedProject, state } = useFormGenerator();
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);
  const [selectedFormItems, setSelectedFormItems] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormFieldData>({});
  const [formFieldsData, setFormFieldsData] = useState<{[formId: string]: FormFieldData}>({});
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [formMappings, setFormMappings] = useState<{[formId: string]: any}>({});
  const [isDownloading, setIsDownloading] = useState(false);
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
      setLoading(true);

      // Get selected form IDs from URL
      const urlSelectedForms = getSelectedFormsFromUrl();
      console.log('📋 PrefillPreviewPage: Selected forms from URL:', urlSelectedForms);

      // Get data from URL params (could be project or full data from FormPicker)
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      let data: any = null;

      if (dataParam) {
        try {
          data = JSON.parse(decodeURIComponent(dataParam));
          console.log('📋 PrefillPreviewPage: Data from URL params:', data);
        } catch (error) {
          console.error('📋 PrefillPreviewPage: Failed to parse data from URL:', error);
        }
      }

      // Determine which form IDs to use - prioritize URL params
      let selectedFormIds: string[] = [];
      if (urlSelectedForms.length > 0) {
        selectedFormIds = urlSelectedForms;
        console.log('📋 PrefillPreviewPage: Using form IDs from URL:', selectedFormIds);
      } else if (data?.selectedForms?.length > 0) {
        selectedFormIds = data.selectedForms;
        console.log('📋 PrefillPreviewPage: Using form IDs from data param:', selectedFormIds);
      } else if (state.selectedForms.length > 0) {
        selectedFormIds = state.selectedForms;
        console.log('📋 PrefillPreviewPage: Using form IDs from FormGeneratorContext:', selectedFormIds);
      }

      if (data) {
        if (data.project && !state.selectedProject) {
          // Only set project if it's not already set in context
          setSelectedProject(data.project);
          console.log('📋 PrefillPreviewPage: Set project in context:', data.project.pi_short_description);
        }
        
        // Always store prefill data for this component
        if (data.project || data.selectedForms) {
          setPrefillData(data);
          
          // Project is already in FormGeneratorContext, no need to set again
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
          
          // Also set the project in FormGeneratorContext for TopHeader display
          if (data.project) {
            setSelectedProject(data.project);
          }
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
          selectedFormIds.includes(form.form_id)
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
          let mapping = loadedFormMappings[form.form_id];
          if (!mapping && embeddedMappings[form.form_id]) {
            mapping = embeddedMappings[form.form_id];
            console.log(`📋 PrefillPreviewPage: Using embedded mapping for ${form.form_id} with project: ${projectForEmbedded?.name || 'default'}`);
          }
          
          finalMappings[form.form_id] = mapping;
          
          if (mapping && mapping.fields) {
            // Use actual mapping fields directly
            fieldsData[form.form_id] = {
              ...mapping.fields
            };
          } else {
            // Fallback to generated fields if no mapping found
            fieldsData[form.form_id] = generateFormFields(form, initialFormData);
          }
        });
        
        setFormMappings(finalMappings);
        setFormFieldsData(fieldsData);

        // Set the first form as active, or prioritize FORM-003 if it exists
        const activeForm = selectedItems.find(f => f.form_id === 'FORM-003') || selectedItems[0];
        if (activeForm) {
          setActiveFormId(activeForm.form_id);
        }
      } else {
        console.warn('📋 PrefillPreviewPage: No selected forms found in URL, data, or context');
        // Show a helpful message instead of empty state
        setPrefillData({
          project: {
            id: 'no-project',
            name: 'No Project Selected',
            description: 'Please select a project and forms first',
            location: '',
            manager: '',
            status: 'inactive',
            startDate: '',
            endDate: '',
            budget: 0,
            progress: 0
          },
          selectedForms: []
        });
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

    // Add project-specific data
    return {
      ...baseFields,
      ProjectName: projectData.projectName || 'Sample Project',
      ProjectLocation: projectData.location || 'New York, NY',
      ProjectManager: projectData.projectManager || 'John Doe',
      ProjectStartDate: projectData.startDate || new Date().toISOString().split('T')[0],
      Contractor: projectData.contractor || 'ABC Construction Inc.',
      ProjectDescription: projectData.description || 'Sample project description'
    };
  };

  const handleDownloadTemplate = async () => {
    if (!selectedFormItems.length) {
      toast.error('No forms selected');
      return;
    }

    setIsDownloading(true);
    try {
      const selectedFormIds = selectedFormItems.map(form => form.form_id);
      const result = await downloadTemplate(selectedFormIds, formFieldsData);
      
      if (result.success) {
        toast.success(`Downloaded ${result.downloadedFiles} file(s) successfully`);
      } else {
        toast.error(result.message || 'Download failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download templates');
    } finally {
      setIsDownloading(false);
    }
  };

  const navigateToFormPicker = () => {
    if ((window as any).manualNavigate) {
      (window as any).manualNavigate('/forms/picker');
    } else {
      // Fallback
      window.history.pushState({}, '', '/forms/picker');
      window.dispatchEvent(new Event('navigate'));
    }
  };

  // Render form fields as key-value pairs
  const renderFormFields = (formId: string) => {
    const fields = formFieldsData[formId] || {};
    const entries = Object.entries(fields);
    
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No field mappings available for this form</p>
        </div>
      );
    }

    // Show first 10 fields, then show count if more
    const displayFields = entries.slice(0, 10);
    
    return (
      <div className="space-y-3">
        {displayFields.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between py-2 border-b border-gray-200">
            <div className="flex-1 min-w-0 mr-4">
              <Label className="text-xs font-medium text-gray-700">{key}</Label>
            </div>
            <div className="flex-1 min-w-0">
              {typeof value === 'boolean' ? (
                <div className="flex items-center">
                  <Checkbox checked={value} disabled className="mr-2" />
                  <span className="text-sm text-gray-600">{value ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <div className="text-sm text-gray-900 break-words">
                  {String(value)}
                </div>
              )}
            </div>
          </div>
        ))}
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
                    key={form.form_id}
                    onClick={() => setActiveFormId(form.form_id)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      form.form_id === activeFormId
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{form.form_title}</div>
                    <div className="text-xs text-gray-500">{form.form_id}</div>
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
              
              <Button 
                onClick={handleDownloadTemplate}
                disabled={isDownloading || !selectedFormItems.length}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download Template'}
              </Button>
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
            className="border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2"
            onClick={handleDownloadTemplate}
            disabled={isDownloading || !selectedFormItems.length}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}