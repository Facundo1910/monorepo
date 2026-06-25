#include <ModbusMaster.h>
#include <Arduino_GFX_Library.h>

// ---- RS485 / Modbus ----
#define RS485_RX_PIN 9
#define RS485_TX_PIN 10
#define RS485_DE_RE_PIN 11

#define MODBUS_SLAVE_ID 1
#define MODBUS_BAUD 9600

ModbusMaster modbus;

struct LecturaSensor {
  float humedad;
  float temperatura;
  uint16_t ec;
  float ph;
  uint16_t nitrogeno;
  uint16_t fosforo;
  uint16_t potasio;
  bool valida;
  uint8_t errorModbus;
};

LecturaSensor lectura = {};

bool deInvertido = false;

void rs485ReceiveEnable() {
  digitalWrite(RS485_DE_RE_PIN, deInvertido ? HIGH : LOW);
}

static uint32_t rs485BaudActual = MODBUS_BAUD;

void rs485SwitchToReceive(uint16_t txBytes) {
  (void)txBytes;
  // Esperar solo que termine el ultimo byte en el shift register (~1 byte @ 9600)
  delayMicroseconds(1100);
  rs485ReceiveEnable();
}

void rs485TransmitEnable() {
  while (Serial1.available()) Serial1.read(); // limpiar ruido acumulado
  digitalWrite(RS485_DE_RE_PIN, deInvertido ? LOW : HIGH);
  delayMicroseconds(500);
}

void modbusPostTransmission() {
  Serial1.flush();
  rs485SwitchToReceive(8);
}

void diagnosticarBusModo(bool invertir) {
  deInvertido = invertir;
  rs485ReceiveEnable();

  const uint8_t frame[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x07, 0xC4, 0x08};

  while (Serial1.available()) {
    Serial1.read();
  }

  Serial.print("Diag TX: ");
  for (uint8_t i = 0; i < sizeof(frame); i++) {
    Serial.printf("%02X ", frame[i]);
  }
  Serial.println();

  rs485TransmitEnable();
  Serial1.write(frame, sizeof(frame));
  Serial1.flush();
  rs485SwitchToReceive(sizeof(frame));

  uint8_t rx[32];
  uint8_t rxLen = 0;
  unsigned long t0 = millis();
  while ((millis() - t0) < 1000 && rxLen < sizeof(rx)) {
    while (Serial1.available() && rxLen < sizeof(rx)) {
      rx[rxLen++] = Serial1.read();
    }
  }

  if (rxLen == 0) {
    Serial.println("Diag RX: (sin bytes)");
  } else {
    Serial.printf("Diag RX (%u bytes): ", rxLen);
    for (uint8_t i = 0; i < rxLen; i++) {
      Serial.printf("%02X ", rx[i]);
    }
    Serial.println();
    if (!invertir && rxLen >= 8 &&
        rx[0] == 0x01 && rx[1] == 0x03 && rx[2] == 0x00) {
      Serial.println(">>> LOOPBACK OK: ESP32 + MAX485 funcionan <<<");
    }
  }
}

void diagnosticarBus() {
  Serial.println("--- Diagnostico RS485 ---");
  Serial.println("DE normal:");
  diagnosticarBusModo(false);
  Serial.println("DE invertido:");
  diagnosticarBusModo(true);
  deInvertido = false;
  rs485ReceiveEnable();
  Serial.println("-------------------------");
}

void pruebaSerial1() {
  while (Serial1.available()) {
    Serial1.read();
  }

  const uint8_t ping[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x07, 0xC4, 0x08};
  rs485TransmitEnable();
  Serial1.write(ping, sizeof(ping));
  Serial1.flush();
  rs485SwitchToReceive(sizeof(ping));

  uint8_t rxLen = 0;
  unsigned long t0 = millis();
  while ((millis() - t0) < 500 && rxLen < sizeof(ping)) {
    if (Serial1.available()) {
      rxLen++;
      Serial1.read();
    }
  }

  if (rxLen >= sizeof(ping)) {
    Serial.printf("Loopback RS485 OK (%u bytes eco, DE normal)\n", rxLen);
  } else if (rxLen > 0) {
    Serial.printf("Loopback parcial (%u bytes) - revisar puente A-B\n", rxLen);
  } else {
    Serial.println("Loopback RS485 FALLO (0 bytes)");
    Serial.println("Puente A-B en MAX485 y cableado DI/RO/DE");
  }
}

