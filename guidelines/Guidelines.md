[REQUEST] React + Vite + TypeScript — Root-Level Architecture with Manual Routing & API-First Fallback Pattern

Create a production-ready application scaffold with the folder tree and detailed guidelines below.
This architecture is optimized for Figma Make compatibility and enterprise-grade API integration.

==================================================
ARCHITECTURE OVERVIEW
==================================================
**Core Principles:**
1. **Root-level structure** (no /src) - All source files at project root for clarity
2. **Manual routing system** - Using `window.location.pathname` instead of React Router for Figma Make compatibility
3. **API-first with embedded fallback** - HTTP API prioritized, with embedded dataset as fallback (not just mock JSON)
4. **Tailwind V4** - Latest syntax with @theme inline and CSS variables
5. **Domain-driven features** - Self-contained feature modules with components/hooks/services/types
6. **Runtime configuration** - No rebuild required to switch between mock and server modes
7. **Protected routes pattern** - Authentication-aware route guards
8. **Separation of concerns** - Mock implementations isolated from API logic

==================================================
FOLDER TREE (CREATE EXACTLY)
==================================================
{{PROJECT_NAME}}/
├─ public/                          # Static assets served directly by browser
│  ├─ mock/                         # ✅ ALL mock data JSON files
│  │  ├─ formCatalog.json
│  │  ├─ projectCatalog.json
│  │  ├─ users.json
│  │  ├─ auth_login.json
│  │  ├─ auth_logout.json
│  │  ├─ auth_validate.json
│  │  └─ [feature]_[resource].json  # Naming: feature_resource.json
│  ├─ assets/                       # Images, logos, icons
│  │  ├─ [app-logo].svg
│  │  └─ [app-logo].png
│  └─ app-config.json               # Runtime config (duplicate of root for browser access)
│
├─ pages/                           # Route-level page components
│  ├─ HomePage.tsx
│  ├─ [Feature]Page.tsx             # e.g., FormLibraryPage, ProjectSearchPage
│  └─ styles/                       # ✅ Page-specific CSS (MUST match page filename)
│     ├─ HomePage.css
│     └─ [Feature]Page.css
│
├─ components/                      # Reusable UI components
│  ├─ auth/                         # Authentication-related components
│  │  ├─ LoginModal.tsx             # Login form modal
│  │  └─ ProtectedRoute.tsx         # Route guard for authenticated routes
│  ├─ layout/                       # Layout components
│  │  ├─ Sidebar.tsx                # Main navigation sidebar
│  │  ├─ TopHeader.tsx              # Top header/navbar
│  │  ├─ TopHeader.module.css       # Optional CSS module (keep minimal)
│  │  └─ TopHeader.test.tsx         # Vitest + Testing Library test
│  ├─ forms/                        # Form-related reusable components
│  │  └─ NavigationGuard.tsx        # Prevents navigation with unsaved data
│  ├─ figma/                        # Figma Make generated components
│  │  └─ ImageWithFallback.tsx      # Protected component (do not modify)
│  └─ ui/                           # Primitive UI components (shadcn/ui)
│     ├─ button.tsx
│     ├─ input.tsx
│     ├─ card.tsx
│     ├─ badge.tsx
│     └─ [component].tsx            # No inline styles, Tailwind only
│
├─ features/                        # 🎯 Domain-oriented modules (self-contained)
│  ├─ [domain]/                     # e.g., forms, projects, users, audit, batch
│  │  ├─ components/                # Domain-specific components
│  │  │  └─ [Domain]Card.tsx        # e.g., FormCard.tsx
│  │  ├─ hooks/                     # Domain-specific hooks
│  │  │  └─ use[Domain]Search.ts    # e.g., useFormSearch.ts (debounce, filter, pagination)
│  │  ├─ services/                  # Domain API services
│  │  │  └─ [domain].service.ts     # e.g., forms.service.ts
│  │  ├─ config/                    # Domain configuration (optional)
│  │  │  └─ permissions.ts
│  │  └─ types.ts                   # Domain types (can re-export from models)
│  │
│  └─ Example feature structure:
│     ├─ forms/
│     │  ├─ components/
│     │  │  └─ FormCard.tsx         # Card view for form item
│     │  ├─ hooks/
│     │  │  └─ useFormSearch.ts     # Search/filter/pagination state
│     │  ├─ services/
│     │  │  ├─ forms.service.ts     # list(), get() using httpGet/httpPost
│     │  │  └─ formFieldMappings.service.ts  # Mapping service with POST support
│     │  └─ types.ts                # FormItem, FormMapping types
│     │
│     ├─ projects/
│     │  ├─ hooks/
│     │  │  └─ useProjectSearch.ts
│     │  ├─ services/
│     │  │  └─ projects.service.ts
│     │  └─ types.ts
│     │
│     ├─ users/
│     │  ├─ config/
│     │  │  └─ permissions.ts       # User role/permission config
│     │  ├─ hooks/
│     │  │  └─ useUsers.ts
│     │  ├─ services/
│     │  │  └─ users.service.ts
│     │  └─ types.ts
│     │
│     ├─ audit/
│     │  ├─ hooks/
│     │  │  └─ useAuditLogs.ts
│     │  ├─ services/
│     │  │  └─ auditLogs.service.ts
│     │  └─ types.ts
│     │
│     └─ batch/
│        ├─ components/
│        │  ├─ BatchJobsTable.tsx
│        │  └─ BatchStatusCard.tsx
│        ├─ hooks/
│        │  └─ useBatchJobs.ts
│        ├─ services/
│        │  └─ batch.service.ts
│        └─ types.ts
│
├─ services/                        # Global services (API & utilities)
│  ├─ api/                          # HTTP API layer
│  │  ├─ runtime.ts                 # Runtime config loader
│  │  ├─ http.ts                    # 🔥 httpGet, httpPost (see MANDATORY CONTENT)
│  │  ├─ auth.ts                    # Authentication API (login, logout, validate)
│  │  └─ download.ts                # Download/export services
│  │
│  ├─ embedded_dataset/             # 🎯 Embedded fallback data (when API unavailable)
│  │  ├─ index.ts                   # Barrel export
│  │  ├─ formCatalog.ts             # Embedded form data
│  │  ├─ projectCatalog.ts          # Embedded project data
│  │  ├─ users.ts                   # Embedded user data
│  │  ├─ auditLogs.ts
│  │  ├─ batchProcessing.ts
│  │  ├─ dashboardStats.ts
│  │  └─ form_field_mappings.ts
│  │
│  └─ mocks/                        # Mock implementations (separated from API logic)
│     └─ downloadMocks.ts           # Mock download/PDF generation logic
│
├─ contexts/                        # React Context providers
│  ├─ AuthContext.tsx               # Authentication state & actions
│  ├─ ProjectContext.tsx            # Project selection state
│  ├─ ThemeContext.tsx              # Theme/dark mode state
│  └─ FormGeneratorContext.tsx      # Form generation flow state
│
├─ hooks/                           # Global reusable hooks
│  ├─ useDebounce.ts                # Debounce hook (250-500ms default)
│  ├─ useSafeLocation.ts            # Manual routing: get current pathname
│  └─ useSafeNavigation.ts          # Manual routing: navigate programmatically
│
├─ utils/                           # Utility functions
│  ├─ formatDate.ts                 # Date formatting utilities
│  └─ urlParams.ts                  # URL query parameter helpers
│
├─ constants/                       # Application constants
│  └─ index.ts                      # API endpoints, timeouts, limits, etc.
│
├─ models/                          # Global types/schemas (Zod, etc.)
│  ├─ index.ts                      # Barrel export
│  └─ [model].ts                    # Shared type definitions
│
├─ styles/                          # Global styles (Tailwind V4)
│  └─ globals.css                   # 🔥 Single CSS entry point (see MANDATORY CONTENT)
│
├─ tests/                           # Test configuration
│  └─ setupTests.ts                 # Vitest + Testing Library setup
│
├─ app-config.json                  # 🔥 Runtime configuration (root level)
├─ App.tsx                          # 🔥 Main app component (see MANDATORY CONTENT)
├─ main.tsx                         # 🔥 Entry point (see MANDATORY CONTENT)
├─ index.html                       # HTML entry: `<script type="module" src="/main.tsx">`
├─ vite.config.ts                   # Vite config with alias & publicDir
├─ tsconfig.json                    # TypeScript config with path alias
├─ tailwind.config.ts               # Tailwind config (minimal, use globals.css)
├─ postcss.config.js                # PostCSS config for Tailwind
├─ vitest.config.ts                 # Vitest test configuration
├─ eslint.config.mjs                # ESLint configuration
├─ .prettierrc                      # Prettier configuration
├─ .env.example                     # Environment variables example
├─ package.json                     # Dependencies & scripts
└─ README.md                        # Project documentation

