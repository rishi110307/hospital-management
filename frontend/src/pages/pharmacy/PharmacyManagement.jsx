import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Trash2,
  Calendar,
  X
} from 'lucide-react';

export const PharmacyManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [expiryData, setExpiryData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'expiry', 'dispense'

  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useNotification();

  // Add Medicine Form
  const [newMed, setNewMed] = useState({
    name: '',
    generic_name: '',
    batch_number: '',
    manufacturer: '',
    expiry_date: '',
    stock_quantity: 100,
    min_stock_level: 20,
    unit_price: 10.0,
    category: 'General'
  });

  // Dispensing Form
  const [dispensePatientId, setDispensePatientId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    fetchMedicines();
    fetchExpiryDashboard();
    api.getPatients().then(p => {
      setPatients(p);
      if (p.length > 0) setDispensePatientId(p[0].id);
    });
  }, [search]);

  const fetchMedicines = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const data = await api.getMedicines(params.toString());
      setMedicines(data);
      if (data.length > 0 && !selectedMedId) setSelectedMedId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiryDashboard = async () => {
    try {
      const data = await api.getExpiryDashboard();
      setExpiryData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.addMedicine({
        ...newMed,
        stock_quantity: parseInt(newMed.stock_quantity),
        min_stock_level: parseInt(newMed.min_stock_level),
        unit_price: parseFloat(newMed.unit_price)
      });
      showToast('New medicine batch added to inventory', 'success');
      setShowAddModal(false);
      fetchMedicines();
      fetchExpiryDashboard();
    } catch (err) {
      showToast('Failed to add medicine', 'error');
    }
  };

  const handleAddToCart = () => {
    const med = medicines.find(m => m.id === parseInt(selectedMedId));
    if (!med) return;
    if (selectedQty > med.stock_quantity) {
      showToast(`Cannot dispense more than available stock (${med.stock_quantity})`, 'error');
      return;
    }

    const existingIndex = cartItems.findIndex(i => i.medicine_id === med.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += parseInt(selectedQty);
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        medicine_id: med.id,
        name: med.name,
        batch_number: med.batch_number,
        unit_price: med.unit_price,
        quantity: parseInt(selectedQty)
      }]);
    }
    showToast(`Added ${med.name} to dispensing queue`, 'info');
  };

  const handleRemoveFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleCompleteDispense = async () => {
    if (cartItems.length === 0) return;
    const totalAmount = cartItems.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);

    try {
      await api.dispenseMedication({
        patient_id: parseInt(dispensePatientId),
        items: cartItems,
        total_amount: totalAmount
      });
      showToast(`Medications dispensed successfully! Total: $${totalAmount.toFixed(2)}`, 'success');
      setCartItems([]);
      fetchMedicines();
      fetchExpiryDashboard();
    } catch (err) {
      showToast(err.message || 'Dispensing failed', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Pharmacy & Medication Management
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Central inventory tracking, medicine expiry alert board, and prescription dispensing
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                border: 'none',
                background: activeTab === 'inventory' ? '#ffffff' : 'transparent',
                color: activeTab === 'inventory' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Inventory ({medicines.length})
            </button>
            <button
              onClick={() => setActiveTab('expiry')}
              style={{
                border: 'none',
                background: activeTab === 'expiry' ? '#ffffff' : 'transparent',
                color: activeTab === 'expiry' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Expiry Alerts ({expiryData?.total_at_risk || 0})
            </button>
            <button
              onClick={() => setActiveTab('dispense')}
              style={{
                border: 'none',
                background: activeTab === 'dispense' ? '#ffffff' : 'transparent',
                color: activeTab === 'dispense' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Dispense Counter ({cartItems.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add Medicine
          </button>
        </div>
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <>
          <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              placeholder="Search by drug name, generic name, or batch number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Batch / Manufacturer</th>
                    <th>Category</th>
                    <th>Expiry Date</th>
                    <th>Stock Units</th>
                    <th>Unit Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading pharmacy stock...</td></tr>
                  ) : (
                    medicines.map(m => {
                      const isLow = m.stock_quantity <= m.min_stock_level;
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.generic_name || 'N/A'}</div>
                          </td>
                          <td>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{m.batch_number}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.manufacturer}</div>
                          </td>
                          <td>{m.category || 'General'}</td>
                          <td>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.expiry_date}</span>
                          </td>
                          <td>
                            <strong style={{ color: isLow ? '#dc2626' : '#0f172a' }}>
                              {m.stock_quantity}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}> (Min: {m.min_stock_level})</span>
                          </td>
                          <td>₹{m.unit_price.toFixed(2)}</td>
                          <td>
                            <span className={`badge badge-${isLow ? 'rose' : 'emerald'}`}>
                              {m.status}
                            </span>
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

      {/* TAB 2: MEDICINE EXPIRY DASHBOARD */}
      {activeTab === 'expiry' && expiryData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Warning */}
          <div style={{
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <AlertTriangle size={24} color="#e11d48" />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#9f1239' }}>
                Medicine Expiry & Risk Monitoring Center
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#be123c' }}>
                There are {expiryData.total_at_risk} batch(es) nearing expiration within 60 days. Immediate replacement or priority dispensing required.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Expiring in 30 Days */}
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#dc2626' }}>
                  Expiring in &lt; 30 Days ({expiryData.expiring_30_days.length})
                </span>
                <span className="badge badge-rose">Urgent</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {expiryData.expiring_30_days.map(m => (
                  <div key={m.id} style={{ backgroundColor: '#fff1f2', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: '#9f1239' }}>{m.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#be123c' }}>
                      Batch: {m.batch_number} • Expires: {m.expiry_date} • Qty: {m.stock_quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiring in 60 Days */}
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#d97706' }}>
                  Expiring in 31 - 60 Days ({expiryData.expiring_60_days.length})
                </span>
                <span className="badge badge-amber">Warning</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {expiryData.expiring_60_days.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No medicines expiring in this window.</div>
                ) : (
                  expiryData.expiring_60_days.map(m => (
                    <div key={m.id} style={{ backgroundColor: '#fffbeb', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 700, color: '#92400e' }}>{m.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#b45309' }}>
                        Batch: {m.batch_number} • Expires: {m.expiry_date} • Qty: {m.stock_quantity}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#7c3aed' }}>
                  Depleted Low Stock Items ({expiryData.low_stock_items.length})
                </span>
                <span className="badge badge-purple">Re-order</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {expiryData.low_stock_items.map(m => (
                  <div key={m.id} style={{ backgroundColor: '#faf5ff', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: '#6b21a8' }}>{m.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#7e22ce' }}>
                      Current Stock: <strong>{m.stock_quantity}</strong> (Threshold: {m.min_stock_level})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPENSE COUNTER */}
      {activeTab === 'dispense' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          {/* Add Item form */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Dispense Medicines to Patient</h3>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select Patient</label>
              <select
                className="form-select"
                value={dispensePatientId}
                onChange={(e) => setDispensePatientId(e.target.value)}
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select Medicine from Inventory</label>
              <select
                className="form-select"
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (${m.unit_price.toFixed(2)}) • Available: {m.stock_quantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Quantity to Issue</label>
              <input
                type="number"
                min={1}
                max={100}
                className="form-input"
                value={selectedQty}
                onChange={(e) => setSelectedQty(e.target.value)}
              />
            </div>

            <button
              onClick={handleAddToCart}
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-start' }}
            >
              <ShoppingCart size={15} /> Add to Dispense List
            </button>
          </div>

          {/* Cart summary */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Prescription Dispense Basket
              </h3>

              {cartItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Basket is empty. Add medicines from the left to dispense.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                  {cartItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.825rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#059669' }}>
                  ₹{cartItems.reduce((acc, i) => acc + (i.unit_price * i.quantity), 0).toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleCompleteDispense}
                disabled={cartItems.length === 0}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <CheckCircle size={16} /> Confirm Dispense & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '600px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Add New Medicine Batch</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Brand Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Lipitor"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Generic Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Atorvastatin"
                    value={newMed.generic_name}
                    onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Batch Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="BAT-2026-90"
                    value={newMed.batch_number}
                    onChange={(e) => setNewMed({ ...newMed, batch_number: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pfizer / Sun Pharma"
                    value={newMed.manufacturer}
                    onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={newMed.expiry_date}
                    onChange={(e) => setNewMed({ ...newMed, expiry_date: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Stock Units *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-input"
                    value={newMed.stock_quantity}
                    onChange={(e) => setNewMed({ ...newMed, stock_quantity: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="form-input"
                    value={newMed.unit_price}
                    onChange={(e) => setNewMed({ ...newMed, unit_price: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
