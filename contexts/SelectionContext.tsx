'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FileItem {
    _id: string;
    name: string;
    type: 'file' | 'folder';
    mimeType?: string;
    size?: number;
}

interface SelectionContextType {
    selectedFiles: Set<string>;
    selectedFileDetails: Map<string, FileItem>;
    isSelectionMode: boolean;
    lastSelectedId: string | null;
    selectFile: (file: FileItem) => void;
    deselectFile: (fileId: string) => void;
    toggleSelect: (file: FileItem) => void;
    selectAll: (files: FileItem[]) => void;
    selectRange: (files: FileItem[], startId: string, endId: string) => void;
    clearSelection: () => void;
    isSelected: (fileId: string) => boolean;
    getSelectedCount: () => number;
    getSelectedFiles: () => FileItem[];
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [selectedFileDetails, setSelectedFileDetails] = useState<Map<string, FileItem>>(new Map());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    const isSelectionMode = selectedFiles.size > 0;

    const selectFile = useCallback((file: FileItem) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            newSet.add(file._id);
            return newSet;
        });
        setSelectedFileDetails(prev => {
            const newMap = new Map(prev);
            newMap.set(file._id, file);
            return newMap;
        });
        setLastSelectedId(file._id);
    }, []);

    const deselectFile = useCallback((fileId: string) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
        });
        setSelectedFileDetails(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
        });
    }, []);

    const toggleSelect = useCallback((file: FileItem) => {
        if (selectedFiles.has(file._id)) {
            deselectFile(file._id);
        } else {
            selectFile(file);
        }
    }, [selectedFiles, selectFile, deselectFile]);

    const selectAll = useCallback((files: FileItem[]) => {
        const newSet = new Set<string>();
        const newMap = new Map<string, FileItem>();
        files.forEach(file => {
            newSet.add(file._id);
            newMap.set(file._id, file);
        });
        setSelectedFiles(newSet);
        setSelectedFileDetails(newMap);
        if (files.length > 0) {
            setLastSelectedId(files[files.length - 1]._id);
        }
    }, []);

    const selectRange = useCallback((files: FileItem[], startId: string, endId: string) => {
        const startIndex = files.findIndex(f => f._id === startId);
        const endIndex = files.findIndex(f => f._id === endId);

        if (startIndex === -1 || endIndex === -1) return;

        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);

        const newSet = new Set<string>(selectedFiles);
        const newMap = new Map<string, FileItem>(selectedFileDetails);

        for (let i = minIndex; i <= maxIndex; i++) {
            newSet.add(files[i]._id);
            newMap.set(files[i]._id, files[i]);
        }

        setSelectedFiles(newSet);
        setSelectedFileDetails(newMap);
        setLastSelectedId(endId);
    }, [selectedFiles, selectedFileDetails]);

    const clearSelection = useCallback(() => {
        setSelectedFiles(new Set());
        setSelectedFileDetails(new Map());
        setLastSelectedId(null);
    }, []);

    const isSelected = useCallback((fileId: string) => {
        return selectedFiles.has(fileId);
    }, [selectedFiles]);

    const getSelectedCount = useCallback(() => {
        return selectedFiles.size;
    }, [selectedFiles]);

    const getSelectedFiles = useCallback(() => {
        return Array.from(selectedFileDetails.values());
    }, [selectedFileDetails]);

    return (
        <SelectionContext.Provider
            value={{
                selectedFiles,
                selectedFileDetails,
                isSelectionMode,
                lastSelectedId,
                selectFile,
                deselectFile,
                toggleSelect,
                selectAll,
                selectRange,
                clearSelection,
                isSelected,
                getSelectedCount,
                getSelectedFiles,
            }}
        >
            {children}
        </SelectionContext.Provider>
    );
}

export function useSelection() {
    const context = useContext(SelectionContext);
    if (context === undefined) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
}
