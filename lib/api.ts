// API Configuration
// In development, the frontend calls the separate backend server
// In production, update this to your deployed backend URL

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export { API_BASE_URL };
