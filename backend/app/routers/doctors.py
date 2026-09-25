from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

@router.get("")
def list_doctors(
    department_id: Optional[int] = Query(None),
    specialization: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT d.*, dept.name as department_name, dept.floor as department_floor,
                   u.email as doctor_email, u.phone as doctor_phone, u.avatar_url
            FROM doctors d
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE 1=1
        """
        params = []
        if department_id:
            query += " AND d.department_id = ?"
            params.append(department_id)
        if specialization:
            query += " AND d.specialization LIKE ?"
            params.append(f"%{specialization}%")
        if status:
            query += " AND d.available_status = ?"
            params.append(status)

        query += " ORDER BY d.id ASC"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]

@router.get("/departments")
def list_departments():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM departments ORDER BY id ASC")
        return [dict(r) for r in cursor.fetchall()]

@router.get("/{doctor_id}")
def get_doctor(doctor_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.*, dept.name as department_name, dept.floor as department_floor,
                   u.email as doctor_email, u.phone as doctor_phone, u.avatar_url
            FROM doctors d
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        """, (doctor_id,))
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        doctor_dict = dict(doc)
        
        # Today's appointments for this doctor
        cursor.execute("""
            SELECT a.*, p.full_name as patient_name, p.patient_code, p.phone as patient_phone, p.age, p.gender
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date DESC, a.id DESC
        """, (doctor_id,))
        doctor_dict["appointments"] = [dict(r) for r in cursor.fetchall()]
        
        return doctor_dict

@router.put("/{doctor_id}/status")
def update_doctor_status(doctor_id: int, status_update: dict, current_user: dict = Depends(get_current_user)):
    new_status = status_update.get("available_status", "Available")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE doctors SET available_status = ? WHERE id = ?", (new_status, doctor_id))
        return {"message": "Status updated successfully", "status": new_status}
