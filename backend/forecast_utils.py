"""
Forecast Utilities for Azure Demand Forecasting System
Milestone 4 - Backend Team

This module provides recursive forecasting capabilities with automatic
feature engineering including lag features, rolling statistics, and derived features.
"""

import pandas as pd
import numpy as np


def recursive_forecast_cpu(df, model, n_days=7):
    """
    Recursive CPU demand forecasting with automatic feature engineering.
    
    This function performs multi-step ahead forecasting by:
    1. Using last 7 days from the dataset as initial history
    2. Predicting the next day's CPU usage
    3. Automatically updating lag features (1, 3, 7 days)
    4. Automatically calculating rolling statistics (mean/std for 3 and 7-day windows)
    5. Automatically generating derived features (ratios and composite metrics)
    6. Feeding the prediction back into history for the next iteration
    
    Args:
        df (pd.DataFrame): Historical dataset with all features
        model: Trained Random Forest model
        n_days (int): Number of days to forecast (default: 7)
    
    Returns:
        list: List of predicted CPU usage values (as Python floats)
    """
    
    df = df.copy()
    
    # Get feature names from the trained model
    feature_cols = model.feature_names_in_
    
    # Initialize history with last 7 days (needed for lag7 and rolling7)
    history = df.tail(7).copy()
    predictions = []
    
    for day in range(n_days):
        # Get the last known day as template
        last = history.iloc[-1].copy()
        
        # -------------------------------------------------------
        # 1) UPDATE DATE FEATURES
        # -------------------------------------------------------
        if "month" in last:
            last["month"] = (last["month"] % 12) + 1
        
        if "year" in last:
            # Increment year when month rolls over from 12 to 1
            if last["month"] == 1:
                last["year"] += 1
        
        if "is_weekend" in last:
            # Simple toggle (not perfectly accurate but reasonable for forecasting)
            last["is_weekend"] = 1 - last["is_weekend"]
        
        # -------------------------------------------------------
        # 2) UPDATE LAG FEATURES (1, 3, 7 days)
        # -------------------------------------------------------
        # Lag-1: Use the most recent value
        if "usage_cpu_lag_1" in last:
            last["usage_cpu_lag_1"] = history["usage_cpu"].iloc[-1]
        
        if "usage_storage_lag_1" in last:
            last["usage_storage_lag_1"] = history["usage_storage"].iloc[-1]
        
        if "users_active_lag_1" in last:
            last["users_active_lag_1"] = history["users_active"].iloc[-1]
        
        # Lag-3: Use value from 3 days ago
        if len(history) >= 3:
            if "usage_cpu_lag_3" in last:
                last["usage_cpu_lag_3"] = history["usage_cpu"].iloc[-3]
            if "usage_storage_lag_3" in last:
                last["usage_storage_lag_3"] = history["usage_storage"].iloc[-3]
            if "users_active_lag_3" in last:
                last["users_active_lag_3"] = history["users_active"].iloc[-3]
        
        # Lag-7: Use value from 7 days ago
        if len(history) >= 7:
            if "usage_cpu_lag_7" in last:
                last["usage_cpu_lag_7"] = history["usage_cpu"].iloc[-7]
            if "usage_storage_lag_7" in last:
                last["usage_storage_lag_7"] = history["usage_storage"].iloc[-7]
            if "users_active_lag_7" in last:
                last["users_active_lag_7"] = history["users_active"].iloc[-7]
        
        # -------------------------------------------------------
        # 3) UPDATE ROLLING FEATURES (mean and std for 3 and 7-day windows)
        # -------------------------------------------------------
        for col in ["usage_cpu", "usage_storage", "users_active"]:
            # Rolling 3-day window
            last3 = history[col].tail(3)
            if f"{col}_rolling_mean_3" in last:
                last[f"{col}_rolling_mean_3"] = last3.mean()
            if f"{col}_rolling_std_3" in last:
                last[f"{col}_rolling_std_3"] = last3.std()
            
            # Rolling 7-day window
            last7 = history[col].tail(7)
            if f"{col}_rolling_mean_7" in last:
                last[f"{col}_rolling_mean_7"] = last7.mean()
            if f"{col}_rolling_std_7" in last:
                last[f"{col}_rolling_std_7"] = last7.std()
        
        # -------------------------------------------------------
        # 4) UPDATE DERIVED FEATURES
        # -------------------------------------------------------
        # Prevent divide-by-zero using small epsilon
        epsilon = 1e-6
        
        if "cpu_per_user" in last:
            last["cpu_per_user"] = last["usage_cpu_lag_1"] / (last["users_active_lag_1"] + epsilon)
        
        if "storage_per_user" in last:
            last["storage_per_user"] = last["usage_storage_lag_1"] / (last["users_active_lag_1"] + epsilon)
        
        if "cpu_storage_ratio" in last:
            last["cpu_storage_ratio"] = last["usage_cpu_lag_1"] / (last["usage_storage_lag_1"] + epsilon)
        
        if "econ_demand_ratio" in last:
            last["econ_demand_ratio"] = last["economic_index"] / (last["cloud_market_demand"] + epsilon)
        
        if "system_stress" in last:
            last["system_stress"] = (
                last["usage_cpu_lag_1"] + 
                last["usage_storage_lag_1"] + 
                last["users_active_lag_1"]
            )
        
        if "cpu_utilization_ratio" in last:
            # Assuming this is CPU usage relative to some baseline
            last["cpu_utilization_ratio"] = last["usage_cpu_lag_1"] / 100.0
        
        if "storage_efficiency" in last:
            # Storage efficiency metric
            last["storage_efficiency"] = last["usage_storage_lag_1"] / (last["users_active_lag_1"] + epsilon)
        
        # -------------------------------------------------------
        # 5) MAKE PREDICTION
        # -------------------------------------------------------
        # Extract features in the exact order expected by the model
      
        ordered = last.reindex(feature_cols)
        row = pd.DataFrame([ordered], columns=feature_cols)
        pred = model.predict(row)[0]

        
        # Convert to Python float (avoid np.float64 in JSON)
        predictions.append(float(pred))
        
        # -------------------------------------------------------
        # 6) UPDATE HISTORY WITH PREDICTION
        # -------------------------------------------------------
        # Feed the prediction back as the new CPU usage
        last["usage_cpu"] = pred
        
        # Append to history for next iteration
        history = pd.concat([history, pd.DataFrame([last])], ignore_index=True)
    
    return predictions


