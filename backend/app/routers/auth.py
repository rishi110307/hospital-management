from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..auth import hash_password, verify_password, create_access_token, get_current_user, log_audit
from ..schemas import LoginRequest, RegisterRequest, TokenResponse, PasswordResetRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ROLE_CREDENTIALS = {
    "Super Admin": "superadmin@smartcare.com",
    "Hospital Admin": "admin@smartcare.com",
    "Doctor": "doctor@smartcare.com",
    "Nurse": "nurse@smartcare.com",
    "Receptionist": "receptionist@smartcare.com",
    "Pharmacist": "pharmacist@smartcare.com",
    "Laboratory Staff": "lab@smartcare.com",
    "Accountant": "accountant@smartcare.com",
    "Patient": "patient@smartcare.com"
}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (req.email,))
        user = cursor.fetchone()
        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        token = create_access_token({
            "sub": user["email"],
            "user_id": user["id"],
            "role": user["role"]
        })
        
        log_audit(conn, user["id"], user["email"], user["role"], "User Login", "Auth", "Successful user authentication")
        
        user_dict = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "phone": user["phone"],
            "avatar_url": user["avatar_url"]
        }
        return {"access_token": token, "token_type": "bearer", "user": user_dict}

@router.get("/demo-login/{role_name}", response_model=TokenResponse)
def demo_login(role_name: str):
    email = ROLE_CREDENTIALS.get(role_name)
    if not email:
        raise HTTPException(status_code=404, detail=f"No demo account found for role: {role_name}")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Demo user not found")
        
        token = create_access_token({
            "sub": user["email"],
            "user_id": user["id"],
            "role": user["role"]
        })
        
        log_audit(conn, user["id"], user["email"], user["role"], "Demo Quick Switch", "Auth", f"Switched active session to {role_name}")
        
        user_dict = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "phone": user["phone"],
            "avatar_url": user["avatar_url"]
        }
        return {"access_token": token, "token_type": "bearer", "user": user_dict}

@router.post("/register")
def register(req: RegisterRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, role, phone)
            VALUES (?, ?, ?, ?, ?)
        """, (req.email, hash_password(req.password), req.full_name, req.role, req.phone))
        user_id = cursor.lastrowid
        
        # If registering as Patient, create Patient profile
        patient_code = None
        if req.role == "Patient":
            cursor.execute("SELECT COUNT(*) FROM patients")
            count = cursor.fetchone()[0] + 1001
            patient_code = f"SC-P{count}"
            
            cursor.execute("""
                INSERT INTO patients (user_id, patient_code, full_name, age, gender, blood_group, phone, email, emergency_contact, address, allergies, medical_history)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, patient_code, req.full_name, req.age or 30, req.gender or "Other", req.blood_group, req.phone, req.email, req.emergency_contact, req.address, req.allergies, req.medical_history))

        token = create_access_token({
            "sub": req.email,
            "user_id": user_id,
            "role": req.role
        })

        log_audit(conn, user_id, req.email, req.role, "User Registered", "Auth", f"New user registered as {req.role}")

        return {
            "message": "Registration successful",
            "access_token": token,
            "patient_code": patient_code,
            "user": {
                "id": user_id,
                "email": req.email,
                "full_name": req.full_name,
                "role": req.role,
                "phone": req.phone
            }
        }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    # Check if patient
    patient_data = None
    if current_user["role"] == "Patient":
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM patients WHERE user_id = ?", (current_user["id"],))
            p = cursor.fetchone()
            if p:
                patient_data = dict(p)
    return {
        "user": current_user,
        "patient": patient_data
    }

@router.get("/demo-roles")
def get_demo_roles():
    return [
        {"role": "Super Admin", "email": "superadmin@smartcare.com", "badge": "System Control", "desc": "Full hospital & system governance"},
        {"role": "Hospital Admin", "email": "admin@smartcare.com", "badge": "Operations", "desc": "Daily hospital operations & beds"},
        {"role": "Doctor", "email": "doctor@smartcare.com", "badge": "Clinical", "desc": "Cardiology specialist & queue management"},
        {"role": "Nurse", "email": "nurse@smartcare.com", "badge": "Inpatient Care", "desc": "Ward beds, vitals, admissions"},
        {"role": "Receptionist", "email": "receptionist@smartcare.com", "badge": "Front Desk", "desc": "Patient check-in & token dispatch"},
        {"role": "Pharmacist", "email": "pharmacist@smartcare.com", "badge": "Dispensing", "desc": "Medicine stock & expiry tracking"},
        {"role": "Laboratory Staff", "email": "lab@smartcare.com", "badge": "Diagnostics", "desc": "Test orders, samples & PDF reports"},
        {"role": "Accountant", "email": "accountant@smartcare.com", "badge": "Finance", "desc": "Itemized billing & insurance claims"},
        {"role": "Patient", "email": "patient@smartcare.com", "badge": "Self Service", "desc": "Appointments, records & AI summary"}
    ]
