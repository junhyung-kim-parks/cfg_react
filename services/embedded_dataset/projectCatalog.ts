import type { ProjectCatalog } from '../../models/project';

export const projectCatalog: ProjectCatalog = {
  "projects": [
    {
      "id": "proj-001",
      "name": "Downtown Office Complex",
      "type": "Commercial",
      "status": "Active",
      "location": "New York, NY",
      "progress": 65,
      "budget": 2500000,
      "spent": 1625000,
      "manager": "John Smith",
      "priority": "High",
      "startDate": "2024-01-15",
      "endDate": "2024-12-30",
      "description": "Modern 15-story office building with retail spaces"
    },
    {
      "id": "proj-002", 
      "name": "Residential Tower A",
      "type": "Residential",
      "status": "Planning",
      "location": "Los Angeles, CA",
      "progress": 15,
      "budget": 4200000,
      "spent": 630000,
      "manager": "Sarah Johnson",
      "priority": "Medium",
      "startDate": "2024-03-01",
      "endDate": "2025-08-15",
      "description": "35-floor luxury apartment complex"
    },
    {
      "id": "proj-003",
      "name": "Highway Bridge Renovation", 
      "type": "Infrastructure",
      "status": "Completed",
      "location": "Chicago, IL",
      "progress": 100,
      "budget": 1800000,
      "spent": 1750000,
      "manager": "Mike Davis",
      "priority": "Critical",
      "startDate": "2023-06-01",
      "endDate": "2024-02-28",
      "description": "Complete renovation of 2-mile bridge section"
    },
    {
      "id": "proj-004",
      "name": "Shopping Mall Extension",
      "type": "Commercial",
      "status": "Active",
      "location": "Houston, TX",
      "progress": 40,
      "budget": 3100000,
      "spent": 1240000,
      "manager": "Emily Chen",
      "priority": "Medium",
      "startDate": "2024-02-01",
      "endDate": "2024-11-30",
      "description": "Adding new wing with 50 retail units"
    },
    {
      "id": "proj-005",
      "name": "School District Campus",
      "type": "Educational",
      "status": "Planning",
      "location": "Phoenix, AZ",
      "progress": 8,
      "budget": 5500000,
      "spent": 440000,
      "manager": "Robert Wilson",
      "priority": "High",
      "startDate": "2024-04-15",
      "endDate": "2025-12-20",
      "description": "New K-12 campus for 2000 students"
    }
  ],
  "stats": {
    "total": 5,
    "active": 2,
    "completed": 1,
    "planning": 2,
    "totalBudget": 17100000,
    "totalSpent": 5685000
  }
};