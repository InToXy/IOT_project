# EcoGuardian (Cloud & Infrastructure) - Un Campus qui vous comprend

![Logo ou Bannière](images/logo.png)

## 📌 Contexte du Projet
**Projet :** « Un campus qui vous comprend »  
**Mandat :** Cellule d’ingénierie opérationnelle  
**Objectif :** Concevoir un système connecté, interopérable et fiable pour un environnement réel.

Le campus CESI lance un programme de modernisation numérique de ses bâtiments. Il ne s’agit plus de tests ou de maquettes isolées : le besoin est concret et les attentes sont élevées.

Notre mission est de concevoir et livrer un système IoT complet, interconnecté, fiable, sécurisé, et capable de rendre un vrai service au quotidien. Ce n'est pas un terrain de jeu technologique, mais un banc d’essai pour une future solution industrialisable.

---

### 🌍 Technologies Cloud & Infrastructure

Cette architecture repose sur des composants robustes et automatisés pour garantir sécurité et accessibilité.

#### 🚦 Traefik : Le Chef d'Orchestre (Reverse Proxy)
Traefik est la pierre angulaire de notre accès distant. Il agit comme un **Reverse Proxy Edge** natif au Cloud.
- **Routage Intelligent** : Il intercepte toutes les requêtes entrantes (Port 80/443) et les redirige vers le bon conteneur (Web App ou InfluxDB) en fonction du sous-domaine.
- **Sécurité SSL/TLS Automatique** : Contrairement à un serveur web classique (Nginx/Apache) où la gestion des certificats est fastidieuse, Traefik discute nativement avec **Let's Encrypt**. Il génère et renouvelle automatiquement les certificats HTTPS pour notre domaine.
- **Sécurité** : Il expose uniquement les points d'entrée nécessaires et protège l'infrastructure interne.

#### 🦆 DuckDNS : L'Adresse Toujours Valide (Dynamic DNS)
Dans un environnement résidentiel ou mobile (4G), l'adresse IP publique change régulièrement.
- **Rôle** : DuckDNS est un service de DNS Dynamique (DDNS).
- **Fonctionnement** : Un conteneur dédié vérifie périodiquement notre IP publique et, si elle change, met à jour instantanément les enregistrements DNS mondiaux.
- **Bénéfice** : Cela garantit que `ecoguardian.duckdns.org` pointe toujours vers notre infrastructure, peu importe où elle est déployée ou si la box redémarre.

#### 🗄️ InfluxDB : La Mémoire du Temps (Time Series Database)
Base de données spécialisée pour les séries temporelloes.
- **Pourquoi ?** : Les données IoT (température, humidité) sont des flux continus marquer temporellement. InfluxDB est optimisé pour écrire et lire ces données à haute fréquence.

#### ⚛️ EcoGuardian Web : L'Interface (Vite + React)
Application moderne servie par un serveur Nginx léger. Elle consomme l'API d'InfluxDB via un proxy sécurisé pour afficher les données temps réel aux utilisateurs.

## 🏗️ Architecture du Système

Nous avons conçu une architecture distribuée et résiliente, capable de collecter, transmettre et valoriser des données en temps réel.

### Chaîne de Valeur de la Donnée
1.  **Capteurs (Edge)** : ESP32/Arduino avec capteurs Température, Humidité, Luminosité et humidité dans le Sol.
2.  **Transmission** : Protocole LoRa (Longue Portée) pour la liaison capteur-passerelle.
3.  **Transport (Broker)** : **Mosquitto** avec sécurisation TLS (MQTTS).
4.  **Traitement (Logic)** : **Node-RED** pour le déchiffrement, le filtrage et le routage.
5.  **Stockage (Time-Series)** : **InfluxDB** pour l'historisation.
6.  **Backend (API)** : **Node.js** pour la persistance centralisée de la configuration (liste des plantes).
7.  **Visualisation** : Web App et Grafana.

![Architecture Réseau](images/schema_logique.webp)

---

