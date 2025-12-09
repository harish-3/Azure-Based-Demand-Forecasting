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
from flask import send_file
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
    cpu_model_path = os.path.join("models", "rf_cpu_model.pkl")
    cpu_model = joblib.load(cpu_model_path)
    print(f"✅ Loaded CPU model from: {cpu_model_path}")

    storage_model_path = os.path.join("models", "storage_demand_model.pkl")
    storage_model = joblib.load(storage_model_path)
    print(f"✅ Loaded Storage model from: {storage_model_path}")

    data_path = os.path.join("data", "feature_engineered", "mlmodeltrainingdataset.csv")

    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        print(f"✅ Loaded dataset from: {data_path}")
    else:
        print("⚠️ Dataset not found. Creating a minimal synthetic dataset for runtime.")

        features_cpu = list(getattr(cpu_model, "feature_names_in_", []))
        features_storage = list(getattr(storage_model, "feature_names_in_", []))

        base_cols = [
            "usage_cpu",
            "usage_storage",
            "users_active",
            "month",
            "year",
            "is_weekend",
            "economic_index",
            "cloud_market_demand",
        ]

        all_features = sorted(set(features_cpu) | set(features_storage) | set(base_cols))

        rows = []
        for i in range(14):
            row = {}
            row["usage_cpu"] = 60 + (i % 7)
            row["usage_storage"] = 50 + (i % 5)
            row["users_active"] = 1000 + (i * 10)
            row["month"] = (i % 12) + 1
            row["year"] = 2024
            row["is_weekend"] = 1 if (i % 7) in (5, 6) else 0
            row["economic_index"] = 100.0
            row["cloud_market_demand"] = 80.0

            for col in all_features:
                if col not in row:
                    row[col] = 0.0

            rows.append(row)

        df = pd.DataFrame(rows, columns=all_features)
        print("✅ Synthetic dataset created in-memory.")

    print(f"   Dataset shape: {df.shape}")
    print(f"   Features: {len(getattr(cpu_model, 'feature_names_in_', []))}")

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


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        payload = request.get_json() or {}
        messages = payload.get("messages", [])

        user_msg = None
        for m in messages[::-1]:
            if m.get("role") == "user" and m.get("content"):
                user_msg = m["content"]
                break

        api_key = os.environ.get("OPENROUTER_API_KEY")
        if api_key:
            import requests
            base_url = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            model = os.environ.get("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
            body = {"model": model, "messages": messages or [{"role": "user", "content": user_msg or ""}]}
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            r = requests.post(f"{base_url}/chat/completions", headers=headers, json=body, timeout=20)
            if r.ok:
                data = r.json()
                text = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                )
                return jsonify({"reply": text})
        forecast_7 = recursive_forecast_cpu(df, cpu_model, n_days=7)
        avg_forecast = float(np.mean(forecast_7)) if forecast_7 else 0.0
        min_forecast = float(np.min(forecast_7)) if forecast_7 else 0.0
        max_forecast = float(np.max(forecast_7)) if forecast_7 else 0.0
        trend = "increasing" if forecast_7 and forecast_7[-1] > forecast_7[0] else "decreasing"
        analysis_reply = None
        try:
            suggestion = analyze_capacity(forecast_7, capacity=10000)
            analysis_reply = suggestion.get("recommendation", "Monitor usage closely")
        except Exception:
            analysis_reply = "Capacity planning data is currently unavailable."
        reply_parts = []
        if user_msg:
            reply_parts.append(f"Question: {user_msg}")
        reply_parts.append(
            f"7-day CPU forecast summary: avg {round(avg_forecast,2)}%, min {round(min_forecast,2)}%, max {round(max_forecast,2)}%. Trend is {trend}."
        )
        reply_parts.append(f"Recommendation: {analysis_reply}")
        return jsonify({"reply": " \n".join(reply_parts)})
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


