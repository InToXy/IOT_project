import React from 'react';

export const LiveIndicator: React.FC = () => {
    return (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-600 shadow-lg shadow-red-500/30 rounded-full animate-pulse hover:scale-105 transition-transform cursor-default select-none">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-white font-extrabold text-xs tracking-wider drop-shadow-sm">EN DIRECT</span>
        </div>
    );
};
