import { PlantData, PlantProfile } from '../types';

/**
 * Calcule le score de bien-être (0-100) en fonction des besoins de la plante
 * et des données actuelles.
 */
export const calculateWellness = (current: PlantData | undefined, profile: PlantProfile): number => {
    if (!current) return 0;

    let score = 0;
    const { temperature, humidite, humidite_sol, luminosite } = profile.needs;

    // Check Temperature
    if (current.temperature >= temperature.min && current.temperature <= temperature.max) score += 25;

    // Check Humidity
    if (current.humidite >= humidite.min && current.humidite <= humidite.max) score += 25;

    // Check Soil Humidity
    if (current.humidite_sol >= humidite_sol.min && current.humidite_sol <= humidite_sol.max) score += 25;

    // Check Light
    if (current.luminosite >= luminosite.min && current.luminosite <= luminosite.max) score += 25;

    return score;
};
