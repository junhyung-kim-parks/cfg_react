import { Bell, User, Building2, LogOut, Menu } from 'lucide-react';
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

interface TopHeaderProps {
  onMenuClick?: () => void; // mobile-only: hamburger click handler
}

export function TopHeader({ onMenuClick }: TopHeaderProps = {}) {
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
    <header className="bg-background border-b border-border px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        {/* mobile-only: Hamburger menu button */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
          <div className="min-w-0 flex-shrink">
            <h1 className="text-base lg:text-xl font-medium text-foreground truncate">Construction Form Generator</h1>
            <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">{currentDate}</p>
          </div>
          
          {/* Selected Project Indicator - responsive */}
          {isProjectSelected && selectedProject && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 flex-shrink-0">
              <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="text-sm min-w-0">
                <p className="text-green-800 font-medium truncate">
                  {selectedProject.pi_short_description || selectedProject.name || selectedProject.description || 'Selected Project'}
                </p>
                <p className="text-green-600 text-xs truncate">
                  {selectedProject.pi_park_name || selectedProject.location || selectedProject.id || ''}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-300 text-xs flex-shrink-0">
                Selected
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-accent p-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">{user.initials}</span>
                    </div>
                    <div className="text-sm hidden lg:block">
                      <p className="text-muted-foreground truncate max-w-[150px]">Logged in as: {user.email}</p>
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
            <Button onClick={() => setIsLoginModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-sm lg:text-base">
              <User className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Login</span>
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