"""
Capacity Planning Utilities for Azure Demand Forecasting System
Milestone 4 - Backend Team

This module provides intelligent capacity planning and scaling recommendations
based on forecasted resource utilization.
"""

import numpy as np


def analyze_capacity(forecast_values, current_capacity):
    """
    Analyze capacity requirements and provide scaling recommendations.
    
    Decision Logic:
    - If utilization > 80% → Scale Up (recommend adding 15% capacity)
    - If utilization < 40% → Scale Down (recommend reducing 10% capacity)
    - Otherwise → Stable (no action needed)
    
    Args:
        forecast_values (list): List of forecasted demand values
        current_capacity (int/float): Current system capacity
    
    Returns:
        dict: Capacity analysis with recommendation
            {
                "avg_forecast": float,
                "capacity": float,
                "utilization": float,
                "status": str,  # "scale_up", "scale_down", or "stable"
                "recommendation": str
            }
    """
    
    # Calculate average forecast demand
    avg_forecast = float(np.mean(forecast_values))
    
    # Calculate utilization percentage
    utilization = (avg_forecast / current_capacity) * 100 if current_capacity > 0 else 0
    
    # Determine scaling status and recommendation
    if utilization > 80:
        status = "scale_up"
        # Recommend adding 15% capacity
        recommended_additional = int(current_capacity * 0.15)
        recommendation = f"⚠️ Scale UP: Add approx {recommended_additional} units (15% increase recommended)"
        
    elif utilization < 40:
        status = "scale_down"
        # Recommend reducing 10% capacity
        recommended_reduction = int(current_capacity * 0.10)
        recommendation = f"💡 Scale DOWN: Remove approx {recommended_reduction} units (10% reduction possible)"
        
    else:
        status = "stable"
        recommendation = "✅ STABLE: Current capacity is adequate, no action needed"
    
    return {
        "avg_forecast": round(avg_forecast, 2),
        "capacity": float(current_capacity),
        "utilization": round(utilization, 2),
        "status": status,
        "recommendation": recommendation
    }


def detailed_capacity_report(forecast_values, current_capacity):
    """
    Generate a detailed capacity planning report with additional metrics.
    
    Args:
        forecast_values (list): List of forecasted demand values
        current_capacity (int/float): Current system capacity
    
    Returns:
        dict: Detailed capacity report
    """
    
    # Get basic capacity analysis
    basic_analysis = analyze_capacity(forecast_values, current_capacity)
    
    # Add detailed metrics
    forecast_array = np.array(forecast_values)
    
    detailed_report = {
        **basic_analysis,
        "forecast_min": round(float(np.min(forecast_array)), 2),
        "forecast_max": round(float(np.max(forecast_array)), 2),
        "forecast_std": round(float(np.std(forecast_array)), 2),
        "peak_utilization": round((float(np.max(forecast_array)) / current_capacity) * 100, 2) if current_capacity > 0 else 0,
        "min_utilization": round((float(np.min(forecast_array)) / current_capacity) * 100, 2) if current_capacity > 0 else 0,
        "capacity_buffer": round(current_capacity - float(np.max(forecast_array)), 2),
        "days_analyzed": len(forecast_values)
    }
    
    return detailed_report


def calculate_optimal_capacity(forecast_values, target_utilization=70, buffer_percentage=10):
    """
    Calculate optimal capacity based on forecasted demand.
    
    Args:
        forecast_values (list): List of forecasted demand values
        target_utilization (float): Target utilization percentage (default: 70%)
        buffer_percentage (float): Additional buffer percentage for safety (default: 10%)
    
    Returns:
        dict: Optimal capacity recommendation
    """
    
    peak_demand = float(np.max(forecast_values))
    avg_demand = float(np.mean(forecast_values))
    
    # Calculate capacity needed for target utilization
    capacity_for_peak = peak_demand / (target_utilization / 100)
    
    # Add buffer for safety
    optimal_capacity = capacity_for_peak * (1 + buffer_percentage / 100)
    
    return {
        "optimal_capacity": round(optimal_capacity, 2),
        "peak_demand": round(peak_demand, 2),
        "avg_demand": round(avg_demand, 2),
        "target_utilization": target_utilization,
        "buffer_percentage": buffer_percentage,
        "reasoning": f"Optimal capacity calculated to maintain {target_utilization}% utilization at peak with {buffer_percentage}% safety buffer"
    }


def optimization_suggestor(forecast_values, current_capacity, region="unknown"):
    next_cycle_utilization = (float(forecast_values[0]) / current_capacity) * 100 if current_capacity > 0 and len(forecast_values) > 0 else 0
    if next_cycle_utilization >= 85:
        action = "increase"
        percentage = 12
        load_level = "High Load"
        message = f"Increase CPU capacity by +{percentage}%"
    elif next_cycle_utilization <= 40:
        action = "decrease"
        percentage = 10
        load_level = "Low Load"
        message = f"Reduce CPU capacity by -{percentage}%"
    else:
        action = "stable"
        percentage = 0
        load_level = "Normal"
        message = "Capacity is adequate"

    return {
        "region": region,
        "status": load_level,  # Frontend expects "status" field
        "recommendation": message,  # Frontend expects string recommendation
        "suggested_change": percentage,  # Frontend expects "suggested_change"
        "cpu_forecast_next_cycle_percent": round(next_cycle_utilization, 2),
        # Keep these for backward compatibility
        "load_level": load_level,
        "action": action,
        "percentage": percentage,
    }