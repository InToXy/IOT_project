# Code Edge (Arduino/ESP32)

Ce dossier contient le code embarqué qui s'exécute directement sur le matériel (les "Motes" et la "Gateway"). C'est la première ligne de notre système IoT.

## 🛠️ Stack Technique

- **Hardware** : ESP32 (TTGO LoRa32) / Arduino Uno + Shield LoRa.
- **Framework** : Arduino IDE / PlatformIO.
- **Communication** : LoRa (Long Range) 868MHz.
- **Sécurité** : Chiffrement symétrique XTEA.

## 📂 Contenu

### 1. `arduino_sender.ino` (Le Capteur)
C'est le code qui tourne sur le nœud capteur autonome (sur batterie).
- **Cycle de vie** :
    1.  **Reveil** (Deep Sleep).
    2.  **Mesure** : Lit les capteurs (DHT22, LDR, Sol).
    3.  **Chiffrement** : Chiffre les données brutes avec XTEA (128-bit key).
    4.  **Emission** : Envoie le paquet LoRa.
    5.  **Attente ACK** : Attend un accusé de réception de la Gateway.
    6.  **Sommeil** : Retourne en Deep Sleep pour économiser la batterie.
- **Résilience** : Implémente un buffer circulaire pour stocker les mesures si l'ACK n'est pas reçu, et les réémettre plus tard.

### 2. `esp32_receiver_gateway.ino` (La Passerelle)
C'est le point de pont entre le monde Radio (LoRa) et le monde IP (WiFi/MQTT).
- **Rôle** : Écoute en permanence le canal LoRa.
- **Réception** : Reçoit le paquet chiffré.
- **Transfert** : Ne déchiffre PAS (Principe de moindre privilège). Transmet le paquet chiffré tel quel via MQTT sécurisé (MQTTS) vers le serveur central (Node-RED).
- **Ack** : Envoie immédiatement un ACK LoRa au capteur pour confirmer la réception.

## 🔐 Cryptographie (XTEA)

Nous utilisons XTEA pour sa légèreté adaptée aux microcontrôleurs 8-bit.
- **Clé** : 16 octets (128 bits), partagée uniquement entre le Capteur et le process Node-RED final.
- ** IV/Salt** : Inclut un compteur ou un timestamp pour éviter les attaques par rejeu (Replay Attacks).

## 📡 Protocole LoRa

- **Fréquence** : 868.1 MHz (Europe).
- **Spreading Factor (SF)** : 7-12 (Adaptatif selon la portée voulue).
- **Bandwidth** : 125 kHz.
