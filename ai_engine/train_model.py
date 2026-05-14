import os
from pathlib import Path
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset" / "vm_recommendation_dataset.csv"
MODEL_PATH   = BASE_DIR / "models" / "vm_recommender.pkl"

os.makedirs(BASE_DIR / "models", exist_ok=True)

df = pd.read_csv(DATASET_PATH)
print(f"✅ Dataset loaded: {len(df)} rows, {df['recommended_profile'].nunique()} profiles")
print(f"Profile distribution:\n{df['recommended_profile'].value_counts()}\n")

# FIX: app_weight et budget_score ajoutés comme features discriminantes
X = df[[
    "application_type", "expected_users", "traffic_level",
    "budget", "performance_level", "storage_need",
    "workload_score", "resource_score", "criticality_score",
    "app_weight", "budget_score",
]]
y = df["recommended_profile"]

categorical_features = ["application_type", "traffic_level", "budget", "performance_level"]
numeric_features     = [
    "expected_users", "storage_need",
    "workload_score", "resource_score", "criticality_score",
    "app_weight", "budget_score",
]

preprocessor = ColumnTransformer(transformers=[
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ("num", "passthrough", numeric_features),
])

model = GradientBoostingClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    min_samples_split=2,
    random_state=42,
)

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", model),
])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")
print(f"📊 Cross-validation accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
except ValueError as e:
    print(f"⚠️  Stratified split failed ({e}), using random split.")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)

print(f"\n🎯 Test Accuracy: {accuracy_score(y_test, y_pred):.3f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

joblib.dump(pipeline, MODEL_PATH)
print(f"\n✅ Model saved at: {MODEL_PATH}")
