from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import AdmissionCreate, BedTransferRequest, DischargeRequest

router = APIRouter(prefix="/api/beds", tags=["Bed & Room Management"])

@router.get("/matrix")
def get_bed_matrix(ward_type: Optional[str] = Query(None)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch Wards
        w_query = "SELECT * FROM wards"
        w_params = []
        if ward_type:
            w_query += " WHERE ward_type = ?"
            w_params.append(ward_type)
        w_query += " ORDER BY id ASC"
        cursor.execute(w_query, w_params)
        wards = [dict(w) for w in cursor.fetchall()]

        # Attach beds to each ward
        for w in wards:
            cursor.execute("""
                SELECT b.*, 
                       p.full_name as patient_name, p.patient_code, p.age as patient_age, p.gender as patient_gender,
                       d.full_name as attending_doctor, adm.id as admission_id, adm.admission_date, adm.initial_diagnosis
                FROM beds b
                LEFT JOIN patients p ON b.current_patient_id = p.id
                LEFT JOIN admissions adm ON adm.bed_id = b.id AND adm.status = 'Admitted'
                LEFT JOIN doctors d ON adm.doctor_id = d.id
                WHERE b.ward_id = ?
                ORDER BY b.bed_number ASC
            """, (w["id"],))
            w["beds"] = [dict(b) for b in cursor.fetchall()]
            
            # Ward stats
            w["available_count"] = sum(1 for b in w["beds"] if b["status"] == "Available")
            w["occupied_count"] = sum(1 for b in w["beds"] if b["status"] == "Occupied")
            w["maintenance_count"] = sum(1 for b in w["beds"] if b["status"] == "Maintenance")
            w["reserved_count"] = sum(1 for b in w["beds"] if b["status"] == "Reserved")

        return wards

@router.post("/admit")
def admit_patient(req: AdmissionCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check bed availability
        cursor.execute("SELECT status, bed_number FROM beds WHERE id = ?", (req.bed_id,))
        bed = cursor.fetchone()
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        if bed["status"] != "Available":
            raise HTTPException(status_code=400, detail=f"Bed {bed['bed_number']} is currently {bed['status']}.")

        # Create admission
        cursor.execute("""
            INSERT INTO admissions (patient_id, bed_id, doctor_id, admission_date, initial_diagnosis, status)
            VALUES (?, ?, ?, ?, ?, 'Admitted')
        """, (req.patient_id, req.bed_id, req.doctor_id, req.admission_date, req.initial_diagnosis))
        adm_id = cursor.lastrowid

        # Update bed status
        cursor.execute("""
            UPDATE beds 
            SET status = 'Occupied', current_patient_id = ?, admitted_at = ?
            WHERE id = ?
        """, (req.patient_id, datetime.now().strftime("%Y-%m-%d %H:%M"), req.bed_id))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Admitted Patient", f"Bed {bed['bed_number']}", f"Admitted Patient ID {req.patient_id}")

        return {"message": "Patient admitted successfully", "admission_id": adm_id}

@router.post("/transfer")
def transfer_patient(req: BedTransferRequest, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify new bed
        cursor.execute("SELECT status, bed_number FROM beds WHERE id = ?", (req.new_bed_id,))
        new_bed = cursor.fetchone()
        if not new_bed:
            raise HTTPException(status_code=404, detail="Target bed not found")
        if new_bed["status"] != "Available":
            raise HTTPException(status_code=400, detail=f"Target bed {new_bed['bed_number']} is not available.")

        # Vacate old bed
        cursor.execute("UPDATE beds SET status = 'Available', current_patient_id = NULL, admitted_at = NULL WHERE id = ?", (req.current_bed_id,))

        # Occupy new bed
        cursor.execute("""
            UPDATE beds 
            SET status = 'Occupied', current_patient_id = ?, admitted_at = ?
            WHERE id = ?
        """, (req.patient_id, datetime.now().strftime("%Y-%m-%d %H:%M"), req.new_bed_id))

        # Update active admission
        cursor.execute("""
            UPDATE admissions 
            SET bed_id = ?
            WHERE patient_id = ? AND status = 'Admitted'
        """, (req.new_bed_id, req.patient_id))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Transferred Patient", f"Bed {new_bed['bed_number']}", f"Transferred patient from Bed #{req.current_bed_id} to Bed #{req.new_bed_id}")

        return {"message": f"Patient transferred to Bed {new_bed['bed_number']} successfully"}

@router.post("/discharge")
def discharge_patient(req: DischargeRequest, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Update admission
        cursor.execute("""
            UPDATE admissions
            SET status = 'Discharged', discharge_date = ?, discharge_summary = ?
            WHERE id = ?
        """, (req.discharge_date, req.discharge_summary, req.admission_id))

        # Free the bed
        cursor.execute("""
            UPDATE beds
            SET status = 'Available', current_patient_id = NULL, admitted_at = NULL
            WHERE id = ?
        """, (req.bed_id,))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Discharged Patient", f"Admission #{req.admission_id}", f"Discharged with summary: {req.discharge_summary[:50]}...")

        return {"message": "Patient discharged and bed freed"}
