import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Moon, Sun, Settings, Palette } from 'lucide-react';

export function SettingsPage() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6"> {/* mobile-only: reduced padding */}
      <div className="flex items-center gap-3 mb-4 lg:mb-6"> {/* mobile-only: reduced margin */}
        <Settings className="h-6 w-6 lg:h-8 lg:w-8 text-primary" /> {/* mobile-only: smaller icon */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1> {/* mobile-only: smaller heading */}
          <p className="text-muted-foreground text-sm lg:text-base">Manage your application preferences</p> {/* mobile-only: smaller text */}
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 max-w-2xl"> {/* mobile-only: reduced gap */}
        {/* Appearance Settings */}
        <Card>
          <CardHeader className="pb-3 lg:pb-6"> {/* mobile-only: reduced padding */}
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg"> {/* mobile-only: smaller title */}
              <Palette className="h-4 w-4 lg:h-5 lg:w-5" />
              Appearance
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm"> {/* mobile-only: smaller text */}
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 lg:space-y-4"> {/* mobile-only: reduced spacing */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                  aria-label="Toggle dark mode"
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Theme Preview</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="space-y-2">
                    <div className="h-2 bg-primary rounded"></div>
                    <div className="h-2 bg-muted rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-muted">
                  <div className="space-y-2">
                    <div className="h-2 bg-primary/60 rounded"></div>
                    <div className="h-2 bg-muted-foreground/40 rounded w-3/4"></div>
                    <div className="h-2 bg-muted-foreground/40 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Application details and version information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Application</span>
              <span className="text-sm text-muted-foreground">Construction Form Generator</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Theme</span>
              <span className="text-sm text-muted-foreground capitalize">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}