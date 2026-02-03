'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FileList from '@/components/FileList';
import FilePreviewModal from '@/components/FilePreviewModal';
import ShareDialog from '@/components/ShareDialog';
import RenameDialog from '@/components/RenameDialog';
import FileInfoDialog from '@/components/FileInfoDialog';
import MoveToDialog from '@/components/MoveToDialog';
import CopyToDialog from '@/components/CopyToDialog';
import SelectionActionBar from '@/components/SelectionActionBar';
import BulkMoveDialog from '@/components/BulkMoveDialog';
import BulkCopyDialog from '@/components/BulkCopyDialog';
import BulkDeleteDialog from '@/components/BulkDeleteDialog';
import CreateFolderFromSelectionDialog from '@/components/CreateFolderFromSelectionDialog';
import { AlertCircle, ChevronRight, Home, List, LayoutGrid, Upload, FolderPlus, ArrowLeft, AlertTriangle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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

interface Breadcrumb {
  _id: string;
  name: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [homeFilter, setHomeFilter] = useState('all');

  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFileDetails, setSelectedFileDetails] = useState<FileItem[]>([]);

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

  // Dialog states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameFile, setRenameFile] = useState<FileItem | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [infoFile, setInfoFile] = useState<FileItem | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [moveFile, setMoveFile] = useState<FileItem | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [copyFile, setCopyFile] = useState<FileItem | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);

  // Bulk dialog states
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkCopyOpen, setBulkCopyOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [createFolderFromSelectionOpen, setCreateFolderFromSelectionOpen] = useState(false);

  // Single file delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Get folder ID from URL and fetch files
  useEffect(() => {
    const folderId = searchParams.get('folder');
    setCurrentFolderId(folderId);
    // Clear selection when folder changes
    setSelectedFiles(new Set());
    setSelectedFileDetails([]);

    // Fetch files directly with the folder ID from URL to avoid stale state
    fetchFilesWithFolderId(folderId);
  }, [searchParams]);

  // Refetch when homeFilter changes
  useEffect(() => {
    const folderId = searchParams.get('folder');
    fetchFilesWithFolderId(folderId);
  }, [homeFilter]);

  // Handle Ctrl+A keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A or Cmd+A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        // Only if not in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          handleSelectAll();
        }
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedFiles(new Set());
        setSelectedFileDetails([]);
      }

      // Delete key to delete selected
      if (e.key === 'Delete' && selectedFiles.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, selectedFiles]);

  const fetchFilesWithFolderId = async (folderId: string | null) => {
    try {
      setLoading(true);
      setError('');

      const searchQuery = searchParams.get('q');
      let url = '';

      if (searchQuery) {
        // If searching, use search API
        // We can also pass 'type' from URL or homeFilter if needed
        const type = searchParams.get('type') || homeFilter || 'all';
        url = `/api/files/search?q=${encodeURIComponent(searchQuery)}&type=${type}`;
      } else {
        // Normal folder browsing
        url = '/api/drive/root';
        if (folderId) {
          url = `/api/drive/folder/${folderId}`;
        }
        // Add filter parameter
        if (homeFilter && homeFilter !== 'all') {
          url += `?type=${homeFilter}`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();

      if (searchQuery) {
        // Search results structure might be slightly different
        // Search API returns { results: [...] }
        // Drive API returns { items: [...], breadcrumbs: [...] }
        setFiles(data.results || []);
        setBreadcrumbs([]); // Clear breadcrumbs on search
      } else if (folderId) {
        setFiles(data.items || []);
        setBreadcrumbs(data.breadcrumbs || []);
      } else {
        setFiles(data.items || []);
        setBreadcrumbs([]);
      }
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Wrapper function for use by handlers that don't have the folder ID
  const fetchFiles = () => {
    const folderId = searchParams.get('folder');
    fetchFilesWithFolderId(folderId);
  };

  // Selection handlers
  const handleSelectionChange = useCallback((selected: Set<string>, fileDetails: FileItem[]) => {
    setSelectedFiles(selected);
    setSelectedFileDetails(fileDetails);
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(files.map(f => f._id));
    setSelectedFiles(allIds);
    setSelectedFileDetails(files);
    toast({
      title: 'Selected all',
      description: `${files.length} items selected`,
    });
  }, [files, toast]);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setSelectedFileDetails([]);
  }, []);

  // Bulk action handlers
  const handleBulkMove = () => {
    if (selectedFiles.size > 0) {
      setBulkMoveOpen(true);
    }
  };

  const handleBulkCopy = () => {
    const filesOnly = selectedFileDetails.filter(f => f.type === 'file');
    if (filesOnly.length > 0) {
      setBulkCopyOpen(true);
    }
  };

  const handleBulkDelete = () => {
    if (selectedFiles.size > 0) {
      setBulkDeleteOpen(true);
    }
  };

  const handleBulkDeleteSuccess = () => {
    setFiles(prevFiles => prevFiles.filter(f => !selectedFiles.has(f._id)));
    clearSelection();
  };

  const handleBulkShare = () => {
    // Share the first selected file (or show a message for multiple)
    const filesOnly = selectedFileDetails.filter(f => f.type === 'file');
    if (filesOnly.length === 1) {
      setShareFile(filesOnly[0]);
      setShareOpen(true);
    } else if (filesOnly.length > 1) {
      toast({
        title: 'Multiple files selected',
        description: 'Please select one file at a time to share, or share files individually.',
      });
    }
  };

  const handleBulkFileInfo = () => {
    if (selectedFileDetails.length === 1) {
      setInfoFile(selectedFileDetails[0]);
      setInfoOpen(true);
    } else if (selectedFileDetails.length > 1) {
      // Create a summary "file" object for bulk selection
      const totalSize = selectedFileDetails.reduce((acc, curr) => acc + (curr.size || 0), 0);
      const isMixed = selectedFileDetails.some(f => f.type !== selectedFileDetails[0].type);
      const type = isMixed ? 'Mixed' : selectedFileDetails[0].type === 'folder' ? 'Folders' : 'Files';

      const summaryFile: FileItem = {
        _id: 'bulk-selection',
        name: `${selectedFileDetails.length} items selected`,
        type: 'file', // Use file type to render generic info
        size: totalSize,
        mimeType: `${selectedFileDetails.length} items (${type})`,
        updatedAt: new Date().toISOString(),
        isStarred: false,
      };

      setInfoFile(summaryFile);
      setInfoOpen(true);
    }
  };

  const handleCreateFolderFromSelection = () => {
    if (selectedFiles.size > 0) {
      setCreateFolderFromSelectionOpen(true);
    }
  };

  const handleCreateFolderFromSelectionSuccess = () => {
    clearSelection();
    fetchFiles();
  };

  const handleBulkMoveSuccess = () => {
    clearSelection();
    fetchFiles();
  };

  const handleBulkCopySuccess = () => {
    clearSelection();
    fetchFiles();
  };

  const handleFolderClick = (folderId: string) => {
    router.push(`/dashboard?folder=${folderId}`);
  };

  const handleNavigateToRoot = () => {
    router.push('/dashboard');
  };

  const handleBreadcrumbClick = (folderId: string) => {
    router.push(`/dashboard?folder=${folderId}`);
  };

  const handleStarClick = async (fileId: string, isStarred: boolean) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred }),
      });

      if (response.ok) {
        setFiles(files.map((f) => (f._id === fileId ? { ...f, isStarred } : f)));
        toast({
          title: isStarred ? 'Starred' : 'Unstarred',
          description: `Item ${isStarred ? 'added to' : 'removed from'} starred`,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update star status',
        variant: 'destructive',
      });
    }
  };

  // Show delete confirmation dialog
  const handleDeleteClick = (fileId: string) => {
    const file = files.find((f) => f._id === fileId);
    if (file) {
      setFileToDelete(file);
      setDeleteDialogOpen(true);
    }
  };

  // Confirm and execute single file deletion
  const confirmDelete = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/files/${fileToDelete._id}`, { method: 'DELETE' });
      if (response.ok) {
        setFiles(files.filter((f) => f._id !== fileToDelete._id));
        toast({
          title: 'Deleted',
          description: 'Item moved to trash',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDownloadClick = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`);
      if (!response.ok) {
        throw new Error('Failed to get download link');
      }

      const data = await response.json();
      window.open(data.url, '_blank');

      toast({
        title: 'Download started',
        description: 'Your file download has started',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewClick = (file: FileItem) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleShareClick = (file: FileItem) => {
    setShareFile(file);
    setShareOpen(true);
  };

  const handleRenameClick = (file: FileItem) => {
    setRenameFile(file);
    setRenameOpen(true);
  };

  const handleFileInfoClick = (file: FileItem) => {
    setInfoFile(file);
    setInfoOpen(true);
  };

  const handleMoveToClick = (file: FileItem) => {
    setMoveFile(file);
    setMoveOpen(true);
  };

  const handleCopyClick = (file: FileItem) => {
    setCopyFile(file);
    setCopyOpen(true);
  };

  const handleMoveFile = async (fileId: string, targetFolderId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolderId }),
      });

      if (response.ok) {
        setFiles(files.filter((f) => f._id !== fileId));
        toast({
          title: 'File moved',
          description: 'File has been moved successfully',
        });
      } else {
        throw new Error('Failed to move file');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to move file',
        variant: 'destructive',
      });
    }
  };

  const handleFolderCreated = () => {
    fetchFiles();
    toast({
      title: 'Folder created',
      description: 'New folder has been created successfully',
    });
  };

  const handleUploadComplete = () => {
    fetchFiles();
    toast({
      title: 'Upload complete',
      description: 'Your file has been uploaded successfully',
    });
  };

  return (
    <DashboardLayout
      currentPage="files"
      currentFolderId={currentFolderId}
      onFolderCreated={handleFolderCreated}
      onUploadComplete={handleUploadComplete}
      homeFilter={homeFilter}
      onHomeFilterChange={setHomeFilter}
    >
      {({ onUploadClick, onNewFolderClick }: { onUploadClick: () => void; onNewFolderClick: () => void }) => (
        <div className="space-y-6">
          {/* Header with Breadcrumbs */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              {/* Back Button - shows when inside a folder */}
              {currentFolderId && (
                <button
                  onClick={() => {
                    // Navigate to parent folder or root
                    if (breadcrumbs.length > 1) {
                      handleBreadcrumbClick(breadcrumbs[breadcrumbs.length - 2]._id);
                    } else {
                      handleNavigateToRoot();
                    }
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors mr-2"
                  title="Go back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <button
                onClick={handleNavigateToRoot}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Home size={16} />
                <span>My Drive</span>
              </button>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <div key={crumb._id} className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                    {isLast ? (
                      <span
                        className="text-gray-900 block max-w-[150px] truncate whitespace-nowrap overflow-hidden text-ellipsis"
                        title={crumb.name}
                      >
                        {crumb.name}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBreadcrumbClick(crumb._id)}
                        className="hover:text-blue-600 transition-colors block max-w-[150px] truncate whitespace-nowrap overflow-hidden text-ellipsis"
                        title={crumb.name}
                      >
                        {crumb.name}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-3xl font-bold text-gray-900 block max-w-xl truncate whitespace-nowrap overflow-hidden text-ellipsis"
                  title={searchParams.get('q') ? `Search: ${searchParams.get('q')}` : (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'My Files')}
                >
                  {searchParams.get('q') ? (
                    `Search Results: "${searchParams.get('q')}"`
                  ) : (
                    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'My Files'
                  )}
                </h1>
                <p className="text-gray-600 mt-2">Manage and organize your cloud storage</p>
              </div>
              {/* Actions and View Toggle */}
              <div className="flex items-center gap-3">
                {/* Upload and New Folder Buttons */}
                <Button
                  onClick={onUploadClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  size="sm"
                >
                  <Upload size={18} />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent"
                  size="sm"
                  onClick={onNewFolderClick}
                >
                  <FolderPlus size={18} />
                  <span className="hidden sm:inline">New Folder</span>
                </Button>
                {/* View Toggle Buttons */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('list')}
                    className="gap-2"
                    title="List View"
                  >
                    <List size={18} />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('grid')}
                    className="gap-2"
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>
              <p className="text-gray-500 mt-4">Loading files...</p>
            </div>
          ) : (
            <FileList
              files={files}
              viewMode={viewMode}
              onStarClick={handleStarClick}
              onDeleteClick={handleDeleteClick}
              onDownloadClick={handleDownloadClick}
              onFolderClick={handleFolderClick}
              onPreviewClick={handlePreviewClick}
              onShareClick={handleShareClick}
              onMoveFile={handleMoveFile}
              onRenameClick={handleRenameClick}
              onFileInfoClick={handleFileInfoClick}
              onMoveToClick={handleMoveToClick}
              onCopyClick={handleCopyClick}
              selectedFiles={selectedFiles}
              onSelectionChange={handleSelectionChange}
              isSelectionMode={selectedFiles.size > 0}
            />
          )}

          {/* Selection Action Bar */}
          <SelectionActionBar
            totalFiles={files.length}
            selectedCount={selectedFiles.size}
            selectedFiles={selectedFileDetails}
            onMoveSelected={handleBulkMove}
            onCopySelected={handleBulkCopy}
            onDeleteSelected={handleBulkDelete}
            onShareSelected={handleBulkShare}
            onCreateFolderFromSelected={handleCreateFolderFromSelection}
            onClearSelection={clearSelection}
          />

          {/* Bulk Move Dialog */}
          <BulkMoveDialog
            isOpen={bulkMoveOpen}
            onClose={() => setBulkMoveOpen(false)}
            fileIds={Array.from(selectedFiles)}
            fileNames={selectedFileDetails.map(f => f.name)}
            onSuccess={handleBulkMoveSuccess}
          />

          {/* Bulk Copy Dialog */}
          <BulkCopyDialog
            isOpen={bulkCopyOpen}
            onClose={() => setBulkCopyOpen(false)}
            fileIds={selectedFileDetails.filter(f => f.type === 'file').map(f => f._id)}
            fileNames={selectedFileDetails.filter(f => f.type === 'file').map(f => f.name)}
            onSuccess={handleBulkCopySuccess}
          />

          {/* Bulk Delete Dialog */}
          <BulkDeleteDialog
            isOpen={bulkDeleteOpen}
            onClose={() => setBulkDeleteOpen(false)}
            fileIds={Array.from(selectedFiles)}
            fileNames={selectedFileDetails.map(f => f.name)}
            onSuccess={handleBulkDeleteSuccess}
          />

          {/* Create Folder From Selection Dialog */}
          <CreateFolderFromSelectionDialog
            isOpen={createFolderFromSelectionOpen}
            onClose={() => setCreateFolderFromSelectionOpen(false)}
            selectedFileIds={Array.from(selectedFiles)}
            selectedFileNames={selectedFileDetails.map(f => f.name)}
            currentFolderId={currentFolderId}
            onSuccess={handleCreateFolderFromSelectionSuccess}
          />

          {/* File Preview Modal */}
          <FilePreviewModal
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
            file={previewFile}
            onDownload={handleDownloadClick}
          />

          {/* Share Dialog */}
          <ShareDialog
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            file={shareFile}
          />

          {/* Rename Dialog */}
          <RenameDialog
            isOpen={renameOpen}
            onClose={() => setRenameOpen(false)}
            file={renameFile}
            onSuccess={fetchFiles}
          />

          {/* File Info Dialog */}
          <FileInfoDialog
            isOpen={infoOpen}
            onClose={() => setInfoOpen(false)}
            file={infoFile}
          />

          {/* Move To Dialog */}
          <MoveToDialog
            isOpen={moveOpen}
            onClose={() => setMoveOpen(false)}
            file={moveFile}
            onSuccess={fetchFiles}
          />

          {/* Copy To Dialog */}
          <CopyToDialog
            isOpen={copyOpen}
            onClose={() => setCopyOpen(false)}
            file={copyFile}
            onSuccess={fetchFiles}
          />

          {/* Single File Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="w-full max-w-md overflow-hidden">
              <DialogHeader className="min-w-0 overflow-hidden">
                <DialogTitle className={`flex items-center gap-2 ${fileToDelete?.isStarred ? 'text-amber-600' : 'text-red-600'}`}>
                  <AlertTriangle className="w-5 h-5" />
                  {fileToDelete?.isStarred ? 'Delete Starred Item?' : 'Move to Trash?'}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="text-sm text-muted-foreground space-y-3 pt-2">
                    {/* Special warning for starred files */}
                    {fileToDelete?.isStarred && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="text-amber-800 font-medium">
                          This item is starred!
                        </span>
                      </div>
                    )}
                    <p>You are about to move this item to trash:</p>
                    <div className="bg-gray-100 p-3 rounded-lg min-w-0 overflow-hidden">
                      <div className="flex min-w-0">
                        <span
                          className="flex-1 w-0 truncate font-semibold text-gray-900"
                          title={fileToDelete?.name}
                        >
                          {fileToDelete?.name}
                        </span>
                      </div>
                    </div>
                    {fileToDelete?.isStarred ? (
                      <p className="text-amber-700">You marked this item as important. Are you sure you want to delete it?</p>
                    ) : (
                      <p>You can restore it from the Trash folder later.</p>
                    )}
                  </div>
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
                  className="bg-transparent"
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
        </div>
      )}
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
