'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Camera, Mail, Calendar, HardDrive, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    storageUsed: number;
    storageLimit: number;
    createdAt: string;
}

export default function ProfilePage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '' });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/users/profile');
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();
            setProfile(data.user);
            setFormData({
                firstName: data.user.firstName,
                lastName: data.user.lastName,
            });
            setPreviewUrl(data.user.profilePicture || null);
        } catch (err) {
            console.error(err);
            toast({
                title: 'Error',
                description: 'Failed to load profile',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data.user);
                toast({
                    title: 'Success',
                    description: 'Profile updated successfully',
                });
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to save profile',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setPreviewUrl(data.profilePicture);
                toast({
                    title: 'Success',
                    description: 'Profile picture updated',
                });
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to upload');
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to upload avatar',
                variant: 'destructive',
            });
            // Revert preview on error
            setPreviewUrl(profile?.profilePicture || null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <DashboardLayout currentPage="profile">
            <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Profile</h1>
                    <p className="text-muted-foreground mt-2">Manage your personal information</p>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block animate-spin">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Profile Picture Section */}
                        <Card className="p-6 shadow-md rounded-xl">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Profile Picture</h2>
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-card shadow-lg">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={() => setPreviewUrl(null)}
                                            />
                                        ) : (
                                            <User className="w-12 h-12 text-gray-400" />
                                        )}
                                    </div>
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="gap-2"
                                    >
                                        <Camera size={16} />
                                        Change Photo
                                    </Button>
                                    <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max 5MB.</p>
                                </div>
                            </div>
                        </Card>

                        {/* Personal Information Section */}
                        <Card className="p-6 shadow-md rounded-xl">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Personal Information</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                                            First Name
                                        </label>
                                        <Input
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                                            Last Name
                                        </label>
                                        <Input
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        <Mail className="inline w-4 h-4 mr-1" />
                                        Email
                                    </label>
                                    <Input
                                        value={profile?.email || ''}
                                        disabled
                                        className="bg-muted text-muted-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {/* Account Info Section */}
                        <Card className="p-6 shadow-md rounded-xl">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Account Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Member since</p>
                                        <p className="font-medium text-foreground">
                                            {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <HardDrive className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Storage Plan</p>
                                        <p className="font-medium text-foreground">
                                            {profile?.storageLimit && profile.storageLimit >= 5 * 1024 * 1024 * 1024
                                                ? 'Free (5GB)'
                                                : 'Pro'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <HardDrive className="w-5 h-5 text-blue-500" />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Storage Used</p>
                                        <p className="font-medium text-foreground">
                                            {profile ? `${formatBytes(profile.storageUsed)} of ${formatBytes(profile.storageLimit)}` : '-'}
                                        </p>
                                        {profile && (
                                            <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, (profile.storageUsed / profile.storageLimit) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
