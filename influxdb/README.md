# InfluxDB (Time Series Database)

**InfluxDB** est la mémoire à long terme de notre système IoT. C'est une base de données optimisée pour stocker des séries temporelles (une valeur qui change au cours du temps).

## 🛠️ Stack Technique

- **Image** : `influxdb:2.7`
- **Langage de Requête** : Flux (puissant langage de scripting fonctionnel)
- **Port** : 8086

## 🚀 Pourquoi une Time-Series DB ?

Contrairement à une base SQL classique (MySQL), InfluxDB est conçue pour :
1.  **Ingestion Massive** : Recevoir des milliers de points de données par seconde sans ralentir.
2.  **Compression** : Stocker des mois de données capteurs sans exploser l'espace disque.
3.  **Agrégation Temporelle** : Calculer instantanément "la moyenne par heure sur 30 jours".

## 📦 Organisation des Données

- **Bucket** : `plante_data` (Le conteneur principal de nos données).
- **Organisation** : `maison` (Namespace logique).
- **Mesures** : Chaque point de donnée a des tags et des champs :
    - **Tags (Indexés)** : `id_serre`, `id_plante` (permet de filtrer rapidement).
    - **Fields (Valeurs)** : `temperature`, `humidite`, `luminosite`.

## 🔄 Flux de Données

1.  **Écriture** : Node-RED reçoit le message LoRa décrypté -> Formate le JSON -> Écrit dans InfluxDB via l'API HTTP.
2.  **Lecture** : Le Frontend React exécute une requête Flux pour récupérer les données et les afficher.

### Exemple de Requête Flux
```flux
from(bucket: "plante_data")
  |> range(start: -1h) // Depuis 1 heure
  |> filter(fn: (r) => r["_measurement"] == "capteurs")
  |> filter(fn: (r) => r["id_serre"] == "1")
  |> aggregateWindow(every: 1m, fn: mean) // Moyenne par minute
  |> yield(name: "mean")
```

## 🔐 Sécurité

L'accès à la base de données est protégé par des **Tokens**.
- Un Token administrateur est généré à l'initialisation.
- Le Frontend utilise un Token avec des droits de **Lecture Seule** sur le bucket `plante_data` (Bonnes pratiques).