// ---- Pines de la pantalla (ESP32-S3 Touch LCD 1.47", driver JD9853) ----
#define LCD_DC       45
#define LCD_CS       21
#define LCD_SCK      38
#define LCD_MOSI     39
#define LCD_RST_GFX  47
#define LCD_RST      40
#define LCD_BL       46

Arduino_DataBus *bus = new Arduino_ESP32SPI(LCD_DC, LCD_CS, LCD_SCK, LCD_MOSI);

Arduino_GFX *gfx = new Arduino_ST7789(
    bus, LCD_RST_GFX, 0 /* rotation */, false /* IPS */,
    172 /* width */, 320 /* height */,
    34 /* col_offset1 */, 0 /* row_offset1 */,
    34 /* col_offset2 */, 0 /* row_offset2 */);

void lcd_reg_init(void) {
  static const uint8_t init_operations[] = {
    BEGIN_WRITE,
    WRITE_COMMAND_8, 0x11,
    END_WRITE,
    DELAY, 120,

    BEGIN_WRITE,
    WRITE_C8_D16, 0xDF, 0x98, 0x53,
    WRITE_C8_D8, 0xB2, 0x23,

    WRITE_COMMAND_8, 0xB7,
    WRITE_BYTES, 4,
    0x00, 0x47, 0x00, 0x6F,

    WRITE_COMMAND_8, 0xBB,
    WRITE_BYTES, 6,
    0x1C, 0x1A, 0x55, 0x73, 0x63, 0xF0,

    WRITE_C8_D16, 0xC0, 0x44, 0xA4,
    WRITE_C8_D8, 0xC1, 0x16,

    WRITE_COMMAND_8, 0xC3,
    WRITE_BYTES, 8,
    0x7D, 0x07, 0x14, 0x06, 0xCF, 0x71, 0x72, 0x77,

    WRITE_COMMAND_8, 0xC4,
    WRITE_BYTES, 12,
    0x00, 0x00, 0xA0, 0x79, 0x0B, 0x0A, 0x16, 0x79, 0x0B, 0x0A, 0x16, 0x82,

    WRITE_COMMAND_8, 0xC8,
    WRITE_BYTES, 32,
    0x3F, 0x32, 0x29, 0x29, 0x27, 0x2B, 0x27, 0x28, 0x28, 0x26, 0x25, 0x17, 0x12, 0x0D, 0x04, 0x00,
    0x3F, 0x32, 0x29, 0x29, 0x27, 0x2B, 0x27, 0x28, 0x28, 0x26, 0x25, 0x17, 0x12, 0x0D, 0x04, 0x00,

    WRITE_COMMAND_8, 0xD0,
    WRITE_BYTES, 5,
    0x04, 0x06, 0x6B, 0x0F, 0x00,

    WRITE_C8_D16, 0xD7, 0x00, 0x30,
    WRITE_C8_D8, 0xE6, 0x14,
    WRITE_C8_D8, 0xDE, 0x01,

    WRITE_COMMAND_8, 0xB7,
    WRITE_BYTES, 5,
    0x03, 0x13, 0xEF, 0x35, 0x35,

    WRITE_COMMAND_8, 0xC1,
    WRITE_BYTES, 3,
    0x14, 0x15, 0xC0,

    WRITE_C8_D16, 0xC2, 0x06, 0x3A,
    WRITE_C8_D16, 0xC4, 0x72, 0x12,
    WRITE_C8_D8, 0xBE, 0x00,
    WRITE_C8_D8, 0xDE, 0x02,

    WRITE_COMMAND_8, 0xE5,
    WRITE_BYTES, 3,
    0x00, 0x02, 0x00,

    WRITE_COMMAND_8, 0xE5,
    WRITE_BYTES, 3,
    0x01, 0x02, 0x00,

    WRITE_C8_D8, 0xDE, 0x00,
    WRITE_C8_D8, 0x35, 0x00,
    WRITE_C8_D8, 0x3A, 0x05,

    WRITE_COMMAND_8, 0x2A,
    WRITE_BYTES, 4,
    0x00, 0x22, 0x00, 0xCD,

    WRITE_COMMAND_8, 0x2B,
    WRITE_BYTES, 4,
    0x00, 0x00, 0x01, 0x3F,

    WRITE_C8_D8, 0xDE, 0x02,

    WRITE_COMMAND_8, 0xE5,
    WRITE_BYTES, 3,
    0x00, 0x02, 0x00,

    WRITE_C8_D8, 0xDE, 0x00,
    WRITE_C8_D8, 0x36, 0x00,
    WRITE_COMMAND_8, 0x21,
    END_WRITE,

    DELAY, 10,

    BEGIN_WRITE,
    WRITE_COMMAND_8, 0x29,
    END_WRITE
  };
  bus->batchOperation(init_operations, sizeof(init_operations));
}

