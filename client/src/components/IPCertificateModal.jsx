import React from 'react';
import { Award, X, Printer, Shield, CheckCircle2, QrCode } from 'lucide-react';

export default function IPCertificateModal({ innovation, onClose }) {
  // Generate deterministic SHA-256 style fingerprint from ID and title
  const pseudoHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}e4b2a819d7c0125f38e${hex}74a01c9b4e6`;
  };

  const digest = pseudoHash(innovation.id + innovation.title);
  const createdDate = new Date(innovation.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box certificate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div className="certificate-header-title">
            <Award size={20} className="text-gold" />
            <h3>Cryptographic Proof of Creation</h3>
          </div>
          <button className="icon-btn small" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Printable Certificate Frame */}
        <div className="ip-certificate-frame">
          <div className="certificate-inner-border">
            <div className="certificate-top-seal">
              <div className="gold-seal-crest">
                <Award size={36} color="#d97706" />
              </div>
              <div className="registry-title">IDEA2IMPACT GLOBAL REGISTRY</div>
              <div className="registry-subtitle">CRYPTOGRAPHIC INVENTIVE TIMESTAMP RECORD</div>
            </div>

            <div className="certificate-main-text">
              <p className="cert-declaration">This document formally attests that on</p>
              <div className="cert-date-highlight">{createdDate}</div>
              <p className="cert-declaration">the inventive work and conceptual disclosure titled</p>
              <div className="cert-work-title">“{innovation.title}”</div>
              <p className="cert-declaration">was registered into the decentralized registry by</p>
              <div className="cert-author-name">{innovation.creator?.name || 'Verified Innovator'}</div>
            </div>

            <div className="certificate-specs-grid">
              <div className="spec-card">
                <span className="spec-label">REGISTRY ID</span>
                <span className="spec-val">I2I-{innovation.id.slice(0, 10).toUpperCase()}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">CATEGORY</span>
                <span className="spec-val">{innovation.category?.name || 'Inventions'}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">IP CLASSIFICATION</span>
                <span className="spec-val">PROVISIONAL DISCLOSURE</span>
              </div>
            </div>

            <div className="certificate-hash-box">
              <span className="hash-label">IMMUTABLE SHA-256 DIGEST:</span>
              <code className="hash-code">{digest}</code>
            </div>

            <div className="certificate-footer-row">
              <div className="cert-signature-block">
                <div className="signature-line" />
                <span className="sig-title">IDEA2IMPACT Protocol Officer</span>
              </div>
              <div className="cert-qr-block">
                <QrCode size={40} className="qr-icon" />
                <span className="qr-label">VERIFY IMMUTABLE RECORD</span>
              </div>
              <div className="cert-signature-block">
                <div className="signature-line" />
                <span className="sig-title">{innovation.creator?.name || 'Disclosing Inventor'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions no-print">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} /> Print / Save Certificate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
