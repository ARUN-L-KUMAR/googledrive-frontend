'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  trashedAt: string;
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TrashPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrashedFiles();
  }, []);

  const fetchTrashedFiles = async () => {
    try {
      const response = await fetch('/api/files?trash=true');
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        setFiles(files.filter((f) => f._id !== fileId));
      }
    } catch (err) {
      console.error('Failed to restore file');
    }
  };

  const handlePermanentDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/permanent`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles(files.filter((f) => f._id !== fileId));
      }
    } catch (err) {
      console.error('Failed to delete file');
    }
  };

  return (
    <DashboardLayout currentPage="trash">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
          <p className="text-gray-600 mt-2">Deleted items are permanently removed after 30 days</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Your trash is empty</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Deleted</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 max-w-[250px]">
                      <span
                        className="block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis text-gray-900"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(file.trashedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(file._id)}
                          className="gap-2"
                        >
                          <RotateCcw size={16} />
                          Restore
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Trash2 size={16} />
                              Delete Forever
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription className="min-w-0">
                                This action cannot be undone. This will permanently delete
                                <span
                                  className="font-semibold text-gray-900 block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis"
                                  title={file.name}
                                >
                                  {file.name}
                                </span>
                                and remove it from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handlePermanentDelete(file._id)}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                              >
                                Delete Forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