#define COL_BG     0x0000
#define COL_TXT    0xFFFF
#define COL_HUM    0x07FF
#define COL_TEMP   0xFD20
#define COL_EC     0xF81F
#define COL_PH     0x07E0
#define COL_N      0xFFE0
#define COL_P      0x051F
#define COL_K      0xF800
#define COL_STATUS 0x8410
#define COL_ERR    0xF800

#define GRID_TOP 12
#define CELL_W   160
#define CELL_H   40

const char *etiquetas[8] = {
    "HUMEDAD", "TEMPERATURA",
    "COND. (EC)", "pH",
    "NITROGENO (N)", "FOSFORO (P)",
    "POTASIO (K)", "ESTADO"};

const uint16_t colores[8] = {
    COL_HUM, COL_TEMP,
    COL_EC, COL_PH,
    COL_N, COL_P,
    COL_K, COL_STATUS};

void dibujarValor(int i, const char *texto) {
  int row = i / 2;
  int col = i % 2;
  int x = col * CELL_W;
  int y = GRID_TOP + row * CELL_H;

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
    int row = i / 2;
    int col = i % 2;
    int x = col * CELL_W;
    int y = GRID_TOP + row * CELL_H;

    gfx->fillRect(x, y, 4, CELL_H, colores[i]);
    gfx->setTextColor(colores[i]);
    gfx->setTextSize(1);
    gfx->setCursor(x + 8, y + 4);
    gfx->print(etiquetas[i]);
  }
}

void dibujarValores(const LecturaSensor &d) {
  char buf[24];

  if (d.valida) {
    snprintf(buf, sizeof(buf), "%.1f %%", d.humedad);
    dibujarValor(0, buf);

    snprintf(buf, sizeof(buf), "%.1f C", d.temperatura);
    dibujarValor(1, buf);

    snprintf(buf, sizeof(buf), "%u uS/cm", d.ec);
    dibujarValor(2, buf);

    snprintf(buf, sizeof(buf), "%.1f", d.ph);
    dibujarValor(3, buf);

    snprintf(buf, sizeof(buf), "%u mg/kg", d.nitrogeno);
    dibujarValor(4, buf);

    snprintf(buf, sizeof(buf), "%u mg/kg", d.fosforo);
    dibujarValor(5, buf);

    snprintf(buf, sizeof(buf), "%u mg/kg", d.potasio);
    dibujarValor(6, buf);

    snprintf(buf, sizeof(buf), "OK  %lus", millis() / 1000);
    dibujarValor(7, buf);
  } else {
    dibujarValor(0, "--");
    dibujarValor(1, "--");
    dibujarValor(2, "--");
    dibujarValor(3, "--");
    dibujarValor(4, "--");
    dibujarValor(5, "--");
    dibujarValor(6, "--");

    snprintf(buf, sizeof(buf), "ERR 0x%02X", d.errorModbus);
    dibujarValor(7, buf);
  }
}

bool leerSensorRaw(LecturaSensor &out) {
  const uint8_t frame[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x07, 0xC4, 0x08};

  while (Serial1.available()) Serial1.read();

  rs485TransmitEnable();
  Serial1.write(frame, sizeof(frame));
  Serial1.flush();
  rs485SwitchToReceive(sizeof(frame));

  // Ventana de 400ms con timestamps para diagnostico
  uint8_t raw[64];
  uint16_t ts[64];
  uint8_t rawLen = 0;
  unsigned long t0 = millis();
  while ((millis() - t0) < 400 && rawLen < sizeof(raw)) {
    if (Serial1.available()) {
      ts[rawLen] = (uint16_t)(millis() - t0);
      raw[rawLen++] = Serial1.read();
    }
  }

  // Buscar "01 03 0E"
  int startIdx = -1;
  for (int i = 0; i <= (int)rawLen - 3; i++) {
    if (raw[i] == 0x01 && raw[i+1] == 0x03 && raw[i+2] == 0x0E) {
      startIdx = i;
      break;
    }
  }

  Serial.printf("DBG (%u bytes):", rawLen);
  for (uint8_t i = 0; i < rawLen; i++) Serial.printf(" %02X@%u", raw[i], ts[i]);
  Serial.printf(" | hdr@%d\n", startIdx);

  if (startIdx < 0) {
    out.valida = false;
    out.errorModbus = 0xFE;
    return false;
  }

  uint8_t *buf = &raw[startIdx + 3]; // apuntar a los datos
  if (startIdx + 3 + 14 > (int)rawLen) {
    out.valida = false;
    out.errorModbus = 0xFD;
    return false;
  }

  out.humedad     = ((buf[0] << 8) | buf[1])  / 10.0f;
  out.temperatura = ((buf[2] << 8) | buf[3])  / 10.0f;
  out.ec          =  (buf[4] << 8) | buf[5];
  out.ph          = ((buf[6] << 8) | buf[7])  / 10.0f;
  out.nitrogeno   =  (buf[8] << 8) | buf[9];
  out.fosforo     =  (buf[10] << 8) | buf[11];
  out.potasio     =  (buf[12] << 8) | buf[13];
  out.valida      = true;
  out.errorModbus = 0;
  return true;
}