# Region multipliers for simulation
REGION_MULTIPLIERS = {
    "East": 1.0,
    "West": 1.15,
    "North": 0.9,
    "South": 1.05,
    "East US": 1.0, 
    "West Europe": 0.95,
    "Central India": 1.05
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
        predictions_cpu = [round(min(max(p * multiplier, 0), 100), 2) for p in predictions_cpu]
        predictions_storage = [round(p * multiplier, 2) for p in predictions_storage]

        # Confidence intervals (simple ±15% band)
        ci_lower_cpu = [round(min(max(p * 0.85, 0), 100), 2) for p in predictions_cpu]
        ci_upper_cpu = [round(min(max(p * 1.15, 0), 100), 2) for p in predictions_cpu]
        ci_lower_storage = [round(p * 0.85, 2) for p in predictions_storage]
        ci_upper_storage = [round(p * 1.15, 2) for p in predictions_storage]
        
        return jsonify({
            "forecast_days": 7,
            "region": region,
            "predictions": predictions_cpu,
            "predictions_cpu": predictions_cpu,
            "predictions_storage": predictions_storage,
            "ci_lower_cpu": ci_lower_cpu,
            "ci_upper_cpu": ci_upper_cpu,
            "ci_lower_storage": ci_lower_storage,
            "ci_upper_storage": ci_upper_storage
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
        predictions_cpu = [round(min(max(p * multiplier, 0), 100), 2) for p in predictions_cpu]
        predictions_storage = [round(p * multiplier, 2) for p in predictions_storage]

        # Confidence intervals (simple ±15% band)
        ci_lower_cpu = [round(min(max(p * 0.85, 0), 100), 2) for p in predictions_cpu]
        ci_upper_cpu = [round(min(max(p * 1.15, 0), 100), 2) for p in predictions_cpu]
        ci_lower_storage = [round(p * 0.85, 2) for p in predictions_storage]
        ci_upper_storage = [round(p * 1.15, 2) for p in predictions_storage]
        
        return jsonify({
            "forecast_days": 30,
            "region": region,
            "predictions": predictions_cpu,
            "predictions_cpu": predictions_cpu,
            "predictions_storage": predictions_storage,
            "ci_lower_cpu": ci_lower_cpu,
            "ci_upper_cpu": ci_upper_cpu,
            "ci_lower_storage": ci_lower_storage,
            "ci_upper_storage": ci_upper_storage
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route("/api/alerts", methods=["GET"]) 
def alerts():
    try:
        threshold_cpu = float(request.args.get("threshold_cpu", 80))
        predictions = recursive_forecast_cpu(df, cpu_model, n_days=7)
        next_week = float(predictions[-1]) if predictions else 0.0
        alerts = []
        if next_week > threshold_cpu:
            alerts.append({
                "type": "cpu_threshold",
                "message": f"CPU forecast {round(next_week,2)}% exceeds threshold {threshold_cpu}%",
                "severity": "high",
                "value": round(next_week, 2),
                "threshold": threshold_cpu
            })
        return jsonify({"alerts": alerts})
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@app.route("/api/what_if", methods=["POST"]) 
def what_if():
    try:
        data = request.get_json() or {}
        workload_delta = float(data.get("workload_delta", 0))
        traffic_delta = float(data.get("traffic_delta", 0))

        cpu_forecast = recursive_forecast_cpu(df, cpu_model, n_days=7)
        storage_forecast = recursive_forecast_storage(df, storage_model, n_days=7)

        cpu_factor = 1.0 + workload_delta / 100.0
        storage_factor = 1.0 + traffic_delta / 100.0

        simulated_cpu = [round(p * cpu_factor, 2) for p in cpu_forecast]
        simulated_storage = [round(p * storage_factor, 2) for p in storage_forecast]

        return jsonify({
            "base_cpu": cpu_forecast,
            "base_storage": storage_forecast,
            "simulated_cpu": simulated_cpu,
            "simulated_storage": simulated_storage,
            "workload_delta": workload_delta,
            "traffic_delta": traffic_delta
        })
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@app.route("/api/report_pdf", methods=["GET"]) 
def report_pdf():
    try:
        # Generate forecast for chart
        forecast_7 = recursive_forecast_cpu(df, cpu_model, n_days=7)

        # Create a simple chart image using matplotlib
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(6, 3))
        ax.plot(range(1, len(forecast_7)+1), forecast_7, color="#f97316", linewidth=2)
        ax.fill_between(range(1, len(forecast_7)+1),
                        [p*0.85 for p in forecast_7],
                        [p*1.15 for p in forecast_7],
                        color="#4f46e5", alpha=0.2)
        ax.set_title("7-Day CPU Forecast")
        ax.set_xlabel("Day")
        ax.set_ylabel("CPU %")
        chart_path = os.path.join("reports", "forecast_chart.png")
        os.makedirs("reports", exist_ok=True)
        fig.tight_layout()
        fig.savefig(chart_path)
        plt.close(fig)

        # Build PDF with reportlab
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm

        pdf_path = os.path.join("reports", "insights_report.pdf")
        c = canvas.Canvas(pdf_path, pagesize=A4)
        width, height = A4

        c.setFont("Helvetica-Bold", 16)
        c.drawString(2*cm, height - 2*cm, "Azure Demand Forecasting — Insights Report")

        c.setFont("Helvetica", 11)
        c.drawString(2*cm, height - 3*cm, "Summary of past usage, forecast outlook, risk analysis, and recommendations.")

        # Insert chart
        c.drawImage(chart_path, 2*cm, height - 10*cm, width=17*cm, height=6*cm)

        # Add simple metrics
        avg_val = float(np.mean(forecast_7)) if forecast_7 else 0.0
        min_val = float(np.min(forecast_7)) if forecast_7 else 0.0
        max_val = float(np.max(forecast_7)) if forecast_7 else 0.0
        c.setFont("Helvetica", 11)
        c.drawString(2*cm, height - 11*cm, f"Average forecast: {round(avg_val,2)}%")
        c.drawString(2*cm, height - 11.7*cm, f"Min forecast: {round(min_val,2)}%")
        c.drawString(2*cm, height - 12.4*cm, f"Max forecast: {round(max_val,2)}%")

        c.showPage()
        c.save()

        return send_file(pdf_path, mimetype="application/pdf", as_attachment=True, download_name="insights_report.pdf")
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


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
    
    app.run(debug=False, host="0.0.0.0", port=5000, threaded=True)
