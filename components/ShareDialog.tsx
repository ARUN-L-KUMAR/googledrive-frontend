'use client';

import { useState } from 'react';
import { Copy, Check, Clock, Link, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        _id: string;
        name: string;
    } | null;
}

const EXPIRY_OPTIONS = [
    { value: '600', label: '10 minutes' },
    { value: '3600', label: '1 hour' },
    { value: '86400', label: '24 hours' },
    { value: '604800', label: '7 days' },
];

export default function ShareDialog({ isOpen, onClose, file }: ShareDialogProps) {
    const { toast } = useToast();
    const [expirySeconds, setExpirySeconds] = useState('600');
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerateLink = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/files/${file._id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expiresInSeconds: parseInt(expirySeconds) }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate share link');
            }

            const data = await response.json();
            setShareLink(data.shareUrl);
            toast({
                title: 'Link generated',
                description: 'Share link has been created successfully',
            });
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to generate share link',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!shareLink) return;

        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            toast({
                title: 'Copied!',
                description: 'Share link copied to clipboard',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to copy link',
                variant: 'destructive',
            });
        }
    };

    const handleClose = () => {
        setShareLink(null);
        setCopied(false);
        setExpirySeconds('600');
        onClose();
    };

    const selectedExpiry = EXPIRY_OPTIONS.find((o) => o.value === expirySeconds);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-full max-w-md overflow-hidden">
                <DialogHeader className="min-w-0 overflow-hidden">
                    <DialogTitle className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <Link size={20} className="text-blue-600 flex-shrink-0" />
                        Share File
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-hidden">
                    <div className="bg-muted p-4 rounded-lg overflow-hidden">
                        <p className="text-sm text-muted-foreground">Sharing:</p>
                        <p
                            className="font-medium text-foreground truncate block w-full"
                            title={file?.name}
                        >
                            {file?.name}
                        </p>
                    </div>

                    {!shareLink ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Link expires in
                                </label>
                                <Select value={expirySeconds} onValueChange={setExpirySeconds}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select expiry time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXPIRY_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Secure sharing:</strong> Anyone with this link can download
                                    the file until it expires. The link cannot be extended.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Share link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground"
                                    />
                                    <Button
                                        onClick={handleCopyLink}
                                        variant="outline"
                                        className={copied ? 'bg-green-50 border-green-300' : ''}
                                    >
                                        {copied ? (
                                            <Check size={18} className="text-green-600" />
                                        ) : (
                                            <Copy size={18} />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                <p className="text-sm text-amber-800">
                                    <strong>Expires:</strong> {selectedExpiry?.label} from now
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} className="bg-transparent">
                        {shareLink ? 'Done' : 'Cancel'}
                    </Button>
                    {!shareLink && (
                        <Button
                            onClick={handleGenerateLink}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Link size={16} />
                                    Generate Link
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
