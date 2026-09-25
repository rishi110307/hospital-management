from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import LabOrderCreate, LabResultUpdate

router = APIRouter(prefix="/api/laboratory", tags=["Laboratory Management"])

@router.get("/catalog")
def get_lab_catalog():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lab_tests ORDER BY category, test_name")
        return [dict(r) for r in cursor.fetchall()]

@router.get("/reports")
def list_lab_reports(
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT lr.*, lt.test_name, lt.category, lt.price, lt.unit, lt.sample_type,
                   p.full_name as patient_name, p.patient_code, p.age as patient_age, p.gender as patient_gender,
                   d.full_name as doctor_name
            FROM lab_reports lr
            JOIN lab_tests lt ON lr.test_id = lt.id
            JOIN patients p ON lr.patient_id = p.id
            LEFT JOIN doctors d ON lr.doctor_id = d.id
            WHERE 1=1
        """
        params = []
        if patient_id:
            query += " AND lr.patient_id = ?"
            params.append(patient_id)
        if status:
            query += " AND lr.sample_status = ?"
            params.append(status)

        query += " ORDER BY lr.id DESC"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]

@router.post("/order")
def order_lab_test(req: LabOrderCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        # Fetch test details
        cursor.execute("SELECT test_name, normal_range FROM lab_tests WHERE id = ?", (req.test_id,))
        test = cursor.fetchone()
        if not test:
            raise HTTPException(status_code=404, detail="Lab test not found in catalog")

        cursor.execute("""
            INSERT INTO lab_reports (test_id, patient_id, doctor_id, order_date, sample_status, normal_range, notes)
            VALUES (?, ?, ?, ?, 'Ordered', ?, ?)
        """, (req.test_id, req.patient_id, req.doctor_id, today_str, test["normal_range"], req.notes))
        order_id = cursor.lastrowid

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Ordered Lab Test", f"Report #{order_id}", f"Test {test['test_name']}")

        return {"message": "Lab test ordered successfully", "report_id": order_id}

@router.put("/reports/{report_id}/results")
def update_lab_result(report_id: int, req: LabResultUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        completed_at = datetime.now().strftime("%Y-%m-%d %H:%M") if req.sample_status == "Completed" else None

        cursor.execute("""
            UPDATE lab_reports
            SET sample_status = ?,
                result_value = COALESCE(?, result_value),
                normal_range = COALESCE(?, normal_range),
                interpretation = COALESCE(?, interpretation),
                notes = COALESCE(?, notes),
                completed_at = COALESCE(?, completed_at)
            WHERE id = ?
        """, (req.sample_status, req.result_value, req.normal_range, req.interpretation, req.notes, completed_at, report_id))

        # Notify patient and doctor if completed
        if req.sample_status == "Completed":
            cursor.execute("SELECT patient_id, test_id FROM lab_reports WHERE id = ?", (report_id,))
            lr = cursor.fetchone()
            if lr:
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES ((SELECT user_id FROM patients WHERE id = ?), 'Diagnostic Report Ready', 'Your diagnostic test results are now verified and ready for download.', 'success')
                """, (lr["patient_id"],))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Updated Lab Result", f"Report #{report_id}", f"Status: {req.sample_status}, Interpretation: {req.interpretation}")

        return {"message": "Lab report updated successfully"}
