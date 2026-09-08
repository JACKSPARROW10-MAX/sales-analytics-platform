"""
PDF Executive Report Generator
Generates a comprehensive executive PDF sales report querying live PostgreSQL star schema,
ML forecasts, detected anomalies, sales variance, and dynamic AI recommendations.
"""
import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import pandas as pd
from sqlalchemy import text

from etl.load_staging import get_db_connection
from api.utils.sql_helpers import get_variance_records
from ml.explainability import compute_feature_importance

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_sales_report_pdf(output_path: str = None) -> str:
    """
    Generate an executive PDF report querying the LIVE PostgreSQL database and latest ML results.
    """
    if output_path is None:
        output_path = str(Path(__file__).resolve().parent / "sales_executive_report.pdf")

    # 1. Fetch live metrics from PostgreSQL
    engine = get_db_connection()
    live_data = _fetch_live_database_data(engine)

    # 2. Fetch latest ML / AI recommendations
    ml_json_path = Path(__file__).resolve().parent.parent / "data" / "ml_results.json"
    ml_data = {}
    if ml_json_path.exists():
        try:
            with open(ml_json_path, "r", encoding="utf-8") as f:
                ml_data = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read ml_results.json: {e}")

    live_data["forecast"] = ml_data.get("forecast", {})
    live_data["anomalies"] = ml_data.get("anomalies", [])[:5]
    live_data["recommendations"] = ml_data.get("recommendations", [])[:4]
    live_data["explainability"] = ml_data.get("explainability", []) or compute_feature_importance()
    live_data["variance"] = get_variance_records(limit=5)
    live_data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if REPORTLAB_AVAILABLE:
        _generate_with_reportlab(output_path, live_data)
    elif FPDF_AVAILABLE:
        _generate_with_fpdf(output_path, live_data)
    else:
        _generate_html_fallback(output_path, live_data)

    logger.info(f"Generated dynamic PDF Executive Report at {output_path}")
    return output_path


def _fetch_live_database_data(engine) -> Dict[str, Any]:
    """Execute live SQL queries on fact_sales and dimension tables."""
    data = {
        "kpis": {},
        "date_range": "N/A",
        "top_products": [],
        "top_customers": [],
        "categories": [],
        "regions": [],
        "pricing": {}
    }
    try:
        with engine.begin() as conn:
            # Date range & aggregates
            agg = conn.execute(text("""
                SELECT 
                    MIN(dd.full_date) as start_date,
                    MAX(dd.full_date) as end_date,
                    COUNT(*) as total_orders,
                    SUM(fs.revenue) as total_revenue,
                    SUM(fs.quantity) as total_quantity,
                    AVG(fs.discount) as avg_discount,
                    AVG(fs.revenue) as aov
                FROM fact_sales fs
                JOIN dim_date dd ON fs.date_id = dd.date_id;
            """)).first()

            if agg and agg.total_orders:
                s_date = agg.start_date.strftime("%b %d, %Y") if agg.start_date else "N/A"
                e_date = agg.end_date.strftime("%b %d, %Y") if agg.end_date else "N/A"
                data["date_range"] = f"{s_date} — {e_date}"
                data["kpis"] = {
                    "total_revenue": float(agg.total_revenue or 0),
                    "total_orders": int(agg.total_orders or 0),
                    "total_quantity": int(agg.total_quantity or 0),
                    "avg_discount": float(agg.avg_discount or 0),
                    "aov": float(agg.aov or 0)
                }

            # Top Products
            prods = conn.execute(text("""
                SELECT 
                    dp.product_name,
                    dp.category,
                    SUM(fs.revenue) as revenue,
                    SUM(fs.quantity) as quantity
                FROM fact_sales fs
                JOIN dim_product dp ON fs.product_id = dp.product_id
                GROUP BY dp.product_name, dp.category
                ORDER BY revenue DESC
                LIMIT 5;
            """))
            data["top_products"] = [dict(r._mapping) for r in prods]

            # Top Customers
            custs = conn.execute(text("""
                SELECT 
                    dc.customer_name,
                    dc.region,
                    SUM(fs.revenue) as revenue,
                    COUNT(*) as orders
                FROM fact_sales fs
                JOIN dim_customer dc ON fs.customer_id = dc.customer_id
                GROUP BY dc.customer_name, dc.region
                ORDER BY revenue DESC
                LIMIT 5;
            """))
            data["top_customers"] = [dict(r._mapping) for r in custs]

            # Categories
            cats = conn.execute(text("""
                SELECT 
                    dp.category,
                    SUM(fs.revenue) as revenue,
                    COUNT(*) as orders,
                    AVG(fs.discount) as avg_discount
                FROM fact_sales fs
                JOIN dim_product dp ON fs.product_id = dp.product_id
                GROUP BY dp.category
                ORDER BY revenue DESC;
            """))
            data["categories"] = [dict(r._mapping) for r in cats]

            # Regions
            regs = conn.execute(text("""
                SELECT 
                    dc.region,
                    SUM(fs.revenue) as revenue,
                    COUNT(*) as orders
                FROM fact_sales fs
                JOIN dim_customer dc ON fs.customer_id = dc.customer_id
                GROUP BY dc.region
                ORDER BY revenue DESC;
            """))
            data["regions"] = [dict(r._mapping) for r in regs]

    except Exception as e:
        logger.error(f"Error querying live database for PDF: {e}")

    return data


