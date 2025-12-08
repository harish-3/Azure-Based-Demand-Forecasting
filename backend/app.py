"""
Azure Demand Forecasting & Capacity Optimization System
Milestone 4 - Backend API

Flask REST API for CPU demand forecasting with:
- Model deployment
- Recursive forecasting (7 and 30 days)
- Capacity planning
- Model drift monitoring
- Automated reporting
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import traceback

# Import custom utility modules

# Import custom utility modules
from forecast_utils import recursive_forecast_cpu, recursive_forecast_storage, prepare_single_prediction_features
from capacity_utils import analyze_capacity, detailed_capacity_report, optimization_suggestor
from monitoring_utils import monitoring_stats, comprehensive_model_health

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# ---------------------------------------------------
# 1) LOAD MODEL AND DATASET AT STARTUP
# ---------------------------------------------------
print("=" * 60)
print("🚀 Azure Demand Forecasting API - Starting Up...")
print("=" * 60)

try:
    # Load trained CPU demand model
    cpu_model_path = os.path.join("models", "rf_cpu_model.pkl")
    cpu_model = joblib.load(cpu_model_path)
    print(f"✅ Loaded CPU model from: {cpu_model_path}")

    # Load trained Storage demand model
    storage_model_path = os.path.join("models", "storage_demand_model.pkl")
    storage_model = joblib.load(storage_model_path)
    print(f"✅ Loaded Storage model from: {storage_model_path}")
    
    # Load ML-ready dataset
    data_path = os.path.join("data", "feature_engineered", "mlmodeltrainingdataset.csv")
    df = pd.read_csv(data_path)
    print(f"✅ Loaded dataset from: {data_path}")
    print(f"   Dataset shape: {df.shape}")
    print(f"   Features: {len(cpu_model.feature_names_in_)}")
    
    print("=" * 60)
    print("✅ Initialization Complete - API Ready!")
    print("=" * 60)
    
except Exception as e:
    print("=" * 60)
    print(f"❌ ERROR during initialization: {str(e)}")
    print("=" * 60)
    raise


# ---------------------------------------------------
# 2) HELPER FUNCTION - Convert numpy types to Python types
# ---------------------------------------------------
def convert_to_python_types(obj):
    """Recursively convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_python_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_python_types(item) for item in obj]
    else:
        return obj


# ---------------------------------------------------
# 3) API ENDPOINTS
# ---------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    """Health check endpoint."""
    return jsonify({
        "status": "running",
        "message": "🚀 Azure Demand Forecasting API is running!",
        "version": "Milestone 4",
        "endpoints": {
            "health": "GET /",
            "metrics": "GET /api/metrics",
            "predict": "POST /api/predict_cpu",
            "forecast_7": "GET /api/forecast_7",
            "forecast_30": "GET /api/forecast_30",
            "capacity": "POST /api/capacity_planning",
            "optimization": "POST /api/optimization",
            "monitoring": "GET /api/monitoring",
            "report": "GET /api/report",
            "multi_region": "GET /api/multi_region"
        }
    })


