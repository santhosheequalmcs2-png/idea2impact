import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Key,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

export default function AICopilot({ activeContext = null }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try {
      return localStorage.getItem('i2i_gemini_key') || '';
    } catch {
      return '';
    }
  });
  const [keyInput, setKeyInput] = useState('');
  const [activeEngine, setActiveEngine] = useState('Gemini 2.0 Flash');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hi! I'm your **Impact AI Copilot**, powered by Google Gemini.

I specialize in **patent novelty scans**, **TAM market sizing**, **investor pitch decks**, and **rapid prototyping blueprints**.

Click any quick prompt below or describe your innovation!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: 'Gemini 2.0 Flash'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  const quickPrompts = [
    { label: '🛡️ Patentability Scan', prompt: 'Analyze patentability, prior-art risks, and novelty claims for this concept.' },
    { label: '📊 Market Size (TAM)', prompt: 'Calculate the Total Addressable Market (TAM), SAM, SOM, CAGR and unit economics.' },
    { label: '📑 1-Min Pitch Deck', prompt: 'Generate a 5-slide executive investor pitch deck for this idea.' },
    { label: '🛠️ Prototyping Blueprint', prompt: 'What is the recommended hardware/cloud tech stack, BOM, and 8-week build sprint?' },
    { label: '⚖️ IP & NDA Strategy', prompt: 'Provide an IP protection and NDA execution strategy before public investor pitches.' },
    { label: '🤝 Co-Founder Match', prompt: 'What key co-founder roles are needed for this project, and how should equity be structured?' }
  ];

  const saveApiKey = () => {
    const trimmed = keyInput.trim();
    setGeminiApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('i2i_gemini_key', trimmed);
      } else {
        localStorage.removeItem('i2i_gemini_key');
      }
    } catch {}
    setShowKeyModal(false);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation reset. Ready for a new innovation analysis!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: activeEngine
      }
    ]);
  };

  const sendMessage = async (textToSend) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    const userMsg = {
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build context string from active page or item
    let contextStr = '';
    if (activeContext) {
      const catName = typeof activeContext.category === 'object' ? (activeContext.category?.name || 'General') : (activeContext.category || 'General');
      contextStr = `Title: ${activeContext.title || 'Untitled'}\nCategory: ${catName}\nDescription: ${activeContext.desc || activeContext.description || ''}`;
    }

    try {
      // 1. Send to backend AI endpoint with custom Gemini Key if provided
      const data = await api('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: promptText,
          context: contextStr,
          apiKey: geminiApiKey || undefined
        })
      });

      const replyContent = data.reply || 'Analysis completed.';
      const usedEngine = data.engine || (geminiApiKey ? 'Gemini 2.0 (Custom Key)' : 'Gemini 2.0 Flash');
      setActiveEngine(usedEngine);

      const assistantReply = {
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: usedEngine
      };
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      // 2. Direct Client-side Gemini fallback if user provided API key and backend is asleep
      if (geminiApiKey) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
          const gRes = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Context: ${contextStr || 'Innovation'}\n\nUser: ${promptText}`
                }]
              }]
            })
          });
          if (gRes.ok) {
            const gData = await gRes.json();
            const gText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (gText) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: gText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  engine: 'Gemini 2.0 Direct'
                }
              ]);
              return;
            }
          }
        } catch {}
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Could not reach AI service: ${err.message}. Please check your connection or provide a Gemini API key in settings.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          engine: 'Offline'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper to format basic markdown-style text (bold, headers, bullets)
  const formatText = (content) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={lIdx} style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text)' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={lIdx} style={{ fontSize: '13px', fontWeight: 600, margin: '6px 0 3px', color: 'var(--primary)' }}>{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('---')) {
        return <hr key={lIdx} style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '8px 0' }} />;
      }
      // Bullets
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const bulletText = line.slice(2);
        return (
          <div key={lIdx} style={{ display: 'flex', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
            <span>{renderFormattedSpans(bulletText)}</span>
          </div>
        );
      }
      // Regular paragraph or empty line
      if (!line.trim()) {
        return <div key={lIdx} style={{ height: '6px' }} />;
      }
      return <div key={lIdx} style={{ margin: '2px 0' }}>{renderFormattedSpans(line)}</div>;
    });
  };

  // Helper to parse **bold** and `code` spans
  const renderFormattedSpans = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} style={{ fontWeight: 600, color: 'var(--text)' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={pIdx} style={{ background: 'rgba(128,128,128,0.15)', padding: '1px 4px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          className="ai-floating-btn"
          onClick={() => setOpen(true)}
          aria-label="Open Impact AI Copilot"
        >
          <div className="ai-btn-pulse" />
          <span className="ai-btn-icon">
            <Sparkles size={18} />
          </span>
          <span className="ai-btn-text">Impact Copilot</span>
          <span className="ai-btn-badge" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            Gemini
          </span>
        </button>
      )}

      {/* Floating Copilot Window */}
      {open && (
        <div className={`ai-copilot-window ${minimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="ai-copilot-header">
            <div className="ai-header-left">
              <div className="ai-bot-avatar" style={{ background: 'linear-gradient(135deg, #7041c7, #06b6d4)' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div className="ai-copilot-title">
                  Impact AI Copilot
                  <span
                    className="ai-status-indicator"
                    style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    onClick={() => setShowKeyModal(!showKeyModal)}
                    title="Click to configure Gemini API Key"
                  >
                    ● ✦ {geminiApiKey ? 'Gemini Live' : 'Gemini 2.0'}
                  </span>
                </div>
                <div className="ai-copilot-subtitle">Patent & Innovation Intelligence</div>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                className="ai-icon-btn"
                title="Configure Gemini API Key"
                onClick={() => setShowKeyModal(!showKeyModal)}
                style={{ color: geminiApiKey ? 'var(--primary)' : 'inherit' }}
              >
                <Key size={13} />
              </button>
              <button
                className="ai-icon-btn"
                title="Reset Chat"
                onClick={clearChat}
              >
                <RotateCcw size={13} />
              </button>
              <button
                className="ai-icon-btn"
                title={minimized ? 'Expand' : 'Minimize'}
                onClick={() => setMinimized(!minimized)}
              >
                {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                className="ai-icon-btn"
                title="Close"
                onClick={() => setOpen(false)}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Optional Custom Gemini Key Drawer */}
              {showKeyModal && (
                <div style={{
                  padding: '12px 16px',
                  background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
                  borderBottom: '1px solid var(--line)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Key size={13} color="var(--primary)" /> Google Gemini API Key
                    </span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }}
                    >
                      Get Free Key <ExternalLink size={10} />
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      placeholder="Paste AI Studio Key (AIzaSy...)"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '11px'
                      }}
                    />
                    <button
                      onClick={saveApiKey}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Save
                    </button>
                  </div>
                  {geminiApiKey && (
                    <div style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} /> Custom Gemini Key Active (stored locally)
                    </div>
                  )}
                </div>
              )}

              {/* Active Context Banner */}
              {activeContext && (
                <div className="ai-context-banner">
                  <span className="ai-context-tag">Active Innovation</span>
                  <span className="ai-context-title" title={activeContext.title}>
                    {activeContext.title}
                  </span>
                </div>
              )}

              {/* Quick Action Chips */}
              <div className="ai-quick-chips">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    className="ai-chip"
                    onClick={() => sendMessage(qp.prompt)}
                    disabled={loading}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Chat Message Stream */}
              <div className="ai-chat-body" ref={chatEndRef}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`ai-message-row ${msg.role}`}>
                    <div className="ai-msg-avatar">
                      {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className="ai-msg-bubble">
                      <div className="ai-msg-content" style={{ lineHeight: '1.55', fontSize: '13px' }}>
                        {formatText(msg.content)}
                      </div>
                      <div className="ai-msg-footer">
                        <span className="ai-msg-time">
                          {msg.timestamp} {msg.engine && `· ${msg.engine}`}
                        </span>
                        {msg.role === 'assistant' && (
                          <button
                            className="ai-copy-btn"
                            title="Copy reply"
                            onClick={() => copyMessage(msg.content, idx)}
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check size={12} color="#10b981" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copy
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="ai-message-row assistant">
                    <div className="ai-msg-avatar">
                      <Bot size={14} />
                    </div>
                    <div className="ai-msg-bubble loading">
                      <div className="ai-typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                      <span className="ai-typing-text">Generating innovation intelligence via Gemini...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="ai-input-bar">
                <textarea
                  className="ai-textarea"
                  rows={1}
                  placeholder="Ask about patent novelty, TAM, pitch deck, tech stack..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button
                  className="ai-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
