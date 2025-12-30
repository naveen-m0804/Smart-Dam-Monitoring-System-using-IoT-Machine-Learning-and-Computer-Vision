/*******************************************************
 * SMART DAM AUTOMATION SYSTEM - ESP32 WROOM
 * FINAL EDGE DEVICE CODE (fast update + logs + MANUAL)
 ********************************************************/

#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include <time.h>

// ----------------------------------------------------
// USER CONFIG
// ----------------------------------------------------

#define WIFI_SSID   "7"
#define WIFI_PASS   "123123123"

#define FIREBASE_DB_URL "https://smart-dam-automation-system-default-rtdb.asia-southeast1.firebasedatabase.app"

// Dam settings
#define DAM_HEIGHT_CM 40

// ----------------------------------------------------
// PIN SETUP (SAFE)
// ----------------------------------------------------

#define DHTPIN 4
#define DHTTYPE DHT11

#define TRIG_PIN 5
#define ECHO_PIN 18

#define BUZZER_PIN 26
//#define SERVO_PIN 13
#define SERVO_PIN 14

#define VIBRATION_PIN 21

// ----------------------------------------------------
// GLOBALS
// ----------------------------------------------------

DHT dht(DHTPIN, DHTTYPE);
Servo valveServo;

bool valveState = false;
float lastRainPercent = 0.0f;
bool lastVibrationState = false;

// Valve control from Firebase
String controlMode = "AUTO";        // "AUTO" | "MANUAL"
String manualCommand = "NONE";      // "OPEN" | "CLOSE" | "NONE"

unsigned long lastPost = 0;
const unsigned long postInterval = 2000;   // send to Firebase every 2s
//Failed to load dashboard data.const unsigned long postInterval = 1000;   // send to Firebase every 1s


unsigned long lastRainFetch = 0;
const unsigned long rainFetchInterval = 15000; // 15s

unsigned long lastControlFetch = 0;
const unsigned long controlFetchInterval = 2000; // 2s

// ----------------------------------------------------
// PWM BUZZER (ESP32 core 3.x API)
// ----------------------------------------------------

#define BUZZER_FREQUENCY 4000
#define BUZZER_RESOLUTION 8

void setupBuzzer() {
  ledcAttach(BUZZER_PIN, BUZZER_FREQUENCY, BUZZER_RESOLUTION);
}

void beep(int ms, int strength = 200) {
  uint32_t duty = (strength * (1 << BUZZER_RESOLUTION)) / 255;
  ledcWrite(BUZZER_PIN, duty);
  delay(ms);
  ledcWrite(BUZZER_PIN, 0);
}

// ----------------------------------------------------
// TIME / TIMESTAMP
// ----------------------------------------------------

String nowIso() {
  time_t now = time(nullptr);
  if (now < 100000) {
    return String(millis());  // fallback when NTP not ready
  }
  struct tm *tm_info = gmtime(&now);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", tm_info);
  return String(buf);
}

// ----------------------------------------------------
// FIREBASE HELPERS FOR ALERT LOGS
// ----------------------------------------------------

void logVibrationAlert() {
  if (WiFi.status() != WL_CONNECTED) return;

  DynamicJsonDocument doc(256);
  doc["level"] = "HIGH";
  doc["timestamp"] = nowIso();
  doc["nodeId"] = "main";

  String json;
  serializeJson(doc, json);

  HTTPClient http;
  http.begin(String(FIREBASE_DB_URL) + "/alerts/vibration.json");
  http.addHeader("Content-Type", "application/json");
  http.POST(json);
  http.end();
}

void logWaterLevelAlert(float dist, float pct, const char* level) {
  if (WiFi.status() != WL_CONNECTED) return;

  DynamicJsonDocument doc(256);
  doc["distanceCm"] = dist;
  doc["percent"] = pct;
  doc["level"] = level;
  doc["timestamp"] = nowIso();
  doc["nodeId"] = "main";

  String json;
  serializeJson(doc, json);

  HTTPClient http;
  http.begin(String(FIREBASE_DB_URL) + "/alerts/waterLevel.json");
  http.addHeader("Content-Type", "application/json");
  http.POST(json);
  http.end();
}

// ----------------------------------------------------
// VIBRATION DETECTION
// ----------------------------------------------------

