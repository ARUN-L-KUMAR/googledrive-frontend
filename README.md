# ☁️ Cloud Storage App

A modern, full-featured cloud storage application built with **Next.js 16**, **MongoDB**, and **AWS S3**. This application provides a Google Drive-like experience with secure file storage, folder management, sharing capabilities, **mobile responsive design**, and built-in **dark/light mode** support and more.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-9.1.5-47A248?style=for-the-badge&logo=mongodb)
![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900?style=for-the-badge&logo=amazon-aws)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss)
![Radix UI](https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radix-ui)


---

## 🔗 Project Links
- **Live Application**: [https://c-drive.vercel.app/](https://c-drive.vercel.app/)
- **GitHub Repository**: [https://github.com/ARUN-L-KUMAR/googledrive-fullstack](https://github.com/ARUN-L-KUMAR/googledrive-fullstack)
- **Frontend Repository**: [https://github.com/ARUN-L-KUMAR/googledrive-fullstack/tree/frontend](https://github.com/ARUN-L-KUMAR/googledrive-fullstack/tree/frontend)
- **Backend Repository**: [https://github.com/ARUN-L-KUMAR/googledrive-fullstack/tree/backend](https://github.com/ARUN-L-KUMAR/googledrive-fullstack/tree/backend)
- **Demo Video**: [https://youtu.be/qZdoQwG8ecw](https://youtu.be/qZdoQwG8ecw)

---

## ✨ Features

### 📁 File Management
- **Upload Files** - Drag & drop or click to upload files with progress tracking
- **Download Files** - Secure file downloads using pre-signed S3 URLs
- **File Preview** - In-browser preview for images, videos, audio (with album art), PDFs, and text files
- **Bulk Operations** - Select multiple files for move, copy, or delete operations
- **File Information** - View detailed file metadata and properties

### 📂 Folder System
- **Create Folders** - Organize files with nested folder structures
- **Navigate Folders** - Intuitive breadcrumb navigation
- **Move/Copy Files** - Move or copy files between folders
- **Create Folder from Selection** - Group selected files into a new folder

### 🔗 Sharing
- **Share Links** - Generate shareable links with optional expiration
- **Share with Users** - Share files directly with other registered users
- **Access Control** - Manage permissions for shared content

### 🗑️ Trash System
- **Soft Delete** - Files go to trash before permanent deletion
- **Restore Files** - Recover accidentally deleted files
- **Permanent Delete** - Permanently remove files from storage

### ⭐ Organization
- **Starred Files** - Mark important files as starred for quick access
- **Recent Files** - Quick access to recently accessed files
- **History Log** - Track all file activities (uploads, moves, deletes, etc.)
- **Search** - Search files and folders by name

### 📊 Storage Analytics
- **Usage Dashboard** - Visual breakdown of storage usage by file type
- **Storage Quota** - Monitor storage consumption
- **File Statistics** - View upload trends and file type distribution

### 🔔 Notifications
- **Activity Alerts** - Get notified about shares, uploads, and system events
- **Notification Center** - Centralized view of all notifications
- **Mark as Read** - Manage notification status

### 👤 User Management
- **Registration** - Secure user registration with email verification
- **Login/Logout** - JWT-based authentication
- **Password Reset** - Email-based password recovery
- **Profile Management** - Update profile picture and user details
- **Settings** - Customize application preferences

### 🎨 User Interface
- **Dark/Light Theme** - Toggle between dark and light modes
- **Grid/List View** - Switch between different file display modes
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Modern UI** - Built with Radix UI and Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend
| Technology | Description |
|------------|-------------|
| **Next.js 16** | React framework with App Router |
| **React 19** | Latest React with Server Components |
| **TypeScript 5** | Type-safe JavaScript |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **Radix UI** | Accessible component primitives |
| **Lucide React** | Beautiful icon library |
| **Recharts** | Charting library for analytics |
| **React Hook Form** | Form handling with Zod validation |
| **Sonner** | Stacked toast notifications |
| **Vaul** | Drawer component for mobile |
| **Music-Metadata** | Audio metadata & album art extraction |
| **React Resizable Panels** | Resizable layout panels |

### Backend
| Technology | Description |
|------------|-------------|
| **Next.js API Routes** | Serverless API endpoints |
| **MongoDB** | NoSQL database with Mongoose ODM |
| **AWS S3** | Object storage for files |
| **JWT** | JSON Web Tokens for authentication |
| **Bcrypt** | Password hashing |
| **Nodemailer** | Email service for notifications |

---

## 📦 Installation

### Prerequisites
- **Node.js** 18.x or higher
- **npm** or **pnpm**
- **MongoDB** instance (local or Atlas)
- **AWS S3** bucket with credentials

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cloud-storage-app
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/cloud-storage

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email Configuration (for verification & password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

---

## 📁 Project Structure

```
cloud-storage-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── drive/                # Drive/folder endpoints
│   │   ├── files/                # File operations
│   │   ├── folders/              # Folder operations
│   │   ├── notifications/        # Notification endpoints
│   │   ├── share/                # Sharing endpoints
│   │   ├── storage/              # Storage analytics
│   │   └── users/                # User management
│   ├── dashboard/                # Dashboard pages
│   │   ├── analytics/            # Storage analytics page
│   │   ├── history/              # History/Activity log page
│   │   ├── notifications/        # Notifications page
│   │   ├── profile/              # User profile page
│   │   ├── settings/             # Settings page
│   │   ├── starred/              # Starred files page
│   │   └── trash/                # Trash page
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── forgot-password/          # Password recovery
│   ├── reset-password/           # Password reset
│   └── verify-email/             # Email verification
├── components/                   # React Components
│   ├── ui/                       # Radix UI components
│   ├── DashboardLayout.tsx       # Main dashboard layout
│   ├── FileList.tsx              # File listing component
│   ├── FileUpload.tsx            # Upload component
│   ├── FilePreviewModal.tsx      # File preview modal
│   ├── ShareDialog.tsx           # Sharing dialog
│   ├── StorageAnalytics.tsx      # Analytics charts
│   └── ...                       # Other components
├── lib/                          # Utility libraries
│   ├── models/                   # Mongoose models
│   │   ├── File.ts               # File model
│   │   ├── User.ts               # User model
│   │   ├── Notification.ts       # Notification model
│   │   └── ShareLink.ts          # Share link model
│   ├── auth.ts                   # Authentication utilities
│   ├── db.ts                     # Database connection
│   ├── s3.ts                     # S3 client configuration
│   └── email.tsx                 # Email templates
├── contexts/                     # React Contexts
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── public/                       # Static assets
└── styles/                       # Global styles
```

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth with HTTP-only cookies
- **Password Hashing** - bcrypt with salt rounds
- **Email Verification** - Verify user email before activation
- **Pre-signed URLs** - Secure, time-limited S3 access
- **Input Validation** - Zod schema validation on all inputs
- **CORS Protection** - Configured API security headers

---

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/verify-email` | Verify email |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload file |
| GET | `/api/files/download/[id]` | Download file |
| DELETE | `/api/files/[id]` | Delete file |
| PATCH | `/api/files/[id]/rename` | Rename file |
| POST | `/api/files/[id]/star` | Toggle star |
| POST | `/api/files/move` | Move files |
| POST | `/api/files/copy` | Copy files |

### Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/folders` | Create folder |
| GET | `/api/drive/root` | Get root contents |
| GET | `/api/drive/folder/[id]` | Get folder contents |

### Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/share` | Create share link |
| GET | `/api/share/[id]` | Access shared content |

---

## 🎨 Customization

### Theme Configuration
The app uses `next-themes` for theme switching. Customize colors in `tailwind.config.ts`.

### Storage Limits
Configure user storage limits in the User model (`lib/models/User.ts`).

### File Type Support
Add or modify supported file types in the upload route (`app/api/files/upload/route.ts`).

---

## 📄 License

This project is licensed under the MIT License.

---

## 📧 Support

For support, please open an issue in the repository or contact the maintainers.

---