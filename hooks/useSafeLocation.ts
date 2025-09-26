import { useLocation } from 'react-router-dom';

export function useSafeLocation() {
  try {
    return useLocation();
  } catch {
    // Fallback when Router context is not available
    return { pathname: window.location.pathname };
  }
}