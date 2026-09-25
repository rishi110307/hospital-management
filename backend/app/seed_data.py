import json
from datetime import datetime, timedelta
from .database import get_db
from .auth import hash_password

def seed_database():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] > 0:
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding SmartCare Hospital Management Database...")

        # 1. Seed Users (9 Roles)
        users = [
            ("superadmin@smartcare.com", hash_password("SuperAdmin@123"), "Dr. Arthur Pendelton", "Super Admin", "+1-800-555-0101", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"),
            ("admin@smartcare.com", hash_password("Admin@123"), "Eleanor Vance (Hospital Admin)", "Hospital Admin", "+1-800-555-0102", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"),
            ("doctor@smartcare.com", hash_password("Doctor@123"), "Dr. Marcus Brody, MD (Cardiologist)", "Doctor", "+1-800-555-0103", "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256"),
            ("doctor2@smartcare.com", hash_password("Doctor@123"), "Dr. Sarah Lin, MD (Neurologist)", "Doctor", "+1-800-555-0104", "https://images.unsplash.com/photo-1594824813589-f3089d70189d?auto=format&fit=crop&q=80&w=256"),
            ("nurse@smartcare.com", hash_password("Nurse@123"), "Nurse Chloe Adams, RN", "Nurse", "+1-800-555-0105", "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=256"),
            ("receptionist@smartcare.com", hash_password("Receptionist@123"), "Hannah Miller (Front Desk)", "Receptionist", "+1-800-555-0106", "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256"),
            ("pharmacist@smartcare.com", hash_password("Pharmacist@123"), "David Thorne, PharmD", "Pharmacist", "+1-800-555-0107", "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=256"),
            ("lab@smartcare.com", hash_password("Lab@123"), "Dr. Robert Chen (Chief Lab Tech)", "Laboratory Staff", "+1-800-555-0108", "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=256"),
            ("accountant@smartcare.com", hash_password("Accountant@123"), "Sophia Reynolds, CPA", "Accountant", "+1-800-555-0109", "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=256"),
            ("patient@smartcare.com", hash_password("Patient@123"), "James Wilson (Patient)", "Patient", "+1-800-555-0110", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256")
        ]

        for u in users:
            cursor.execute("""
                INSERT INTO users (email, password_hash, full_name, role, phone, avatar_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, u)

        # 2. Departments
        departments = [
            ("Cardiology", "CARD", "Dr. Marcus Brody", "Floor 2, Wing A", "Cardiovascular diagnosis, angioplasty, and heart care", "Heart"),
            ("Neurology", "NEUR", "Dr. Sarah Lin", "Floor 3, Wing B", "Brain, spinal cord, and nervous system disorders", "Brain"),
            ("Orthopedics", "ORTH", "Dr. Jonathan Davis", "Floor 1, Wing C", "Bone, joint, and musculoskeletal trauma care", "Bone"),
            ("Pediatrics", "PEDI", "Dr. Emily Taylor", "Floor 2, Wing C", "Infant, child, and adolescent healthcare", "Baby"),
            ("Emergency Medicine", "EMER", "Dr. Alexander Wright", "Ground Floor, ER Bay", "24/7 Acute trauma and critical resuscitation", "Zap"),
            ("Internal Medicine", "INTM", "Dr. Rebecca Stone", "Floor 1, Wing A", "Comprehensive adult diagnostics and chronic disease management", "Activity"),
            ("Pathology & Labs", "PATH", "Dr. Robert Chen", "Basement 1, Diagnostic Center", "Automated clinical biochemistry, hematology, and histopathology", "FlaskConical")
        ]
        for dept in departments:
            cursor.execute("""
                INSERT INTO departments (name, code, head_doctor, floor, description, icon)
                VALUES (?, ?, ?, ?, ?, ?)
            """, dept)

        # 3. Doctors
        doctors = [
            (3, "Dr. Marcus Brody", "Cardiology", 1, "MD, FACC, Harvard Medical School", 14, 800.0, "Mon,Tue,Wed,Thu,Fri", "09:00 AM - 01:00 PM, 04:00 PM - 07:00 PM", "Available", "Room 204"),
            (4, "Dr. Sarah Lin", "Neurology", 2, "MD, PhD, Johns Hopkins", 11, 750.0, "Mon,Wed,Fri", "10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM", "Available", "Room 312"),
            (None, "Dr. Jonathan Davis", "Orthopedics", 3, "MS (Ortho), FRCS", 16, 700.0, "Tue,Thu,Sat", "09:00 AM - 01:00 PM", "Available", "Room 108"),
            (None, "Dr. Alexander Wright", "Emergency Medicine", 5, "MD (Emergency), FACEP", 12, 600.0, "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "24/7 On-Call", "Available", "ER Room 01")
        ]
        for doc in doctors:
            cursor.execute("""
                INSERT INTO doctors (user_id, full_name, specialization, department_id, qualification, experience_years, consultation_fee, schedule_days, time_slots, available_status, room_number)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, doc)

        # 4. Patients
        patients = [
            (10, "SC-P1001", "James Wilson", 45, "Male", "O+", "+1-800-555-0110", "patient@smartcare.com", "Mary Wilson (+1-800-555-0199)", "742 Evergreen Terrace, Springfield", "Penicillin, Shellfish", "Hypertension (diagnosed 2021), mild asthma"),
            (None, "SC-P1002", "Maria Rodriguez", 38, "Female", "A+", "+1-800-555-0112", "maria.r@example.com", "Carlos Rodriguez (+1-800-555-0198)", "120 Ocean View Blvd, Miami", "Sulfa drugs", "Type 2 Diabetes, Gestational Hypertension in 2018"),
            (None, "SC-P1003", "Robert Sterling", 62, "Male", "B+", "+1-800-555-0113", "r.sterling@example.com", "Grace Sterling (+1-800-555-0197)", "88 High Street, Boston", "None known", "Coronary artery disease, Stent placed in 2023"),
            (None, "SC-P1004", "Aaliyah Patel", 29, "Female", "AB-", "+1-800-555-0114", "aaliyah.p@example.com", "Dev Patel (+1-800-555-0196)", "45 Maplewood Ave, Chicago", "Aspirin, Ibuprofen", "Migraines with aura, Thyroiditis"),
            (None, "SC-P1005", "Liam O'Connor", 51, "Male", "O-", "+1-800-555-0115", "liam.oc@example.com", "Fiona O'Connor (+1-800-555-0195)", "14 Beacon Street, Seattle", "Latex", "Hyperlipidemia, Chronic Lower Back Pain")
        ]
        for pat in patients:
            cursor.execute("""
                INSERT INTO patients (user_id, patient_code, full_name, age, gender, blood_group, phone, email, emergency_contact, address, allergies, medical_history)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, pat)

        # 5. Appointments & Smart Queue Tokens
        today_str = datetime.now().strftime("%Y-%m-%d")
        tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        appointments = [
            (1, 1, today_str, "09:30 AM", "A-19", "Confirmed", "Shortness of breath after exertion", "Routine Cardiac Follow-up"),
            (2, 1, today_str, "10:15 AM", "A-20", "In-Consultation", "Chest tightness and palpitations", "Diagnostic Evaluation"),
            (3, 1, today_str, "11:00 AM", "A-24", "Confirmed", "Blood pressure monitoring and review", "Post-Stent Checkup"),
            (4, 2, today_str, "10:30 AM", "N-05", "Confirmed", "Persistent headache and blurred vision", "Neurology Consultation"),
            (5, 3, tomorrow_str, "09:00 AM", "O-11", "Confirmed", "Knee joint stiffness and pain", "Orthopedic Review")
        ]
        for appt in appointments:
            cursor.execute("""
                INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, token_number, status, symptoms, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, appt)

        # Queue Tokens
        tokens = [
            (1, 1, 1, "A-19", "Cardiology", "Serving", 0),
            (2, 2, 1, "A-20", "Cardiology", "Calling", 5),
            (3, 3, 1, "A-24", "Cardiology", "Waiting", 25),
            (4, 4, 2, "N-05", "Neurology", "Serving", 0),
            (5, 5, 3, "O-11", "Orthopedics", "Waiting", 40)
        ]
        for t in tokens:
            cursor.execute("""
                INSERT INTO queue_tokens (appointment_id, patient_id, doctor_id, token_code, department_name, status, estimated_wait_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, t)

        # 6. Medical Records & Prescriptions
        cursor.execute("""
            INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, symptoms, clinical_notes, bp, pulse, temperature, weight, follow_up_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            1, 1, today_str,
            "Stage 1 Essential Hypertension with sinus tachycardia",
            "Exertional dyspnea, occasional lightheadedness",
            "Patient is alert. Heart sounds S1 S2 normal with no murmurs. ECG shows normal sinus rhythm at 88 bpm. Advised 24-hr ambulatory BP monitoring.",
            "138/88 mmHg", "82 bpm", "98.4 F", "78 kg",
            (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        ))
        med_rec_id = cursor.lastrowid

        presc_items = [
            {"name": "Amlodipine Besylate", "dosage": "5mg", "frequency": "Once daily (Morning)", "duration": "30 days", "instructions": "Take after breakfast"},
            {"name": "Atorvastatin Calcium", "dosage": "20mg", "frequency": "Once daily (Night)", "duration": "30 days", "instructions": "Take after dinner with water"},
            {"name": "Metoprolol Tartrate", "dosage": "25mg", "frequency": "Twice daily", "duration": "14 days", "instructions": "Monitor pulse rate regularly"}
        ]
        cursor.execute("""
            INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, medicines_json, instructions, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (med_rec_id, 1, 1, json.dumps(presc_items), "Maintain low-sodium diet, avoid high caffeine intake. Exercise 30 minutes daily.", "Active"))

        # 7. Medicines Catalog (Pharmacy)
        medicines = [
            ("Amlodipine Besylate", "Amlodipine", "BAT-2024-001", "Pfizer Labs", (datetime.now() + timedelta(days=450)).strftime("%Y-%m-%d"), 240, 30, 12.50, "Cardiovascular", "In Stock"),
            ("Atorvastatin Calcium", "Atorvastatin", "BAT-2024-002", "Sun Pharma", (datetime.now() + timedelta(days=380)).strftime("%Y-%m-%d"), 180, 25, 18.00, "Cardiovascular", "In Stock"),
            ("Metformin HCl 500mg", "Metformin", "BAT-2024-003", "Cipla Health", (datetime.now() + timedelta(days=600)).strftime("%Y-%m-%d"), 450, 50, 8.20, "Antidiabetic", "In Stock"),
            ("Amoxicillin 500mg", "Amoxicillin", "BAT-2023-088", "GlaxoSmithKline", (datetime.now() + timedelta(days=22)).strftime("%Y-%m-%d"), 14, 20, 15.00, "Antibiotics", "Low Stock & Expiring Soon"),
            ("Azithromycin 250mg", "Azithromycin", "BAT-2023-094", "Novartis", (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"), 8, 25, 22.00, "Antibiotics", "Low Stock & Expiring Soon"),
            ("Paracetamol 650mg", "Acetaminophen", "BAT-2024-010", "GSK Consumer", (datetime.now() + timedelta(days=720)).strftime("%Y-%m-%d"), 900, 100, 3.50, "Analgesics", "In Stock"),
            ("Pantoprazole 40mg", "Pantoprazole", "BAT-2024-015", "Dr. Reddy's", (datetime.now() + timedelta(days=500)).strftime("%Y-%m-%d"), 320, 40, 11.00, "Gastrointestinal", "In Stock"),
            ("Insulin Glargine Pen", "Insulin", "BAT-2024-022", "Sanofi", (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d"), 12, 15, 65.00, "Antidiabetic", "Low Stock")
        ]
        for med in medicines:
            cursor.execute("""
                INSERT INTO medicines (name, generic_name, batch_number, manufacturer, expiry_date, stock_quantity, min_stock_level, unit_price, category, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, med)

        # 8. Lab Tests & Reports
        lab_tests = [
            ("Complete Blood Count (CBC)", "Hematology", 450.0, "Hb: 13.0-17.5 g/dL, WBC: 4,000-11,000/uL, Platelets: 150k-450k", "Blood", "Whole Blood (EDTA)", 12),
            ("Comprehensive Lipid Panel", "Biochemistry", 850.0, "Chol: <200 mg/dL, HDL: >40 mg/dL, LDL: <100 mg/dL, Trig: <150 mg/dL", "Blood", "Serum (Fasting)", 18),
            ("Glycated Hemoglobin (HbA1c)", "Endocrinology", 600.0, "< 5.7% (Normal), 5.7-6.4% (Prediabetic)", "%", "Whole Blood", 12),
            ("Liver Function Test (LFT)", "Biochemistry", 950.0, "ALT: 7-56 U/L, AST: 10-40 U/L, Bilirubin: 0.1-1.2 mg/dL", "Blood", "Serum", 24),
            ("Renal Function Test (KFT)", "Biochemistry", 750.0, "Serum Creatinine: 0.7-1.3 mg/dL, BUN: 7-20 mg/dL", "Blood", "Serum", 24),
            ("Chest X-Ray Digital (PA View)", "Radiology", 1200.0, "Lungs clear, cardiac silhouette normal size", "Visual", "Digital X-Ray", 4)
        ]
        for lt in lab_tests:
            cursor.execute("""
                INSERT INTO lab_tests (test_name, category, price, normal_range, unit, sample_type, turnaround_hours)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, lt)

        lab_reports = [
            (1, 1, 1, today_str, "Completed", "Hb: 14.2 g/dL, WBC: 7,400 /uL, Platelets: 240,000 /uL", "Hb: 13.0-17.5, WBC: 4k-11k", "Normal", "CBC indices within optimal limits.", datetime.now().strftime("%Y-%m-%d %H:%M")),
            (2, 1, 1, today_str, "Completed", "Total Chol: 228 mg/dL, HDL: 38 mg/dL, LDL: 152 mg/dL, Trig: 190 mg/dL", "Total Chol: <200, LDL: <100", "High", "Elevated LDL and borderline high triglycerides. Statin initiation indicated.", datetime.now().strftime("%Y-%m-%d %H:%M")),
            (3, 2, 1, today_str, "Processing", None, "< 5.7%", "Normal", "Sample collected and running automated analyzer.", None)
        ]
        for lr in lab_reports:
            cursor.execute("""
                INSERT INTO lab_reports (test_id, patient_id, doctor_id, order_date, sample_status, result_value, normal_range, interpretation, notes, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, lr)

        # 9. Wards and Beds
        wards = [
            ("Intensive Care Unit (ICU)", "ICU", "Floor 3, West Wing", 8),
            ("Cardiac Care Unit (CCU)", "ICU", "Floor 2, East Wing", 6),
            ("Emergency Trauma Bay", "Emergency", "Ground Floor", 10),
            ("Deluxe Private Suites", "Private", "Floor 4, North Wing", 12),
            ("General Medical Ward A", "General", "Floor 1, West Wing", 16)
        ]
        for w in wards:
            cursor.execute("""
                INSERT INTO wards (name, ward_type, floor, total_beds)
                VALUES (?, ?, ?, ?)
            """, w)

        # Generate Beds
        bed_configs = [
            (1, "ICU-01", "Occupied", 3, 4500.0),
            (1, "ICU-02", "Available", None, 4500.0),
            (1, "ICU-03", "Available", None, 4500.0),
            (1, "ICU-04", "Maintenance", None, 4500.0),
            (2, "CCU-01", "Occupied", 1, 4000.0),
            (2, "CCU-02", "Available", None, 4000.0),
            (3, "ER-B01", "Occupied", 5, 2000.0),
            (3, "ER-B02", "Available", None, 2000.0),
            (3, "ER-B03", "Reserved", None, 2000.0),
            (4, "PRV-401", "Occupied", 2, 3500.0),
            (4, "PRV-402", "Available", None, 3500.0),
            (4, "PRV-403", "Available", None, 3500.0),
            (5, "GEN-101", "Occupied", 4, 1200.0),
            (5, "GEN-102", "Available", None, 1200.0),
            (5, "GEN-103", "Available", None, 1200.0),
            (5, "GEN-104", "Available", None, 1200.0)
        ]
        for bc in bed_configs:
            cursor.execute("""
                INSERT INTO beds (ward_id, bed_number, status, current_patient_id, admitted_at, daily_rate)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (bc[0], bc[1], bc[2], bc[3], datetime.now().strftime("%Y-%m-%d %H:%M") if bc[2] == "Occupied" else None, bc[4]))

        # 10. Admissions
        admissions = [
            (3, 1, 1, (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"), None, "Unstable Angina / Subacute Coronary Episode", "Admitted"),
            (1, 5, 1, today_str, None, "Hypertensive Urgency with chest pain evaluation", "Admitted"),
            (2, 10, 2, (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), None, "Severe Migrainous Status & intractable nausea", "Admitted")
        ]
        for adm in admissions:
            cursor.execute("""
                INSERT INTO admissions (patient_id, bed_id, doctor_id, admission_date, discharge_date, initial_diagnosis, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, adm)

        # 11. Invoices & Items
        invoices = [
            ("INV-2026-00101", 1, 2100.0, 100.0, 105.0, 2105.0, 2105.0, "Paid", "Credit Card", "Full payment received via Visa"),
            ("INV-2026-00102", 2, 4800.0, 200.0, 240.0, 4840.0, 2000.0, "Partial", "Cash & Insurance", "Balance pending with BlueCross"),
            ("INV-2026-00103", 3, 9500.0, 500.0, 475.0, 9475.0, 0.0, "Unpaid", "Insurance Pre-Auth", "Pre-authorization approved, claim pending discharge")
        ]
        for inv in invoices:
            cursor.execute("""
                INSERT INTO invoices (invoice_number, patient_id, total_amount, discount, tax, net_amount, paid_amount, payment_status, payment_method, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, inv)
            inv_id = cursor.lastrowid
            
            # Add line items
            if inv[0] == "INV-2026-00101":
                items = [
                    (inv_id, "Specialist Cardiology Consultation", "Consultation", 1, 800.0, 800.0),
                    (inv_id, "Complete Blood Count (CBC)", "Lab", 1, 450.0, 450.0),
                    (inv_id, "Comprehensive Lipid Panel", "Lab", 1, 850.0, 850.0)
                ]
            else:
                items = [
                    (inv_id, "Emergency Admission & Bed (2 Days)", "Bed", 2, 2000.0, 4000.0),
                    (inv_id, "Attending Physician Daily Rounds", "Consultation", 2, 400.0, 800.0)
                ]
            for it in items:
                cursor.execute("""
                    INSERT INTO invoice_items (invoice_id, service_name, category, quantity, unit_price, amount)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, it)

        # 12. Insurance Claims
        insurance_claims = [
            (1, 1, "BlueCross BlueShield", "BCBS-99482110", 2105.0, 2105.0, "Settled", (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"), "Claim settled in full electronically"),
            (2, 2, "UnitedHealthcare Global", "UHC-44019283", 4840.0, 3500.0, "In Review", (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "Documentation under review by medical assessor"),
            (3, 3, "Aetna Health Advantage", "AET-77192800", 9475.0, 0.0, "Pending", today_str, "Pre-authorization submitted for ICU bed charges")
        ]
        for ic in insurance_claims:
            cursor.execute("""
                INSERT INTO insurance_claims (patient_id, invoice_id, provider_name, policy_number, claim_amount, approved_amount, status, claim_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ic)

        # 13. Blood Inventory & Donors
        blood_groups = [
            ("A+", 28, 15),
            ("A-", 12, 10),
            ("B+", 34, 15),
            ("B-", 9, 8),
            ("AB+", 16, 8),
            ("AB-", 4, 6),   # Critically low!
            ("O+", 45, 20),
            ("O-", 6, 12)    # Low stock!
        ]
        for bg in blood_groups:
            cursor.execute("""
                INSERT INTO blood_inventory (blood_group, units_available, min_units)
                VALUES (?, ?, ?)
            """, bg)

        donors = [
            ("Marcus Aurelius", "O+", "+1-800-555-0801", 34, "2026-08-15", 4, "Eligible"),
            ("Claire Bennett", "AB-", "+1-800-555-0802", 28, "2026-07-20", 2, "Eligible"),
            ("Darius Vance", "O-", "+1-800-555-0803", 41, "2026-09-01", 6, "Eligible"),
            ("Serena Williams", "A+", "+1-800-555-0804", 30, "2026-06-10", 3, "Eligible")
        ]
        for d in donors:
            cursor.execute("""
                INSERT INTO blood_donors (name, blood_group, phone, age, last_donated, units_donated, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, d)

        blood_requests = [
            (3, "O-", 2, "Emergency", "Approved", "Dr. Alexander Wright"),
            (2, "A+", 1, "Normal", "Pending", "Dr. Marcus Brody")
        ]
        for br in blood_requests:
            cursor.execute("""
                INSERT INTO blood_requests (patient_id, blood_group, units_needed, priority, status, requested_by)
                VALUES (?, ?, ?, ?, ?, ?)
            """, br)

        # 14. Emergency Cases
        emergencies = [
            ("Thomas Becker", 54, "Male", "Critical", "Acute Myocardial Infarction", 1, 1, "O+", "Sarah Becker (+1-800-555-0771)", "Under Treatment", "Patient arrived via EMT. ST-elevation evident in leads V1-V4. Thrombolytics prepped."),
            ("Priya Nair", 26, "Female", "Urgent", "Severe Multi-trauma / Road Accident", 4, 7, "B+", "Rohan Nair (+1-800-555-0772)", "Under Treatment", "Right tibia-fibula fracture, cranial laceration. Vitals stable."),
            ("Arthur Pendelton", 71, "Male", "Stable", "Acute Exacerbation of COPD", 2, 8, "A+", "Hospital Staff", "Under Treatment", "Nebulization and high-flow nasal cannula therapy initiated.")
        ]
        for em in emergencies:
            cursor.execute("""
                INSERT INTO emergency_cases (patient_name, age, gender, triage_priority, emergency_type, assigned_doctor_id, assigned_bed_id, blood_group, emergency_contact, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, em)

        # 15. Notifications
        notifications = [
            (1, "Critical Blood Stock Alert", "AB- blood units have dropped to 4 (below threshold 6). Initiate donor drive.", "urgent"),
            (1, "Pharmacy Low Stock Warning", "Amoxicillin and Azithromycin are below minimum safety buffer.", "warning"),
            (3, "New Patient Queue Update", "Patient James Wilson (Token A-19) is ready in consultation room 204.", "info"),
            (10, "Lab Report Ready", "Your Complete Blood Count (CBC) report is finalized and ready for review.", "success")
        ]
        for n in notifications:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, ?, ?, ?)
            """, n)

        # 16. Audit Logs
        audit_samples = [
            (1, "superadmin@smartcare.com", "Super Admin", "System Initialization", "System", "SmartCare platform initialized with secure relational database.", "127.0.0.1"),
            (2, "admin@smartcare.com", "Hospital Admin", "Bed Allocation", "Bed ICU-01", "Allocated Bed ICU-01 to Emergency Patient SC-P1003", "192.168.1.15"),
            (3, "doctor@smartcare.com", "Doctor", "Generated Digital Prescription", "Patient SC-P1001", "Prescribed Amlodipine 5mg and Atorvastatin 20mg", "192.168.1.24"),
            (8, "lab@smartcare.com", "Laboratory Staff", "Completed Lab Report", "Test CBC-01", "Results entered and verified for Patient SC-P1001", "192.168.1.30")
        ]
        for a in audit_samples:
            cursor.execute("""
                INSERT INTO audit_logs (user_id, user_email, role, action, target_entity, details, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, a)

        print("SmartCare Database seeded successfully with industry-grade demo records.")

if __name__ == "__main__":
    from .database import init_db
    init_db()
    seed_database()
