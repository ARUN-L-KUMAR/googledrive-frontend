'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import {
  Cloud,
  Home,
  Star,
  Trash2,
  Settings,
  LogOut,
  Menu,
  X,
  Upload,
  FolderPlus,
  Search,
  Filter,
  File,
  Folder,
  Image,
  Video,
  Music,
  FileText,
  BarChart3,
  User,
  Bell,
  Share2,
  HardDrive,
  Link as LinkIcon,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import FileUpload from '@/components/FileUpload';
import SearchHandler from '@/components/SearchHandler';

interface DashboardLayoutProps {
  children: React.ReactNode | ((actions: { onUploadClick: () => void; onNewFolderClick: () => void }) => React.ReactNode);
  currentPage: string;
  currentFolderId?: string | null;
  onFolderCreated?: () => void;
  onUploadComplete?: () => void;
  homeFilter?: string;
  onHomeFilterChange?: (filter: string) => void;
}

interface SearchResult {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  parentId?: string;
}

interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

const TYPE_FILTERS = [
  { value: 'all', label: 'All Files', icon: File },
  { value: 'folders', label: 'Folders', icon: Folder },
  { value: 'images', label: 'Images', icon: Image },
  { value: 'videos', label: 'Videos', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'documents', label: 'Documents', icon: FileText },
];

