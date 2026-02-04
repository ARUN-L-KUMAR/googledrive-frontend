'use client';

import { Info, File, Folder, Calendar, HardDrive, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface FileInfoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        _id: string;
        name: string;
        type: 'file' | 'folder';
        mimeType?: string;
        size?: number;
        updatedAt: string;
        isStarred: boolean;
    } | null;
}

const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function FileInfoDialog({ isOpen, onClose, file }: FileInfoDialogProps) {
    if (!file) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md overflow-hidden">
                <DialogHeader className="min-w-0 overflow-hidden">
                    <DialogTitle className="flex items-center gap-2">
                        <Info size={20} className="text-blue-600 flex-shrink-0" />
                        {file.type === 'folder' ? 'Folder' : 'File'} Information
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* File Icon and Name */}
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        {file.type === 'folder' ? (
                            <Folder className="w-10 h-10 text-blue-500 flex-shrink-0" />
                        ) : (
                            <File className="w-10 h-10 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 w-0 min-w-0">
                            <p
                                className="font-semibold text-foreground truncate"
                                title={file.name}
                            >
                                {file.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{file.type === 'folder' ? 'Folder' : 'File'}</p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                        {file.type === 'file' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <FileType size={18} className="text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Type</p>
                                        <p className="text-foreground">{file.mimeType || 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <HardDrive size={18} className="text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Size</p>
                                        <p className="text-foreground">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Modified</p>
                                <p className="text-foreground">{formatDate(file.updatedAt)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${file.isStarred ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                            <div>
                                <p className="text-sm text-muted-foreground">Starred</p>
                                <p className="text-foreground">{file.isStarred ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
