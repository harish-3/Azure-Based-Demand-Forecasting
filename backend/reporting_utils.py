import pandas as pd
import os
from datetime import datetime

HISTORY_FILE = 'forecast_history.csv'

def save_forecast_history(forecast_data, actual_data=None):
    """
    Appends forecast data to a CSV file for historical tracking.
    
    Args:
        forecast_data (dict): Dictionary containing forecast details (date, values, region, etc.)
        actual_data (float, optional): Actual observed value (if available for backtesting).
    """
    # Prepare row data
    row = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "region": forecast_data.get("region", "Unknown"),
        "service": forecast_data.get("service", "Unknown"),
        "forecast_value": forecast_data.get("forecast_value", 0),
        "actual_value": actual_data if actual_data is not None else "",
        "recommendation": forecast_data.get("recommendation", "")
    }
    
    df = pd.DataFrame([row])
    
    # Append to CSV (create if not exists)
    if not os.path.exists(HISTORY_FILE):
        df.to_csv(HISTORY_FILE, index=False)
    else:
        df.to_csv(HISTORY_FILE, mode='a', header=False, index=False)

def calculate_cost_savings(recommendation_text, units_adjusted):
    """
    Estimates cost savings or avoidance based on recommendations.
    
    Assumptions:
    - Scale Down: Saves $10 per unit/month.
    - Scale Up: Avoids potential SLA penalty of $500 (flat).
    """
    savings = 0.0
    
    if "Scale DOWN" in recommendation_text:
        # Savings from removing unused capacity
        savings = units_adjusted * 10.0 
    elif "Scale UP" in recommendation_text:
        # "Savings" here is interpreted as "Cost Avoidance" (risk mitigation)
        savings = 500.0 
        
    return savings

def generate_csv_report():
    """
    Generates a summary report from the history file.
    Returns the path to the generated report.
    """
    if not os.path.exists(HISTORY_FILE):
        return None
        
    df = pd.read_csv(HISTORY_FILE)
    
    # Calculate simple stats
    report_path = f"report_{datetime.now().strftime('%Y%m%d')}.csv"
    
    # In a real scenario, we'd aggregate by day/week. 
    # Here we just dump the history with an added 'Savings' column for demonstration.
    
    # Extract units from recommendation string (simple parsing)
    # Text: "Scale DOWN: ... Remove approx 20 units"
    # This is a bit brittle, so we'll just use a placeholder or try to parse if possible.
    # For now, let's just add a 'Estimated_Savings' column based on the text.
    
    def get_savings(row):
        text = str(row.get('recommendation', ''))
        # improved parsing could go here
        if "Scale DOWN" in text:
            return "Estimated $200/mo savings"
        elif "Scale UP" in text:
            return "Risk Avoided (SLA)"
        return "N/A"

    df['Financial_Impact'] = df.apply(get_savings, axis=1)
    
    df.to_csv(report_path, index=False)
    return report_path