def recursive_forecast_storage(df, model, n_days=7):
    """
    Recursive Storage demand forecasting with automatic feature engineering.
    """
    df = df.copy()
    feature_cols = model.feature_names_in_
    history = df.tail(7).copy()
    predictions = []
    
    for day in range(n_days):
        last = history.iloc[-1].copy()
        
        # 1) UPDATE DATE FEATURES
        if "month" in last:
            last["month"] = (last["month"] % 12) + 1
        if "year" in last:
            if last["month"] == 1:
                last["year"] += 1
        if "is_weekend" in last:
            last["is_weekend"] = 1 - last["is_weekend"]
        
        # 2) UPDATE LAG FEATURES
        if "usage_cpu_lag_1" in last:
            last["usage_cpu_lag_1"] = history["usage_cpu"].iloc[-1]
        if "usage_storage_lag_1" in last:
            last["usage_storage_lag_1"] = history["usage_storage"].iloc[-1]
        if "users_active_lag_1" in last:
            last["users_active_lag_1"] = history["users_active"].iloc[-1]
            
        if len(history) >= 3:
            if "usage_cpu_lag_3" in last:
                last["usage_cpu_lag_3"] = history["usage_cpu"].iloc[-3]
            if "usage_storage_lag_3" in last:
                last["usage_storage_lag_3"] = history["usage_storage"].iloc[-3]
            if "users_active_lag_3" in last:
                last["users_active_lag_3"] = history["users_active"].iloc[-3]
                
        if len(history) >= 7:
            if "usage_cpu_lag_7" in last:
                last["usage_cpu_lag_7"] = history["usage_cpu"].iloc[-7]
            if "usage_storage_lag_7" in last:
                last["usage_storage_lag_7"] = history["usage_storage"].iloc[-7]
            if "users_active_lag_7" in last:
                last["users_active_lag_7"] = history["users_active"].iloc[-7]
        
        # 3) UPDATE ROLLING FEATURES
        for col in ["usage_cpu", "usage_storage", "users_active"]:
            last3 = history[col].tail(3)
            if f"{col}_rolling_mean_3" in last:
                last[f"{col}_rolling_mean_3"] = last3.mean()
            if f"{col}_rolling_std_3" in last:
                last[f"{col}_rolling_std_3"] = last3.std()
            
            last7 = history[col].tail(7)
            if f"{col}_rolling_mean_7" in last:
                last[f"{col}_rolling_mean_7"] = last7.mean()
            if f"{col}_rolling_std_7" in last:
                last[f"{col}_rolling_std_7"] = last7.std()
        
        # 4) UPDATE DERIVED FEATURES
        epsilon = 1e-6
        if "cpu_per_user" in last:
            last["cpu_per_user"] = last["usage_cpu_lag_1"] / (last["users_active_lag_1"] + epsilon)
        if "storage_per_user" in last:
            last["storage_per_user"] = last["usage_storage_lag_1"] / (last["users_active_lag_1"] + epsilon)
        if "cpu_storage_ratio" in last:
            last["cpu_storage_ratio"] = last["usage_cpu_lag_1"] / (last["usage_storage_lag_1"] + epsilon)
        if "econ_demand_ratio" in last:
            last["econ_demand_ratio"] = last["economic_index"] / (last["cloud_market_demand"] + epsilon)
        if "system_stress" in last:
            last["system_stress"] = (last["usage_cpu_lag_1"] + last["usage_storage_lag_1"] + last["users_active_lag_1"])
        if "cpu_utilization_ratio" in last:
            last["cpu_utilization_ratio"] = last["usage_cpu_lag_1"] / 100.0
        if "storage_efficiency" in last:
            last["storage_efficiency"] = last["usage_storage_lag_1"] / (last["users_active_lag_1"] + epsilon)
            
        # 5) MAKE PREDICTION
        ordered = last.reindex(feature_cols)
        row = pd.DataFrame([ordered], columns=feature_cols)
        pred = model.predict(row)[0]
        predictions.append(float(pred))
        
        # 6) UPDATE HISTORY
        last["usage_storage"] = pred  # Update storage usage
        # Assuming CPU usage stays constant or follows a simple trend if we don't have a model for it simultaneously
        # For better accuracy, we should co-simulate, but for now we'll stick to updating storage.
        
        history = pd.concat([history, pd.DataFrame([last])], ignore_index=True)
        
    return predictions


