import React, { useState } from 'react';
import { Tracker, PlantData } from '../types';
import { PLANT_PROFILES } from '../constants';
import { SproutIcon, ActivityIcon, LogOutIcon, SunIcon, MoonIcon } from './Icons';
import { TrackerCard } from './TrackerCard';
import { calculateWellness } from '../utils/wellness';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';
import { AuroraText } from './AuroraText';

interface TrackerListProps {
    trackers: Tracker[];
    plantDataMap: Map<string, PlantData>;
    onAddTracker: (tracker: Tracker) => void;
    onRemoveTracker: (id: string) => void;
    onSelectTracker: (tracker: Tracker) => void;
}

export const TrackerList: React.FC<TrackerListProps> = ({ trackers, plantDataMap, onAddTracker, onRemoveTracker, onSelectTracker }) => {
    const { theme, toggleTheme } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    const [newTracker, setNewTracker] = useState<Partial<Tracker>>({
        name: '',
        sensorId: '',
        greenhouseId: '',
        plantId: PLANT_PROFILES[0].id
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTracker.name && newTracker.sensorId && newTracker.greenhouseId && newTracker.plantId) {
            onAddTracker({
                id: crypto.randomUUID(),
                name: newTracker.name,
                sensorId: newTracker.sensorId,
                greenhouseId: newTracker.greenhouseId,
                plantId: newTracker.plantId
            } as Tracker);
            setIsAdding(false);
            setNewTracker({ name: '', sensorId: '', greenhouseId: '', plantId: PLANT_PROFILES[0].id });
        }
    };

    // --- GROUPING LOGIC ---
    const greenhouses = Array.from(new Set(trackers.map(t => t.greenhouseId))).sort();

    return (
        <div className="min-h-screen bg-[#f0fdf4] dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-emerald-800 dark:text-emerald-400 flex items-center justify-center gap-3 mb-2">
                        <SproutIcon className="w-10 h-10" />
                        <span>
                            <AuroraText colors={["#34d399", "#10b981", "#2dd4bf", "#059669"]}>Eco</AuroraText>Guardian
                        </span>
                    </h1>
                    <p className="text-emerald-600 dark:text-emerald-400">Tableau de bord de surveillance des serres</p>
                </header>

                {/* Action Bar */}
                <div className="flex justify-between items-center mb-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mes Serres</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{trackers.length} plantes suivies dans {greenhouses.length} serres</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm font-medium"
                        >
                            {isAdding ? 'Annuler' : '+ Ajouter une plante'}
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 px-3 py-2.5 rounded-lg transition-colors flex items-center shadow-sm"
                            title={theme === 'dark' ? "Passer en mode clair" : "Passer en mode sombre"}
                        >
                            <SunIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => window.location.href = '/authelia/logout'}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-2.5 rounded-lg transition-colors flex items-center shadow-sm"
                            title="Se déconnecter"
                        >
                            <LogOutIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {isAdding && (
                    <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-md mb-8 border border-slate-100 animate-fade-in ring-4 ring-emerald-50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Nouvelle Plante</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Suivi</label>
                                <input
                                    type="text"
                                    required
                                    value={newTracker.name}
                                    onChange={e => setNewTracker({ ...newTracker, name: e.target.value })}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 border"
                                    placeholder="Ex: Monstera Salon"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type de Plante</label>
                                <select
                                    value={newTracker.plantId}
                                    onChange={e => setNewTracker({ ...newTracker, plantId: e.target.value })}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 border bg-white"
                                >
                                    {PLANT_PROFILES.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ID Plante (Influx)</label>
                                <input
                                    type="text"
                                    required
                                    value={newTracker.sensorId}
                                    onChange={e => setNewTracker({ ...newTracker, sensorId: e.target.value })}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 border"
                                    placeholder="Ex: 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ID Serre</label>
                                <input
                                    type="text"
                                    required
                                    value={newTracker.greenhouseId}
                                    onChange={e => setNewTracker({ ...newTracker, greenhouseId: e.target.value })}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 border"
                                    placeholder="Ex: 1"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-medium transition-colors shadow-sm"
                            >
                                Confirmer l'ajout
                            </button>
                        </div>
                    </form>
                )}

                {/* GREENHOUSE SECTIONS */}
                <div className="space-y-12">
                    {greenhouses.map(ghId => {
                        const houseTrackers = trackers.filter(t => t.greenhouseId === ghId);

                        // Calculate Average Score for this Greenhouse
                        let totalScore = 0;
                        let plantCount = 0;

                        houseTrackers.forEach(t => {
                            const data = plantDataMap.get(t.id);
                            const profile = PLANT_PROFILES.find(p => p.id === t.plantId);
                            if (data && profile) {
                                totalScore += calculateWellness(data, profile);
                                plantCount++;
                            }
                        });

                        const avgScore = plantCount > 0 ? Math.round(totalScore / plantCount) : 0;

                        // Determine color
                        let scoreColor = 'bg-slate-200 text-slate-600';
                        if (plantCount > 0) {
                            if (avgScore >= 75) scoreColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                            else if (avgScore >= 50) scoreColor = 'bg-amber-100 text-amber-700 border-amber-200';
                            else scoreColor = 'bg-rose-100 text-rose-700 border-rose-200';
                        }


                        return (
                            <div key={ghId} className="animate-fade-in">
                                <div className="flex items-center gap-4 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <div className="bg-emerald-600 text-white rounded-lg p-2 shadow-sm">
                                        <span className="text-lg font-bold">Serre {ghId}</span>
                                    </div>

                                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${scoreColor}`}>
                                        <ActivityIcon className="w-4 h-4" />
                                        <span>Bien-être Global : {plantCount > 0 ? `${avgScore}%` : 'En attente'}</span>
                                    </div>

                                    <div className="text-slate-400 dark:text-slate-500 text-sm ml-auto">
                                        {houseTrackers.length} plante{houseTrackers.length > 1 ? 's' : ''}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {houseTrackers.map(tracker => (
                                        <TrackerCard
                                            key={tracker.id}
                                            tracker={tracker}
                                            data={plantDataMap.get(tracker.id)} // Pass global data
                                            onSelect={onSelectTracker}
                                            onRemove={onRemoveTracker}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {trackers.length === 0 && !isAdding && (
                    <div className="text-center py-12 text-slate-500 bg-white/50 rounded-xl border-2 border-dashed border-slate-200 mt-8">
                        <p className="text-lg font-medium">Aucune serre configurée.</p>
                        <p className="text-sm mt-1">Cliquez sur "Ajouter une plante" pour commencer à surveiller vos serres.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
