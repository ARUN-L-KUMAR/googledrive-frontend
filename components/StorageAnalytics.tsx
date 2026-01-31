'use client';

import { useEffect, useState } from 'react';
import { HardDrive, Image, Video, FileText, Music, File, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AnalyticsData {
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    storageUsed: number;
    storageLimit: number;
    byType: {
        images: { count: number; size: number };
        videos: { count: number; size: number };
        documents: { count: number; size: number };
        audio: { count: number; size: number };
        other: { count: number; size: number };
    };
    largestFiles: Array<{
        _id: string;
        name: string;
        size: number;
        mimeType?: string;
    }>;
}

const TYPE_CONFIG = {
    images: { icon: Image, color: 'pink', label: 'Images' },
    videos: { icon: Video, color: 'purple', label: 'Videos' },
    documents: { icon: FileText, color: 'blue', label: 'Documents' },
    audio: { icon: Music, color: 'green', label: 'Audio' },
    other: { icon: File, color: 'gray', label: 'Other' },
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function StorageAnalytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/files/analytics');
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            setAnalytics(data);
        } catch (err) {
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                </div>
            </Card>
        );
    }

    if (error || !analytics) {
        return (
            <Card className="p-6">
                <p className="text-red-600 text-center">{error || 'Failed to load'}</p>
            </Card>
        );
    }

    const usagePercent = (analytics.storageUsed / analytics.storageLimit) * 100;

    // Calculate percentages for each type
    const typeEntries = Object.entries(analytics.byType) as Array<[keyof typeof TYPE_CONFIG, { count: number; size: number }]>;
    const maxSize = Math.max(...typeEntries.map(([, data]) => data.size));

    return (
        <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2">
                <TrendingUp size={24} className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Storage Analytics</h2>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{analytics.totalFiles}</p>
                    <p className="text-sm text-gray-600">Files</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">{analytics.totalFolders}</p>
                    <p className="text-sm text-gray-600">Folders</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{formatBytes(analytics.totalSize)}</p>
                    <p className="text-sm text-gray-600">Total Used</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">{usagePercent.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Storage Used</p>
                </div>
            </div>

            {/* Storage Bar */}
            <div>
                <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-700">
                        {formatBytes(analytics.storageUsed)} of {formatBytes(analytics.storageLimit)} used
                    </span>
                    <span className="text-gray-500">
                        {formatBytes(analytics.storageLimit - analytics.storageUsed)} free
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-600'
                            }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                </div>
            </div>

            {/* File Type Breakdown */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage by Type</h3>
                <div className="space-y-3">
                    {typeEntries.map(([type, data]) => {
                        const config = TYPE_CONFIG[type];
                        const Icon = config.icon;
                        const percentage = maxSize > 0 ? (data.size / maxSize) * 100 : 0;
                        const colors: Record<string, string> = {
                            pink: 'bg-pink-500',
                            purple: 'bg-purple-500',
                            blue: 'bg-blue-500',
                            green: 'bg-green-500',
                            gray: 'bg-gray-500',
                        };

                        return (
                            <div key={type} className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                                    <Icon size={18} className={`text-${config.color}-600`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700">{config.label}</span>
                                        <span className="text-gray-500">
                                            {data.count} files • {formatBytes(data.size)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${colors[config.color]}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Largest Files */}
            {analytics.largestFiles.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Largest Files</h3>
                    <div className="space-y-2">
                        {analytics.largestFiles.map((file, index) => (
                            <div
                                key={file._id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                    <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-sm font-medium text-gray-600 flex-shrink-0">
                                        {index + 1}
                                    </span>
                                    <span
                                        className="text-gray-900 block max-w-[200px] truncate whitespace-nowrap overflow-hidden text-ellipsis"
                                        title={file.name}
                                    >
                                        {file.name}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-600">{formatBytes(file.size)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