@app.route("/api/metrics", methods=["GET"])
def metrics():
    """Get model status and metadata."""
    try:
        return jsonify({
            "cpu_model": {
                "status": "loaded",
                "type": type(cpu_model).__name__,
                "n_features": len(cpu_model.feature_names_in_),
                "features": cpu_model.feature_names_in_.tolist()
            },
            "storage_model": {
                "status": "loaded",
                "type": type(storage_model).__name__,
                "n_features": len(storage_model.feature_names_in_)
            },
            "dataset": {
                "status": "loaded",
                "shape": df.shape,
                "rows": len(df),
                "columns": len(df.columns)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict_cpu", methods=["POST"])
def predict_cpu():
    """
    Single CPU prediction with custom input.
    
    Request Body (JSON):
        {
            "usage_cpu": 75.5,
            "usage_storage": 82.3,
            "users_active": 1500,
            ...
            (can provide all 44 features or partial - missing lag/rolling features will be calculated)
        }
    
    Response:
        {
            "prediction": 78.3,
            "input_features": {...}
        }
    """
    try:
        # Get input data
        input_data = request.get_json()
        
        if not input_data:
            return jsonify({"error": "No input data provided"}), 400
        
        # Prepare features (calculate lag/rolling if not provided)
        features = prepare_single_prediction_features(input_data, df)
        
        # Reindex to match model's expected feature order
        feature_vector = features.reindex(cpu_model.feature_names_in_).values.reshape(1, -1)
        
        # Make prediction
        prediction = cpu_model.predict(feature_vector)[0]
        
        return jsonify({
            "prediction": float(prediction),
            "input_features": convert_to_python_types(features.to_dict())
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


# Region multipliers for simulation
REGION_MULTIPLIERS = {
    "East": 1.0,
    "West": 1.15,
    "North": 0.9,
    "South": 1.05,
    "East US": 1.0, 
    "West Europe": 0.95,
    "Central India": 1.2
}

@app.route("/api/forecast_7", methods=["GET"])
def forecast_7():
    """
    7-day recursive CPU & Storage demand forecast.
    Optional query param: region (default: "East")
    """
    try:
        region = request.args.get("region", "East")
        
        # Generate 7-day forecast
        predictions_cpu = recursive_forecast_cpu(df, cpu_model, n_days=7)
        predictions_storage = recursive_forecast_storage(df, storage_model, n_days=7)
        
        # Apply regional variation
        multiplier = REGION_MULTIPLIERS.get(region, 1.0)
        predictions_cpu = [round(p * multiplier, 2) for p in predictions_cpu]
        predictions_storage = [round(p * multiplier, 2) for p in predictions_storage]
        
        return jsonify({
            "forecast_days": 7,
            "region": region,
            "predictions": predictions_cpu,          # Kept for backward compat
            "predictions_cpu": predictions_cpu,      # Explicit name
            "predictions_storage": predictions_storage # New field
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/forecast_30", methods=["GET"])
def forecast_30():
    """
    30-day recursive CPU & Storage demand forecast.
    Optional query param: region (default: "East")
    """
    try:
        region = request.args.get("region", "East")
        
        # Generate 30-day forecast
        predictions_cpu = recursive_forecast_cpu(df, cpu_model, n_days=30)
        predictions_storage = recursive_forecast_storage(df, storage_model, n_days=30)
        
        # Apply regional variation
        multiplier = REGION_MULTIPLIERS.get(region, 1.0)
        predictions_cpu = [round(p * multiplier, 2) for p in predictions_cpu]
        predictions_storage = [round(p * multiplier, 2) for p in predictions_storage]
        
        return jsonify({
            "forecast_days": 30,
            "region": region,
            "predictions": predictions_cpu,          # Kept for backward compat
            "predictions_cpu": predictions_cpu,      # Explicit name
            "predictions_storage": predictions_storage # New field
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/capacity_planning", methods=["POST"])
def capacity_planning():
    """
    Capacity planning analysis with scaling recommendations.
    
    Request Body (JSON):
        {
            "capacity": 10000,
            "forecast_days": 7  (optional, default: 7)
        }
    
    Response:
        {
            "avg_forecast": 78.5,
            "capacity": 10000,
            "utilization": 0.785,
            "status": "stable" / "scale_up" / "scale_down",
            "recommendation": "..."
        }
    """
    try:
        # Get input data
        data = request.get_json()
        
        if not data or "capacity" not in data:
            return jsonify({"error": "Missing 'capacity' in request body"}), 400
        
        capacity = data["capacity"]
        forecast_days = data.get("forecast_days", 7)
        
        # Generate forecast
        predictions = recursive_forecast_cpu(df, cpu_model, n_days=forecast_days)
        
        # Analyze capacity
        analysis = analyze_capacity(predictions, capacity)
        
        return jsonify(analysis)
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/optimization", methods=["POST"])
def optimization():
    try:
        data = request.get_json()
        if not data or "capacity" not in data:
            return jsonify({"error": "Missing 'capacity' in request body"}), 400

        capacity = float(data["capacity"])
        forecast_days = int(data.get("forecast_days", 1))
        region = data.get("region", "unknown")

        predictions = recursive_forecast_cpu(df, cpu_model, n_days=forecast_days)
        suggestion = optimization_suggestor(predictions, capacity, region)

        return jsonify(suggestion)
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/monitoring", methods=["GET"])
def monitoring():
    """
    Model health monitoring and drift detection.
    
    Query Parameters:
        mape (optional): Current MAPE value (default: 8.5 for demo)
    
    Response:
        {
            "mape": 8.5,
            "threshold": 10.0,
            "status": "stable" / "drift_detected",
            "message": "...",
            "recommendation": "..."
        }
    """
    try:
        # Get MAPE from query parameters (or use demo value)
        mape = float(request.args.get("mape", 8.5))
        
        # Analyze model health
        health = monitoring_stats(mape)
        
        return jsonify(health)
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/report", methods=["GET"])
def report():
    """
    Comprehensive automated report combining forecast, capacity, and monitoring.
    
    Query Parameters:
        capacity (optional): Current capacity value (default: 10000)
        mape (optional): Current MAPE value (default: 8.5)
    
    Response:
        {
            "report_type": "comprehensive",
            "forecast_summary": {...},
            "capacity_analysis": {...},
            "model_health": {...}
        }
    """
    try:
        # Get parameters
        capacity = float(request.args.get("capacity", 10000))
        mape = float(request.args.get("mape", 8.5))
        
        # Generate 7-day forecast
        forecast_7 = recursive_forecast_cpu(df, cpu_model, n_days=7)
        
        # Build comprehensive report
        report_data = {
            "report_type": "comprehensive",
            "generated_at": pd.Timestamp.now().isoformat(),
            
            "forecast_summary": {
                "days_forecasted": 7,
                "predictions": forecast_7,
                "avg_forecast": float(np.mean(forecast_7)),
                "min_forecast": float(np.min(forecast_7)),
                "max_forecast": float(np.max(forecast_7)),
                "trend": "increasing" if forecast_7[-1] > forecast_7[0] else "decreasing"
            },
            
            "capacity_analysis": analyze_capacity(forecast_7, capacity),
            
            "model_health": monitoring_stats(mape)
        }
        
        return jsonify(convert_to_python_types(report_data))
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/multi_region", methods=["GET"])
def multi_region():
    """
    Multi-region capacity comparison endpoint.
    
    Query Parameters:
        regions (optional): Comma-separated list of regions (default: "East US,West Europe,Central India")
    
    Response:
        {
            "regions": [
                {
                    "name": "East US",
                    "cpuUsage": 75.5,
                    "storageUsage": 64.2,
                    "forecast": [76.1, 77.2, 78.5, 79.8],
                    "peakHours": ["14:00", "15:00", "16:00"],
                    "recommendation": "..."
                },
                ...
            ]
        }
    """
    try:
        # Get regions from query parameters
        regions_param = request.args.get("regions", "East US,West Europe,Central India")
        region_names = [r.strip() for r in regions_param.split(",")]
        
        # Generate forecast for base comparison
        forecast_7 = recursive_forecast_cpu(df, cpu_model, n_days=7)
        forecast_4 = forecast_7[:4]  # First 4 days for T+1 to T+4
        
        # Base CPU usage from last known value
        last_cpu = float(df["usage_cpu"].iloc[-1]) if "usage_cpu" in df.columns else float(np.mean(forecast_7))
        last_storage = float(df["usage_storage"].iloc[-1]) if "usage_storage" in df.columns else last_cpu * 0.85
        
        regions_data = []
        
        for idx, region_name in enumerate(region_names):
            # Add regional variation to forecasts (simulate different regions)
            # Each region gets slightly different forecast based on index
            variation_factor = 1.0 + (idx * 0.05)  # 0%, 5%, 10% variation
            region_forecast = [round(v * variation_factor, 1) for v in forecast_4]
            
            # Regional CPU and storage usage with variation
            region_cpu = round(last_cpu * variation_factor, 1)
            region_storage = round(last_storage * variation_factor, 1)
            
            # Generate peak hours (simulate different timezones)
            peak_hour_base = 14 + (idx * 2)  # Different peak hours per region
            peak_hours = [
                f"{(peak_hour_base - 1) % 24:02d}:00",
                f"{peak_hour_base % 24:02d}:00",
                f"{(peak_hour_base + 1) % 24:02d}:00"
            ]
            
            # Get optimization recommendation for this region
            avg_forecast = np.mean(region_forecast)
            capacity = 10000  # Default capacity
            optimization = optimization_suggestor(region_forecast, capacity, region_name)
            recommendation = optimization.get("recommendation", "Monitor usage closely")
            
            regions_data.append({
                "name": region_name,
                "cpuUsage": region_cpu,
                "storageUsage": region_storage,
                "forecast": region_forecast,
                "peakHours": peak_hours,
                "recommendation": recommendation
            })
        
        return jsonify({
            "regions": convert_to_python_types(regions_data)
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


# ---------------------------------------------------
# 4) ERROR HANDLERS
# ---------------------------------------------------

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500




# ---------------------------------------------------
# 5) RUN SERVER
# ---------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🌐 Starting Flask Development Server...")
    print("📍 Access the API at: http://localhost:5000")
    print("=" * 60 + "\n")
    
    app.run(debug=True, host="0.0.0.0", port=5000)
