#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Arduino_GFX_Library.h>

// ─── CONFIGURACION ────────────────────────────────────────────────────────
#define WIFI_SSID          "Claro-Facundo"
#define WIFI_PASSWORD      "12345678"
#define API_BASE_URL       "http://Fertilar-service-env.eba-qbxpyswm.us-east-1.elasticbeanstalk.com"
#define AUTH_USERNAME      "facubas39@gmail.com"
#define AUTH_PASSWORD      "Facundo1905?"
#define SENSOR_ID          "888204da-90a7-4270-b94b-d4534894129a"
#define INTERVALO_ENVIO_MS    60000  // envio al backend
#define INTERVALO_LECTURA_MS  5000   // lectura de sensores RS485

// ─── RS485 / MAX485 (bus compartido) ────────────────────────────────────
// Cableado: RO->GPIO9, DI->GPIO10, DE+RE->GPIO11, A->Verde, B->Blanco
#define RS485_RX         9
#define RS485_TX         10
#define RS485_DE_RE      11
#define RS485_BAUD       9600
#define RS485_TIMEOUT_MS 800

// Sensor suelo 7-en-1 (NPK + humedad + temp + EC + pH) — Renke / JXCT
#define HAY_SENSOR_NPK   0       // 1 cuando conectes el sensor suelo 7-en-1
#define NPK_SLAVE_ADDR   0x01
#define NPK_REG_START    0x0000
#define NPK_REG_COUNT    7

// Sensor oxigeno disuelto
#define HAY_SENSOR_O2    1       // 0 si no esta conectado
#define O2_SLAVE_ADDR    0x01    // usar 0x02 si NPK y O2 comparten bus
#define O2_REG           0x0002
#define O2_SCALE         0.01f
#define O2_FUNC          0x03

HardwareSerial RS485Serial(2);
bool npkSensorOk = false;
bool o2SensorOk = false;
// ──────────────────────────────────────────────────────────────────────────

// ─── LCD ──────────────────────────────────────────────────────────────────
#define LCD_DC       45
#define LCD_CS       21
#define LCD_SCK      38
#define LCD_MOSI     39
#define LCD_RST_GFX  47
#define LCD_RST      40
#define LCD_BL       46

Arduino_DataBus *bus = new Arduino_ESP32SPI(LCD_DC, LCD_CS, LCD_SCK, LCD_MOSI);
Arduino_GFX *gfx = new Arduino_ST7789(
    bus, LCD_RST_GFX, 0, false, 172, 320, 34, 0, 34, 0);

#define COL_BG     0x0000
#define COL_TXT    0xFFFF
#define COL_HUM    0x07FF
#define COL_TEMP   0xFD20
#define COL_EC     0xF81F
#define COL_PH     0x07E0
#define COL_N      0xFFE0
#define COL_P      0x051F
#define COL_K      0xF800
#define COL_O2     0x039F
#define COL_STATUS 0x8410
#define COL_OK     0x07E0
#define COL_ERR    0xF800

#define GRID_TOP 12
#define CELL_W   160
#define CELL_H   40

const char *etiquetas[8] = {
    "HUMEDAD", "TEMPERATURA",
    "COND. (EC)", "pH",
    "NITROGENO (N)", "FOSFORO (P)",
    "OXIGENO (O2)", "ESTADO"};

const uint16_t colores[8] = {
    COL_HUM, COL_TEMP, COL_EC, COL_PH,
    COL_N, COL_P, COL_O2, COL_STATUS};
// ──────────────────────────────────────────────────────────────────────────

// ─── DATOS DEL SENSOR ─────────────────────────────────────────────────────
struct LecturaSensor {
  float    humedad;
  float    temperatura;
  uint16_t ec;
  float    ph;
  uint16_t nitrogeno;
  uint16_t fosforo;
  uint16_t potasio;
  float    oxigeno;

};

LecturaSensor lecturaActual = {};
// ──────────────────────────────────────────────────────────────────────────

String accessToken = "";
unsigned long ultimoEnvio = 0;
unsigned long ultimaLectura = 0;

