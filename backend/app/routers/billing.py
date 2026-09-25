from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..auth import get_current_user, log_audit
from ..schemas import InvoiceCreate, PaymentRecord, InsuranceClaimCreate, InsuranceClaimUpdate

router = APIRouter(prefix="/api/billing", tags=["Billing & Insurance"])

@router.get("/invoices")
def list_invoices(
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT inv.*, p.full_name as patient_name, p.patient_code, p.phone as patient_phone, p.email as patient_email
            FROM invoices inv
            JOIN patients p ON inv.patient_id = p.id
            WHERE 1=1
        """
        params = []
        if patient_id:
            query += " AND inv.patient_id = ?"
            params.append(patient_id)
        if status:
            query += " AND inv.payment_status = ?"
            params.append(status)

        query += " ORDER BY inv.id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()

        invoices = []
        for r in rows:
            inv = dict(r)
            cursor.execute("SELECT * FROM invoice_items WHERE invoice_id = ?", (inv["id"],))
            inv["items"] = [dict(it) for it in cursor.fetchall()]
            invoices.append(inv)

        return invoices

@router.post("/invoices")
def create_invoice(req: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Calculate totals
        subtotal = sum(item.amount for item in req.items)
        net_amount = (subtotal - req.discount) + req.tax
        
        status = "Paid" if req.paid_amount >= net_amount else ("Partial" if req.paid_amount > 0 else "Unpaid")

        cursor.execute("SELECT COUNT(*) FROM invoices")
        next_code = cursor.fetchone()[0] + 101
        inv_code = f"INV-2026-{next_code:05d}"

        cursor.execute("""
            INSERT INTO invoices (invoice_number, patient_id, total_amount, discount, tax, net_amount, paid_amount, payment_status, payment_method, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (inv_code, req.patient_id, subtotal, req.discount, req.tax, net_amount, req.paid_amount, status, req.payment_method, req.notes))
        inv_id = cursor.lastrowid

        for it in req.items:
            cursor.execute("""
                INSERT INTO invoice_items (invoice_id, service_name, category, quantity, unit_price, amount)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (inv_id, it.service_name, it.category, it.quantity, it.unit_price, it.amount))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Generated Invoice", f"Invoice {inv_code}", f"Total: ${net_amount:.2f}, Status: {status}")

        return {"message": "Invoice created successfully", "invoice_id": inv_id, "invoice_number": inv_code}

@router.post("/invoices/{invoice_id}/pay")
def record_payment(invoice_id: int, req: PaymentRecord, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
        inv = cursor.fetchone()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")

        new_paid = inv["paid_amount"] + req.amount
        status = "Paid" if new_paid >= inv["net_amount"] else "Partial"

        cursor.execute("""
            UPDATE invoices 
            SET paid_amount = ?, payment_status = ?, payment_method = ?
            WHERE id = ?
        """, (new_paid, status, req.payment_method, invoice_id))

        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Recorded Payment", f"Invoice #{invoice_id}", f"Recorded ${req.amount:.2f} via {req.payment_method}")

        return {"message": "Payment recorded successfully", "new_paid_amount": new_paid, "status": status}

@router.get("/insurance/claims")
def list_insurance_claims():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ic.*, p.full_name as patient_name, p.patient_code, inv.invoice_number
            FROM insurance_claims ic
            JOIN patients p ON ic.patient_id = p.id
            LEFT JOIN invoices inv ON ic.invoice_id = inv.id
            ORDER BY ic.id DESC
        """)
        return [dict(r) for r in cursor.fetchall()]

@router.post("/insurance/claims")
def submit_insurance_claim(req: InsuranceClaimCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        today_str = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
            INSERT INTO insurance_claims (patient_id, invoice_id, provider_name, policy_number, claim_amount, status, claim_date, notes)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)
        """, (req.patient_id, req.invoice_id, req.provider_name, req.policy_number, req.claim_amount, today_str, req.notes))
        claim_id = cursor.lastrowid
        
        log_audit(conn, current_user["id"], current_user["email"], current_user["role"], "Submitted Insurance Claim", f"Claim #{claim_id}", f"Provider: {req.provider_name}, Amount: ${req.claim_amount:.2f}")

        return {"message": "Insurance claim submitted for adjudication", "claim_id": claim_id}

@router.put("/insurance/claims/{claim_id}")
def update_insurance_claim(claim_id: int, req: InsuranceClaimUpdate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE insurance_claims
            SET status = ?, approved_amount = COALESCE(?, approved_amount), notes = COALESCE(?, notes)
            WHERE id = ?
        """, (req.status, req.approved_amount, req.notes, claim_id))
        return {"message": f"Claim status updated to {req.status}"}
