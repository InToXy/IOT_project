"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative inline-flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                className
            )}
            title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        >
            <div className="relative w-6 h-6">
                <Sun
                    className={cn(
                        "absolute inset-0 w-6 h-6 transition-all duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 text-amber-500"
                    )}
                />
                <Moon
                    className={cn(
                        "absolute inset-0 w-6 h-6 transition-all duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100 text-slate-200"
                    )}
                />
            </div>
            <span className="sr-only">Changer le thème</span>
        </button>
    );
}
