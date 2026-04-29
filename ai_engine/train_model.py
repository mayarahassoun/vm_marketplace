import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report


DATASET_PATH = "dataset/vm_recommendation_dataset.csv"
MODEL_PATH = "models/vm_recommender.pkl"

os.makedirs("models", exist_ok=True)

df = pd.read_csv(DATASET_PATH)

X = df[
    [
        "application_type",
        "expected_users",
        "traffic_level",
        "budget",
        "performance_level",
        "storage_need",
        "workload_score",
        "resource_score",
        "criticality_score",
    ]
]

y = df["recommended_profile"]

categorical_features = [
    "application_type",
    "traffic_level",
    "budget",
    "performance_level",
]

numeric_features = [
    "expected_users",
    "storage_need",
    "workload_score",
    "resource_score",
    "criticality_score",
]

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ("num", "passthrough", numeric_features),
    ]
)

model = GradientBoostingClassifier(
    n_estimators=150,
    learning_rate=0.08,
    max_depth=3,
    random_state=42,
)

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)

if len(df) < 10:
    raise ValueError("Dataset is too small. Please add more training examples.")

try:
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )
except ValueError:
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
    )

pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

joblib.dump(pipeline, MODEL_PATH)

print(f"\nModel saved successfully at: {MODEL_PATH}")