==================================================
DETAILED FOLDER GUIDELINES
==================================================

## public/
- **mock/**: ALL mock JSON files for API responses
  - Naming convention: `[feature]_[resource].json` (e.g., `auth_login.json`)
  - Special auth endpoints: `auth_login.json`, `auth_logout.json`, `auth_validate.json`
  - Never hardcode "/public" in code paths
  - Mock files mirror real API structure
- **assets/**: Static images, logos, icons
  - Include both SVG and PNG versions of logos
  - Use meaningful names (e.g., `nyc-parks-logo.svg`)
- **app-config.json**: Duplicate of root config for browser access

## pages/
- **Purpose**: Route-level components (thin wrappers)
- **Rules**:
  - Keep pages thin (composition + layout only)
  - Delegate logic to hooks, contexts, and services
  - Page-specific CSS MUST live in `pages/styles/[PageName].css`
  - Prefer Tailwind utilities; CSS file for page-specific overrides only
  - Use ProtectedRoute wrapper for authenticated pages
- **Example Structure**:
  ```tsx
  // ProjectSearchPage.tsx
  export function ProjectSearchPage() {
    const { projects, loading } = useProjectSearch();
    return (
      <div className="container mx-auto py-6">
        {/* Page content */}
      </div>
    );
  }
  ```

## components/

### components/auth/
- **LoginModal.tsx**: Authentication modal with username/password
- **ProtectedRoute.tsx**: Wrapper that checks auth state and redirects to home if not authenticated
  ```tsx
  <ProtectedRoute>
    <YourProtectedPage />
  </ProtectedRoute>
  ```

### components/layout/
- **Sidebar.tsx**: Main navigation sidebar
  - Should use CSS variables for theming
  - Active state management
  - Icon + label navigation items
- **TopHeader.tsx**: Top navbar/header
  - User info, notifications, settings
  - Minimal CSS module (TopHeader.module.css) for fine-grained overrides
  - Prefer Tailwind utilities first
- **TopHeader.test.tsx**: Basic render test with Vitest + Testing Library

### components/forms/
- **NavigationGuard.tsx**: Prevents navigation when there's unsaved form data
  - Hooks into FormGeneratorContext
  - Shows confirmation dialog before navigation

### components/figma/
- **ImageWithFallback.tsx**: 🚨 PROTECTED - Do not modify
  - Used by Figma Make for image handling

### components/ui/
- **Purpose**: Primitive UI components (shadcn/ui style)
- **Rules**:
  - NO inline styles
  - Tailwind classes only
  - TypeScript interfaces for props
  - Accessible by default (ARIA attributes)
- **Common components**:
  - button.tsx, input.tsx, card.tsx, badge.tsx
  - dialog.tsx, dropdown-menu.tsx, popover.tsx
  - table.tsx, tabs.tsx, select.tsx
  - Form components: form.tsx, label.tsx, checkbox.tsx

## features/ (🎯 CRITICAL - Domain-Driven Design)

**Philosophy**: Each feature is a self-contained module with its own components, hooks, services, and types.

**Structure for each domain**:
```
features/[domain]/
├─ components/       # Domain-specific components
├─ hooks/           # Domain-specific hooks
├─ services/        # Domain API services
├─ config/          # Domain configuration (optional)
└─ types.ts         # Domain types
```

**Rules**:
1. **Self-contained**: Features should rarely import from other features
2. **Clear API surface**: Export only what's needed via index.ts (optional)
3. **Collocated types**: types.ts in feature folder, not in global models/
4. **Service pattern**: All API calls go through [domain].service.ts
5. **Hook pattern**: Complex state logic in use[Domain]*.ts hooks

**Example: features/forms/**
```
forms/
├─ components/
│  └─ FormCard.tsx              # Form item card view
├─ hooks/
│  └─ useFormSearch.ts          # Search, filter, pagination, sort
├─ services/
│  ├─ forms.service.ts          # list(), get(), update()
│  └─ formFieldMappings.service.ts  # Mapping data with POST API
└─ types.ts                     # FormItem, FormStatus, etc.
```

**Service Implementation Pattern**:
```typescript
// forms.service.ts
import { httpGet, httpPost } from '../../services/api/http';
import { EMBEDDED_FORM_CATALOG } from '../../services/embedded_dataset';
import type { FormItem } from './types';

