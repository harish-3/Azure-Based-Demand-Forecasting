# Azure Demand Forecasting & Capacity Optimization System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**A full-stack ML-powered system for predicting Azure cloud resource demand and optimizing capacity planning decisions**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Project Overview

This project focuses on building a **predictive system** to accurately forecast Azure Compute and Storage demand. The solution supports the Azure Supply Chain team in making informed capacity provisioning decisions, reducing both over- and under-investment in infrastructure.

### 🎯 Project Statement

> This project focuses on building a predictive system to accurately forecast Azure Compute and Storage demand. The aim is to support the Azure Supply Chain team in making informed capacity provisioning decisions, reducing both over- and under-investment in infrastructure. The solution applies advanced data science, feature engineering, and machine learning techniques using Azure-based tools to drive forecasting accuracy and efficiency.

---

## ✨ Features

### 🔮 **ML-Powered Forecasting**
- **7-day and 30-day CPU demand predictions** using trained Random Forest models
- Recursive forecasting with automatic feature engineering
- Real-time forecast updates via REST API

### 📊 **Capacity Planning & Optimization**
- Intelligent scaling recommendations (scale up/down/stable)
- Multi-region capacity comparison
- Utilization analysis with actionable insights
- Cost-saving optimization suggestions

### 📈 **Interactive Dashboards**
- **Real-time visualizations** with React and Recharts
- Multi-region comparison views
- Historical usage trends analysis
- Model performance monitoring

### 🤖 **Model Monitoring**
- Model health tracking and drift detection
- MAPE (Mean Absolute Percentage Error) monitoring
- Automated retraining recommendations
- Performance metrics visualization

### 🌍 **Multi-Region Support**
- Compare resource usage across Azure regions
- Region-specific forecasts and recommendations
- Peak hours analysis per region

---

## 🏗️ Architecture

### **Tech Stack**

#### Backend
- **Python 3.8+** with Flask REST API
- **scikit-learn** for ML models (Random Forest)
- **Pandas & NumPy** for data processing
- **Joblib** for model serialization

#### Frontend
- **React 19.1** with Vite
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation

### **System Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Dashboard, Forecasts, Reports, Monitoring, etc.)       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Flask Backend API (Port 5000)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Forecast    │  │  Capacity    │  │  Monitoring  │ │
│  │   Utils      │  │   Utils      │  │   Utils      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              ML Model (Random Forest)                    │
│              + Historical Dataset                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites

- **Python 3.8+**
- **Node.js 18+** and npm
- **Git**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   # Windows
   python -m venv env
   env\Scripts\activate

   # macOS/Linux
   python3 -m venv env
   source env/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Ensure model file exists:**
   - Place your trained model at: `backend/models/cpu_demand_model.pkl`
   - Or use fallback: `backend/notebooks/models/rf_cpu_model.pkl`
   - Ensure dataset exists: `backend/data/feature_engineered/mlmodeltrainingdataset.csv`

5. **Start backend server:**
   ```bash
   python app.py
   ```
   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL (optional):**
   Create `frontend/.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

---

## 📖 Usage

### Starting the Application

1. **Terminal 1 - Start Backend:**
   ```bash
   cd backend
   python app.py
   ```
   You should see:
   ```
   ✅ Loaded CPU model from: ...
   ✅ Loaded dataset from: ...
   🌐 Starting Flask Development Server...
   📍 Access the API at: http://localhost:5000
   ```

2. **Terminal 2 - Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser:**
   Navigate to `http://localhost:5173`

### Using the Dashboard

1. **Dashboard** - Overview with KPIs and charts
2. **Forecasts** - Detailed 7-day predictions with capacity planning
3. **Usage Trends** - Historical usage patterns
4. **Reports** - Exportable reports and recommendations
5. **Model Monitoring** - Model health and drift detection
6. **Multi-Region** - Compare capacity across regions

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000
```

### Endpoints

#### Health Check
```http
GET /
```
Returns API status and available endpoints.

#### Get Forecasts
```http
GET /api/forecast_7      # 7-day forecast
GET /api/forecast_30     # 30-day forecast
```

**Response:**
```json
{
  "forecast_days": 7,
  "predictions": [75.5, 78.2, 80.1, ...]
}
```

#### Capacity Planning
```http
POST /api/capacity_planning
Content-Type: application/json

{
  "capacity": 10000,
  "forecast_days": 7
}
```

**Response:**
```json
{
  "avg_forecast": 78.5,
  "capacity": 10000,
  "utilization": 78.5,
  "status": "stable",
  "recommendation": "✅ STABLE: Current capacity is adequate"
}
```

#### Optimization Suggestions
```http
POST /api/optimization
Content-Type: application/json

