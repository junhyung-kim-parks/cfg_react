import { useState, useEffect, useRef } from 'react';
import { Search, BarChart3, Calendar, Table as TableIcon, Activity, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../components/ui/pagination';
import { ProjectsService } from '../features/projects/services/projects.service';
import { useProject } from '../contexts/ProjectContext';
import { useFormGenerator } from '../contexts/FormGeneratorContext';
import { getRuntimeConfig } from '../services/api/runtime';
import type { Project, ProjectStats, ProjectCatalog } from '../features/projects/types';

export function ProjectSearchPage() {
  const { setSelectedProject } = useProject();
  const { setSelectedProject: setFormGenProject, setCurrentStep } = useFormGenerator();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const hasMounted = useRef(false);

  // Set current step when component mounts
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setCurrentStep('project-search');
    }
  }, []); // Empty dependency array since we only want this to run once on mount

  // Helper function to calculate stats from project data
  const calculateStats = (projectList: Project[]): ProjectStats => {
    const total = projectList.length;
    
    // Active includes: Design, Procurement, Construction, Active
    const activeStatuses = ['design', 'procurement', 'construction', 'active'];
    const active = projectList.filter(p => 
      activeStatuses.includes(p.pi_park_contract_status.toLowerCase())
    ).length;
    
    const completed = projectList.filter(p => 
      p.pi_park_contract_status.toLowerCase() === 'completed'
    ).length;
    
    const planning = projectList.filter(p => 
      p.pi_park_contract_status.toLowerCase() === 'planning'
    ).length;
    
    const design = projectList.filter(p => 
      p.pi_park_contract_status.toLowerCase() === 'design'
    ).length;
    
    const construction = projectList.filter(p => 
      p.pi_park_contract_status.toLowerCase() === 'construction'
    ).length;
    
    const procurement = projectList.filter(p => 
      p.pi_park_contract_status.toLowerCase() === 'procurement'
    ).length;
    
    const totalBudget = projectList.reduce((sum, p) => sum + (p.pi_total_project_funding_amount || 0), 0);
    const totalSpent = projectList.reduce((sum, p) => sum + (p.pi_registration_amount || 0), 0);
    
    return {
      total,
      active,
      completed,
      planning,
      design,
      construction,
      procurement,
      totalBudget,
      totalSpent
    };
  };

  useEffect(() => {
    async function loadProjects() {
      console.log('🏗️ ProjectSearchPage: Starting to load projects...');
      try {
        console.log('🏗️ ProjectSearchPage: Calling ProjectsService.getProjectCatalog()');
        const data = await ProjectsService.getProjectCatalog();
        console.log('🏗️ ProjectSearchPage: Successfully received data:', data);
        
        // Ensure data structure is valid
        if (!data || !Array.isArray(data.projects)) {
          console.warn('🏗️ ProjectSearchPage: Invalid data structure received, using empty arrays');
          setProjects([]);
          setStats({
            total: 0,
            active: 0,
            completed: 0,
            planning: 0,
            design: 0,
            construction: 0,
            procurement: 0,
            totalBudget: 0,
            totalSpent: 0
          });
          setFilteredProjects([]);
        } else {
          setProjects(data.projects);
          // Calculate stats from actual project data instead of using provided stats
          const calculatedStats = calculateStats(data.projects);
          setStats(calculatedStats);
          setFilteredProjects(data.projects);
          console.log('🏗️ ProjectSearchPage: State updated successfully with calculated stats:', calculatedStats);
        }
      } catch (error) {
        console.error('ProjectSearchPage: Failed to load projects:', error);
        // Set empty data as fallback
        setProjects([]);
        setStats({
          total: 0,
          active: 0,
          completed: 0,
          planning: 0,
          design: 0,
          construction: 0,
          procurement: 0,
          totalBudget: 0,
          totalSpent: 0
        });
        setFilteredProjects([]);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  useEffect(() => {
    async function handleSearch() {
      // Reset to first page when search changes
      setCurrentPage(1);
      
      if (searchTerm.trim() === '') {
        setFilteredProjects(projects);
        // Reset stats to all projects when no search
        setStats(calculateStats(projects));
        return;
      }

      try {
        const searchResult = await ProjectsService.searchProjects(searchTerm);
        setFilteredProjects(searchResult.projects);
        // Calculate stats from filtered results
        const filteredStats = calculateStats(searchResult.projects);
        setStats(filteredStats);
      } catch (error) {
        console.error('ProjectSearchPage: Search failed:', error);
        // Fallback to client-side filtering
        const filtered = projects.filter(project =>
          project.pi_short_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.pi_park_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.pi_managing_design_team_unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.pi_managing_construction_team_unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.pi_project_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.pi_park_contract_no.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProjects(filtered);
        // Calculate stats from client-side filtered results
        const filteredStats = calculateStats(filtered);
        setStats(filteredStats);
      }
    }

    // Debounce search
    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, projects]);

  const formatCurrency = (amount: number) => {
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'procurement':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'construction':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUnitColor = (unit: string) => {    
    // Color coding for design/construction units
    switch (unit?.toLowerCase()) {
      case 'architecture':
      case 'engineering':
          return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bronx':
      case 'brooklyn':
      case 'queens':
          return 'bg-green-100 text-green-800 border-green-200';
      case 'staten island':
          return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'manhattan':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';  
      case 'building construction unit':
      case 'environmental remediation unit':
      case 'construction quality assurance':        
          return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'forestry horticulture natural resources':
      case 'natural resources group':
          return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'historic houses':
      case 'capital partner projects':
      case 'capital projects':
      case 'green thumb':
          return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'technical services':
          return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleProjectSelect = (project: Project) => {
    console.log('🎯 ProjectSearchPage: Selecting project for Form Generator:', project);
    
    // Update both contexts
    setSelectedProject(project);
    setFormGenProject(project);
    setCurrentStep('form-picker');
    
    // Navigate to form picker with project info
    const projectData = encodeURIComponent(JSON.stringify(project));
    const targetPath = `/forms/picker?project=${projectData}`;
    
    // Check routing configuration
    const config = getRuntimeConfig();
    const useReactRouter = config.routing === true;
    
    if (useReactRouter) {
      // React Router navigation (for routing: true)
      console.log('🎯 ProjectSearchPage: Using React Router navigation to:', targetPath);
      window.location.href = targetPath; // Simple approach for React Router
    } else {
      // Manual navigation (for routing: false)
      console.log('🎯 ProjectSearchPage: Using manual navigation to:', targetPath);
      if (typeof (window as any).manualNavigate === 'function') {
        (window as any).manualNavigate(targetPath);
      } else {
        // Fallback for direct navigation
        window.history.pushState({}, '', targetPath);
        window.dispatchEvent(new Event('popstate'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">NYC Parks Project Search</h1>
        <p className="text-gray-600">Search and manage NYC Parks construction projects</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TableIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl text-blue-600 mt-1">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl text-green-600 mt-1">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl text-green-600 mt-1">{formatCurrency(stats.totalBudget)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">$</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="text-2xl text-green-800 mt-1">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-800 text-lg">$</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="search">Search Projects</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg text-gray-900 mb-2">NYC Parks Project Search</h3>
                  <p className="text-sm text-gray-600">Search and filter NYC Parks construction projects by park, team, contract number, and other criteria</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search projects, parks, teams, contract numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {filteredProjects.length > itemsPerPage 
                      ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProjects.length)} of ${filteredProjects.length} projects`
                      : `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''} found`
                    }
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                    >
                      Cards
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Table */}
          {viewMode === 'table' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-4 text-sm text-gray-600">Project</th>
                        <th className="text-left p-4 text-sm text-gray-600">Type</th>
                        <th className="text-left p-4 text-sm text-gray-600">Status</th>
                        <th className="text-left p-4 text-sm text-gray-600">Park</th>
                        <th className="text-left p-4 text-sm text-gray-600">Progress</th>
                        <th className="text-left p-4 text-sm text-gray-600">Budget</th>
                        <th className="text-left p-4 text-sm text-gray-600">Design Team</th>
                        <th className="text-left p-4 text-sm text-gray-600">Construction Team</th>
                        <th className="text-left p-4 text-sm text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPageProjects.map((project) => (
                        <tr key={project.project_id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="text-sm text-gray-900">{project.pi_short_description}</p>
                              <p className="text-xs text-gray-500">{project.pi_park_contract_no}</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{project.pi_project_type}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(project.pi_park_contract_status)}>
                              {project.pi_park_contract_status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{project.pi_park_name}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${project.pi_progress_to_date}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{project.pi_progress_to_date}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {formatCurrency(project.pi_total_project_funding_amount)}
                          </td>
                          <td className="p-4">
                            <Badge className={getUnitColor(project.pi_managing_design_team_unit)}>
                              {project.pi_managing_design_team_unit}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getUnitColor(project.pi_managing_construction_team_unit)}>
                              {project.pi_managing_construction_team_unit}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleProjectSelect(project)}
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects Cards */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPageProjects.map((project) => (
                <Card key={project.project_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm text-gray-900 line-clamp-2">{project.pi_short_description}</h3>
                        <Badge className={getStatusColor(project.pi_park_contract_status)}>
                          {project.pi_park_contract_status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs text-gray-600">
                        <p><span className="font-medium">Contract No:</span> {project.pi_park_contract_no}</p>
                        <p><span className="font-medium">Type:</span> {project.pi_project_type}</p>
                        <p><span className="font-medium">Park:</span> {project.pi_park_name}</p>
                        <p><span className="font-medium">Budget:</span> {formatCurrency(project.pi_total_project_funding_amount)}</p>
                        <p><span className="font-medium">Design Team:</span> {project.pi_managing_design_team_unit}</p>
                        <p><span className="font-medium">Construction Team:</span> {project.pi_managing_construction_team_unit}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Progress</span>
                          <span className="text-xs text-gray-600">{project.pi_progress_to_date}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${project.pi_progress_to_date}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col gap-1">
                          <Badge className={getUnitColor(project.pi_managing_design_team_unit)}>
                            {project.pi_managing_design_team_unit}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleProjectSelect(project)}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {filteredProjects.length > itemsPerPage && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else {
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, startPage + 4);
                      pageNumber = startPage + i;
                      if (pageNumber > endPage) return null;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg mb-2">Map View</h3>
                  <p className="text-sm">Interactive map showing project locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}