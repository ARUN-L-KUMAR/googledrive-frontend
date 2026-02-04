# ☁️ Cloud Storage App (Frontend)

This is the **Frontend** repository for the Cloud Storage application, built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**. It provides a Google Drive-like interface for managing your files and folders, communicating with a separate Express.js backend.

> **Note:** This repository works in conjunction with the [Backend Repository](https://github.com/ARUN-L-KUMAR/googledrive-backend) (or your backend location).

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss)

---

## ✨ Features (UI)

### 📁 File Management
- **Drag & Drop Uploads** - Seamless file uploading
- **File Previews** - Built-in viewer for images, audio, video, PDF, and text
- **Grid & List Views** - Flexible file display options
- **Context Menus** - Right-click actions for files and folders

### � Organization
- **Folder Navigation** - Breadcrumb-based navigation system
- **Multi-select** - Bulk operations (Move, Copy, Delete)
- **Starred Items** - Quick access to important files
- **Trash** - Soft delete with restore functionality

### � User Experience
- **Dark/Light Mode** - Fully responsive theme system
- **Responsive Design** - Optimized for mobile and desktop
- **Toast Notifications** - Real-time feedback for actions
- **Search** - Instant file and folder search

---

## 🛠️ Tech Stack

| Technology | Description |
|------------|-------------|
| **Next.js 16** | App Router, Server Components, and Layouts |
| **React 19** | Latest clean UI library |
| **Tailwind CSS 4** | Styling and design system |
| **Radix UI** | Accessible UI primitives (Dialogs, Dropdowns, etc.) |
| **Lucide React** | Consistent icon set |
| **Recharts** | Analytics visualization |
| **React Hook Form** | Form validation and handling |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- The **Backend** server running (see Backend Repo)

### 1. Clone the Repository
```bash
git clone <your-frontend-repo-url>
cd googledrive-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Backend API URL (Express server)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Authentication (optional if handled purely by backend cookies)
# NEXT_PUBLIC_AUTH_DOMAIN=...
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

> The app will proxy `/api/*` requests to your backend running at `http://localhost:5000`.

---

## 🚀 Deployment

The frontend is optimized for deployment on **Vercel**.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add the `NEXT_PUBLIC_API_URL` environment variable (set to your deployed Backend URL, e.g., on Render).
4. Deploy!

---

## � Project Structure

```
app/
├── components/          # Reusable UI components
├── lib/                 # Utilities and API helpers
├── app/                 # Next.js App Router pages
│   ├── login/           # Auth pages
│   ├── dashboard/       # Main app interface
│   └── ...
└── public/              # Static assets
```

---

## 📄 License

This project is licensed under the MIT License.