import { useEffect, useRef, useState } from 'react';
import { Tracker, PlantData } from '../types';
import { PLANT_PROFILES } from '../constants';
import { fetchPlantDataFromInflux, DEFAULT_CONFIG } from '../services/influxService';
import { sendDiscordAlert, sendInactivityAlert } from '../services/discordService';
import { calculateWellness } from '../utils/wellness';

// 5 Minutes inactivity threshold
const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;
// 1 hour cooldown for REPEATED alerts
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

interface AlertState {
    lastHealthAlert: number;
    lastInactivityAlert: number;
    lastWellnessScore: number | null; // To detect Good->Bad transitions
    wasInactive: boolean; // To detect Active->Inactive transitions
}

export const usePlantMonitor = (trackers: Tracker[]) => {
    // Shared Data State
    const [latestData, setLatestData] = useState<Map<string, PlantData>>(new Map());

    // Keep track of alert states
    const alertStateRef = useRef<Map<string, AlertState>>(new Map());

    useEffect(() => {
        const checkStatus = async () => {
            const now = Date.now();
            const newDataMap = new Map<string, PlantData>();

            // Iterate over all trackers serially
            for (const tracker of trackers) {
                // Initialize alert state if needed
                if (!alertStateRef.current.has(tracker.id)) {
                    alertStateRef.current.set(tracker.id, {
                        lastHealthAlert: 0,
                        lastInactivityAlert: 0,
                        lastWellnessScore: null,
                        wasInactive: false
                    });
                }
                const state = alertStateRef.current.get(tracker.id)!;

                try {
                    // Fetch latest data point
                    const result = await fetchPlantDataFromInflux(DEFAULT_CONFIG, tracker.sensorId, tracker.greenhouseId, "-1h");
                    const current = result.length > 0 ? result[result.length - 1] : null;

                    if (current) {
                        newDataMap.set(tracker.id, current);
                    }

                    // 1. Check Inactivity
                    let isInactive = false;
                    if (!current) {
                        isInactive = true;
                    } else {
                        const lastDataTime = new Date(current.originalDate).getTime();
                        if (now - lastDataTime > INACTIVITY_THRESHOLD_MS) {
                            isInactive = true;
                        }
                    }

                    // Inactivity Alert Logic
                    if (isInactive) {
                        const isNewIncident = !state.wasInactive; // Active -> Inactive
                        const cooldownPassed = now - state.lastInactivityAlert > ALERT_COOLDOWN_MS;

                        if (isNewIncident || cooldownPassed) {
                            console.log(`[Monitor] Sending Inactivity Alert for ${tracker.name}`);
                            await sendInactivityAlert(tracker.name, tracker.greenhouseId, 5);
                            state.lastInactivityAlert = now;
                            state.wasInactive = true;
                        }
                        // Skip health check if inactive
                        continue;
                    } else {
                        state.wasInactive = false; // Reset inactivity state
                    }

                    // 2. Check Health (Wellness)
                    if (current) {
                        const plantProfile = PLANT_PROFILES.find(p => p.id === tracker.plantId);
                        if (plantProfile) {
                            const wellnessScore = calculateWellness(current, plantProfile);

                            const isBadState = wellnessScore <= 50;
                            // Transition from Good to Bad (or first check is Bad)
                            const isNewIncident = isBadState && (state.lastWellnessScore === null || state.lastWellnessScore > 50);

                            const cooldownPassed = now - state.lastHealthAlert > ALERT_COOLDOWN_MS;

                            if (isNewIncident || (isBadState && cooldownPassed)) {
                                console.log(`[Monitor] Sending Health Alert for ${tracker.name} (Score: ${wellnessScore})`);

                                // Generate Issues List
                                const { temperature, humidite, humidite_sol, luminosite } = plantProfile.needs;
                                const issues: string[] = [];
                                if (current.temperature < temperature.min) issues.push(`❄️ Température trop basse (${current.temperature}°C)`);
                                if (current.temperature > temperature.max) issues.push(`🔥 Température trop haute (${current.temperature}°C)`);
                                if (current.humidite < humidite.min) issues.push(`desert️ Air trop sec (${current.humidite}%)`);
                                if (current.humidite > humidite.max) issues.push(`💧 Air trop humide (${current.humidite}%)`);
                                if (current.humidite_sol < humidite_sol.min) issues.push(`🌵 Sol trop sec (${current.humidite_sol}%)`);
                                if (current.humidite_sol > humidite_sol.max) issues.push(`🌊 Sol trop arrosé (${current.humidite_sol}%)`);
                                if (current.luminosite < luminosite.min) issues.push(`🌑 Manque de lumière (${current.luminosite} %)`);
                                if (current.luminosite > luminosite.max) issues.push(`☀️ Trop de lumière (${current.luminosite} %)`);

                                await sendDiscordAlert(tracker.name, tracker.greenhouseId, wellnessScore, issues);
                                state.lastHealthAlert = now;
                            }

                            state.lastWellnessScore = wellnessScore;
                        }
                    }

                } catch (e) {
                    console.error(`[Monitor] Error checking tracker ${tracker.name}`, e);
                }
            }

            // Update global data state
            setLatestData(newDataMap);
        };

        // Run check immediately on mount/update logic
        checkStatus();

        // Then poll every 30 seconds (more frequent to catch state changes quickly)
        const interval = setInterval(checkStatus, 30000);

        return () => clearInterval(interval);
    }, [trackers]);

    return latestData;
};
