import { useState, useEffect } from "react";

export function useTheme() {
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light"
    );

    useEffect(() => {
        const root = window.document.documentElement;
        const oldTheme = theme === "dark" ? "light" : "dark";

        root.classList.remove(oldTheme);
        root.classList.add(theme);

        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return { theme, toggleTheme };
}
