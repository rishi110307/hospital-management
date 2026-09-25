from fastapi import APIRouter, Query
from typing import Optional
from ..database import get_db

router = APIRouter(prefix="/api/resources", tags=["Hospital Resource Finder"])

@router.get("/search")
def search_hospital_resources(q: Optional[str] = Query("")):
    query = (q or "").lower().strip()
    results = []

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Search Beds / Rooms
        if not query or any(w in query for w in ["bed", "room", "icu", "ward", "ccu", "emergency", "available"]):
            cursor.execute("""
                SELECT b.id, b.bed_number, b.status, b.daily_rate, w.name as ward_name, w.ward_type, w.floor
                FROM beds b
                JOIN wards w ON b.ward_id = w.id
                WHERE b.status = 'Available'
                ORDER BY w.id, b.bed_number
            """)
            for b in cursor.fetchall():
                # Filter if query is specific e.g. "icu"
                if "icu" in query and b["ward_type"] != "ICU":
                    continue
                if "emergency" in query and b["ward_type"] != "Emergency":
                    continue
                if "private" in query and b["ward_type"] != "Private":
                    continue

                results.append({
                    "category": "Bed / Room",
                    "title": f"Bed {b['bed_number']} – {b['ward_name']}",
                    "subtitle": f"{b['floor']} • Daily Rate: ${b['daily_rate']:.2f}",
                    "status": "Available",
                    "badge_color": "emerald",
                    "type": b["ward_type"],
                    "action": "Allocate Bed"
                })

        # 2. Search Available Doctors
        if not query or any(w in query for w in ["doctor", "physician", "specialist", "dr", "cardiology", "neurology"]):
            cursor.execute("""
                SELECT d.*, dept.name as dept_name, dept.floor
                FROM doctors d
                LEFT JOIN departments dept ON d.department_id = dept.id
                WHERE d.available_status = 'Available'
            """)
            for d in cursor.fetchall():
                results.append({
                    "category": "Physician On Duty",
                    "title": f"{d['full_name']} ({d['specialization']})",
                    "subtitle": f"{d['dept_name']} • {d['room_number'] or d['floor']} • Fee: ${d['consultation_fee']:.2f}",
                    "status": "Available",
                    "badge_color": "blue",
                    "type": "Doctor",
                    "action": "Book Slot"
                })

        # 3. Search Blood Bank
        if not query or any(w in query for w in ["blood", "bank", "plasma", "+", "-", "o+", "o-", "a+", "b+"]):
            cursor.execute("SELECT * FROM blood_inventory WHERE units_available > 0")
            for bg in cursor.fetchall():
                if query in ["o+", "o-", "a+", "a-", "b+", "b-", "ab+", "ab-"] and bg["blood_group"].lower() != query:
                    continue
                results.append({
                    "category": "Blood Bank Units",
                    "title": f"Blood Group {bg['blood_group']} ({bg['units_available']} Units Available)",
                    "subtitle": f"Location: Basement 1 Blood Storage • Buffer: Min {bg['min_units']} Units",
                    "status": "In Stock" if bg["units_available"] >= bg["min_units"] else "Low Stock",
                    "badge_color": "rose" if bg["units_available"] < bg["min_units"] else "emerald",
                    "type": "Blood",
                    "action": "Request Unit"
                })

        # 4. Search Diagnostic Tests
        if not query or any(w in query for w in ["lab", "test", "cbc", "lipid", "x-ray", "xray", "lft", "scan"]):
            cursor.execute("SELECT * FROM lab_tests")
            for lt in cursor.fetchall():
                if query and query not in lt["test_name"].lower() and query not in lt["category"].lower():
                    continue
                results.append({
                    "category": "Laboratory & Diagnostic",
                    "title": lt["test_name"],
                    "subtitle": f"Category: {lt['category']} • Turnaround: ~{lt['turnaround_hours']}h • Fee: ${lt['price']:.2f}",
                    "status": "Operating",
                    "badge_color": "teal",
                    "type": "Lab",
                    "action": "Order Test"
                })

    return results
