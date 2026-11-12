import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Copy, Check, Shield, BarChart3, FileText, Wrench, RefreshCw, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../services/api';

export default function AICopilot({ activeContext = null }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hi! I'm your **Impact AI Copilot**.

I can help you evaluate patentability, calculate market size (TAM), generate pitch decks, or find the right prototyping architecture.

Click a quick prompt below or ask me anything!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    { label: '🛡️ Patentability Scan', prompt: 'Analyze patentability, prior-art risks, and novelty for this concept.' },
    { label: '📊 Market Size (TAM)', prompt: 'Calculate the Total Addressable Market (TAM), SAM, SOM and CAGR growth.' },
    { label: '📑 1-Min Pitch Deck', prompt: 'Generate a 5-slide executive investor pitch deck for this idea.' },
    { label: '🛠️ Prototyping Blueprint', prompt: 'What is the recommended tech stack, BOM, and 8-week build sprint?' }
  ];

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
      const data = await api('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: promptText,
          context: contextStr
        })
      });

      const assistantReply = {
        role: 'assistant',
        content: data.reply || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Could not reach AI backend: ${err.message}. Please verify server connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
          <span className="ai-btn-badge">AI</span>
        </button>
      )}

      {/* Floating Copilot Window */}
      {open && (
        <div className={`ai-copilot-window ${minimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="ai-copilot-header">
            <div className="ai-header-left">
              <div className="ai-bot-avatar">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="ai-copilot-title">
                  Impact AI Copilot
                  <span className="ai-status-indicator">● Online</span>
                </div>
                <div className="ai-copilot-subtitle">Patent & Innovation Intelligence</div>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                className="ai-icon-btn"
                title={minimized ? 'Expand' : 'Minimize'}
                onClick={() => setMinimized(!minimized)}
              >
                {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
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
              {/* Active Context Banner */}
              {activeContext && (
                <div className="ai-context-banner">
                  <span className="ai-context-tag">Active Context</span>
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
                      <div className="ai-msg-content">{msg.content}</div>
                      <div className="ai-msg-footer">
                        <span className="ai-msg-time">{msg.timestamp}</span>
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
                      <span className="ai-typing-text">Analyzing innovation telemetry...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="ai-input-bar">
                <textarea
                  className="ai-textarea"
                  rows={1}
                  placeholder="Ask about patents, TAM, pitch decks..."
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
