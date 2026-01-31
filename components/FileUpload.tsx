'use client';

import React from "react"

import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (file: any) => void;
  parentId?: string;
}

export default function FileUpload({
  isOpen,
  onClose,
  onUploadComplete,
  parentId,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const newFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpload = async () => {
    setError('');
    setUploading(true);

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (parentId) {
          formData.append('parentId', parentId);
        }

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Upload failed');
        }

        const data = await response.json();
        onUploadComplete?.(data.file);

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: 100,
        }));
      } catch (err) {
        setError(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setFiles([]);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700 font-medium mb-1">Drag and drop files here</p>
          <p className="text-gray-500 text-sm mb-4">or</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Browse Files
          </Button>
        </div>

        {files.length > 0 && (
          <div className="space-y-2 w-full overflow-hidden">
            <p className="text-sm font-medium text-gray-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg gap-2 w-full min-w-0 overflow-hidden">
                  <span
                    className="text-sm text-gray-700 block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis flex-1"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  {uploadProgress[file.name] === 100 ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                  ) : (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50 flex-shrink-0"
                      disabled={uploading}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