def prepare_single_prediction_features(input_data, df):
    """
    Prepare features for a single prediction from user input.
    
    This function takes raw input data and calculates all derived features
    (lag, rolling, and computed features) needed for prediction.
    
    Args:
        input_data (dict): User-provided feature values
        df (pd.DataFrame): Historical dataset for calculating lag/rolling features
    
    Returns:
        pd.Series: Complete feature vector ready for model prediction
    """
    
    # Start with the input data
    features = pd.Series(input_data)
    
    # If lag features are not provided, calculate from recent history
    if 'usage_cpu_lag_1' not in features:
        recent = df.tail(7)
        
        # Lag-1 features
        if len(recent) >= 1:
            features['usage_cpu_lag_1'] = recent['usage_cpu'].iloc[-1]
            features['usage_storage_lag_1'] = recent['usage_storage'].iloc[-1]
            features['users_active_lag_1'] = recent['users_active'].iloc[-1]
        
        # Lag-3 features
        if len(recent) >= 3:
            features['usage_cpu_lag_3'] = recent['usage_cpu'].iloc[-3]
            features['usage_storage_lag_3'] = recent['usage_storage'].iloc[-3]
            features['users_active_lag_3'] = recent['users_active'].iloc[-3]
        
        # Lag-7 features
        if len(recent) >= 7:
            features['usage_cpu_lag_7'] = recent['usage_cpu'].iloc[-7]
            features['usage_storage_lag_7'] = recent['usage_storage'].iloc[-7]
            features['users_active_lag_7'] = recent['users_active'].iloc[-7]
        
        # Rolling features
        for col in ['usage_cpu', 'usage_storage', 'users_active']:
            features[f'{col}_rolling_mean_3'] = recent[col].tail(3).mean()
            features[f'{col}_rolling_std_3'] = recent[col].tail(3).std()
            features[f'{col}_rolling_mean_7'] = recent[col].tail(7).mean()
            features[f'{col}_rolling_std_7'] = recent[col].tail(7).std()
    
    # Calculate derived features if not provided
    epsilon = 1e-6
    
    if 'cpu_per_user' not in features:
        features['cpu_per_user'] = features.get('usage_cpu_lag_1', 0) / (features.get('users_active_lag_1', 1) + epsilon)
    
    if 'storage_per_user' not in features:
        features['storage_per_user'] = features.get('usage_storage_lag_1', 0) / (features.get('users_active_lag_1', 1) + epsilon)
    
    if 'cpu_storage_ratio' not in features:
        features['cpu_storage_ratio'] = features.get('usage_cpu_lag_1', 0) / (features.get('usage_storage_lag_1', 1) + epsilon)
    
    if 'econ_demand_ratio' not in features:
        features['econ_demand_ratio'] = features.get('economic_index', 0) / (features.get('cloud_market_demand', 1) + epsilon)
    
    if 'system_stress' not in features:
        features['system_stress'] = (
            features.get('usage_cpu_lag_1', 0) +
            features.get('usage_storage_lag_1', 0) +
            features.get('users_active_lag_1', 0)
        )
    
    if 'cpu_utilization_ratio' not in features:
        features['cpu_utilization_ratio'] = features.get('usage_cpu_lag_1', 0) / 100.0
    
    if 'storage_efficiency' not in features:
        features['storage_efficiency'] = features.get('usage_storage_lag_1', 0) / (features.get('users_active_lag_1', 1) + epsilon)
    
    return features