export async function list(): Promise<FormItem[]> {
  try {
    // API-first approach
    return await httpGet<FormItem[]>('/formCatalog');
  } catch (error) {
    // Fallback to embedded dataset
    console.warn('API failed, using embedded dataset:', error);
    return EMBEDDED_FORM_CATALOG;
  }
}

export async function getFormMappings(formIds: string[]): Promise<any> {
  try {
    // POST request example
    return await httpPost('/api/forms/mappings', { formIds });
  } catch (error) {
    // Fallback logic
    return {};
  }
}
```

**Hook Implementation Pattern**:
```typescript
// useFormSearch.ts
import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { list as getFormList } from '../services/forms.service';
import type { FormItem } from '../types';

export function useFormSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  
  const debouncedSearch = useDebounce(searchQuery, 250);
  
  useEffect(() => {
    loadForms();
  }, [debouncedSearch, filters]);
  
  async function loadForms() {
    setLoading(true);
    try {
      const data = await getFormList();
      // Apply filters and search
      const filtered = data.filter(/* filter logic */);
      setForms(filtered);
    } finally {
      setLoading(false);
    }
  }
  
  return { forms, loading, searchQuery, setSearchQuery, filters, setFilters };
}
```

## services/

### services/api/
**Core API layer with HTTP utilities and runtime configuration**

#### runtime.ts (🔥 MANDATORY - see MANDATORY CONTENT section)
- Loads `/app-config.json` at application boot
- Exports: `loadRuntimeConfig()`, `getRuntimeConfig()`, `AppConfig` type

#### http.ts (🔥 MANDATORY - see MANDATORY CONTENT section)
- Core HTTP utilities: `httpGet<T>()`, `httpPost<T>()`
- Automatic URL resolution (API vs mock mode)
- Error handling with detailed logging

#### auth.ts
- Authentication services: `login()`, `logout()`, `validateSession()`
- Uses httpPost for login/logout
- Returns user session data

#### download.ts
- Download/export services
- PDF generation, file downloads
- Single and bulk download support
- Example:
  ```typescript
  export async function downloadSingleFormPdf(request: {
    form_id: string;
    pdf: string;
    fields: FieldData[];
  }): Promise<void> {
    const config = getRuntimeConfig();
    if (config.API_BASE) {
      // Try real API
      const response = await fetch(`${config.API_BASE}/api/forms/fill-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      // Handle blob download...
    } else {
      // Use mock download
      mockDownloadSingleFormPdf(request);
    }
  }
  ```

### services/embedded_dataset/
**Purpose**: Fallback data when API is unavailable (NOT just development mocks)

**Rules**:
1. Each file exports a constant with typed data
2. Use TypeScript for type safety
3. Data should match production structure
4. Import in service files as fallback

**Example**:
```typescript
// embedded_dataset/formCatalog.ts
import type { FormItem } from '../../features/forms/types';

export const EMBEDDED_FORM_CATALOG: FormItem[] = [
  {
    form_id: 'FORM-001',
    form_title: 'Pre-Construction Notice',
    category: 'Construction',
    status: 'active',
    // ... more fields
  },
  // ... more items
];
```

**index.ts** (barrel export):
```typescript
export { EMBEDDED_FORM_CATALOG } from './formCatalog';
export { EMBEDDED_PROJECT_CATALOG } from './projectCatalog';
export { EMBEDDED_USERS } from './users';
// ... etc
```

### services/mocks/
**Purpose**: Mock implementations separated from API logic

**Example: downloadMocks.ts**
```typescript
export function mockDownloadSingleFormPdf(request: SingleFormDownloadRequest): void {
  // Generate mock PDF content
  const pdfContent = generateMockPdfContent(request);
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  triggerBrowserDownload(blob, request.pdf);
}

export function mockDownloadTemplate(request: DownloadRequest): DownloadResponse {
  // Mock multi-form download
  // ...
}
```

**Benefits**:
- Clean separation of concerns
- Easy to test mock logic independently
- Reusable across services
- Clear fallback behavior

## contexts/
**Purpose**: Global application state (use sparingly)

**Guidelines**:
1. Keep minimal - prefer local state and feature hooks
2. Each context should have a clear, single responsibility
3. Provide both state and actions
4. Use TypeScript for context types

**Common contexts**:
- **AuthContext**: User authentication state, login/logout actions
- **ProjectContext**: Currently selected project
- **ThemeContext**: Theme/dark mode toggle
- **FormGeneratorContext**: Multi-step form generation flow state

**Example pattern**:
```typescript
// AuthContext.tsx
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Load session on mount
  useEffect(() => {
    validateSession();
  }, []);
  
  const login = async (username, password) => {
    const result = await authService.login(username, password);
    setUser(result.user);
    setIsAuthenticated(true);
  };
  
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

## hooks/
**Purpose**: Global reusable hooks (not feature-specific)

**Common hooks**:
- **useDebounce.ts**: Debounce values (250-500ms typical)
  ```typescript
  export function useDebounce<T>(value: T, delay: number = 250): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  }
  ```

- **useSafeLocation.ts**: Get current pathname (manual routing)
  ```typescript
  export function useSafeLocation() {
    const [pathname, setPathname] = useState(window.location.pathname);
    useEffect(() => {
      const handleNavigate = () => setPathname(window.location.pathname);
      window.addEventListener('navigate', handleNavigate);
      window.addEventListener('popstate', handleNavigate);
      return () => {
        window.removeEventListener('navigate', handleNavigate);
        window.removeEventListener('popstate', handleNavigate);
      };
    }, []);
    return { pathname };
  }
  ```

- **useSafeNavigation.ts**: Programmatic navigation (manual routing)
  ```typescript
  export function useSafeNavigation() {
    const navigate = useCallback((path: string) => {
      if ((window as any).manualNavigate) {
        (window as any).manualNavigate(path);
      } else {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new Event('navigate'));
      }
    }, []);
    return { navigate };
  }
  ```

## utils/
**Purpose**: Pure utility functions (no React, no side effects)

**Guidelines**:
1. One function per file (or related functions)
2. Fully typed with TypeScript
3. Unit testable
4. No dependencies on React or contexts

**Examples**:
- **formatDate.ts**: Date formatting utilities
- **urlParams.ts**: URL query parameter helpers
  ```typescript
  export function getQueryParam(key: string): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }
  
  export function setQueryParam(key: string, value: string): void {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }
  ```

## constants/
**Purpose**: Application-wide constants

**Example**:
```typescript
// constants/index.ts
export const API_TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 60000,
  DOWNLOAD: 120000,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const DEBOUNCE_DELAYS = {
  SEARCH: 250,
  RESIZE: 150,
  SCROLL: 100,
};
```

## models/
**Purpose**: Global shared types (use sparingly, prefer feature types)

**Guidelines**:
1. Only for types used across multiple features
2. Consider if type belongs in a feature instead
3. Use Zod for runtime validation if needed

## styles/
**Purpose**: Global CSS with Tailwind V4

**Rules**:
1. **ONE CSS file**: globals.css (no tokens.css needed with Tailwind V4)
2. Use @theme inline for CSS variable mapping
3. Define CSS variables in :root and .dark
4. No inline styles anywhere in codebase
5. No CSS-in-JS libraries

**See MANDATORY CONTENT section for full globals.css template**

## tests/
**Purpose**: Test configuration and setup

**setupTests.ts**:
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

==================================================
MANUAL ROUTING SYSTEM (🔥 CRITICAL FOR FIGMA MAKE)
==================================================

**Why**: React Router causes compatibility issues with Figma Make preview environment.

**Solution**: Manual routing using `window.location.pathname` and custom navigation.

### Implementation in App.tsx:

```typescript
export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Setup manual navigation function
    (window as any).manualNavigate = (path: string) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.dispatchEvent(new Event('navigate'));
    };

    // Handle browser back/forward
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      delete (window as any).manualNavigate;
    };
  }, []);

  const renderCurrentPage = () => {
    // Path matching with startsWith for dynamic routes
    if (currentPath.startsWith('/forms/project-search')) {
      return <ProtectedRoute><ProjectSearchPage /></ProtectedRoute>;
    }
    if (currentPath.startsWith('/forms/picker')) {
      return <ProtectedRoute><FormPickerPage /></ProtectedRoute>;
    }
    
    // Exact path matching
    switch (currentPath) {
      case '/forms/library':
        return <ProtectedRoute><FormLibraryPage /></ProtectedRoute>;
      case '/':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentPage()}
    </div>
  );
}
```

### Navigation in Components:

```typescript
// Using custom hook
import { useSafeNavigation } from '../hooks/useSafeNavigation';

