import type { User, UsersResponse } from '../../features/users/types';

export function generateUsers(): UsersResponse {
  const users: User[] = [
    {
      id: "user-001",
      name: "John Doe",
      email: "john.doe@parks.nyc.gov",
      role: "Admin",
      status: "Active",
      permissions: {
        form_generate: true,
        form_modify_templates: true,
        form_upload_templates: true,
        form_batch_process: true,
        user_management: true,
        audit_logs: true,
        settings: true
      },
      lastLogin: "2025-01-15T14:30:22Z",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2025-01-15T14:30:22Z",
      department: "IT Administration",
      phone: "+1 (212) 555-0101"
    },
    {
      id: "user-002",
      name: "Jane Smith",
      email: "jane.smith@parks.nyc.gov",
      role: "Editor",
      status: "Active",
      permissions: {
        form_generate: true,
        form_modify_templates: true,
        form_upload_templates: false,
        form_batch_process: true,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-15T13:15:45Z",
      createdAt: "2024-02-20T10:30:00Z",
      updatedAt: "2025-01-15T13:15:45Z",
      department: "Project Management",
      phone: "+1 (212) 555-0102"
    },
    {
      id: "user-003",
      name: "Mike Johnson",
      email: "mike.johnson@parks.nyc.gov",
      role: "Viewer",
      status: "Inactive",
      permissions: {
        form_generate: false,
        form_modify_templates: false,
        form_upload_templates: false,
        form_batch_process: false,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-10T16:45:33Z",
      createdAt: "2024-03-10T11:15:00Z",
      updatedAt: "2025-01-12T09:20:15Z",
      department: "Construction",
      phone: "+1 (212) 555-0103"
    },
    {
      id: "user-004",
      name: "Sarah Wilson",
      email: "sarah.wilson@parks.nyc.gov",
      role: "Editor",
      status: "Active",
      permissions: {
        form_generate: true,
        form_modify_templates: true,
        form_upload_templates: false,
        form_batch_process: true,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-14T16:12:07Z",
      createdAt: "2024-04-05T14:20:00Z",
      updatedAt: "2025-01-14T16:12:07Z",
      department: "Engineering",
      phone: "+1 (212) 555-0104"
    },
    {
      id: "user-005",
      name: "Robert Chen",
      email: "robert.chen@parks.nyc.gov",
      role: "Admin",
      status: "Active",
      permissions: {
        form_generate: true,
        form_modify_templates: true,
        form_upload_templates: true,
        form_batch_process: true,
        user_management: true,
        audit_logs: true,
        settings: true
      },
      lastLogin: "2025-01-14T15:30:22Z",
      createdAt: "2024-01-20T08:45:00Z",
      updatedAt: "2025-01-14T15:30:22Z",
      department: "IT Administration",
      phone: "+1 (212) 555-0105"
    },
    {
      id: "user-006",
      name: "Lisa Rodriguez",
      email: "lisa.rodriguez@parks.nyc.gov",
      role: "Editor",
      status: "Active",
      permissions: {
        form_generate: true,
        form_modify_templates: true,
        form_upload_templates: false,
        form_batch_process: true,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-14T14:18:41Z",
      createdAt: "2024-05-15T13:30:00Z",
      updatedAt: "2025-01-14T14:18:41Z",
      department: "Operations",
      phone: "+1 (212) 555-0106"
    },
    {
      id: "user-007",
      name: "David Park",
      email: "david.park@parks.nyc.gov",
      role: "Viewer",
      status: "Active",
      permissions: {
        form_generate: false,
        form_modify_templates: false,
        form_upload_templates: false,
        form_batch_process: false,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-14T12:45:55Z",
      createdAt: "2024-06-01T09:15:00Z",
      updatedAt: "2025-01-14T12:45:55Z",
      department: "Finance",
      phone: "+1 (212) 555-0107"
    },
    {
      id: "user-008",
      name: "Emma Thompson",
      email: "emma.thompson@parks.nyc.gov",
      role: "Editor",
      status: "Active",
      permissions: {
        form_generate: true,
        form_modify_templates: true,
        form_upload_templates: false,
        form_batch_process: true,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-14T10:22:13Z",
      createdAt: "2024-07-10T12:00:00Z",
      updatedAt: "2025-01-14T10:22:13Z",
      department: "Legal",
      phone: "+1 (212) 555-0108"
    },
    {
      id: "user-009",
      name: "Alex Martinez",
      email: "alex.martinez@parks.nyc.gov",
      role: "Viewer",
      status: "Active",
      permissions: {
        form_generate: false,
        form_modify_templates: false,
        form_upload_templates: false,
        form_batch_process: false,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-13T17:35:28Z",
      createdAt: "2024-08-20T15:45:00Z",
      updatedAt: "2025-01-13T17:35:28Z",
      department: "HR",
      phone: "+1 (212) 555-0109"
    },
    {
      id: "user-010",
      name: "Maria Gonzalez",
      email: "maria.gonzalez@parks.nyc.gov",
      role: "Editor",
      status: "Inactive",
      permissions: {
        form_generate: true,
        form_modify_templates: true,
        form_upload_templates: false,
        form_batch_process: true,
        user_management: false,
        audit_logs: false,
        settings: false
      },
      lastLogin: "2025-01-05T16:20:15Z",
      createdAt: "2024-09-15T11:30:00Z",
      updatedAt: "2025-01-10T14:15:20Z",
      department: "Procurement",
      phone: "+1 (212) 555-0110"
    }
  ];

  return {
    users,
    total: users.length,
    page: 1,
    pageSize: 50
  };
}