// ─── LCD: inicializacion ──────────────────────────────────────────────────
void lcd_reg_init() {
  static const uint8_t init_operations[] = {
    BEGIN_WRITE,
    WRITE_COMMAND_8, 0x11,
    END_WRITE,
    DELAY, 120,
    BEGIN_WRITE,
    WRITE_C8_D16, 0xDF, 0x98, 0x53,
    WRITE_C8_D8,  0xB2, 0x23,
    WRITE_COMMAND_8, 0xB7,
    WRITE_BYTES, 4, 0x00, 0x47, 0x00, 0x6F,
    WRITE_COMMAND_8, 0xBB,
    WRITE_BYTES, 6, 0x1C, 0x1A, 0x55, 0x73, 0x63, 0xF0,
    WRITE_C8_D16, 0xC0, 0x44, 0xA4,
    WRITE_C8_D8,  0xC1, 0x16,
    WRITE_COMMAND_8, 0xC3,
    WRITE_BYTES, 8, 0x7D, 0x07, 0x14, 0x06, 0xCF, 0x71, 0x72, 0x77,
    WRITE_COMMAND_8, 0xC4,
    WRITE_BYTES, 12, 0x00, 0x00, 0xA0, 0x79, 0x0B, 0x0A, 0x16, 0x79, 0x0B, 0x0A, 0x16, 0x82,
    WRITE_COMMAND_8, 0xC8,
    WRITE_BYTES, 32,
    0x3F,0x32,0x29,0x29,0x27,0x2B,0x27,0x28,0x28,0x26,0x25,0x17,0x12,0x0D,0x04,0x00,
    0x3F,0x32,0x29,0x29,0x27,0x2B,0x27,0x28,0x28,0x26,0x25,0x17,0x12,0x0D,0x04,0x00,
    WRITE_COMMAND_8, 0xD0,
    WRITE_BYTES, 5, 0x04, 0x06, 0x6B, 0x0F, 0x00,
    WRITE_C8_D16, 0xD7, 0x00, 0x30,
    WRITE_C8_D8,  0xE6, 0x14,
    WRITE_C8_D8,  0xDE, 0x01,
    WRITE_COMMAND_8, 0xB7,
    WRITE_BYTES, 5, 0x03, 0x13, 0xEF, 0x35, 0x35,
    WRITE_COMMAND_8, 0xC1,
    WRITE_BYTES, 3, 0x14, 0x15, 0xC0,
    WRITE_C8_D16, 0xC2, 0x06, 0x3A,
    WRITE_C8_D16, 0xC4, 0x72, 0x12,
    WRITE_C8_D8,  0xBE, 0x00,
    WRITE_C8_D8,  0xDE, 0x02,
    WRITE_COMMAND_8, 0xE5,
    WRITE_BYTES, 3, 0x00, 0x02, 0x00,
    WRITE_COMMAND_8, 0xE5,
    WRITE_BYTES, 3, 0x01, 0x02, 0x00,
    WRITE_C8_D8,  0xDE, 0x00,
    WRITE_C8_D8,  0x35, 0x00,
    WRITE_C8_D8,  0x3A, 0x05,
    WRITE_COMMAND_8, 0x2A,
    WRITE_BYTES, 4, 0x00, 0x22, 0x00, 0xCD,
    WRITE_COMMAND_8, 0x2B,
    WRITE_BYTES, 4, 0x00, 0x00, 0x01, 0x3F,
    WRITE_C8_D8,  0xDE, 0x02,
    WRITE_COMMAND_8, 0xE5,
    WRITE_BYTES, 3, 0x00, 0x02, 0x00,
    WRITE_C8_D8,  0xDE, 0x00,
    WRITE_C8_D8,  0x36, 0x00,
    WRITE_COMMAND_8, 0x21,
    END_WRITE,
    DELAY, 10,
    BEGIN_WRITE,
    WRITE_COMMAND_8, 0x29,
    END_WRITE
  };
  bus->batchOperation(init_operations, sizeof(init_operations));
}

void dibujarValor(int i, const char *texto) {
  int x = (i % 2) * CELL_W;
  int y = GRID_TOP + (i / 2) * CELL_H;
  gfx->fillRect(x + 6, y + 16, CELL_W - 10, 22, COL_BG);
  gfx->setTextColor(COL_TXT);
  gfx->setTextSize(2);
  gfx->setCursor(x + 8, y + 18);
  gfx->print(texto);
}

