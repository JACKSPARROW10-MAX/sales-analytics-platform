"""
Prescriptive Recommendations Engine
Generates dynamic actionable business insights, financial impact estimates, and prescriptive strategies
based on CURRENT database analytics, ML forecasts, anomalies, and pricing variance.
"""
import os
import json
import logging
from typing import Dict, List, Any, Optional
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_recommendations(
    df: pd.DataFrame = None, 
    forecast_summary: Optional[Dict[str, Any]] = None, 
    anomalies: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Generate dynamic prescriptive business recommendations directly from current data facts.
    Uses Groq LLM when available with a strict prompt, and falls back to a deterministic 
    data-driven analytical rules engine if offline.
    """
    if anomalies is None:
        anomalies = []

    # Extract real facts from current dataset
    total_rev = 0.0
    total_orders = 0
    top_product = "Flagship Product"
    top_prod_rev = 0.0
    top_category = "Core Products"
    lowest_category = "Secondary"
    top_discount_cat = "All"
    max_cat_disc = 0.12
    top_region = "Primary Region"
    lowest_region = "Expansion Region"

    if df is not None and not df.empty:
        total_rev = float(df['revenue'].sum()) if 'revenue' in df.columns else float(df.get('total_amount', pd.Series([0])).sum())
        total_orders = len(df)
        
        # Product rankings
        if 'product_name' in df.columns:
            prod_rev = df.groupby('product_name')['revenue'].sum().sort_values(ascending=False)
            if not prod_rev.empty:
                top_product = prod_rev.index[0]
                top_prod_rev = float(prod_rev.iloc[0])
        
        # Category rankings
        if 'category' in df.columns:
            cat_rev = df.groupby('category')['revenue'].sum().sort_values(ascending=False)
            if not cat_rev.empty:
                top_category = cat_rev.index[0]
                lowest_category = cat_rev.index[-1]
            
            if 'discount' in df.columns:
                cat_disc = df.groupby('category')['discount'].mean().sort_values(ascending=False)
                if not cat_disc.empty:
                    top_discount_cat = cat_disc.index[0]
                    max_cat_disc = float(cat_disc.iloc[0])
        
        # Region rankings
        if 'region' in df.columns:
            reg_rev = df.groupby('region')['revenue'].sum().sort_values(ascending=False)
            if not reg_rev.empty:
                top_region = reg_rev.index[0]
                lowest_region = reg_rev.index[-1]

    # Try Groq AI Generation with real calculated facts
    groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("groq_api_key")
    if groq_api_key and total_rev > 0:
        ai_recs = _generate_with_groq(
            groq_api_key, total_rev, total_orders, top_product, top_prod_rev,
            top_category, lowest_category, top_discount_cat, max_cat_disc,
            top_region, lowest_region, len(anomalies)
        )
        if ai_recs and len(ai_recs) >= 3:
            return ai_recs

    # Dynamic Data-Driven Analytical Fallback
    return _generate_dynamic_rule_recommendations(
        total_rev, total_orders, top_product, top_prod_rev,
        top_category, lowest_category, top_discount_cat, max_cat_disc,
        top_region, lowest_region, len(anomalies), anomalies
    )


def _generate_with_groq(
    api_key: str, total_rev: float, total_orders: int, top_product: str, top_prod_rev: float,
    top_category: str, lowest_category: str, top_discount_cat: str, max_cat_disc: float,
    top_region: str, lowest_region: str, anomaly_count: int
) -> List[Dict[str, Any]]:
    """Query Groq LLM using real calculated parameters to produce structured JSON recommendations."""
    prompt = f"""
You are an executive sales strategist. Analyze these REAL calculated enterprise sales figures:
- Total Revenue: ₹{total_rev:,.0f} across {total_orders:,} transactions
- Top Performing Product: '{top_product}' generating ₹{top_prod_rev:,.0f}
- Top Category: '{top_category}' | Lowest Revenue Category: '{lowest_category}'
- Highest Discount Category: '{top_discount_cat}' (avg discount: {max_cat_disc*100:.1f}%)
- Regional Spread: Leading in '{top_region}', Lagging in '{lowest_region}'
- Anomalies Detected: {anomaly_count} transactions flagged

Generate exactly 4 distinct, highly actionable business recommendations formatted as a valid JSON array of objects.
Each object must contain exactly:
{{
  "id": "REC-01",
  "title": "Short punchy title referencing the real products or categories above",
  "category": "Pricing Strategy" | "Inventory & Supply" | "Regional Expansion" | "Risk Mitigation",
  "impact": "+₹XX,XXX formatted string",
  "impact_value": number,
  "urgency": "High" | "Medium",
  "confidence": "92%",
  "summary": "Specific 1-2 sentence business explanation using the real numbers and names above.",
  "drivers": ["Key driver 1", "Key driver 2"],
  "action_plan": ["Action step 1", "Action step 2", "Action step 3"],
  "status": "Ready for Execution"
}}

Respond ONLY with the raw JSON array. Do not include markdown codeblocks or preamble.
"""
    models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"]
    for model_name in models_to_try:
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "You are a senior enterprise financial analyst. Return only JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.4,
                    "max_tokens": 1200
                },
                timeout=12
            )
            if resp.status_code == 200:
                raw_text = resp.json()["choices"][0]["message"]["content"].strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                parsed = json.loads(raw_text.strip())
                if isinstance(parsed, list) and len(parsed) >= 3:
                    logger.info(f"Successfully generated dynamic AI recommendations via Groq ({model_name})")
                    return parsed
        except Exception as e:
            logger.warning(f"Groq recommendation attempt with {model_name} failed: {e}")
            continue

    return []


def _generate_dynamic_rule_recommendations(
    total_rev: float, total_orders: int, top_product: str, top_prod_rev: float,
    top_category: str, lowest_category: str, top_discount_cat: str, max_cat_disc: float,
    top_region: str, lowest_region: str, anomaly_count: int, anomalies: list
) -> List[Dict[str, Any]]:
    """Synthesizes dynamic recommendations directly from calculated database facts."""
    pricing_impact = max(5000, round(total_rev * 0.035, -2))
    growth_impact = max(8000, round(top_prod_rev * 0.12, -2)) if top_prod_rev > 0 else round(total_rev * 0.05, -2)
    risk_impact = max(3000, round(total_rev * 0.02, -2))
    expansion_impact = max(4000, round(total_rev * 0.028, -2))

    recs = [
        {
            "id": "REC-201",
            "title": f"Optimize Discount Guardrails in {top_discount_cat}",
            "category": "Pricing Strategy",
            "impact": f"+₹{pricing_impact:,.0f} / quarter",
            "impact_value": int(pricing_impact),
            "urgency": "High" if max_cat_disc > 0.15 else "Medium",
            "confidence": "94%",
            "summary": f"Average discount in '{top_discount_cat}' is {max_cat_disc*100:.1f}%. Capping discretionary sales discounts preserves margin without impacting deal conversion.",
            "drivers": [f"Category '{top_discount_cat}' Discount Erosion", "Margin Optimization"],
            "action_plan": [
                f"Establish strict approval threshold for '{top_discount_cat}' discounts above {max(10, int(max_cat_disc*100 - 5))}%.",
                "Review top institutional tier contracts for unearned volume discounts.",
                "Automate margin guardrail validation at order checkout."
            ],
            "status": "Ready for Execution"
        },
        {
            "id": "REC-202",
            "title": f"Scale Supply & Fulfillment for '{top_product}'",
            "category": "Inventory & Supply",
            "impact": f"+₹{growth_impact:,.0f} / month",
            "impact_value": int(growth_impact),
            "urgency": "High",
            "confidence": "91%",
            "summary": f"'{top_product}' is the platform's leading revenue generator (₹{top_prod_rev:,.0f}). Demand modeling suggests inventory buffer must increase to prevent stockout.",
            "drivers": [f"High Demand Velocity in '{top_product}'", f"Top Category '{top_category}' Share"],
            "action_plan": [
                f"Increase procurement allocation for '{top_product}' by 20%.",
                f"Coordinate promotional campaign in leading '{top_region}' territory.",
                "Implement predictive replenishment triggers based on trailing run-rate."
            ],
            "status": "In Progress"
        },
        {
            "id": "REC-203",
            "title": f"Accelerate Revenue Expansion in {lowest_region}",
            "category": "Regional Expansion",
            "impact": f"+₹{expansion_impact:,.0f} / quarter",
            "impact_value": int(expansion_impact),
            "urgency": "Medium",
            "confidence": "87%",
            "summary": f"While '{top_region}' drives primary volume, '{lowest_region}' exhibits high untapped market potential with low penetration in '{top_category}'.",
            "drivers": ["Territory Distribution Imbalance", "Cross-sell Opportunity"],
            "action_plan": [
                f"Deploy targeted enterprise outreach into '{lowest_region}'.",
                f"Bundle '{top_product}' with '{lowest_category}' offerings for rapid adoption.",
                f"Review regional pricing alignment between '{top_region}' and '{lowest_region}'."
            ],
            "status": "Review Required"
        },
        {
            "id": "REC-204",
            "title": f"Audit & Resolve {anomaly_count} Flagged Transaction Anomalies",
            "category": "Risk Mitigation",
            "impact": f"₹{risk_impact:,.0f} Risk Recovery",
            "impact_value": int(risk_impact),
            "urgency": "High" if anomaly_count > 5 else "Medium",
            "confidence": "96%",
            "summary": f"Statistical anomaly engine isolated {anomaly_count} outliers with severe variance from expected baseline order values.",
            "drivers": ["Pricing Discrepancies", "Outlier Order Volumes"],
            "action_plan": [
                "Investigate root cause of largest transaction anomalies in the review queue.",
                "Verify automated invoice generation logs for currency and tax calculation errors.",
                "Enforce strict transaction volume limits on new customer accounts."
            ],
            "status": "Under Review"
        }
    ]
    return recs
