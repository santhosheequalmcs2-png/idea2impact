import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, FileText, Eye, CheckCircle, Mail } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="page wrap" style={{ maxWidth: '900px', paddingBottom: '90px' }}>
      <Link
        to="/"
        className="back-link"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
          color: 'var(--muted)',
          fontSize: '13px'
        }}
      >
        <ArrowLeft size={14} /> Back to Home
      </Link>

      <div className="page-top" style={{ marginBottom: '40px' }}>
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Shield size={14} color="var(--cyan)" />
          <span>LEGAL & COMPLIANCE</span>
        </div>
        <h1 style={{ fontSize: '38px', lineHeight: 1.2, margin: '8px 0 12px' }}>
          Privacy <span className="gradient-text">Policy</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '680px' }}>
          Effective Date: November 24, 2026. This Privacy Policy details how IDEA2IMPACT collects, protects, and handles personal information and proprietary innovation materials across our platform.
        </p>
      </div>

      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '36px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>1.</span> Commitment to Innovators & Confidentiality
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px' }}>
            IDEA2IMPACT is an international innovation exchange connecting visionary creators, robotics architects, and angel funds. Because our users frequently share cutting-edge inventions, provisional patent drafts, and proprietary technical concepts, protecting intellectual property and maintaining strict confidentiality is foundational to our operations.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>2.</span> Information We Collect
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', marginBottom: '14px' }}>
            We only collect information necessary to operate the platform, provide collaborative services, and verify accounts:
          </p>
          <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '22px', fontSize: '14px' }}>
            <li>
              <strong>Account & Profile Information:</strong> Full name, verified email address, hashed passwords, professional bio, skill tags, and location when you register as a Creator, Builder, or Investor.
            </li>
            <li>
              <strong>Innovation Listings:</strong> Titles, descriptions, category classifications, indicative prices, public media, and licensing preferences published to the marketplace.
            </li>
            <li>
              <strong>Deal Room & Confidential Materials:</strong> Unit economics, bill of materials (BOM), CAD schematics, and proprietary pitch decks shared within gated Deal Rooms under executed bilateral Mutual NDAs.
            </li>
            <li>
              <strong>Platform Communications:</strong> Proposals, collaboration messages, and direct discussions initiated between innovators and partners.
            </li>
            <li>
              <strong>Telemetry & Usage Data:</strong> Session state, feature interaction logs, and voluntary system diagnostic reports used to enhance platform performance and stability.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>3.</span> How We Protect Intellectual Property & NDAs
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', marginBottom: '12px' }}>
            Creators retain 100% of their intellectual property rights. To safeguard unreleased inventions:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '12px' }}>
            <div style={{ background: 'var(--panel2)', padding: '18px', borderRadius: '10px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5ce9c1', marginBottom: '6px', fontWeight: 600 }}>
                <Lock size={15} /> Gated Deal Rooms
              </div>
              <p style={{ fontSize: '13px', margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
                Confidential disclosures are shielded behind authenticated Deal Room gates and require mutual approval before viewing.
              </p>
            </div>
            <div style={{ background: 'var(--panel2)', padding: '18px', borderRadius: '10px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)', marginBottom: '6px', fontWeight: 600 }}>
                <FileText size={15} /> Bilateral Mutual NDAs
              </div>
              <p style={{ fontSize: '13px', margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
                Unlocking protected documentation requires signing our binding Mutual Non-Disclosure Agreement (v2.4) under penalty of perjury.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>4.</span> How Information Is Used
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px' }}>
            Your information is used solely to provide marketplace matching, facilitate collaboration workflows, process requests, maintain platform security, and deliver customer support. We do not sell your personal data or your proprietary project concepts to advertisers, data brokers, or third-party AI training pipelines.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>5.</span> Cookies & Local Storage
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px' }}>
            We only employ strictly necessary local browser storage mechanisms to preserve your authentication session (<code>i2i_token</code>), your active user profile, theme preference (Dark or Light Mode), and accessibility sound preferences. We do not use intrusive cross-site tracking cookies.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>6.</span> Your Privacy Rights & Choices
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', marginBottom: '10px' }}>
            Regardless of your jurisdiction, you have full control over your data on IDEA2IMPACT:
          </p>
          <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '22px', fontSize: '14px' }}>
            <li><strong>Access & Export:</strong> View and export your innovation listings and account profile directly from the Dashboard.</li>
            <li><strong>Correction & Modification:</strong> Update your listings, pricing, and profile details anytime.</li>
            <li><strong>Deletion:</strong> Remove your innovations or delete your account by reaching out to our support team.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>7.</span> Inquiries & Contact
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px' }}>
            If you have questions about our privacy practices, IP governance, or data handling, please submit an inquiry via our dedicated <Link to="/contact" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>Contact & Support Page</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