void dibujarEstructura() {
  gfx->fillScreen(COL_BG);
  gfx->setTextColor(COL_TXT);
  gfx->setTextSize(1);
  gfx->setCursor(4, 2);
  gfx->print("FERTILAR - SENSOR NPK");

  for (int i = 0; i < 8; i++) {
    int x = (i % 2) * CELL_W;
    int y = GRID_TOP + (i / 2) * CELL_H;
    gfx->fillRect(x, y, 4, CELL_H, colores[i]);
    gfx->setTextColor(colores[i]);
    gfx->setTextSize(1);
    gfx->setCursor(x + 8, y + 4);
    gfx->print(etiquetas[i]);
  }
}

void dibujarOxigeno(const LecturaSensor &d) {
  char buf[24];
  if (o2SensorOk) {
    snprintf(buf, sizeof(buf), "%.1f %%", d.oxigeno);
  } else {
    snprintf(buf, sizeof(buf), "SIN O2");
  }
  dibujarValor(6, buf);
}

void dibujarLectura(const LecturaSensor &d, const char *estado, uint16_t colorEstado) {
  char buf[24];

  if (npkSensorOk) snprintf(buf, sizeof(buf), "%.1f %%", d.humedad);
  else strcpy(buf, "SIN DATO");
  dibujarValor(0, buf);

  if (npkSensorOk) snprintf(buf, sizeof(buf), "%.1f C", d.temperatura);
  else strcpy(buf, "SIN DATO");
  dibujarValor(1, buf);

  if (npkSensorOk) snprintf(buf, sizeof(buf), "%u uS/cm", d.ec);
  else strcpy(buf, "SIN DATO");
  dibujarValor(2, buf);

  if (npkSensorOk) snprintf(buf, sizeof(buf), "%.1f", d.ph);
  else strcpy(buf, "SIN DATO");
  dibujarValor(3, buf);

  if (npkSensorOk) snprintf(buf, sizeof(buf), "%u mg/kg", d.nitrogeno);
  else strcpy(buf, "SIN DATO");
  dibujarValor(4, buf);

  if (npkSensorOk) snprintf(buf, sizeof(buf), "%u mg/kg", d.fosforo);
  else strcpy(buf, "SIN DATO");
  dibujarValor(5, buf);

  dibujarOxigeno(d);

  int x = 1 * CELL_W;
  int y = GRID_TOP + 3 * CELL_H;
  gfx->fillRect(x + 6, y + 16, CELL_W - 10, 22, COL_BG);
  gfx->setTextColor(colorEstado);
  gfx->setTextSize(2);
  gfx->setCursor(x + 8, y + 18);
  gfx->print(estado);
}
// ──────────────────────────────────────────────────────────────────────────

// ─── RS485 / MODBUS ───────────────────────────────────────────────────────
uint16_t modbusCRC16(const uint8_t *data, uint16_t len) {
  uint16_t crc = 0xFFFF;
  for (uint16_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (uint8_t j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : (crc >> 1);
    }
  }
  return crc;
}

void rs485Enviar(const uint8_t *data, size_t len) {
  digitalWrite(RS485_DE_RE, HIGH);
  delay(2);
  RS485Serial.write(data, len);
  RS485Serial.flush();
  delay(2);
  digitalWrite(RS485_DE_RE, LOW);
}

