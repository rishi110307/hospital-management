import json
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import MedicalRecordCreate

router = APIRouter(prefix="/api/medical-records", tags=["Medical Records (EMR)"])

@router.post("")
def create_medical_record(req: MedicalRecordCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Insert Medical Record
        cursor.execute("""
            INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, symptoms, clinical_notes, bp, pulse, temperature, weight, follow_up_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            req.patient_id, req.doctor_id, req.visit_date, req.diagnosis,
            req.symptoms, req.clinical_notes, req.bp, req.pulse, req.temperature,
            req.weight, req.follow_up_date
        ))
        record_id = cursor.lastrowid

        # 2. Insert Prescription if provided
        presc_id = None
        if req.prescriptions:
            cursor.execute("""
                INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, medicines_json, instructions, status)
                VALUES (?, ?, ?, ?, ?, 'Active')
            """, (
                record_id, req.patient_id, req.doctor_id,
                json.dumps(req.prescriptions),
                req.clinical_notes or "Take medications as prescribed with meals."
            ))
            presc_id = cursor.lastrowid

        # 3. Mark any current appointment as Completed
        cursor.execute("""
            UPDATE appointments
            SET status = 'Completed'
            WHERE patient_id = ? AND doctor_id = ? AND status = 'In-Consultation'
        """, (req.patient_id, req.doctor_id))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Created Medical Record", f"Record #{record_id}", f"Diagnosis: {req.diagnosis}")

        return {
            "message": "Medical record and prescription created successfully",
            "medical_record_id": record_id,
            "prescription_id": presc_id
        }

@router.get("/prescriptions/{patient_id}")
def get_patient_prescriptions(patient_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT pr.*, d.full_name as doctor_name, d.specialization
            FROM prescriptions pr
            JOIN doctors d ON pr.doctor_id = d.id
            WHERE pr.patient_id = ?
            ORDER BY pr.id DESC
        """, (patient_id,))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            item = dict(r)
            try:
                item["medicines"] = json.loads(item["medicines_json"])
            except Exception:
                item["medicines"] = []
            result.append(item)
        return result
