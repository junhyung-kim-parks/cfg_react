import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFormGenerator } from '../../contexts/FormGeneratorContext';
import { useProject } from '../../contexts/ProjectContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface NavigationGuardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPath: string;
  onConfirm: () => void;
}

export function NavigationGuard({ open, onOpenChange, targetPath, onConfirm }: NavigationGuardProps) {
  const { clearAllData } = useFormGenerator();
  const { setSelectedProject } = useProject();

  const handleConfirm = () => {
    console.log('🛡️ NavigationGuard: User confirmed navigation, clearing data and navigating to:', targetPath);
    
    // Clear both FormGenerator and Project contexts
    console.log('🛡️ NavigationGuard: Clearing FormGenerator context data...');
    clearAllData();
    
    console.log('🛡️ NavigationGuard: Clearing Project context data...');
    setSelectedProject(null);
    
    console.log('🛡️ NavigationGuard: All data cleared, proceeding with navigation');
    onConfirm();
    onOpenChange(false);
  };

  const getTargetName = (path: string) => {
    if (path === '/') return 'Dashboard';
    if (path === '/forms/library') return 'Form Library';
    if (path === '/batch') return 'Batch Processing';
    if (path === '/audit-logs') return 'Audit Logs';
    if (path === '/users') return 'User Management';
    if (path === '/settings') return 'Settings';
    return 'another page';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            You have unsaved work in the Form Generator flow. If you navigate to{' '}
            <span className="font-medium text-gray-900">{getTargetName(targetPath)}</span>, 
            all your progress will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Yes, Leave & Clear Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}