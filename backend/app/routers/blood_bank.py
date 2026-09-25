from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import BloodIssueRequest, BloodDonorCreate

router = APIRouter(prefix="/api/blood-bank", tags=["Blood Bank Management"])

@router.get("/inventory")
def get_inventory():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM blood_inventory ORDER BY blood_group ASC")
        return [dict(r) for r in cursor.fetchall()]

@router.get("/donors")
def list_donors():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM blood_donors ORDER BY id DESC")
        return [dict(r) for r in cursor.fetchall()]

@router.post("/donors")
def add_donor(req: BloodDonorCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        today_str = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
            INSERT INTO blood_donors (name, blood_group, phone, age, last_donated, units_donated, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Eligible')
        """, (req.name, req.blood_group, req.phone, req.age, today_str, req.units_donated))
        
        # Increment inventory
        cursor.execute("""
            UPDATE blood_inventory
            SET units_available = units_available + ?, last_updated = CURRENT_TIMESTAMP
            WHERE blood_group = ?
        """, (req.units_donated, req.blood_group))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Registered Blood Donor", f"Donor {req.name}", f"Donated {req.units_donated} unit(s) of {req.blood_group}")

        return {"message": "Donor registered and blood inventory incremented"}

@router.get("/requests")
def list_blood_requests():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT br.*, p.full_name as patient_name, p.patient_code
            FROM blood_requests br
            LEFT JOIN patients p ON br.patient_id = p.id
            ORDER BY CASE br.priority WHEN 'Emergency' THEN 1 ELSE 2 END, br.id DESC
        """)
        return [dict(r) for r in cursor.fetchall()]

@router.post("/issue")
def issue_blood(req: BloodIssueRequest, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check stock
        cursor.execute("SELECT units_available FROM blood_inventory WHERE blood_group = ?", (req.blood_group,))
        inv = cursor.fetchone()
        if not inv:
            raise HTTPException(status_code=404, detail="Blood group not found")
        if inv["units_available"] < req.units:
            raise HTTPException(status_code=400, detail=f"Insufficient units for blood group {req.blood_group}. Available: {inv['units_available']}, Requested: {req.units}")

        # Deduct
        cursor.execute("""
            UPDATE blood_inventory
            SET units_available = units_available - ?, last_updated = CURRENT_TIMESTAMP
            WHERE blood_group = ?
        """, (req.units, req.blood_group))

        # Record request
        cursor.execute("""
            INSERT INTO blood_requests (patient_id, blood_group, units_needed, priority, status, requested_by)
            VALUES (?, ?, ?, ?, 'Issued', ?)
        """, (req.patient_id, req.blood_group, req.units, req.priority, req.requested_by))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Issued Blood Units", f"Group {req.blood_group}", f"Issued {req.units} units for {req.requested_by}")

        return {"message": f"Successfully issued {req.units} units of {req.blood_group} blood"}
