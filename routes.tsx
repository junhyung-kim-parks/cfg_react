import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { ProjectSearchPage } from './pages/ProjectSearchPage';
import { FormPickerPage } from './pages/FormPickerPage';
import { PrefillPreviewPage } from './pages/PrefillPreviewPage';
import { FormLibraryPage } from './pages/FormLibraryPage';
import { BatchProcessingPage } from './pages/BatchProcessingPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// 404 Page Component
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
      <p className="text-muted-foreground mb-6">Page not found</p>
      <a 
        href="/" 
        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Go to Home
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />, // Dashboard - accessible without login
      },
      {
        path: 'projects',
        element: (
          <ProtectedRoute>
            <ProjectSearchPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms/picker',
        element: (
          <ProtectedRoute>
            <FormPickerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms/prefill-preview',
        element: (
          <ProtectedRoute>
            <PrefillPreviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms/library',
        element: (
          <ProtectedRoute>
            <FormLibraryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'batch',
        element: (
          <ProtectedRoute>
            <BatchProcessingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);