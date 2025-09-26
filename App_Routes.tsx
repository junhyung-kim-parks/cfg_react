import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { loadRuntimeConfig } from './services/api/runtime';
import { router } from './routes';
import { ProjectProvider } from './contexts/ProjectContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FormGeneratorProvider } from './contexts/FormGeneratorContext';
import { Toaster } from './components/ui/sonner';
import './styles/globals.css';

const fallbackElement = (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function App_Routes() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('App_Routes.tsx: Loading runtime config...');
        await loadRuntimeConfig();
        console.log('App_Routes.tsx: Runtime config loaded successfully');
      } catch (error) {
        console.warn('App_Routes.tsx: Failed to load runtime config, using defaults:', error);
        // Continue with app initialization even if config fails
      } finally {
        console.log('App_Routes.tsx: Setting config loaded to true');
        setIsConfigLoaded(true);
      }
    }

    initializeApp();
  }, []);

  if (!isConfigLoaded) {
    console.log('App_Routes.tsx: Still loading config, showing fallback');
    return fallbackElement;
  }

  console.log('App_Routes.tsx: Config loaded, rendering Construction Form Generator with React Router');
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <FormGeneratorProvider>
            <RouterProvider router={router} fallbackElement={fallbackElement} />
            <Toaster />
          </FormGeneratorProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}