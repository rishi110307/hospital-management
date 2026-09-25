from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

# Auth Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "Patient"
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class PasswordResetRequest(BaseModel):
    email: str
    old_password: Optional[str] = None
    new_password: str

# Patient Schemas
class PatientCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    blood_group: Optional[str] = None
    phone: str
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None

# Appointment Schemas
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: str
    time_slot: str
    reason: Optional[str] = None
    symptoms: Optional[str] = None

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    time_slot: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

# Queue Schemas
class QueueStatusUpdate(BaseModel):
    status: str  # Waiting, Calling, Serving, Completed, Skipped

# Medical Record & Prescription
class MedicalRecordCreate(BaseModel):
    patient_id: int
    doctor_id: int
    visit_date: str
    diagnosis: str
    symptoms: Optional[str] = None
    clinical_notes: Optional[str] = None
    bp: Optional[str] = None
    pulse: Optional[str] = None
    temperature: Optional[str] = None
    weight: Optional[str] = None
    follow_up_date: Optional[str] = None
    prescriptions: Optional[List[dict]] = None

# Pharmacy Schemas
class MedicineCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    batch_number: str
    manufacturer: Optional[str] = None
    expiry_date: str
    stock_quantity: int
    min_stock_level: int = 20
    unit_price: float
    category: Optional[str] = None

class DispenseRequest(BaseModel):
    prescription_id: Optional[int] = None
    patient_id: int
    items: List[dict] # [{medicine_id, quantity, unit_price}]
    total_amount: float

# Lab Schemas
class LabOrderCreate(BaseModel):
    test_id: int
    patient_id: int
    doctor_id: Optional[int] = None
    notes: Optional[str] = None

class LabResultUpdate(BaseModel):
    sample_status: str # Ordered, Sample Collected, Processing, Completed
    result_value: Optional[str] = None
    normal_range: Optional[str] = None
    interpretation: Optional[str] = None # Normal, Low, High, Critical
    notes: Optional[str] = None

# Bed & Admission Schemas
class AdmissionCreate(BaseModel):
    patient_id: int
    bed_id: int
    doctor_id: Optional[int] = None
    admission_date: str
    initial_diagnosis: Optional[str] = None

class BedTransferRequest(BaseModel):
    current_bed_id: int
    new_bed_id: int
    patient_id: int
    notes: Optional[str] = None

class DischargeRequest(BaseModel):
    admission_id: int
    bed_id: int
    discharge_date: str
    discharge_summary: str

# Emergency Schemas
class EmergencyCaseCreate(BaseModel):
    patient_name: str
    age: int
    gender: str
    triage_priority: str # Critical, Urgent, Stable
    emergency_type: str
    assigned_doctor_id: Optional[int] = None
    assigned_bed_id: Optional[int] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None

class EmergencyCaseUpdate(BaseModel):
    triage_priority: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_bed_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

# Billing & Insurance Schemas
class InvoiceItemSchema(BaseModel):
    service_name: str
    category: str
    quantity: int = 1
    unit_price: float
    amount: float

class InvoiceCreate(BaseModel):
    patient_id: int
    items: List[InvoiceItemSchema]
    discount: float = 0.0
    tax: float = 0.0
    payment_method: Optional[str] = "Cash"
    paid_amount: float = 0.0
    notes: Optional[str] = None

class PaymentRecord(BaseModel):
    amount: float
    payment_method: str

class InsuranceClaimCreate(BaseModel):
    patient_id: int
    invoice_id: Optional[int] = None
    provider_name: str
    policy_number: str
    claim_amount: float
    notes: Optional[str] = None

class InsuranceClaimUpdate(BaseModel):
    status: str # Pending, In Review, Approved, Rejected, Settled
    approved_amount: Optional[float] = None
    notes: Optional[str] = None

# Blood Bank Schemas
class BloodIssueRequest(BaseModel):
    blood_group: str
    units: int
    patient_id: Optional[int] = None
    requested_by: str
    priority: str = "Normal" # Normal, Emergency

class BloodDonorCreate(BaseModel):
    name: str
    blood_group: str
    phone: str
    age: int
    units_donated: int = 1

# AI Summarizer and Chatbot
class AISummarizeRequest(BaseModel):
    raw_text: str
    report_title: Optional[str] = "Medical Laboratory Report"

class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
