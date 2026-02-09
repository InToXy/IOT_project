# Authelia (Authentication & SSO)

**Authelia** est notre portier numérique. C'est un serveur d'authentification open-source qui fournit du Single Sign-On (SSO) et de l'authentification à deux facteurs (2FA).

## 🛠️ Stack Technique

- **Type** : Fournisseur d'Identité (Identity Provider).
- **Protocole** : Forward Auth (Intégration native avec Traefik).
- **Base Utilisateurs** : Fichier YAML (Pour la simplicité actuelle) ou LDAP.

## 🚀 Comment ça marche ? (Forward Auth)

Authelia ne reçoit pas directement le trafic utilisateur. Il agit en tant que **Middleware** pour Traefik.

1.  Traefik reçoit une requête pour `/api`.
2.  Traefik demande à Authelia : "Cet utilisateur a-t-il le droit de passer ?".
    - `GET http://authelia:9091/api/verify`
3.  Authelia répond :
    - **200 OK** : "Oui, voici ses infos (User, Group)". Traefik laisse passer la requête.
    - **401 Unauthorized** : "Non". Traefik redirige l'utilisateur vers le portail de connexion Authelia.

## 🔐 Fonctionnalités de Sécurité

### 1. Single Sign-On (SSO)
Une fois connecté sur le portail Authelia, l'utilisateur a accès à toutes les applications protégées (`/grafana`, `/api`, etc.) pendant la durée de la session, sans se reconnecter.

### 2. Double Facteur (2FA)
Pour les actions sensibles ou les groupes d'utilisateurs admin, Authelia peut exiger une preuve supplémentaire :
- **TOTP** : Google Authenticator / Authy.
- **Duo Push**.

### 3. Contrôle d'Accès Fin (ACL)
On définit qui a accès à quoi dans `configuration.yml`.
```yaml
access_control:
  default_policy: deny
  rules:
    - domain: "ecoguardian.duckdns.org"
      policy: two_factor # Exige le 2FA pour tout accès externe
```

## 📦 Fichiers de Configuration

- `configuration.yml` : Règles de sécurité, configuration SMTP, stockage session.
- `users_database.yml` : Liste des utilisateurs et leurs mots de passe hachés (Argon2).
