#include "mbedtls/md.h"
#include <HardwareSerial.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include "secrets.h"

// ================== BUFFER MQTT ==================
#define MAX_MQTT_BUFFER 30
struct SavedMessage {
  String topic;
  String payload;
  bool ready;
};
SavedMessage mqttBuffer[MAX_MQTT_BUFFER];
int mqttHead = 0;
int mqttTail = 0;
int mqttCount = 0;

WiFiClientSecure wifiClient;
PubSubClient client(wifiClient);
HardwareSerial LoRaSerial(2);

String lineBuf = "";
unsigned long lastReconnect = 0;
unsigned long messageCount = 0;

// ================== LOGS & OUTILS ==================
String getLogTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo))
    return "[INIT] ";
  char timeStringBuff[50];
  strftime(timeStringBuff, sizeof(timeStringBuff), "[%H:%M:%S] ", &timeinfo);
  return String(timeStringBuff);
}

String getMqttError(int state) {
  switch (state) {
  case -4:
    return "TIMEOUT";
  case -3:
    return "LOST";
  case -2:
    return "FAILED";
  case -1:
    return "DISCONNECTED";
  case 0:
    return "CONNECTED";
  case 5:
    return "UNAUTHORIZED";
  default:
    return "CODE_" + String(state);
  }
}

void printSeparator() {
  Serial.println(
      "------------------------------------------------------------");
}

void printLogo() {
  Serial.println("\n\n");
  Serial.println(
      "============================================================");
  Serial.println("   ____ ____  ____  _____    ___ ___ _____ ");
  Serial.println("  / ___|  _ \\|  _ \\|___  |  |_ _/ _ \\_   _|");
  Serial.println(" | |  _| |_) | |_) |  / /    | | | | || |  ");
  Serial.println(" | |_| |  _ <|  __/  / /     | | |_| || |  ");
  Serial.println("  \\____|_| \\_\\_|    /_/     |___\\___/ |_|  ");
  Serial.println("\n        >>> PASSERELLE IOT SÉCURISÉE (HMAC) <<<");
  Serial.println(
      "============================================================\n");
}

void addToMqttBuffer(String topic, String data) {
  if (mqttCount < MAX_MQTT_BUFFER) {
    mqttBuffer[mqttHead].topic = topic;
    mqttBuffer[mqttHead].payload = data;
    mqttBuffer[mqttHead].ready = true;
    mqttHead = (mqttHead + 1) % MAX_MQTT_BUFFER;
    mqttCount++;
    Serial.print(getLogTime() + "💾 [BUFFER] Ajout OK. Queue: ");
    Serial.print(mqttCount);
    Serial.println("/30");
  } else {
    Serial.println(getLogTime() + "❌ [BUFFER] ERREUR: Plein !");
  }
}

String hexToAscii(String hex) {
  String ascii = "";
  for (int i = 0; i < hex.length(); i += 2) {
    String part = hex.substring(i, i + 2);
    char ch = (char)strtol(part.c_str(), NULL, 16);
    ascii += ch;
  }
  return ascii;
}

String calculateHMAC(String payload, const char *key) {
  byte hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)key, strlen(key));
  mbedtls_md_hmac_update(&ctx, (const unsigned char *)payload.c_str(),
                         payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  String hashStr = "";
  for (int i = 0; i < 32; i++) {
    if (hmacResult[i] < 16)
      hashStr += "0";
    hashStr += String(hmacResult[i], HEX);
  }
  return hashStr;
}

// ================== MAIN ==================
void connectWiFi() {
  Serial.println(getLogTime() + "📶 [WIFI] Connexion à " + String(ssid));
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(getLogTime() +
                   "✅ [WIFI] CONNECTÉ ! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println(getLogTime() + "❌ [WIFI] ÉCHEC.");
  }
}

