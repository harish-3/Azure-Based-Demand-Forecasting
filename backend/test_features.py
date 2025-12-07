import pandas as pd
import joblib

# 1. LOAD YOUR DATASET
df = pd.read_csv("data/feature_engineered/final_feature_engineered.csv")

# 2. LOAD MODEL USING JOBLIB
model = joblib.load("models/cpu_demand_model.pkl")

dataset_cols = list(df.columns)

try:
    model_features = list(model.feature_names_in_)
except:
    model_features = list(df.columns)   # fallback so script doesn't crash

# 3. COMPARE
missing_in_model = [col for col in dataset_cols if col not in model_features]
extra_in_model = [col for col in model_features if col not in dataset_cols]

print("TOTAL dataset columns:", len(dataset_cols))
print("TOTAL model features:", len(model_features))
print("--------------------------------------------------")
print("MISSING FEATURES:", missing_in_model)
print("--------------------------------------------------")
print("EXTRA FEATURES:", extra_in_model)