def _generate_with_reportlab(output_path: str, data: Dict[str, Any]):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()

    # Palette
    c_primary = colors.HexColor('#051F20')
    c_dark = colors.HexColor('#0B2B26')
    c_deep = colors.HexColor('#163832')
    c_forest = colors.HexColor('#235347')
    c_sage = colors.HexColor('#8EB69B')
    c_mint = colors.HexColor('#DAF1DE')
    c_light_bg = colors.HexColor('#F4FAF5')

    # Typography styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=c_primary,
        fontName='Helvetica-Bold',
        spaceAfter=3
    )

    sub_style = ParagraphStyle(
        'SubStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=c_forest,
        fontName='Helvetica',
        spaceAfter=10
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=11,
        leading=14,
        textColor=c_dark,
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    bold_cell = ParagraphStyle(
        'BoldCell',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    header_cell = ParagraphStyle(
        'HeaderCell',
        parent=body_style,
        textColor=c_mint,
        fontName='Helvetica-Bold'
    )

    # 1. Header Banner
    story.append(Paragraph("SALES ANALYTICS PLATFORM — EXECUTIVE BI REPORT", title_style))
    story.append(Paragraph(
        f"<b>Generated:</b> {data['timestamp']} &nbsp;|&nbsp; <b>Data Period:</b> {data['date_range']} &nbsp;|&nbsp; <b>Source:</b> PostgreSQL Star Schema",
        sub_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_forest, spaceAfter=8))

    # 2. Executive KPIs Table
    kpis = data.get("kpis", {})
    tot_rev = f"₹{kpis.get('total_revenue', 0):,.0f}"
    tot_orders = f"{kpis.get('total_orders', 0):,}"
    tot_qty = f"{kpis.get('total_quantity', 0):,}"
    aov = f"₹{kpis.get('aov', 0):,.0f}"
    avg_disc = f"{kpis.get('avg_discount', 0)*100:.1f}%"

    kpi_table_data = [
        [
            Paragraph("<b>Total Revenue</b>", bold_cell),
            Paragraph("<b>Total Orders</b>", bold_cell),
            Paragraph("<b>Total Volume</b>", bold_cell),
            Paragraph("<b>Avg Order Value</b>", bold_cell),
            Paragraph("<b>Avg Discount</b>", bold_cell)
        ],
        [tot_rev, tot_orders, tot_qty, aov, avg_disc]
    ]
    kpi_tab = Table(kpi_table_data, colWidths=[108]*5)
    kpi_tab.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_light_bg),
        ('TEXTCOLOR', (0,1), (-1,1), c_deep),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,1), 11),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, c_sage),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(kpi_tab)
    story.append(Spacer(1, 10))

    # 3. Top Products
    story.append(Paragraph("Top Products Performance", h2_style))
    prod_rows = [[Paragraph("Product", header_cell), Paragraph("Category", header_cell), Paragraph("Revenue", header_cell)]]
    for p in data.get("top_products", [])[:4]:
        prod_rows.append([
            Paragraph(str(p.get("product_name")), body_style),
            Paragraph(str(p.get("category")), body_style),
            f"₹{float(p.get('revenue', 0)):,.0f}"
        ])
    prod_table = Table(prod_rows, colWidths=[260, 150, 130])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_deep),
        ('GRID', (0,0), (-1,-1), 0.5, c_sage),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(prod_table)
    story.append(Spacer(1, 8))

    # 4. Top Customers
    story.append(Paragraph("Top Enterprise Customers", h2_style))
    cust_rows = [[Paragraph("Customer", header_cell), Paragraph("Region", header_cell), Paragraph("Revenue", header_cell)]]
    for c in data.get("top_customers", [])[:4]:
        cust_rows.append([
            Paragraph(str(c.get("customer_name")), body_style),
            Paragraph(str(c.get("region")), body_style),
            f"₹{float(c.get('revenue', 0)):,.0f}"
        ])
    cust_table = Table(cust_rows, colWidths=[260, 150, 130])
    cust_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_deep),
        ('GRID', (0,0), (-1,-1), 0.5, c_sage),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(cust_table)
    story.append(Spacer(1, 8))

    # 5. Detected Anomalies
    story.append(Paragraph("Recent Statistical Anomalies (Audit & Risk)", h2_style))
    anom_rows = [[
        Paragraph("Sale ID", header_cell),
        Paragraph("Product", header_cell),
        Paragraph("Actual", header_cell),
        Paragraph("Variance", header_cell),
        Paragraph("Primary Factor", header_cell)
    ]]
    for a in data.get("anomalies", [])[:4]:
        anom_rows.append([
            Paragraph(str(a.get("id") or a.get("sale_id", "N/A"))[:15], body_style),
            Paragraph(str(a.get("product", "N/A")), body_style),
            f"₹{float(a.get('actual_value', 0)):,.0f}",
            str(a.get("variance", "0%")),
            Paragraph(str(a.get("root_cause", {}).get("primary_factor", "Outlier")), body_style)
        ])
    anom_table = Table(anom_rows, colWidths=[100, 130, 80, 70, 160])
    anom_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_forest),
        ('GRID', (0,0), (-1,-1), 0.5, c_sage),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(anom_table)
    story.append(Spacer(1, 8))

    # 6. Dynamic AI Recommendations
    story.append(Paragraph("Dynamic AI Recommendations & Prescriptive Strategy", h2_style))
    for r in data.get("recommendations", [])[:3]:
        story.append(Paragraph(
            f"<b>{r.get('title')}</b> &nbsp;[<i>{r.get('category')} — {r.get('urgency')} Urgency</i>] &nbsp; <b>Impact:</b> {r.get('impact')}",
            bold_cell
        ))
        story.append(Paragraph(f"{r.get('summary')}", body_style))
        story.append(Spacer(1, 3))

    doc.build(story)


def _generate_with_fpdf(output_path: str, data: Dict[str, Any]):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Sales Analytics Platform - Executive Report", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Generated: {data['timestamp']} | Range: {data['date_range']}", ln=True)
    pdf.ln(5)
    kpis = data.get("kpis", {})
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, f"Total Revenue: Rs. {kpis.get('total_revenue', 0):,.0f} | Orders: {kpis.get('total_orders', 0):,}", ln=True)
    pdf.output(output_path)


def _generate_html_fallback(output_path: str, data: Dict[str, Any]):
    html_path = output_path.replace(".pdf", ".html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(f"<html><body><h1>Sales Report</h1><p>Revenue: {data.get('kpis', {}).get('total_revenue')}</p></body></html>")
