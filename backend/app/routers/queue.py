from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import QueueStatusUpdate

router = APIRouter(prefix="/api/queue", tags=["Smart Queue Management"])

@router.get("/board")
def get_queue_board(doctor_id: Optional[int] = Query(None), department: Optional[str] = Query(None)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Currently serving tokens
        query_serving = """
            SELECT qt.*, p.full_name as patient_name, p.patient_code,
                   d.full_name as doctor_name, d.room_number, d.specialization
            FROM queue_tokens qt
            JOIN patients p ON qt.patient_id = p.id
            JOIN doctors d ON qt.doctor_id = d.id
            WHERE qt.status IN ('Serving', 'Calling')
        """
        params_serving = []
        if doctor_id:
            query_serving += " AND qt.doctor_id = ?"
            params_serving.append(doctor_id)
        if department:
            query_serving += " AND qt.department_name = ?"
            params_serving.append(department)
        
        cursor.execute(query_serving, params_serving)
        serving_tokens = [dict(r) for r in cursor.fetchall()]

        # Waiting tokens
        query_waiting = """
            SELECT qt.*, p.full_name as patient_name, p.patient_code,
                   d.full_name as doctor_name, d.room_number, d.specialization
            FROM queue_tokens qt
            JOIN patients p ON qt.patient_id = p.id
            JOIN doctors d ON qt.doctor_id = d.id
            WHERE qt.status = 'Waiting'
            ORDER BY qt.id ASC
        """
        params_waiting = []
        if doctor_id:
            query_waiting += " AND qt.doctor_id = ?"
            params_waiting.append(doctor_id)
        if department:
            query_waiting += " AND qt.department_name = ?"
            params_waiting.append(department)
            
        cursor.execute(query_waiting, params_waiting)
        waiting_tokens = [dict(r) for r in cursor.fetchall()]

        # Recalculate estimated wait times for waiting queue (15 mins per patient ahead)
        for idx, token in enumerate(waiting_tokens):
            token["estimated_wait_minutes"] = (idx + 1) * 15

        # Completed today
        query_completed = """
            SELECT qt.*, p.full_name as patient_name, d.full_name as doctor_name
            FROM queue_tokens qt
            JOIN patients p ON qt.patient_id = p.id
            JOIN doctors d ON qt.doctor_id = d.id
            WHERE qt.status = 'Completed'
            ORDER BY qt.id DESC LIMIT 10
        """
        cursor.execute(query_completed)
        completed_tokens = [dict(r) for r in cursor.fetchall()]

        return {
            "currently_serving": serving_tokens[0] if serving_tokens else None,
            "all_active_counters": serving_tokens,
            "waiting_queue": waiting_tokens,
            "completed_queue": completed_tokens,
            "total_waiting": len(waiting_tokens),
            "estimated_wait_time_minutes": len(waiting_tokens) * 15
        }

@router.post("/call-next")
def call_next_patient(req: dict, current_user: dict = Depends(get_current_user)):
    doctor_id = req.get("doctor_id")
    if not doctor_id:
        raise HTTPException(status_code=400, detail="Doctor ID is required")

    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Complete any currently serving token for this doctor
        cursor.execute("""
            UPDATE queue_tokens 
            SET status = 'Completed' 
            WHERE doctor_id = ? AND status IN ('Serving', 'Calling')
        """, (doctor_id,))

        # 2. Find next waiting token
        cursor.execute("""
            SELECT * FROM queue_tokens 
            WHERE doctor_id = ? AND status = 'Waiting'
            ORDER BY id ASC LIMIT 1
        """, (doctor_id,))
        next_token = cursor.fetchone()

        if not next_token:
            return {"message": "No patients waiting in queue for this doctor.", "token": None}

        # 3. Update token to 'Calling'
        cursor.execute("""
            UPDATE queue_tokens
            SET status = 'Calling', called_at = CURRENT_TIMESTAMP, estimated_wait_minutes = 0
            WHERE id = ?
        """, (next_token["id"],))

        # Update appointment status
        if next_token["appointment_id"]:
            cursor.execute("UPDATE appointments SET status = 'In-Consultation' WHERE id = ?", (next_token["appointment_id"],))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Queue Call Next", f"Token {next_token['token_code']}", f"Called patient token {next_token['token_code']}")

        return {
            "message": f"Calling Token {next_token['token_code']}",
            "token": dict(next_token)
        }

@router.put("/token/{token_id}/status")
def update_token_status(token_id: int, req: QueueStatusUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE queue_tokens SET status = ? WHERE id = ?", (req.status, token_id))
        return {"message": f"Token status updated to {req.status}"}
