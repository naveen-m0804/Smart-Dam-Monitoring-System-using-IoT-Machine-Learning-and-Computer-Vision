import os
from datetime import datetime, timedelta

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, db

# ---------------- Config ----------------

FIREBASE_DB_URL = (
    "https:/****************.firebasedatabase.app/"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIREBASE_CRED_PATH = os.path.join(BASE_DIR, "firebase_service.json")

IST_OFFSET = timedelta(hours=5, minutes=30)

app = Flask(__name__)
CORS(app)


# ---------------- Firebase init ----------------
try:
    cred = credentials.Certificate(FIREBASE_CRED_PATH)
    firebase_admin.initialize_app(cred, {"databaseURL": FIREBASE_DB_URL})
    print("Firebase initialized with credentials")
except Exception:
    try:
        firebase_admin.initialize_app(options={"databaseURL": FIREBASE_DB_URL})
        print("Firebase initialized without credentials")
    except Exception:
        print("Firebase already initialized")


# ---------------- Helpers ----------------

def nice_ts(raw):
    """Convert timestamp (millis or ISO) to readable IST format."""
    if raw is None:
        return ""
    try:
        if isinstance(raw, (int, float)):
            dt = datetime.utcfromtimestamp(raw / 1000.0) + IST_OFFSET
        else:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00")) + IST_OFFSET
        return dt.strftime("%d %b %Y, %I:%M %p")
    except:
        return str(raw)


def _snapshot_to_list(snap, limit=500):
    if snap is None:
        return []
    if isinstance(snap, dict):
        return [snap[k] for k in sorted(snap.keys(), reverse=True)][:limit]
    if isinstance(snap, list):
        return list(reversed(snap))[:limit]
    return []


def get_readings_list(limit=500):
    snap = db.reference("readings").order_by_key().limit_to_last(limit).get()
    items = []
    for obj in _snapshot_to_list(snap, limit):
        item = dict(obj)
        item["timestamp"] = nice_ts(item.get("timestamp"))
        items.append(item)
    return items


def _get_latest_reading():
    snap = db.reference("readings").order_by_key().limit_to_last(1).get()
    items = _snapshot_to_list(snap, 1)
    return items[0] if items else None


# ---------------- Weather API ----------------

def fetch_weather():
    """Fetch from Open-Meteo including precipitation probability."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": 13.0827,
        "longitude": 80.2707,
        "current_weather": True,
        "hourly": "precipitation_probability,cloudcover,relativehumidity_2m",
        "timezone": "auto",
    }
    try:
        r = requests.get(url, params=params, timeout=5)
        r.raise_for_status()
        data = r.json()

        hourly = data.get("hourly", {})
        rain_prob_series = hourly.get("precipitation_probability", [])
        cloud_series = hourly.get("cloudcover", [])
        hum_series = hourly.get("relativehumidity_2m", [])

        return {
            "temperature": data["current_weather"].get("temperature"),
            "humidity": hum_series[0] if hum_series else None,
            "cloud": cloud_series[0] if cloud_series else None,
            "rain_prob": rain_prob_series[0] if rain_prob_series else None,
            "windspeed": data["current_weather"].get("windspeed"),
            "time": data["current_weather"].get("time"),
        }
    except Exception as e:
        print("Weather error:", e)
        return {
            "temperature": None,
            "humidity": None,
            "cloud": None,
            "rain_prob": None,
            "windspeed": None,
            "time": None,
        }


# ---------------- Rainfall Prediction (No Model) ----------------

def compute_rainfall_percent(weather, fallback_humidity):
    """
    1. If Open-Meteo gives rain probability → use it directly.
    2. Else fall back to humidity + cloud logic.
    """

    if weather["rain_prob"] is not None:
        return float(weather["rain_prob"])

    # Fallback rule-based logic:
    hum = fallback_humidity or weather.get("humidity") or 50
    cloud = weather.get("cloud") or 50

    # simple formula
    score = (hum * 0.6) + (cloud * 0.4)
    percent = min(max(score, 0), 100)

    return round(percent, 2)


# ---------------- Routes ----------------

@app.route("/")
def health():
    return jsonify({"status": "ok", "using_model": False})


@app.route("/api/weather")
def api_weather():
    w = fetch_weather()
    return jsonify(
        {
            "locationName": "Chennai",
            "temperature": w["temperature"],
            "humidity": w["humidity"],
            "cloud": w["cloud"],
            "rain_prob": w["rain_prob"],
            "windspeed": w["windspeed"],
            "time": nice_ts(w["time"]),
        }
    )


@app.route("/api/rainfall")
def api_rainfall():
    """Rainfall prediction using ONLY weather API — no ML model."""
    try:
        latest = _get_latest_reading()
        fallback_humidity = None

        if latest:
            try:
                fallback_humidity = float(latest.get("humidity"))
            except:
                fallback_humidity = None

        weather = fetch_weather()
        percent = compute_rainfall_percent(weather, fallback_humidity)
        rain_label = "YES" if percent >= 50 else "NO"

        ts = nice_ts(latest.get("timestamp")) if latest else ""

        # Store in Firebase
        db.reference("predictions/rainfall").set(
            {
                "percent": percent,
                "rainLabel": rain_label,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )

        # Also log it
        db.reference("alerts/rainfall").push(
            {
                "percent": percent,
                "rainLabel": rain_label,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )

        return jsonify({"percent": percent, "rainLabel": rain_label, "timestamp": ts})

    except Exception as e:
        print("Rainfall route error:", e)
        return jsonify({"percent": 0, "rainLabel": "NO", "timestamp": ""})


@app.route("/api/readings")
def api_readings():
    return jsonify(get_readings_list(500))


# ---------------- Logs ----------------

@app.route("/api/waterlevel/logs")
def api_water_logs():
    snap = db.reference("alerts/waterLevel").order_by_key().limit_to_last(200).get()
    return jsonify(_snapshot_to_list(snap, 200))


@app.route("/api/vibration/logs")
def api_vibration_logs():
    snap = db.reference("alerts/vibration").order_by_key().limit_to_last(200).get()
    return jsonify(_snapshot_to_list(snap, 200))


# ---------------- Valve ----------------

@app.route("/api/valve")
def api_valve_status():
    status_ref = db.reference("status/valve").get() or {}
    control_ref = db.reference("control/valve").get() or {}

    raw_reason = (
        status_ref.get("reason")
        or status_ref.get("lastChangeReason")
        or "SAFE_LEVEL"
    )

    state = status_ref.get("state", "CLOSED")
    if raw_reason == "BOOT" and state == "CLOSED":
        reason = "SAFE_LEVEL"
    else:
        reason = raw_reason

    return jsonify(
        {
            "state": state,
            "reason": reason,
            "timestamp": nice_ts(status_ref.get("timestamp")),
            "mode": control_ref.get("mode", "AUTO"),
        }
    )


@app.route("/api/valve/control", methods=["POST"])
def api_valve_control():
    body = request.get_json(force=True)
    mode = body.get("mode") or "AUTO"
    cmd = body.get("command") or "NONE"

    db.reference("control/valve").update(
        {
            "mode": mode,
            "manualCommand": cmd,
            "updatedAt": datetime.utcnow().isoformat() + "Z",
        }
    )

    return jsonify({"success": True})


# ---------------- Main ----------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🔥 Backend starting on :{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
