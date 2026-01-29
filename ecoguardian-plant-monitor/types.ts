export interface PlantData {
  time: string;
  originalDate: Date; // Keep original date for sorting if needed
  temperature: number;
  humidite: number;
  humidite_sol: number;
  humidite_sol_raw?: number;
  luminosite: number;
  luminosite_raw?: number;
  id_plante?: string;
  id_serre?: string;
  location?: string;
  rssi?: number;
}

export enum HealthStatus {
  Excellent = "Excellent",
  Bon = "Bon",
  Moyen = "Moyen",
  Critique = "Critique",
  Inconnu = "Inconnu"
}

export interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export interface Range {
  min: number;
  max: number;
}

export interface PlantProfile {
  id: string;
  influxId: string; // ID used in InfluxDB (e.g. "3")
  name: string;
  description: string;
  needs: {
    temperature: Range;
    humidite: Range;
    humidite_sol: Range;
    luminosite: Range;
  }
  imagePath: string;
}

export interface Tracker {
  id: string; // Unique ID for the tracker entry (uuid)
  name: string;
  sensorId: string;
  greenhouseId: string;
  plantId: string; // The ID of the plant type (e.g., 'monstera')
}