bool leerSensor(LecturaSensor &out) {
  return leerSensorRaw(out);
}

void imprimirSerial(const LecturaSensor &d) {
  if (d.valida) {
    Serial.println("--- Lectura ---");
    Serial.printf("Humedad:        %.1f %%\n", d.humedad);
    Serial.printf("Temperatura:    %.1f C\n", d.temperatura);
    Serial.printf("Conductividad:  %u uS/cm\n", d.ec);
    Serial.printf("pH:             %.1f\n", d.ph);
    Serial.printf("Nitrogeno (N):  %u mg/kg\n", d.nitrogeno);
    Serial.printf("Fosforo (P):    %u mg/kg\n", d.fosforo);
    Serial.printf("Potasio (K):    %u mg/kg\n", d.potasio);
    Serial.println();
  } else {
    Serial.printf("Error Modbus: 0x%02X\n", d.errorModbus);
    Serial.println();
  }
}

void configurarModbus(uint32_t baud, uint8_t slaveId) {
  rs485BaudActual = baud;
  Serial1.end();
  Serial1.begin(baud, SERIAL_8N1, RS485_RX_PIN, RS485_TX_PIN);
  delay(50);
  modbus.begin(slaveId, Serial1);
  modbus.preTransmission(rs485TransmitEnable);
  modbus.postTransmission(modbusPostTransmission);
}

void autoScan() {
  const uint32_t bauds[] = {4800, 9600, 19200, 2400};
  const uint8_t ids[] = {1, 2, 3, 4, 5};
  const uint16_t regs[] = {0x0000, 0x0012};

  Serial.println("=== AUTOSCAN MODBUS (sensor conectado, SIN puente A-B) ===");
  for (uint32_t b : bauds) {
    for (uint8_t id : ids) {
      configurarModbus(b, id);

      for (uint16_t reg : regs) {
        Serial.printf("baud=%lu id=%d reg=0x%04X holding ... ", b, id, reg);
        uint8_t err = modbus.readHoldingRegisters(reg, 1);
        if (err == modbus.ku8MBSuccess) {
          Serial.printf("OK val=%u\n", modbus.getResponseBuffer(0));
          Serial.printf(">>> USAR: baud=%lu slave=%d reg=0x%04X <<<\n", b, id, reg);
          return;
        }
        Serial.printf("0x%02X | input ... ", err);
        err = modbus.readInputRegisters(reg, 1);
        if (err == modbus.ku8MBSuccess) {
          Serial.printf("OK val=%u\n", modbus.getResponseBuffer(0));
          Serial.printf(">>> USAR (input): baud=%lu slave=%d reg=0x%04X <<<\n", b, id, reg);
          return;
        }
        Serial.printf("0x%02X\n", err);
        delay(100);
      }
    }
  }
  Serial.println("Sensor no encontrado.");
  Serial.println("Revisar: alimentacion rojo 5-12V, GND común, A/B (probar invertir blanco/verde).");
  Serial.println("======================");
  configurarModbus(MODBUS_BAUD, MODBUS_SLAVE_ID);
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  pinMode(LCD_RST, OUTPUT);
  digitalWrite(LCD_RST, LOW);
  delay(10);
  digitalWrite(LCD_RST, HIGH);
  delay(10);

  pinMode(LCD_BL, OUTPUT);
  digitalWrite(LCD_BL, HIGH);

  gfx->begin();
  lcd_reg_init();
  gfx->setRotation(1);
  dibujarEstructura();
  dibujarValores(lectura);

  pinMode(RS485_DE_RE_PIN, OUTPUT);
  rs485ReceiveEnable();

  configurarModbus(MODBUS_BAUD, MODBUS_SLAVE_ID);
  pruebaSerial1();

  Serial.println();
  Serial.println("Fertilar — ESP32-S3-Touch-LCD-1.47");
  Serial.println("Sensor suelo NPK (Modbus RTU)");
  Serial.printf("Esclavo: %d | Baudios: %d\n", MODBUS_SLAVE_ID, MODBUS_BAUD);
  Serial.printf("RS485: RX=%d TX=%d DE/RE=%d\n", RS485_RX_PIN, RS485_TX_PIN, RS485_DE_RE_PIN);
  Serial.println("-------------------------------------");
  diagnosticarBus();

  // Diagnóstico extendido: captura 2000ms con timestamps en microsegundos
  Serial.println("=== SCAN 2000ms (us timestamps) ===");
  const uint8_t qframe[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x07, 0xC4, 0x08};
  while (Serial1.available()) Serial1.read();
  rs485TransmitEnable();
  Serial1.write(qframe, sizeof(qframe));
  Serial1.flush();
  unsigned long txDone = micros();
  rs485SwitchToReceive(sizeof(qframe));
  unsigned long rxStart = micros();

  static uint8_t scanBuf[128];
  static uint32_t scanTs[128];
  uint8_t scanLen = 0;
  unsigned long scanT0 = micros();
  while ((micros() - scanT0) < 2000000UL && scanLen < 128) {
    if (Serial1.available()) {
      scanTs[scanLen] = micros() - rxStart;
      scanBuf[scanLen++] = Serial1.read();
    }
  }

  Serial.printf("TX done @ us=%lu | RX enabled @ us=%lu | Gap=%luus\n",
                txDone, rxStart, rxStart - txDone);
  Serial.printf("Bytes capturados: %u\n", scanLen);
  for (uint8_t i = 0; i < scanLen; i++) {
    Serial.printf("  [%u] %02X @ +%uus\n", i, scanBuf[i], scanTs[i]);
  }
  Serial.println("=== FIN SCAN ===");

  autoScan();
}

