# API Documentation

## Download Forms API

### Endpoint
`POST /api/forms/download`

### Headers
```
Content-Type: application/json
Accept: application/json
```

### Request Body
```typescript
{
  "formIds": string[],           // Array of form IDs to download (e.g., ["FORM-001", "FORM-002"])
  "projectData"?: {              // Optional project information
    "name": string,              // Project name
    "id": string,                // Project ID
    "manager"?: string,          // Project manager name
    "location"?: string          // Project location
  },
  "formFieldsData"?: {           // Optional pre-filled form field data
    [formId: string]: {          // Key is form ID
      [fieldName: string]: any   // Field name to value mapping
    }
  }
}
```

### Response
```typescript
{
  "success": boolean,
  "downloadUrl"?: string,        // URL to download the generated file
  "filename"?: string,           // Generated filename
  "message"?: string,            // Success/error message
  "downloadedFiles"?: number     // Number of files generated
}
```

### Example Request
```json
{
  "formIds": ["FORM-001", "FORM-003"],
  "projectData": {
    "name": "Central Park Playground Renovation",
    "id": "PROJ-2025-001",
    "manager": "John Smith",
    "location": "Central Park, Manhattan"
  },
  "formFieldsData": {
    "FORM-001": {
      "ProjectName": "Central Park Playground Renovation",
      "ContractNo": "Q123-456M",
      "ProjectManager": "John Smith",
      "BidPrice": 5000000
    },
    "FORM-003": {
      "ProjectName": "Central Park Playground Renovation",
      "Location": "Central Park, Manhattan",
      "StartDate": "2025-06-01"
    }
  }
}
```

### Example Response
```json
{
  "success": true,
  "downloadUrl": "https://api.yourserver.com/files/download/abc123.pdf",
  "filename": "Central_Park_Playground_Renovation_Forms_FORM-001_FORM-003.pdf",
  "message": "Successfully generated 2 form templates",
  "downloadedFiles": 2
}
```

## Configuration

To enable API calls, update `/app-config.json`:

```json
{
  "API_BASE": "https://your-api-server.com",
  "routing": false
}
```

When `API_BASE` is empty, the application will use mock data and generate sample PDF files for demonstration purposes.