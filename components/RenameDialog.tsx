'use client';

import { useState } from 'react';
import { Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface RenameDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        _id: string;
        name: string;
        type: 'file' | 'folder';
    } | null;
    onSuccess?: () => void;
}

export default function RenameDialog({ isOpen, onClose, file, onSuccess }: RenameDialogProps) {
    const { toast } = useToast();
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    // Set initial name when dialog opens
    const handleOpenChange = (open: boolean) => {
        if (open && file) {
            setNewName(file.name);
        } else {
            setNewName('');
        }
        if (!open) onClose();
    };

    const handleRename = async () => {
        if (!file || !newName.trim() || newName === file.name) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/files/${file._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() }),
            });

            if (!response.ok) {
                throw new Error('Failed to rename');
            }

            toast({
                title: 'Renamed',
                description: `${file.type === 'folder' ? 'Folder' : 'File'} renamed successfully`,
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to rename item',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="w-full max-w-md overflow-hidden">
                <DialogHeader className="min-w-0 overflow-hidden">
                    <DialogTitle className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <Edit3 size={20} className="text-blue-600 flex-shrink-0" />
                        Rename {file?.type === 'folder' ? 'Folder' : 'File'}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New name
                    </label>
                    <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter new name"
                        disabled={loading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                        }}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading} className="bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRename}
                        disabled={loading || !newName.trim() || newName === file?.name}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Renaming...
                            </>
                        ) : (
                            'Rename'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
