# # test_model.py
# import joblib
# import pandas as pd

# bundle = joblib.load("training/random_forest_model.pkl")
# pipe = bundle["pipeline"]
# cols = bundle["feature_columns"]

# print("Feature columns:", cols)

# # make a fake 'rainy' example
# row = {c: 0.0 for c in cols}
# for c in cols:
#     lc = c.lower()
#     if "temp" in lc:
#         row[c] = 24.0
#     if "hum" in lc:
#         row[c] = 90.0
#     if "wind" in lc:
#         row[c] = 5.0

# X = pd.DataFrame([row], columns=cols)
# print("Test input:", X)

# if hasattr(pipe, "predict_proba"):
#     proba = pipe.predict_proba(X)
#     print("predict_proba:", proba)
# else:
#     pred = pipe.predict(X)
#     print("predict:", pred)


import joblib
import pandas as pd

model = joblib.load("training/random_forest_model.pkl")

feature_cols = list(model.feature_names_in_)
print("Features:", feature_cols)
# ['temparature', 'humidity ', 'cloud ', 'sunshine', 'wind_direction']

row = {
    'temparature': 26.9,
    'humidity ': 80.0,       # note the space in key!
    'cloud ': 0.00,          # e.g. 50% cloud cover
    'sunshine': 0.0,         # e.g. hours of sunshine
    'wind_direction': 0.0  # e.g. degrees
}

X = pd.DataFrame([row], columns=feature_cols)

if hasattr(model, "predict_proba"):
    proba = model.predict_proba(X)
    print("predict_proba:", proba)
else:
    pred = model.predict(X)
    print("predict:", pred)
