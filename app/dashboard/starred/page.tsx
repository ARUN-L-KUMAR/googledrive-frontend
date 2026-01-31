'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import FileList from '@/components/FileList';
import { List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  updatedAt: string;
  isStarred: boolean;
  s3Url?: string;
}

export default function StarredPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Load view preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('fileViewMode') as 'list' | 'grid' | null;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('fileViewMode', mode);
  };

  useEffect(() => {
    fetchStarredFiles();
  }, []);

  const fetchStarredFiles = async () => {
    try {
      const response = await fetch('/api/files?starred=true');
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstar = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: false }),
      });

      if (response.ok) {
        setFiles(files.filter((f) => f._id !== fileId));
      }
    } catch (err) {
      console.error('Failed to unstar file');
    }
  };

  return (
    <DashboardLayout currentPage="starred">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Starred Files</h1>
            <p className="text-gray-600 mt-2">Your favorite files and folders</p>
          </div>
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              title="List View"
            >
              <List size={18} />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
          </div>
        ) : (
          <FileList files={files} viewMode={viewMode} onStarClick={handleUnstar} />
        )}
      </div>
    </DashboardLayout>
  );
}