## 🔐 Sécurité & Confidentialité de Bout en Bout

La sécurité n'est pas une option, c'est une fondation. Nous avons mis en place une stratégie de défense en profondeur.

### 1. Chiffrement Payload (Niveau Applicatif)
La donnée est chiffrée **dès sa création** sur le microcontrôleur.
- **Algorithme** : XTEA (eXtended Tiny Encryption Algorithm) avec clé 128 bits.
- **Principe** : Le capteur chiffre les données brutes avant l'envoi LoRa. La passerelle LoRa transmet les paquets chiffrés sans pouvoir les lire.
- **Déchiffrement** : Seul le cœur du système (Node-RED), qui possède la clé privée, peut déchiffrer et exploiter la donnée.
- **Avantage** : Même si le signal radio est intercepté, la donnée reste inintelligible.

### 2. Transport Sécurisé (MQTTS)
La communication entre la passerelle et le serveur central est encapsulée dans un tunnel chiffré.
- **Protocole** : MQTT over SSL/TLS (Port 8883).
- **Certificats** : Utilisation de certificats X.509 pour authentifier le serveur et chiffrer les échanges.
- **Protection** : Empêche les attaques de type "Man-in-the-Middle" sur le réseau IP du campus.

---

## 🛡️ Résilience & Tolérance aux Pannes

Dans un environnement réel, le réseau n'est jamais garanti. Notre système est conçu pour ne perdre aucune donnée critique.

### 1. Système de Buffer Circulaire (Côté Plante)
Le capteur ne se contente pas d'envoyer et d'oublier ("Fire and Forget"). Il possède une mémoire tampon locale.
- **Fonctionnement** : Les mesures sont stockées dans un buffer circulaire (capacité : 30 mesures).
- **Rupture de lien** : Si la passerelle est injoignable, le capteur continue d'enregistrer localement.
- **Synchronisation** : Dès le retour du réseau, le buffer se vide séquentiellement, garantissant la continuité de l'historique.

### 2. Mécanisme d'Acquittement (ACK)
Chaque transmission est vérifiée.
- **Processus** : Le capteur envoie un paquet chiffré -> La passerelle le reçoit -> La passerelle renvoie un ACK.
- **Retry Logic** : Si aucun ACK n'est reçu sous 4 secondes, le capteur tente une retransmission (jusqu'à 5 essais).
- **Repli** : Après échec, il passe en mode économie d'énergie et réessaiera au prochain cycle, sans supprimer la donnée du buffer.

---

## 🚀 Fonctionnalités Clés "EcoGuardian"

### Surveillance Temps Réel
L'application web offre une vue synthétique et esthétique.
- **Tableau de bord** : Température, Humidité Air/Sol, Luminosité.
- **Score de Bien-être** : Algorithme calculant la santé globale de la plante (0-100%).
- **Plante Virtuelle** : Avatar dynamique qui change d'humeur selon les données.

![Dashboard](images/interface_web_1.png)

### Base de Données Intelligente
- Sélection parmi **9 profils de plantes** (Monstera, Cactus, Orchidée...).
- Seuils d'alerte adaptés automatiquement à chaque espèce.
- **Persistance Centralisée** : Les configurations sont sauvegardées côté serveur, permettant le partage instantané entre tous les utilisateurs (Mobile/Desktop).
- **Fiche Détail** : Affichage des besoins spécifiques de la plante sélectionnée.

![Détails Plante](images/interface_web_2.png)

### Expérience Utilisateur
- **Illustrations Uniques** : Chaque type de plante possède sa propre illustration vectorielle moderne.
- **Tableau de Bord Mobile** : Interface totalement responsive avec indicateurs de fraîcheur des données. 

### Alertes
- **Visuelles** : Les cartes clignotent en cas de danger critique.
- **Discord** : Envoi automatique d'un rapport si la santé passe sous 50%.

---

*« Vous n’êtes pas là pour “brancher des fils”. Vous êtes là pour penser comme des concepteurs de systèmes critiques. »*

