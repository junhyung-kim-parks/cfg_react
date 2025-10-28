import { 
  Home, 
  Search, 
  FileText, 
  Archive, 
  Activity, 
  FileCheck, 
  Users, 
  Settings,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Eye,
  AlertTriangle,
  Lock
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFormGenerator } from '../../contexts/FormGeneratorContext';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { NavigationGuard } from '../forms/NavigationGuard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
  { 
    id: 'form-generator', 
    label: 'Form Generator', 
    icon: FileText,
    children: [
      { id: 'project-search', label: 'Project Search', icon: Search, href: '/forms/project-search' },
      { id: 'form-picker', label: 'Form Picker', icon: FolderOpen, href: '/forms/picker' },
      { id: 'prefill-preview', label: 'Prefill Preview', icon: Eye, href: '/forms/prefill-preview' }
    ]
  },
  { id: 'form-library', label: 'Form Library', icon: Archive, href: '/forms/library' },
  { id: 'batch-processing', label: 'Batch Processing', icon: Activity, href: '/batch' },
  { id: 'audit-logs', label: 'Audit Logs', icon: FileCheck, href: '/audit-logs' },
  { id: 'user-management', label: 'User Management', icon: Users, href: '/users' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' }
];

export function Sidebar() {
  console.log('Sidebar: Rendering sidebar...');
  const { isProjectSelected } = useProject();
  const { isLoggedIn } = useAuth();
  const { hasUnsavedData, state: formGeneratorState } = useFormGenerator();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showNavigationGuard, setShowNavigationGuard] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    const handleLocationChange = () => {
      console.log('Sidebar: Location changed to:', window.location.pathname);
      setCurrentPath(window.location.pathname);
    };

    // Listen for both browser navigation and manual navigation events
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('navigate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('navigate', handleLocationChange);
    };
  }, []);

  // Auto-expand Form Generator menu when any of its routes are active
  useEffect(() => {
    const isFormGeneratorRoute = currentPath.startsWith('/forms/project-search') ||
                                currentPath.startsWith('/forms/picker') || 
                                currentPath.startsWith('/forms/prefill-preview');
    
    if (isFormGeneratorRoute) {
      setExpandedItems(prev => 
        prev.includes('form-generator') ? prev : [...prev, 'form-generator']
      );
    }
  }, [currentPath]); // Remove expandedItems from dependencies to prevent infinite loop

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Check if navigation requires authentication
  const requiresAuthentication = (href: string) => {
    return href !== '/'; // Dashboard is accessible without login, everything else requires auth
  };

  // Check if navigation requires project selection
  const requiresProjectSelection = (href: string) => {
    return href.startsWith('/forms/picker') || 
           href.startsWith('/forms/preview') || 
           href.startsWith('/forms/prefill-preview');
  };

  const handleNavigation = (href: string) => {
    console.log('Sidebar: Navigation requested to:', href);
    
    // Special handling for Form Picker - include selected forms if available
    if (href === '/forms/picker') {
      if (formGeneratorState.selectedForms.length > 0) {
        const selectedFormsParam = formGeneratorState.selectedForms.join(',');
        href = `/forms/picker?selected=${selectedFormsParam}`;
        console.log('Sidebar: Updated Form Picker URL with selected forms:', href);
      }
    }
    
    // Special handling for Prefill Preview
    if (href === '/forms/prefill-preview') {
      // If we have selected forms in context, include them in the URL
      if (formGeneratorState.selectedForms.length > 0) {
        const selectedFormsParam = formGeneratorState.selectedForms.join(',');
        href = `/forms/prefill-preview?selected=${selectedFormsParam}`;
        console.log('Sidebar: Updated Prefill Preview URL with selected forms:', href);
      }
    }
    
    // Check if we're in a Form Generator flow and have unsaved data
    const isFormGeneratorFlow = currentPath.startsWith('/forms/project-search') ||
                               currentPath.startsWith('/forms/picker') ||
                               currentPath.startsWith('/forms/prefill-preview');
    
    // Check if navigating away from Form Generator flow to non-generator routes
    const formGeneratorRoutes = ['/forms/project-search', '/forms/picker', '/forms/prefill-preview'];
    const isNavigatingAwayFromFlow = isFormGeneratorFlow && !formGeneratorRoutes.some(route => href.startsWith(route));
    
    if (isNavigatingAwayFromFlow && hasUnsavedData()) {
      console.log('🛡️ Sidebar: Navigation guard triggered', {
        currentPath,
        targetHref: href,
        isFormGeneratorFlow,
        isNavigatingAwayFromFlow,
        hasUnsavedData: hasUnsavedData()
      });
      setPendingNavigation(href);
      setShowNavigationGuard(true);
      return;
    }
    
    // Check authentication first
    if (requiresAuthentication(href) && !isLoggedIn) {
      // Just navigate - the ProtectedRoute component will handle the auth check
      if ((window as any).manualNavigate) {
        (window as any).manualNavigate(href);
      } else {
        window.location.href = href;
      }
      return;
    }

    if (requiresProjectSelection(href) && !isProjectSelected) {
      setShowWarningDialog(true);
      return;
    }
    
    // Use global navigate function if available, fallback to location.href
    if ((window as any).manualNavigate) {
      (window as any).manualNavigate(href);
    } else {
      window.location.href = href;
    }
  };

  const handleNavigationGuardConfirm = () => {
    if (pendingNavigation) {
      if ((window as any).manualNavigate) {
        (window as any).manualNavigate(pendingNavigation);
      } else {
        window.location.href = pendingNavigation;
      }
      setPendingNavigation(null);
    }
  };

  const handleWarningDialogGoToProjects = () => {
    setShowWarningDialog(false);
    if ((window as any).manualNavigate) {
      (window as any).manualNavigate('/forms/project-search');
    } else {
      window.location.href = '/forms/project-search';
    }
  };
  


  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.href === currentPath;
    const hasChildren = item.children && item.children.length > 0;
    
    // Check if any child is active for parent highlighting
    const isChildActive = hasChildren && item.children!.some(child => child.href === currentPath);

    return (
      <div key={item.id}>
        {item.href ? (
          <button
            onClick={() => handleNavigation(item.href!)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left",
              level > 0 && "ml-6",
              isActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              // Add visual indicator for items that require project selection
              requiresProjectSelection(item.href) && !isProjectSelected && "opacity-75"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {requiresAuthentication(item.href) && !isLoggedIn && (
              <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
            )}
            {requiresProjectSelection(item.href) && !isProjectSelected && (
              <AlertTriangle className="h-3 w-3 text-yellow-400 flex-shrink-0" />
            )}
          </button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => hasChildren && toggleExpanded(item.id)}
            className={cn(
              "w-full justify-start gap-3 px-3 py-2 text-sm h-auto font-normal",
              level > 0 && "ml-6",
              isChildActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {hasChildren && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )
            )}
          </Button>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border">
        <div className="p-4 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden">
              <img 
                src="/assets/nyc-parks-logo.svg" 
                alt="NYC Parks Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Construction</h2>
              <p className="text-sm text-sidebar-foreground/70">Form Generator</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {sidebarItems.map(item => renderSidebarItem(item))}
          </nav>
        </div>
      </aside>

      {/* Project Selection Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Project Selection Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to select a project before accessing the Form Generator features. 
              Please go to Project Search and select a project first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={handleWarningDialogGoToProjects}
              className="bg-sidebar-primary hover:bg-sidebar-primary/80 text-sidebar-primary-foreground"
            >
              Go to Project Search
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Navigation Guard Dialog */}
      <NavigationGuard
        open={showNavigationGuard}
        onOpenChange={setShowNavigationGuard}
        targetPath={pendingNavigation || ''}
        onConfirm={handleNavigationGuardConfirm}
      />
    </>
  );
}