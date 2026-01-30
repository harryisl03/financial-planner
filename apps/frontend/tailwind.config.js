/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                slate: {
                    900: '#0F172A',
                    800: '#1E293B',
                    700: '#334155',
                    400: '#94A3B8',
                    50: '#F8FAFC',
                },
                "primary-start": "#10B981", // Emerald
                "primary-end": "#06B6D4",   // Cyan
                "danger-start": "#F43F5E",  // Rose
                "danger-end": "#FB923C",    // Orange
                "primary": "#13ecec",       // Login Primary
                "primary-dark": "#0ea5a5",  // Login Primary Dark
                "background-light": "#f6f8f8",
                "background-dark": "#0F172A",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "xl": "12px",
                "3xl": "24px",
            }
        },
    },
    plugins: [],
}
