import { Tracker } from "../types";

const API_URL = '/api/trackers';

export const fetchTrackers = async (): Promise<Tracker[]> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch trackers: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching trackers:", error);
        return [];
    }
};

export const saveTrackers = async (trackers: Tracker[]): Promise<boolean> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(trackers),
        });
        if (!response.ok) {
            throw new Error(`Failed to save trackers: ${response.statusText}`);
        }
        return true;
    } catch (error) {
        console.error("Error saving trackers:", error);
        return false;
    }
};
