#include "mbedtls/md.h"
#include <HardwareSerial.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>

// ================== SÉCURITÉ HMAC ==================
const char *hmac_secret_key = "CleSecreteGroupe7";

// ================== CONFIGURATION WIFI ==================
const char *ssid = "vivo flo";
const char *password = "fuckyoubitch";

// ================== CONFIGURATION MQTT ==================
const char *mqtt_server = "MC-TV02XG93P9.local";
const int mqtt_port = 8883;

// ================== CERTIFICATS TLS ==================
const char *ca_cert = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDmTCCAoGgAwIBAgIUTZhGA9GSfNwIGN6XiETA14n3wl0wDQYJKoZIhvcNAQEL
BQAwVDELMAkGA1UEBhMCRlIxDzANBgNVBAgMBkZyYW5jZTENMAsGA1UEBwwETHlv
bjEPMA0GA1UECgwGTWFpc29uMRQwEgYDVQQDDAtNb3NxdWl0dG9DQTAeFw0yNjAx
MjExNDA2MTJaFw0zNjAxMTkxNDA2MTJaMFQxCzAJBgNVBAYTAkZSMQ8wDQYDVQQI
DAZGcmFuY2UxDTALBgNVBAcMBEx5b24xDzANBgNVBAoMBk1haXNvbjEUMBIGA1UE
AwwLTW9zcXVpdHRvQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDf
5Sl0g25JLKeFyAbZQDyO7we/98sS2HtvC4fP8NNdKNyCcrEB3PmZqhTVtFCwXEwN
X2Q73TJMDH1MkL4t5V3SZQLYcqDoYdgZmQvwppDIwLwGwqO9G8UDaV8F7sg8HBK/
rqcNpQz0ftAToUQ3xP/G36PT6Uw1CwJWZKgm+UZWwyO5NqysnatT9DzdAI46ezfN
HN2v3MCW+CsDlI+uoVegAAIhdxPWNGsGUP5uj56uhYWqQmfeqL1CcdJSe/Whzudv
2tfBEoC3NXcUJkPxw4Q5EAwwHni0uMkTSa2wdrjXHd3crdoM+Vb7cPehNRVqbUE6
fjN0YDhxyEd1VV8vc9nnAgMBAAGjYzBhMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0P
AQH/BAQDAgEGMB0GA1UdDgQWBBRppD+2WspPE6zSzk72YeFLs42iiDAfBgNVHSME
GDAWgBRppD+2WspPE6zSzk72YeFLs42iiDANBgkqhkiG9w0BAQsFAAOCAQEAfFrM
S/0cfIypOEKL0yWNoF6zNQdMOPvuDhyH/pQQfT91kHDy4UUbY9WxIsUrV/TqWBNs
UsbfmObpzXEVFoG5XVBp9LrUdBwedEICIP5vhTPZvMvJzFICkWGbf754ZVWkSOKM
U94yh9TID9j+vvyEK5stO020bGSNl9/v/brhq7Ma+HCM4nHw9wSYSXz2hpX/Cm+x
Lhspc7xDRtSzB7xXeYFWyZu0eP/oRmwoDNr6cqNnJpsLd4bhzyfrwoB8iriZA7Wa
1W9nNDmA/+EwGKJgT6a6sTleFHiJjkEYlbRmEw41C7tEEp545uB7o77E+cFH8VEa
IfK2ylrA+TGfuRR/Gg==
-----END CERTIFICATE-----
)EOF";

const char *client_cert = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDeDCCAmCgAwIBAgIUNwaWY2Wq5LsSCJPKSS59s82lfekwDQYJKoZIhvcNAQEL
BQAwVDELMAkGA1UEBhMCRlIxDzANBgNVBAgMBkZyYW5jZTENMAsGA1UEBwwETHlv
bjEPMA0GA1UECgwGTWFpc29uMRQwEgYDVQQDDAtNb3NxdWl0dG9DQTAeFw0yNjAx
MjExNTM5NTNaFw0zNjAxMTkxNTM5NTNaMFQxCzAJBgNVBAYTAkZSMQ8wDQYDVQQI
DAZGcmFuY2UxDTALBgNVBAcMBEx5b24xDzANBgNVBAoMBk1haXNvbjEUMBIGA1UE
AwwLRVNQMzJQbGFudGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDE
JGuKAwxMBh+S651kxTgT3FTomaeHhi827c7CEXhhvKIyJjOZFNjS8u3tkMGAtDeN
aTzZKLM4ldWVnuWCxNRV7Pdp4GoSxWN1fV7zX+vm3+u4WQKrF5RGgpR8nzZvna25
18hLQO1pChhXpX6yUKtuFcUGf6V6lFn74a75yotrdRZY0MAwDyjvsh2Mzcz+BPcY
WLm949iCpvmnBJrFmOxly1c0Bv6ibXAqvspVybo4ccJrqjMv3s5gESCppvCYULeP
L+3UOQqYJfJTuIfmTLT3S4Iqz+VvismH7VFcY8Vb6WrfZ1DnKVBZTML1fjHgbDzf
f8+9dSZi9dAPgZjY2sFZAgMBAAGjQjBAMB0GA1UdDgQWBBTyWDe3eA1sbclXhrIr
gPCcU1iYqTAfBgNVHSMEGDAWgBRppD+2WspPE6zSzk72YeFLs42iiDANBgkqhkiG
9w0BAQsFAAOCAQEAUnrVE/rKo6tLlwnq6imQdhJuXtPMk2Fc65qSnHiq754npLca
ICQJdlViP3P752utpmdHR9fY0TpVnNn3fy76hFASaS88l8Hv9o3/MthSNdQr2AHR
vHo9DfcBnnIzDBrPAQAR3WNziFTftucwsqgGK/uNvK+U+gqaFeIedJ3sufyCIde9
Ok81j/bOws1ecLboaRRHXvidtTeMjUXdan95UbgyTzFkZu2BFchab1malzrIPRUx
OzMPnUvPKop4LydOqGpbKGIcN5NyPSJ7KRhqYri4XBZoj5v7bTFyY7iwQ01o8Q7j
tOMlY+fHtPuMkyp/WbO4pK9Qv1lAfgLS8r9JxA==
-----END CERTIFICATE-----
)EOF";

