'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import {
    Upload,
    Trash2,
    Star,
    StarOff,
    FileEdit,
    FolderPlus,
    Share2,
    Link2Off,
    Move,
    Copy,
    RotateCcw,
    Trash,
    Key,
    UserCircle,
    File,
    Folder,
    Clock,
    Filter,
    Loader2,
    Image,
    Video,
    Music,
    FileText,
    Archive,
    ChevronRight,
    Calendar,
    HardDrive,
    Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Activity {
    _id: string;
    action: string;
    targetType: 'file' | 'folder' | 'user';
    targetId?: string;
    targetName?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

const ACTION_CONFIGS: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
    file_upload: { icon: Upload, label: 'File Uploaded', color: 'text-green-600', bgColor: 'bg-green-100' },
    file_trash: { icon: Trash2, label: 'Moved to Trash', color: 'text-red-500', bgColor: 'bg-red-100' },
    folder_trash: { icon: Trash2, label: 'Folder Trashed', color: 'text-red-500', bgColor: 'bg-red-100' },
    file_restore: { icon: RotateCcw, label: 'Restored from Trash', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    file_permanent_delete: { icon: Trash, label: 'Permanently Deleted', color: 'text-red-700', bgColor: 'bg-red-100' },
    file_star: { icon: Star, label: 'Added to Favorites', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    file_unstar: { icon: StarOff, label: 'Removed from Favorites', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    file_rename: { icon: FileEdit, label: 'File Renamed', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    file_move: { icon: Move, label: 'File Moved', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    file_copy: { icon: Copy, label: 'File Copied', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    folder_create: { icon: FolderPlus, label: 'Folder Created', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    share_link_create: { icon: Share2, label: 'Share Link Created', color: 'text-green-600', bgColor: 'bg-green-100' },
    share_link_revoke: { icon: Link2Off, label: 'Share Link Revoked', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    password_change: { icon: Key, label: 'Password Changed', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    avatar_change: { icon: UserCircle, label: 'Profile Picture Updated', color: 'text-pink-600', bgColor: 'bg-pink-100' },
};

const FILTER_OPTIONS = [
    { value: '', label: 'All Activities' },
    { value: 'file_upload', label: 'Uploads' },
    { value: 'file_trash', label: 'Trashed' },
    { value: 'file_star', label: 'Starred' },
    { value: 'share_link_create', label: 'Shared' },
    { value: 'folder_create', label: 'Folders Created' },
    { value: 'password_change', label: 'Password Changes' },
    { value: 'avatar_change', label: 'Avatar Changes' },
];

function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

function formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileTypeIcon(mimeType?: string) {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return Archive;
    return File;
}

export default function HistoryPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchActivities = useCallback(async (page: number = 1, reset: boolean = false) => {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (filter) {
                params.set('filter', filter);
            }

            const response = await fetch(`/api/activity?${params}`);
            if (!response.ok) throw new Error('Failed to fetch activities');

            const data = await response.json();

            if (reset) {
                setActivities(data.activities);
            } else {
                setActivities(prev => [...prev, ...data.activities]);
            }
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchActivities(1, true);
    }, [filter, fetchActivities]);

    const handleLoadMore = () => {
        if (pagination?.hasMore && !loadingMore) {
            fetchActivities(pagination.page + 1, false);
        }
    };

    const getActivityDetails = (activity: Activity) => {
        const name = activity.targetName || 'Unknown';
        const metadata = activity.metadata || {};

        switch (activity.action) {
            case 'file_upload':
                return {
                    title: `Uploaded "${name}"`,
                    details: [
                        metadata.size && { label: 'Size', value: formatFileSize(metadata.size), icon: HardDrive },
                        metadata.mimeType && { label: 'Type', value: metadata.mimeType.split('/')[1]?.toUpperCase() || 'File', icon: getFileTypeIcon(metadata.mimeType) },
                    ].filter(Boolean),
                };
            case 'file_rename':
                return {
                    title: 'Renamed file',
                    details: [
                        { label: 'From', value: metadata.oldName || 'Unknown', icon: FileEdit },
                        { label: 'To', value: name, icon: ChevronRight },
                    ],
                };
            case 'file_move':
                return {
                    title: `Moved "${name}"`,
                    details: [
                        { label: 'Destination', value: metadata.targetFolderId === 'root' ? 'My Drive (Root)' : 'Another folder', icon: Folder },
                    ],
                };
            case 'file_copy':
                return {
                    title: 'Copied file',
                    details: [
                        { label: 'Original', value: metadata.originalFileName || 'Unknown', icon: File },
                        { label: 'New copy', value: name, icon: Copy },
                        metadata.targetFolderId && { label: 'Location', value: metadata.targetFolderId === 'root' ? 'My Drive' : 'Folder', icon: Folder },
                    ].filter(Boolean),
                };
            case 'file_trash':
            case 'folder_trash':
                return {
                    title: `Moved "${name}" to trash`,
                    details: [
                        { label: 'Item', value: name, icon: activity.action === 'folder_trash' ? Folder : File },
                        { label: 'Status', value: 'In Trash (recoverable)', icon: Trash2 },
                    ],
                };
            case 'file_restore':
                return {
                    title: `Restored "${name}" from trash`,
                    details: [
                        { label: 'Item', value: name, icon: activity.targetType === 'folder' ? Folder : File },
                        { label: 'Status', value: 'Restored successfully', icon: RotateCcw },
                    ],
                };
            case 'file_permanent_delete':
                return {
                    title: `Permanently deleted "${name}"`,
                    details: [
                        metadata.size && { label: 'Size freed', value: formatFileSize(metadata.size), icon: HardDrive },
                        { label: 'Status', value: 'Cannot be recovered', icon: Trash },
                    ].filter(Boolean),
                };
            case 'file_star':
                return {
                    title: `Starred "${name}"`,
                    details: [
                        { label: 'Item', value: name, icon: activity.targetType === 'folder' ? Folder : File },
                        { label: 'Status', value: 'Added to favorites', icon: Star },
                    ],
                };
            case 'file_unstar':
                return {
                    title: `Unstarred "${name}"`,
                    details: [
                        { label: 'Item', value: name, icon: activity.targetType === 'folder' ? Folder : File },
                        { label: 'Status', value: 'Removed from favorites', icon: StarOff },
                    ],
                };
            case 'folder_create':
                return {
                    title: `Created folder "${name}"`,
                    details: [
                        { label: 'Folder name', value: name, icon: FolderPlus },
                    ],
                };
            case 'share_link_create':
                return {
                    title: `Created share link for "${name}"`,
                    details: [
                        { label: 'File', value: name, icon: File },
                        metadata.expiresInSeconds && {
                            label: 'Expires in',
                            value: metadata.expiresInSeconds >= 86400
                                ? `${Math.round(metadata.expiresInSeconds / 86400)} days`
                                : `${Math.round(metadata.expiresInSeconds / 3600)} hours`,
                            icon: Clock
                        },
                        { label: 'Status', value: 'Link is active', icon: Share2 },
                    ].filter(Boolean),
                };
            case 'share_link_revoke':
                return {
                    title: `Revoked share link for "${name}"`,
                    details: [
                        { label: 'File', value: name, icon: File },
                        { label: 'Status', value: 'Link no longer works', icon: Link2Off },
                    ],
                };
            case 'password_change':
                return {
                    title: 'Password was changed',
                    details: [
                        { label: 'Account', value: name || 'Your account', icon: UserCircle },
                        { label: 'Status', value: 'Security updated', icon: Key },
                    ],
                };
            case 'avatar_change':
                return {
                    title: 'Profile picture was updated',
                    details: [
                        { label: 'Account', value: name || 'Your account', icon: UserCircle },
                        { label: 'Status', value: 'Photo changed', icon: Camera },
                    ],
                };
            default:
                return {
                    title: `${ACTION_CONFIGS[activity.action]?.label || activity.action}`,
                    details: name && name !== 'Unknown' ? [{ label: 'Item', value: name, icon: File }] : [],
                };
        }
    };

    const currentFilter = FILTER_OPTIONS.find(f => f.value === filter) || FILTER_OPTIONS[0];

    return (
        <DashboardLayout currentPage="history">
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Activity History</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Track all your file and account activities</p>
                </div>

                {/* Filter */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {pagination ? `${pagination.total} total activities` : ''}
                    </p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter size={16} />
                                <span className="truncate">{currentFilter.label}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {FILTER_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => setFilter(option.value)}
                                    className={filter === option.value ? 'bg-accent' : ''}
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Activity List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="inline-block animate-spin">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                        </div>
                    </div>
                ) : activities.length === 0 ? (
                    <Card className="p-16 shadow-md rounded-xl">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Clock size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">No activity yet</p>
                            <p className="text-sm">Your activity history will appear here as you use the app</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity) => {
                            const config = ACTION_CONFIGS[activity.action] || {
                                icon: File,
                                label: activity.action,
                                color: 'text-muted-foreground',
                                bgColor: 'bg-muted',
                            };
                            const Icon = config.icon;
                            const activityInfo = getActivityDetails(activity);

                            return (
                                <Card
                                    key={activity._id}
                                    className="p-4 shadow-sm rounded-xl hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`p-3 rounded-xl ${config.bgColor} ${config.color} flex-shrink-0`}>
                                            <Icon size={20} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {activityInfo.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {config.label}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        {getRelativeTime(activity.createdAt)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {formatFullDate(activity.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            {activityInfo.details && activityInfo.details.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-border">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {activityInfo.details.map((detail: any, idx: number) => {
                                                            const DetailIcon = detail.icon;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2"
                                                                >
                                                                    <DetailIcon size={14} className="text-muted-foreground flex-shrink-0" />
                                                                    <span className="text-muted-foreground">{detail.label}:</span>
                                                                    <span className="text-foreground font-medium truncate">{detail.value}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {/* Load More */}
                        {pagination?.hasMore && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More Activities'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Stats */}
                {pagination && pagination.total > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                        Showing {activities.length} of {pagination.total} activities
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}
