import { PlantProfile } from './types';

export const PLANT_PROFILES: PlantProfile[] = [
    {
        id: 'monstera',
        influxId: '3', // Based on user example
        name: 'Monstera Deliciosa',
        description: 'Plante tropicale aimant la lumière indirecte.',
        needs: {
            temperature: { min: 18, max: 27 },
            humidite: { min: 40, max: 70 },
            humidite_sol: { min: 20, max: 60 },
            luminosite: { min: 30, max: 70 }
        },
        imagePath: '/plants/monstera.png'
    },
    {
        id: 'cactus',
        influxId: '1',
        name: 'Cactus & Succulentes',
        description: 'Plante du désert, besoin de beaucoup de lumière et peu d\'eau.',
        needs: {
            temperature: { min: 10, max: 35 },
            humidite: { min: 10, max: 40 },
            humidite_sol: { min: 0, max: 30 },
            luminosite: { min: 60, max: 100 }
        },
        imagePath: '/plants/cactus.png'
    },
    {
        id: 'calathea',
        influxId: '2',
        name: 'Calathea',
        description: 'Plante ombragée aimant l\'humidité élevée.',
        needs: {
            temperature: { min: 18, max: 24 },
            humidite: { min: 60, max: 80 },
            humidite_sol: { min: 40, max: 70 },
            luminosite: { min: 15, max: 50 }
        },
        imagePath: '/plants/calathea.png'
    },
    {
        id: 'basilic',
        influxId: '4',
        name: 'Basilic',
        description: 'Herbe aromatique, aime le soleil et l\'eau constante.',
        needs: {
            temperature: { min: 15, max: 25 },
            humidite: { min: 40, max: 60 },
            humidite_sol: { min: 40, max: 80 },
            luminosite: { min: 50, max: 90 }
        },
        imagePath: '/plants/basil.png'
    },
    {
        id: 'aloe_vera',
        influxId: '5',
        name: 'Aloe Vera',
        description: 'Plante succulente, très résistante et dépolluante.',
        needs: {
            temperature: { min: 15, max: 30 },
            humidite: { min: 30, max: 50 },
            humidite_sol: { min: 10, max: 30 },
            luminosite: { min: 60, max: 100 }
        },
        imagePath: '/plants/aloe_vera.png'
    },
    {
        id: 'ficus',
        influxId: '6',
        name: 'Ficus Elastica',
        description: 'Plante caoutchouc, aime la lumière vive mais pas directe.',
        needs: {
            temperature: { min: 15, max: 24 },
            humidite: { min: 40, max: 60 },
            humidite_sol: { min: 30, max: 60 },
            luminosite: { min: 40, max: 80 }
        },
        imagePath: '/plants/ficus.png'
    },
    {
        id: 'orchidee',
        influxId: '7',
        name: 'Orchidée (Phalaenopsis)',
        description: 'Plante délicate, aime l\'humidité et la lumière tamisée.',
        needs: {
            temperature: { min: 18, max: 25 },
            humidite: { min: 50, max: 70 },
            humidite_sol: { min: 40, max: 60 },
            luminosite: { min: 30, max: 60 }
        },
        imagePath: '/plants/orchid.png'
    },
    {
        id: 'pothos',
        influxId: '8',
        name: 'Pothos (Epipremnum)',
        description: 'Plante grimpante très robuste, tolère bien l\'ombre.',
        needs: {
            temperature: { min: 15, max: 30 },
            humidite: { min: 40, max: 80 },
            humidite_sol: { min: 20, max: 60 },
            luminosite: { min: 10, max: 60 }
        },
        imagePath: '/plants/pothos.png'
    },
    {
        id: 'menthe',
        influxId: '9',
        name: 'Menthe',
        description: 'Plante aromatique envahissante, adore l\'eau.',
        needs: {
            temperature: { min: 10, max: 20 },
            humidite: { min: 50, max: 80 },
            humidite_sol: { min: 60, max: 90 },
            luminosite: { min: 50, max: 100 }
        },
        imagePath: '/plants/mint.png'
    }
];