const char *client_key = R"EOF(
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEJGuKAwxMBh+S
651kxTgT3FTomaeHhi827c7CEXhhvKIyJjOZFNjS8u3tkMGAtDeNaTzZKLM4ldWV
nuWCxNRV7Pdp4GoSxWN1fV7zX+vm3+u4WQKrF5RGgpR8nzZvna2518hLQO1pChhX
pX6yUKtuFcUGf6V6lFn74a75yotrdRZY0MAwDyjvsh2Mzcz+BPcYWLm949iCpvmn
BJrFmOxly1c0Bv6ibXAqvspVybo4ccJrqjMv3s5gESCppvCYULePL+3UOQqYJfJT
uIfmTLT3S4Iqz+VvismH7VFcY8Vb6WrfZ1DnKVBZTML1fjHgbDzff8+9dSZi9dAP
gZjY2sFZAgMBAAECggEAK1MQHfAGa1R+7Oj2Xyfg9yIX7zjhdGIDU9K7dMp/GLed
7A3cH9gm/JGEVJFA7Ljh/G5ebmk7DSirgN0UPQpVDJXHIK/dPkAzc+Q5cPCjHuAf
JR0kJb6Tle+J9O0GDSl7Ei3DpDu3NRhxwApiLej7tNlCJ+lSF/1k0upKyAohOZ7E
OOola29/Atdbc330TnYpNd01VYlCnIjCOBqZWKZN73EcltgYC9cDk09IyNq64wUF
MIQGt23VISXBUTiSW4Z0R7EfnaGjlk/2g2YzYzqP7JfQOw5/eVLASyi2OvoOO9g/
FAm7lbAmZgva0EOpG7yHZxOih7ok1rlcvhdy467YcQKBgQDpkLHD1lfJglxgMSLY
ZMxnfzJQbG4A70ZvCUPuuQ3Xjb3ZuAhUWxt+6aCW5vcdnQaPJa4JLNtO+imi/0Ke
qjSWu62oTuBe9LFlUx8HBp+a63MQl2UewiPY3fiGm9z/2HlKf6M1mizh7lvbzaw4
Y5dtToQXjP2I3+ehysMRmgygjwKBgQDW+4FpVFLz3UVb1L76UigVt3QqmJOevdS3
BjfE0gygl0YUcIXvdhgo9GM9Q1ParxXjB5KjDcGPZyBkJbmjIqdX9rYidPvXSNkg
E9PiLwJtLZeQA1jDkWvc9wroicU2KkO44TOqskmIsX9ahtkYROtkMYEaPj/LDTzy
pXB8uIOjlwKBgC3z1+Wt4Cu3SDFsuWxVuJmMPvvvuVzZtsPV0NXA9uY37uhM+uaN
3kUD9iJ6Ypgi8s1rHmiTuLo7IcH98r+AwUP+vNXmXuKPxe8ngW1CclhqhoL3Jl/8
1kyur1zcgYicsJBluFitcrMo0E3Yk0+s2HgbAIYZqTAqzUnZuLNX2bAlAoGBAMno
NnelQa9VfqGrop3Y8VrMDKdA20v4f8JRbalFmaRtzty9fZ0T7cbxGA9en2/Ahq7N
2vOWpNa5BVvpbnr/velIhXDBLBHakkmlNZe1jPLbIgCYlBJBDuvdfXo+gmDHuwj1
QSAtCBEAm1p7UYOQnv9f2x+5nRJoYXiG1qncZY4LAoGBANCO+0/SmY86e1jy+HDM
4TbPigCens+zeYxToqzbGYAmcPTuFPJksxU9ARN/UeZJYD8DG8tQDgfD5/RPaAp8
x2/BkJnN1GW0feDcFmF7vyXdbRE7/V/xz9a4einDyCcxrBvEbOX8P3Qq0fZFKsnk
/yCnsP5ZOdTIjwv4c/mrKfSy
-----END PRIVATE KEY-----
)EOF";

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