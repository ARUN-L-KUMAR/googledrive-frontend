'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  File,
  Folder,
  MoreVertical,
  Star,
  Trash2,
  Download,
  Eye,
  Link,
  Image,
  FileText,
  Video,
  Music,
  Edit3,
  Info,
  FolderInput,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface FileItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  updatedAt: string;
  isStarred: boolean;
  s3Url?: string;
  thumbnailUrl?: string;
}

interface FileListProps {
  files: FileItem[];
  viewMode?: 'list' | 'grid';
  onStarClick?: (fileId: string, isStarred: boolean) => void;
  onDeleteClick?: (fileId: string) => void;
  onDownloadClick?: (fileId: string) => void;
  onFolderClick?: (folderId: string) => void;
  onPreviewClick?: (file: FileItem) => void;
  onShareClick?: (file: FileItem) => void;
  onMoveFile?: (fileId: string, targetFolderId: string) => void;
  onRenameClick?: (file: FileItem) => void;
  onFileInfoClick?: (file: FileItem) => void;
  onMoveToClick?: (file: FileItem) => void;
  onCopyClick?: (file: FileItem) => void;
  // Selection props
  selectedFiles?: Set<string>;
  onSelectionChange?: (selected: Set<string>, files: FileItem[]) => void;
  isSelectionMode?: boolean;
}

// Helper to determine if file is previewable
const isPreviewable = (mimeType?: string): boolean => {
  if (!mimeType) return false;
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json'
  );
};

// Get appropriate icon based on mimeType
const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <File className="w-5 h-5 text-gray-400 flex-shrink-0" />;
  if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-pink-500 flex-shrink-0" />;
  if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500 flex-shrink-0" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500 flex-shrink-0" />;
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />;
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  return <File className="w-5 h-5 text-gray-400 flex-shrink-0" />;
};

// Get large icon for grid view
const getLargeFileIcon = (mimeType?: string) => {
  if (!mimeType) return <File className="w-12 h-12 text-gray-400" />;
  if (mimeType.startsWith('image/')) return <Image className="w-12 h-12 text-pink-500" />;
  if (mimeType.startsWith('video/')) return <Video className="w-12 h-12 text-purple-500" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-12 h-12 text-green-500" />;
  if (mimeType === 'application/pdf') return <FileText className="w-12 h-12 text-red-500" />;
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return <FileText className="w-12 h-12 text-blue-500" />;
  return <File className="w-12 h-12 text-gray-400" />;
};

// Helper component for Grid View Thumbnail
const GridThumbnail = ({
  file,
  dragOverFolder
}: {
  file: FileItem;
  dragOverFolder: string | null;
}) => {
  const [imgError, setImgError] = useState(false);

  if (file.type === 'folder') {
    return (
      <Folder className={`w-14 h-14 ${dragOverFolder === file._id ? 'text-blue-600' : 'text-blue-500'}`} />
    );
  }

  // Image with thumbnail
  if (file.mimeType?.startsWith('image/') && file.thumbnailUrl && !imgError) {
    return (
      <img
        src={file.thumbnailUrl}
        alt={file.name}
        className="w-full h-full object-cover rounded-lg"
        onError={() => setImgError(true)}
      />
    );
  }

  // Video with thumbnail using video tag
  if (file.mimeType?.startsWith('video/') && file.thumbnailUrl && !imgError) {
    return (
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden group/video">
        <video
          src={`${file.thumbnailUrl}#t=0.5`}
          className="w-full h-full object-cover"
          preload="metadata"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/video:bg-black/20 transition-colors">
          <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm">
            <div className="w-0 h-0 border-l-[12px] border-l-purple-600 border-y-[8px] border-y-transparent ml-1" />
          </div>
        </div>
      </div>
    );
  }

  // Audio with album art thumbnail
  if (file.mimeType?.startsWith('audio/') && file.thumbnailUrl && !imgError) {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <img
          src={file.thumbnailUrl}
          alt={`${file.name} album art`}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="w-10 h-10 bg-green-500/90 rounded-full flex items-center justify-center shadow-lg">
            <Music className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  // Audio fallback - styled music icon
  if (file.mimeType?.startsWith('audio/')) {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/5" />
        <Music className="w-12 h-12 text-white/90 relative z-10" />
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <p className="text-[10px] text-white/80 font-medium truncate px-1">
            {file.name.replace(/\.[^/.]+$/, '')}
          </p>
        </div>
      </div>
    );
  }

  // Fallback for everything else (or failed image)
  return getLargeFileIcon(file.mimeType);
};

