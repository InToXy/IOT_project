import React from 'react';
import { Tracker, PlantData } from '../types';
import { PLANT_PROFILES } from '../constants';
import { calculateWellness } from '../utils/wellness';
import { ActivityIcon, AlertTriangleIcon, ThermometerIcon, DropletsIcon, SunIcon, SoilHumidityIcon } from './Icons';

interface TrackerCardProps {
    tracker: Tracker;
    data: PlantData | undefined; // Received from parent
    onSelect: (tracker: Tracker) => void;
    onRemove: (id: string) => void;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({ tracker, data, onSelect, onRemove }) => {
    const plantProfile = PLANT_PROFILES.find(p => p.id === tracker.plantId);

    // Calculate wellness using passed data
    const wellnessScore = plantProfile && data ? calculateWellness(data, plantProfile) : 0;

    // Determine status color
    let statusColor = 'bg-slate-200 text-slate-500'; // Default/Loading
    if (data) {
        if (wellnessScore >= 75) statusColor = 'bg-emerald-500 text-white';
        else if (wellnessScore >= 50) statusColor = 'bg-amber-500 text-white';
        else statusColor = 'bg-rose-500 text-white';
    }

    // Handle image path correctly - default to a placeholder if needed
    const imageSrc = plantProfile?.imagePath || '/plants/monstera.png';

    return (
        <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer group relative flex flex-col h-full"
            onClick={() => onSelect(tracker)}
        >
            {/* Header Image Area */}
            <div className="relative h-48 overflow-hidden bg-emerald-50 dark:bg-emerald-900/20">
                {/* Actual Image if available, or Gradient Fallback */}
                <img
                    src={imageSrc}
                    alt={tracker.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                        // Fallback to gradient if image fails
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-teal-400');
                    }}
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                {/* Delete Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(tracker.id); }}
                    className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100 z-10"
                    title="Supprimer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>

                {/* Wellness Badge */}
                <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm backdrop-blur-md ${statusColor}`}>
                    {!data ? (
                        <span className="flex items-center gap-1"><AlertTriangleIcon className="w-3 h-3" /> N/A</span>
                    ) : (
                        <>
                            <ActivityIcon className="w-3 h-3" />
                            {wellnessScore}%
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-grow">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate" title={tracker.name}>{tracker.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{plantProfile?.name || 'Plante inconnue'}</p>

                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 mb-4">
                    <span className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                        🏠 Serre {tracker.greenhouseId}
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                        📡 Plante {tracker.sensorId}
                    </span>
                </div>

                {data && (
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5" title="Température">
                            <ThermometerIcon className="w-3.5 h-3.5 text-rose-500" />
                            <b>{data.temperature}°C</b>
                        </div>
                        <div className="flex items-center gap-1.5" title="Humidité Air">
                            <DropletsIcon className="w-3.5 h-3.5 text-sky-500" />
                            <b>{data.humidite}%</b>
                        </div>
                        <div className="flex items-center gap-1.5" title="Humidité Sol">
                            <SoilHumidityIcon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                            <b>{data.humidite_sol}%</b>
                        </div>
                        <div className="flex items-center gap-1.5" title="Luminosité">
                            <SunIcon className="w-3.5 h-3.5 text-amber-500" />
                            <b>{data.luminosite}%</b>
                        </div>
                    </div>
                )}
                {data && (
                    <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 text-right">
                        Màj: {new Date(data.originalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
                {!data && (
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 text-xs text-amber-500 flex items-center gap-1">
                        <AlertTriangleIcon className="w-3 h-3" /> En attente...
                    </div>
                )}
            </div>
        </div>
    );
};
