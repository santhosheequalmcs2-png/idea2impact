import React, { useState } from 'react';
import { Coffee, X, Heart, Shield, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function MicroBackingModal({ innovation, user, onClose, onPledged }) {
  const [tier, setTier] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [supporterName, setSupporterName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) : tier;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount <= 0) return;

    setLoading(true);
    try {
      // Post encouragement to comments thread on backend if authenticated
      if (user) {
        await api(`/innovations/${innovation.id}/comments`, {
          method: 'POST',
          body: JSON.stringify({
            body: `☕ Pledged $${finalAmount} in micro-backing support! "${message || 'Keep building, amazing invention!'}"`
          })
        }).catch(() => {});
      }

      setSuccess(true);
      if (onPledged) onPledged(finalAmount);
    } catch {
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box micro-backing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="backing-header-title">
            <Coffee size={20} className="text-gold" />
            <div>
              <h3>Back this Inventor & Project</h3>
              <p className="backing-subtitle">Support {innovation.creator?.name || 'the creator'} with milestone micro-grants</p>
            </div>
          </div>
          <button className="icon-btn small" onClick={onClose}><X size={16} /></button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="backing-form">
            <div className="tier-selection-grid">
              {[
                { amount: 5, icon: '☕', label: 'Coffee & Parts', desc: 'Sponsors basic sensor bench parts' },
                { amount: 25, icon: '🖨️', label: 'Rapid 3D Print', desc: 'Covers filament & PCB prototype runs' },
                { amount: 100, icon: '📜', label: 'Patent Patron', desc: 'Helps cover filing fees & IP search' }
              ].map((t) => (
                <div
                  key={t.amount}
                  className={`tier-card ${tier === t.amount && !customAmount ? 'active' : ''}`}
                  onClick={() => { setTier(t.amount); setCustomAmount(''); }}
                >
                  <div className="tier-icon">{t.icon}</div>
                  <div className="tier-amount">${t.amount}</div>
                  <div className="tier-label">{t.label}</div>
                  <div className="tier-desc">{t.desc}</div>
                </div>
              ))}
            </div>

            <div className="custom-amount-row">
              <label>Or custom amount ($):</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="custom-amount-input"
              />
            </div>

            <div className="form-group">
              <label>Your Name / Organization</label>
              <input
                type="text"
                required
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
                placeholder="e.g. Marcus Vance"
              />
            </div>

            <div className="form-group">
              <label>Encouraging Note for the Creator (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Love the sustainability angle, keep pushing!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="payment-security-note">
              <Shield size={14} className="text-emerald" />
              <span>Simulated Sandbox Checkout · 100% of funds allocated to creator's milestone wallet</span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !finalAmount}
              >
                <Heart size={15} /> Pledge ${finalAmount} to Creator
              </button>
            </div>
          </form>
        ) : (
          <div className="backing-success-state">
            <div className="success-crest">
              <Sparkles size={36} color="#10b981" />
            </div>
            <h4>Thank You for Backing Innovation!</h4>
            <p className="text-muted">
              You pledged <strong>${finalAmount}</strong> to support <strong>{innovation.creator?.name}</strong> on <em>"{innovation.title}"</em>.
            </p>
            <div className="receipt-box">
              <div className="receipt-row">
                <span>Receipt Number:</span>
                <code>I2I-TX-{Date.now().toString(36).toUpperCase()}</code>
              </div>
              <div className="receipt-row">
                <span>Allocated Milestone:</span>
                <span>Hardware Prototype & Bench Validation</span>
              </div>
              <div className="receipt-row">
                <span>Backer Recognition:</span>
                <span className="badge-tag">Bronze Backer</span>
              </div>
            </div>
            <button className="btn btn-primary full-width" onClick={onClose}>
              Awesome, Return to Innovation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
