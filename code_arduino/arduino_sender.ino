#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>
#include <SHA256.h>
#include <Wire.h>

// ================== SÉCURITÉ (XTEA + HMAC) ==================
const uint32_t XTEA_KEY[4] = {0xA1B2C3D4, 0xE5F67890, 0x1A2B3C4D, 0x5E6F7809};
const char *HMAC_SECRET = "CleSecreteGroupe7";

// ================== CONFIGURATION ==================
const char *SIGNATURE = "GROUPE7";
const char *IDS = "01";
const char *IDP = "01";

const int PIN_LIGHT = A0;
const int PIN_SOIL = A1;
Adafruit_BME280 bme;
#define LORA Serial1

// ================== BUFFER SENDER ==================
const int BUFFER_SIZE = 30;
struct Record {
  char payload[200];
  bool ready;
}; // Augmenté pour tenir la signature
Record history[BUFFER_SIZE];
int head = 0;
int tail = 0;
int bufferCount = 0;

// ================== FONCTIONS CRYPTO ==================

// 1. XTEA (Chiffrement)
void xtea_enc(uint32_t v[2]) {
  uint32_t v0 = v[0], v1 = v[1], sum = 0, delta = 0x9E3779B9;
  for (int i = 0; i < 32; i++) {
    v0 += (((v1 << 4) ^ (v1 >> 5)) + v1) ^ (sum + XTEA_KEY[sum & 3]);
    sum += delta;
    v1 += (((v0 << 4) ^ (v0 >> 5)) + v0) ^ (sum + XTEA_KEY[(sum >> 11) & 3]);
  }
  v[0] = v0;
  v[1] = v1;
}

String encryptXTEA(String plain) {
  while (plain.length() % 8 != 0)
    plain += " ";
  String hexOut = "";
  for (int i = 0; i < plain.length(); i += 8) {
    uint32_t b[2];
    b[0] = (uint8_t)plain[i] | ((uint8_t)plain[i + 1] << 8) |
           ((uint8_t)plain[i + 2] << 16) | ((uint8_t)plain[i + 3] << 24);
    b[1] = (uint8_t)plain[i + 4] | ((uint8_t)plain[i + 5] << 8) |
           ((uint8_t)plain[i + 6] << 16) | ((uint8_t)plain[i + 7] << 24);
    xtea_enc(b);
    char buf[17];
    snprintf(buf, sizeof(buf), "%08X%08X", b[0], b[1]);
    hexOut += String(buf);
  }
  return hexOut;
}

// 2. HMAC-SHA256 (Signature Compatible ESP32 mbedtls)
// Cette fonction recrée le HMAC manuellement pour être compatible Arduino R4
String calculateHMAC(String payload) {
  SHA256 sha;
  uint8_t hash[32];
  uint8_t key[64]; // Bloc size SHA256

  // Préparation de la clé
  memset(key, 0, 64);
  int keyLen = strlen(HMAC_SECRET);
  if (keyLen > 64) {
    sha.reset();
    sha.update(HMAC_SECRET, keyLen);
    sha.finalize(key, 32);
  } else {
    memcpy(key, HMAC_SECRET, keyLen);
  }

  // Clés interne et externe (Padding)
  uint8_t k_ipad[64];
  uint8_t k_opad[64];
  for (int i = 0; i < 64; i++) {
    k_ipad[i] = key[i] ^ 0x36;
    k_opad[i] = key[i] ^ 0x5c;
  }

  // Inner Hash
  sha.reset();
  sha.update(k_ipad, 64);
  sha.update((const void *)payload.c_str(), payload.length());
  sha.finalize(hash, 32);

  // Outer Hash
  sha.reset();
  sha.update(k_opad, 64);
  sha.update(hash, 32);
  sha.finalize(hash, 32);

  // Conversion en Hex String
  String hashStr = "";
  for (int i = 0; i < 32; i++) {
    if (hash[i] < 16)
      hashStr += "0";
    hashStr += String(hash[i], HEX);
  }
  return hashStr; // Retourne en MAJUSCULES (comme Arduino String default)
}

// 3. Conversion String -> Hex pour LoRa
String asciiToHex(const String &s) {
  const char *hex = "0123456789ABCDEF";
  String out;
  out.reserve(s.length() * 2);
  for (size_t i = 0; i < s.length(); i++) {
    uint8_t b = (uint8_t)s[i];
    out += hex[b >> 4];
    out += hex[b & 0x0F];
  }
  return out;
}

// ================== LOGIQUE CAPTEURS & ENVOI ==================