bool leerRegistrosModbus(uint8_t slaveAddr, uint8_t func, uint16_t regStart,
                         uint16_t count, uint16_t *valoresOut) {
  uint8_t req[8];
  req[0] = slaveAddr;
  req[1] = func;
  req[2] = (regStart >> 8) & 0xFF;
  req[3] = regStart & 0xFF;
  req[4] = (count >> 8) & 0xFF;
  req[5] = count & 0xFF;
  uint16_t crc = modbusCRC16(req, 6);
  req[6] = crc & 0xFF;
  req[7] = (crc >> 8) & 0xFF;

  while (RS485Serial.available()) RS485Serial.read();

  rs485Enviar(req, sizeof(req));

  const size_t expectedBytes = 3 + count * 2 + 2;
  uint8_t resp[32];
  size_t idx = 0;
  unsigned long inicio = millis();
  while (millis() - inicio < RS485_TIMEOUT_MS) {
    while (RS485Serial.available() && idx < sizeof(resp)) {
      resp[idx++] = RS485Serial.read();
    }
    if (idx >= expectedBytes) break;
    delay(1);
  }

  if (idx < expectedBytes) {
    Serial.printf("Modbus 0x%02X: timeout (reg 0x%04X)\n", slaveAddr, regStart);
    return false;
  }

  Serial.printf("Modbus 0x%02X: ", slaveAddr);
  for (size_t i = 0; i < idx; i++) Serial.printf("%02X ", resp[i]);
  Serial.println();

  if (resp[0] != slaveAddr || resp[1] != func || resp[2] != count * 2) {
    Serial.printf("Modbus 0x%02X: respuesta invalida\n", slaveAddr);
    return false;
  }

  uint16_t crcCalc = modbusCRC16(resp, 3 + count * 2);
  uint16_t crcRecv = resp[3 + count * 2] | (resp[4 + count * 2] << 8);
  if (crcCalc != crcRecv) {
    Serial.printf("Modbus 0x%02X: error CRC\n", slaveAddr);
    return false;
  }

  for (uint16_t i = 0; i < count; i++) {
    valoresOut[i] = ((uint16_t)resp[3 + i * 2] << 8) | resp[4 + i * 2];
  }
  return true;
}

bool leerSensorNPK(LecturaSensor &out) {
  uint16_t regs[NPK_REG_COUNT] = {};
  if (!leerRegistrosModbus(NPK_SLAVE_ADDR, 0x03, NPK_REG_START, NPK_REG_COUNT, regs)) {
    return false;
  }

  out.humedad     = regs[0] / 10.0f;
  out.temperatura = regs[1] / 10.0f;
  out.ec          = regs[2];
  out.ph          = regs[3] / 100.0f;
  out.nitrogeno   = regs[4];
  out.fosforo     = regs[5];
  out.potasio     = regs[6];

  Serial.printf("NPK: hum=%.1f%% temp=%.1fC EC=%u pH=%.2f N=%u P=%u K=%u\n",
                out.humedad, out.temperatura, out.ec, out.ph,
                out.nitrogeno, out.fosforo, out.potasio);
  return true;
}

bool leerOxigenoRS485(float *oxigenoOut) {
  uint16_t raw = 0;
  if (!leerRegistrosModbus(O2_SLAVE_ADDR, O2_FUNC, O2_REG, 1, &raw)) {
    return false;
  }

  *oxigenoOut = raw * O2_SCALE;
  Serial.printf("O2: reg=0x%04X raw=%u -> %.2f\n", O2_REG, raw, *oxigenoOut);
  return true;
}

void initRS485() {
  pinMode(RS485_DE_RE, OUTPUT);
  digitalWrite(RS485_DE_RE, LOW);
  RS485Serial.begin(RS485_BAUD, SERIAL_8N1, RS485_RX, RS485_TX);
  delay(100);
  Serial.printf("RS485 init: RX=%d TX=%d DE=%d baud=%d\n",
                RS485_RX, RS485_TX, RS485_DE_RE, RS485_BAUD);
}

void leerSensores() {
#if HAY_SENSOR_NPK
  npkSensorOk = leerSensorNPK(lecturaActual);
#else
  npkSensorOk = false;
#endif

#if HAY_SENSOR_O2
  float o2 = 0.0f;
  o2SensorOk = leerOxigenoRS485(&o2);
  if (o2SensorOk) {
    lecturaActual.oxigeno = o2;
  }
#else
  o2SensorOk = false;
#endif
}
// ──────────────────────────────────────────────────────────────────────────

