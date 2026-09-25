import json
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import PatientCreate, PatientUpdate

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("")
def list_patients(
    search: Optional[str] = Query(None),
    blood_group: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM patients WHERE 1=1"
        params = []

        if search:
            query += " AND (full_name LIKE ? OR patient_code LIKE ? OR phone LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s])
        if blood_group:
            query += " AND blood_group = ?"
            params.append(blood_group)
        if gender:
            query += " AND gender = ?"
            params.append(gender)

        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.post("")
def create_patient(req: PatientCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM patients")
        next_num = cursor.fetchone()[0] + 1001
        patient_code = f"SC-P{next_num}"

        cursor.execute("""
            INSERT INTO patients (patient_code, full_name, age, gender, blood_group, phone, email, emergency_contact, address, allergies, medical_history)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_code, req.full_name, req.age, req.gender, req.blood_group,
            req.phone, req.email, req.emergency_contact, req.address,
            req.allergies, req.medical_history
        ))
        patient_id = cursor.lastrowid
        
        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Created Patient", f"Patient {patient_code}", f"Registered {req.full_name}")

        return {"message": "Patient registered successfully", "patient_id": patient_id, "patient_code": patient_code}

@router.get("/{patient_id}")
def get_patient_detail(patient_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        p = cursor.fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient = dict(p)

        # Appointments
        cursor.execute("""
            SELECT a.*, d.full_name as doctor_name, d.specialization
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.id DESC
        """, (patient_id,))
        patient["appointments"] = [dict(r) for r in cursor.fetchall()]

        # Medical Records
        cursor.execute("""
            SELECT mr.*, d.full_name as doctor_name, d.specialization
            FROM medical_records mr
            JOIN doctors d ON mr.doctor_id = d.id
            WHERE mr.patient_id = ?
            ORDER BY mr.visit_date DESC, mr.id DESC
        """, (patient_id,))
        patient["medical_records"] = [dict(r) for r in cursor.fetchall()]

        # Prescriptions
        cursor.execute("""
            SELECT pr.*, d.full_name as doctor_name
            FROM prescriptions pr
            JOIN doctors d ON pr.doctor_id = d.id
            WHERE pr.patient_id = ?
            ORDER BY pr.id DESC
        """, (patient_id,))
        prescs = []
        for r in cursor.fetchall():
            item = dict(r)
            try:
                item["medicines"] = json.loads(item["medicines_json"])
            except Exception:
                item["medicines"] = []
            prescs.append(item)
        patient["prescriptions"] = prescs

        # Lab Reports
        cursor.execute("""
            SELECT lr.*, lt.test_name, lt.category as test_category, d.full_name as doctor_name
            FROM lab_reports lr
            JOIN lab_tests lt ON lr.test_id = lt.id
            LEFT JOIN doctors d ON lr.doctor_id = d.id
            WHERE lr.patient_id = ?
            ORDER BY lr.id DESC
        """, (patient_id,))
        patient["lab_reports"] = [dict(r) for r in cursor.fetchall()]

        # Admissions & Bed
        cursor.execute("""
            SELECT adm.*, b.bed_number, w.name as ward_name, w.ward_type, d.full_name as doctor_name
            FROM admissions adm
            JOIN beds b ON adm.bed_id = b.id
            JOIN wards w ON b.ward_id = w.id
            LEFT JOIN doctors d ON adm.doctor_id = d.id
            WHERE adm.patient_id = ?
            ORDER BY adm.id DESC
        """, (patient_id,))
        patient["admissions"] = [dict(r) for r in cursor.fetchall()]

        # Invoices
        cursor.execute("""
            SELECT * FROM invoices WHERE patient_id = ? ORDER BY id DESC
        """, (patient_id,))
        patient["invoices"] = [dict(r) for r in cursor.fetchall()]

        # Insurance Claims
        cursor.execute("""
            SELECT * FROM insurance_claims WHERE patient_id = ? ORDER BY id DESC
        """, (patient_id,))
        patient["insurance_claims"] = [dict(r) for r in cursor.fetchall()]

        # Build Unified Chronological Digital Timeline
        timeline = []
        for appt in patient["appointments"]:
            timeline.append({
                "type": "appointment",
                "date": appt["appointment_date"],
                "title": f"Appointment: {appt['reason'] or 'Consultation'}",
                "doctor": appt["doctor_name"],
                "status": appt["status"],
                "details": f"Time: {appt['time_slot']} | Token: {appt['token_number'] or 'N/A'}"
            })
        for mr in patient["medical_records"]:
            timeline.append({
                "type": "clinical",
                "date": mr["visit_date"],
                "title": f"Clinical Diagnosis: {mr['diagnosis']}",
                "doctor": mr["doctor_name"],
                "status": "Documented",
                "details": f"BP: {mr['bp'] or 'N/A'}, Pulse: {mr['pulse'] or 'N/A'}, Symptoms: {mr['symptoms'] or 'N/A'}"
            })
        for lr in patient["lab_reports"]:
            timeline.append({
                "type": "lab",
                "date": lr["order_date"],
                "title": f"Lab Test: {lr['test_name']}",
                "doctor": lr.get("doctor_name") or "Diagnostic Lab",
                "status": lr["sample_status"],
                "details": f"Result: {lr['result_value'] or 'In Progress'} | Status: {lr['interpretation'] or lr['sample_status']}"
            })
        for adm in patient["admissions"]:
            timeline.append({
                "type": "admission",
                "date": adm["admission_date"],
                "title": f"Inpatient Admission ({adm['ward_name']} - Bed {adm['bed_number']})",
                "doctor": adm.get("doctor_name") or "Hospital Staff",
                "status": adm["status"],
                "details": f"Diagnosis: {adm['initial_diagnosis']}"
            })
        
        # Sort timeline descending by date
        timeline.sort(key=lambda x: x["date"], reverse=True)
        patient["timeline"] = timeline

        return patient

@router.put("/{patient_id}")
def update_patient(patient_id: int, req: PatientUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, patient_code FROM patients WHERE id = ?", (patient_id,))
        p = cursor.fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Patient not found")

        updates = []
        params = []
        for k, v in req.model_dump(exclude_unset=True).items():
            updates.append(f"{k} = ?")
            params.append(v)

        if updates:
            params.append(patient_id)
            cursor.execute(f"UPDATE patients SET {', '.join(updates)} WHERE id = ?", params)
            log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Updated Patient", f"Patient {p['patient_code']}", "Updated demographics")

        return {"message": "Patient updated successfully"}
