import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getDashboardStats } from '../features/dashboard/services/dashboard.service';
import { getRuntimeConfig } from '../services/api/runtime';
import type { DashboardStats } from '../features/dashboard/types';

export function HomePage() {
  console.log('HomePage: Component rendering...');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const handleCreateNewForm = () => {
    const config = getRuntimeConfig();
    if (config.routing === true) {
      // React Router mode
      window.location.href = '/projects';
    } else {
      // Manual routing mode
      if (typeof (window as any).manualNavigate === 'function') {
        (window as any).manualNavigate('/projects');
      } else {
        console.warn('HomePage: manualNavigate function not available, using fallback');
        window.location.href = '/projects';
      }
    }
  };

  const handleBatchProcessing = () => {
    const config = getRuntimeConfig();
    if (config.routing === true) {
      // React Router mode
      window.location.href = '/batch';
    } else {
      // Manual routing mode
      if (typeof (window as any).manualNavigate === 'function') {
        (window as any).manualNavigate('/batch');
      } else {
        console.warn('HomePage: manualNavigate function not available, using fallback');
        window.location.href = '/batch';
      }
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      console.log('🏠 HomePage: Starting to load dashboard stats...');
      try {
        console.log('🏠 HomePage: Calling dashboard service');
        const data = await getDashboardStats();
        console.log('🏠 HomePage: Successfully received data:', data);
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        // Fallback data
        setStats({
          formsGenerated: { total: 124, thisMonth: 124, change: "+12%" },
          activeProjects: { total: 18, inProgress: 18, change: "+3" },
          processingTime: { average: "2.3s", unit: "seconds", change: "-0.5s" },
          lastUpdated: "2024-09-21T07:18:00Z"
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Construction Form Generator</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your dashboard. Here's an overview of your form generation activities.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Forms Generated Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-green-800">
                Forms Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-1">
                {stats.formsGenerated.total}
              </div>
              <p className="text-sm text-green-700">
                this month
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {stats.formsGenerated.change}
                </span>
                <span className="text-green-600 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-blue-800">
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {stats.activeProjects.total}
              </div>
              <p className="text-sm text-blue-700">
                in progress
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-blue-600 font-medium">
                  {stats.activeProjects.change}
                </span>
                <span className="text-blue-600 ml-1">new projects</span>
              </div>
            </CardContent>
          </Card>

          {/* Processing Time Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-purple-800">
                Avg Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {stats.processingTime.average}
              </div>
              <p className="text-sm text-purple-700">
                per form
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-purple-600 font-medium">
                  {stats.processingTime.change}
                </span>
                <span className="text-purple-600 ml-1">improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleCreateNewForm}
              className="p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div className="font-semibold text-foreground">Create New Form</div>
              <div className="text-sm text-muted-foreground mt-1">Start by selecting a project</div>
            </button>
            <button 
              onClick={handleBatchProcessing}
              className="p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div className="font-semibold text-foreground">Batch Processing</div>
              <div className="text-sm text-muted-foreground mt-1">Process multiple forms at once</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Recent form generation activities will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}