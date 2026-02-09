# Traefik (Edge Router & Reverse Proxy)

**Traefik** est le point d'entrée unique de toute notre infrastructure. Aucun service n'est exposé directement sur internet sans passer par lui.

## 🛠️ Stack Technique

- **Image** : `traefik:v2.10`
- **Configuration** : Dynamique via les Labels Docker (pas de fichier de config géant).
- **SSL** : Let's Encrypt (Challenge HTTP).

## 🚀 Rôle Critique

1.  **Routage** : Il aiguille les requêtes `https://ecoguardian.duckdns.org` vers le conteneur Frontend, et `https://ecoguardian.duckdns.org/api` vers le Backend.
2.  **HTTPS Automatique** : Il discute avec l'ACME de Let's Encrypt pour obtenir des certificats valides pour notre domaine.
3.  **Middleware** : Il applique des chaînes de traitement sur les requêtes :
    - **CrowdSec Bouncer** : "Est-ce que cette IP est bannie ?"
    - **Authelia** : "Est-ce que l'utilisateur est connecté ?"

## 🔧 Configuration Docker Globale

Traefik est configuré via des arguments de commande dans le `docker-compose.yml`.

| Argument | Rôle |
| :--- | :--- |
| `--entrypoints.web.address=:80` | Écoute HTTP pur (redirigé vers HTTPS). |
| `--entrypoints.websecure.address=:443` | Écoute HTTPS sécurisé. |
| `--certificatesresolvers.myresolver...` | Configuration de Let's Encrypt. |
| `--accesslog=true` | Génère les logs d'accès pour que CrowdSec puisse les lire. |

## 🔗 Intégration dans les Services

Pour exposer un service via Traefik, on ajoute simplement des **labels** sur le conteneur cible. Exemple pour le Backend :

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.backend.rule=Host(`...`) && PathPrefix(`/api`)"
  - "traefik.http.routers.backend.entrypoints=websecure"
  - "traefik.http.routers.backend.middlewares=authelia" # Force l'auth
```

## 🔐 Logique de Sécurité

Traefik ne fait confiance à personne.
- Tout trafic HTTP (Port 80) est immédiatement redirigé en HTTPS (301 Permanent Redirect).
- Les certificats sont renouvelés automatiquement avant expiration.
- Les middlewares de sécurité (CrowdSec, Authelia) sont appliqués au niveau global ou par routeur.
