// Embedded dataset for form field mappings - fallback when HTTP GET fails
// This serves as a backup data source when /mock/form_field_mappings.json is unavailable

export interface FormFieldEntry {
  map_id: string;
  label: string;
  value: string | number | boolean;
  source_col: string;
  data_type: 'text' | 'number' | 'boolean' | 'date';
  display_order: number;
}

export interface FormFieldMapping {
  pdf: string;
  fields: FormFieldEntry[];
}

export interface FormFieldMappings {
  [formId: string]: FormFieldMapping;
}

// Project data interface that can be used for mappings
export interface ProjectData {
  name: string;
  id?: string;
  description?: string;
  location: string;
  manager: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  progress?: number;
  contractor?: {
    name: string;
    address?: string;
    contact?: {
      phone?: string;
    };
  };
}

// Generate default project data if none provided
function getDefaultProjectData(): any {
  return {
    contractor: {
      name: 'ACME Construction Corp',
      address: '123 Main Street, Queens, NY 11375',
      contact: {
        phone: '718-555-1234'
      }
    },
    contractNumber: 'Q-2025-XYZ-001',
    designType: 'Design-Build',
    awardDate: '2024-08-15',
    bidPrice: 5000000,
    timeAllowedCCD: 365,
    designProjectManager: {
      name: 'Jane Designer, PE'
    },
    constructionDirector: {
      name: 'John Director'
    },
    residentEngineer: {
      name: 'Alex Rodriguez, PE',
      email: 'alex.rodriguez@parks.nyc.gov'
    },
    projectName: 'XYZ Park Reconstruction',
    borough: 'Queens'
  };
}

// Transform user project data to internal format
function transformProjectData(project?: ProjectData): any {
  const defaults = getDefaultProjectData();
  
  if (!project) return defaults;
  
  return {
    contractor: {
      name: project.contractor?.name || 'ABC Construction Inc.',
      address: project.contractor?.address || project.location || 'New York, NY',
      contact: {
        phone: project.contractor?.contact?.phone || '718-555-1234'
      }
    },
    contractNumber: `Q-${new Date().getFullYear()}-${project.id || 'XYZ'}-001`,
    designType: 'Design-Build',
    awardDate: project.startDate || '2024-08-15',
    bidPrice: project.budget || 5000000,
    timeAllowedCCD: 365,
    designProjectManager: {
      name: 'Jane Designer, PE'
    },
    constructionDirector: {
      name: 'John Director'
    },
    residentEngineer: {
      name: project.manager || 'Alex Rodriguez, PE',
      email: `${(project.manager || 'alex.rodriguez').toLowerCase().replace(' ', '.')}@parks.nyc.gov`
    },
    projectName: project.name || 'Sample Project',
    borough: project.location?.split(',')[0] || 'Queens'
  };
}