{
  "capacity": 10000,
  "forecast_days": 7,
  "region": "East US"
}
```

#### Model Monitoring
```http
GET /api/monitoring?mape=8.5
```

#### Multi-Region Data
```http
GET /api/multi_region?regions=East US,West Europe,Central India
```

#### Comprehensive Report
```http
GET /api/report?capacity=10000&mape=8.5
```

For detailed API documentation, see the [Backend API Documentation](BACKEND_REVIEW_REPORT.md).

---

## 📁 Project Structure

```
azure-demand-forecasting/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── forecast_utils.py      # Forecasting logic
│   ├── capacity_utils.py      # Capacity planning
│   ├── monitoring_utils.py    # Model monitoring
│   ├── reporting_utils.py     # Report generation
│   ├── requirements.txt       # Python dependencies
│   ├── models/                # ML model files (.pkl)
│   ├── data/                  # Datasets
│   │   ├── raw/
│   │   ├── processed/
│   │   └── feature_engineered/
│   └── notebooks/             # Jupyter notebooks
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── pages/             # Page components
│   │   │   ├── Forecasts.jsx
│   │   │   ├── UsageTrends.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── ModelMonitoring.jsx
│   │   │   └── MultiRegionDashboard.jsx
│   │   ├── components/        # Reusable components
│   │   ├── services/
│   │   │   └── api.js         # API service layer
│   │   └── context/           # React context
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md                  # This file
└── Documentation/
    ├── PROJECT_EXPLANATION.md
    ├── BACKEND_REVIEW_REPORT.md
    └── GITHUB_PUSH_GUIDE.md
```

---

## 🔧 Configuration

### Environment Variables

**Backend:**
- Model path: Configured in `app.py` (defaults to `models/cpu_demand_model.pkl`)
- Data path: Configured in `app.py` (defaults to `data/feature_engineered/mlmodeltrainingdataset.csv`)

**Frontend:**
- API URL: Set `VITE_API_URL` in `frontend/.env` (defaults to `http://localhost:5000`)

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5000/

# Get 7-day forecast
curl http://localhost:5000/api/forecast_7

# Capacity planning
curl -X POST http://localhost:5000/api/capacity_planning \
  -H "Content-Type: application/json" \
  -d '{"capacity": 10000, "forecast_days": 7}'
```

### Test Frontend

1. Open browser DevTools (F12)
2. Check Network tab for API calls
3. Verify data loads correctly

---

## 📊 Features by Page

| Page | Backend Integration | Data Source |
|------|-------------------|-------------|
| **Dashboard** | ✅ Connected | Forecast API, Report API |
| **Forecasts** | ✅ Fully Connected | Forecast, Capacity, Optimization APIs |
| **Usage Trends** | ✅ Fully Connected | Forecast 7 & 30 APIs |
| **Reports** | ✅ Connected | Report, Optimization APIs |
| **Model Monitoring** | ✅ Connected | Monitoring, Forecast APIs |
| **Multi-Region** | ✅ Fully Connected | Multi-Region API |
| **Insights** | ⚠️ Partial | Mock data (can be enhanced) |

---

## 🛠️ Development

### Adding New Features

1. **Backend:** Add new endpoint in `app.py`
2. **Frontend:** Add API function in `services/api.js`
3. **Frontend:** Create/update component in `pages/`

### Code Style

- **Python:** Follow PEP 8
- **JavaScript:** ESLint configured
- **React:** Functional components with hooks

---

## 📚 Documentation

- [Project Explanation](PROJECT_EXPLANATION.md) - Detailed project overview
- [Backend Review Report](BACKEND_REVIEW_REPORT.md) - Backend code review
- [Backend Fixes Applied](BACKEND_FIXES_APPLIED.md) - Fixes and improvements
- [Frontend-Backend Connection Status](FRONTEND_BACKEND_CONNECTION_STATUS.md) - Integration status
- [Multi-Region Integration](MULTI_REGION_INTEGRATION.md) - Multi-region feature docs
- [GitHub Push Guide](GITHUB_PUSH_GUIDE.md) - How to push to GitHub

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Your Name** - *Initial work*

---

## 🙏 Acknowledgments

- Azure Supply Chain team for requirements
- scikit-learn community for ML tools
- React and Flask communities for excellent frameworks

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review code comments

---

<div align="center">

**Built with ❤️ for Azure Capacity Planning**

⭐ Star this repo if you find it helpful!

</div>