function MyComponent() {
  const { navigate } = useSafeNavigation();
  
  return (
    <button onClick={() => navigate('/forms/library')}>
      Go to Forms
    </button>
  );
}

// Or direct call
function MyOtherComponent() {
  const handleNavigate = () => {
    if ((window as any).manualNavigate) {
      (window as any).manualNavigate('/forms/picker');
    }
  };
  
  return <button onClick={handleNavigate}>Navigate</button>;
}
```

### URL Parameters:

```typescript
// Reading params
const params = new URLSearchParams(window.location.search);
const projectId = params.get('projectId');

// Setting params with navigation
const navigateWithParams = (path: string, params: Record<string, string>) => {
  const query = new URLSearchParams(params).toString();
  const fullPath = query ? `${path}?${query}` : path;
  (window as any).manualNavigate(fullPath);
};
```

==================================================
API-FIRST WITH EMBEDDED FALLBACK PATTERN
==================================================

**Philosophy**: Always try HTTP API first, fall back to embedded dataset if unavailable.

**Benefits**:
1. Works offline or in development without mock server
2. No rebuild needed to switch modes
3. Type-safe fallback data
4. Clear error handling

### Pattern in Service Files:

```typescript
// features/forms/services/forms.service.ts
import { httpGet, httpPost } from '../../../services/api/http';
import { EMBEDDED_FORM_CATALOG } from '../../../services/embedded_dataset';
import type { FormItem } from '../types';

