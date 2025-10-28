import { Bell, User, Building2, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useProject } from '../../contexts/ProjectContext';
import { useFormGenerator } from '../../contexts/FormGeneratorContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoginModal } from '../auth/LoginModal';
import styles from './TopHeader.module.css';

export function TopHeader() {
  console.log('TopHeader: Rendering header...');
  const { selectedProject: projectContextProject, isProjectSelected: isProjectContextSelected } = useProject();
  const { state: formGeneratorState } = useFormGenerator();
  const { user, isLoggedIn, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Get project info from either context (FormGenerator takes priority)
  const selectedProject = formGeneratorState.selectedProject || projectContextProject;
  const isProjectSelected = !!selectedProject || isProjectContextSelected;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-medium text-foreground">Construction Form Generator</h1>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
          
          {/* Selected Project Indicator */}
          {isProjectSelected && selectedProject && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <Building2 className="h-4 w-4 text-green-600" />
              <div className="text-sm">
                <p className="text-green-800 font-medium">
                  {selectedProject.pi_short_description || selectedProject.name || selectedProject.description || 'Selected Project'}
                </p>
                <p className="text-green-600 text-xs">
                  {selectedProject.pi_park_name || selectedProject.location || selectedProject.id || ''}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                Selected
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-accent">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{user.initials}</span>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Logged in as: {user.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={() => setIsLoginModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
}