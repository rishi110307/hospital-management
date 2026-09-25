from fastapi import APIRouter, Depends, Query
from typing import Optional
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Audit Logs & Security"])

@router.get("/logs")
def get_audit_logs(
    role: Optional[str] = Query(None),
    limit: int = Query(50)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []
        if role:
            query += " AND role = ?"
            params.append(role)
        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]

@router.get("/notifications")
def get_notifications(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM notifications 
            WHERE user_id = ? OR user_id IS NULL
            ORDER BY id DESC LIMIT 20
        """, (current_user["id"],))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.put("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notif_id,))
        return {"message": "Notification marked as read"}