export async function list(): Promise<FormItem[]> {
  console.log('📋 Forms Service: Fetching form catalog');
  
  try {
    // Try HTTP API first
    const data = await httpGet<FormItem[]>('/formCatalog');
    console.log('✅ Forms Service: HTTP API succeeded');
    return data;
  } catch (error) {
    // Fall back to embedded dataset
    console.warn('⚠️ Forms Service: HTTP API failed, using embedded dataset:', error);
    return EMBEDDED_FORM_CATALOG;
  }
}

export async function getFormMappingsWithProject(
  formIds: string[], 
  project?: Project
): Promise<Record<string, any>> {
  console.log('📋 Forms Service: Fetching form mappings with POST');
  
  try {
    // POST request with body
    const data = await httpPost<Record<string, any>>('/api/forms/mappings', {
      formIds,
      project
    });
    console.log('✅ Forms Service: HTTP POST succeeded');
    return data;
  } catch (error) {
    console.warn('⚠️ Forms Service: HTTP POST failed, using embedded fallback');
    // Fallback logic with embedded data
    return formIds.reduce((acc, id) => {
      acc[id] = EMBEDDED_FORM_FIELD_MAPPINGS[id] || {};
      return acc;
    }, {} as Record<string, any>);
  }
}
```

### Logging Strategy:

Use consistent emoji prefixes for easy filtering:
- 📋 Service operation starting
- ✅ Operation succeeded
- ⚠️ API failed, using fallback
- ❌ Fatal error
- 🔄 Retry attempt
- 📄 File operation
- 🚀 HTTP request

==================================================
PROTECTED ROUTES & AUTHENTICATION
==================================================

### ProtectedRoute Component:

```typescript
// components/auth/ProtectedRoute.tsx
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to home
      if ((window as any).manualNavigate) {
        (window as any).manualNavigate('/');
      }
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Or loading spinner
  }

  return <>{children}</>;
}
```

### Usage in App.tsx:

```typescript
const renderCurrentPage = () => {
  if (currentPath.startsWith('/forms')) {
    return (
      <ProtectedRoute>
        <FormsPage />
      </ProtectedRoute>
    );
  }
  
  // Public routes don't need wrapper
  return <HomePage />;
};
```

==================================================
NAVIGATION GUARD PATTERN
==================================================

**Purpose**: Prevent data loss when navigating away from unsaved forms.

### FormGeneratorContext:

```typescript
// contexts/FormGeneratorContext.tsx
interface FormGeneratorContextType {
  hasUnsavedData: boolean;
  setHasUnsavedData: (value: boolean) => void;
  shouldBlockNavigation: () => boolean;
}

export function FormGeneratorProvider({ children }) {
  const [hasUnsavedData, setHasUnsavedData] = useState(false);

  const shouldBlockNavigation = () => {
    if (hasUnsavedData) {
      return window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
    }
    return true;
  };

  return (
    <FormGeneratorContext.Provider 
      value={{ hasUnsavedData, setHasUnsavedData, shouldBlockNavigation }}
    >
      {children}
    </FormGeneratorContext.Provider>
  );
}
```

### NavigationGuard Component:

```typescript
// components/forms/NavigationGuard.tsx
import { useEffect } from 'react';
import { useFormGenerator } from '../../contexts/FormGeneratorContext';

