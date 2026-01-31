'use client';

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface BulkDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    fileIds: string[];
    fileNames: string[];
    onSuccess?: () => void;
}

export default function BulkDeleteDialog({
    isOpen,
    onClose,
    fileIds,
    fileNames,
    onSuccess,
}: BulkDeleteDialogProps) {
    const { toast } = useToast();
    const [deleting, setDeleting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleDelete = async () => {
        if (fileIds.length === 0) return;

        setDeleting(true);
        setProgress({ current: 0, total: fileIds.length });

        let successCount = 0;
        let failCount = 0;

        try {
            for (let i = 0; i < fileIds.length; i++) {
                try {
                    const response = await fetch(`/api/files/${fileIds[i]}`, {
                        method: 'DELETE',
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
                    title: 'Deleted',
                    description: `${successCount} item(s) moved to trash${failCount > 0 ? `, ${failCount} failed` : ''}`,
                });
                onSuccess?.();
            } else {
                throw new Error('All deletions failed');
            }
            onClose();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to delete items',
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const getDisplayTitle = () => {
        if (fileNames.length === 1) {
            return 'Delete Item';
        }
        return `Delete ${fileNames.length} Items`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md overflow-hidden">
                <DialogHeader className="min-w-0 overflow-hidden">
                    <DialogTitle className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <Trash2 size={20} className="text-red-600" />
                        {getDisplayTitle()}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Warning message */}
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-red-800 font-medium">
                                Are you sure you want to move these items to trash?
                            </p>
                            <p className="text-sm text-red-600 mt-1">
                                You can restore them from the Trash folder later.
                            </p>
                        </div>
                    </div>

                    {/* File list preview */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-2">
                            {fileNames.length} item(s) will be moved to trash:
                        </p>
                        <div className="max-h-32 overflow-auto">
                            <ul className="text-sm text-gray-700 space-y-1">
                                {fileNames.slice(0, 5).map((name, index) => (
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
                                {fileNames.length > 5 && (
                                    <li className="text-gray-500">
                                        ...and {fileNames.length - 5} more
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    {deleting && progress.total > 0 && (
                        <div>
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Deleting files...</span>
                                <span>{progress.current} / {progress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={deleting} className="bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                        {deleting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Move to Trash
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
