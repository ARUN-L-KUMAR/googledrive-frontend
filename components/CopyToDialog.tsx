'use client';

import { useState, useEffect } from 'react';
import { Copy, Folder, Loader2, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CopyToDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        _id: string;
        name: string;
        type: 'file' | 'folder';
    } | null;
    onSuccess?: () => void;
}

interface FolderItem {
    _id: string;
    name: string;
}

export default function CopyToDialog({ isOpen, onClose, file, onSuccess }: CopyToDialogProps) {
    const { toast } = useToast();
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [currentPath, setCurrentPath] = useState<FolderItem[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);

    // Fetch folders when dialog opens or folder changes
    useEffect(() => {
        if (isOpen) {
            fetchFolders(currentFolderId);
        }
    }, [isOpen, currentFolderId]);

    // Reset when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentFolderId(null);
            setCurrentPath([]);
            setFolders([]);
        }
    }, [isOpen]);

    const fetchFolders = async (parentId: string | null) => {
        setLoading(true);
        try {
            const url = parentId ? `/api/drive/folder/${parentId}` : '/api/drive/root';
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                // Filter to only show folders
                const folderItems = (data.items || []).filter(
                    (item: any) => item.type === 'folder'
                );
                setFolders(folderItems);
            }
        } catch (err) {
            console.error('Failed to fetch folders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder: FolderItem) => {
        setCurrentPath([...currentPath, folder]);
        setCurrentFolderId(folder._id);
    };

    const handleNavigateToRoot = () => {
        setCurrentPath([]);
        setCurrentFolderId(null);
    };

    const handleNavigateToPath = (index: number) => {
        const newPath = currentPath.slice(0, index + 1);
        setCurrentPath(newPath);
        setCurrentFolderId(newPath[newPath.length - 1]._id);
    };

    const handleCopy = async () => {
        if (!file) return;

        setCopying(true);
        try {
            const response = await fetch(`/api/files/${file._id}/copy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetFolderId: currentFolderId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to copy');
            }

            toast({
                title: 'File copied',
                description: `${file.name} copied successfully`,
            });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to copy file',
                variant: 'destructive',
            });
        } finally {
            setCopying(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy size={20} className="text-blue-600 flex-shrink-0" />
                        <span className="truncate">
                            Copy "{file?.name && file.name.length > 30 ? file.name.substring(0, 30) + '...' : file?.name}"
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Breadcrumb navigation */}
                    <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
                        <button
                            onClick={handleNavigateToRoot}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                            <Home size={14} />
                            My Drive
                        </button>
                        {currentPath.map((folder, index) => (
                            <div key={folder._id} className="flex items-center gap-1">
                                <ChevronRight size={14} className="text-gray-400" />
                                <button
                                    onClick={() => handleNavigateToPath(index)}
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    {folder.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Folder list */}
                    <div className="border rounded-lg max-h-64 overflow-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-blue-600" size={24} />
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No folders here
                            </div>
                        ) : (
                            folders.map((folder) => (
                                <button
                                    key={folder._id}
                                    onClick={() => handleFolderClick(folder)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b last:border-b-0 min-w-0 overflow-hidden"
                                >
                                    <Folder size={20} className="text-blue-500 flex-shrink-0" />
                                    <span
                                        className="block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis text-gray-900"
                                        title={folder.name}
                                    >
                                        {folder.name}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <p className="text-sm text-gray-500 mt-3">
                        A copy will be created in the selected location
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={copying} className="bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCopy}
                        disabled={copying}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {copying ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Copying...
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                Copy here
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