export default function DashboardLayout({
  children,
  currentPage,
  currentFolderId,
  onFolderCreated,
  onUploadComplete,
  homeFilter = 'all',
  onHomeFilterChange
}: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isNavigatingRef = useRef(false); // Track when Enter is pressed to prevent URL clearing
  const prevSearchQueryRef = useRef(''); // Track previous query to detect user clearing

  // User profile state
  const [userProfile, setUserProfile] = useState<{ firstName: string; lastName: string; profilePicture?: string } | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (unreadCount === 0) return;

      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      fetchNotifications();
    }
  };

  const markAsRead = async (id: string, relatedId?: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));

      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });

      // If there's a related ID, navigate to it (basic implementation)
      if (relatedId) {
        setNotificationsOpen(false);
        // For now, if it's a file/folder, we just go to dashboard. 
        // In future, we could highlight the specific item.
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Fetch notifications on mount and when upload/folder actions happen
  useEffect(() => {
    fetchNotifications();

    // Set up polling (simple version) - every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Use this to refresh notifications after actions
  useEffect(() => {
    if (!uploadOpen && !folderDialogOpen) {
      fetchNotifications();
    }
  }, [uploadOpen, folderDialogOpen]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
          setAvatarError(false); // Reset error state when profile is fetched
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };
    fetchProfile();
  }, []);

  // Search handler component handles search params

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search and URL sync
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 1) { // Allow single char if needed, but usually 2
      // Fetch for dropdown preview (immediate)
      setSearching(true);
      const dropdownTimeoutId = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/files/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`
          );
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.results || []);
            setSearchOpen(true);
          }
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setSearching(false);
        }
      }, 150); // Shorter delay for responsive UI

      // Update URL with debounce (separate from dropdown)
      const urlTimeoutId = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('q', searchQuery);
        // Only update type if it changes or is set
        if (searchType && searchType !== 'all') {
          params.set('type', searchType);
        } else {
          params.delete('type');
        }

        // Use replace instead of push to avoid adding to browser history
        router.replace(`/dashboard?${params.toString()}`);
      }, 500); // 500ms debounce for URL update

      searchTimeoutRef.current = dropdownTimeoutId;

      return () => {
        clearTimeout(dropdownTimeoutId);
        clearTimeout(urlTimeoutId);
      };
    } else {
      setSearchResults([]);
      setSearchOpen(false);

      // Only clear URL if user actually typed and then cleared the search
      // (previous query was non-empty, now it's empty)
      // This prevents clearing URL on initial mount or after navigation
      if (prevSearchQueryRef.current && prevSearchQueryRef.current.length >= 1) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('q')) {
          urlParams.delete('q');
          urlParams.delete('type');
          const newUrl = urlParams.toString() ? `/dashboard?${urlParams.toString()}` : '/dashboard';
          router.replace(newUrl);
        }
      }
    }

    // Update prev ref after effect runs
    prevSearchQueryRef.current = searchQuery;
  }, [searchQuery, searchType, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setFolderError('Please enter a folder name');
      return;
    }

    setCreatingFolder(true);
    setFolderError('');

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFolderError(data.error || 'Failed to create folder');
        return;
      }

      setFolderDialogOpen(false);
      setNewFolderName('');
      onFolderCreated?.();
    } catch (err) {
      setFolderError('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUploadSuccess = (file: any) => {
    onUploadComplete?.();
  };

  const handleSearchResultClick = (result: SearchResult) => {
    // Close dropdown and clear search to navigate directly to the item's location
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);

    if (result.type === 'folder') {
      // For folders, navigate directly into the folder
      router.push(`/dashboard?folder=${result._id}`);
    } else if (result.parentId) {
      // For files, navigate to the parent folder containing the file
      router.push(`/dashboard?folder=${result.parentId}`);
    } else {
      // For root files, just go to the root dashboard
      router.push('/dashboard');
    }
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'folder') return <Folder size={16} className="text-blue-500" />;
    if (result.mimeType?.startsWith('image/')) return <Image size={16} className="text-pink-500" />;
    if (result.mimeType?.startsWith('video/')) return <Video size={16} className="text-purple-500" />;
    if (result.mimeType?.startsWith('audio/')) return <Music size={16} className="text-green-500" />;
    return <File size={16} className="text-gray-400" />;
  };

  const navItems = [
    { icon: Home, label: 'My Files', href: '/dashboard', id: 'files' },
    { icon: Star, label: 'Starred', href: '/dashboard/starred', id: 'starred' },
    { icon: Trash2, label: 'Trash', href: '/dashboard/trash', id: 'trash' },
    { icon: BarChart3, label: 'Storage', href: '/dashboard/analytics', id: 'analytics' },
    { icon: User, label: 'Profile', href: '/dashboard/profile', id: 'profile' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', id: 'settings' },
  ];

  // Use homeFilter for display when not in search mode
  const activeFilterValue = searchQuery.length >= 2 ? searchType : homeFilter;
  const currentFilter = TYPE_FILTERS.find(f => f.value === activeFilterValue) || TYPE_FILTERS[0];

  return (
    <div className="flex h-screen bg-background">
      <Suspense fallback={null}>
        <SearchHandler
          onSearchQueryChange={setSearchQuery}
          onSearchTypeChange={setSearchType}
          onSearchOpenChange={setSearchOpen}
          searchQuery={searchQuery}
          searchType={searchType}
          setSearchOpen={setSearchOpen}
        />
      </Suspense>
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'
          } bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Cloud className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-foreground">CloudDrive</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-medium'
                  : 'text-muted-foreground hover:bg-accent'
                  }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center">
          {/* LEFT: Menu toggle + Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} className="text-foreground" /> : <Menu size={24} className="text-foreground" />}
            </button>
            {!sidebarOpen && (
              <div className="flex items-center gap-2">
                <Cloud className="w-7 h-7 text-blue-600" />
                <span className="text-xl font-bold text-foreground hidden md:inline">CloudDrive</span>
              </div>
            )}
          </div>

          {/* CENTER: Search Bar + Filter */}
          <div ref={searchRef} className="relative flex-1 max-w-3xl mx-auto px-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
              <div className="w-full relative">
                {/* Hidden fake fields to trap autofill */}
                <input type="text" name="fake_username" className="hidden" aria-hidden="true" />
                <input type="password" name="fake_password" className="hidden" aria-hidden="true" />

                <Input
                  type="search"
                  name="search_query_field"
                  id="search_query_field"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();

                      // Close dropdown - results will be shown in main content area
                      setSearchOpen(false);

                      // Update URL immediately without debounce for Enter key
                      if (searchQuery.length >= 1) {
                        // Set navigating flag to prevent URL clearing in effect
                        isNavigatingRef.current = true;

                        const params = new URLSearchParams();
                        params.set('q', searchQuery);
                        if (searchType && searchType !== 'all') {
                          params.set('type', searchType);
                        }
                        // Use push instead of replace to allow back navigation
                        router.push(`/dashboard?${params.toString()}`);

                        // Reset the flag after navigation completes
                        setTimeout(() => {
                          isNavigatingRef.current = false;
                        }, 100);
                      }
                    }
                  }}
                  className="pl-10 pr-4 py-2 w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Type Filter - Moved here */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 flex-shrink-0">
                  <Filter size={16} />
                  <currentFilter.icon size={16} />
                  <span className="hidden lg:inline">{currentFilter.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TYPE_FILTERS.map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onClick={() => {
                      setSearchType(filter.value);
                      if (onHomeFilterChange) {
                        onHomeFilterChange(filter.value);
                      }
                    }}
                    className="gap-2"
                  >
                    <filter.icon size={16} />
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Results Dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-auto z-50">
                {searchResults.map((result) => (
                  <button
                    key={result._id}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left min-w-0 overflow-hidden"
                  >
                    {getResultIcon(result)}
                    <span
                      className="text-foreground block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis"
                      title={result.name}
                    >
                      {result.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground z-50">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* RIGHT: Theme Toggle, Notifications, Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Bell */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 hover:bg-accent rounded-lg transition-colors relative"
                title="Notifications"
              >
                <Bell size={22} className="text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <span
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 cursor-pointer hover:underline"
                      >
                        Mark all read
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => markAsRead(notif._id, notif.relatedId?.toString())}
                          className={`p-3 border-b border-border hover:bg-accent cursor-pointer flex gap-3 ${!notif.read ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.read ? 'bg-blue-100 dark:bg-blue-900' : 'bg-muted'}`}>
                            {/* Simple icon logic based on type/title for now */}
                            {notif.title.includes('Storage') ? (
                              <HardDrive size={16} className={!notif.read ? 'text-blue-600' : 'text-gray-500'} />
                            ) : notif.title.includes('shared') ? (
                              <Share2 size={16} className={!notif.read ? 'text-blue-600' : 'text-gray-500'} />
                            ) : notif.title.includes('link') ? (
                              <LinkIcon size={16} className={!notif.read ? 'text-blue-600' : 'text-gray-500'} />
                            ) : (
                              <Bell size={16} className={!notif.read ? 'text-blue-600' : 'text-gray-500'} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{notif.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-border text-center">
                    <span
                      onClick={() => {
                        setNotificationsOpen(false);
                        router.push('/dashboard/notifications');
                      }}
                      className="text-sm text-blue-600 cursor-pointer hover:underline"
                    >
                      View all notifications
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border hover:border-blue-500 transition-colors flex-shrink-0"
              title="View Profile"
            >
              {userProfile?.profilePicture && !avatarError ? (
                <img
                  src={userProfile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {userProfile?.firstName?.[0]?.toUpperCase() || ''}
                  {userProfile?.lastName?.[0]?.toUpperCase() || ''}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {typeof children === 'function'
            ? children({
              onUploadClick: () => setUploadOpen(true),
              onNewFolderClick: () => setFolderDialogOpen(true)
            })
            : children}
        </div>
      </main>

      {/* Upload Dialog */}
      <FileUpload
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={handleUploadSuccess}
        parentId={currentFolderId || undefined}
      />

      {/* New Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder Name
              </label>
              <Input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                disabled={creatingFolder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>

            {folderError && (
              <p className="text-sm text-red-600">{folderError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFolderDialogOpen(false);
                setNewFolderName('');
                setFolderError('');
              }}
              disabled={creatingFolder}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creatingFolder ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

