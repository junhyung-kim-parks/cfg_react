import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, FileText, Building, Download, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { list as getFormList } from '../features/forms/services/forms.service';
import { formFieldMappingsService } from '../features/forms/services/formFieldMappings.service';
import { downloadTemplate, downloadSingleFormPdf } from '../services/api/download';
import { useFormGenerator } from '../contexts/FormGeneratorContext';
import { getSelectedFormsFromUrl } from '../utils/urlParams';
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

interface FormFieldEntry {
  map_id: string;
  label: string;
  value: string | number | boolean;
  source_col: string;
  data_type: 'text' | 'number' | 'boolean' | 'date';
  display_order?: number;
}

export function PrefillPreviewPage() {
  const { setCurrentStep, setSelectedProject, state } = useFormGenerator();
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);
  const [selectedFormItems, setSelectedFormItems] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formFieldsData, setFormFieldsData] = useState<{[formId: string]: FormFieldData}>({});
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [formMappings, setFormMappings] = useState<{[formId: string]: any}>({});
  const [loadingFormIds, setLoadingFormIds] = useState<Set<string>>(new Set());
  const [loadedFormIds, setLoadedFormIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [editedFieldsData, setEditedFieldsData] = useState<{[formId: string]: FormFieldData}>({});
  const hasMounted = useRef(false);

  // Set current step when component mounts
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setCurrentStep('prefill-preview');
    }
  }, [setCurrentStep]);

  useEffect(() => {
    loadPrefillData();
  }, []);

  // Auto-load the first form's data when both activeFormId and prefillData are ready
  useEffect(() => {
    if (activeFormId && prefillData && !loadedFormIds.has(activeFormId) && !loadingFormIds.has(activeFormId)) {
      console.log('📋 PrefillPreviewPage: Auto-loading data for active form:', activeFormId);
      loadFormMapping(activeFormId);
    }
  }, [activeFormId, prefillData]);

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
          
          console.log('📋 PrefillPreviewPage: Set prefill data with project:', {
            hasProject: !!data.project,
            projectId: data.project?.project_id || data.project?.id,
            projectName: data.project?.name || data.project?.pi_short_description,
            selectedFormsCount: data.selectedForms?.length || 0
          });
          
          // Also set the project in FormGeneratorContext for TopHeader display
          if (data.project) {
            setSelectedProject(data.project);
          }
        }



        // Load all forms to get details of selected forms
        const allForms = await getFormList();
        const selectedItems = allForms.filter(form => 
          selectedFormIds.includes(form.form_id)
        );
        setSelectedFormItems(selectedItems);

        // Note: Form field mappings will be loaded individually when each form is clicked

        // Set the first form as active, or prioritize FORM-003 if it exists
        const activeForm = selectedItems.find(f => f.form_id === 'FORM-003') || selectedItems[0];
        if (activeForm) {
          setActiveFormId(activeForm.form_id);
          console.log('📋 PrefillPreviewPage: Set initial active form:', activeForm.form_id);
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

  // Load mapping data for a specific form
  const loadFormMapping = async (formId: string) => {
    // Skip if already loaded or currently loading
    if (loadedFormIds.has(formId) || loadingFormIds.has(formId)) {
      return;
    }

    console.log(`📋 PrefillPreviewPage: Loading mapping for form ${formId}`);
    
    // Set loading state
    setLoadingFormIds(prev => new Set([...prev, formId]));

    try {
      console.log(`📋 PrefillPreviewPage: Loading mapping for form ${formId} with project:`, {
        hasProject: !!prefillData?.project,
        projectId: prefillData?.project?.project_id || prefillData?.project?.id,
        projectName: prefillData?.project?.name || prefillData?.project?.pi_short_description
      });
      
      // Use POST API to get mapping for this specific form
      const loadedFormMappings = await formFieldMappingsService.getFormMappingsWithProject(
        [formId], 
        prefillData?.project
      );
      
      console.log(`📋 PrefillPreviewPage: Successfully loaded mapping for ${formId}`);
      
      const mapping = loadedFormMappings[formId];
      
      if (mapping) {
        // Update form mappings
        setFormMappings(prev => ({
          ...prev,
          [formId]: mapping
        }));

        // Convert mapping to form fields data
        let fieldsData: FormFieldData = {};
        
        if (mapping.fields) {
          // Check if it's the new API structure (array of FormFieldEntry) or old structure (object)
          if (Array.isArray(mapping.fields)) {
            // New API structure - convert to old format for compatibility
            mapping.fields.forEach((field: FormFieldEntry) => {
              fieldsData[field.label] = field.value;
            });
            console.log(`📋 PrefillPreviewPage: Converted new API structure for ${formId}, ${mapping.fields.length} fields`);
          } else {
            // Old structure - use directly
            fieldsData = { ...mapping.fields };
            console.log(`📋 PrefillPreviewPage: Using legacy structure for ${formId}`);
          }
        }

        // Update form fields data
        setFormFieldsData(prev => ({
          ...prev,
          [formId]: fieldsData
        }));

        // Mark as loaded
        setLoadedFormIds(prev => new Set([...prev, formId]));
      } else {
        console.warn(`📋 PrefillPreviewPage: No mapping found for ${formId}, using fallback`);
        
        // Generate fallback fields
        const form = selectedFormItems.find(f => f.form_id === formId);
        if (form) {
          const fallbackFields = generateFormFields(form);
          setFormFieldsData(prev => ({
            ...prev,
            [formId]: fallbackFields
          }));
        }
        
        // Still mark as loaded to avoid retry
        setLoadedFormIds(prev => new Set([...prev, formId]));
      }
    } catch (error) {
      console.error(`📋 PrefillPreviewPage: Failed to load mapping for ${formId}:`, error);
      
      // Generate fallback fields on error
      const form = selectedFormItems.find(f => f.form_id === formId);
      if (form) {
        const fallbackFields = generateFormFields(form);
        setFormFieldsData(prev => ({
          ...prev,
          [formId]: fallbackFields
        }));
      }
      
      // Mark as loaded to avoid retry
      setLoadedFormIds(prev => new Set([...prev, formId]));
    } finally {
      // Remove from loading state
      setLoadingFormIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(formId);
        return newSet;
      });
    }
  };

  // Handle form click with data loading
  const handleFormClick = async (formId: string) => {
    setActiveFormId(formId);
    await loadFormMapping(formId);
  };

  // Helper function to check if a value is blank/empty
  const isBlankValue = (value: any, dataType?: string): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    // Treat 0 as blank for number fields
    if (dataType === 'number' && value === 0) return true;
    return false;
  };

  // Handle field value changes for editable fields
  const handleFieldChange = (formId: string, fieldKey: string, newValue: string | number | boolean) => {
    setEditedFieldsData(prev => ({
      ...prev,
      [formId]: {
        ...(prev[formId] || {}),
        [fieldKey]: newValue
      }
    }));
  };

  // Generate sample form fields based on form type and prefill data
  const generateFormFields = (form: FormItem): FormFieldData => {
    return {
      ContractNo: `Q123-456M`,
      TimeAllowedCCD: 365,
      ConstructionSupervision: 'Consultant',
      Design: 'Jane Designer',
      AwardDate: '2025-06-01',
      BidPrice: 5000000,
      Req_ProgressSchedule_Y: true,
      Insurance_CGL_Y: true,
      DoT_MPT_Y: false,
      ProjectName: prefillData?.project?.name || 'Sample Project',
      ProjectLocation: prefillData?.project?.location || 'New York, NY',
      ProjectManager: prefillData?.project?.manager || 'John Doe',
      ProjectStartDate: new Date().toISOString().split('T')[0],
      Contractor: 'ABC Construction Inc.',
      ProjectDescription: prefillData?.project?.description || 'Sample project description'
    };
  };

  const handleDownloadSingleForm = async (formId: string) => {
    if (!formId) {
      toast.error('No form selected');
      return;
    }

    setIsDownloading(true);
    try {
      // Make sure form data is loaded
      if (!loadedFormIds.has(formId)) {
        console.log(`📄 PrefillPreviewPage: Loading data for ${formId} before download`);
        await loadFormMapping(formId);
      }

      // Get the form mapping
      const mapping = formMappings[formId];
      if (!mapping) {
        toast.error('Form mapping not found');
        return;
      }

      // Prepare fields data - merge original with edited values
      const hasDetailedMapping = mapping && Array.isArray(mapping.fields);
      
      let fieldsToSend: FormFieldEntry[] = [];
      
      if (hasDetailedMapping) {
        // New API structure with detailed field info
        const fieldEntries = mapping.fields as FormFieldEntry[];
        
        // Merge with edited values
        fieldsToSend = fieldEntries.map(field => ({
          ...field,
          value: editedFieldsData[formId]?.[field.label] ?? field.value
        }));
      } else {
        // Legacy structure - convert to new format
        const fields = mapping.fields || {};
        const mergedData = {
          ...fields,
          ...(editedFieldsData[formId] || {})
        };
        
        fieldsToSend = Object.entries(mergedData).map(([key, value], index) => ({
          map_id: `legacy-${index}`,
          label: key,
          value: value as string | number | boolean,
          source_col: key,
          data_type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text' as 'text' | 'number' | 'boolean' | 'date',
          display_order: index + 1
        }));
      }

      console.log('📄 PrefillPreviewPage: Downloading single form:', {
        formId,
        pdfName: mapping.pdf,
        fieldsCount: fieldsToSend.length,
        editedFields: Object.keys(editedFieldsData[formId] || {}).length
      });

      // Call the single form download API
      await downloadSingleFormPdf({
        form_id: formId,
        pdf: mapping.pdf,
        fields: fieldsToSend
      });
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedFormItems.length) {
      toast.error('No forms selected');
      return;
    }

    setIsDownloading(true);
    try {
      const selectedFormIds = selectedFormItems.map(form => form.form_id);
      
      // Load data for any forms that haven't been loaded yet
      const unloadedForms = selectedFormIds.filter(formId => !loadedFormIds.has(formId));
      if (unloadedForms.length > 0) {
        console.log(`📄 PrefillPreviewPage: Loading data for ${unloadedForms.length} unloaded forms before download`);
        await Promise.all(unloadedForms.map(formId => loadFormMapping(formId)));
      }
      
      // Merge original form fields data with edited fields data
      const mergedFormFieldsData: {[formId: string]: FormFieldData} = {};
      selectedFormIds.forEach(formId => {
        mergedFormFieldsData[formId] = {
          ...(formFieldsData[formId] || {}),
          ...(editedFieldsData[formId] || {})
        };
      });
      
      // Prepare project data for the download request
      const projectData = prefillData?.project ? {
        name: prefillData.project.pi_short_description || prefillData.project.name || 'Unknown Project',
        id: prefillData.project.project_id || prefillData.project.id || 'unknown',
        manager: prefillData.project.pi_managing_design_team_unit || prefillData.project.manager || 'Unknown Manager',
        location: prefillData.project.pi_park_name || prefillData.project.location || 'Unknown Location'
      } : undefined;

      console.log('📄 PrefillPreviewPage: Initiating download with data:', {
        formIds: selectedFormIds,
        projectData,
        fieldsDataKeys: Object.keys(mergedFormFieldsData),
        editedFieldsCount: Object.keys(editedFieldsData).length
      });

      // Use the new download API with merged data
      const result = await downloadTemplate({
        formIds: selectedFormIds,
        formFieldsData: mergedFormFieldsData,
        projectData
      });
      
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

  // Render form fields with enhanced information showing source column and data type
  const renderFormFields = (formId: string) => {
    // Check if this form is currently being loaded
    if (loadingFormIds.has(formId)) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading form fields...</p>
        </div>
      );
    }

    // Check if form data hasn't been loaded yet
    if (!loadedFormIds.has(formId)) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Click this form to load its field data</p>
        </div>
      );
    }

    const fields = formFieldsData[formId] || {};
    const mapping = formMappings[formId];
    
    // Check if we have new API structure with detailed field info
    const hasDetailedMapping = mapping && Array.isArray(mapping.fields);
    
    if (hasDetailedMapping) {
      // New API structure - show detailed field information
      const fieldEntries = mapping.fields as FormFieldEntry[];
      
      if (fieldEntries.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <p>No field mappings available for this form</p>
          </div>
        );
      }

      // Sort by display_order if available, otherwise keep original order
      const sortedFields = [...fieldEntries].sort((a, b) => {
        const orderA = a.display_order ?? 999;
        const orderB = b.display_order ?? 999;
        return orderA - orderB;
      });

      // Show first 10 fields, then show count if more
      const displayFields = sortedFields.slice(0, 10);
      
      return (
        <div className="space-y-3">
          {displayFields.map((field, index) => {
            const currentValue = editedFieldsData[formId]?.[field.label] ?? field.value;
            const isBlank = isBlankValue(field.value, field.data_type);
            
            return (
              <div key={field.map_id || `field-${index}`} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-sm font-medium text-gray-900">{field.label}</Label>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {field.data_type}
                      </Badge>
                      {isBlank && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 flex items-center gap-1">
                          <Edit3 className="h-3 w-3" />
                          Editable
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Source: <code className="bg-gray-100 px-1 rounded">{field.source_col}</code>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Map ID: {field.map_id}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {field.data_type === 'boolean' ? (
                      <div className="flex items-center">
                        <Checkbox 
                          checked={Boolean(currentValue)} 
                          disabled={!isBlank}
                          onCheckedChange={(checked) => {
                            if (isBlank) {
                              handleFieldChange(formId, field.label, checked);
                            }
                          }}
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-600">{currentValue ? 'Yes' : 'No'}</span>
                      </div>
                    ) : isBlank ? (
                      <Input
                        type={field.data_type === 'number' ? 'number' : field.data_type === 'date' ? 'date' : 'text'}
                        value={currentValue === 0 && field.data_type === 'number' ? '' : String(currentValue || '')}
                        onChange={(e) => {
                          let newValue: string | number = e.target.value;
                          if (field.data_type === 'number') {
                            newValue = e.target.value === '' ? 0 : Number(e.target.value);
                          }
                          handleFieldChange(formId, field.label, newValue);
                        }}
                        placeholder={`Enter ${field.label}`}
                        className="w-full"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 break-words font-mono bg-gray-50 p-2 rounded">
                        {field.data_type === 'date' && field.value 
                          ? new Date(String(field.value)).toLocaleDateString()
                          : String(field.value)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {fieldEntries.length > 10 && (
            <div className="text-center py-2 text-xs text-gray-500">
              Showing 10 of {fieldEntries.length} fields
            </div>
          )}
        </div>
      );
    } else {
      // Legacy structure - simple key-value display
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
          {displayFields.map(([key, value], index) => {
            const currentValue = editedFieldsData[formId]?.[key] ?? value;
            // Infer data type from value for legacy structure
            const inferredType = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text';
            const isBlank = isBlankValue(value, inferredType);
            
            return (
              <div key={key || `field-${index}`} className="flex items-start justify-between py-2 border-b border-gray-200">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-gray-700">{key}</Label>
                    {isBlank && (
                      <Badge variant="secondary" className="text-xs px-1 py-0 flex items-center gap-1">
                        <Edit3 className="h-3 w-3" />
                        Editable
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {typeof value === 'boolean' ? (
                    <div className="flex items-center">
                      <Checkbox 
                        checked={Boolean(currentValue)} 
                        disabled={!isBlank}
                        onCheckedChange={(checked) => {
                          if (isBlank) {
                            handleFieldChange(formId, key, checked);
                          }
                        }}
                        className="mr-2" 
                      />
                      <span className="text-sm text-gray-600">{currentValue ? 'Yes' : 'No'}</span>
                    </div>
                  ) : isBlank ? (
                    <Input
                      type={typeof value === 'number' ? 'number' : 'text'}
                      value={currentValue === 0 && typeof value === 'number' ? '' : String(currentValue || '')}
                      onChange={(e) => {
                        let newValue: string | number = e.target.value;
                        if (typeof value === 'number') {
                          newValue = e.target.value === '' ? 0 : Number(e.target.value);
                        }
                        handleFieldChange(formId, key, newValue);
                      }}
                      placeholder={`Enter ${key}`}
                      className="w-full"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 break-words">
                      {String(value)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {entries.length > 10 && (
            <div className="text-center py-2 text-xs text-gray-500">
              Showing 10 of {entries.length} fields
            </div>
          )}
        </div>
      );
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
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 bg-gray-50 min-h-full"> {/* mobile-only: reduced padding */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"> {/* mobile-only: stack on mobile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4 w-full lg:w-auto"> {/* mobile-only: stack button and text */}
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToFormPicker}
            className="flex items-center gap-2 min-h-[44px] lg:min-h-0 text-sm lg:text-base" /* mobile-only: touch target */
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl lg:text-2xl text-gray-900">Prefill Preview</h1> {/* mobile-only: smaller heading */}
            <p className="text-sm lg:text-base text-gray-600">Review the values that will be written into the PDF fields</p> {/* mobile-only: smaller text */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"> {/* mobile-only: reduced gap */}
        {/* Selected Forms Section */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 lg:pb-6"> {/* mobile-only: reduced padding */}
            <CardTitle className="flex items-center gap-2 text-green-600 text-base lg:text-lg"> {/* mobile-only: smaller title */}
              <FileText className="h-4 w-4 lg:h-5 lg:w-5" />
              1. Selected Forms
            </CardTitle>
            <p className="text-xs lg:text-sm text-gray-600">Forms that will be generated with prefilled data</p> {/* mobile-only: smaller text */}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 lg:space-y-3"> {/* mobile-only: adjusted spacing */}
              {selectedFormItems.length > 0 ? (
                selectedFormItems.map((form, index) => (
                  <button
                    key={form.form_id || `form-${index}`}
                    onClick={() => handleFormClick(form.form_id)}
                    disabled={loadingFormIds.has(form.form_id)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      form.form_id === activeFormId
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    } ${loadingFormIds.has(form.form_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{form.form_title}</div>
                        <div className="text-xs text-gray-500">{form.form_id}</div>
                      </div>
                      {loadingFormIds.has(form.form_id) && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        </div>
                      )}
                      {form.form_id === activeFormId && !loadingFormIds.has(form.form_id) && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
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
              
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto"> {/* mobile-only: stack on mobile */}
                {activeFormId && (
                  <Button 
                    onClick={() => handleDownloadSingleForm(activeFormId)}
                    disabled={isDownloading}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2 min-h-[44px] lg:min-h-0 text-sm lg:text-base w-full sm:w-auto" /* mobile-only: touch target */
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download This Form'}</span>
                    <span className="sm:hidden">{isDownloading ? 'Downloading...' : 'This Form'}</span> {/* mobile-only: shorter text */}
                  </Button>
                )}
                <Button 
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading || !selectedFormItems.length}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 min-h-[44px] lg:min-h-0 text-sm lg:text-base w-full sm:w-auto" /* mobile-only: touch target */
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Downloading...' : 'Download All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!activeFormId ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Click on a form to view its fields</p>
              </div>
            ) : loadingFormIds.has(activeFormId) ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading form data...</p>
              </div>
            ) : (
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
                  
                  {/* Field count - handle both new and legacy API structures */}
                  {(() => {
                    const mapping = formMappings[activeFormId];
                    let totalFields = 0;
                    
                    if (mapping && Array.isArray(mapping.fields)) {
                      totalFields = mapping.fields.length;
                    } else {
                      totalFields = Object.keys(formFieldsData[activeFormId] || {}).length;
                    }
                    
                    return totalFields > 10 ? (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                          {totalFields} fields total
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

          </CardContent>
        </Card>


      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 lg:pt-6 border-t bg-white p-4 lg:p-6 rounded-lg"> {/* mobile-only: reduced padding */}
        <Button variant="outline" onClick={navigateToFormPicker} className="min-h-[44px] lg:min-h-0 text-sm lg:text-base"> {/* mobile-only: touch target */}
          ← Back
        </Button>
      </div>
    </div>
  );
}