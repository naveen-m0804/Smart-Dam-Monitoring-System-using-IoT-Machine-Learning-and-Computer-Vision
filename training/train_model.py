 #!/usr/bin/env python3
"""
train_model.py

Train a classifier for rain/no-rain and save a joblib model bundle.

- Input CSV should contain a target column with name containing 'rain' or 'precip'.
  Example: 'Rain' with values like 'rain' / 'no rain'.
- Numeric features commonly used: Temperature, Humidity, Wind_Speed, Cloud_Cover, Pressure.
- Output: rainfall_model.pkl (a joblib dump of a dict:
    {"pipeline": pipeline, "feature_columns": [...], "meta": {...}})
"""

import argparse
from pathlib import Path
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
import warnings

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.experimental import enable_hist_gradient_boosting  # noqa
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, accuracy_score

warnings.filterwarnings("ignore")
RANDOM_STATE = 42


def find_target_column(df: pd.DataFrame):
    candidates = ["rainfall_percent", "rain_percent", "rainfall", "rain", "precipitation", "precip"]
    for c in candidates:
        if c in df.columns:
            return c
    for c in df.columns:
        if "rain" in c.lower() or "precip" in c.lower():
            return c
    raise ValueError("Target column not found. Ensure CSV has a 'Rain' or similar column.")


def choose_features(df: pd.DataFrame, target_col: str):
    # prefer common names, then use all numeric columns except the target
    prefer = ["temperature", "temp", "humidity", "hum", "wind_speed", "windspeed", "wind", "cloud", "pressure"]
    numeric = df.select_dtypes(include=[np.number]).columns.tolist()
    # also coerce parseable numeric columns (e.g., strings with numbers)
    for c in df.columns:
        if c not in numeric and c != target_col:
            try:
                pd.to_numeric(df[c].dropna())
                numeric.append(c)
            except Exception:
                pass
    numeric = [c for c in numeric if c != target_col]
    # order preferred first (if present)
    ordered = []
    for p in prefer:
        for c in numeric:
            if p in c.lower() and c not in ordered:
                ordered.append(c)
    for c in numeric:
        if c not in ordered:
            ordered.append(c)
    return ordered


def build_pipeline(feature_cols):
    num_transform = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    preproc = ColumnTransformer([("num", num_transform, feature_cols)], remainder="drop")
    # candidate estimators: HistGradientBoosting and RandomForest
    # We'll select the better one by validation AUC
    return preproc


def normalize_target_series(s: pd.Series):
    # Strip strings and lowercase
    if s.dtype == object:
        s2 = s.astype(str).str.strip().str.lower()
        # Map common forms of "no rain" and "rain" to 0/1
        # Anything containing 'rain' and not containing 'no' -> positive
        mapping = {}
        uniques = sorted(s2.dropna().unique())
        for u in uniques:
            lu = str(u).lower()
            if ("rain" in lu and "no" not in lu) or lu in ("yes", "y", "true", "t", "1"):
                mapping[u] = 1
            else:
                mapping[u] = 0
        return s2.map(mapping).astype(int), mapping
    else:
        # numeric: if values are 0/1 keep as-is else attempt thresholding
        return s.astype(int), None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train rain/no-rain classifier and save model")
    parser.add_argument("--data", required=True, help="Path to CSV (e.g. weather_forecast_data.csv)")
    parser.add_argument("--out", default="rainfall_model.pkl", help="Output joblib path")
    parser.add_argument("--test-size", type=float, default=0.2, help="Validation split fraction")
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise SystemExit(f"Data file not found: {data_path}")

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df):,} rows. Columns: {df.columns.tolist()}")

    target_col = find_target_column(df)
    print("Using target column:", target_col)

    # normalize target into 0/1
    y_series, mapping = normalize_target_series(df[target_col])
    df = df.loc[y_series.index]  # align
    df[target_col] = y_series

    # choose features (only numeric ones and parseable numeric columns)
    feature_columns = choose_features(df, target_col)
    if not feature_columns:
        raise SystemExit("No numeric features found. Ensure your CSV has Temperature, Humidity, etc.")
    print("Feature columns:", feature_columns)

    # Keep only rows where target is not null
    mask = df[target_col].notnull()
    df = df[mask].copy()

    X = df[feature_columns]
    y = df[target_col].astype(int)

    # Split train/val (stratify for classification)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=args.test_size, random_state=RANDOM_STATE, stratify=y
    )
    print("Train rows:", len(X_train), "Val rows:", len(X_val))

    # Preprocessor
    preproc = build_pipeline(feature_columns)

    # Train candidate classifiers
    candidates = {
        "HistGB": HistGradientBoostingClassifier(random_state=RANDOM_STATE),
        "RandomForest": RandomForestClassifier(n_estimators=200, random_state=RANDOM_STATE, class_weight="balanced", n_jobs=-1),
    }

    best_pipe = None
    best_name = None
    best_auc = -1.0
    results = {}

    for name, clf in candidates.items():
        pipe = Pipeline([("pre", preproc), ("clf", clf)])
        pipe.fit(X_train, y_train)
        # use predict_proba if available
        if hasattr(pipe, "predict_proba"):
            probs = pipe.predict_proba(X_val)[:, 1]
            try:
                auc = float(roc_auc_score(y_val, probs))
            except Exception:
                auc = 0.0
        else:
            preds = pipe.predict(X_val)
            probs = preds  # fallback
            try:
                auc = float(roc_auc_score(y_val, preds))
            except Exception:
                auc = 0.0
        probs = pipe.predict_proba(X_val)
        probs = np.asarray(probs, dtype=float).reshape(-1) if probs.ndim == 1 else probs[:, 1]
        preds_binary = (probs >= 0.5).astype(int)
        acc = float(accuracy_score(y_val, preds_binary))
        results[name] = {"auc": auc, "accuracy": acc}
        print(f"{name} -> AUC: {auc:.4f}, Accuracy: {acc:.4f}")
        if auc > best_auc:
            best_auc = auc
            best_pipe = pipe
            best_name = name

    if best_pipe is None:
        raise SystemExit("No model was trained successfully.")

    print(f"Selected model: {best_name} (validation AUC={best_auc:.4f})")

    # Save the pipeline plus feature list and mapping
    out_bundle = {
        "pipeline": best_pipe,
        "feature_columns": feature_columns,
        "meta": {
            "trained_at": datetime.utcnow().isoformat() + "Z",
            "data_file": str(data_path),
            "n_rows": int(len(df)),
            "selected_model": best_name,
            "validation": results,
            "target_mapping": mapping,
        },
    }

    joblib.dump(out_bundle, args.out)
    print(f"Saved model bundle to: {args.out}")
    print("Bundle keys: pipeline, feature_columns, meta")
