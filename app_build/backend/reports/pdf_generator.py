"""
FairLens AI — PDF Report Generator
Generates downloadable PDF audit reports using ReportLab.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# Brand colors
PRIMARY = HexColor("#6366F1")
ACCENT = HexColor("#10B981")
DANGER = HexColor("#EF4444")
WARNING = HexColor("#F59E0B")
DARK = HexColor("#0F172A")
GRAY = HexColor("#64748B")
WHITE = HexColor("#FFFFFF")
LIGHT_BG = HexColor("#F1F5F9")


def generate_audit_report(
    dataset_name: str,
    target_column: str,
    bias_results: dict,
    gemini_summary: str = "",
    gemini_mitigation: str = "",
) -> bytes:
    """
    Generate a comprehensive PDF audit report.
    Returns the PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=60,
        leftMargin=60,
        topMargin=50,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=PRIMARY,
        spaceAfter=5,
    )

    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=GRAY,
        spaceAfter=20,
    )

    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=DARK,
        spaceBefore=15,
        spaceAfter=8,
    )

    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontSize=10,
        textColor=DARK,
        spaceAfter=6,
        leading=14,
    )

    elements = []

    # Header
    elements.append(Paragraph("FairLens AI", title_style))
    elements.append(Paragraph("AI Fairness Audit Report", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=PRIMARY))
    elements.append(Spacer(1, 15))

    # Report metadata
    meta_data = [
        ["Report Date", datetime.now().strftime("%B %d, %Y at %H:%M")],
        ["Dataset", dataset_name],
        ["Target Variable", target_column],
        ["Overall Bias Level", bias_results.get("overallBiasLevel", "N/A").upper()],
    ]
    meta_table = Table(meta_data, colWidths=[2 * inch, 4 * inch])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GRAY),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    # Overall Statistics
    elements.append(Paragraph("1. Overall Statistics", heading_style))
    stats = bias_results.get("overallStats", {})
    stats_data = [
        ["Metric", "Value"],
        ["Total Samples", str(stats.get("totalSamples", "N/A"))],
        ["Positive Rate (Actual)", f"{stats.get('positiveRate', 0) * 100:.1f}%"],
        ["Positive Rate (Predicted)", f"{stats.get('predictedPositiveRate', 0) * 100:.1f}%"],
        ["Bias Score", f"{bias_results.get('overallBiasScore', 0) * 100:.0f}%"],
    ]
    stats_table = Table(stats_data, colWidths=[3 * inch, 3 * inch])
    stats_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    elements.append(stats_table)
    elements.append(Spacer(1, 15))

    # Bias Metrics per Sensitive Attribute
    elements.append(Paragraph("2. Bias Metrics by Sensitive Attribute", heading_style))

    metrics = bias_results.get("metrics", {})
    for attr, data in metrics.items():
        elements.append(Paragraph(f"<b>{attr}</b> — Severity: {data.get('severity', 'N/A').upper()}", body_style))

        metric_rows = [["Metric", "Value", "Status"]]

        dp = data.get("demographicParity", {})
        dp_val = dp.get("value", 0)
        metric_rows.append([
            "Demographic Parity Diff",
            f"{dp_val:.4f}",
            "⚠ Biased" if dp_val > 0.1 else "✓ Fair",
        ])

        eo = data.get("equalOpportunity", {})
        eo_val = eo.get("value", 0)
        metric_rows.append([
            "Equal Opportunity Diff",
            f"{eo_val:.4f}",
            "⚠ Biased" if eo_val > 0.1 else "✓ Fair",
        ])

        di = data.get("disparateImpact", {})
        di_val = di.get("value", 1)
        metric_rows.append([
            "Disparate Impact Ratio",
            f"{di_val:.4f}",
            "⚠ Fails 80% rule" if di_val < 0.8 else "✓ Passes",
        ])

        sp = data.get("statisticalParity", {})
        sp_val = sp.get("value", 0)
        metric_rows.append([
            "Statistical Parity Diff",
            f"{sp_val:.4f}",
            "⚠ Biased" if sp_val > 0.1 else "✓ Fair",
        ])

        m_table = Table(metric_rows, colWidths=[2.5 * inch, 1.5 * inch, 2 * inch])
        m_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ]))
        elements.append(m_table)

        # Group breakdown
        breakdown = data.get("groupBreakdown", [])
        if breakdown:
            gb_rows = [["Group", "Count", "Actual Rate", "Predicted Rate"]]
            for g in breakdown:
                gb_rows.append([
                    g["group"],
                    str(g["count"]),
                    f"{g['actualPositiveRate'] * 100:.1f}%",
                    f"{g['predictedPositiveRate'] * 100:.1f}%",
                ])
            gb_table = Table(gb_rows, colWidths=[1.5 * inch, 1 * inch, 1.75 * inch, 1.75 * inch])
            gb_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
            ]))
            elements.append(Spacer(1, 5))
            elements.append(gb_table)

        elements.append(Spacer(1, 15))

    # AI-Generated Summary
    if gemini_summary:
        elements.append(Paragraph("3. AI-Generated Analysis", heading_style))
        # Clean markdown formatting for PDF
        clean_summary = gemini_summary.replace("**", "").replace("##", "").replace("#", "")
        for line in clean_summary.split("\n"):
            line = line.strip()
            if line:
                elements.append(Paragraph(line, body_style))

    # Mitigation Recommendations
    if gemini_mitigation:
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("4. Mitigation Recommendations", heading_style))
        clean_mitigation = gemini_mitigation.replace("**", "").replace("##", "").replace("#", "")
        for line in clean_mitigation.split("\n"):
            line = line.strip()
            if line:
                elements.append(Paragraph(line, body_style))

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=1, color=GRAY))
    elements.append(Spacer(1, 5))
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=GRAY, alignment=TA_CENTER)
    elements.append(Paragraph(
        f"Generated by FairLens AI — {datetime.now().strftime('%Y-%m-%d %H:%M UTC')} — Confidential",
        footer_style,
    ))

    doc.build(elements)
    return buffer.getvalue()
