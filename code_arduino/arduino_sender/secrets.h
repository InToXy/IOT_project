#ifndef SECRETS_H
#define SECRETS_H

// ================== SÉCURITÉ (XTEA + HMAC) ==================
const uint32_t XTEA_KEY[4] = {0xA1B2C3D4, 0xE5F67890, 0x1A2B3C4D, 0x5E6F7809};
const char *HMAC_SECRET = "CleSecreteGroupe7";

// ================== CONFIGURATION ==================
const char *SIGNATURE = "GROUPE7";
const char *IDS = "01";
const char *IDP = "01";

#endif