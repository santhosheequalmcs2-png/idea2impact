// client/src/components/PitchDeckModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function PitchDeckModal({ isOpen, onClose, innovation, onAnalyzeInStudio }) {
  const [slides, setSlides] = useState([]);
  const [deckMeta, setDeckMeta] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && innovation?.id) {
      loadDeck();
    }
  }, [isOpen, innovation?.id]);

  const loadDeck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api(`/innovations/${innovation.id}/pitch-deck`, {
        method: 'POST'
      });
      if (res.slides && res.slides.length > 0) {
        setSlides(res.slides);
      }
      setDeckMeta(res.deck || null);
      setActiveSlide(0);
    } catch (err) {
      console.error('Failed to load pitch deck:', err);
      setError(err.message || 'Could not generate pitch deck. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const copyMarkdown = () => {
    if (!slides.length) return;
    const text = `# ${innovation?.title || 'Executive Pitch Deck'}
Category: ${deckMeta?.category || innovation?.category?.name || 'Innovation'}
Founder: ${deckMeta?.creator || innovation?.creator?.name || 'Founder'}

${slides.map((s, idx) => `## Slide ${idx + 1}: ${s.title}
*${s.subtitle}*

${(s.bullets || []).map(b => `- ${b}`).join('\n')}
`).join('\n---\n\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const currentSlide = slides[activeSlide] || null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content pitch-deck-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(112,65,199,0.2), rgba(37,99,255,0.2))',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--cyan)'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>5-Slide Executive Pitch Deck</h2>
              <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                {innovation?.title} · Grounded in verified platform record
              </small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 14px', color: 'var(--cyan)' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Synthesizing 5-Slide Pitch Deck...</p>
            <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Evaluating problem statement, moat, and execution milestones</small>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <AlertCircle size={32} color="#f43f5e" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#f43f5e', fontWeight: 600, margin: '0 0 14px' }}>{error}</p>
            <button className="btn btn-outline small" onClick={loadDeck}>
              <RefreshCw size={13} /> Retry Generation
            </button>
          </div>
        ) : currentSlide ? (
          <div>
            {/* Slide Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--line)',
              marginBottom: '20px'
            }}>
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: activeSlide === idx ? 700 : 500,
                    background: activeSlide === idx
                      ? 'linear-gradient(135deg, rgba(112,65,199,0.2), rgba(37,99,255,0.25))'
                      : 'var(--panel2)',
                    border: '1px solid',
                    borderColor: activeSlide === idx ? 'var(--cyan)' : 'var(--line)',
                    color: activeSlide === idx ? 'var(--cyan)' : 'var(--muted)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all .15s ease'
                  }}
                >
                  Slide {idx + 1}
                </button>
              ))}
            </div>

            {/* Active Slide Card */}
            <div style={{
              background: 'var(--panel2)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '28px 32px',
              minHeight: '260px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '24px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--muted)',
                letterSpacing: '.1em'
              }}>
                SLIDE {activeSlide + 1} OF 5
              </div>

              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: 'var(--cyan)',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                marginBottom: '6px'
              }}>
                {innovation?.category?.name || 'Venture'}
              </div>

              <h3 style={{ fontSize: '22px', margin: '0 0 6px 0', fontWeight: 800 }}>
                {currentSlide.title}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px 0', fontStyle: 'italic' }}>
                {currentSlide.subtitle}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(currentSlide.bullets || []).map((bullet, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--cyan)',
                      marginTop: '8px',
                      flexShrink: 0
                    }} />
                    <span style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text)' }}>
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Pagination Arrows */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px'
            }}>
              <button
                className="btn btn-outline small"
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                Slide {activeSlide + 1} / {slides.length}
              </span>

              <button
                className="btn btn-outline small"
                disabled={activeSlide === slides.length - 1}
                onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '22px',
          paddingTop: '16px',
          borderTop: '1px solid var(--line)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline small" onClick={copyMarkdown} disabled={!slides.length}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Deck!' : 'Copy Deck Markdown'}</span>
            </button>
            <button className="btn btn-outline small" onClick={handlePrint} disabled={!slides.length}>
              <Printer size={14} />
              <span>Print / Export PDF</span>
            </button>
          </div>

          {onAnalyzeInStudio && (
            <button
              className="btn btn-primary small"
              onClick={() => {
                onClose();
                onAnalyzeInStudio(innovation.id);
              }}
            >
              <Sparkles size={14} />
              <span>Deep Dive in AI Sana Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
