from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import AppointmentCreate, AppointmentUpdate

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.get("")
def list_appointments(
    doctor_id: Optional[int] = Query(None),
    patient_id: Optional[int] = Query(None),
    date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT a.*, 
                   p.full_name as patient_name, p.patient_code, p.phone as patient_phone, p.age as patient_age, p.gender as patient_gender,
                   d.full_name as doctor_name, d.specialization, dept.name as department_name, d.room_number
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            WHERE 1=1
        """
        params = []
        if doctor_id:
            query += " AND a.doctor_id = ?"
            params.append(doctor_id)
        if patient_id:
            query += " AND a.patient_id = ?"
            params.append(patient_id)
        if date:
            query += " AND a.appointment_date = ?"
            params.append(date)
        if status:
            query += " AND a.status = ?"
            params.append(status)

        query += " ORDER BY a.appointment_date DESC, a.id DESC"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]

@router.post("")
def create_appointment(req: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify Doctor & Schedule
        cursor.execute("SELECT d.*, dept.name as dept_name, dept.code as dept_code FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.id WHERE d.id = ?", (req.doctor_id,))
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Conflict check for exact doctor + date + time_slot
        cursor.execute("""
            SELECT id FROM appointments 
            WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'Cancelled'
        """, (req.doctor_id, req.appointment_date, req.time_slot))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="This time slot is already booked for this doctor. Please choose an alternative slot.")

        # Generate Queue Token (e.g., prefix from dept or 'T')
        dept_prefix = (doc["dept_code"] or "T")[0]
        cursor.execute("SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND appointment_date = ?", (req.doctor_id, req.appointment_date))
        slot_idx = cursor.fetchone()[0] + 1
        token_code = f"{dept_prefix}-{slot_idx:02d}"

        # Insert Appointment
        cursor.execute("""
            INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, token_number, status, symptoms, reason)
            VALUES (?, ?, ?, ?, ?, 'Confirmed', ?, ?)
        """, (req.patient_id, req.doctor_id, req.appointment_date, req.time_slot, token_code, req.symptoms, req.reason))
        appt_id = cursor.lastrowid

        # Insert Token into Queue Engine
        est_wait = (slot_idx - 1) * 15
        cursor.execute("""
            INSERT INTO queue_tokens (appointment_id, patient_id, doctor_id, token_code, department_name, status, estimated_wait_minutes)
            VALUES (?, ?, ?, ?, ?, 'Waiting', ?)
        """, (appt_id, req.patient_id, req.doctor_id, token_code, doc["dept_name"], est_wait))

        # Notify
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, 'info')
        """, (current_user["id"], "Appointment Confirmed", f"Appointment booked with {doc['full_name']} for {req.appointment_date} at {req.time_slot}. Token: {token_code}"))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Booked Appointment", f"Appt #{appt_id}", f"Patient ID {req.patient_id} with Dr. {doc['full_name']}, Token {token_code}")

        return {
            "message": "Appointment booked successfully",
            "appointment_id": appt_id,
            "token_number": token_code,
            "estimated_wait_minutes": est_wait
        }

@router.put("/{appointment_id}/status")
def update_status(appointment_id: int, status_update: dict, current_user: dict = Depends(get_current_user)):
    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (new_status, appointment_id))
        
        # If cancelled, update queue token to 'Skipped'
        if new_status == "Cancelled":
            cursor.execute("UPDATE queue_tokens SET status = 'Skipped' WHERE appointment_id = ?", (appointment_id,))
        elif new_status == "In-Consultation":
            cursor.execute("UPDATE queue_tokens SET status = 'Serving', served_at = CURRENT_TIMESTAMP WHERE appointment_id = ?", (appointment_id,))
        elif new_status == "Completed":
            cursor.execute("UPDATE queue_tokens SET status = 'Completed' WHERE appointment_id = ?", (appointment_id,))

        return {"message": "Status updated successfully", "status": new_status}
