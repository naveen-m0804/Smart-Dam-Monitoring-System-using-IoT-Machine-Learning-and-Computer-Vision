import os

FIREBASE_CRED_PATH = os.getenv("FIREBASE_CRED_PATH", "firebase_service.json")

FIREBASE_DB_URL = (
    "https://smart-dam-automation-system-default-rtdb.asia-southeast1.firebasedatabase.app/"
)

MODEL_PATH = os.getenv("MODEL_PATH", "rainfall_model.pkl")
