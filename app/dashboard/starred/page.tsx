'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import FileList from '@/components/FileList';
import { List, LayoutGrid, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

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
  const { toast } = useToast();

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        toast({
          title: 'Removed from Starred',
          description: 'File has been removed from your starred items',
        });
      }
    } catch (err) {
      console.error('Failed to unstar file');
      toast({
        title: 'Error',
        description: 'Failed to unstar file',
        variant: 'destructive',
      });
    }
  };

  // Show confirmation dialog before deleting
  const handleDeleteClick = (fileId: string) => {
    const file = files.find((f) => f._id === fileId);
    if (file) {
      setFileToDelete(file);
      setDeleteDialogOpen(true);
    }
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/files/${fileToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles(files.filter((f) => f._id !== fileToDelete._id));
        toast({
          title: 'Moved to Trash',
          description: 'File has been moved to trash',
        });
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (err) {
      console.error('Failed to delete file');
      toast({
        title: 'Error',
        description: 'Failed to move file to trash',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  return (
    <DashboardLayout currentPage="starred">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Starred Files</h1>
            <p className="text-muted-foreground mt-2">Your favorite files and folders</p>
          </div>
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
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
          <FileList
            files={files}
            viewMode={viewMode}
            onStarClick={handleUnstar}
            onDeleteClick={handleDeleteClick}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog for Starred Files */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Starred File?
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <span className="text-amber-800 font-medium">
                  This file is starred!
                </span>
              </div>
              <p>
                You are about to move <strong className="text-foreground">{fileToDelete?.name}</strong> to trash.
              </p>
              <p className="mt-2 text-sm">
                You marked this file as important. Are you sure you want to delete it?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setFileToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Yes, Move to Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
