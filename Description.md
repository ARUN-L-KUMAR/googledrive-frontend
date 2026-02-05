# Cloud Storage Application (Google Drive Clone) - Final Submission

## 🔗 Project Links
- **Live Application**: [Insert Vercel Frontend URL Here]
- **Frontend Repository**: [https://github.com/ARUN-L-KUMAR/cloud-storage-app](https://github.com/ARUN-L-KUMAR/cloud-storage-app) (or updated name)
- **Backend Repository**: [https://github.com/ARUN-L-KUMAR/googledrive-backend](https://github.com/ARUN-L-KUMAR/googledrive-backend)
- **Demo Video**: [Insert YouTube/Drive Link Here]

---

## 📝 Project Description

### Problem Statement
In an increasingly digital world, the need for secure, accessible, and organized file storage is paramount. Users often struggle with fragmented storage solutions that lack intuitive interfaces or robust sharing capabilities. This project aims to solve this by providing a unified, cloud-based file management system that mimics the familiarity of Google Drive while offering secure storage, easy sharing, and cross-device accessibility.

### Solution Overview
I have built a full-stack Cloud Storage Application that allows users to upload, organize, and share files securely. The application features a responsive, modern user interface built with **Next.js 16** and **React 19**, coupled with a robust **Node.js/Express** backend. Files are stored securely in **AWS S3**, while metadata and user structures are managed in **MongoDB**.

---

## 🛠️ Technology Stack

### Frontend (Deployed on Vercel)
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS 4, Radix UI (for accessible primitives)
- **Icons**: Lucide React
- **State Management**: React Hooks & Context
- **Deployment**: Vercel

### Backend (Deployed on Render)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Storage**: AWS S3 (using AWS SDK v3)
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies
- **Email Service**: Nodemailer (for verification & password resets)
- **Deployment**: Render

---

## ✨ Key Features

### 1. Secure Authentication & User Management
- **Full Auth Flow**: Registration, Login, and Secure Logout.
- **Email Verification**: Users must verify their email addresses before accessing the platform.
- **Password Recovery**: Secure "Forgot Password" flow with time-sensitive email tokens.
- **Google OAuth**: One-click login using Google accounts.

### 2. Advanced File Management
- **Drag & Drop Uploads**: Intuitive upload interface supporting multiple files.
- **File Previews**: Built-in support for previewing images, audio, video, and PDFs without downloading.
- **File Operations**: Rename, Move, Copy, and Delete files.
- **Download**: Secure, time-limited download links via AWS S3 presigned URLs.

### 3. Organization & Navigation
- **Folder Structure**: Create deep, nested folder hierarchies.
- **Breadcrumb Navigation**: Easily navigate back through parent directories.
- **Search**: Real-time search functionality for files and folders.
- **Views**: Toggle between Grid and List views.

### 4. Smart Features
- **Sharing**: Generate public share links with optional expiration times.
- **Starred Items**: Bookmark important files for quick access.
- **Trash System**: Soft-delete files with the ability to Restore or Permanently Delete.
- **Storage Analytics**: Visual dashboard showing storage usage breakdown by file type.

### 5. Responsive Design
- **Mobile Optimized**: Fully functional on mobile devices with a responsive drawer menu.
- **Dark/Light Mode**: User preference based theme switching.

---

## 🏗️ System Architecture

The project follows a **Client-Server architecture**:

1.  **Frontend**: A Next.js application serves as the client. It handles the UI, routing, and user interactions. It communicates with the backend via RESTful API calls.
2.  **Backend**: An Express.js server acts as the central API. It handles authentication, business logic, and interacts with the database and object storage.
3.  **Database**: MongoDB stores user data, file metadata (names, paths, types), and activity logs.
4.  **Storage**: AWS S3 is used for storing the actual file binaries securely. Use of signed URLs ensures files are private by default and only accessible via the application.

This separation of concerns allows for independent scaling and maintenance of the frontend and backend services.
