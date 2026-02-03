'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Settings as SettingsIcon,
  HardDrive,
  AlertTriangle,
  Loader2,
  LogOut,
  Image,
  Video,
  FileText,
  Music,
  File,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  storageUsed: number;
  storageLimit: number;
}

interface StorageBreakdown {
  images: { size: number; count: number };
  videos: { size: number; count: number };
  audio: { size: number; count: number };
  documents: { size: number; count: number };
  other: { size: number; count: number };
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown | null>(null);

  // Password change state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences state
  const [viewMode, setViewMode] = useState('list');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchStorageBreakdown();
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    // Load from localStorage
    const savedViewMode = localStorage.getItem('fileViewMode') || 'list';
    const savedNotifications = localStorage.getItem('emailNotifications') !== 'false';
    setViewMode(savedViewMode);
    setEmailNotifications(savedNotifications);
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.user);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageBreakdown = async () => {
    try {
      const response = await fetch('/api/storage/breakdown');
      if (!response.ok) throw new Error('Failed to fetch storage breakdown');
      const data = await response.json();
      setStorageBreakdown(data.breakdown);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password updated successfully',
        });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    // For now, just logout current session
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const handleViewModeChange = (value: string) => {
    setViewMode(value);
    localStorage.setItem('fileViewMode', value);
    toast({
      title: 'Preference saved',
      description: `Default view set to ${value}`,
    });
  };


  const handleNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    localStorage.setItem('emailNotifications', String(checked));
    toast({
      title: 'Preference saved',
      description: `Email notifications ${checked ? 'enabled' : 'disabled'}`,
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: 'Error',
        description: 'Please type DELETE to confirm',
        variant: 'destructive',
      });
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/users/delete', { method: 'DELETE' });

      if (response.ok) {
        toast({
          title: 'Account deleted',
          description: 'Your account has been permanently deleted',
        });
        window.location.href = '/';
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercentage = settings
    ? Math.min(100, (settings.storageUsed / settings.storageLimit) * 100)
    : 0;

  return (
    <DashboardLayout currentPage="settings">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account security and preferences</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Security Card */}
            <Card className="p-6 shadow-md rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords({ ...passwords, newPassword: e.target.value })
                      }
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords({ ...passwords, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword || !passwords.currentPassword || !passwords.newPassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogoutAllDevices}
                    className="gap-2"
                  >
                    <LogOut size={16} />
                    Log out from all devices
                  </Button>
                </div>
              </div>
            </Card>

            {/* Preferences Card */}
            <Card className="p-6 shadow-md rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Default View Mode</p>
                    <p className="text-sm text-gray-500">Choose how files are displayed</p>
                  </div>
                  <Select value={viewMode} onValueChange={handleViewModeChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={handleNotificationsChange}
                  />
                </div>
              </div>
            </Card>

            {/* Storage Card */}
            <Card className="p-6 shadow-md rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Storage</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {settings ? formatBytes(settings.storageUsed) : '0'} used
                    </span>
                    <span className="text-gray-600">
                      {settings ? formatBytes(settings.storageLimit) : '0'} total
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-blue-600'
                        }`}
                      style={{ width: `${storagePercentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {storagePercentage.toFixed(1)}% of storage used
                  </p>
                </div>

                {storageBreakdown && (
                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700">Storage Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-pink-500" />
                          <span className="text-sm text-gray-700">Images</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatBytes(storageBreakdown.images.size)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-700">Videos</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatBytes(storageBreakdown.videos.size)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">Audio</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatBytes(storageBreakdown.audio.size)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-700">Documents</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatBytes(storageBreakdown.documents.size)}
                        </span>
                      </div>
                      {storageBreakdown.other.size > 0 && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Other</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {formatBytes(storageBreakdown.other.size)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Danger Zone Card */}
            <Card className="p-6 shadow-md rounded-xl border-red-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Once you delete your account, there is no going back. All your files will be
                  permanently deleted. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              This action cannot be undone. This will permanently delete your account and remove
              all your data including files from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="border-red-200 focus:border-red-400"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText('');
              }}
              disabled={deleting}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmText !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
