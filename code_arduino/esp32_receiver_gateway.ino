#include <HardwareSerial.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>

// ================== CONFIGURATION WIFI ==================
const char *ssid = "vivo flo";
const char *password = "fuckyoubitch";

// ================== CONFIGURATION MQTT ==================
const char *mqtt_server = "MC-TV02XG93P9.local";
const int mqtt_port = 8883;
// Le topic est maintenant dynamique, on ne définit plus de topic global ici.

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
  String topic; // On garde le topic spécifique car il est dynamique
  String payload;
  bool ready;
};
SavedMessage mqttBuffer[MAX_MQTT_BUFFER];
int mqttHead = 0;
int mqttTail = 0;
int mqttCount = 0;

// ================== OBJETS ==================
WiFiClientSecure wifiClient;
PubSubClient client(wifiClient);
HardwareSerial LoRaSerial(2); // UART2 sur ESP32

String lineBuf = "";
unsigned long lastReconnect = 0;
unsigned long messageCount = 0;

// ================== FONCTIONS UTILITAIRES ==================
void printSeparator() {
  Serial.println("========================================");
}

void printHeader(String title) {
  printSeparator();
  Serial.print("  ");
  Serial.println(title);
  printSeparator();
}

void addToMqttBuffer(String topic, String data) {
  if (mqttCount < MAX_MQTT_BUFFER) {
    mqttBuffer[mqttHead].topic = topic;
    mqttBuffer[mqttHead].payload = data;
    mqttBuffer[mqttHead].ready = true;
    mqttHead = (mqttHead + 1) % MAX_MQTT_BUFFER;
    mqttCount++;
    Serial.print("[BUFFER] Msg stocke pour ");
    Serial.println(topic);
  } else {
    Serial.println("[BUFFER] PLEIN ! Message perdu !");
  }
}

// Convertit HEX (ex: "4142") vers ASCII (ex: "AB")
String hexToAscii(String hex) {
  String ascii = "";
  for (int i = 0; i < hex.length(); i += 2) {
    String part = hex.substring(i, i + 2);
    char ch = (char)strtol(part.c_str(), NULL, 16);
    ascii += ch;
  }
  return ascii;
}

// ================== WIFI / NTP / SSL ==================
void connectWiFi() {
  Serial.println("\n[WiFi] Connexion...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" ECHEC");
  }
}

