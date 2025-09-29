import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import type { FormItem } from '../types';

interface UseFormSearchOptions {
  forms: FormItem[];
  initialSearchTerm?: string;
  initialCategory?: string;
  initialStatus?: string;
}

export function useFormSearch({
  forms,
  initialSearchTerm = '',
  initialCategory = 'all',
  initialStatus = 'all'
}: UseFormSearchOptions) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus);
  const [sortBy, setSortBy] = useState<'title' | 'updatedAt' | 'category'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  const filteredAndSortedForms = useMemo(() => {
    let filtered = forms.filter(form => {
      const matchesSearch = form.form_title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           form.form_description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           form.form_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = category === 'all' || form.form_category === category;
      const matchesStatus = status === 'all' || form.form_status.toLowerCase() === status.toLowerCase();
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;
      
      if (sortBy === 'title') {
        aValue = a.form_title;
        bValue = b.form_title;
      } else if (sortBy === 'category') {
        aValue = a.form_category;
        bValue = b.form_category;
      } else if (sortBy === 'updatedAt') {
        aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      }
      
      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [forms, debouncedSearchTerm, category, status, sortBy, sortOrder]);

  const paginatedForms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedForms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedForms, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedForms.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, category, status]);

  return {
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    status,
    setStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    filteredForms: filteredAndSortedForms,
    paginatedForms,
    totalPages,
    totalItems: filteredAndSortedForms.length
  };
}