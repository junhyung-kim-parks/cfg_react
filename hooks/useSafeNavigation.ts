import { useNavigate } from 'react-router-dom';

export function useSafeNavigation() {
  try {
    const navigate = useNavigate();
    return (path: string) => {
      navigate(path);
      // Dispatch custom event for components that need to update
      window.dispatchEvent(new CustomEvent('navigate', { detail: { path } }));
    };
  } catch {
    // Fallback when Router context is not available
    return (path: string) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.dispatchEvent(new CustomEvent('navigate', { detail: { path } }));
    };
  }
}