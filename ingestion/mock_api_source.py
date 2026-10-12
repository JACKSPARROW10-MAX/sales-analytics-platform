import os
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def fetch_external_features(output_path="data/sample/external_feature.csv"):
    """
    Fetches external macroeconomic or weather feature from a free public API 
    (Open-Meteo daily temperature or Exchange Rate API) to enhance sales analysis.
    Falls back to robust synthetic feature generation if API is unreachable.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    start_date = "2025-01-01"
    end_date = "2025-12-31"
    
    # Try calling Open-Meteo free public weather API (New York coordinates)
    api_url = f"https://archive-api.open-meteo.com/v1/archive?latitude=40.7128&longitude=-74.0060&start_date={start_date}&end_date={end_date}&daily=temperature_2m_mean&timezone=America%2FNew_York"

    records = []
    fetched_from_api = False

    try:
        print("Attempting to fetch external feature data from Open-Meteo API...")
        response = requests.get(api_url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            daily_data = data.get("daily", {})
            dates = daily_data.get("time", [])
            temps = daily_data.get("temperature_2m_mean", [])
            
            for d, t in zip(dates, temps):
                records.append({
                    "date": d,
                    "feature_name": "daily_avg_temp_celsius",
                    "value": round(t, 2) if t is not None else 15.0,
                    "unit": "Celsius",
                    "source_api": "Open-Meteo"
                })
            fetched_from_api = True
            print("Successfully fetched live external weather data from Open-Meteo API!")
    except Exception as e:
        print(f"Network call to public API failed or timed out ({e}). Falling back to synthetic feature generation...")

    if not fetched_from_api or len(records) == 0:
        # Fallback synthetic generation for 365 days of 2025 (USD/EUR Exchange Rate & Temperature)
        records = []
        date_list = [datetime(2025, 1, 1) + timedelta(days=i) for i in range(365)]
        base_rate = 0.92
        np.random.seed(42)

        for i, dt in enumerate(date_list):
            # Synthetic exchange rate with minor random walk
            rate_noise = np.sin(i / 30.0) * 0.03 + np.random.normal(0, 0.005)
            exchange_rate = round(base_rate + rate_noise, 4)

            # Seasonal temperature simulation in Celsius
            day_of_year = dt.timetuple().tm_yday
            temp = round(15.0 + 12.0 * np.sin((day_of_year - 105) * 2 * np.pi / 365) + np.random.normal(0, 2), 1)  # noqa: F841 (draw kept so seeded output is unchanged)

            records.append({
                "date": dt.strftime("%Y-%m-%d"),
                "feature_name": "usd_eur_exchange_rate",
                "value": exchange_rate,
                "unit": "EUR per USD",
                "source_api": "ExchangeRate-Synthetic"
            })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Saved external feature dataset with {len(df)} rows to '{output_path}'.")
    return df

if __name__ == "__main__":
    fetch_external_features()
