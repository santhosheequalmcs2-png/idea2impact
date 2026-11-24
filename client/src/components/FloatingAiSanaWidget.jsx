// client/src/components/FloatingAiSanaWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  X,
  Send,
  Square,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Paperclip
} from 'lucide-react';
import { streamAiChat, checkAiServiceStatus } from '../services/api';
import { soundFx } from '../services/soundFx';

export default function FloatingAiSanaWidget({ activeInnovation = null }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on full studio routes
  const isStudioPage = location.pathname === '/ai-sana' || location.pathname === '/ai-studio';

  const [isOpen, setIsOpen] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm **AI Sana**. How can I help evaluate or accelerate your innovation today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [phaseText, setPhaseText] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Position state for dragging
  const [pos, setPos] = useState({ x: 0, y: 0 }); // offset from bottom-right (0, 0)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const hasMovedRef = useRef(false);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAiServiceStatus().then(st => setServiceStatus(st)).catch(() => {});
  }, []);

  // Detect innovation ID from URL if on detail page (/innovation/:id or /innovations/:id)
  const innovationMatch = location.pathname.match(/\/innovations?\/([a-zA-Z0-9_-]+)/);
  const detectedInnovationId = activeInnovation?.id || (innovationMatch ? innovationMatch[1] : null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, phaseText]);

  if (isStudioPage) return null;

  // Context-aware quick prompt buttons
  const quickPrompts = detectedInnovationId ? [
    { label: '🛡️ IP & Novelty Scan', prompt: 'What is the preliminary patent novelty and prior-art risk for this project?' },
    { label: '📊 Market Sizing (TAM)', prompt: 'Calculate the TAM, SAM, and addressable enterprise opportunity for this venture.' },
    { label: '📑 1-Min Pitch Deck', prompt: 'Draft a 5-slide executive investor pitch deck for this project.' }
  ] : [
    { label: '💡 Evaluate My Idea', prompt: 'Please evaluate my startup concept using your calibrated 7-section rubric.' },
    { label: '📊 Market Sizing (TAM)', prompt: 'How do I calculate TAM, SAM, and SOM for an early-stage startup?' },
    { label: '🛡️ Patent Strategy', prompt: 'What is the recommended provisional patent filing timeline for a hardware prototype?' }
  ];

  const startDrag = (clientX, clientY) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: pos.x,
      startY: pos.y
    };
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStartRef.current.mouseX;
    const dy = clientY - dragStartRef.current.mouseY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMovedRef.current = true;
    }
    setPos({
      x: Math.max(-window.innerWidth + 320, Math.min(20, dragStartRef.current.startX + dx)),
      y: Math.max(-window.innerHeight + 400, Math.min(20, dragStartRef.current.startY + dy))
    });
  };

  const endDrag = () => {
    isDraggingRef.current = false;
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') && !e.target.closest('.ai-orb-drag-handle') && !e.target.closest('.ai-floating-btn')) return;
    startDrag(e.clientX, e.clientY);

    const handleMouseMove = (moveEvent) => {
      moveDrag(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    if (e.target.closest('button') && !e.target.closest('.ai-orb-drag-handle') && !e.target.closest('.ai-floating-btn')) return;
    startDrag(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (touch && isDraggingRef.current) {
      moveDrag(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  const handleButtonClick = (e) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      return;
    }
    setIsOpen(true);
    soundFx.playTap();
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
    soundFx.playTap();
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
    setPhaseText('');
    soundFx.playTap();
  };

  const sendMessage = async (overridePrompt = null) => {
    const textToSend = (overridePrompt || input).trim();
    if (!textToSend || streaming) return;

    soundFx.playTap();
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: textToSend },
      { id: assistantMsgId, role: 'assistant', content: '' }
    ]);
    setInput('');
    setStreaming(true);
    setPhaseText('Thinking...');

    abortControllerRef.current = new AbortController();

    const historyPayload = messages
      .filter(m => m.id !== 'welcome')
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      await streamAiChat({
        prompt: textToSend,
        innovationId: detectedInnovationId || undefined,
        mode: 'fast', // Fast mode default for floating widget
        fastMode: true,
        history: historyPayload,
        signal: abortControllerRef.current.signal,
        onPhase: (evt) => {
          setPhaseText(evt.message || 'Analyzing...');
        },
        onChunk: (chunk) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMsgId) {
              return { ...m, content: m.content + chunk };
            }
            return m;
          }));
        },
        onError: (err) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMsgId && !m.content) {
              return { ...m, content: `⚠️ ${err.message || 'AI Sana was interrupted.'}` };
            }
            return m;
          }));
        },
        onDone: () => {
          setStreaming(false);
          setPhaseText('');
          soundFx.playSuccess();
        }
      });
    } catch {
      setStreaming(false);
      setPhaseText('');
    }
  };

  return (
    <div
      className="ai-floating-widget"
      style={{
        position: 'fixed',
        bottom: `${28 - pos.y}px`,
        right: `${28 - pos.x}px`,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        touchAction: 'none',
        pointerEvents: 'none'
      }}
    >
      {/* Minimized Glowing AI Sana Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleButtonClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          title="Open AI Sana Assistant (Drag to reposition)"
          className="ai-floating-btn"
          style={{
            position: 'relative',
            bottom: 'auto',
            right: 'auto',
            pointerEvents: 'auto',
            boxShadow: '0 8px 30px rgba(112,65,199,0.4), 0 0 20px rgba(37,99,255,0.35)',
            cursor: isDraggingRef.current ? 'grabbing' : 'pointer'
          }}
        >
          <div className="ai-btn-pulse" />
          <img src="/brand-icon.png" alt="AI Sana" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
          <span>AI Sana</span>
          <span className="ai-btn-badge" style={{ background: 'rgba(255,255,255,0.2)' }}>
            {serviceStatus?.configured ? 'Gemini 2.0 Flash' : 'AI Sana'}
          </span>
        </button>
      )}

      {/* Expanded Mini-Chat Drawer */}
      {isOpen && (
        <div
          style={{
            width: 'min(380px, calc(100vw - 32px))',
            height: 'min(540px, calc(100vh - 100px))',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            pointerEvents: 'auto'
          }}
        >
          {/* Header (Drag Handle) */}
          <div
            className="ai-orb-drag-handle"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--panel2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-mark" style={{ width: '26px', height: '26px' }}>
                <img src="/brand-icon.png" alt="AI Sana" className="brand-mark-img" />
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b style={{ fontSize: '12.5px', display: 'block' }}>AI Sana</b>
                  <span style={{
                    fontSize: '9px',
                    background: serviceStatus?.configured ? 'rgba(84,230,245,0.12)' : 'rgba(245,158,11,0.15)',
                    color: serviceStatus?.configured ? 'var(--cyan)' : '#f59e0b',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {serviceStatus?.configured ? 'Gemini 2.0 Flash' : 'Heuristic Mode'}
                  </span>
                </div>
                <small style={{ fontSize: '9.5px', color: 'var(--muted)' }}>
                  {detectedInnovationId ? 'Grounded in Active Innovation' : 'Venture Assistant'}
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Expand to Full Studio */}
              <button
                type="button"
                className="icon-btn"
                style={{ padding: '5px' }}
                title="Expand to Full AI Sana Studio"
                onClick={() => {
                  setIsOpen(false);
                  navigate(detectedInnovationId ? `/ai-sana?innovationId=${detectedInnovationId}` : '/ai-sana');
                }}
              >
                <Maximize2 size={13} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                className="icon-btn"
                style={{ padding: '5px' }}
                title="Close"
                onClick={() => {
                  setIsOpen(false);
                  soundFx.playTap();
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Context Prompts Bar */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--panel2)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto'
          }}>
            {quickPrompts.map(({ label, prompt }) => (
              <button
                key={label}
                disabled={streaming}
                onClick={() => sendMessage(prompt)}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '10px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: streaming ? 'not-allowed' : 'pointer',
                  flexShrink: 0
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Message History */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%'
                }}
              >
                <div style={{
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #7041C7, #2563FF)'
                    : 'var(--panel2)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--line)',
                  fontSize: '12px',
                  lineHeight: 1.55
                }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                  {m.role === 'assistant' && m.id !== 'welcome' && !serviceStatus?.configured && (
                    <div style={{ marginTop: '5px', fontSize: '9px', color: '#f59e0b', opacity: 0.9 }}>
                      * Rule-based heuristic evaluation (Gemini API offline)
                    </div>
                  )}
                </div>

                {m.role === 'assistant' && m.content && (
                  <button
                    onClick={() => handleCopy(m.content, m.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: '9.5px',
                      alignSelf: 'flex-start',
                      cursor: 'pointer',
                      marginTop: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    {copiedId === m.id ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                    <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            ))}

            {streaming && (
              <div style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10.5px',
                color: 'var(--cyan)',
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'var(--panel2)'
              }}>
                <RefreshCw size={11} className="animate-spin" />
                <span>{phaseText || 'Streaming response...'}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--line)',
            background: 'var(--panel2)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={input}
              disabled={streaming}
              placeholder={streaming ? 'AI Sana is typing...' : 'Ask AI Sana...'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              style={{
                flex: 1,
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--text)',
                outline: 'none'
              }}
            />

            {streaming ? (
              <button
                type="button"
                className="icon-btn"
                onClick={stopGeneration}
                style={{
                  background: '#f43f5e',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '7px'
                }}
                title="Stop"
              >
                <Square size={13} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!input.trim()}
                onClick={() => sendMessage()}
                style={{
                  background: 'linear-gradient(135deg, #7041C7, #2563FF)',
                  border: 0,
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '7px 11px',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  opacity: input.trim() ? 1 : 0.4
                }}
                title="Send"
              >
                <Send size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
