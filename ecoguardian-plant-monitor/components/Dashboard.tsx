import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlantData, PlantProfile, Tracker } from '../types';
import { PLANT_PROFILES } from '../constants';
import { fetchPlantDataFromInflux, DEFAULT_CONFIG } from '../services/influxService';
import { sendDiscordAlert, sendInactivityAlert } from '../services/discordService';
import { calculateWellness } from '../utils/wellness';
import { MetricCard } from './MetricCard';
import { VirtualPlant } from './VirtualPlant';
import { MetricModal } from './MetricModal';
import { PlantDetailCard } from './PlantDetailCard';
import { ThermometerIcon, DropletsIcon, SunIcon, SproutIcon, ActivityIcon, AlertTriangleIcon, RefreshIcon, LogOutIcon, SoilHumidityIcon, MoonIcon } from './Icons';
import { ThemeToggle } from './ThemeToggle';

interface DashboardProps {
  tracker: Tracker;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tracker, onBack }) => {
  const [data, setData] = useState<PlantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Plant Profile is derived from the tracker
  const selectedPlant = PLANT_PROFILES.find(p => p.id === tracker.plantId) || PLANT_PROFILES[0];

  const [timeRange, setTimeRange] = useState<string>("-1h");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isInactive, setIsInactive] = useState(false);

  // State for Modal
  const [selectedMetric, setSelectedMetric] = useState<{
    key: keyof PlantData;
    title: string;
    color: string;
    unit: string;
    min?: number;
    max?: number;
  } | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      let customStart: string | undefined;
      let customStop: string | undefined;

      if (selectedDate) {
        // Logic for specific date (00:00 to 23:59 of that day)
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const stop = new Date(selectedDate);
        stop.setHours(23, 59, 59, 999);

        customStart = start.toISOString();
        customStop = stop.toISOString();
      }

      const results = await fetchPlantDataFromInflux(DEFAULT_CONFIG, tracker.sensorId, tracker.greenhouseId, timeRange, customStart, customStop);
      setData(results);
    } catch (err: any) {
      console.error("Erreur InfluxDB:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh only if showing relative time (live), not historical date
    let interval: any = null;
    if (!selectedDate) {
      interval = setInterval(loadData, 10000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [tracker.sensorId, tracker.greenhouseId, timeRange, selectedDate]);

  const current = data.length > 0 ? data[data.length - 1] : {
    temperature: 0, humidite: 0, humidite_sol: 0, luminosite: 0
  };

  /* Calcul du Bien-être */
  let wellnessScore = 0;
  if (data.length > 0) {
    wellnessScore = calculateWellness(current, selectedPlant);
  }

  // --- Inactivity Check (Visual Only) ---
  useEffect(() => {
    // Only check if we are not loading
    if (!loading) {
      const INACTIVITY_THRESHOLD_MINUTES = 30; // Visual threshold can be different or same
      const now = Date.now();
      let inactive = false;

      if (data.length === 0) {
        inactive = true;
      } else {
        const lastDataTime = new Date(data[data.length - 1].originalDate).getTime();
        if ((now - lastDataTime) > INACTIVITY_THRESHOLD_MINUTES * 60 * 1000) {
          inactive = true;
        }
      }

      setIsInactive(inactive);
    }
  }, [data, loading]);



  // Formatteur d'axe X dynamique
  const formatXAxis = (tickItem: any) => {
    if (!tickItem) return "";
    const date = new Date(tickItem);
    if (timeRange === "-7d" && !selectedDate) {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
    // For 24h, 1h, or specific date, we show Time
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pb-12 bg-[#f0fdf4] dark:bg-slate-900 transition-colors duration-300">
      {/* Header avec Gradient et Plante Virtuelle */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-950 dark:to-slate-900 pb-24 pt-8 px-6 shadow-lg relative overflow-hidden transition-colors duration-500">
        {/* Cercles décoratifs en arrière-plan */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-5"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-white opacity-5"></div>

        <div className="max-w-7xl mx-auto relative z-10">

          <button
            onClick={onBack}
            className="mb-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors font-medium bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm w-fit hover:bg-white/20"
          >
            ← Retour aux plantes
          </button>

          <div className="flex flex-col md:flex-row items-center justify-between">

            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl font-bold text-white flex items-center justify-center md:justify-start gap-3 mb-2">
                <SproutIcon /> {tracker.name}
              </h1>
              <p className="text-emerald-100 opacity-90 text-lg mb-4">
                {selectedPlant.name} • Serre {tracker.greenhouseId} • Plante {tracker.sensorId}
              </p>

              {/* Plant & Greenhouse Selector & Wellness Score */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
                  <select
                    value={timeRange}
                    onChange={(e) => {
                      setTimeRange(e.target.value);
                      setSelectedDate(""); // Reset date if range is selected
                    }}
                    className="bg-transparent text-white border-none rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-white/50 cursor-pointer outline-none"
                    style={{ color: 'white' }}
                  >
                    <option className="text-slate-800 dark:text-slate-800" value="-1h">Dernière heure</option>
                    <option className="text-slate-800 dark:text-slate-800" value="-24h">24 heures</option>
                    <option className="text-slate-800 dark:text-slate-800" value="-7d">7 jours</option>
                  </select>

                  <span className="text-white/50">|</span>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setTimeRange("custom"); // Override range
                    }}
                    className="bg-transparent text-white border-none text-sm focus:ring-2 focus:ring-white/50 cursor-pointer outline-none px-2 py-1 placeholder-white/50"
                    style={{ colorScheme: 'dark' }} // Attempt to make calendar dark mode friendly
                  />
                </div>

                {/* Last Update Indicator */}
                <div className={`flex items-center px-3 py-2 rounded-lg backdrop-blur-md border border-white/20 text-white font-medium text-sm
                  ${(data.length > 0 && (Date.now() - new Date(data[data.length - 1].originalDate).getTime()) / 60000 < 5) ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`}>
                  <span className="mr-2">🕒</span>
                  {data.length > 0 ? (
                    <span>
                      Dernière maj: {new Date(data[data.length - 1].originalDate).toLocaleTimeString()}
                      <span className="text-xs opacity-75 ml-1">
                        ({Math.floor((Date.now() - new Date(data[data.length - 1].originalDate).getTime()) / 60000)} min)
                      </span>
                    </span>
                  ) : (
                    <span>En attente de données...</span>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={loadData}
                  disabled={loading}
                  className={`p-2 rounded-lg backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/10 active:scale-95 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                  title="Rafraîchir les données"
                >
                  <RefreshIcon className={loading ? "animate-spin" : ""} />
                </button>

                {/* Wellness Score Badge */}
                <div className={`inline-flex items-center px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 text-white font-bold shadow-lg
                  ${wellnessScore >= 75 ? 'bg-emerald-500/80' : wellnessScore >= 50 ? 'bg-amber-500/80' : 'bg-rose-500/80'}`}>
                  <ActivityIcon />
                  <span className="ml-2">Bien-être : {wellnessScore}%</span>
                </div>

                <ThemeToggle className="bg-white/10 border border-white/20 text-white hover:bg-white/20 relative z-50" />



                <button
                  onClick={() => window.location.href = '/authelia/logout'}
                  className="p-2 rounded-lg backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/10 active:scale-95 bg-rose-500/50 hover:bg-rose-600/50"
                  title="Se déconnecter"
                >
                  <LogOutIcon />
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-500/80 text-white px-4 py-2 rounded-lg text-sm font-medium border border-white/20">
                  ⚠️ Erreur : {error}
                </div>
              )}
            </div>

            {/* Plante Virtuelle */}
            <div className="bg-white/10 backdrop-blur-md rounded-full p-6 border border-white/20 shadow-2xl transform hover:scale-105 transition-transform mt-6 md:mt-0">
              <VirtualPlant
                wellnessScore={wellnessScore}
              />
              <div className="text-center mt-2">
                <span className="text-white/80 text-sm font-medium px-3 py-1 bg-black/20 rounded-full">
                  {selectedPlant.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isInactive && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-amber-500/10 border border-amber-500/50 text-amber-900 px-4 py-3 rounded-lg flex items-center shadow-lg" role="alert">
            <div className="text-amber-500 mr-4">
              <AlertTriangleIcon />
            </div>
            <div>
              <p className="font-bold">Alerte Inactivité System</p>
              <p className="text-sm">Aucune donnée reçue depuis plus de 30 minutes. Vérifiez le capteur ou la connexion.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">

        {/* Détail de la Plante Sélectionnée */}
        <PlantDetailCard plant={selectedPlant} />

        {/* Grille des cartes (CLIQUABLES) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Température"
            value={current.temperature}
            unit="°C"
            icon={<ThermometerIcon />}
            colorClass="text-rose-500"
            bgColorClass="bg-rose-50"
            onClick={() => setSelectedMetric({
              key: 'temperature',
              title: 'Température',
              color: '#e74c3c',
              unit: '°C',
              min: selectedPlant.needs.temperature.min,
              max: selectedPlant.needs.temperature.max
            })}
            min={selectedPlant.needs.temperature.min}
            max={selectedPlant.needs.temperature.max}
          />
          <MetricCard
            title="Humidité Air"
            value={current.humidite}
            unit="%"
            icon={<DropletsIcon />}
            colorClass="text-sky-500"
            bgColorClass="bg-sky-50"
            onClick={() => setSelectedMetric({
              key: 'humidite',
              title: 'Humidité Air',
              color: '#3498db',
              unit: '%',
              min: selectedPlant.needs.humidite.min,
              max: selectedPlant.needs.humidite.max
            })}
            min={selectedPlant.needs.humidite.min}
            max={selectedPlant.needs.humidite.max}
          />
          <MetricCard
            title="Humidité Sol"
            value={current.humidite_sol}
            unit="%"
            subValue={`Raw: ${current.humidite_sol_raw ?? 'N/A'}`}
            icon={<SoilHumidityIcon />}
            colorClass="text-stone-500"
            bgColorClass="bg-stone-50 dark:bg-stone-800/20"
            onClick={() => setSelectedMetric({
              key: 'humidite_sol',
              title: 'Humidité Sol',
              color: '#78716c',
              unit: '%',
              min: selectedPlant.needs.humidite_sol.min,
              max: selectedPlant.needs.humidite_sol.max
            })}
            min={selectedPlant.needs.humidite_sol.min}
            max={selectedPlant.needs.humidite_sol.max}
          />
          <MetricCard
            title="Luminosité"
            value={current.luminosite}
            unit="%"
            subValue={`Raw: ${current.luminosite_raw ?? 0} Lumen`}
            icon={<SunIcon />}
            colorClass="text-amber-500"
            bgColorClass="bg-amber-50"
            onClick={() => setSelectedMetric({
              key: 'luminosite',
              title: 'Luminosité',
              color: '#f59e0b',
              unit: '%',
              min: selectedPlant.needs.luminosite.min,
              max: selectedPlant.needs.luminosite.max
            })}
            min={selectedPlant.needs.luminosite.min}
            max={selectedPlant.needs.luminosite.max}
          />
        </div>

        {/* Graphique Global */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ActivityIcon /> Vue d'ensemble
            </h2>
            <div className="flex gap-2">
              <span className="flex items-center text-xs font-medium text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500 mr-1"></span> Temp</span>
              <span className="flex items-center text-xs font-medium text-sky-500"><span className="w-2 h-2 rounded-full bg-sky-500 mr-1"></span> Air</span>
              <span className="flex items-center text-xs font-medium text-stone-500"><span className="w-2 h-2 rounded-full bg-stone-500 mr-1"></span> Sol</span>
              <span className="flex items-center text-xs font-medium text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Lum</span>
            </div>
          </div>


          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Chargement des données...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="originalDate"
                    tickFormatter={formatXAxis}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="temperature" stroke="#e74c3c" strokeWidth={2} fill="none" />
                  <Area type="monotone" dataKey="humidite" stroke="#3498db" strokeWidth={2} fill="none" />
                  <Area type="monotone" dataKey="humidite_sol" stroke="#78716c" strokeWidth={2} fill="url(#colorSol)" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="luminosite" stroke="#f59e0b" strokeWidth={2} fill="none" />
                  <defs>
                    <linearGradient id="colorSol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#78716c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#78716c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Modale Graphique Détaillé */}
      {
        selectedMetric && (
          <MetricModal
            isOpen={!!selectedMetric}
            onClose={() => setSelectedMetric(null)}
            title={selectedMetric.title}
            dataKey={selectedMetric.key}
            color={selectedMetric.color}
            unit={selectedMetric.unit}
            min={selectedMetric.min}
            max={selectedMetric.max}
            data={data}
          />
        )
      }
    </div >
  );
}