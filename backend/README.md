# EcoGuardian Backend API

Le service **Backend** est le cerveau persistant de l'application EcoGuardian. Il s'assure que la configuration de l'utilisateur (quelles plantes sont suivies, dans quelles serres) et les journaux systèmes sont conservés et synchronisés entre tous les appareils.

## 🛠️ Stack Technique

- **Runtime** : Node.js (v18 Alpine)
- **Framework** : Express.js (Leger et rapide)
- **Base de Données** : JSON-DB (Système de fichiers plat)
- **Sécurité** : CORS activé, mais accès restreint par le Reverse Proxy (Traefik + Authelia).

## 🚀 Fonctionnalités Clés

### 1. Persistance des Trackers (Plantes)
Contrairement au `localStorage` du navigateur qui est propre à chaque appareil, ce backend stocke la configuration dans un fichier JSON centralisé.
- **Stockage** : `data/trackers.json`
- **Volume Docker** : Le dossier `/data` est monté sur l'hôte pour survivre aux redémarrages de conteneurs.

### 2. Journalisation Centralisée (Logs)
Le backend agit comme un collecteur de logs pour le frontend.
- **Fonctionnement** : Le frontend envoie ses logs (erreurs, infos, succès) au backend via l'API.
- **Stockage** : `data/logs.jsonl` (JSON Lines - optimisé pour l'ajout rapide de lignes).
- **Intêret** : Permet de voir ce qui s'est passé (déconnexions, erreurs capteurs) même si l'utilisateur a fermé son navigateur.

## 🔌 API Endpoints

Tous les endpoints sont préfixés par `/api`.

| Méthode | Endpoint | Description | Payload Exemple |
| :--- | :--- | :--- | :--- |
| `GET` | `/trackers` | Récupère la liste de toutes les plantes suivies. | `[{"id": "...", "name": "Monstera"...}]` |
| `POST` | `/trackers` | Met à jour la liste complète (Full Sync). | `[{"id": "...", "name": "Monstera"...}]` |
| `GET` | `/logs` | Récupère les 200 derniers logs systèmes. | - |
| `POST` | `/logs` | Ajoute une nouvelle entrée de log. | `{"level": "info", "message": "..."}` |

## 📦 Structure des Fichiers

```
backend/
├── Dockerfile          # Configuration de l'image Docker (Build)
├── package.json        # Dépendances (express, cors, body-parser)
├── server.js           # Point d'entrée unique de l'application
└── data/               # [VOLUME] Données persistantes (JSON)
    ├── trackers.json   # Base de données des plantes
    └── logs.jsonl      # Base de données des logs
```

## 🔐 Sécurité

Ce service n'a **pas** d'authentification intégrée dans le code Node.js. C'est un choix d'architecture (micro-service simple).
**Cependant**, il est sécurisé par l'infrastructure :
1.  **Non exposé** : Il n'est pas accessible directement depuis internet.
2.  **Proxy** : Seul Traefik peut lui parler via la route `/api`.
3.  **Auth** : Traefik exige une authentification **Authelia** avant de laisser passer une requête vers ce service.
