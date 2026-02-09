# Grafana (Visualisation Avancée)

**Grafana** est l'outil pour les ingénieurs et administrateurs. Là où l'interface EcoGuardian est simplifiée pour l'utilisateur final, Grafana permet une exploration brute et détaillée de toutes les métriques.

## 🛠️ Stack Technique

- **Source de Données** : Connecté directement à InfluxDB (Flux).
- **Auth** : Protégé par Authelia (au niveau réseau) + Auth interne Grafana.

## 🚀 Usage

### Dashboards d'Ingénierie
Grafana nous sert à :
1.  **Debugger les capteurs** : Voir si un capteur envoie des valeurs aberrantes ou a des trous de transmission.
2.  **Corréler les données** : Superposer les courbes de température et d'humidité pour voir les tendances physiques.
3.  **Monitorer l'infrastructure** : Visualiser les ressources Docker (CPU/RAM) si configuré avec Telegraf.

## 🔌 Connexion InfluxDB

Grafana utilise le langage **Flux** pour interroger InfluxDB v2.
Exemple de configuration Datasource :
- **URL** : `http://influxdb:8086` (Réseau interne Docker)
- **Auth** : Token InfluxDB
- **Organization** : `maison`

## 🔐 Sécurité

Grafana est accessible sur `/grafana`. Cette route est protégée par Authelia, ce qui signifie que personne ne peut même voir la page de login de Grafana sans s'être d'abord authentifié sur le portail EcoGuardian.
