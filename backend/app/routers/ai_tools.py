import re
from fastapi import APIRouter, HTTPException
from ..schemas import AISummarizeRequest, ChatMessageRequest

router = APIRouter(prefix="/api/ai", tags=["AI Clinical Tools"])

# Known lab markers reference dataset for intelligent rule-based parsing & normalization
LAB_REFERENCE_RANGES = {
    "hemoglobin": {"min": 13.0, "max": 17.5, "unit": "g/dL", "name": "Hemoglobin", "meaning": "Oxygen-carrying protein in red blood cells. Low indicates anemia; high may indicate dehydration or erythrocytosis."},
    "hb": {"min": 13.0, "max": 17.5, "unit": "g/dL", "name": "Hemoglobin", "meaning": "Oxygen-carrying protein in red blood cells."},
    "wbc": {"min": 4000, "max": 11000, "unit": "cells/µL", "name": "White Blood Cells (WBC)", "meaning": "Immune defense cells. Elevated levels often signify infection or inflammation; low levels suggest reduced immunity."},
    "white blood count": {"min": 4000, "max": 11000, "unit": "cells/µL", "name": "White Blood Cells (WBC)", "meaning": "Immune defense cells."},
    "platelets": {"min": 150000, "max": 450000, "unit": "/µL", "name": "Platelets", "meaning": "Essential for blood clotting. Low levels (thrombocytopenia) increase bleeding risk."},
    "glucose": {"min": 70, "max": 99, "unit": "mg/dL", "name": "Fasting Blood Glucose", "meaning": "Blood sugar concentration. Levels 100-125 suggest prediabetes; >=126 indicates diabetes."},
    "fbs": {"min": 70, "max": 99, "unit": "mg/dL", "name": "Fasting Blood Glucose", "meaning": "Blood sugar concentration."},
    "cholesterol": {"min": 125, "max": 200, "unit": "mg/dL", "name": "Total Cholesterol", "meaning": "Total circulating blood fats. Higher levels indicate increased cardiovascular risk."},
    "ldl": {"min": 50, "max": 100, "unit": "mg/dL", "name": "LDL (Bad) Cholesterol", "meaning": "Lipoprotein linked to artery plaque buildup. Lower values are healthier."},
    "hdl": {"min": 40, "max": 60, "unit": "mg/dL", "name": "HDL (Good) Cholesterol", "meaning": "Protective cholesterol clearing arteries. Higher is desirable."},
    "triglycerides": {"min": 50, "max": 150, "unit": "mg/dL", "name": "Triglycerides", "meaning": "Common blood fat. Elevated by excess sugars and sedentary lifestyle."},
    "creatinine": {"min": 0.7, "max": 1.3, "unit": "mg/dL", "name": "Serum Creatinine", "meaning": "Kidney filtration waste product. High values can indicate reduced kidney clearance."},
    "bun": {"min": 7, "max": 20, "unit": "mg/dL", "name": "Blood Urea Nitrogen (BUN)", "meaning": "Waste product excreted by kidneys."},
    "alt": {"min": 7, "max": 56, "unit": "U/L", "name": "ALT (Alanine Aminotransferase)", "meaning": "Liver enzyme. Elevated levels suggest hepatic stress or inflammation."},
    "ast": {"min": 10, "max": 40, "unit": "U/L", "name": "AST (Aspartate Aminotransferase)", "meaning": "Enzyme present in liver and heart tissues."},
    "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "name": "Glycated Hemoglobin (HbA1c)", "meaning": "3-month average blood glucose control marker."}
}

@router.post("/summarize-report")
def summarize_medical_report(req: AISummarizeRequest):
    text = req.raw_text
    extracted_parameters = []
    abnormal_count = 0
    normal_count = 0

    # Parse lines looking for parameter and numbers
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines:
        for key, ref in LAB_REFERENCE_RANGES.items():
            pattern = re.compile(rf"\b{re.escape(key)}\b\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)", re.IGNORECASE)
            match = pattern.search(line)
            if match:
                val = float(match.group(1))
                # Check status
                if val < ref["min"]:
                    status = "Low"
                    badge_color = "amber"
                    abnormal_count += 1
                elif val > ref["max"]:
                    status = "High"
                    badge_color = "red"
                    abnormal_count += 1
                else:
                    status = "Normal"
                    badge_color = "emerald"
                    normal_count += 1

                extracted_parameters.append({
                    "test": ref["name"],
                    "value": val,
                    "unit": ref["unit"],
                    "reference_interval": f"{ref['min']} - {ref['max']} {ref['unit']}",
                    "status": status,
                    "badge_color": badge_color,
                    "meaning": ref["meaning"]
                })
                break

    # If no structured numbers matched, parse generic summary
    if not extracted_parameters:
        extracted_parameters.append({
            "test": "Clinical Observation",
            "value": "Report text provided",
            "unit": "",
            "reference_interval": "Qualitative evaluation",
            "status": "Review Needed",
            "badge_color": "blue",
            "meaning": "General clinical text parsed."
        })

    # Generate layman explanation
    findings = []
    for item in extracted_parameters:
        if item["status"] == "High":
            findings.append(f"• **{item['test']}** is elevated ({item['value']} {item['unit']}). {item['meaning']}")
        elif item["status"] == "Low":
            findings.append(f"• **{item['test']}** is below reference range ({item['value']} {item['unit']}). {item['meaning']}")
        else:
            findings.append(f"• **{item['test']}** is in healthy balance ({item['value']} {item['unit']}).")

    summary_text = (
        f"**Summary of Findings:**\n"
        f"We analyzed {len(extracted_parameters)} key clinical marker(s). "
        f"{normal_count} within normal bounds, and {abnormal_count} outside standard thresholds.\n\n"
        + "\n".join(findings)
    )

    disclaimer = "This is an informational summary and not a medical diagnosis. Consult a qualified healthcare professional for medical interpretation."

    return {
        "title": req.report_title,
        "extracted_parameters": extracted_parameters,
        "summary": summary_text,
        "abnormal_count": abnormal_count,
        "normal_count": normal_count,
        "disclaimer": disclaimer
    }

