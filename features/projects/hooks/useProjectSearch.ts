import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { ProjectsService } from '../services/projects.service';
import type { Project, ProjectCatalog } from '../types';

export interface ProjectSearchState {
  searchTerm: string;
  status: string;
  type: string;
  priority: string;
  sortBy: 'name' | 'progress' | 'budget' | 'startDate';
  sortOrder: 'asc' | 'desc';
}

export interface ProjectSearchResult {
  projects: Project[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATE: ProjectSearchState = {
  searchTerm: '',
  status: '',
  type: '',
  priority: '',
  sortBy: 'name',
  sortOrder: 'asc'
};

export function useProjectSearch(initialState: Partial<ProjectSearchState> = {}) {
  const [searchState, setSearchState] = useState<ProjectSearchState>({
    ...DEFAULT_STATE,
    ...initialState
  });
  
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchState.searchTerm, 250);

  // Load initial data
  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);
        const catalog = await ProjectsService.getProjectCatalog();
        setAllProjects(catalog.projects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        console.error('useProjectSearch: Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...allProjects];

    // Text search
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(term) ||
        project.location.toLowerCase().includes(term) ||
        project.manager.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (searchState.status) {
      filtered = filtered.filter(project => 
        project.status.toLowerCase() === searchState.status.toLowerCase()
      );
    }

    // Type filter
    if (searchState.type) {
      filtered = filtered.filter(project =>
        project.type.toLowerCase() === searchState.type.toLowerCase()
      );
    }

    // Priority filter
    if (searchState.priority) {
      filtered = filtered.filter(project =>
        project.priority.toLowerCase() === searchState.priority.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[searchState.sortBy];
      let bValue: any = b[searchState.sortBy];

      // Handle different data types
      if (searchState.sortBy === 'startDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return searchState.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return searchState.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [allProjects, debouncedSearchTerm, searchState]);

  // Update search state
  const updateSearchState = (updates: Partial<ProjectSearchState>) => {
    setSearchState(prev => ({ ...prev, ...updates }));
  };

  // Reset search
  const resetSearch = () => {
    setSearchState(DEFAULT_STATE);
  };

  // URL sync helpers (for future implementation)
  const getSearchParams = (): URLSearchParams => {
    const params = new URLSearchParams();
    if (searchState.searchTerm) params.set('q', searchState.searchTerm);
    if (searchState.status) params.set('status', searchState.status);
    if (searchState.type) params.set('type', searchState.type);
    if (searchState.priority) params.set('priority', searchState.priority);
    if (searchState.sortBy !== 'name') params.set('sort', searchState.sortBy);
    if (searchState.sortOrder !== 'asc') params.set('order', searchState.sortOrder);
    return params;
  };

  const result: ProjectSearchResult = {
    projects: filteredProjects,
    totalCount: filteredProjects.length,
    loading,
    error
  };

  return {
    searchState,
    updateSearchState,
    resetSearch,
    getSearchParams,
    result
  };
}