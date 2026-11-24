import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, ShieldAlert, Award, FileCheck, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
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
          <Scale size={14} color="var(--cyan)" />
          <span>LEGAL TERMS & GOVERNANCE</span>
        </div>
        <h1 style={{ fontSize: '38px', lineHeight: 1.2, margin: '8px 0 12px' }}>
          Terms & <span className="gradient-text">Conditions</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '680px' }}>
          Effective Date: November 24, 2026. These Terms & Conditions govern your access to and use of IDEA2IMPACT, including marketplace participation, collaboration proposals, and confidential Deal Rooms.
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
            <span style={{ color: 'var(--cyan)' }}>1.</span> Acceptance of Terms
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px' }}>
            By creating an account, browsing listings, submitting proposals, or using any feature of IDEA2IMPACT ("the Platform"), you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions. If you do not agree to these terms, do not use the Platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>2.</span> 100% Intellectual Property Ownership
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', marginBottom: '12px' }}>
            Creators and inventors retain total, unencumbered ownership of all intellectual property submitted to IDEA2IMPACT:
          </p>
          <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '22px', fontSize: '14px' }}>
            <li>
              <strong>No Transfer by Listing:</strong> Publishing an innovation, prototype, or concept to the marketplace does not assign, transfer, or license your intellectual property to IDEA2IMPACT or to any third-party viewers.
            </li>
            <li>
              <strong>Provisional Patents & Documentation:</strong> You are encouraged to file provisional patent applications or register intellectual property before public disclosure where applicable.
            </li>
            <li>
              <strong>Limited Display License:</strong> By publishing public listings, you grant IDEA2IMPACT a limited, non-exclusive license solely to display your public materials to marketplace visitors as requested by you.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>3.</span> Mutual Non-Disclosure Agreement (v2.4)
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', marginBottom: '14px' }}>
            Access to protected documents within gated Deal Rooms (such as proprietary schematics, unit economics, and bill of materials) requires signing our bilateral Mutual NDA (v2.4):
          </p>
          <div style={{ background: 'var(--panel2)', padding: '20px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5ce9c1', marginBottom: '8px', fontWeight: 600 }}>
              <FileCheck size={16} /> Confidentiality Obligations
            </div>
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              Any user executing a Mutual NDA agrees in writing to hold disclosed information in strictest confidence and refrain from reproducing, reverse-engineering, or commercializing proprietary assets without express written consent. Platform agreement templates are provided for transactional convenience; users are advised to seek review from qualified legal counsel.
            </p>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>4.</span> Marketplace & Collaboration Disclaimers
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', marginBottom: '10px' }}>
            Please note the following critical disclaimers regarding platform transactions:
          </p>
          <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '22px', fontSize: '14px' }}>
            <li>
              <strong>Discovery & Demonstration Platform:</strong> IDEA2IMPACT is an innovation discovery and builder matchmaking platform. Micro-backing milestones, collaboration proposals, and indicative prices reflect initial negotiations.
            </li>
            <li>
              <strong>Not a Broker-Dealer:</strong> IDEA2IMPACT is not a registered securities broker-dealer, investment adviser, or legal escrow agent. All formal equity or licensing agreements must be consummated through independent legal counsel.
            </li>
            <li>
              <strong>Accurate Representations:</strong> Creators warrant that they are the rightful owners or authorized licensors of all listings, and that their innovations do not infringe upon any third-party patents or copyrights.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>5.</span> Prohibited Activities
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', marginBottom: '10px' }}>
            Users agree not to engage in any of the following:
          </p>
          <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '22px', fontSize: '14px' }}>
            <li>Submitting fraudulent, misleading, or stolen intellectual property.</li>
            <li>Attempting to bypass Deal Room access controls or download protected assets without authorization.</li>
            <li>Scraping or harvesting user profiles, emails, or innovation details using automated scripts.</li>
            <li>Harassing, spamming, or transmitting defamatory communications to platform members.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>6.</span> Limitation of Liability
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px' }}>
            To the maximum extent permitted by applicable law, IDEA2IMPACT and its officers, partners, and operators shall not be liable for any indirect, incidental, punitive, or consequential damages arising from your access to or inability to use the platform, including unauthorized third-party access to submissions.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--cyan)' }}>7.</span> Inquiries & Legal Notices
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px' }}>
            For notices, copyright infringement claims, or questions regarding these Terms & Conditions, please contact us via our <Link to="/contact" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>Contact & Support Page</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
