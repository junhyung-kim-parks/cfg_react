# API Documentation

## Authentication API

### POST /auth/login
Authenticate user with LDAP and establish session.

**Authentication Required:** No  
**CSRF Protection:** No (login is exempt)

#### Request
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

#### Response
```json
{
  "access": "eyJhbGci...",  // JWT access token (15 min expiry)
  "profile": {              // User profile
    "id": "user-001",
    "name": "John Doe",
    "email": "john.doe@parks.nyc.gov",
    "role": "Admin",
    "permissions": { ... }
  },
  "xsrfHeader": "X-CSRF-Token"  // CSRF header name
}
```

**Cookies Set:**
- `refresh_token` (HttpOnly, Secure, SameSite=Strict) - 7 day expiry
- `__Host-XSRF-TOKEN` (Secure, SameSite=Strict) - CSRF token

#### Backend Process
1. Validate credentials via LDAP bind: `nycdpr\{username}`
2. Query user profile from `view_web_role_based_user_list`
3. Generate JWT access token (AT) with 15 min expiry
4. Generate JWT refresh token (RT) with JTI, register in whitelist
5. Generate XSRF token for CSRF protection
6. Return AT + profile in body, set RT + XSRF cookies

---

### POST /auth/refresh
Refresh expired access token using refresh token cookie.

**Authentication Required:** No (uses RT cookie)  
**CSRF Protection:** Yes (X-CSRF-Token header required)

#### Request
```
Headers:
  X-CSRF-Token: {xsrfToken}
  
Body: (empty)
```

#### Response
```json
{
  "access": "eyJhbGci..."  // New JWT access token
}
```

**Cookies Updated:**
- `refresh_token` (new token, old JTI revoked)
- `__Host-XSRF-TOKEN` (new CSRF token)

#### Backend Process
1. Validate XSRF token (double-submit cookie pattern)
2. Extract RT from cookie, verify signature and JTI
3. Check JTI exists in whitelist (Redis/memory)
4. Revoke old JTI immediately (delete from whitelist)
5. Generate new RT with new JTI, register in whitelist
6. Generate new AT
7. Return new AT, set new RT + XSRF cookies

---

### POST /auth/logout
Logout user and revoke refresh token.

**Authentication Required:** Yes (Authorization header)  
**CSRF Protection:** Yes (X-CSRF-Token header required)

#### Request
```
Headers:
  Authorization: Bearer {accessToken}
  X-CSRF-Token: {xsrfToken}
  
Body: (empty)
```

#### Response
```
Status: 204 No Content
```

**Cookies Cleared:**
- `refresh_token`
- `__Host-XSRF-TOKEN`

#### Backend Process
1. Validate XSRF token
2. Extract RT from cookie, decode JTI
3. Delete JTI from whitelist (revoke token)
4. Clear cookies
5. Return 204

---

## Form Field Mappings API

### Get Form Field Mappings with Project Context
`POST /api/form_field_mappings`

#### Headers
```
Content-Type: application/json
Accept: application/json
```

#### Request Body
```typescript
{
  "formIds": string[],               // Array of form IDs to get mappings for
  "projectId"?: string               // Project ID for context (server will look up project details)
}
```

#### Response
```typescript
{
  [formId: string]: {
    "pdf": string,                   // PDF template filename
    "fields": FormFieldEntry[]       // Array of field mappings
  }
}

interface FormFieldEntry {
  "map_id": string,                  // Unique mapping ID
  "label": string,                   // Field label/name
  "value": string | number | boolean, // Field value
  "source_col": string,              // Source column name in project data
  "data_type": "text" | "number" | "boolean" | "date"  // Data type
}
```

#### Example Request
```json
{
  "formIds": ["FORM-001", "FORM-002", "FORM-003"],
  "projectId": "M353-212M"
}
```

#### Example Response
```json
{
  "FORM-001": {
    "pdf": "FORM-001_PRECON_NOTICE.pdf",
    "fields": [
      {
        "map_id": "4",
        "label": "contract_no",
        "value": "M353-212M",
        "source_col": "pi_park_contract_no",
        "data_type": "text"
      },
      {
        "map_id": "12",
        "label": "award_amount",
        "value": 5390900.00,
        "source_col": "pi_award_amount",
        "data_type": "number"
      }
    ]
  }
}
```

---

## Get Single Form Field Mapping API (Optional)

### Endpoint
`GET /api/form_field_mappings/{formId}`

### Headers
```
Accept: application/json
```

### Query Parameters
- `projectId` (optional): Project ID for context

### Example Request
```
GET /api/form_field_mappings/FORM-001?projectId=M353-212M
```

### Example Response
```json
{
  "pdf": "FORM-001_PRECON_NOTICE.pdf",
  "fields": [
    {
      "map_id": "4",
      "label": "contract_no", 
      "value": "M353-212M",
      "source_col": "pi_park_contract_no",
      "data_type": "text"
    }
  ]
}
```

---

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