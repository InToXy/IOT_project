import React, { useState } from 'react';
import { Tracker, PlantData } from '../types';
import { PLANT_PROFILES } from '../constants';
import { SproutIcon, ActivityIcon, LogOutIcon, SunIcon, MoonIcon, ClipboardIcon, BellIcon } from './Icons';
import { TrackerCard } from './TrackerCard';
import { calculateWellness } from '../utils/wellness';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';
import { AuroraText } from './AuroraText';
import { LogViewer } from './LogViewer';
import { ToastContainer } from './ToastContainer';
import { logger } from '../services/LogService';
import { NotificationSettingsModal } from './NotificationSettingsModal';

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
    const [showLogs, setShowLogs] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Filter State
    const [filterGreenhouse, setFilterGreenhouse] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const [newTracker, setNewTracker] = useState<Partial<Tracker>>({
        name: '',
        sensorId: '',
        greenhouseId: '',
        plantId: PLANT_PROFILES[0].id
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTracker.name && newTracker.sensorId && newTracker.greenhouseId && newTracker.plantId) {

            // Check for duplicates
            const exists = trackers.some(t =>
                t.sensorId === newTracker.sensorId && t.greenhouseId === newTracker.greenhouseId
            );

            if (exists) {
                logger.error(`Impossible d'ajouter: La plante ${newTracker.sensorId} dans la serre ${newTracker.greenhouseId} existe déjà.`);
                return;
            }

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

    // --- FILTER LOGIC ---
    const filteredTrackers = trackers.filter(t => {
        // Filter by Greenhouse
        if (filterGreenhouse !== 'all' && t.greenhouseId !== filterGreenhouse) return false;

        // Filter by Type
        if (filterType !== 'all' && t.plantId !== filterType) return false;

        // Filter by Status (Wellness)
        if (filterStatus !== 'all') {
            const data = plantDataMap.get(t.id);
            const profile = PLANT_PROFILES.find(p => p.id === t.plantId);
            const score = (data && profile) ? calculateWellness(data, profile) : 0;

            if (filterStatus === 'critical' && score >= 50) return false; // < 50
            if (filterStatus === 'warning' && (score < 50 || score >= 75)) return false; // 50-74
            if (filterStatus === 'healthy' && score < 75) return false; // >= 75
        }

        return true;
    });

    // --- GROUPING LOGIC (Applied to Filtered List) ---
    // We only show greenhouses that have at least one tracker after filtering
    const visibleGreenhouses = Array.from(new Set(filteredTrackers.map(t => t.greenhouseId))).sort();

    // Lists for dropdowns (based on ALL trackers to allow selecting any option)
    const allGreenhouses = Array.from(new Set(trackers.map(t => t.greenhouseId))).sort();
    const allPlantTypes = Array.from(new Set(trackers.map(t => t.plantId)));

    return (
        <div className="min-h-screen p-8 transition-colors duration-300">
            <ToastContainer />
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
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mes Serres</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {filteredTrackers.length} plantes affichées ({trackers.length} total)
                        </p>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <select
                            value={filterGreenhouse}
                            onChange={(e) => setFilterGreenhouse(e.target.value)}
                            className="bg-white dark:bg-slate-800 border-none text-sm text-slate-700 dark:text-slate-200 rounded-md py-1.5 focus:ring-emerald-500"
                        >
                            <option value="all">Toutes Serres</option>
                            {allGreenhouses.map(g => <option key={g} value={g}>Serre {g}</option>)}
                        </select>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white dark:bg-slate-800 border-none text-sm text-slate-700 dark:text-slate-200 rounded-md py-1.5 focus:ring-emerald-500"
                        >
                            <option value="all">Tous Types</option>
                            {allPlantTypes.map(id => {
                                const p = PLANT_PROFILES.find(profile => profile.id === id);
                                return <option key={id} value={id}>{p ? p.name : id}</option>
                            })}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white dark:bg-slate-800 border-none text-sm text-slate-700 dark:text-slate-200 rounded-md py-1.5 focus:ring-emerald-500"
                        >
                            <option value="all">Tous États</option>
                            <option value="healthy">🌿 En forme (&ge;75%)</option>
                            <option value="warning">⚠️ Moyen (50-75%)</option>
                            <option value="critical">🔥 Critique (&lt;50%)</option>
                        </select>

                        {(filterGreenhouse !== 'all' || filterType !== 'all' || filterStatus !== 'all') && (
                            <button
                                onClick={() => {
                                    setFilterGreenhouse('all');
                                    setFilterType('all');
                                    setFilterStatus('all');
                                }}
                                className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm font-medium whitespace-nowrap"
                        >
                            {isAdding ? 'Annuler' : '+ Ajouter'}
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowLogs(true)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2.5 rounded-lg transition-colors flex items-center shadow-sm"
                                title="Voir les logs système"
                            >
                                <ClipboardIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2.5 rounded-lg transition-colors flex items-center shadow-sm"
                                title="Paramètres de notification"
                            >
                                <BellIcon className="w-5 h-5" />
                            </button>
                        </div>

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

                {/* GREENHOUSE SECTIONS (Filtered) */}
                <div className="space-y-12">
                    {visibleGreenhouses.map(ghId => {
                        const houseTrackers = filteredTrackers.filter(t => t.greenhouseId === ghId);

                        // Calculate Average Score for this Greenhouse (based on visible/filtered trackers or all? Usually visible)
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

                {trackers.length > 0 && filteredTrackers.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white/50 rounded-xl border-2 border-dashed border-slate-200 mt-8">
                        <p className="text-lg font-medium">Aucun résultat.</p>
                        <p className="text-sm mt-1">Essayez de modifier vos filtres.</p>
                    </div>
                )}
            </div>

            <LogViewer
                isOpen={showLogs}
                onClose={() => setShowLogs(false)}
            />

            {/* Settings Modal */}
            <NotificationSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </div>
    );
};
