'use client';

import { Button } from '@/components/ui/button';
import {
    X,
    Trash2,
    FolderInput,
    Copy,
    Share2,
    FolderPlus,
    CheckSquare,
} from 'lucide-react';

interface SelectedFile {
    _id: string;
    name: string;
    type: 'file' | 'folder';
}

interface SelectionActionBarProps {
    totalFiles: number;
    selectedCount: number;
    selectedFiles: SelectedFile[];
    onMoveSelected: () => void;
    onCopySelected: () => void;
    onDeleteSelected: () => void;
    onShareSelected: () => void;
    onCreateFolderFromSelected: () => void;
    onClearSelection: () => void;
}

export default function SelectionActionBar({
    totalFiles,
    selectedCount,
    selectedFiles,
    onMoveSelected,
    onCopySelected,
    onDeleteSelected,
    onShareSelected,
    onCreateFolderFromSelected,
    onClearSelection,
}: SelectionActionBarProps) {
    const remainingCount = totalFiles - selectedCount;

    // Check if any folders are selected (some operations only work on files)
    const hasOnlyFiles = selectedFiles.every(item => item.type === 'file');

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300 w-[calc(100%-2rem)] max-w-fit">
            <div className="bg-gray-900/95 backdrop-blur-lg rounded-xl md:rounded-2xl shadow-2xl border border-gray-700/50 px-3 py-3 md:px-6 md:py-4">
                <div className="flex items-center gap-2 md:gap-6">
                    {/* Selection Info - Hidden on small screens */}
                    <div className="hidden sm:flex items-center gap-3 pr-4 md:pr-6 border-r border-gray-700">
                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full">
                            <CheckSquare size={16} className="text-white md:hidden" />
                            <CheckSquare size={20} className="text-white hidden md:block" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-base md:text-lg">
                                {selectedCount} selected
                            </p>
                            <p className="text-gray-400 text-xs md:text-sm">
                                {remainingCount} remaining
                            </p>
                        </div>
                    </div>

                    {/* Mobile-only selection count */}
                    <div className="sm:hidden flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                            <CheckSquare size={14} className="text-white" />
                        </div>
                        <span className="text-white font-semibold text-sm">{selectedCount}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 md:gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onMoveSelected}
                            className="text-gray-300 hover:text-white hover:bg-gray-700/50 gap-2"
                            title="Move selected"
                        >
                            <FolderInput size={18} />
                            <span className="hidden sm:inline">Move</span>
                        </Button>

                        {hasOnlyFiles && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCopySelected}
                                className="text-gray-300 hover:text-white hover:bg-gray-700/50 gap-2"
                                title="Copy selected"
                            >
                                <Copy size={18} />
                                <span className="hidden sm:inline">Copy</span>
                            </Button>
                        )}

                        {hasOnlyFiles && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onShareSelected}
                                className="text-gray-300 hover:text-white hover:bg-gray-700/50 gap-2"
                                title="Share selected"
                            >
                                <Share2 size={18} />
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCreateFolderFromSelected}
                            className="text-gray-300 hover:text-white hover:bg-gray-700/50 gap-2"
                            title="Create folder with selected"
                        >
                            <FolderPlus size={18} />
                            <span className="hidden sm:inline">New Folder</span>
                        </Button>

                        <div className="w-px h-6 md:h-8 bg-gray-700 mx-1 md:mx-2" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDeleteSelected}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 gap-2"
                            title="Delete selected"
                        >
                            <Trash2 size={18} />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>

                        <div className="w-px h-6 md:h-8 bg-gray-700 mx-1 md:mx-2" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearSelection}
                            className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                            title="Clear selection"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