# Hospital Knowledge Base for Chatbot
HOSPITAL_KB = {
    "hours": "SmartCare Hospital operating hours:\n• Emergency & Trauma Center: Open 24 Hours, 7 Days a week\n• Outpatient Clinics (OPD): Monday to Saturday, 8:00 AM – 8:00 PM\n• Diagnostic Laboratory: 24/7 for inpatient & ER; OPD samples 7:00 AM – 9:00 PM\n• Central Pharmacy: Open 24/7 on Ground Floor.",
    "doctor": "We have world-class board-certified specialists in Cardiology (Dr. Marcus Brody), Neurology (Dr. Sarah Lin), Orthopedics (Dr. Jonathan Davis), Pediatrics (Dr. Emily Taylor), and Emergency Trauma (Dr. Alexander Wright). You can view their full schedules and book an instant appointment in the **Appointments** tab.",
    "appointment": "To book an appointment:\n1. Navigate to the **Appointments** tab in the sidebar.\n2. Select your required department or doctor.\n3. Choose your preferred date and time slot.\n4. Click 'Book Appointment'. You will instantly receive a digital queue token (e.g., A-24) and estimated consultation wait time!",
    "lab": "Accessing lab reports:\n• Patients can click **Laboratory Reports** in their personal portal or Patient Detail page to download finalized diagnostic PDF reports.\n• Routine blood results are processed within 12–24 hours.\n• Critical values are directly flagged to your attending physician.",
    "pharmacy": "Our Central Pharmacy is located on the Ground Floor (West Wing) and is open 24/7. When your doctor issues a digital prescription, it is instantly routed to the pharmacy for express dispensing.",
    "billing": "Billing & Payments:\n• We support all major Credit/Debit Cards, UPI, Cash, and Net Banking.\n• Our Billing Office is on Floor 1, Desk 3.\n• For Insurance Cashless pre-authorizations (BlueCross, UnitedHealthcare, Aetna, Cigna), visit the Insurance Desk with your policy ID.",
    "navigation": "Hospital Floor Guide:\n• Ground Floor: ER Bay, Ambulance Dock, Central Pharmacy, Triage, Registration\n• Floor 1: Outpatient Clinics (OPD), Billing & Cashier, General Medical Wards\n• Floor 2: Cardiology, Pediatrics, Cardiac Care Unit (CCU)\n• Floor 3: Neurology, Intensive Care Unit (ICU), Operating Suites\n• Floor 4: Deluxe Private Suites & Executive Wellness\n• Basement 1: Diagnostic Center, Pathology Labs, Blood Bank",
    "emergency": "For immediate medical emergencies, call our 24/7 Hotline: **+1-800-555-0911** or arrive directly at Ground Floor ER Bay. No prior appointment is required for emergency triage.",
    "visiting": "Visiting Hours:\n• General Wards: 4:00 PM – 7:00 PM daily (Maximum 2 visitors per patient)\n• ICU/CCU: 11:00 AM – 12:00 PM and 5:00 PM – 6:00 PM (1 immediate family member)"
}

@router.post("/chat")
def hospital_chatbot(req: ChatMessageRequest):
    q = req.message.lower()

    if any(w in q for w in ["hour", "timing", "open", "close", "time", "schedule"]):
        reply = HOSPITAL_KB["hours"]
    elif any(w in q for w in ["doctor", "specialist", "cardiologist", "neurologist", "surgeon"]):
        reply = HOSPITAL_KB["doctor"]
    elif any(w in q for w in ["book", "appointment", "token", "queue", "consult"]):
        reply = HOSPITAL_KB["appointment"]
    elif any(w in q for w in ["lab", "test", "report", "blood test", "cbc", "xray", "result"]):
        reply = HOSPITAL_KB["lab"]
    elif any(w in q for w in ["pharmacy", "medicine", "drug", "prescription", "dispense"]):
        reply = HOSPITAL_KB["pharmacy"]
    elif any(w in q for w in ["bill", "payment", "cost", "invoice", "insurance", "claim"]):
        reply = HOSPITAL_KB["billing"]
    elif any(w in q for w in ["where", "floor", "locate", "room", "navigation", "find", "map"]):
        reply = HOSPITAL_KB["navigation"]
    elif any(w in q for w in ["emergency", "ambulance", "urgent", "trauma", "er"]):
        reply = HOSPITAL_KB["emergency"]
    elif any(w in q for w in ["visit", "visiting", "family", "guest"]):
        reply = HOSPITAL_KB["visiting"]
    else:
        reply = (
            "Hello! I am the SmartCare Hospital Information Assistant. I can assist you with:\n"
            "• Hospital timings & 24/7 Emergency\n"
            "• Doctor schedules & department locations\n"
            "• How to book appointments & track queue tokens\n"
            "• Accessing diagnostic lab reports\n"
            "• Pharmacy dispensing & insurance billing guidelines\n\n"
            "How may I help you today?"
        )

    disclaimer = "Note: SmartCare Chatbot provides administrative guidance and does not provide clinical diagnoses or prescribe medication."

    return {
        "reply": reply,
        "disclaimer": disclaimer
    }
