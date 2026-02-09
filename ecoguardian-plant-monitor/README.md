# EcoGuardian Plant Monitor (Frontend)

L'application **EcoGuardian** est l'interface utilisateur du système. C'est une **Single Page Application (SPA)** moderne conçue pour visualiser en temps réel l'état des serres et des plantes.

## 🛠️ Stack Technique

- **Framework** : React 18
- **Build Tool** : Vite (Rapide, HMR instantané)
- **Langage** : TypeScript (Pour la robustesse du code)
- **Styles** : Tailwind CSS (Design Utility-first) + CSS Modules
- **Graphiques** : Recharts (Visualisation de données responsive)
- **Données** : InfluxDB Client (Flux Query)

## 🌟 Fonctionnalités Principales

### 📊 Dashboard Temps Réel
- Connexion directe à **InfluxDB** pour récupérer les métriques brutes (Température, Humidité, Luminosité).
- Rafraîchissement automatique toutes les 10 secondes.
- Indicateur "Live" vs "Historique".

### 🧠 Logique Métier "Bien-être"
Le frontend contient l'intelligence d'analyse des données :
- Chaque plante a un **Profil** (Besoins min/max).
- Un algorithme compare les données capteurs vs le Profil.
- **Score (0-100%)** : Calculé en temps réel pour donner un indicateur simple à l'utilisateur.

### 🎨 Expérience Utilisateur (UX)
- **Mode Sombre/Clair** : Bascule automatique ou manuelle.
- **Fond Dynamique** : L'arrière-plan change selon l'heure (Jour/Nuit) avec effet de flou.
- **Plante Virtuelle** : Une représentation visuelle qui change d'état (Heureuse, Assoiffée, Gelée...) en fonction des données.

### 💾 Architecture de Données

Le frontend utilise plusieurs "Services" pour gérer ses données :

| Service | Fichier | Rôle |
| :--- | :--- | :--- |
| **API Service** | `services/api.ts` | Discute avec le Backend pour sauver la configuration des plantes. |
| **Influx Service** | `services/influxService.ts` | Exécute des requêtes Flux (SQL-like) vers la base de données temporelle. |
| **Log Service** | `services/LogService.ts` | Système de journalisation interne qui synchronise avec le Backend. |
| **Discord** | `services/discordService.ts` | Envoi de webhooks en cas d'alerte critique. |

## 📦 Structure du Projet

```
src/
├── components/         # Briques UI réutilisables (Cartes, Graphiques, Modales...)
├── hooks/              # Logique React (usePlantMonitor, useTheme...)
├── services/           # Couche de communication (API, Influx, Logs)
├── utils/              # Fonctions de calcul (wellness, date format)
├── constants.ts        # Profils de plantes (Data statique)
├── types.ts            # Définitions TypeScript (Interfaces)
├── App.tsx             # Point d'entrée et routing
└── main.tsx            # Initialisation React
```

## 🔧 Configuration (.env)

L'application nécessite des variables d'environnement pour se connecter aux services externes.

```bash
VITE_INFLUX_URL=https://ecoguardian.duckdns.org:8086
VITE_INFLUX_TOKEN=...
VITE_INFLUX_ORG=maison
VITE_INFLUX_BUCKET=plante_data
```
