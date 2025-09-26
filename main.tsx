import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadRuntimeConfig, getRuntimeConfig } from './services/api/runtime';
import App from './App';
import App_Routes from './App_Routes';
import './styles/globals.css';

async function initializeApp() {
  console.log('main.tsx: Loading runtime config...');
  
  try {
    await loadRuntimeConfig();
    console.log('main.tsx: Runtime config loaded successfully');
  } catch (error) {
    console.warn('main.tsx: Failed to load runtime config, using defaults:', error);
    // Continue with app initialization even if config fails
  }

  // Determine which app component to use based on routing config
  const config = getRuntimeConfig();
  const useReactRouter = config.routing === true;
  const AppComponent = useReactRouter ? App_Routes : App;
  
  console.log(`main.tsx: Using ${useReactRouter ? 'React Router' : 'Manual Routing'} system`);
  console.log('main.tsx: Rendering app...');
  
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <AppComponent />
    </StrictMode>
  );
}

// Initialize the application
console.log('main.tsx: Starting application initialization');
initializeApp().catch(console.error);