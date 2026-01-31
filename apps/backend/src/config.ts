import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

// Helper to remove trailing slash
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

// Frontend URL Strategy
export const FRONTEND_URL = (() => {
    if (process.env.FRONTEND_URL) return normalizeUrl(process.env.FRONTEND_URL);
    if (isProduction) return 'https://financial-planner-web.onrender.com';
    return 'http://localhost:5173';
})();

// Backend URL Strategy (for Auth)
export const BETTER_AUTH_URL = (() => {
    if (process.env.BETTER_AUTH_URL) {
        const url = normalizeUrl(process.env.BETTER_AUTH_URL);
        return url.endsWith('/api/auth') ? url : `${url}/api/auth`;
    }
    if (isProduction) return 'https://financial-planner-api.onrender.com/api/auth';
    return 'http://localhost:3001/api/auth'; // Using localhost for local dev instead of ngrok default
})();

// CORS Strategy
export const CORS_ORIGINS = [
    'http://localhost:5173',
    FRONTEND_URL,
    // Add other trusted origins if needed
];

export const PORT = process.env.PORT || 3001;
