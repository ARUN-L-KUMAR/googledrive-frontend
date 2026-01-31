'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchHandlerProps {
  onSearchQueryChange: (query: string) => void;
  onSearchTypeChange: (type: string) => void;
  onSearchOpenChange: (open: boolean) => void;
  searchQuery: string;
  setSearchOpen: (open: boolean) => void;
}

export default function SearchHandler({
  onSearchQueryChange,
  onSearchTypeChange,
  onSearchOpenChange,
  searchQuery,
  setSearchOpen
}: SearchHandlerProps) {
  const searchParams = useSearchParams();

  // Initialize search from URL
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      onSearchQueryChange(q);
      onSearchOpenChange(true);
    }
    const type = searchParams.get('type');
    if (type) {
      onSearchTypeChange(type);
    }
  }, [searchParams, onSearchQueryChange, onSearchTypeChange, onSearchOpenChange]);

  // Close search when query is cleared
  useEffect(() => {
    if (searchQuery === '') {
      setSearchOpen(false);
    }
  }, [searchQuery, setSearchOpen]);

  return null;
}