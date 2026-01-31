'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import NotificationDetailsDialog from '@/components/NotificationDetailsDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Info,
    XCircle,
    Check,
    Share2,
    HardDrive,
    Link as LinkIcon,
} from 'lucide-react';

interface Notification {
    _id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    relatedId?: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));

            // Update selected notification if it matches
            if (selectedNotification && selectedNotification._id === id) {
                setSelectedNotification(prev => prev ? ({ ...prev, read: true }) : null);
            }

            await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            await fetch('/api/notifications/mark-all-read', { method: 'POST' });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            fetchNotifications(); // Revert on error
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        setSelectedNotification(notification);
        setDetailsOpen(true);
        if (!notification.read) {
            markAsRead(notification._id);
        }
    };

    const handleAction = (notification: Notification) => {
        setDetailsOpen(false);
        // Basic navigation triggered by related ID
        // You can enhance this to route to specific file/folder views
        if (notification.relatedId) {
            router.push('/dashboard');
        }
    };

    const getIcon = (notif: Notification, size: number = 24) => {
        if (notif.title.includes('Storage')) return <HardDrive size={size} className="text-blue-500" />;
        if (notif.title.includes('shared')) return <Share2 size={size} className="text-purple-500" />;
        if (notif.title.includes('link')) return <LinkIcon size={size} className="text-green-500" />;

        switch (notif.type) {
            case 'success': return <CheckCircle size={size} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={size} className="text-yellow-500" />;
            case 'error': return <XCircle size={size} className="text-red-500" />;
            default: return <Info size={size} className="text-blue-500" />;
        }
    };

    return (
        <DashboardLayout currentPage="profile">
            <div className="max-w-4xl mx-auto py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="w-8 h-8 text-blue-600" />
                            Notifications
                        </h1>
                        <p className="text-gray-500 mt-1">Stay updated with your account activity</p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={markAllAsRead}
                        disabled={!notifications.some(n => !n.read)}
                        className="gap-2"
                    >
                        <Check size={16} />
                        Mark all as read
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="p-12 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No notifications yet</p>
                        <p>You're all caught up!</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <Card
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${notif.read ? 'border-l-transparent bg-white' : 'border-l-blue-500 bg-blue-50/30'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full ${notif.read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                                        {getIcon(notif, 20)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className={`font-semibold ${notif.read ? 'text-gray-800' : 'text-gray-900'}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className={`text-sm mt-1 truncate ${notif.read ? 'text-gray-500' : 'text-gray-700'}`}>
                                            {notif.message}
                                        </p>
                                    </div>

                                    {!notif.read && (
                                        <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <NotificationDetailsDialog
                    isOpen={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                    notification={selectedNotification}
                    onAction={handleAction}
                />
            </div>
        </DashboardLayout>
    );
}
