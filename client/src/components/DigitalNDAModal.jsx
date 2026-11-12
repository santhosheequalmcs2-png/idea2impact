import React, { useState } from 'react';
import { ShieldCheck, X, FileText, CheckCircle, Download, KeyRound } from 'lucide-react';

export default function DigitalNDAModal({ innovation, user, onClose, onSigned }) {
  const [signerName, setSignerName] = useState(user?.name || '');
  const [signerOrg, setSignerOrg] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleSign = (e) => {
    e.preventDefault();
    if (!signerName.trim() || !agreed) return;

    setSigned(true);
    // Persist signed NDA locally
    try {
      const signedList = JSON.parse(localStorage.getItem('i2i_signed_ndas') || '[]');
      if (!signedList.includes(innovation.id)) {
        signedList.push(innovation.id);
        localStorage.setItem('i2i_signed_ndas', JSON.stringify(signedList));
      }
    } catch {}

    if (onSigned) onSigned();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box nda-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="nda-header-title">
            <ShieldCheck size={20} className="text-cyan" />
            <div>
              <h3>Confidential Deal Room · Mutual NDA</h3>
              <p className="nda-subtitle">Legal Non-Disclosure & IP Protection Agreement</p>
            </div>
          </div>
          <button className="icon-btn small" onClick={onClose}><X size={16} /></button>
        </div>

        {!signed ? (
          <form onSubmit={handleSign} className="nda-form">
            <div className="nda-legal-box">
              <h4>MUTUAL NON-DISCLOSURE AGREEMENT (v2.4)</h4>
              <p className="legal-text">
                This Agreement is entered into by and between the Disclosing Party (<strong>{innovation.creator?.name || 'Creator'}</strong>)
                and the Receiving Party (<strong>{signerName || '[Authorized Evaluator]'}</strong>) regarding confidential disclosures for:
                <strong> “{innovation.title}”</strong>.
              </p>
              <div className="legal-clauses">
                <div className="clause-item">
                  <strong>1. Confidential Information:</strong> Covers all technical schematics, CAD models, source code, patent claims, financial models, and customer acquisition metrics.
                </div>
                <div className="clause-item">
                  <strong>2. Duty of Care & Non-Circumvention:</strong> The Receiving Party agrees not to reverse engineer, copy, or disclose confidential items to third parties for a period of 24 months.
                </div>
                <div className="clause-item">
                  <strong>3. Purpose Limitation:</strong> Information shall be used exclusively for evaluating investment, licensing, or technical collaboration.
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Signer Legal Full Name</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                />
              </div>
              <div className="form-group">
                <label>Entity / Venture Fund / Firm (Optional)</label>
                <input
                  type="text"
                  value={signerOrg}
                  onChange={(e) => setSignerOrg(e.target.value)}
                  placeholder="e.g. Horizon Ventures"
                />
              </div>
            </div>

            <div className="nda-consent-row">
              <input
                type="checkbox"
                id="nda-agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="nda-agree">
                I declare under penalty of perjury that I am authorized to execute this agreement and accept all terms of this Mutual Non-Disclosure Agreement.
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!agreed || !signerName.trim()}
              >
                <KeyRound size={15} /> Sign & Unlock Confidential Room
              </button>
            </div>
          </form>
        ) : (
          <div className="nda-unlocked-state">
            <div className="unlocked-badge-row">
              <CheckCircle size={32} className="text-emerald" />
              <div>
                <h4>Confidential Deal Room Unlocked</h4>
                <p className="text-muted">Digital Signature ID: <code>NDA-{innovation.id.slice(0, 8)}-{Date.now().toString(36).toUpperCase()}</code></p>
              </div>
            </div>

            <div className="confidential-assets-list">
              <h5>Unlocked Proprietary Materials:</h5>
              <div className="asset-download-card">
                <FileText size={18} className="text-cyan" />
                <div className="asset-info">
                  <strong>Full Technical Specification & Schematic Pack (v1.2)</strong>
                  <span className="text-muted">PDF · 14.8 MB · Cryptographically Timestamped</span>
                </div>
                <button
                  className="btn btn-ghost small"
                  onClick={() => alert('Simulated download: Full confidential schematic pack downloaded successfully.')}
                >
                  <Download size={14} /> Download
                </button>
              </div>

              <div className="asset-download-card">
                <FileText size={18} className="text-purple" />
                <div className="asset-info">
                  <strong>Cap Table & 3-Year Pro-Forma Financial Model</strong>
                  <span className="text-muted">XLSX · 2.4 MB · Includes unit margins & scenario modeling</span>
                </div>
                <button
                  className="btn btn-ghost small"
                  onClick={() => alert('Simulated download: Financial model downloaded successfully.')}
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>

            <div className="creator-direct-line">
              <span className="badge-tag">Creator Direct Line</span>
              <p>You may now message <strong>{innovation.creator?.name}</strong> directly via the discussion thread or collaboration proposals.</p>
            </div>

            <button className="btn btn-primary full-width" onClick={onClose}>
              Done & Return to Innovation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
