import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Users,
  Compass
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General Inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    // Simulate support ticket submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      try {
        soundFx.playSuccess();
      } catch (err) {}
    }, 600);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setTopic('General Inquiry');
    setSubject('');
    setMessage('');
    setSubmitted(false);
  };

  return (
    <main className="page wrap" style={{ maxWidth: '1080px', paddingBottom: '80px' }}>
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

      <div className="page-top" style={{ marginBottom: '36px' }}>
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="live-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5ce9c1' }} />
          <span>DIRECT SUPPORT & INQUIRIES</span>
        </div>
        <h1 style={{ fontSize: '36px', lineHeight: 1.2, margin: '8px 0 12px' }}>
          Get in touch with the <span className="gradient-text">IDEA2IMPACT team.</span>
        </h1>
        <p style={{ maxWidth: '640px', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6 }}>
          Have questions about protecting your invention, accessing private Deal Rooms, or collaborating with elite builders? Reach our support and partnerships team below.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '32px',
          alignItems: 'start'
        }}
        className="contact-layout"
      >
        {/* Left: Contact Form */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '28px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(92, 233, 193, 0.15)',
                  color: '#5ce9c1',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 18px'
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Message Received</h2>
              <p style={{ color: 'var(--muted)', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                Thank you for reaching out, <strong>{name}</strong>. Your inquiry regarding <em>"{subject || topic}"</em> has been logged. Our support desk will follow up at <strong>{email}</strong> within 24–48 hours.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
                style={{ minWidth: '160px' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                  Your Full Name
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                  Email Address
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                  Inquiry Topic
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Platform & Technical Support">Platform & Technical Support</option>
                    <option value="Creator & IP Licensing">Creator & IP Licensing</option>
                    <option value="Investor & Deal Room Inquiries">Investor & Deal Room Inquiries</option>
                    <option value="Talent & Builder Collaboration">Talent & Builder Collaboration</option>
                    <option value="Security & Confidentiality">Security & Confidentiality</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                  Subject Line
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your inquiry"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                Message & Details
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your inquiry, feedback, or support need in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    color: 'var(--text)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '8px',
                  minWidth: '170px'
                }}
              >
                {submitting ? 'Sending inquiry...' : (
                  <>
                    <Send size={15} /> Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right: Support Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: 'var(--cyan)' }}>
              <Clock size={18} />
              <h3 style={{ margin: 0, fontSize: '15px' }}>Support Availability</h3>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '13px', lineHeight: 1.6, color: 'var(--muted)' }}>
              Our distributed support team operates across US, European, and Asian time zones. We aim to respond to all creator and partner inquiries within 24–48 business hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={14} color="#5ce9c1" />
                <span>Confidential inquiries protected by Mutual NDAs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="var(--cyan)" />
                <span>Web support ticket logged directly to queue</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: 'var(--cyan)' }}>
              <Sparkles size={18} />
              <h3 style={{ margin: 0, fontSize: '15px' }}>Need Instant Guidance?</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.6, color: 'var(--muted)' }}>
              Explore AI Sana, our intelligent innovation copilot, ready 24/7 to analyze patents, generate pitch decks, or find matching builders.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link to="/ai-studio" className="btn btn-outline small" style={{ fontSize: '12px' }}>
                <Sparkles size={13} /> Open AI Sana Studio
              </Link>
              <Link to="/marketplace" className="btn btn-outline small" style={{ fontSize: '12px' }}>
                <Compass size={13} /> Browse Innovations
              </Link>
              <Link to="/talents" className="btn btn-outline small" style={{ fontSize: '12px' }}>
                <Users size={13} /> Meet Builders
              </Link>
            </div>
          </div>

          <div
            style={{
              background: 'var(--panel2)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
              <HelpCircle size={15} color="var(--cyan)" />
              <span>Looking for Legal Terms?</span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
              Read how we protect intellectual property and handle data across the platform:
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px' }}>
              <Link to="/privacy" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
