'use client';

import { useState, useEffect } from 'react';
import { FolderInput, Folder, Loader2, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface BulkMoveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    fileIds: string[];
    fileNames: string[];
    onSuccess?: () => void;
}

interface FolderItem {
    _id: string;
    name: string;
}

export default function BulkMoveDialog({ isOpen, onClose, fileIds, fileNames, onSuccess }: BulkMoveDialogProps) {
    const { toast } = useToast();
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [currentPath, setCurrentPath] = useState<FolderItem[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [moving, setMoving] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

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
            setProgress({ current: 0, total: 0 });
        }
    }, [isOpen]);

    const fetchFolders = async (parentId: string | null) => {
        setLoading(true);
        try {
            const url = parentId ? `/api/drive/folder/${parentId}` : '/api/drive/root';
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                // Filter to only show folders, exclude selected files
                const folderItems = (data.items || []).filter(
                    (item: any) => item.type === 'folder' && !fileIds.includes(item._id)
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

    const handleBulkMove = async () => {
        if (fileIds.length === 0) return;

        setMoving(true);
        setProgress({ current: 0, total: fileIds.length });

        let successCount = 0;
        let failCount = 0;

        try {
            for (let i = 0; i < fileIds.length; i++) {
                try {
                    const response = await fetch(`/api/files/${fileIds[i]}/move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetFolderId: currentFolderId }),
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch {
                    failCount++;
                }
                setProgress({ current: i + 1, total: fileIds.length });
            }

            if (successCount > 0) {
                toast({
                    title: 'Moved',
                    description: `${successCount} item(s) moved successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
                });
                onSuccess?.();
            } else {
                throw new Error('All moves failed');
            }
            onClose();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to move items',
                variant: 'destructive',
            });
        } finally {
            setMoving(false);
        }
    };

    const getDisplayTitle = () => {
        if (fileNames.length === 1) {
            const name = fileNames[0];
            const truncated = name.length > 30 ? name.substring(0, 30) + '...' : name;
            return `Move "${truncated}"`;
        }
        return `Move ${fileNames.length} items`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderInput size={20} className="text-blue-600 flex-shrink-0" />
                        <span className="truncate">{getDisplayTitle()}</span>
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

                    {/* Progress indicator */}
                    {moving && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Moving files...</span>
                                <span>{progress.current} / {progress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={moving} className="bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBulkMove}
                        disabled={moving}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {moving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Moving...
                            </>
                        ) : (
                            `Move here`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