void syncNTP() {
  configTime(3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("[NTP] Synchro...");
  time_t now = 0;
  int retry = 0;
  while (time(&now) && now < 1000000000 && retry < 10) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  Serial.println(now > 1000000000 ? " OK" : " ECHEC");
}

void setupSSL() {
  wifiClient.setCACert(ca_cert);
  wifiClient.setCertificate(client_cert);
  wifiClient.setPrivateKey(client_key);
}

void reconnectMQTT() {
  if (!client.connected()) {
    Serial.print("[MQTT] Connexion...");
    if (client.connect("ESP32_LoRa_Gateway")) {
      Serial.println(" OK");
    } else {
      Serial.print(" ECHEC (");
      Serial.print(client.state());
      Serial.println(")");
    }
  }
}

// ================== LORA ==================
void setupLoRa() {
  LoRaSerial.begin(9600, SERIAL_8N1, 16, 17);
  delay(1000);
  LoRaSerial.println("AT+MODE=TEST");
  delay(500);
  LoRaSerial.println("AT+TEST=RFCFG,868,SF7,125,12,15,14,ON,OFF,OFF");
  delay(500);
  LoRaSerial.println("AT+TEST=RXLRPKT");
  Serial.println("[LoRa] Config OK, En ecoute.");
}

void sendAck() {
  delay(50);

  // IMPORTANT: payload HEX entre guillemets
  LoRaSerial.println("AT+TEST=TXLRPKT,\"41434B\"");

  // (optionnel) lire/afficher la réponse du module pendant ~500ms
  unsigned long t0 = millis();
  while (millis() - t0 < 500) {
    while (LoRaSerial.available()) {
      Serial.write(LoRaSerial.read());
    }
  }

  // Revenir en RX
  LoRaSerial.print("AT+TEST=RXLRPKT\r\n");
  Serial.println("[LoRa] ACK envoyé");
}

void processLoRaData(String hexRaw) {
  messageCount++;

  // 1. Convertir HEX brut en ASCII
  String asciiData = hexToAscii(hexRaw);

  Serial.println("\n--- RECEPTION LORA ---");
  Serial.print("HEX: ");
  Serial.println(hexRaw);
  Serial.print("ASCII: ");
  Serial.println(asciiData);

  // 2. Vérifier Signature
  if (!asciiData.startsWith("GROUPE7")) {
    Serial.println("[IGNORE] Mauvaise signature");
    return;
  }

  // 3. Envoyer ACK
  sendAck();

  // 4. Parser les données: GROUPE7;IDS=01;IDP=A12;ENC=xxxx
  int idxIDS = asciiData.indexOf("IDS=");
  int idxIDP = asciiData.indexOf("IDP=");
  int idxENC = asciiData.indexOf("ENC=");

  if (idxIDS == -1 || idxIDP == -1 || idxENC == -1) {
    Serial.println("[ERREUR] Format incorrect (manque IDS, IDP ou ENC)");
    return;
  }

  // Extraire les valeurs
  // IDS est entre "IDS=" et le prochain ";"
  String valIDS =
      asciiData.substring(idxIDS + 4, asciiData.indexOf(";", idxIDS));

  // IDP est entre "IDP=" et le prochain ";"
  String valIDP =
      asciiData.substring(idxIDP + 4, asciiData.indexOf(";", idxIDP));

  // ENC est la fin de la chaine (ou jusqu'au prochain ; si tu ajoutes des trucs
  // après)
  String valENC = asciiData.substring(idxENC + 4);

  Serial.println("[PARSER] IDS: " + valIDS);
  Serial.println("[PARSER] IDP: " + valIDP);
  Serial.println("[PARSER] ENC: " + valENC);

  // 5. Construire Topic et JSON
  String dynamicTopic = "serre/" + valIDS + "/plante/" + valIDP + "/data";

  String json = "{";
  json += "\"encrypted\":\"" + valENC + "\",";
  json += "\"ids\":\"" + valIDS + "\",";
  json += "\"idp\":\"" + valIDP + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"ts\":" + String(time(NULL));
  json += "}";

  // 6. Publier ou Bufferiser
  if (client.connected()) {
    Serial.print("[MQTT] Pub -> " + dynamicTopic + " : ");
    if (client.publish(dynamicTopic.c_str(), json.c_str())) {
      Serial.println("OK");
    } else {
      Serial.println("ECHEC");
      addToMqttBuffer(dynamicTopic, json);
    }
  } else {
    Serial.println("[MQTT] Offline -> Buffer");
    addToMqttBuffer(dynamicTopic, json);
  }
}

// ================== SETUP ==================
void setup() {
  Serial.begin(9600);
  delay(2000);

  printHeader("ESP32 GATEWAY - PARSING CLAIR");

  // WiFi & NTP
  connectWiFi();
  if (WiFi.status() == WL_CONNECTED)
    syncNTP();

  // TLS & MQTT
  setupSSL();
  client.setServer(mqtt_server, mqtt_port);

  // LoRa
  setupLoRa();
}

// ================== LOOP ==================
void loop() {
  // Reconnexion auto
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

    // Vidage Buffer
    if (mqttCount > 0) {
      Serial.print("[BUFFER] Envoi vers " + mqttBuffer[mqttTail].topic +
                   "... ");
      if (client.publish(mqttBuffer[mqttTail].topic.c_str(),
                         mqttBuffer[mqttTail].payload.c_str())) {
        Serial.println("OK");
        mqttBuffer[mqttTail].ready = false;
        mqttTail = (mqttTail + 1) % MAX_MQTT_BUFFER;
        mqttCount--;
      } else {
        Serial.println("ECHEC");
      }
      delay(100);
    }
  }

  // Lecture LoRa
  while (LoRaSerial.available()) {
    char c = (char)LoRaSerial.read();

    if (c == '\n') {
      String line = lineBuf;
      lineBuf = "";
      line.trim();

      // Format reçu : +TEST: RX,"HEXSTRING",...
      if (line.startsWith("+TEST: RX")) {
        int q1 = line.indexOf('\"');
        int q2 = line.lastIndexOf('\"');
        if (q1 != -1 && q2 > q1) {
          String hexContent = line.substring(q1 + 1, q2);
          processLoRaData(hexContent);
        }
      }
    } else if (c != '\r') {
      lineBuf += c;
    }
  }
}