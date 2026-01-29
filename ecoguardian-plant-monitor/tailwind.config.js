/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            animation: {
                aurora: "aurora 10s linear infinite",
            },
            keyframes: {
                aurora: {
                    "0%": { backgroundPosition: "0% 50%" },
                    "100%": { backgroundPosition: "200% 50%" },
                },
            },
        },
    },
    plugins: [],
}