// ─── WIFI + API ───────────────────────────────────────────────────────────
bool conectarWiFi() {
  Serial.printf("Conectando a WiFi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi OK — IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.println("\nERROR: No se pudo conectar al WiFi");
  return false;
}

bool login() {
  Serial.println("Login...");
  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/auth/login");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> body;
  body["username"] = AUTH_USERNAME;
  body["password"] = AUTH_PASSWORD;
  String bodyStr;
  serializeJson(body, bodyStr);

  int code = http.POST(bodyStr);
  if (code == 200) {
    StaticJsonDocument<1024> doc;
    deserializeJson(doc, http.getString());
    accessToken = doc["accessToken"].as<String>();
    Serial.println("Login OK");
    http.end();
    return true;
  }
  Serial.printf("ERROR login: HTTP %d — %s\n", code, http.getString().c_str());
  http.end();
  return false;
}

bool enviarLectura(const LecturaSensor &d) {
#if HAY_SENSOR_NPK
  if (!npkSensorOk) {
    Serial.println("No se envia: sin lectura valida del sensor NPK");
    return false;
  }
#else
  Serial.println("No se envia: sensor NPK desactivado (HAY_SENSOR_NPK=0)");
  return false;
#endif

  Serial.println("Enviando lectura...");
  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/lecturas");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + accessToken);

  StaticJsonDocument<512> body;
  body["sensorId"] = SENSOR_ID;
  body["temperatura"]   = d.temperatura;
  body["humedad"]       = d.humedad;
  body["ph"]            = d.ph;
  body["conductividad"] = (float)d.ec;
  body["nitrogeno"]     = d.nitrogeno;
  body["fosforo"]       = d.fosforo;
  body["potasio"]       = d.potasio;
  String bodyStr;
  serializeJson(body, bodyStr);

  Serial.printf("Payload NPK=%s temp=%.1f hum=%.1f ph=%.1f N=%u P=%u K=%u EC=%u\n",
                npkSensorOk ? "OK" : "N/A",
                d.temperatura, d.humedad, d.ph,
                d.nitrogeno, d.fosforo, d.potasio, d.ec);

  int code = http.POST(bodyStr);
  if (code == 201) {
    Serial.println("Enviado OK (201)");
    http.end();
    return true;
  }
  if (code == 401) {
    http.end();
    if (login()) return enviarLectura(d);
    return false;
  }
  Serial.printf("ERROR envio: HTTP %d\n", code);
  http.end();
  return false;
}
// ──────────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(1500);

  // LCD init
  pinMode(LCD_RST, OUTPUT);
  digitalWrite(LCD_RST, LOW); delay(10);
  digitalWrite(LCD_RST, HIGH); delay(10);
  pinMode(LCD_BL, OUTPUT);
  digitalWrite(LCD_BL, HIGH);
  gfx->begin();
  lcd_reg_init();
  gfx->setRotation(1);
  dibujarEstructura();

  initRS485();

  leerSensores();
  dibujarLectura(lecturaActual, "SIN WIFI", COL_ERR);
  ultimaLectura = millis();
  if (conectarWiFi()) {
    dibujarLectura(lecturaActual, "WIFI OK", COL_OK);
    login();
  }

  ultimoEnvio = millis();
}

void loop() {
  unsigned long ahora = millis();

  if (ahora - ultimaLectura >= INTERVALO_LECTURA_MS) {
    ultimaLectura = ahora;
    leerSensores();
    const char *est = (WiFi.status() == WL_CONNECTED) ? "WIFI OK" : "SIN WIFI";
    uint16_t col = (WiFi.status() == WL_CONNECTED) ? COL_OK : COL_ERR;
    dibujarLectura(lecturaActual, est, col);
  }

  if (ahora - ultimoEnvio >= INTERVALO_ENVIO_MS) {
    ultimoEnvio = ahora;

    dibujarLectura(lecturaActual, "ENVIANDO", COL_TEMP);

    if (WiFi.status() != WL_CONNECTED) {
      conectarWiFi();
    }

    bool ok = false;
    if (!accessToken.isEmpty()) {
      ok = enviarLectura(lecturaActual);
    } else if (login()) {
      ok = enviarLectura(lecturaActual);
    }

    char buf[20];
    snprintf(buf, sizeof(buf), ok ? "OK %lus" : "ERR %lus", ahora / 1000);
    dibujarLectura(lecturaActual, buf, ok ? COL_OK : COL_ERR);
  }
}
