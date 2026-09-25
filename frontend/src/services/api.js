// API configuration
// Netlify/Vite uses VITE_API_URL from environment variables.
// Example:
// VITE_API_URL=https://hospital-management-mfcb.onrender.com

const ENV_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Remove trailing slash
const API_URL = ENV_API_URL.replace(/\/+$/, '');

// Add /api only if it is not already included
const API_BASE = API_URL.endsWith('/api')
  ? API_URL
  : `${API_URL}/api`;

function getAuthHeaders() {
  const token = localStorage.getItem('smartcare_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // If token invalid, clear and redirect to login if not already there
    // localStorage.removeItem('smartcare_token');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({
      detail: 'An unexpected error occurred'
    }));

    throw new Error(
      errorData.detail || `Request failed with status ${res.status}`
    );
  }

  return res.json();
}

export const api = {
  // =========================
  // Auth
  // =========================
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  demoLogin: (role) =>
    request(`/auth/demo-login/${encodeURIComponent(role)}`),

  register: (data) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () =>
    request('/auth/me'),

  getDemoRoles: () =>
    request('/auth/demo-roles'),

  // =========================
  // Analytics
  // =========================
  getAnalyticsSummary: () =>
    request('/analytics/summary'),

  // =========================
  // Patients
  // =========================
  getPatients: (params = '') =>
    request(`/patients${params ? `?${params}` : ''}`),

  getPatientDetail: (id) =>
    request(`/patients/${id}`),

  createPatient: (data) =>
    request('/patients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updatePatient: (id, data) =>
    request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // =========================
  // Doctors & Departments
  // =========================
  getDoctors: (params = '') =>
    request(`/doctors${params ? `?${params}` : ''}`),

  getDepartments: () =>
    request('/doctors/departments'),

  getDoctorDetail: (id) =>
    request(`/doctors/${id}`),

  updateDoctorStatus: (id, status) =>
    request(`/doctors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        available_status: status
      })
    }),

  // =========================
  // Appointments
  // =========================
  getAppointments: (params = '') =>
    request(`/appointments${params ? `?${params}` : ''}`),

  createAppointment: (data) =>
    request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAppointmentStatus: (id, status) =>
    request(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  // =========================
  // Queue
  // =========================
  getQueueBoard: (params = '') =>
    request(`/queue/board${params ? `?${params}` : ''}`),

  callNextPatient: (doctorId) =>
    request('/queue/call-next', {
      method: 'POST',
      body: JSON.stringify({
        doctor_id: doctorId
      })
    }),

  updateTokenStatus: (tokenId, status) =>
    request(`/queue/token/${tokenId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  // =========================
  // Medical Records & Prescriptions
  // =========================
  createMedicalRecord: (data) =>
    request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getPatientPrescriptions: (patientId) =>
    request(`/medical-records/prescriptions/${patientId}`),

  // =========================
  // Laboratory
  // =========================
  getLabCatalog: () =>
    request('/laboratory/catalog'),

  getLabReports: (params = '') =>
    request(`/laboratory/reports${params ? `?${params}` : ''}`),

  orderLabTest: (data) =>
    request('/laboratory/order', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateLabResult: (id, data) =>
    request(`/laboratory/reports/${id}/results`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // =========================
  // Pharmacy
  // =========================
  getMedicines: (params = '') =>
    request(`/pharmacy/medicines${params ? `?${params}` : ''}`),

  addMedicine: (data) =>
    request('/pharmacy/medicines', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getExpiryDashboard: () =>
    request('/pharmacy/expiry-dashboard'),

  dispenseMedication: (data) =>
    request('/pharmacy/dispense', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // =========================
  // Beds & Wards
  // =========================
  getBedMatrix: (wardType = '') =>
    request(`/beds/matrix${wardType ? `?ward_type=${wardType}` : ''}`),

  admitPatient: (data) =>
    request('/beds/admit', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  transferPatient: (data) =>
    request('/beds/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  dischargePatient: (data) =>
    request('/beds/discharge', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // =========================
  // Emergency
  // =========================
  getEmergencyCases: (params = '') =>
    request(`/emergency/cases${params ? `?${params}` : ''}`),

  createEmergencyCase: (data) =>
    request('/emergency/cases', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateEmergencyCase: (id, data) =>
    request(`/emergency/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // =========================
  // Blood Bank
  // =========================
  getBloodInventory: () =>
    request('/blood-bank/inventory'),

  getBloodDonors: () =>
    request('/blood-bank/donors'),

  addBloodDonor: (data) =>
    request('/blood-bank/donors', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getBloodRequests: () =>
    request('/blood-bank/requests'),

  issueBlood: (data) =>
    request('/blood-bank/issue', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // =========================
  // Billing & Insurance
  // =========================
  getInvoices: (params = '') =>
    request(`/billing/invoices${params ? `?${params}` : ''}`),

  createInvoice: (data) =>
    request('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  recordPayment: (id, data) =>
    request(`/billing/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getInsuranceClaims: () =>
    request('/billing/insurance/claims'),

  submitInsuranceClaim: (data) =>
    request('/billing/insurance/claims', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateInsuranceClaim: (id, data) =>
    request(`/billing/insurance/claims/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // =========================
  // AI & Chatbot
  // =========================
  summarizeMedicalReport: (raw_text, report_title) =>
    request('/ai/summarize-report', {
      method: 'POST',
      body: JSON.stringify({
        raw_text,
        report_title
      })
    }),

  chatWithHospitalBot: (message) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  // =========================
  // Resource Finder
  // =========================
  searchResources: (q = '') =>
    request(
      `/resources/search${q ? `?q=${encodeURIComponent(q)}` : ''}`
    ),

  // =========================
  // Audit & Notifications
  // =========================
  getAuditLogs: (role = '') =>
    request(`/audit/logs${role ? `?role=${role}` : ''}`),

  getNotifications: () =>
    request('/audit/notifications'),

  markNotificationRead: (id) =>
    request(`/audit/notifications/${id}/read`, {
      method: 'PUT'
    })
};