bool checkVibration() {
  bool currentVibration = digitalRead(VIBRATION_PIN);
  // Edge trigger on rising edge
  if (currentVibration && !lastVibrationState) {
    beep(300, 255);
    Serial.println("*** VIBRATION DETECTED ***");
    lastVibrationState = true;
    logVibrationAlert();
    return true;
  }
  lastVibrationState = currentVibration;
  return currentVibration;
}

// ----------------------------------------------------
// ULTRASONIC + WATER PERCENT
// ----------------------------------------------------

float measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(12);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;

  float dist = (duration * 0.0343f) / 2.0f;
  return dist;
}

float calcWaterPercent(float dist) {
  if (dist < 0 || dist > DAM_HEIGHT_CM) return 0;

  float height = DAM_HEIGHT_CM - dist;
  float pct = (height / DAM_HEIGHT_CM) * 100.0f;

  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

// ----------------------------------------------------
// FETCH RAIN PREDICTION FROM FIREBASE
// ----------------------------------------------------

void fetchRainPrediction() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastRainFetch < rainFetchInterval) return;

  lastRainFetch = millis();

  HTTPClient http;
  http.begin(String(FIREBASE_DB_URL) + "/predictions/rainfall.json");
  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    DynamicJsonDocument doc(256);
    if (deserializeJson(doc, body) == DeserializationError::Ok &&
        doc.containsKey("percent")) {
      lastRainPercent = doc["percent"].as<float>();
      Serial.printf("[RAIN] Updated rainfall prediction: %.1f%%\n", lastRainPercent);
    }
  }
  http.end();
}

// ----------------------------------------------------
// FETCH CONTROL / VALVE FROM FIREBASE
// ----------------------------------------------------

void fetchControl() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastControlFetch < controlFetchInterval) return;

  lastControlFetch = millis();

  HTTPClient http;
  http.begin(String(FIREBASE_DB_URL) + "/control/valve.json");
  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    DynamicJsonDocument doc(256);
    if (deserializeJson(doc, body) == DeserializationError::Ok) {
      if (doc["mode"].is<const char*>()) {
        controlMode = String(doc["mode"].as<const char*>());
      }
      if (doc["manualCommand"].is<const char*>()) {
        manualCommand = String(doc["manualCommand"].as<const char*>());
      }
    }
  }
  http.end();
}

// ----------------------------------------------------
// VALVE CONTROL
// ----------------------------------------------------

void setValve(bool open, String reason) {
  bool changed = (valveState != open);
  valveState = open;

  if (changed) {
    if (open) {
      valveServo.write(90);
      beep(200, 200);
      Serial.println("*** VALVE OPENED ***");
    } else {
      valveServo.write(0);
      beep(100, 150);
      Serial.println("*** VALVE CLOSED ***");
    }
  }

  Serial.print("VALVE: ");
  Serial.println(open ? "OPEN" : "CLOSED");
  Serial.print("REASON: /");
  Serial.println(reason);

  // Always push status (so frontend never shows UNKNOWN)
  if (WiFi.status() == WL_CONNECTED) {
    DynamicJsonDocument doc(256);
    doc["state"] = open ? "OPEN" : "CLOSED";
    doc["reason"] = reason;
    doc["timestamp"] = nowIso();

    String json;
    serializeJson(doc, json);

    HTTPClient http;
    http.begin(String(FIREBASE_DB_URL) + "/status/valve.json");
    http.addHeader("Content-Type", "application/json");
    http.PUT(json);
    http.end();
  }
}

// ----------------------------------------------------
// AUTO CONTROL
// ----------------------------------------------------

void autoControl(float dist, float pct, float rain) {
  static bool highWaterAlerted = false;

  // High water: open
  if (pct > 75.0f) {
    if (!highWaterAlerted) {
      beep(500, 255);  // critical alert
      Serial.println("*** HIGH WATER LEVEL - CRITICAL ***");
      logWaterLevelAlert(dist, pct, "HIGH_WATER");
      highWaterAlerted = true;
    }
    setValve(true, "HIGH_WATER");
    return;
  } else {
    highWaterAlerted = false;
  }

  // Rain + medium water
  if (rain > 75.0f && pct > 40.0f) {
    logWaterLevelAlert(dist, pct, "RAIN_PREDICTION");
    setValve(true, "RAIN_PREDICTION");
    return;
  }

  // Safe level: close
  if (pct < 45.0f) {
    setValve(false, "SAFE_LEVEL");
  }
}