export function NavigationGuard() {
  const { shouldBlockNavigation } = useFormGenerator();

  useEffect(() => {
    // Intercept browser navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlockNavigation()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Intercept manual navigation
    const originalManualNavigate = (window as any).manualNavigate;
    (window as any).manualNavigate = (path: string) => {
      if (shouldBlockNavigation()) {
        originalManualNavigate(path);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      (window as any).manualNavigate = originalManualNavigate;
    };
  }, [shouldBlockNavigation]);

  return null;
}
```

### Usage:

```typescript
// In form pages
const { setHasUnsavedData } = useFormGenerator();

// Mark as dirty when user edits
const handleFieldChange = (value: any) => {
  setFieldValue(value);
  setHasUnsavedData(true);
};

// Clear on save
const handleSave = async () => {
  await saveData();
  setHasUnsavedData(false);
};
```

==================================================
REFACTORING & REMOVAL POLICY
==================================================

**IMPORTANT**: Never delete files immediately during refactoring.

**Process**:
1. When a file becomes unused, **rename it** with `Remove_` prefix
2. Examples:
   - `TopHeader.tsx` → `Remove_TopHeader.tsx`
   - `legacy/` folder → `Remove_legacy/`
3. Keep renamed files for 1-2 sprints for review
4. Delete in a dedicated cleanup PR with team review

**Benefits**:
- Clear diff of what changed vs what was removed
- Easy rollback if needed
- Team can review deprecated code before deletion
- Prevents accidental deletion of needed code

**Example in file tree**:
```
components/
├─ layout/
│  ├─ Sidebar.tsx                    # Active
│  ├─ Remove_TopHeader.tsx           # Deprecated
│  └─ Remove_AppLayout_WithRoutes.tsx # Deprecated
```

==================================================
MANDATORY FILE CONTENT
==================================================

### 1. services/api/http.ts (✅ EXACT IMPLEMENTATION)

```typescript
import { getRuntimeConfig } from './runtime';

function resolveUrl(path: string): string {
  const config = getRuntimeConfig();
  const base = (config?.API_BASE || (import.meta?.env?.VITE_API_BASE) || '').trim();

  // absolute URL → use as-is
  if (/^https?:\/\//i.test(path)) return path;

  // server mode: prepend base
  if (base) {
    const cleaned = path.replace(/^\//, '');
    return new URL((base.endsWith('/') ? base : base + '/') + cleaned).toString();
  }

  // mock mode: map logical paths to /mock/*.json
  let cleaned = path.replace(/^\//, '').replace(/^mock\//, '');
  
  // Special mapping for auth endpoints
  if (cleaned.startsWith('auth/')) {
    cleaned = cleaned.replace(/\//g, '_');
  }
  
  const file = cleaned.endsWith('.json') ? cleaned : `${cleaned}.json`;
  return `/mock/${file}`;
}

export async function httpGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = resolveUrl(path);
  console.log(`🚀 HTTP GET: ${path} -> ${url}`);
  
  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: { Accept: 'application/json', ...(init.headers || {}) },
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText} | body: ${text.slice(0, 180)}`);
  }
  
  console.log(`✅ HTTP GET successful: ${url}`);
  return res.json() as Promise<T>;
}

export async function httpPost<T>(path: string, body?: any, init: RequestInit = {}): Promise<T> {
  const config = getRuntimeConfig();
  const base = (config?.API_BASE || (import.meta?.env?.VITE_API_BASE) || '').trim();
  
  // In mock mode, POST requests will fail and should use fallback logic in services
  if (!base) {
    console.log(`🚀 HTTP POST (Mock Mode): ${path} - will throw for fallback`);
    throw new Error(`Mock mode: POST ${path} not supported, use embedded dataset fallback`);
  }
  
  const url = resolveUrl(path);
  console.log(`🚀 HTTP POST: ${path} -> ${url}`);
  console.log(`📋 POST Body:`, body);
  
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Accept: 'application/json', 
      ...(init.headers || {}) 
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${url} -> ${res.status} ${res.statusText} | body: ${text.slice(0, 180)}`);
  }
  
  console.log(`✅ HTTP POST successful: ${url}`);
  return res.json() as Promise<T>;
}
```

### 2. services/api/runtime.ts (✅ EXACT IMPLEMENTATION)

```typescript
export interface AppConfig {
  API_BASE: string;
}

let config: AppConfig = { API_BASE: '' };

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch('/app-config.json', { cache: 'no-store' });
    if (res.ok) {
      config = await res.json();
      console.log('✅ Runtime config loaded:', config);
    } else {
      console.warn('⚠️ Failed to load app-config.json, using defaults');
    }
  } catch (error) {
    console.warn('⚠️ Could not load runtime config:', error);
  }
}

export function getRuntimeConfig(): AppConfig {
  return config;
}
```

### 3. app-config.json (Root Level & public/)

```json
{
  "API_BASE": ""
}
```

**Notes**:
- Empty string `""` = mock mode (uses /mock/*.json)
- Set to real URL for server mode: `"API_BASE": "https://api.example.com"`
- Place at root AND in public/ directory

### 4. main.tsx (✅ EXACT IMPLEMENTATION)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig } from './services/api/runtime';
import './styles/globals.css';

async function bootstrap() {
  try {
    await loadRuntimeConfig();
  } catch (error) {
    console.error('Failed to load runtime config:', error);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
```

