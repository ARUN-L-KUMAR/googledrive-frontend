import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Info,
    XCircle,
    ExternalLink,
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

interface NotificationDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
    onAction?: (notification: Notification) => void;
}

export default function NotificationDetailsDialog({
    isOpen,
    onClose,
    notification,
    onAction,
}: NotificationDetailsDialogProps) {
    if (!notification) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
            case 'error':
                return <XCircle className="w-6 h-6 text-red-500" />;
            default:
                return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-500/10';
            case 'warning':
                return 'bg-yellow-500/10';
            case 'error':
                return 'bg-red-500/10';
            default:
                return 'bg-blue-500/10';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${getBgColor(notification.type)}`}>
                            {getIcon(notification.type)}
                        </div>
                        <DialogTitle className="text-xl">{notification.title}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Message</h4>
                        <p className="text-foreground bg-muted p-3 rounded-md">{notification.message}</p>
                    </div>

                    <div className="flex gap-6">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Date</h4>
                            <p className="text-foreground">
                                {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time</h4>
                            <p className="text-foreground">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${notification.read ? 'bg-muted text-muted-foreground' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                            {notification.read ? 'Read' : 'Unread'}
                        </span>
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-between gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {notification.relatedId && onAction && (
                        <Button onClick={() => onAction(notification)} className="gap-2">
                            <ExternalLink size={16} />
                            View Related Item
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