void loraFlush() {
  while (LORA.available())
    LORA.read();
}

bool sendWithAck(String messageComplet) {
  // Convertit tout le message (Data + Signature) en Hex pour le transport LoRa
  String hexPayload = asciiToHex(messageComplet);

  Serial.println("\n[TX] Envoi Radio : " + messageComplet);

  loraFlush();
  LORA.print("AT+TEST=TXLRPKT,\"" + hexPayload + "\"\r\n");
  delay(600);

  loraFlush();
  LORA.print("AT+TEST=RXLRPKT\r\n");

  // Attente ACK (4s max)
  unsigned long start = millis();
  String rxBuf = "";
  while (millis() - start < 4000) {
    while (LORA.available()) {
      char c = (char)LORA.read();
      if (c == '\n') {
        if (rxBuf.indexOf("41434B") != -1)
          return true; // ACK reçu
        rxBuf = "";
      } else if (c != '\r')
        rxBuf += c;
    }
  }
  return false;
}

// ================== GESTION BUFFER ==================
void bufferPush(String msg) {
  if (bufferCount >= BUFFER_SIZE) {
    Serial.println("[BUFFER] Plein ! On écrase le plus vieux.");
    tail =
        (tail + 1) % BUFFER_SIZE; // On avance la queue pour faire de la place
    bufferCount--;
  }
  msg.toCharArray(history[head].payload, 200);
  history[head].ready = true;
  head = (head + 1) % BUFFER_SIZE;
  bufferCount++;
  Serial.println("[BUFFER] Message sauvegardé. Total: " + String(bufferCount));
}

void bufferFlush() {
  if (bufferCount == 0)
    return;
  Serial.println("[BUFFER] Tentative de vidage...");

  int sentCount = 0;
  // On tente de vider tout le buffer
  while (bufferCount > 0) {
    String msgToSend = String(history[tail].payload);
    Serial.print("[BUFFER] Retransmission item " + String(tail) + "... ");

    if (sendWithAck(msgToSend)) {
      Serial.println("SUCCES !");
      history[tail].ready = false;
      tail = (tail + 1) % BUFFER_SIZE;
      bufferCount--;
      sentCount++;
      delay(200); // Pause anti-flood
    } else {
      Serial.println("ECHEC. Arrêt du vidage.");
      break; // On arrête si ça passe pas, on réessaiera au prochain cycle
    }
  }
}

// ================== SETUP ==================
void setup() {
  Serial.begin(9600);
  LORA.begin(9600);
  if (!bme.begin(0x76))
    bme.begin(0x77);

  delay(1000);
  LORA.println("AT+MODE=TEST");
  delay(500);
  LORA.println("AT+TEST=RFCFG,868,SF7,125,12,15,14,ON,OFF,OFF");
  delay(500);
  LORA.println("AT+TEST=RXLRPKT"); // S'assurer qu'on écoute pour l'ACK

  Serial.println("=== SENDER R4 SECURISE (XTEA + HMAC) PRET ===");
}

// ================== LOOP ==================
void loop() {
  // 1. Capteurs
  int soil = analogRead(PIN_SOIL);
  int light = analogRead(PIN_LIGHT);
  float t = bme.readTemperature();
  float h = bme.readHumidity();

  if (isnan(t)) {
    Serial.println("Err BME");
    delay(2000);
    return;
  }

  // 2. Construction du Message
  // A. Données chiffrées (XTEA)
  String rawData = "S=" + String(soil) + ";L=" + String(light) +
                   ";T=" + String(t, 1) + ";H=" + String(h, 1);
  String encryptedData = encryptXTEA(rawData);

  // B. Message de base (ce qui sera signé)
  String messageBase = String(SIGNATURE) + ";IDS=" + IDS + ";IDP=" + IDP +
                       ";ENC=" + encryptedData;

  // C. Calcul de la signature HMAC sur le message de base
  String signature = calculateHMAC(messageBase);

  // D. Assemblage final
  String finalPacket = messageBase + ";SIG=" + signature;

  // 3. Logique d'envoi & Buffer
  if (sendWithAck(finalPacket)) {
    Serial.println(">>> SUCCES (ACK Reçu)");
    // Si on a réussi à envoyer le courant, on essaie de vider le buffer
    if (bufferCount > 0)
      bufferFlush();
  } else {
    Serial.println(">>> ECHEC (Pas d'ACK) -> Mise en Buffer");
    bufferPush(finalPacket);
  }

  // Pause
  delay(15000);
}