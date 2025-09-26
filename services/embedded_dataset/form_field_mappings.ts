// Embedded dataset for form field mappings - fallback when HTTP GET fails
// This serves as a backup data source when /mock/form_field_mappings.json is unavailable

export interface FormFieldMapping {
  pdf: string;
  fields: Record<string, any>;
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
      fields: {
        NoticeDate: '2025-09-10',
        ContractorName: projectData.contractor.name,
        ContractorAddress: projectData.contractor.address,
        ContractNo: projectData.contractNumber,
        DesignAndSupervision: projectData.designType,
        Funding: 'City',
        MeetingDate: '2025-09-18',
        MeetingTime: '10:00 AM',
        MeetingPlace: 'Olmsted Center, Conf Rm A',
      },
    },
    'FORM-002': {
      pdf: 'FORM-002_STD_PRECON_INFO.pdf',
      fields: {
        ContractNo: projectData.contractNumber,
        AwardDate: projectData.awardDate,
        Amount: projectData.bidPrice,
        CCD: projectData.timeAllowedCCD,
        DesignPM: projectData.designProjectManager.name,
        CD: projectData.constructionDirector.name,
        RE: projectData.residentEngineer.name,
        RE_Email: projectData.residentEngineer.email,
      },
    },
    'FORM-003': {
      pdf: 'FORM-003_PRECON_CHECKLIST.pdf',
      fields: {
        ContractNo: projectData.contractNumber,
        TimeAllowedCCD: projectData.timeAllowedCCD,
        ConstructionSupervision: projectData.designType,
        Design: projectData.designProjectManager.name,
        AwardDate: projectData.awardDate,
        BidPrice: projectData.bidPrice,
        Req_ProgressSchedule_Y: true,
        Insurance_CGL_Y: true,
        DoT_MPT_Y: false,
      },
    },
    'FORM-005': {
      pdf: 'FORM-005_PRECON_MINUTES.pdf',
      fields: {
        Date: '2025-09-11',
        ContractNo: projectData.contractNumber,
        Contractor: projectData.contractor.name,
        Highlights: 'Key points, permits, submittals…',
      },
    },
    'FORM-006': {
      pdf: 'FORM-006_APPROVAL_PRIOR_TO_REGISTRATION.pdf',
      fields: {
        Date: '2025-09-11',
        ContractorName: projectData.contractor.name,
        ContractNo: projectData.contractNumber,
        ContractTitle: projectData.projectName,
        OrderToWorkDate: '2025-09-18',
      },
    },
    'FORM-06A': {
      pdf: 'FORM-06A_REQUEST_TO_DOT_DSL.pdf',
      fields: {
        DPR_ContractNo: projectData.contractNumber,
        Borough: projectData.borough,
        Design: projectData.designType,
        Superv: 'Construction Director',
        BeginWorkDate: '2025-09-18',
        ContactPhone: '718-760-0000',
        Attn: 'Chief of Operations',
      },
    },
    'FORM-06B': {
      pdf: 'FORM-06B_INSPECTION_PARK_LIGHTING_CHECKLIST.pdf',
      fields: {
        ContractNo: projectData.contractNumber,
        Borough: projectData.borough,
        Contractor: projectData.contractor.name,
        ResidentEngineer: projectData.residentEngineer.name,
        InspectionDate: '2025-09-19',
        Determination: 'Operational',
        DefectList: '',
      },
    },
    'FORM-007': {
      pdf: 'FORM-007_FAILURE_TO_START.pdf',
      fields: {
        ContractorName: projectData.contractor.name,
        ContractNo: projectData.contractNumber,
        Design: projectData.designType,
        Superv: 'Construction Director',
        OrderedToBeginDate: '2025-09-01',
        AsOfDate: '2025-09-11',
        DeadlineToCommence: '2025-09-15',
      },
    },
    'FORM-008': {
      pdf: 'FORM-008_MAINTENANCE_OF_PARK_PROPERTY_MEMO.pdf',
      fields: {
        To: 'Borough Commissioner',
        From: 'Construction Director',
        Date: '2025-09-11',
        ContractNo: projectData.contractNumber,
        ReconstructionOf: projectData.projectName,
        Status_UnderConstruction: true,
        Status_Partial: false,
        Status_Returned: false,
        Status_PartialRelease: false,
        Comments: '',
        ContactName: projectData.residentEngineer.name,
        ContactPhone: projectData.contractor.contact.phone,
      },
    },
    'FORM-009': {
      pdf: 'FORM-009_HOMEOWNER_NOTIFICATION.pdf',
      fields: {
        Date: '2025-09-11',
        ContractNo: projectData.contractNumber,
        Homeowner: 'John/Jane Doe',
        Address: '123 Adjacent St, Queens, NY',
      },
    },
    'FORM-010': {
      pdf: 'FORM-010_NEW_DOT_STREET_LIGHTING.pdf',
      fields: {
        Date: '2025-09-11',
        DPR_ContractNo: projectData.contractNumber,
        Design: projectData.designType,
        Superv: 'Construction Director',
        BeginWorkDate: '2025-09-20',
        Attn: 'DOT Division of Street Lighting',
        ContactPhone: '718-760-0000',
      },
    },
    'FORM-011': {
      pdf: 'FORM-011_WEEKLY_PROGRESS_REPORT.pdf',
      fields: {
        ReportNo: 1,
        Date: '2025-09-12',
        WeekEnding: '2025-09-12',
        ContractNo: projectData.contractNumber,
        Contractor: projectData.contractor.name,
        ProjectDescription: projectData.projectName,
        Remarks: '',
      },
    },
    'FORM-012': {
      pdf: 'FORM-012_CONSULTANT_FIELD_INSPECTION_REPORT.pdf',
      fields: {
        ReportNo: 1,
        DateOfVisit: '2025-09-13',
        ContractNo: projectData.contractNumber,
        ContractingFirm: projectData.contractor.name,
        SupervisingConsultant: 'ACME Consulting',
        ProjectResident: projectData.residentEngineer.name,
        ResidentAtSite_Y: true,
        WorkInProgress_Y: true,
        ProjectOnSchedule_Y: true,
        PercentComplete: 42,
        Remarks: 'All logs current; minor staffing lag noted.',
      },
    },
    'FORM-013SC': {
      pdf: 'FORM-013_SC_SUBSTANTIAL_COMPLETION_NOTICE.pdf',
      fields: {
        Date: '2025-09-14',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        InspectionDate: '2025-09-25',
        InspectionTime: '09:00 AM',
        InspectionPlace: 'Site – North Gate',
        Intention_NoPunchList_Y: true,
      },
    },
    'FORM-013SCU': {
      pdf: 'FORM-013_SCU_SUBSTANTIAL_COMPLETION_USE_NOTICE.pdf',
      fields: {
        Date: '2025-09-14',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        InspectionDate: '2025-09-26',
        InspectionTime: '10:30 AM',
        InspectionPlace: 'Site – South Pavilion',
        Intention_MinimalFinalPunch_Y: true,
      },
    },
    'FORM-013W': {
      pdf: 'FORM-013_W_WALK_THROUGH_NOTICE.pdf',
      fields: {
        Date: '2025-09-14',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        WalkThroughDate: '2025-09-20',
        WalkThroughTime: '01:30 PM',
        WalkThroughPlace: 'Entire site',
      },
    },
    'FORM-014W': {
      pdf: 'FORM-014_W_WALK_THROUGH_REPORT.pdf',
      fields: {
        Date: '2025-09-21',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        AreaOrWholeProject: 'Entire project',
        Attendees: 'RE, Contractor PM, Inspector',
        OutstandingItemsAttachment_Y: true,
        Directive_CompleteBeforeSCUse_Y: true,
      },
    },
    'FORM-014SC': {
      pdf: 'FORM-014_SC_REPORT_CERTIFICATE.pdf',
      fields: {
        Date: '2025-09-27',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        SC_HeldDate: '2025-09-27',
        Option1_AllWorkAccepted_Y: false,
        Option2_FinalPunchListAttached_Y: true,
        PunchListDeadline: '2025-10-15',
        GuaranteeExpiry: '2026-09-27',
        MaintainInsurance_Y: true,
      },
    },
    'FORM-014SCU': {
      pdf: 'FORM-014_SCU_REPORT_CERTIFICATE.pdf',
      fields: {
        Date: '2025-09-27',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        SCU_HeldDate: '2025-09-27',
        FinalPunchListAttached_Y: true,
        PunchListDeadline: '2025-10-12',
        InsuranceRequiredUntilPunch_Y: true,
        InsuranceComment: 'Insurance shall be maintained until all punch list work is fully completed.',
        GuaranteeExpiry: '2026-09-27',
      },
    },
    'FORM-015': {
      pdf: 'FORM-015_PL_INSPECTION_NOTICE.pdf',
      fields: {
        Date: '2025-09-28',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        PL_InspectionDate: '2025-10-05',
        PL_InspectionTime: '08:30 AM',
        PL_InspectionPlace: 'Job Trailer',
      },
    },
    'FORM-016': {
      pdf: 'FORM-016_PL_INSPECTION_REPORT.pdf',
      fields: {
        Date: '2025-10-05',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        SC_UseInspectionDate: '2025-09-12',
        PL_InspectionHeldDate: '2025-10-05',
        Attendees: 'RE, Contractor PM, DPR Inspector',
        Option1_AllPLCompleted_Y: false,
        Option2_RemainingPLAttached_Y: true,
        RemainingPL_Deadline: '2025-10-20',
        MaintainInsurance_Y: true,
      },
    },
    'FORM-017G': {
      pdf: 'FORM-017_GUARANTEE_INSPECTION_NOTICE.pdf',
      fields: {
        Date: '2025-11-01',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        GI_Date: '2025-11-15',
        GI_Time: '09:00 AM',
        GI_Place: 'Site – Main Gate',
      },
    },
    // Batch 3
    'FORM-017GPL': {
      pdf: 'FORM-017_GPL_INSPECTION_NOTICE_FOR_GUARANTEE_PUNCH_LIST.pdf',
      fields: {
        Date: '2025-11-10',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        GPL_InspectionDate: '2025-11-22',
        GPL_InspectionTime: '10:00 AM',
        GPL_InspectionPlace: 'Site – North Gate',
      },
    },
    'FORM-018G': {
      pdf: 'FORM-018_GUARANTEE_INSPECTION_REPORT.pdf',
      fields: {
        Date: '2025-11-22',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        GI_HeldDate: '2025-11-22',
        Option1_AllWorkMeetsGuarantee_Y: false,
        Option2_GPL_Established_Y: true,
        GuaranteeMonies: 100000,
      },
    },
    'FORM-018GPL': {
      pdf: 'FORM-018_GPL_GUARANTEE_PUNCH_LIST_INSPECTION_REPORT.pdf',
      fields: {
        Date: '2025-12-05',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        GPL_InspectionHeldDate: '2025-12-05',
        Option1_AllGPLCompleted_Y: true,
        Option2_RemainingGPLAttached_Y: false,
        GuaranteeMonies: 100000,
      },
    },
    'FORM-019': {
      pdf: 'FORM-019_FAILURE_TO_COMPLETE_FINAL_PUNCH_LIST.pdf',
      fields: {
        Date: '2025-12-12',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        Superv: 'Construction Borough Director',
        ExtendedDeadline: '2026-01-05',
        MeetingDateIfNeeded: '2026-01-07',
      },
    },
    'FORM-019A': {
      pdf: 'FORM-019A_ARTICLE_54_64_NOTIFICATION_OF_FAILURE_TO_COMPLETE_FINAL_PUNCH_LIST.pdf',
      fields: {
        Date: '2026-01-10',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ReconstructionOf: projectData.projectName,
        Design: projectData.designType,
        ACCO_Name: 'Agency Chief Contracting Officer',
        Article54_Invoked_Y: true,
        Article64_Termination_Y: true,
      },
    },
    'FORM-020': {
      pdf: 'FORM-020_CONTRACTOR_CHANGE_ORDER_CHECKLIST.pdf',
      fields: {
        Labor_TradeClassifications: 'Foreman – Plumber; 1010 Laborer',
        WageRate_Source: 'NYC Comptroller',
        RSMeans_Reference: 'Yes',
        Equipment_RentedQuotes_Attached: true,
        Equipment_OwnedRate_Method: '75% AED/BlueBook',
        Overtime_Premium_NoMarkup: true,
      },
    },
    'FORM-021': {
      pdf: 'FORM-021_CO_CHECKLIST_FOR_RE.pdf',
      fields: {
        Has_DPR_Directive: true,
        Has_Contractor_Proposal: true,
        Has_Designer_Memo: true,
        Has_RE_Analysis: true,
        Has_RSMeans: true,
        Has_AED_GreenBook: true,
      },
    },
    'FORM-022A': {
      pdf: 'FORM-022A_CHANGE_ORDER_FORM_1.pdf',
      fields: {
        Contractor_Agrees_BasisOfPayment: 'Time & Material',
        Authorized_Cost: 250000,
        Forced_Change_Order_Y: false,
      },
    },
    'FORM-022B': {
      pdf: 'FORM-022B_CHANGE_ORDER_FORM_2.pdf',
      fields: {
        ReasonForChange: 'Field Change',
        AdminCode_6129_DueDiligence_Y: true,
        Design_Error_Over_3000_Notified_Y: false,
        Justification_Summary: 'Nature/origin, scope, alternatives, attachments listed.',
      },
    },
    'FORM-022CO': {
      pdf: 'FORM-022CO_CHANGE_ORDER_INFORMATION_SHEET.pdf',
      fields: {
        CCDs: projectData.timeAllowedCCD,
        PercentComplete: 50,
        ScheduledCompletionDate: '2026-05-15',
        FundingSource: 'City',
        ChangeOrderType: 'EXTRA',
        Reason: 'FIELD CONDITION',
        Requires_CORP_Review_Over_15000_Y: true,
      },
    },
    // Batch 4
    'FORM-022OU': {
      pdf: 'FORM-022OU_OVERRUN_UNDERRUN.pdf',
      fields: {
        ContractNo: projectData.contractNumber,
        OverrunUnderrunNo: 'OU-001',
        PercentComplete: 65,
        ContactPerson: projectData.residentEngineer.name,
      },
    },
    'FORM-024': {
      pdf: 'FORM-024_LAW_DEPT_CO_REVIEW.pdf',
      fields: {
        ContractNo: projectData.contractNumber,
        ChangeOrderNo: 'CO-123',
        Amount: 50000,
        Reason: 'Design Omission',
        Recommendation: 'No Recoupment',
      },
    },
    'FORM-028': {
      pdf: 'FORM-028_WAGE_RATE_BREAKDOWN.pdf',
      fields: {
        Contractor: projectData.contractor.name,
        ContractNo: projectData.contractNumber,
        Classification: 'Plumber',
        BaseRate: 45,
        WelfareFund: 10,
      },
    },
    'FORM-029': {
      pdf: 'FORM-029_CONTRACTOR_FINAL_COST_REQUEST.pdf',
      fields: {
        Date: '2025-12-31',
        ContractNo: projectData.contractNumber,
        ComptrollerNo: 'C-000123',
        ItemsOutstanding: 'Submit T&M tickets and invoices',
      },
    },
    'FORM-030': {
      pdf: 'FORM-030_PENCIL_COPY_CHECKLIST.pdf',
      fields: {
        ContractNo: projectData.contractNumber,
        PaymentNo: 5,
        ContractorRep: 'Jane Smith',
        InsuranceCertificateOnFile: true,
        PrevailingWageAckOnFile: true,
      },
    },
    // Excel placeholders (template-only in mock mode)
    'FORM-023': { pdf: 'FORM-023_CHANGE_ORDER_LOG.xlsx', fields: {} },
    'FORM-025': { pdf: 'FORM-025_TM_DAILY_REPORT.xlsx', fields: {} },
    'FORM-026': { pdf: 'FORM-026_TM_MONTHLY_LABOR_EQUIP.xlsx', fields: {} },
    'FORM-027': { pdf: 'FORM-027_TM_MONTHLY_MATERIAL_COSTS.xlsx', fields: {} },
  };
}

// Default export for backward compatibility
const defaultMappings = generateFormFieldMappings();
export default defaultMappings;