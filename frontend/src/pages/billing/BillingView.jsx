import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  CreditCard,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Printer,
  Shield,
  DollarSign,
  FileText,
  Trash2,
  X
} from 'lucide-react';

export const BillingView = () => {
  const [invoices, setInvoices] = useState([]);
  const [claims, setClaims] = useState([]);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'claims'
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);

  const { showToast } = useNotification();

  // Create Invoice Form
  const [newInvoicePatientId, setNewInvoicePatientId] = useState('');
  const [newInvoiceMethod, setNewInvoiceMethod] = useState('Cash');
  const [newInvoiceDiscount, setNewInvoiceDiscount] = useState(0);
  const [newInvoiceTax, setNewInvoiceTax] = useState(0);
  const [newInvoicePaid, setNewInvoicePaid] = useState(0);
  const [invoiceItems, setInvoiceItems] = useState([
    { service_name: 'Specialist Consultation Fee', category: 'Consultation', quantity: 1, unit_price: 800, amount: 800 }
  ]);

  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Credit Card');

  // Claim Form
  const [claimForm, setClaimForm] = useState({
    patient_id: '',
    invoice_id: '',
    provider_name: 'BlueCross BlueShield',
    policy_number: '',
    claim_amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchClaims();
    api.getPatients().then(p => {
      setPatients(p);
      if (p.length > 0) {
        setNewInvoicePatientId(p[0].id);
        setClaimForm(f => ({ ...f, patient_id: p[0].id }));
      }
    });
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const data = await api.getInvoices(params.toString());
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const data = await api.getInsuranceClaims();
      setClaims(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItemRow = () => {
    setInvoiceItems([...invoiceItems, { service_name: '', category: 'Consultation', quantity: 1, unit_price: 100, amount: 100 }]);
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...invoiceItems];
    updated[index][field] = val;
    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(updated[index].quantity) || 1;
      const p = parseFloat(updated[index].unit_price) || 0;
      updated[index].amount = q * p;
    }
    setInvoiceItems(updated);
  };

  const handleRemoveItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createInvoice({
        patient_id: parseInt(newInvoicePatientId),
        items: invoiceItems,
        discount: parseFloat(newInvoiceDiscount) || 0,
        tax: parseFloat(newInvoiceTax) || 0,
        payment_method: newInvoiceMethod,
        paid_amount: parseFloat(newInvoicePaid) || 0
      });
      showToast(`Invoice ${res.invoice_number} generated successfully`, 'success');
      setShowCreateModal(false);
      fetchInvoices();
    } catch (err) {
      showToast('Failed to create invoice', 'error');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.recordPayment(selectedInvoiceForPay.id, {
        amount: parseFloat(payAmount),
        payment_method: payMethod
      });
      showToast('Payment recorded successfully', 'success');
      setShowPayModal(false);
      fetchInvoices();
    } catch (err) {
      showToast('Payment processing failed', 'error');
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      await api.submitInsuranceClaim({
        patient_id: parseInt(claimForm.patient_id),
        invoice_id: parseInt(claimForm.invoice_id) || null,
        provider_name: claimForm.provider_name,
        policy_number: claimForm.policy_number,
        claim_amount: parseFloat(claimForm.claim_amount),
        notes: claimForm.notes
      });
      showToast('Insurance pre-authorization claim submitted', 'success');
      setShowClaimModal(false);
      fetchClaims();
    } catch (err) {
      showToast('Failed to file claim', 'error');
    }
  };

  const handleUpdateClaimStatus = async (id, status) => {
    try {
      await api.updateInsuranceClaim(id, { status });
      showToast(`Claim status updated to ${status}`, 'success');
      fetchClaims();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Billing, Invoicing & Insurance Management
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Itemized hospital bills (Consultation, Lab, Pharmacy, Beds), partial payments, and insurance claims
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setActiveTab('invoices')}
              style={{
                border: 'none',
                background: activeTab === 'invoices' ? '#ffffff' : 'transparent',
                color: activeTab === 'invoices' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              style={{
                border: 'none',
                background: activeTab === 'claims' ? '#ffffff' : 'transparent',
                color: activeTab === 'claims' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Insurance Claims ({claims.length})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Generate Invoice
          </button>
          <button
            onClick={() => setShowClaimModal(true)}
            className="btn btn-secondary"
          >
            <Shield size={16} color="#2563eb" /> File Insurance Claim
          </button>
        </div>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <>
          {/* Filter Bar */}
          <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Total Billed Ledger: <strong>${invoices.reduce((a, b) => a + b.net_amount, 0).toLocaleString()}</strong>
            </span>
          </div>

          {/* Invoices Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Patient Name</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading invoices...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td></tr>
                  ) : (
                    invoices.map(inv => {
                      const balance = inv.net_amount - inv.paid_amount;
                      let badge = 'badge-emerald';
                      if (inv.payment_status === 'Partial') badge = 'badge-amber';
                      if (inv.payment_status === 'Unpaid') badge = 'badge-rose';

                      return (
                        <tr key={inv.id}>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0f172a' }}>
                              {inv.invoice_number}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{inv.patient_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {inv.patient_code}</div>
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{inv.created_at?.split('T')[0] || 'Recent'}</td>
                          <td>
                            <strong>${inv.net_amount.toFixed(2)}</strong>
                          </td>
                          <td style={{ color: '#059669', fontWeight: 600 }}>
                            ${inv.paid_amount.toFixed(2)}
                          </td>
                          <td style={{ color: balance > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                            ${balance.toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge ${badge}`}>
                              {inv.payment_status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              {inv.payment_status !== 'Paid' && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoiceForPay(inv);
                                    setPayAmount(balance.toFixed(2));
                                    setShowPayModal(true);
                                  }}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                                >
                                  Collect
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedInvoiceForPrint(inv)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem', color: '#0d9488' }}
                                title="Print Formal Invoice"
                              >
                                <Printer size={13} /> Bill
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: INSURANCE CLAIMS */}
      {activeTab === 'claims' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Patient Name</th>
                  <th>Insurance Provider</th>
                  <th>Policy Number</th>
                  <th>Claim Amount</th>
                  <th>Approved Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Adjudication</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(c => {
                  let badge = 'badge-blue';
                  if (c.status === 'Approved' || c.status === 'Settled') badge = 'badge-emerald';
                  if (c.status === 'Rejected') badge = 'badge-rose';
                  if (c.status === 'In Review') badge = 'badge-amber';

                  return (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          CLM-{c.id.toString().padStart(4, '0')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {c.patient_code}</div>
                      </td>
                      <td>
                        <strong>{c.provider_name}</strong>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.policy_number}</td>
                      <td>
                        <strong>${c.claim_amount.toFixed(2)}</strong>
                      </td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>
                        ${c.approved_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td>
                        <span className={`badge ${badge}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {c.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateClaimStatus(c.id, 'In Review')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                            >
                              Review
                            </button>
                          )}
                          {c.status !== 'Approved' && c.status !== 'Settled' && (
                            <button
                              onClick={() => handleUpdateClaimStatus(c.id, 'Approved')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: '#059669' }}
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPayModal && selectedInvoiceForPay && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '480px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Record Payment Collection</h3>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Invoice: <strong>{selectedInvoiceForPay.invoice_number}</strong> • Patient: <strong>{selectedInvoiceForPay.patient_name}</strong>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="form-input"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="Credit Card">Credit Card / Debit Card</option>
                  <option value="Cash">Cash (Counter 3)</option>
                  <option value="UPI / Online">UPI / QR Code Transfer</option>
                  <option value="Insurance Cashless">Insurance Cashless Pre-Auth</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '700px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Generate Itemized Hospital Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Patient *</label>
                  <select
                    className="form-select"
                    value={newInvoicePatientId}
                    onChange={(e) => setNewInvoicePatientId(e.target.value)}
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={newInvoiceMethod}
                    onChange={(e) => setNewInvoiceMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Itemized Charges</span>
                  <button type="button" onClick={handleAddItemRow} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    <Plus size={12} /> Add Line Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {invoiceItems.map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Service name (e.g. ICU Bed, ECG, Lab)"
                        value={it.service_name}
                        onChange={(e) => handleItemChange(idx, 'service_name', e.target.value)}
                      />
                      <select
                        className="form-select"
                        value={it.category}
                        onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Lab">Laboratory</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Bed">Bed / Room</option>
                        <option value="Procedure">Procedure</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        className="form-input"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Price"
                        value={it.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={invoiceItems.length === 1}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts and Tax */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount ($)</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={newInvoiceDiscount}
                    onChange={(e) => setNewInvoiceDiscount(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tax ($)</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={newInvoiceTax}
                    onChange={(e) => setNewInvoiceTax(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Paid Upfront ($)</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={newInvoicePaid}
                    onChange={(e) => setNewInvoicePaid(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoiceForPrint && (
        <div className="modal-overlay" onClick={() => setSelectedInvoiceForPrint(null)}>
          <div
            className="card animate-fade-in"
            style={{ width: '720px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '2rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  SmartCare Super Specialty Hospital
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  GSTIN: 07AAAAA0000A1Z5 • 24/7 Patient Accounting Office • Desk 3
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>TAX INVOICE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#0d9488', fontWeight: 800 }}>
                  {selectedInvoiceForPrint.invoice_number}
                </div>
              </div>
            </div>

            {/* Patient details */}
            <div style={{ margin: '1.25rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.825rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Billed To:</span> <strong>{selectedInvoiceForPrint.patient_name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Patient Code:</span> <strong>{selectedInvoiceForPrint.patient_code}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Date:</span> <strong>{selectedInvoiceForPrint.created_at?.split('T')[0] || 'Today'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Payment Mode:</span> <strong>{selectedInvoiceForPrint.payment_method || 'Cash'}</strong>
              </div>
            </div>

            {/* Line items table */}
            <div className="table-container" style={{ margin: '1.25rem 0' }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoiceForPrint.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{it.service_name}</td>
                      <td><span className="badge badge-gray">{it.category}</span></td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${it.unit_price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${it.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Subtotal:</span> <strong>${selectedInvoiceForPrint.total_amount?.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Discount:</span> <span>-${selectedInvoiceForPrint.discount?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Tax / GST:</span> <span>+${selectedInvoiceForPrint.tax?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #0f172a', paddingTop: '0.4rem' }}>
                  <span>Net Amount:</span> <span>${selectedInvoiceForPrint.net_amount?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                  <span>Amount Paid:</span> <span>${selectedInvoiceForPrint.paid_amount?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 800 }}>
                  <span>Balance Due:</span> <span>${(selectedInvoiceForPrint.net_amount - selectedInvoiceForPrint.paid_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                <Printer size={14} /> Print Receipt
              </button>
              <button onClick={() => setSelectedInvoiceForPrint(null)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Insurance Claim Modal */}
      {showClaimModal && (
        <div className="modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '560px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>File Insurance Pre-Authorization Claim</h3>
              <button onClick={() => setShowClaimModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Patient *</label>
                <select
                  required
                  className="form-select"
                  value={claimForm.patient_id}
                  onChange={(e) => setClaimForm({ ...claimForm, patient_id: e.target.value })}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Insurance Provider *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. BlueCross, UnitedHealthcare"
                    value={claimForm.provider_name}
                    onChange={(e) => setClaimForm({ ...claimForm, provider_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Policy Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="POL-99482-A"
                    value={claimForm.policy_number}
                    onChange={(e) => setClaimForm({ ...claimForm, policy_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Claim Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="form-input"
                  placeholder="3500.00"
                  value={claimForm.claim_amount}
                  onChange={(e) => setClaimForm({ ...claimForm, claim_amount: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Pre-Authorization Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Clinical justification for inpatient stay or procedure..."
                  value={claimForm.notes}
                  onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowClaimModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Claim to TPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
