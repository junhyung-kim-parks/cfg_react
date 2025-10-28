import { useEffect, useState } from 'react';
import { loadRuntimeConfig } from './services/api/runtime';
import { TopHeader } from './components/layout/TopHeader';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './pages/HomePage';
import { ProjectSearchPage } from './pages/ProjectSearchPage';
import { FormPickerPage } from './pages/FormPickerPage';
import { PrefillPreviewPage } from './pages/PrefillPreviewPage';
import { FormLibraryPage } from './pages/FormLibraryPage';
import { BatchProcessingPage } from './pages/BatchProcessingPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProjectProvider } from './contexts/ProjectContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FormGeneratorProvider } from './contexts/FormGeneratorContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import './styles/globals.css';

const fallbackElement = (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function App() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    async function initializeApp() {
      try {
        await loadRuntimeConfig();
      } catch (error) {
        console.warn('App.tsx: Failed to load runtime config, using defaults:', error);
      } finally {
        setIsConfigLoaded(true);
      }
    }

    initializeApp();

    // Simple manual navigation
    (window as any).manualNavigate = (path: string) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      // Dispatch custom event for components to listen
      window.dispatchEvent(new Event('navigate'));
    };

    // Handle browser navigation
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      delete (window as any).manualNavigate;
    };
  }, []);

  // Render current page
  const renderCurrentPage = () => {
    if (currentPath.startsWith('/forms/project-search')) {
      return (
        <ProtectedRoute>
          <ProjectSearchPage />
        </ProtectedRoute>
      );
    }
    if (currentPath.startsWith('/forms/picker')) {
      return (
        <ProtectedRoute>
          <FormPickerPage />
        </ProtectedRoute>
      );
    }
    if (currentPath.startsWith('/forms/prefill-preview')) {
      return (
        <ProtectedRoute>
          <PrefillPreviewPage />
        </ProtectedRoute>
      );
    }
    
    switch (currentPath) {
      case '/forms/library':
        return (
          <ProtectedRoute>
            <FormLibraryPage />
          </ProtectedRoute>
        );
      case '/batch':
        return (
          <ProtectedRoute>
            <BatchProcessingPage />
          </ProtectedRoute>
        );
      case '/audit-logs':
        return (
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        );
      case '/users':
        return (
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        );
      case '/settings':
        return (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        );
      case '/':
      default:
        return <HomePage />;
    }
  };

  if (!isConfigLoaded) {
    return fallbackElement;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <FormGeneratorProvider>
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
          </FormGeneratorProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}