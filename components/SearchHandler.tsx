'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchHandlerProps {
  onSearchQueryChange: (query: string) => void;
  onSearchTypeChange: (type: string) => void;
  onSearchOpenChange: (open: boolean) => void;
  searchQuery: string;
  searchType: string;
  setSearchOpen: (open: boolean) => void;
}

export default function SearchHandler({
  onSearchQueryChange,
  onSearchTypeChange,
  onSearchOpenChange,
  searchQuery,
  searchType,
  setSearchOpen
}: SearchHandlerProps) {
  const searchParams = useSearchParams();

  // Initialize search from URL
  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    
    // Only update if values have actually changed to prevent infinite loops
    if (q && q !== searchQuery) {
      onSearchQueryChange(q);
    }
    if (type && type !== searchType) {
      onSearchTypeChange(type);
    }
    
    // Keep search open if there's a query
    if (q) {
      onSearchOpenChange(true);
    }
  }, [searchParams]); // Remove the other dependencies to prevent circular updates

  // Close search when query is cleared
  useEffect(() => {
    if (searchQuery === '') {
      setSearchOpen(false);
    }
  }, [searchQuery, setSearchOpen]);

  return null;
}