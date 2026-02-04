# Google Drive Clone - Backend API

This is the Node.js/Express backend for the Google Drive Clone application. It handles authentication, file management via AWS S3, and database operations with MongoDB.

## Features

- **Authentication**: JWT-based auth (Register, Login, Forgot Password, Google OAuth)
- **File Management**: Upload, download, move, copy, rename, delete files/folders using AWS S3
- **Sharing**: Generate shareable links with expiration
- **Organization**: Nested folders, trash/restore functionality
- **Analytics**: Storage usage and file type breakdown

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Storage**: AWS S3
- **Email**: Nodemailer

## Prerequisites

- Node.js (v18+)
- MongoDB Atlas connection string
- AWS S3 bucket credentials
- Google OAuth credentials

## Installation

1. Clone the repository and navigate to the backend folder:
   ```bash
   cd googledrive-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory (copy from frontend or use template):
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3001
   
   # AWS S3
   AWS_ACCESS_KEY_ID=your_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   AWS_BUCKET_NAME=your_bucket_name

   # Email
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Google OAuth
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## Running the Server

Start the development server:
```bash
npm run dev
```

Start for production:
```bash
npm start
```

The server will run on `http://localhost:5000`.

## API Endpoints

- **Auth**: `/api/auth` (Login, Register, Verify)
- **Files**: `/api/files` (Upload, listing, CRUD)
- **Folders**: `/api/folders` (Create folder)
- **Drive**: `/api/drive` (Browsing)
- **Users**: `/api/users` (Profile, password)
- **Share**: `/api/share` (Public links)

## Project Structure

- `config/` - Database configuration
- `middleware/` - Auth and error handling middleware
- `models/` - Mongoose schemas (User, File, etc.)
- `routes/` - API route handlers
- `utils/` - Helpers (S3, Email, Auth)
