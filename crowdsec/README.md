# CrowdSec (Intrusion Prevention System)

**CrowdSec** est notre garde du corps automatisé. C'est un moteur d'analyse comportementale qui détecte et bloque les attaques en temps réel.

## 🛠️ Stack Technique

- **Composants** :
    - **Agent** (Le cerveau) : Parse les logs.
    - **Bouncer** (Le muscle) : Bloque les IP dans Traefik.
    - **CLI** : `cscli` pour gérer les décisions.
- **Source de vérité** : Logs d'accès de Traefik du conteneur.

## 🚀 Architecture Détection & Réponse

### 1. Acquisition (L'Agent)
L'agent CrowdSec lit en temps réel le fichier `/var/log/traefik/access.log`.
Il utilise des **Parsers** pour comprendre le format de log de Traefik.

### 2. Détection (Scénarios)
Il compare les lignes de logs à des scénarios d'attaque connus (Collections).
- **http-crawl-non_statics** : Quelqu'un essaie d'accèder à plein de pages inexistantes (Scan).
- **http-bad-user-agent** : Outils de hack connus (Nmap, sqlmap...).
- **brute-force** : Trop de tentatives de login échouées.

### 3. Décision (Le Ban)
Si un scénario est déclenché ("Leaky bucket overflow"), l'IP est ajoutée à la base locale de CrowdSec avec une décision (ex: BAN pour 4 heures).

### 4. Application (Le Bouncer)
Le conteneur `crowdsec-bouncer` est un middleware Traefik. À chaque requête entrante, Traefik lui demande si l'IP est propre. Si elle est dans la base locale, la requête est rejetée (**403 Forbidden**).

## 🌍 Intelligence Collective

CrowdSec n'est pas isolé.
- Si votre instance détecte une nouvelle IP malveillante, elle la partage avec la communauté.
- En échange, vous recevez périodiquement des listes d'IPs (Blocklists) signalées par la communauté comme dangereuses, vous protégeant préventivement.

## 🔧 Commandes Utiles (dans le conteneur)

Pour voir ce qui se passe :
```bash
docker exec -it iot_crowdsec cscli metrics
docker exec -it iot_crowdsec cscli decisions list
docker exec -it iot_crowdsec cscli alerts list
```