// Generate form field mappings based on project data
export function generateFormFieldMappings(project?: ProjectData): FormFieldMappings {
  const projectData = transformProjectData(project);
  
  return {
    // Existing & batches 1–2
    'FORM-001': {
      pdf: 'FORM-001_PRECON_NOTICE.pdf',
      fields: [
        { map_id: '1', label: 'notice_date', value: '2025-09-10', source_col: 'pi_notice_date', data_type: 'date', display_order: 1 },
        { map_id: '2', label: 'contractor_name', value: projectData.contractor.name, source_col: 'pi_contractor_name', data_type: 'text', display_order: 2 },
        { map_id: '3', label: 'contractor_address', value: projectData.contractor.address, source_col: 'pi_contractor_address', data_type: 'text', display_order: 3 },
        { map_id: '4', label: 'contract_no', value: projectData.contractNumber, source_col: 'pi_park_contract_no', data_type: 'text', display_order: 4 },
        { map_id: '5', label: 'design_supervision', value: projectData.designType, source_col: 'pi_design_supervision', data_type: 'text', display_order: 5 },
        { map_id: '6', label: 'funding', value: 'City', source_col: 'pi_funding_source', data_type: 'text', display_order: 6 },
        { map_id: '7', label: 'meeting_date', value: '2025-09-18', source_col: 'pi_meeting_date', data_type: 'date', display_order: 7 },
        { map_id: '8', label: 'meeting_time', value: '10:00 AM', source_col: 'pi_meeting_time', data_type: 'text', display_order: 8 },
        { map_id: '9', label: 'meeting_place', value: 'Olmsted Center, Conf Rm A', source_col: 'pi_meeting_place', data_type: 'text', display_order: 9 }
      ],
    },
    'FORM-002': {
      pdf: 'FORM-002_STD_PRECON_INFO.pdf',
      fields: [
        { map_id: '10', label: 'contract_no', value: projectData.contractNumber, source_col: 'pi_park_contract_no', data_type: 'text', display_order: 1 },
        { map_id: '11', label: 'award_date', value: projectData.awardDate, source_col: 'pi_award_letter_date', data_type: 'date', display_order: 2 },
        { map_id: '12', label: 'award_amount', value: projectData.bidPrice, source_col: 'pi_award_amount', data_type: 'number', display_order: 3 },
        { map_id: '13', label: 'ccd', value: projectData.timeAllowedCCD, source_col: 'pi_ccd', data_type: 'number', display_order: 4 },
        { map_id: '14', label: 'design_pm', value: projectData.designProjectManager.name, source_col: 'pi_design_pm', data_type: 'text', display_order: 5 },
        { map_id: '15', label: 'construction_director', value: projectData.constructionDirector.name, source_col: 'pi_construction_director', data_type: 'text', display_order: 6 },
        { map_id: '16', label: 'resident_engineer', value: projectData.residentEngineer.name, source_col: 'pi_resident_engineer', data_type: 'text', display_order: 7 },
        { map_id: '17', label: 'resident_engineer_email', value: projectData.residentEngineer.email, source_col: 'pi_resident_engineer_email', data_type: 'text', display_order: 8 }
      ],
    },
    'FORM-003': {
      pdf: 'FORM-003_PRECON_CHECKLIST.pdf',
      fields: [
        { map_id: '18', label: 'contract_no', value: projectData.contractNumber, source_col: 'pi_park_contract_no', data_type: 'text', display_order: 1 },
        { map_id: '19', label: 'time_allowed_ccd', value: projectData.timeAllowedCCD, source_col: 'pi_ccd', data_type: 'number', display_order: 2 },
        { map_id: '20', label: 'construction_supervision', value: projectData.designType, source_col: 'pi_construction_supervision', data_type: 'text', display_order: 3 },
        { map_id: '21', label: 'design_pm', value: projectData.designProjectManager.name, source_col: 'pi_design_pm', data_type: 'text', display_order: 4 },
        { map_id: '22', label: 'award_date', value: projectData.awardDate, source_col: 'pi_award_letter_date', data_type: 'date', display_order: 5 },
        { map_id: '23', label: 'bid_price', value: projectData.bidPrice, source_col: 'pi_award_amount', data_type: 'number', display_order: 6 },
        { map_id: '24', label: 'req_progress_schedule', value: true, source_col: 'pi_req_progress_schedule', data_type: 'boolean', display_order: 7 },
        { map_id: '25', label: 'insurance_cgl', value: true, source_col: 'pi_insurance_cgl', data_type: 'boolean', display_order: 8 },
        { map_id: '26', label: 'dot_mpt', value: false, source_col: 'pi_dot_mpt', data_type: 'boolean', display_order: 9 }
      ],
    },
    'FORM-005': {
      pdf: 'FORM-005_PRECON_MINUTES.pdf',
      fields: [
        { map_id: '27', label: 'date', value: '2025-09-11', source_col: 'pi_date', data_type: 'date', display_order: 1 },
        { map_id: '28', label: 'contract_no', value: projectData.contractNumber, source_col: 'pi_park_contract_no', data_type: 'text', display_order: 2 },
        { map_id: '29', label: 'contractor', value: projectData.contractor.name, source_col: 'pi_contractor_name', data_type: 'text', display_order: 3 },
        { map_id: '30', label: 'highlights', value: 'Key points, permits, submittals…', source_col: 'pi_highlights', data_type: 'text', display_order: 4 }
      ],
    },
    // Additional forms can be added here with new API structure
    // For demo purposes, keeping this simplified
  };
}

// Default export for backward compatibility
const defaultMappings = generateFormFieldMappings();
export default defaultMappings;