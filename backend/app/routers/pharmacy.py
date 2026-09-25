import json
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import MedicineCreate, DispenseRequest

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy Management"])

@router.get("/medicines")
def list_medicines(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    low_stock_only: Optional[bool] = Query(False)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM medicines WHERE 1=1"
        params = []
        if search:
            query += " AND (name LIKE ? OR generic_name LIKE ? OR batch_number LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s])
        if category:
            query += " AND category = ?"
            params.append(category)
        if low_stock_only:
            query += " AND stock_quantity <= min_stock_level"

        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]

@router.post("/medicines")
def add_medicine(req: MedicineCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        status = "Low Stock" if req.stock_quantity <= req.min_stock_level else "In Stock"
        cursor.execute("""
            INSERT INTO medicines (name, generic_name, batch_number, manufacturer, expiry_date, stock_quantity, min_stock_level, unit_price, category, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (req.name, req.generic_name, req.batch_number, req.manufacturer, req.expiry_date, req.stock_quantity, req.min_stock_level, req.unit_price, req.category, status))
        med_id = cursor.lastrowid
        
        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Added Medicine", f"Med #{med_id}", f"Added {req.name}, Batch {req.batch_number}")
        return {"message": "Medicine added to inventory", "id": med_id}

@router.get("/expiry-dashboard")
def get_expiry_dashboard():
    with get_db() as conn:
        cursor = conn.cursor()
        today = datetime.now()
        d30 = (today + timedelta(days=30)).strftime("%Y-%m-%d")
        d60 = (today + timedelta(days=60)).strftime("%Y-%m-%d")
        d90 = (today + timedelta(days=90)).strftime("%Y-%m-%d")
        today_str = today.strftime("%Y-%m-%d")

        # Expired
        cursor.execute("SELECT * FROM medicines WHERE expiry_date < ?", (today_str,))
        expired = [dict(r) for r in cursor.fetchall()]

        # Expiring within 30 days
        cursor.execute("SELECT * FROM medicines WHERE expiry_date >= ? AND expiry_date <= ?", (today_str, d30))
        expiring_30 = [dict(r) for r in cursor.fetchall()]

        # Expiring within 60 days
        cursor.execute("SELECT * FROM medicines WHERE expiry_date > ? AND expiry_date <= ?", (d30, d60))
        expiring_60 = [dict(r) for r in cursor.fetchall()]

        # Expiring within 90 days
        cursor.execute("SELECT * FROM medicines WHERE expiry_date > ? AND expiry_date <= ?", (d60, d90))
        expiring_90 = [dict(r) for r in cursor.fetchall()]

        # Low stock items
        cursor.execute("SELECT * FROM medicines WHERE stock_quantity <= min_stock_level")
        low_stock = [dict(r) for r in cursor.fetchall()]

        return {
            "expired": expired,
            "expiring_30_days": expiring_30,
            "expiring_60_days": expiring_60,
            "expiring_90_days": expiring_90,
            "low_stock_items": low_stock,
            "total_at_risk": len(expired) + len(expiring_30) + len(expiring_60)
        }

@router.post("/dispense")
def dispense_medication(req: DispenseRequest, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify and deduct stock for each item
        for item in req.items:
            med_id = item.get("medicine_id")
            qty = item.get("quantity", 1)
            cursor.execute("SELECT stock_quantity, min_stock_level, name FROM medicines WHERE id = ?", (med_id,))
            med = cursor.fetchone()
            if not med:
                raise HTTPException(status_code=404, detail=f"Medicine ID {med_id} not found")
            if med["stock_quantity"] < qty:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {med['name']}. Available: {med['stock_quantity']}")
            
            new_qty = med["stock_quantity"] - qty
            new_status = "Out of Stock" if new_qty == 0 else ("Low Stock" if new_qty <= med["min_stock_level"] else "In Stock")
            cursor.execute("UPDATE medicines SET stock_quantity = ?, status = ? WHERE id = ?", (new_qty, new_status, med_id))

        # Record Pharmacy Transaction
        cursor.execute("""
            INSERT INTO pharmacy_transactions (prescription_id, patient_id, dispensed_by, total_amount, payment_status, items_json)
            VALUES (?, ?, ?, ?, 'Paid', ?)
        """, (req.prescription_id, req.patient_id, current_user["full_name"], req.total_amount, json.dumps(req.items)))

        # Update prescription status if linked
        if req.prescription_id:
            cursor.execute("UPDATE prescriptions SET status = 'Dispensed' WHERE id = ?", (req.prescription_id,))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Dispensed Medications", f"Patient #{req.patient_id}", f"Dispensed {len(req.items)} items, Total: ${req.total_amount:.2f}")

        return {"message": "Medications dispensed and inventory updated successfully"}
