import { createContext, useContext, useState, ReactNode } from 'react';

interface FormGeneratorState {
  selectedProject: any | null;
  selectedForms: string[];
  formFieldsData: {[formId: string]: any};
  currentStep: 'project-search' | 'form-picker' | 'prefill-preview' | null;
}

interface FormGeneratorContextType {
  state: FormGeneratorState;
  setSelectedProject: (project: any) => void;
  setSelectedForms: (forms: string[]) => void;
  setFormFieldsData: (data: {[formId: string]: any}) => void;
  setCurrentStep: (step: FormGeneratorState['currentStep']) => void;
  clearAllData: () => void;
  hasUnsavedData: () => boolean;
}

const FormGeneratorContext = createContext<FormGeneratorContextType | undefined>(undefined);

const initialState: FormGeneratorState = {
  selectedProject: null,
  selectedForms: [],
  formFieldsData: {},
  currentStep: null
};

export function FormGeneratorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormGeneratorState>(initialState);

  const setSelectedProject = (project: any) => {
    setState(prev => ({ ...prev, selectedProject: project }));
  };

  const setSelectedForms = (forms: string[]) => {
    setState(prev => ({ ...prev, selectedForms: forms }));
  };

  const setFormFieldsData = (data: {[formId: string]: any}) => {
    setState(prev => ({ ...prev, formFieldsData: data }));
  };

  const setCurrentStep = (step: FormGeneratorState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const clearAllData = () => {
    console.log('🧹 FormGenerator: Clearing all data', state);
    setState(initialState);
    // Clear URL parameters as well
    const url = new URL(window.location.href);
    url.search = ''; // Clear all query parameters
    window.history.replaceState({}, '', url.toString());
    console.log('🧹 FormGenerator: All data cleared');
  };

  const hasUnsavedData = () => {
    const hasData = !!(
      state.selectedProject || 
      state.selectedForms.length > 0 || 
      Object.keys(state.formFieldsData).length > 0
    );
    console.log('🔍 FormGenerator: hasUnsavedData check', {
      selectedProject: !!state.selectedProject,
      selectedFormsCount: state.selectedForms.length,
      formFieldsDataCount: Object.keys(state.formFieldsData).length,
      hasData
    });
    return hasData;
  };

  const contextValue = {
    state,
    setSelectedProject,
    setSelectedForms,
    setFormFieldsData,
    setCurrentStep,
    clearAllData,
    hasUnsavedData
  };

  return (
    <FormGeneratorContext.Provider value={contextValue}>
      {children}
    </FormGeneratorContext.Provider>
  );
}

export function useFormGenerator() {
  const context = useContext(FormGeneratorContext);
  if (context === undefined) {
    throw new Error('useFormGenerator must be used within a FormGeneratorProvider');
  }
  return context;
}