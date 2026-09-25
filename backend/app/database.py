import sqlite3
import os
from contextlib import contextmanager
from .config import DATABASE_PATH

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            phone TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 2. Departments
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            code TEXT UNIQUE NOT NULL,
            head_doctor TEXT,
            floor TEXT,
            description TEXT,
            icon TEXT
        );
        """)

        # 3. Doctors
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            full_name TEXT NOT NULL,
            specialization TEXT NOT NULL,
            department_id INTEGER,
            qualification TEXT,
            experience_years INTEGER DEFAULT 0,
            consultation_fee REAL DEFAULT 500.0,
            schedule_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri',
            time_slots TEXT DEFAULT '09:00 AM - 01:00 PM, 05:00 PM - 08:00 PM',
            available_status TEXT DEFAULT 'Available',
            room_number TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
        );
        """)

        # 4. Patients
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            patient_code TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            blood_group TEXT,
            phone TEXT NOT NULL,
            email TEXT,
            emergency_contact TEXT,
            address TEXT,
            allergies TEXT,
            medical_history TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        """)

        # 5. Appointments
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            token_number TEXT,
            status TEXT DEFAULT 'Confirmed',
            symptoms TEXT,
            reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        );
        """)

        # 6. Queue Tokens
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS queue_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_id INTEGER,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            token_code TEXT NOT NULL,
            department_name TEXT,
            status TEXT DEFAULT 'Waiting', -- Waiting, Calling, Serving, Completed, Skipped
            estimated_wait_minutes INTEGER DEFAULT 15,
            called_at TIMESTAMP,
            served_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        );
        """)

        # 7. Medical Records (EMR)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            visit_date TEXT NOT NULL,
            diagnosis TEXT NOT NULL,
            symptoms TEXT,
            clinical_notes TEXT,
            bp TEXT,
            pulse TEXT,
            temperature TEXT,
            weight TEXT,
            follow_up_date TEXT,
            attachments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        );
        """)

        # 8. Prescriptions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medical_record_id INTEGER,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            medicines_json TEXT NOT NULL,
            instructions TEXT,
            status TEXT DEFAULT 'Active', -- Active, Dispensed, Expired
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE SET NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        );
        """)

        # 9. Medicines (Pharmacy)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            generic_name TEXT,
            batch_number TEXT NOT NULL,
            manufacturer TEXT,
            expiry_date TEXT NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            min_stock_level INTEGER DEFAULT 20,
            unit_price REAL NOT NULL,
            category TEXT,
            status TEXT DEFAULT 'In Stock'
        );
        """)

        # 10. Pharmacy Transactions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS pharmacy_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prescription_id INTEGER,
            patient_id INTEGER NOT NULL,
            dispensed_by TEXT,
            total_amount REAL NOT NULL,
            payment_status TEXT DEFAULT 'Paid',
            items_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
        """)

        # 11. Lab Tests Catalog
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS lab_tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            normal_range TEXT,
            unit TEXT,
            sample_type TEXT,
            turnaround_hours INTEGER DEFAULT 24
        );
        """)

        # 12. Lab Reports
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS lab_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER,
            order_date TEXT NOT NULL,
            sample_status TEXT DEFAULT 'Ordered', -- Ordered, Sample Collected, Processing, Completed
            result_value TEXT,
            normal_range TEXT,
            interpretation TEXT, -- Normal, Low, High, Critical
            notes TEXT,
            completed_at TEXT,
            file_url TEXT,
            FOREIGN KEY (test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
        );
        """)

        # 13. Wards
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS wards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ward_type TEXT NOT NULL, -- General, Private, Semi-Private, ICU, Emergency
            floor TEXT NOT NULL,
            total_beds INTEGER DEFAULT 10
        );
        """)

        # 14. Beds
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS beds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ward_id INTEGER NOT NULL,
            bed_number TEXT NOT NULL,
            status TEXT DEFAULT 'Available', -- Available, Occupied, Reserved, Maintenance
            current_patient_id INTEGER,
            admitted_at TIMESTAMP,
            daily_rate REAL DEFAULT 1500.0,
            FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE,
            FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL
        );
        """)

        # 15. Admissions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS admissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            bed_id INTEGER NOT NULL,
            doctor_id INTEGER,
            admission_date TEXT NOT NULL,
            discharge_date TEXT,
            initial_diagnosis TEXT,
            discharge_summary TEXT,
            status TEXT DEFAULT 'Admitted', -- Admitted, Discharged, Transferred
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
        );
        """)

        # 16. Invoices
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            patient_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            discount REAL DEFAULT 0.0,
            tax REAL DEFAULT 0.0,
            net_amount REAL NOT NULL,
            paid_amount REAL DEFAULT 0.0,
            payment_status TEXT DEFAULT 'Unpaid', -- Unpaid, Partial, Paid
            payment_method TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
        """)

        # 17. Invoice Items
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            service_name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            unit_price REAL NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
        """)

        # 18. Insurance Claims
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS insurance_claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            invoice_id INTEGER,
            provider_name TEXT NOT NULL,
            policy_number TEXT NOT NULL,
            claim_amount REAL NOT NULL,
            approved_amount REAL DEFAULT 0.0,
            status TEXT DEFAULT 'Pending', -- Pending, In Review, Approved, Rejected, Settled
            claim_date TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
        );
        """)

        # 19. Blood Inventory
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blood_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            blood_group TEXT UNIQUE NOT NULL,
            units_available INTEGER DEFAULT 0,
            min_units INTEGER DEFAULT 10,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 20. Blood Donors
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blood_donors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            blood_group TEXT NOT NULL,
            phone TEXT NOT NULL,
            age INTEGER,
            last_donated TEXT,
            units_donated INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Eligible'
        );
        """)

        # 21. Blood Requests
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blood_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            blood_group TEXT NOT NULL,
            units_needed INTEGER NOT NULL,
            priority TEXT DEFAULT 'Normal', -- Normal, Emergency
            status TEXT DEFAULT 'Pending', -- Pending, Approved, Issued, Cancelled
            requested_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
        );
        """)

        # 22. Emergency Cases
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS emergency_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            triage_priority TEXT NOT NULL, -- Critical, Urgent, Stable
            emergency_type TEXT NOT NULL,
            assigned_doctor_id INTEGER,
            assigned_bed_id INTEGER,
            blood_group TEXT,
            emergency_contact TEXT,
            status TEXT DEFAULT 'Under Treatment', -- Under Treatment, Admitted, Discharged, Deceased
            notes TEXT,
            arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
            FOREIGN KEY (assigned_bed_id) REFERENCES beds(id) ON DELETE SET NULL
        );
        """)

        # 23. Notifications
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info', -- info, warning, success, urgent
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 24. Audit Logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_email TEXT,
            role TEXT,
            action TEXT NOT NULL,
            target_entity TEXT,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