// ----------------------------------------------------
// POST SENSOR DATA
// ----------------------------------------------------

void postReading(float temp, float hum, float dist, float pct, bool vibration) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] Skip upload: WiFi not connected");
    return;
  }

  DynamicJsonDocument doc(1024);
  doc["temp"] = temp;
  doc["humidity"] = hum;
  doc["distance"] = dist;
  doc["percent"] = pct;                    // used by frontend
  doc["rain_prediction"] = lastRainPercent;
  doc["vibration"] = vibration;
  doc["valve_state"] = valveState ? "OPEN" : "CLOSED";
  doc["timestamp"] = nowIso();             // ISO UTC

  String json;
  serializeJson(doc, json);

  HTTPClient http;
  http.begin(String(FIREBASE_DB_URL) + "/readings.json");
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(json);

  if (httpCode > 0) {
    Serial.print("[OK] Data uploaded ");
  } else {
    Serial.print("[ERROR] Upload failed ");
  }
  Serial.println(httpCode);
  http.end();
}

// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=== SMART DAM SYSTEM BOOT ===");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(VIBRATION_PIN, INPUT_PULLUP);

  dht.begin();
  setupBuzzer();

  //valveServo.attach(SERVO_PIN);
  valveServo.attach(SERVO_PIN, 500, 2400);

  valveServo.write(0);
  valveState = false;

  // -------- Wi-Fi logic (your original pattern) --------
  Serial.println("Starting Wi-Fi Connection...");
  delay(100);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nSUCCESS: Connected to WiFi network!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    // NTP time sync (UTC)
    configTime(0, 0, "pool.ntp.org", "time.nist.gov", "time.google.com");
    Serial.print("Syncing time");
    int retries = 0;
    while (time(nullptr) < 100000 && retries < 30) {
      delay(500);
      Serial.print(".");
      retries++;
    }
    Serial.println();
    if (time(nullptr) >= 100000) {
      Serial.println("Time synced.");
    } else {
      Serial.println("Time sync failed, using millis for timestamp.");
    }
  } else {
    Serial.println("\nFAILURE: Could not connect to network.");
    Serial.print("WiFi Status Code: ");
    Serial.println(WiFi.status());
  }

  // Publish initial valve status so UI is not UNKNOWN
  setValve(false, "BOOT");

  // Startup beep
  beep(100, 150);
  delay(100);
  beep(100, 150);
}

// ----------------------------------------------------
// LOOP
// ----------------------------------------------------

void loop() {
  // ---- WiFi reconnect guard ----
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    delay(5000);
    return;
  }

  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  float dist = measureDistance();
  if (dist < 0) dist = 0;   // avoid NA, treat as max water
  float pct  = calcWaterPercent(dist);
  bool vibration = checkVibration();

  if (isnan(temp) || isnan(hum)) {
    Serial.println("DHT ERROR - Retrying...");
    delay(2000);
    return;
  }

  // fetch rain prediction & valve control from Firebase
  fetchRainPrediction();
  fetchControl();

  Serial.printf("[DATA] T:%.1fC H:%.1f%% D:%.1fcm W:%.1f%% R:%.1f%% V:%s VLV:%s MODE:%s CMD:%s\n",
                temp, hum, dist, pct, lastRainPercent,
                vibration ? "YES" : "NO",
                valveState ? "OPEN" : "CLOSED",
                controlMode.c_str(),
                manualCommand.c_str());

  // ----- apply control -----
  if (controlMode == "AUTO") {
    autoControl(dist, pct, lastRainPercent);
  } else {  // MANUAL
    if (manualCommand == "OPEN") {
      setValve(true, "MANUAL_OPEN");
    } else if (manualCommand == "CLOSE") {
      setValve(false, "MANUAL_CLOSE");
    }
    // if NONE, maintain current valveState
  }

  // Upload periodically (every 2s)
  if (millis() - lastPost > postInterval) {
    postReading(temp, hum, dist, pct, vibration);
    lastPost = millis();
  }

  delay(500);  // faster loop
}