void syncNTP() {
  configTime(3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print(getLogTime() + "⏳ [NTP] Sync Heure...");
  time_t now = 0;
  while (time(&now) && now < 1000000000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" OK");
}

void setupSSL() {
  wifiClient.setCACert(ca_cert);
  wifiClient.setCertificate(client_cert);
  wifiClient.setPrivateKey(client_key);
}

void reconnectMQTT() {
  if (!client.connected()) {
    Serial.print(getLogTime() + "☁️ [MQTT] Connexion...");
    if (client.connect("ESP32_LoRa_Gateway")) {
      Serial.println(" OK");
    } else {
      Serial.print(" ÉCHEC: ");
      Serial.println(client.state());
    }
  }
}

// === CONFIGURATION LORA AVEC PUISSANCE REDUITE (10dBm) ===
void setupLoRa() {
  Serial.println(getLogTime() + "📻 [LORA] Init UART...");
  LoRaSerial.begin(9600, SERIAL_8N1, 16, 17);
  delay(1000);

  LoRaSerial.println("AT+MODE=TEST");
  delay(500);

  // MODIFICATION CRITIQUE : Puissance à 10dBm pour éviter le crash USB
  Serial.println(getLogTime() + "📻 [LORA] Config RF (Power Low 10dBm)...");
  LoRaSerial.println("AT+TEST=RFCFG,868,SF7,125,12,15,10,ON,OFF,OFF");
  delay(500);

  LoRaSerial.println("AT+TEST=RXLRPKT");
  Serial.println(getLogTime() + "✅ [LORA] Module PRÊT (Rx)");
}

// === FONCTION ACK SECURISEE ===
void sendAck() {
  // On vide d'abord le buffer pour éviter les collisions
  while (LoRaSerial.available())
    LoRaSerial.read();

  Serial.print(getLogTime() + "📤 [LORA] Envoi ACK... ");

  // Envoi commande
  LoRaSerial.println("AT+TEST=TXLRPKT,\"41434B\"");

  // Attente courte et simple (ne pas bloquer trop longtemps)
  delay(200);

  // Retour immédiat en réception
  LoRaSerial.println("AT+TEST=RXLRPKT");
  Serial.println("OK");
}

void processLoRaData(String hexRaw) {
  messageCount++;
  String asciiData = hexToAscii(hexRaw);

  printSeparator();
  Serial.println(getLogTime() + "📡 RECEPTION #" + String(messageCount));
  Serial.println("   > BRUT: " + hexRaw);
  Serial.println("   > TXT : " + asciiData);

  if (!asciiData.startsWith("GROUPE7")) {
    Serial.println("   ⚠️ [IGNORE] Signature invalide (Pas GROUPE7)");
    printSeparator();
    return;
  }

  // 1. ACK AVEC PRECAUTION
  sendAck();

  // 2. VÉRIFICATION HMAC
  int idxSig = asciiData.indexOf(";SIG=");
  if (idxSig == -1) {
    Serial.println(getLogTime() + "⛔ [SECURITE] REJETÉ : Pas de signature !");
    printSeparator();
    return;
  }

  String dataToVerify = asciiData.substring(0, idxSig);
  String receivedSig = asciiData.substring(idxSig + 5);
  receivedSig.trim(); // Nettoyage \r\n

  String computedSig = calculateHMAC(dataToVerify, hmac_secret_key);

  if (!receivedSig.equalsIgnoreCase(computedSig)) {
    Serial.println(getLogTime() +
                   "⛔ [SECURITE] ALERTE : Signature INVALIDE !");
    Serial.println("   > Reçu: [" + receivedSig + "]");
    Serial.println("   > Calc: [" + computedSig + "]");
    printSeparator();
    return;
  }

  Serial.println(getLogTime() + "🛡️ [SECURITE] Signature OK.");

  // 3. PARSING
  int idxIDS = dataToVerify.indexOf("IDS=");
  int idxIDP = dataToVerify.indexOf("IDP=");
  int idxENC = dataToVerify.indexOf("ENC=");

  if (idxIDS == -1 || idxIDP == -1 || idxENC == -1)
    return;

  String valIDS =
      dataToVerify.substring(idxIDS + 4, dataToVerify.indexOf(";", idxIDS));
  String valIDP =
      dataToVerify.substring(idxIDP + 4, dataToVerify.indexOf(";", idxIDP));
  String valENC = dataToVerify.substring(idxENC + 4);

  Serial.println("   ✅ [DATA] IDS:" + valIDS + " IDP:" + valIDP);

  String topic = "serre/" + valIDS + "/plante/" + valIDP + "/data";
  String json = "{\"encrypted\":\"" + valENC + "\",\"ids\":\"" + valIDS +
                "\",\"idp\":\"" + valIDP +
                "\",\"rssi\":" + String(WiFi.RSSI()) +
                ",\"ts\":" + String(time(NULL)) + "}";

  // 4. MQTT / Buffer
  if (client.connected()) {
    Serial.print(getLogTime() + "🚀 [MQTT] Envoi... ");
    if (client.publish(topic.c_str(), json.c_str()))
      Serial.println("OK");
    else {
      Serial.println("ÉCHEC -> Buffer");
      addToMqttBuffer(topic, json);
    }
  } else {
    Serial.println(getLogTime() + "⚠️ [MQTT] Offline -> Buffer");
    addToMqttBuffer(topic, json);
  }
}

void setup() {
  Serial.begin(9600);
  delay(2000);
  printLogo();
  connectWiFi();
  if (WiFi.status() == WL_CONNECTED)
    syncNTP();
  setupSSL();
  client.setServer(mqtt_server, mqtt_port);
  setupLoRa();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastReconnect > 10000) {
      lastReconnect = millis();
      connectWiFi();
    }
  } else if (!client.connected()) {
    if (millis() - lastReconnect > 5000) {
      lastReconnect = millis();
      reconnectMQTT();
    }
  } else {
    client.loop();
    if (mqttCount > 0) {
      Serial.print(getLogTime() + "🔄 [BUFFER] Vidage... ");
      if (client.publish(mqttBuffer[mqttTail].topic.c_str(),
                         mqttBuffer[mqttTail].payload.c_str())) {
        Serial.println("OK");
        mqttBuffer[mqttTail].ready = false;
        mqttTail = (mqttTail + 1) % MAX_MQTT_BUFFER;
        mqttCount--;
      }
      delay(100);
    }
  }

  while (LoRaSerial.available()) {
    char c = (char)LoRaSerial.read();
    if (c == '\n') {
      String line = lineBuf;
      lineBuf = "";
      line.trim();
      if (line.startsWith("+TEST: RX")) {
        int q1 = line.indexOf('\"');
        int q2 = line.lastIndexOf('\"');
        if (q1 != -1 && q2 > q1)
          processLoRaData(line.substring(q1 + 1, q2));
      }
    } else if (c != '\r')
      lineBuf += c;
  }
}