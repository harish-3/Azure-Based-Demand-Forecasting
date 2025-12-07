import schedule
import time
import threading
from reporting_utils import generate_csv_report

def run_daily_report():
    print("⏰ Running daily report generation...")
    report_path = generate_csv_report()
    if report_path:
        print(f"✅ Report generated: {report_path}")
    else:
        print("⚠ No history data found to generate report.")

def start_scheduler():
    """
    Starts the scheduler in a separate thread.
    """
    # Schedule the job every day at 00:00 (or every minute for demo)
    # schedule.every().day.at("00:00").do(run_daily_report)
    
    # For demonstration purposes, run every 5 minutes
    schedule.every(5).minutes.do(run_daily_report)
    
    print("⏳ Scheduler started. Running reports every 5 minutes...")
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    # If run directly
    start_scheduler()