void escuchaRaw() {
  const uint8_t frame[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x07, 0xC4, 0x08};

  while (Serial1.available()) Serial1.read();

  rs485TransmitEnable();
  Serial1.write(frame, sizeof(frame));
  Serial1.flush();
  rs485SwitchToReceive(sizeof(frame));

  Serial.print("RAW TX: 01 03 00 00 00 07 C4 08 | RX: ");
  uint8_t buf[64];
  uint8_t len = 0;
  unsigned long t0 = millis();
  while ((millis() - t0) < 2000 && len < sizeof(buf)) {
    if (Serial1.available()) {
      buf[len++] = Serial1.read();
      t0 = millis();
    }
  }
  if (len == 0) {
    Serial.println("(sin bytes)");
  } else {
    Serial.printf("(%u bytes) ", len);
    for (uint8_t i = 0; i < len; i++) Serial.printf("%02X ", buf[i]);
    Serial.println();
  }
}

void loop() {
  // Prueba con ModbusMaster (maneja timing y CRC internamente)
  uint8_t result = modbus.readHoldingRegisters(0x0000, 7);
  Serial.printf("[MB] result=0x%02X", result);
  if (result == modbus.ku8MBSuccess) {
    Serial.printf(" Hum=%u Temp=%u EC=%u pH=%u N=%u P=%u K=%u\n",
      modbus.getResponseBuffer(0), modbus.getResponseBuffer(1),
      modbus.getResponseBuffer(2), modbus.getResponseBuffer(3),
      modbus.getResponseBuffer(4), modbus.getResponseBuffer(5),
      modbus.getResponseBuffer(6));
    // Convertir y mostrar
    lectura.humedad     = modbus.getResponseBuffer(0) / 10.0f;
    lectura.temperatura = modbus.getResponseBuffer(1) / 10.0f;
    lectura.ec          = modbus.getResponseBuffer(2);
    lectura.ph          = modbus.getResponseBuffer(3) / 10.0f;
    lectura.nitrogeno   = modbus.getResponseBuffer(4);
    lectura.fosforo     = modbus.getResponseBuffer(5);
    lectura.potasio     = modbus.getResponseBuffer(6);
    lectura.valida      = true;
    lectura.errorModbus = 0;
  } else {
    Serial.println();
    lectura.valida = false;
    lectura.errorModbus = result;
  }

  imprimirSerial(lectura);
  dibujarValores(lectura);
  delay(2000);
}