export default function FileList({
  files,
  viewMode = 'list',
  onStarClick,
  onDeleteClick,
  onDownloadClick,
  onFolderClick,
  onPreviewClick,
  onShareClick,
  onMoveFile,
  onRenameClick,
  onFileInfoClick,
  onMoveToClick,
  onCopyClick,
  selectedFiles = new Set(),
  onSelectionChange,
  isSelectionMode = false,
}: FileListProps) {
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Mouse drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if an element intersects with the selection box
  const elementsIntersect = useCallback((rect1: DOMRect, rect2: { x: number; y: number; width: number; height: number }) => {
    return !(
      rect1.right < rect2.x ||
      rect1.left > rect2.x + rect2.width ||
      rect1.bottom < rect2.y ||
      rect1.top > rect2.y + rect2.height
    );
  }, []);

  // Calculate selection box dimensions
  const getSelectionBox = useCallback(() => {
    if (!selectionStart || !selectionEnd) return null;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;

    return {
      x: Math.min(selectionStart.x, selectionEnd.x) - containerRect.left,
      y: Math.min(selectionStart.y, selectionEnd.y) - containerRect.top,
      width: Math.abs(selectionEnd.x - selectionStart.x),
      height: Math.abs(selectionEnd.y - selectionStart.y),
    };
  }, [selectionStart, selectionEnd]);

  // Handle mouse down for drag selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag selection on empty space (not on file items)
    const target = e.target as HTMLElement;
    const isEmptySpace = target === containerRef.current ||
      target.classList.contains('file-list-container') ||
      target.classList.contains('file-grid-container');

    if (isEmptySpace && e.button === 0) {
      e.preventDefault();
      setIsDragging(true);
      setSelectionStart({ x: e.clientX, y: e.clientY });
      setSelectionEnd({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // Handle mouse move for drag selection
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setSelectionEnd({ x: e.clientX, y: e.clientY });

      const selectionBox = getSelectionBox();
      if (selectionBox && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const absoluteBox = {
          x: selectionBox.x + containerRect.left,
          y: selectionBox.y + containerRect.top,
          width: selectionBox.width,
          height: selectionBox.height,
        };

        const newSelected = new Set<string>();
        const selectedFileItems: FileItem[] = [];

        itemRefs.current.forEach((element, fileId) => {
          const itemRect = element.getBoundingClientRect();
          if (elementsIntersect(itemRect, absoluteBox)) {
            newSelected.add(fileId);
            const file = files.find(f => f._id === fileId);
            if (file) selectedFileItems.push(file);
          }
        });

        onSelectionChange?.(newSelected, selectedFileItems);
      }
    }
  }, [isDragging, getSelectionBox, elementsIntersect, files, onSelectionChange]);

  // Handle mouse up for drag selection
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isDragging]);

  // Add global mouse listeners for drag selection
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle checkbox/selection click
  const handleSelectionClick = (e: React.MouseEvent, file: FileItem, index: number) => {
    e.stopPropagation();

    const newSelected = new Set(selectedFiles);
    const selectedFileItems: FileItem[] = [];

    if (e.shiftKey && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelected.add(files[i]._id);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      if (newSelected.has(file._id)) {
        newSelected.delete(file._id);
      } else {
        newSelected.add(file._id);
      }
    } else {
      // Single selection (replace)
      if (newSelected.has(file._id) && newSelected.size === 1) {
        newSelected.delete(file._id);
      } else {
        newSelected.clear();
        newSelected.add(file._id);
      }
    }

    // Build selected file items array
    files.forEach(f => {
      if (newSelected.has(f._id)) {
        selectedFileItems.push(f);
      }
    });

    setLastSelectedIndex(index);
    onSelectionChange?.(newSelected, selectedFileItems);
  };

  // Handle row click - files open preview, folders navigate
  const handleRowClick = (e: React.MouseEvent, file: FileItem, index: number) => {
    // If ctrl/cmd is held, treat as selection
    if (e.ctrlKey || e.metaKey) {
      handleSelectionClick(e, file, index);
      return;
    }

    // If shift is held, treat as range selection
    if (e.shiftKey) {
      handleSelectionClick(e, file, index);
      return;
    }

    // Clear selection and perform normal action
    if (selectedFiles.size > 0) {
      onSelectionChange?.(new Set(), []);
    }

    if (file.type === 'folder') {
      onFolderClick?.(file._id);
    } else if (isPreviewable(file.mimeType)) {
      onPreviewClick?.(file);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFile(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e: React.DragEvent, file: FileItem) => {
    e.preventDefault();
    if (file.type === 'folder' && draggedFile && draggedFile !== file._id) {
      setDragOverFolder(file._id);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolder: FileItem) => {
    e.preventDefault();
    if (targetFolder.type === 'folder' && draggedFile && draggedFile !== targetFolder._id) {
      onMoveFile?.(draggedFile, targetFolder._id);
    }
    setDraggedFile(null);
    setDragOverFolder(null);
  };

  // Store ref for each item
  const setItemRef = useCallback((fileId: string, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(fileId, element);
    } else {
      itemRefs.current.delete(fileId);
    }
  }, []);

  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No files yet. Upload or create a folder to get started.</p>
      </div>
    );
  }

  // Grid View Card Actions Menu (reusable component)
  const renderActionsMenu = (file: FileItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Preview - only for previewable files */}
        {file.type === 'file' && isPreviewable(file.mimeType) && (
          <DropdownMenuItem onClick={() => onPreviewClick?.(file)} className="gap-2">
            <Eye size={16} />
            Preview
          </DropdownMenuItem>
        )}

        {/* File operations */}
        {file.type === 'file' && (
          <>
            <DropdownMenuItem onClick={() => onDownloadClick?.(file._id)} className="gap-2">
              <Download size={16} />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShareClick?.(file)} className="gap-2">
              <Link size={16} />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Common operations for both files and folders */}
        <DropdownMenuItem onClick={() => onRenameClick?.(file)} className="gap-2">
          <Edit3 size={16} />
          Rename
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onFileInfoClick?.(file)} className="gap-2">
          <Info size={16} />
          File Info
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onMoveToClick?.(file)} className="gap-2">
          <FolderInput size={16} />
          Move to...
        </DropdownMenuItem>

        {file.type === 'file' && (
          <DropdownMenuItem onClick={() => onCopyClick?.(file)} className="gap-2">
            <Copy size={16} />
            Make a copy
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onStarClick?.(file._id, !file.isStarred)}
          className="gap-2"
        >
          <Star
            size={16}
            className={file.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}
          />
          {file.isStarred ? 'Remove from Starred' : 'Add to Starred'}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDeleteClick?.(file._id)}
          className="gap-2 text-red-600"
        >
          <Trash2 size={16} />
          Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Selection box overlay
  const selectionBox = getSelectionBox();

  // Grid View Rendering
  if (viewMode === 'grid') {
    return (
      <div
        ref={containerRef}
        className="relative file-grid-container"
        onMouseDown={handleMouseDown}
      >
        {/* Selection box overlay */}
        {isDragging && selectionBox && (
          <div
            className="absolute pointer-events-none bg-blue-500/20 border-2 border-blue-500 rounded z-50"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map((file, index) => {
            const isSelected = selectedFiles.has(file._id);
            return (
              <div
                key={file._id}
                ref={(el) => setItemRef(file._id, el)}
                className={`group relative bg-white rounded-xl border-2 p-4 hover:shadow-lg transition-all cursor-pointer
                  ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}
                  ${dragOverFolder === file._id ? 'bg-blue-50 border-blue-400 shadow-lg' : ''}
                  ${draggedFile === file._id ? 'opacity-50' : ''}`}
                onClick={(e) => handleRowClick(e, file, index)}
                draggable={file.type === 'file'}
                onDragStart={(e) => handleDragStart(e, file._id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, file)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, file)}
              >
                {/* Selection checkbox */}
                <div
                  className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected || isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  onClick={(e) => handleSelectionClick(e, file, index)}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-blue-600' : 'bg-white/90 border border-gray-300 hover:border-blue-500'}`}
                  >
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                </div>

                {/* Star indicator */}
                {file.isStarred && (
                  <div className="absolute top-2 left-10">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  </div>
                )}

                {/* Actions menu */}
                <div
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white/90 rounded-full shadow-sm">
                    {renderActionsMenu(file)}
                  </div>
                </div>

                {/* Icon or Thumbnail */}
                <div className="flex items-center justify-center h-24 mb-3 overflow-hidden rounded-lg">
                  <GridThumbnail file={file} dragOverFolder={dragOverFolder} />
                </div>

                {/* File name */}
                <p
                  className="text-sm font-medium text-gray-900 text-center block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis"
                  title={file.name}
                >
                  {file.name}
                </p>

                {/* File size for files */}
                {file.type === 'file' && (
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {formatFileSize(file.size || 0)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // List View Rendering (original table view)
  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden file-list-container"
      onMouseDown={handleMouseDown}
    >
      {/* Selection box overlay */}
      {isDragging && selectionBox && (
        <div
          className="absolute pointer-events-none bg-blue-500/20 border-2 border-blue-500 rounded z-50"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-3 py-3 text-left w-10">
              <Checkbox
                checked={selectedFiles.size === files.length && files.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    const allIds = new Set(files.map(f => f._id));
                    onSelectionChange?.(allIds, files);
                  } else {
                    onSelectionChange?.(new Set(), []);
                  }
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Modified</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, index) => {
            const isSelected = selectedFiles.has(file._id);
            return (
              <tr
                key={file._id}
                ref={(el) => setItemRef(file._id, el)}
                className={`border-b border-gray-200 transition-colors cursor-pointer
                  ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  ${dragOverFolder === file._id ? 'bg-blue-50 border-blue-300' : ''}
                  ${draggedFile === file._id ? 'opacity-50' : ''}`}
                onClick={(e) => handleRowClick(e, file, index)}
                draggable={file.type === 'file'}
                onDragStart={(e) => handleDragStart(e, file._id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, file)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, file)}
              >
                <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedFiles);
                      if (checked) {
                        newSelected.add(file._id);
                      } else {
                        newSelected.delete(file._id);
                      }
                      const selectedFileItems = files.filter(f => newSelected.has(f._id));
                      setLastSelectedIndex(index);
                      onSelectionChange?.(newSelected, selectedFileItems);
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </td>
                <td className="px-6 py-4 max-w-[250px]">
                  <div className="flex items-center gap-3 min-w-0">
                    {file.type === 'folder' ? (
                      <Folder className={`w-5 h-5 flex-shrink-0 ${dragOverFolder === file._id ? 'text-blue-600' : 'text-blue-500'}`} />
                    ) : (
                      getFileIcon(file.mimeType)
                    )}
                    <span
                      className="block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis text-gray-900 font-medium"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    {file.isStarred && (
                      <Star size={14} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {file.type === 'folder' ? '—' : formatFileSize(file.size || 0)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(file.updatedAt)}</td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  {renderActionsMenu(file)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