### 5. App.tsx (Manual Routing Template)

```typescript
import { useEffect, useState } from 'react';
import { loadRuntimeConfig } from './services/api/runtime';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { HomePage } from './pages/HomePage';
import { FormsPage } from './pages/FormsPage';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import './styles/globals.css';

export default function App() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    async function initializeApp() {
      try {
        await loadRuntimeConfig();
      } catch (error) {
        console.warn('Failed to load runtime config:', error);
      } finally {
        setIsConfigLoaded(true);
      }
    }

    initializeApp();

    // Setup manual navigation
    (window as any).manualNavigate = (path: string) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.dispatchEvent(new Event('navigate'));
    };

    // Handle browser back/forward
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      delete (window as any).manualNavigate;
    };
  }, []);

  const renderCurrentPage = () => {
    // Dynamic routes (use startsWith)
    if (currentPath.startsWith('/forms')) {
      return (
        <ProtectedRoute>
          <FormsPage />
        </ProtectedRoute>
      );
    }
    
    // Exact routes (use switch)
    switch (currentPath) {
      case '/':
      default:
        return <HomePage />;
    }
  };

  if (!isConfigLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TopHeader />
            <main className="flex-1 overflow-auto">
              {renderCurrentPage()}
            </main>
          </div>
        </div>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### 6. styles/globals.css (Tailwind V4 Template)

```css
@custom-variant dark (&:is(.dark *));

:root {
  /* Base Settings */
  --font-size: 16px;
  --radius: 0.625rem;
  
  /* Colors - Light Mode */
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: #030213;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --secondary-foreground: #030213;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #030213;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
  --ring: oklch(0.708 0 0);
  
  /* Font Weights */
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  
  /* Chart Colors */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  
  /* Custom Theme Colors (Example: Sidebar) */
  --sidebar: #1a4f4f;
  --sidebar-foreground: #e0f2f1;
  --sidebar-primary: #004d4d;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #2d5f5f;
  --sidebar-accent-foreground: #e0f2f1;
  --sidebar-border: #0d3333;
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  
  /* Dark mode custom colors */
  --sidebar: #0d3333;
  --sidebar-foreground: #b2dfdb;
  --sidebar-primary: #004040;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #1a4d4d;
  --sidebar-accent-foreground: #b2dfdb;
  --sidebar-border: #004040;
  --sidebar-ring: oklch(0.439 0 0);
}

@import "tailwindcss";

@theme inline {
  /* Map CSS variables to Tailwind tokens */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  
  /* Radius tokens */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  
  /* Custom theme tokens */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  /* Custom component classes (example: sidebar) */
  .bg-sidebar {
    background-color: var(--color-sidebar);
  }
  
  .text-sidebar-foreground {
    color: var(--color-sidebar-foreground);
  }
  
  .border-sidebar-border {
    border-color: var(--color-sidebar-border);
  }
  
  .bg-sidebar-accent {
    background-color: var(--color-sidebar-accent);
  }
  
  .text-sidebar-accent-foreground {
    color: var(--color-sidebar-accent-foreground);
  }
  
  .hover\:bg-sidebar-accent:hover {
    background-color: var(--color-sidebar-accent);
  }
  
  .hover\:text-sidebar-accent-foreground:hover {
    color: var(--color-sidebar-accent-foreground);
  }
}

