import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout & Modals
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HospitalChatbot } from './components/ai/HospitalChatbot';
import { ResourceFinderModal } from './components/resources/ResourceFinderModal';
import { MedicalSummarizerModal } from './components/ai/MedicalSummarizerModal';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { PatientList } from './pages/patients/PatientList';
import { DoctorList } from './pages/doctors/DoctorList';
import { AppointmentList } from './pages/appointments/AppointmentList';
import { SmartQueueView } from './pages/queue/SmartQueueView';
import { EMRManagement } from './pages/emr/EMRManagement';
import { LabManagement } from './pages/laboratory/LabManagement';
import { PharmacyManagement } from './pages/pharmacy/PharmacyManagement';
import { BedManagement } from './pages/beds/BedManagement';
import { EmergencyView } from './pages/emergency/EmergencyView';
import { BloodBankView } from './pages/blood_bank/BloodBankView';
import { BillingView } from './pages/billing/BillingView';
import { AnalyticsDashboard } from './pages/analytics/AnalyticsDashboard';
import { AuditLogView } from './pages/audit/AuditLogView';
import { PublicWebsite } from './pages/public/PublicWebsite';

const MainShell = () => {
  const { user, role, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showResourceFinder, setShowResourceFinder] = useState(false);
  const [showAISummarizer, setShowAISummarizer] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K for Resource Finder)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowResourceFinder(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When role changes, if active tab is not accessible, fallback to dashboard
  useEffect(() => {
    if (activeTab === 'analytics' && !['Super Admin', 'Hospital Admin', 'Accountant'].includes(role)) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'audit' && !['Super Admin', 'Hospital Admin'].includes(role)) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        gap: '1rem'
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(13, 148, 136, 0.5)',
          animation: 'pulse 1.8s infinite'
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>SC</span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          SmartCare Hospital System
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Initializing secure clinical workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  const handleResourceAction = (item) => {
    if (!item) return;
    if (typeof item === 'string') {
      setActiveTab(item);
      return;
    }
    const cat = item.category || '';
    if (cat.includes('Bed')) setActiveTab('beds');
    else if (cat.includes('Physician') || cat.includes('Doctor')) setActiveTab('doctors');
    else if (cat.includes('Blood')) setActiveTab('blood-bank');
    else if (cat.includes('Laboratory') || cat.includes('Lab')) setActiveTab('laboratory');
    else setActiveTab('dashboard');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'patients':
        return <PatientList onSelectPatient={() => setActiveTab('emr')} />;
      case 'doctors':
        return <DoctorList />;
      case 'appointments':
        return <AppointmentList />;
      case 'queue':
        return <SmartQueueView />;
      case 'emr':
        return <EMRManagement />;
      case 'laboratory':
        return <LabManagement />;
      case 'pharmacy':
        return <PharmacyManagement />;
      case 'beds':
        return <BedManagement />;
      case 'emergency':
        return <EmergencyView />;
      case 'blood-bank':
        return <BloodBankView />;
      case 'billing':
        return <BillingView />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'audit':
        return <AuditLogView />;
      default:
        return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Dynamic Collapsible Sidebar with Role-based ACL */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main App Canvas */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {/* Top Navigation Bar with Quick Role Switcher */}
        <Header
          onOpenResourceFinder={() => setShowResourceFinder(true)}
          onOpenAISummarizer={() => setShowAISummarizer(true)}
        />

        {/* Dynamic Route Canvas */}
        <main style={{
          flex: 1,
          padding: '1.75rem',
          overflowY: 'auto',
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto'
        }}>
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Global Hospital Chatbot */}
      <HospitalChatbot />

      {/* Modal Dialogs */}
      <ResourceFinderModal
        isOpen={showResourceFinder}
        onClose={() => setShowResourceFinder(false)}
        onSelectAction={handleResourceAction}
      />

      <MedicalSummarizerModal
        isOpen={showAISummarizer}
        onClose={() => setShowAISummarizer(false)}
      />
    </div>
  );
};

export default function App() {
  const [showPublicWebsite, setShowPublicWebsite] = useState(true);

  return (
    <AuthProvider>
      <NotificationProvider>
        {showPublicWebsite ? (
          <PublicWebsite onEnterPortal={() => setShowPublicWebsite(false)} />
        ) : (
          <MainShell />
        )}
      </NotificationProvider>
    </AuthProvider>
  );
}
