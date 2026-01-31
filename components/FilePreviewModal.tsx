'use client';

import { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        _id: string;
        name: string;
        mimeType?: string;
        size?: number;
    } | null;
    onDownload?: (fileId: string) => void;
}

const getPreviewType = (mimeType?: string): 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported' => {
    if (!mimeType) return 'unsupported';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/javascript' ||
        mimeType === 'application/xml'
    ) return 'text';
    return 'unsupported';
};

const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function FilePreviewModal({
    isOpen,
    onClose,
    file,
    onDownload,
}: FilePreviewModalProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (isOpen && file) {
            fetchPreviewUrl();
        } else {
            setPreviewUrl(null);
            setTextContent(null);
            setError(null);
            setZoom(1);
        }
    }, [isOpen, file]);

    const fetchPreviewUrl = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/files/${file._id}/preview`);
            if (!response.ok) {
                throw new Error('Failed to load preview');
            }

            const data = await response.json();
            setPreviewUrl(data.url);

            // For text files, fetch the content
            const previewType = getPreviewType(file.mimeType);
            if (previewType === 'text' && data.url) {
                try {
                    const textResponse = await fetch(data.url);
                    const text = await textResponse.text();
                    setTextContent(text);
                } catch {
                    setTextContent('Unable to load text content');
                }
            }
        } catch (err) {
            setError('Failed to load preview');
        } finally {
            setLoading(false);
        }
    };

    const previewType = file ? getPreviewType(file.mimeType) : 'unsupported';

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

    const renderPreview = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                </div>
            );
        }

        if (error || !previewUrl) {
            return (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <p>{error || 'Unable to preview this file'}</p>
                    <Button
                        variant="outline"
                        onClick={() => file && onDownload?.(file._id)}
                        className="mt-4 gap-2"
                    >
                        <Download size={16} />
                        Download Instead
                    </Button>
                </div>
            );
        }

        switch (previewType) {
            case 'image':
                return (
                    <div className={`flex items-center justify-center overflow-auto ${isFullscreen ? 'h-[85vh]' : 'h-[70vh]'}`}>
                        <img
                            src={previewUrl}
                            alt={file?.name}
                            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                );

            case 'pdf':
                return (
                    <iframe
                        src={previewUrl}
                        className="w-full h-[70vh] border-0 rounded-lg"
                        title={file?.name}
                    />
                );

            case 'video':
                return (
                    <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-[70vh] rounded-lg"
                        autoPlay={false}
                    >
                        Your browser does not support the video tag.
                    </video>
                );

            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center h-64 gap-6">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            <svg
                                className="w-16 h-16 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        </div>
                        <audio src={previewUrl} controls className="w-full max-w-md">
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                );

            case 'text':
                return (
                    <div className="max-h-[70vh] overflow-auto">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                            {textContent || 'Loading...'}
                        </pre>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                        <p>Preview not available for this file type</p>
                        <p className="text-sm mt-2 text-gray-400">{file?.mimeType || 'Unknown type'}</p>
                        <Button
                            variant="outline"
                            onClick={() => file && onDownload?.(file._id)}
                            className="mt-4 gap-2"
                        >
                            <Download size={16} />
                            Download File
                        </Button>
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl'
                    } p-0 overflow-hidden w-full`}
            >
                {/* Visually hidden title for screen readers */}
                <DialogTitle className="sr-only">{file?.name || 'File Preview'}</DialogTitle>

                {/* Header */}
                <div className="grid grid-cols-[1fr_auto] items-center p-4 border-b bg-gray-50 gap-4 overflow-hidden">
                    <div className="min-w-0 overflow-hidden flex-1">
                        <h3
                            className="font-semibold text-gray-900 block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis"
                            title={file?.name}
                        >
                            {file?.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                            {formatFileSize(file?.size)} • {file?.mimeType || 'Unknown type'}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        {previewType === 'image' && (
                            <>
                                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                                    <ZoomOut size={18} />
                                </Button>
                                <span className="text-sm text-gray-600 w-12 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                                    <ZoomIn size={18} />
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </Button>
                        {file && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDownload?.(file._id)}
                            >
                                <Download size={18} />
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="bg-gray-100 flex items-center justify-center">{renderPreview()}</div>
            </DialogContent>
        </Dialog>
    );
}
