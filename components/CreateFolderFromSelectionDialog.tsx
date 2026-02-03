'use client';

import { useState, useEffect } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CreateFolderFromSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFileIds: string[];
    selectedFileNames: string[];
    currentFolderId: string | null;
    onSuccess?: () => void;
}

export default function CreateFolderFromSelectionDialog({
    isOpen,
    onClose,
    selectedFileIds,
    selectedFileNames,
    currentFolderId,
    onSuccess,
}: CreateFolderFromSelectionDialogProps) {
    const { toast } = useToast();
    const [folderName, setFolderName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setFolderName('');
            setError('');
            setProgress({ current: 0, total: 0 });
        }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!folderName.trim()) {
            setError('Please enter a folder name');
            return;
        }

        setCreating(true);
        setError('');

        try {
            // First create the folder
            const createResponse = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: folderName.trim(),
                    parentId: currentFolderId,
                }),
            });

            if (!createResponse.ok) {
                const data = await createResponse.json();
                throw new Error(data.error || 'Failed to create folder');
            }

            const newFolder = await createResponse.json();

            // Then move all selected files to the new folder
            setProgress({ current: 0, total: selectedFileIds.length });
            let successCount = 0;

            for (let i = 0; i < selectedFileIds.length; i++) {
                try {
                    const moveResponse = await fetch(`/api/files/${selectedFileIds[i]}/move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetFolderId: newFolder._id }),
                    });
                    if (moveResponse.ok) {
                        successCount++;
                    }
                } catch {
                    // Continue with other files
                }
                setProgress({ current: i + 1, total: selectedFileIds.length });
            }

            toast({
                title: 'Folder created',
                description: `Created "${folderName}" and moved ${successCount} item(s)`,
            });

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create folder');
        } finally {
            setCreating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !creating) {
            handleCreate();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md overflow-hidden">
                <DialogHeader className="min-w-0 overflow-hidden">
                    <DialogTitle className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <FolderPlus size={20} className="text-blue-600 flex-shrink-0" />
                        Create Folder with Selection
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Folder Name
                        </label>
                        <Input
                            value={folderName}
                            onChange={(e) => {
                                setFolderName(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter folder name"
                            disabled={creating}
                            autoFocus
                            className="w-full"
                        />
                        {error && (
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground mb-2">
                            {selectedFileIds.length} item(s) will be moved to this folder:
                        </p>
                        <div className="max-h-32 overflow-auto">
                            <ul className="text-sm text-gray-700 space-y-1">
                                {selectedFileNames.slice(0, 5).map((name, index) => (
                                    <li key={index} className="flex min-w-0">
                                        <span className="mr-1 flex-shrink-0">•</span>
                                        <span
                                            className="flex-1 w-0 truncate"
                                            title={name}
                                        >
                                            {name}
                                        </span>
                                    </li>
                                ))}
                                {selectedFileNames.length > 5 && (
                                    <li className="text-gray-500">
                                        ...and {selectedFileNames.length - 5} more
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    {creating && progress.total > 0 && (
                        <div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
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
                    <Button variant="outline" onClick={onClose} disabled={creating} className="bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={creating || !folderName.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {creating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <FolderPlus size={16} />
                                Create Folder
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