---

## 🔐 Sécurité Avancée : Authentification & SSO (Authelia)

Pour sécuriser l'accès aux services critiques (Grafana, EcoGuardian Admin, etc.), nous utilisons **Authelia** en tant que fournisseur d'identité (IdP). Il agit comme un middleware de sécurité devant Traefik ("Forward Auth").

### Architecture & Fonctionnement
1.  **Interception** : Traefik intercepte la requête vers un service protégé (ex: `https://ecoguardian.duckdns.org`).
2.  **Vérification** : Il délègue la vérification à Authelia.
3.  **Décision** :
    *   Si l'utilisateur n'est pas connecté -> Redirection vers le portail de connexion Authelia.
    *   Si connecté mais droits insuffisants -> Demande de MFA (Double Facteur).
    *   Si autorisé -> La requête est transmise au service final.

### Fonctionnalités
- **Authentification Unique (SSO)** : Une seule connexion pour accéder à tous les services.
- **Portail de Connexion** : Interface soignée et simple.
- **Protection** : Bloque tout accès non autorisé aux applications internes.

---

## 🛠️ Backend & API de Persistance

Pour garantir une expérience utilisateur fluide et cohérente sur tous les appareils, EcoGuardian utilise un **backend dédié** en Node.js.

### Pourquoi un Backend ?
Contrairement à une simple application web statique, EcoGuardian a besoin de **"mémoire"**.
- Si vous ajoutez une plante sur votre PC, vous voulez la voir apparaître sur votre téléphone.
- Cette configuration (nom de la plante, ID du capteur, type de plante) ne peut pas rester stockée uniquement dans votre navigateur (LocalStorage).

### Fonctionnement Technique
1.  **Service** : Un conteneur Docker léger (`node:18-alpine`) exécute une API Express sur le port 3001.
2.  **Stockage** : Les données sont persistées dans un fichier JSON (`trackers.json`) monté via un volume Docker. C'est une solution simple, robuste et facile à sauvegarder pour cette échelle.
3.  **API REST** :
    - `GET /api/trackers` : Récupère la liste partagée des plantes.
    - `POST /api/trackers` : Met à jour la configuration pour tous les utilisateurs.
4.  **Sécurité** : L'API n'est pas exposée directement sur le web. Elle est accessible uniquement via le Reverse Proxy Traefik, authentifiée par Authelia.

---

## 🛠️ Installation & Déploiement (Branche Infra/Deploy)

Cette branche **« Cloud Simulation »** a pour objectif de déporter les services lourds (Base de données, Interface Web) hors des microcontrôleurs.

**Philosophie de l'architecture :**
- **Edge (Plantes)** : On garde uniquement la logique critique et les capteurs au plus près du vivant.
- **Cloud (Ce serveur)** : On externalise le stockage (InfluxDB) et la visualisation (Web App) pour centraliser les données et offrir un accès distant sécurisé.

Elle contient la configuration complète pour déployer cette infrastructure sur un serveur VPS ou un Raspberry Pi via **Docker**.

### Pré-requis
- Docker & Docker Compose
- Ports 80, 443 et 8086 ouverts sur le routeur
- Un nom de domaine (ex: DuckDNS)

### Services Déployés
Une fois le `docker-compose up -d` lancé, voici les accès :

| Service | Accès (URL/Port) | Authentification |
| :--- | :--- | :--- |
| **EcoGuardian App** | `https://ecoguardian.duckdns.org` | Authelia (2FA) |
| **Grafana** | `https://ecoguardian.duckdns.org/grafana` | Aucune (Interne) |
| **InfluxDB** | `https://ecoguardian.duckdns.org:8086` | Token / Login de base |
| **Backend API** | `https://ecoguardian.duckdns.org/api` | Authelia (2FA) |
| **Authelia** (IdP) | `https://ecoguardian.duckdns.org/authelia` | - |
| **Traefik** (Proxy) | Port 80 / 443 | - |

---


