import React, { useState } from 'react';
import {
  Send,
  X,
  Users,
  Briefcase,
  DollarSign,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

export default function StartCollaborationModal({ talent, user, onClose, onSent }) {
  const [role, setRole] = useState(talent?.role || 'Builder');
  const [projectTitle, setProjectTitle] = useState('');
  const [compensation, setCompensation] = useState('Equity / Milestone Blend');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!talent) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectTitle.trim() || !message.trim()) return;

    soundFx.playTap();
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setSent(true);
      soundFx.playSuccess();
      if (onSent) onSent();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box small-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="collab-title-row">
            <Users size={18} className="text-cyan mr-2" />
            <div>
              <h3>Start Collaboration</h3>
              <p className="sub">Propose a venture partnership with {talent.name}</p>
            </div>
          </div>
          <button className="icon-btn small" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="collab-draft-form">
            <div className="talent-summary-badge">
              <div className="talent-badge-avatar">
                {talent.avatar ? (
                  <img src={talent.avatar} alt={talent.name} />
                ) : (
                  talent.name?.slice(0, 1) || 'U'
                )}
              </div>
              <div>
                <b>{talent.name}</b>
                <span>{talent.role} · {talent.title || 'Verified Practitioner'}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Innovation / Project Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Bio-Photonic Optical Scanner"
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Engagement Scope</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Builder">Hardware / Software Builder</option>
                  <option value="Co-Founder">Technical Co-Founder</option>
                  <option value="Investor">Seed / Syndicate Investor</option>
                  <option value="Patent Professional">Patent / IP Advisor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Proposed Terms</label>
                <select value={compensation} onChange={e => setCompensation(e.target.value)}>
                  <option value="Equity / Milestone Blend">Equity + Milestone Blend</option>
                  <option value="SAFE Investment Round">SAFE Investment Tranche</option>
                  <option value="Hourly / Retainer Contract">Direct Retainer Contract</option>
                  <option value="Licensing Royalty">Licensing Royalty</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Collaboration Proposal Note</label>
              <textarea
                rows={4}
                required
                placeholder="Outline what you are building, the specific milestone you need them for, and why they are a strong fit..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline small" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary small" disabled={sending}>
                {sending ? 'Sending...' : 'Send Collaboration Invitation'} <Send size={14} />
              </button>
            </div>
          </form>
        ) : (
          <div className="collab-success-state">
            <div className="success-crest">
              <CheckCircle size={44} className="text-emerald" />
            </div>
            <h3>Collaboration Invitation Dispatched!</h3>
            <p>
              Your proposal has been sent to <b>{talent.name}</b>. You can track ongoing communication in the <b>Messages</b> hub.
            </p>
            <button className="btn btn-primary small" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
