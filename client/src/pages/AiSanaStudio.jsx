// client/src/pages/AiSanaStudio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  Key,
  Paperclip,
  X,
  Copy,
  Check,
  Zap,
  Brain,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api, streamAiChat, checkAiServiceStatus } from '../services/api';
import Page3DObject from '../components/Page3DObject';
import { soundFx } from '../services/soundFx';

export default function AiSanaStudio() {
  const [searchParams] = useSearchParams();
  const urlInnovationId = searchParams.get('innovationId') || '';

  // Mode: "deep" (Gemini 2.0 Flash) vs "fast" (Gemini 2.0 Flash-Lite)
  const [mode, setMode] = useState('deep');

  // Custom API key stored ONLY in sessionStorage / React state (never localStorage)
  const [customKey, setCustomKey] = useState(() => {
    try {
      return sessionStorage.getItem('i2i_session_gemini_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  // Innovations for Context Picker
  const [innovations, setInnovations] = useState([]);
  const [selectedInnovationId, setSelectedInnovationId] = useState(urlInnovationId);

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hey! I'm **AI Sana**, your venture strategist and prototyping analyst on **IDEA2IMPACT**.

I provide **honest, calibrated idea evaluations**, **preliminary patentability scans**, **TAM/SAM/SOM market sizing**, and **rapid prototyping architectures**.

Select an innovation context, upload a prototype image, or pick a starter action below!`,
      engine: 'AI Sana Deep (Gemini 2.0 Flash)'
    }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingPhase, setStreamingPhase] = useState('');
  const [attachedImage, setAttachedImage] = useState(null); // { base64, mimeType, name, previewUrl }
  const [copiedId, setCopiedId] = useState(null);
  const [lastError, setLastError] = useState(null);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Probe real AI service status matching System Diagnostics
  const [serviceStatus, setServiceStatus] = useState({
    status: 'checking',
    message: 'Checking AI status...',
    model: 'Gemini 2.0 Flash'
  });

  useEffect(() => {
    checkAiServiceStatus()
      .then(res => setServiceStatus(res))
      .catch(() => setServiceStatus({ status: 'error', message: 'AI service offline', model: 'Gemini 2.0 Flash' }));
  }, []);

  // Load marketplace innovations for Context Picker
  useEffect(() => {
    api('/innovations?limit=30')
      .then(res => {
        if (res.items) setInnovations(res.items);
      })
      .catch(err => console.warn('Could not load innovations for context picker:', err));
  }, []);

  // Update selection if URL param changes
  useEffect(() => {
    if (urlInnovationId) {
      setSelectedInnovationId(urlInnovationId);
    }
  }, [urlInnovationId]);

  // Auto-scroll on new tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingPhase]);

  const quickPrompts = [
    {
      label: '🛡️ Patentability & Prior-Art Scan',
      prompt: 'Perform a structured preliminary patentability, novelty claims, and prior-art risk scan for this concept.'
    },
    {
      label: '📊 Market Sizing (TAM/SAM/SOM)',
      prompt: 'Calculate Total Addressable Market (TAM), SAM, SOM, CAGR, and target enterprise unit economics for this idea.'
    },
    {
      label: '📑 1-Min Investor Pitch Deck',
      prompt: 'Generate an executive 5-slide venture pitch deck covering problem, proprietary solution, moat, unit economics, and milestones.'
    },
    {
      label: '🛠️ Prototyping & Tech Blueprint (BOM)',
      prompt: 'Architect the rapid prototyping blueprint: recommended hardware/cloud stack, Bill of Materials (BOM), and 8-week build sprint.'
    },
    {
      label: '⚖️ IP Protection & NDA Strategy',
      prompt: 'Recommend a confidentiality, trade secret vs patent filing timeline, and Bilateral Mutual NDA Deal Room strategy.'
    },
    {
      label: '🤝 Co-Founder & Talent Equity',
      prompt: 'Outline ideal co-founder triad roles, builder skillsets needed, and vesting/equity allocation for this venture.'
    }
  ];

  // Image Upload Handler
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('Image size exceeds 4 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setAttachedImage({
        base64,
        mimeType: file.type,
        name: file.name,
        previewUrl: URL.createObjectURL(file)
      });
      soundFx.playTap();
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedImage = () => {
    if (attachedImage?.previewUrl) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save / Clear Custom API Key
  const saveKey = () => {
    const trimmed = keyInput.trim();
    setCustomKey(trimmed);
    try {
      if (trimmed) {
        sessionStorage.setItem('i2i_session_gemini_key', trimmed);
      } else {
        sessionStorage.removeItem('i2i_session_gemini_key');
      }
    } catch {}
    setShowKeyModal(false);
    soundFx.playSuccess();
  };

  const resetToDefaultAI = () => {
    setCustomKey('');
    setKeyInput('');
    try {
      sessionStorage.removeItem('i2i_session_gemini_key');
    } catch {}
    setShowKeyModal(false);
    soundFx.playTap();
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    soundFx.playTap();
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
    setStreamingPhase('');
    soundFx.playTap();
  };

  const handleNewChat = () => {
    stopGeneration();
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'New chat started. Ready for your next innovation concept!',
        engine: mode === 'deep' ? 'AI Sana Deep' : 'AI Sana Fast'
      }
    ]);
    setLastError(null);
    removeAttachedImage();
    soundFx.playTap();
  };

  // Main Send Function
  const sendMessage = async (overridePrompt = null, forceMode = null) => {
    const promptToSend = (overridePrompt || input).trim();
    if (!promptToSend && !attachedImage) return;
    if (streaming) return;

    soundFx.playTap();

    const activeMode = forceMode || mode;
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    // User Message
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: promptToSend,
      imagePreview: attachedImage?.previewUrl || null
    };

    // Staging Assistant Message
    const stagedAssistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      engine: activeMode === 'deep' ? 'AI Sana Deep (Gemini 2.0 Flash)' : 'AI Sana Fast (Gemini 2.0 Flash-Lite)'
    };

    setMessages(prev => [...prev, userMsg, stagedAssistantMsg]);
    setInput('');
    setLastError(null);
    setStreaming(true);
    setStreamingPhase('Connecting to AI service...');

    const currentImage = attachedImage;
    removeAttachedImage();

    abortControllerRef.current = new AbortController();

    // Prepare history
    const historyPayload = messages
      .filter(m => m.id !== 'welcome')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      await streamAiChat({
        prompt: promptToSend || 'Analyze this attached prototype image in detail.',
        innovationId: selectedInnovationId || undefined,
        mode: activeMode,
        fastMode: activeMode === 'fast',
        apiKey: customKey || undefined,
        imageBase64: currentImage?.base64 || undefined,
        imageMimeType: currentImage?.mimeType || undefined,
        history: historyPayload,
        signal: abortControllerRef.current.signal,
        onPhase: (evt) => {
          setStreamingPhase(evt.message || 'Thinking...');
        },
        onChunk: (chunkText) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMsgId) {
              return { ...m, content: m.content + chunkText };
            }
            return m;
          }));
        },
        onMeta: (meta) => {
          if (meta.event === 'fallback') {
            setMessages(prev => prev.map(m => {
              if (m.id === assistantMsgId) {
                return { ...m, engine: 'AI Sana Fast (Auto-Fallback)' };
              }
              return m;
            }));
          }
        },
        onError: (err) => {
          console.error('Streaming error:', err);
          setStreaming(false);
          setStreamingPhase('');
          setLastError({
            message: err.message || 'AI request failed.',
            prompt: promptToSend,
            mode: activeMode
          });
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMsgId && !m.content) {
              return {
                ...m,
                content: `⚠️ **AI Service Notice:** ${err.message || 'Could not complete request.'} The service may be offline or starting up. Please check System Diagnostics in the footer or tap Retry below.`
              };
            }
            return m;
          }));
        },
        onDone: (meta) => {
          setStreaming(false);
          setStreamingPhase('');
          if (meta?.error) {
            setLastError({
              message: meta.error.message || 'Could not complete request.',
              prompt: promptToSend,
              mode: activeMode
            });
            return;
          }
          if (meta?.receivedNone) {
            setMessages(prev => prev.map(m => {
              if (m.id === assistantMsgId && !m.content) {
                return {
                  ...m,
                  content: '⚠️ **AI Service Notice:** No response data received from the AI engine. Please verify backend connection in System Diagnostics and try again.'
                };
              }
              return m;
            }));
            return;
          }
          if (meta?.engine) {
            setMessages(prev => prev.map(m => {
              if (m.id === assistantMsgId) {
                return { ...m, engine: meta.engine };
              }
              return m;
            }));
          }
          soundFx.playSuccess();
        }
      });
    } catch (err) {
      setStreaming(false);
      setStreamingPhase('');
      if (err.name !== 'AbortError') {
        setLastError({
          message: err.message || 'Connection interrupted.',
          prompt: promptToSend,
          mode: activeMode
        });
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMsgId && !m.content) {
            return {
              ...m,
              content: `⚠️ **AI Service Notice:** ${err.message || 'Connection interrupted.'} Please check connection and try again.`
            };
          }
          return m;
        }));
      }
    }
  };

  const regenerateLast = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  };

  const selectedItem = innovations.find(i => i.id === selectedInnovationId);

  return (
    <main className="page wrap ai-sana-studio">
      {/* Page Title & 3D Visual (100% Untouched Three.js object) */}
      <div className="page-top page-top-with-3d">
        <div className="page-top-copy">
          <div className="eyebrow">
            <Sparkles size={13} />
            <span>AI SANA STUDIO · VENTURE & IP INTELLIGENCE</span>
          </div>
          <h1>
            Turn breakthrough concepts into <span className="gradient-text">protected ventures.</span>
          </h1>
          <p>
            Calibrated startup assessments, prior-art scans, addressable market sizing, and hardware prototyping blueprints grounded in real platform data.
          </p>
        </div>
        <div className="page-3d-visual">
          <div className="page-3d-glow" />
          <Page3DObject type="ai-studio" size={190} />
        </div>
      </div>

      {/* Main Studio Shell */}
      <div className="chat-shell ai-sana-shell">
        {/* Left Sidebar: Controls & Quick Prompts */}
        <aside className="chat-aside ai-sana-aside">
          {/* Brand & Status Pill */}
          <div className="chat-brand" style={{ justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-mark" style={{ width: '32px', height: '32px' }}>
                <img src="/brand-icon.png" alt="AI Sana" className="brand-mark-img" />
              </span>
              <div>
                <b style={{ fontSize: '13px', display: 'block' }}>AI Sana</b>
                <small style={{ fontSize: '10px', color: 'var(--muted)' }}>Venture Intelligence</small>
              </div>
            </div>

            <span style={{
              fontSize: '10px',
              color: serviceStatus.status === 'success' ? '#10b981' : (serviceStatus.status === 'warning' ? '#f59e0b' : (serviceStatus.status === 'error' ? '#ef4444' : 'var(--muted)')),
              background: serviceStatus.status === 'success' ? 'rgba(16, 185, 129, 0.12)' : (serviceStatus.status === 'warning' ? 'rgba(245, 158, 11, 0.12)' : (serviceStatus.status === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)')),
              border: `1px solid ${serviceStatus.status === 'success' ? 'rgba(16, 185, 129, 0.35)' : (serviceStatus.status === 'warning' ? 'rgba(245, 158, 11, 0.35)' : (serviceStatus.status === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'var(--line)'))}`,
              borderRadius: '20px',
              padding: '3px 8px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ● {customKey ? 'Custom Key' : (serviceStatus.status === 'success' ? 'Operational · Gemini 2.0 Flash' : (serviceStatus.status === 'warning' ? 'Heuristic Mode · Gemini 2.0 Flash' : (serviceStatus.status === 'error' ? 'AI Offline' : 'Checking AI...')))}
            </span>
          </div>

          {/* Innovation Context Picker */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Active Innovation Context:
            </label>
            <div className="select-wrap" style={{ height: '38px', padding: '0 10px' }}>
              <select
                value={selectedInnovationId}
                onChange={(e) => setSelectedInnovationId(e.target.value)}
                style={{ fontSize: '12px', width: '100%' }}
              >
                <option value="">-- General Studio (No Specific Project) --</option>
                {innovations.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.title} ({inv.category?.name || 'Venture'})
                  </option>
                ))}
              </select>
            </div>
            {selectedItem && (
              <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--cyan)', marginTop: '4px' }}>
                ✓ Grounded in {selectedItem.title}
              </small>
            )}
          </div>

          {/* Dual-Mode Toggle: Deep vs Fast */}
          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Reasoning Mode:
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'var(--panel)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--line)'
            }}>
              <button
                type="button"
                onClick={() => { setMode('deep'); soundFx.playTap(); }}
                style={{
                  borderRadius: '6px',
                  padding: '7px 8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  background: mode === 'deep' ? 'linear-gradient(135deg, rgba(112,65,199,0.3), rgba(37,99,255,0.35))' : 'transparent',
                  color: mode === 'deep' ? 'var(--cyan)' : 'var(--muted)',
                  border: mode === 'deep' ? '1px solid var(--cyan)' : '1px solid transparent'
                }}
              >
                <Brain size={13} /> Deep
              </button>
              <button
                type="button"
                onClick={() => { setMode('fast'); soundFx.playTap(); }}
                style={{
                  borderRadius: '6px',
                  padding: '7px 8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  background: mode === 'fast' ? 'linear-gradient(135deg, rgba(92,233,193,0.25), rgba(84,230,245,0.25))' : 'transparent',
                  color: mode === 'fast' ? '#10b981' : 'var(--muted)',
                  border: mode === 'fast' ? '1px solid #10b981' : '1px solid transparent'
                }}
              >
                <Zap size={13} /> Fast
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', margin: '0 0 8px 0' }}>
              6 Recommended Starter Workflows:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {quickPrompts.map(({ label, prompt }) => (
                <button
                  key={label}
                  disabled={streaming}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    color: 'var(--text)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: streaming ? 'not-allowed' : 'pointer',
                    transition: 'all .15s ease'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                  <ArrowUpRight size={12} color="var(--cyan)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Config & Safety Footer */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setShowKeyModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '11px',
                border: '1px solid var(--line)',
                background: customKey ? 'rgba(16,185,129,0.1)' : 'var(--panel)',
                color: customKey ? '#10b981' : 'var(--muted)',
                cursor: 'pointer'
              }}
            >
              <Key size={13} /> {customKey ? 'Custom API Key Active' : 'Configure Custom Key (Optional)'}
            </button>

            <div className="chat-safety" style={{ fontSize: '9.5px', color: 'var(--muted)', display: 'flex', gap: '6px', lineHeight: 1.5 }}>
              <ShieldCheck size={14} color="var(--cyan)" style={{ flexShrink: 0 }} />
              AI Sana outputs are strategic starting points, not formal legal, patent, or investment guarantees.
            </div>
          </div>
        </aside>

        {/* Right Main Chat Stage */}
        <section className="chat-main ai-sana-main">
          {/* Chat Top Bar */}
          <div className="chat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>AI Sana Session</span>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                · {mode === 'deep' ? 'Deep Mode (Gemini 2.0 Flash)' : 'Fast Mode (Gemini 2.0 Flash-Lite)'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-ghost small"
                onClick={handleNewChat}
                style={{ padding: '6px 10px', fontSize: '11px' }}
                title="Start a fresh conversation"
              >
                <RotateCcw size={12} /> New Chat
              </button>
            </div>
          </div>

          {/* Custom Key Modal Overlay */}
          {showKeyModal && (
            <div style={{
              background: 'var(--panel2)',
              borderBottom: '1px solid var(--line)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} color="var(--cyan)" /> BYO Google Gemini API Key
                </span>
                <button className="icon-btn" onClick={() => setShowKeyModal(false)} style={{ padding: '4px' }}>
                  <X size={15} />
                </button>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0 }}>
                Keys are stored strictly in session memory and never saved to disk or localStorage.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  placeholder="Paste Gemini API key (AIza...)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px'
                  }}
                />
                <button className="btn btn-primary small" onClick={saveKey}>Save</button>
                {customKey && (
                  <button className="btn btn-ghost small" onClick={resetToDefaultAI}>
                    Reset to Default AI
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-message ${m.role === 'user' ? 'user' : 'assistant'}`}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <div className="chat-avatar">
                  {m.role === 'user' ? 'U' : <Sparkles size={14} />}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="message-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{m.role === 'user' ? 'YOU' : 'AI SANA'}</span>
                    {m.engine && <span style={{ opacity: 0.65, fontSize: '8px' }}>{m.engine}</span>}
                  </div>

                  {/* Attached Image Preview if User message */}
                  {m.imagePreview && (
                    <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', maxWidth: '280px', border: '1px solid var(--line)' }}>
                      <img src={m.imagePreview} alt="Prototype preview" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}

                  {/* Markdown Rendered Content */}
                  <div className="ai-markdown-content" style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text)' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Sanitize URLs on links
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)' }} />
                        )
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>

                  {/* Message Copy Action */}
                  {m.role === 'assistant' && m.content && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--muted)',
                          fontSize: '10.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {copiedId === m.id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live Streaming Phase Indicator */}
            {streaming && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '20px',
                background: 'var(--panel2)',
                border: '1px solid var(--line)',
                fontSize: '11px',
                color: 'var(--cyan)'
              }}>
                <RefreshCw size={12} className="animate-spin" />
                <span>{streamingPhase || 'Analyzing...'}</span>
              </div>
            )}

            {/* Error Recovery Card */}
            {lastError && !streaming && (
              <div style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} color="#f43f5e" />
                  <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 600 }}>
                    {lastError.message}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline small" onClick={() => sendMessage(lastError.prompt)}>
                    <RefreshCw size={11} /> Retry
                  </button>
                  <button className="btn btn-outline small" onClick={() => sendMessage(lastError.prompt, 'fast')}>
                    <Zap size={11} /> Switch to Fast & Retry
                  </button>
                  {customKey && (
                    <button className="btn btn-ghost small" onClick={resetToDefaultAI}>
                      Switch to Default AI
                    </button>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Thumbnail Bar */}
          {attachedImage && (
            <div style={{
              margin: '0 20px',
              padding: '8px 12px',
              background: 'var(--panel2)',
              border: '1px solid var(--line)',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={attachedImage.previewUrl}
                  alt="Prototype attachment"
                  style={{ width: '34px', height: '34px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, display: 'block' }}>{attachedImage.name}</span>
                  <small style={{ fontSize: '9.5px', color: 'var(--cyan)' }}>Multimodal Prototype Image Attached</small>
                </div>
              </div>
              <button className="icon-btn" onClick={removeAttachedImage} title="Remove image">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Controls */}
          <div className="chat-input" style={{ margin: attachedImage ? '0 20px 10px 20px' : '0 20px 10px 20px' }}>
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="icon-btn"
              disabled={streaming}
              onClick={() => fileInputRef.current?.click()}
              title="Attach Prototype Image / Schematic (JPEG, PNG, WebP <= 4MB)"
              style={{ color: attachedImage ? 'var(--cyan)' : 'var(--muted)' }}
            >
              <Paperclip size={16} />
            </button>

            {/* Prompt Textarea */}
            <textarea
              rows={1}
              value={input}
              disabled={streaming}
              placeholder={streaming ? 'AI Sana is generating response...' : 'Ask AI Sana about patent novelty, market size, hardware BOM, or valuation...'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            {/* Send / Stop Button */}
            {streaming ? (
              <button
                type="button"
                className="send-btn"
                onClick={stopGeneration}
                title="Stop generation"
                style={{ background: '#f43f5e', color: '#fff' }}
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="send-btn"
                disabled={!input.trim() && !attachedImage}
                onClick={() => sendMessage()}
                title="Send to AI Sana"
              >
                <Send size={15} />
              </button>
            )}
          </div>

          {/* Footer note */}
          <div className="chat-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--muted)' }}>
              Press <b>Enter</b> to send · <b>Shift+Enter</b> for new line
            </span>
            {messages.length > 2 && !streaming && (
              <button
                onClick={regenerateLast}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '9.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={10} /> Regenerate Last Response
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