@layer utilities {
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

/**
 * Base typography. This is not applied to elements which have an ancestor with a Tailwind text class.
 */
@layer base {
  :where(:not(:has([class*=" text-"]), :not(:has([class^="text-"])))) {
    h1 {
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h2 {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h4 {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    p {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }

    label {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    button {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    input {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }
  }
}

html {
  font-size: var(--font-size);
}
```

### 7. vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  publicDir: 'public',
  server: {
    port: 3000,
  },
});
```

### 8. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["./**/*.ts", "./**/*.tsx"],
  "exclude": ["node_modules"]
}
```

==================================================
ACCEPTANCE CHECKS
==================================================

**Before considering setup complete, verify ALL of the following**:

### 1. Build & Dev Server
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts development server
- [ ] Application loads at `http://localhost:3000`

### 2. Runtime Configuration
- [ ] `/app-config.json` is accessible in browser
- [ ] Config loads before React renders
- [ ] `getRuntimeConfig()` returns valid config

### 3. Mock Mode (API_BASE: "")
- [ ] All `/mock/*.json` files are accessible
- [ ] GET requests resolve to mock files
- [ ] POST requests throw and trigger fallback
- [ ] Embedded dataset fallbacks work

### 4. Server Mode (API_BASE: "https://api.example.com")
- [ ] Requests go to real API base URL
- [ ] No rebuild required to switch modes
- [ ] Only app-config.json needs to change

### 5. Routing
- [ ] Manual navigation works (no React Router)
- [ ] Browser back/forward buttons work
- [ ] `window.manualNavigate()` function exists
- [ ] URL parameters can be read and set
- [ ] Protected routes redirect when not authenticated

### 6. Authentication
- [ ] Login modal appears on protected route access
- [ ] Login flow works (mock and real API)
- [ ] Session persists on page reload
- [ ] Logout clears session
- [ ] ProtectedRoute redirects correctly

### 7. Styles
- [ ] Tailwind classes apply correctly
- [ ] CSS variables resolve in browser
- [ ] Dark mode toggle works (if implemented)
- [ ] Custom theme colors (e.g., sidebar) display
- [ ] No inline styles in codebase
- [ ] Typography defaults apply

### 8. Features
- [ ] Each feature has components/hooks/services/types
- [ ] Services use httpGet/httpPost
- [ ] Embedded dataset fallbacks work
- [ ] Search/filter hooks work with debounce
- [ ] Loading states display correctly

### 9. Navigation Guard
- [ ] Unsaved data triggers confirmation dialog
- [ ] Browser refresh shows browser warning
- [ ] Manual navigation blocked when dirty
- [ ] Form submission clears dirty state

### 10. File Organization
- [ ] No files in /src (root-level structure)
- [ ] Mock JSON in public/mock/
- [ ] Embedded dataset in services/embedded_dataset/
- [ ] Deprecated files have Remove_ prefix
- [ ] No orphaned imports

### 11. TypeScript
- [ ] No TypeScript errors
- [ ] Types defined for all API responses
- [ ] Props interfaces for all components
- [ ] No `any` types (except window extensions)

### 12. Console Logs
- [ ] API calls logged with emoji prefixes
- [ ] Fallback usage clearly logged
- [ ] No error logs in successful flows
- [ ] Warnings for API failures

==================================================
COMMON PATTERNS & BEST PRACTICES
==================================================

### 1. Service Pattern
```typescript
// Always: API first, embedded fallback
export async function list(): Promise<Item[]> {
  try {
    return await httpGet<Item[]>('/items');
  } catch {
    return EMBEDDED_ITEMS;
  }
}
```

### 2. Hook Pattern
```typescript
// Centralize complex state logic
export function useItemSearch() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  
  useEffect(() => {
    loadItems();
  }, [debouncedQuery]);
  
  return { items, loading, query, setQuery };
}
```

### 3. Component Pattern
```typescript
// Keep components pure and testable
export function ItemCard({ item }: { item: Item }) {
  return (
    <Card className="p-4">
      <h3>{item.name}</h3>
      <Badge variant="outline">{item.status}</Badge>
    </Card>
  );
}
```

### 4. Page Pattern
```typescript
// Pages orchestrate, don't implement
export function ItemsPage() {
  const { items, loading, query, setQuery } = useItemSearch();
  
  return (
    <div className="container mx-auto py-6">
      <SearchInput value={query} onChange={setQuery} />
      {loading ? <Spinner /> : <ItemsList items={items} />}
    </div>
  );
}
```

### 5. Context Pattern
```typescript
// Provide state + actions
export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  
  const loadData = async () => {
    const result = await service.load();
    setData(result);
  };
  
  return (
    <DataContext.Provider value={{ data, loadData }}>
      {children}
    </DataContext.Provider>
  );
}
```

### 6. Error Handling
```typescript
// Always handle errors gracefully
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('Failed to load data');
  return fallbackData;
}
```

### 7. Loading States
```typescript
// Show loading UI
if (loading) {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
```

### 8. Empty States
```typescript
// Show empty state UI
if (!items.length) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="h-12 w-12 mx-auto mb-4" />
      <p>No items found</p>
    </div>
  );
}
```

==================================================
DEPLOYMENT CHECKLIST
==================================================

### Pre-Deployment
- [ ] All TypeScript errors resolved
- [ ] No console errors in production build
- [ ] `npm run build` succeeds
- [ ] Environment variables configured
- [ ] API_BASE set to production URL
- [ ] Remove all Remove_ prefixed files
- [ ] Update README with deployment instructions

### Production Configuration
- [ ] app-config.json points to production API
- [ ] CORS configured on API server
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (if needed)
- [ ] Performance monitoring enabled

### Testing
- [ ] All critical flows tested
- [ ] Authentication works end-to-end
- [ ] Form submissions work
- [ ] Downloads/exports work
- [ ] Mobile responsive (if required)
- [ ] Cross-browser tested

==================================================
TROUBLESHOOTING
==================================================

### Issue: Routes not working
- Check window.manualNavigate is defined
- Verify popstate listener is attached
- Check currentPath state updates

### Issue: API calls fail
- Verify app-config.json is loaded
- Check browser network tab for actual URLs
- Verify API_BASE format (no trailing slash if paths start with /)

### Issue: Mock files not loading
- Check public/mock/ folder structure
- Verify file names match httpGet paths
- Check browser console for 404s

### Issue: Styles not applying
- Verify globals.css is imported in main.tsx
- Check Tailwind config
- Verify CSS variables are defined
- Check for inline styles overriding

### Issue: TypeScript errors
- Verify tsconfig.json baseUrl and paths
- Check for missing type definitions
- Verify all imports use correct paths

### Issue: Context not working
- Verify provider wraps consumer
- Check context is created before use
- Verify useContext hook is inside provider

==================================================
END OF GUIDELINES
==================================================

This document serves as the foundation for all projects using this architecture.
Follow these guidelines to ensure consistency, maintainability, and scalability.

For project-specific customizations, add them to a separate PROJECT_NOTES.md file.
Never modify these core guidelines without team review.