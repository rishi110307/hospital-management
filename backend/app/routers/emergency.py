from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import EmergencyCaseCreate, EmergencyCaseUpdate

router = APIRouter(prefix="/api/emergency", tags=["Emergency Management"])

@router.get("/cases")
def list_emergency_cases(priority: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT ec.*, 
                   d.full_name as doctor_name, d.specialization,
                   b.bed_number, w.name as ward_name
            FROM emergency_cases ec
            LEFT JOIN doctors d ON ec.assigned_doctor_id = d.id
            LEFT JOIN beds b ON ec.assigned_bed_id = b.id
            LEFT JOIN wards w ON b.ward_id = w.id
            WHERE 1=1
        """
        params = []
        if priority:
            query += " AND ec.triage_priority = ?"
            params.append(priority)
        if status:
            query += " AND ec.status = ?"
            params.append(status)

        query += " ORDER BY CASE ec.triage_priority WHEN 'Critical' THEN 1 WHEN 'Urgent' THEN 2 ELSE 3 END, ec.id DESC"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]

@router.post("/cases")
def create_emergency_case(req: EmergencyCaseCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO emergency_cases (patient_name, age, gender, triage_priority, emergency_type, assigned_doctor_id, assigned_bed_id, blood_group, emergency_contact, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Under Treatment', ?)
        """, (req.patient_name, req.age, req.gender, req.triage_priority, req.emergency_type, req.assigned_doctor_id, req.assigned_bed_id, req.blood_group, req.emergency_contact, req.notes))
        case_id = cursor.lastrowid

        # If bed allocated, mark occupied
        if req.assigned_bed_id:
            cursor.execute("UPDATE beds SET status = 'Occupied' WHERE id = ?", (req.assigned_bed_id,))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Registered Emergency Case", f"ER Case #{case_id}", f"Priority: {req.triage_priority}, Patient: {req.patient_name}")

        return {"message": "Emergency case registered with priority triage", "case_id": case_id}

@router.put("/cases/{case_id}")
def update_emergency_case(case_id: int, req: EmergencyCaseUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE emergency_cases
            SET triage_priority = COALESCE(?, triage_priority),
                assigned_doctor_id = COALESCE(?, assigned_doctor_id),
                assigned_bed_id = COALESCE(?, assigned_bed_id),
                status = COALESCE(?, status),
                notes = COALESCE(?, notes)
            WHERE id = ?
        """, (req.triage_priority, req.assigned_doctor_id, req.assigned_bed_id, req.status, req.notes, case_id))
        
        # If discharged, free bed
        if req.status in ["Discharged", "Deceased"]:
            cursor.execute("SELECT assigned_bed_id FROM emergency_cases WHERE id = ?", (case_id,))
            er = cursor.fetchone()
            if er and er["assigned_bed_id"]:
                cursor.execute("UPDATE beds SET status = 'Available', current_patient_id = NULL WHERE id = ?", (er["assigned_bed_id"],))

        return {"message": "Emergency case updated successfully"}
