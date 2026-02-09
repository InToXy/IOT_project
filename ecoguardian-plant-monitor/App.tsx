import React, { useState, useEffect } from 'react';
import { Tracker, PlantProfile } from './types';
import { PLANT_PROFILES } from './constants';
import { TrackerList } from './components/TrackerList';
import { Dashboard } from './components/Dashboard';
import { usePlantMonitor } from './hooks/usePlantMonitor';
import { fetchTrackers, saveTrackers } from './services/api';
import { logger } from './services/LogService';

function App() {
  // --- STATE ---
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);

  // --- GLOBAL MONITORING ---
  const latestData = usePlantMonitor(trackers);

  // --- PERSISTENCE ---

  // Load trackers from API on mount
  useEffect(() => {
    logger.info('Application started');
    const load = async () => {
      const savedTrackers = await fetchTrackers();
      if (savedTrackers && savedTrackers.length > 0) {
        setTrackers(savedTrackers);
        logger.info(`Loaded ${savedTrackers.length} trackers`);
      } else {
        // Default initial tracker if empty
        const defaultTracker: Tracker = {
          id: 'default-1',
          name: 'Ma Première Plante',
          sensorId: '1',
          greenhouseId: '1',
          plantId: PLANT_PROFILES[0].id
        };
        setTrackers([defaultTracker]);
        saveTrackers([defaultTracker]); // Save default to server
        logger.warn('No trackers found, created default tracker');
      }
    };
    load();
  }, []);

  // --- HANDLERS ---

  const handleAddTracker = async (tracker: Tracker) => {
    const updated = [...trackers, tracker];
    setTrackers(updated);
    await saveTrackers(updated);
    logger.success(`Added new tracker: ${tracker.name}`);
  };

  const handleRemoveTracker = async (id: string) => {
    const updated = trackers.filter(t => t.id !== id);
    setTrackers(updated);
    if (selectedTracker?.id === id) {
      setSelectedTracker(null);
    }
    await saveTrackers(updated);
    logger.warn(`Removed tracker: ${id}`);
  };

  const handleSelectTracker = (tracker: Tracker) => {
    setSelectedTracker(tracker);
    logger.info(`View dashboard for: ${tracker.name}`);
  };

  const handleBack = () => {
    setSelectedTracker(null);
  };

  // --- RENDER ---

  if (selectedTracker) {
    return (
      <Dashboard
        tracker={selectedTracker}
        onBack={handleBack}
      />
    );
  }

  return (
    <TrackerList
      trackers={trackers}
      plantDataMap={latestData}
      onAddTracker={handleAddTracker}
      onRemoveTracker={handleRemoveTracker}
      onSelectTracker={handleSelectTracker}
    />
  );
}

export default App;