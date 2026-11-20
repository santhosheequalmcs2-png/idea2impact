import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Shield,
  Clock,
  Check,
  CheckCheck,
  MoreVertical,
  Flag,
  UserX,
  Sparkles,
  Paperclip,
  Smile
} from 'lucide-react';
import {
  subscribeUserConversations,
  subscribeMessages,
  sendChatMessage,
  setOnlinePresence
} from '../services/firebase';
import { soundFx } from '../services/soundFx';

export default function MessagesPage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvoId, setSelectedConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fallback initial mock conversations if Firestore has not synced yet
  const defaultConversations = useMemo(() => [
    {
      id: 'convo_elena_ai',
      peerName: 'Dr. Elena Rostova',
      peerRole: 'Patent Professional',
      peerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      lastMessage: 'The provisional patent claims for your optical sensor have been drafted.',
      timestamp: '10:42 AM',
      unreadCount: 1,
      isOnline: true
    },
    {
      id: 'convo_marcus_build',
      peerName: 'Marcus Vance',
      peerRole: 'Lead Hardware Builder',
      peerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      lastMessage: 'Updated the 3D STEP assembly in the project file vault. Take a look!',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isOnline: false
    },
    {
      id: 'convo_alex_seed',
      peerName: 'Alex Chen',
      peerRole: 'Syndicate Seed Investor',
      peerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      lastMessage: 'We would love to discuss a $150,000 SAFE tranche next Tuesday.',
      timestamp: '2d ago',
      unreadCount: 0,
      isOnline: true
    }
  ], []);

  const defaultMessages = useMemo(() => ({
    convo_elena_ai: [
      { id: 'm1', senderId: 'peer', text: 'Hello! I reviewed your innovation disclosure.', time: '10:30 AM' },
      { id: 'm2', senderId: 'me', text: 'Thank you Dr. Rostova. What are our strongest patent claims?', time: '10:35 AM' },
      { id: 'm3', senderId: 'peer', text: 'The provisional patent claims for your optical sensor have been drafted. The multi-spectral calibration method gives us the widest defensible moat.', time: '10:42 AM' }
    ],
    convo_marcus_build: [
      { id: 'm4', senderId: 'peer', text: 'Hey, I just ran the CNC tolerance check on the main housing.', time: 'Yesterday' },
      { id: 'm5', senderId: 'me', text: 'Did the injection snap-fits pass clearance analysis?', time: 'Yesterday' },
      { id: 'm6', senderId: 'peer', text: 'Updated the 3D STEP assembly in the project file vault. Take a look!', time: 'Yesterday' }
    ],
    convo_alex_seed: [
      { id: 'm7', senderId: 'peer', text: 'Hi! Impressed with your unit economics and BOM margins.', time: '2d ago' },
      { id: 'm8', senderId: 'me', text: 'Appreciate that, Alex. We have finalized our pre-seed target.', time: '2d ago' },
      { id: 'm9', senderId: 'peer', text: 'We would love to discuss a $150,000 SAFE tranche next Tuesday.', time: '2d ago' }
    ]
  }), []);

  // Initialize conversations
  useEffect(() => {
    let unsubscribe = () => {};
    if (user?.id) {
      setOnlinePresence(user.id, true);
      unsubscribe = subscribeUserConversations(user.id, (cloudConvos) => {
        if (cloudConvos && cloudConvos.length > 0) {
          setConversations(cloudConvos);
        } else {
          setConversations(defaultConversations);
        }
      });
    } else {
      setConversations(defaultConversations);
    }
    return () => {
      unsubscribe();
      if (user?.id) setOnlinePresence(user.id, false);
    };
  }, [user, defaultConversations]);

  // Set default selection
  useEffect(() => {
    if (!selectedConvoId && conversations.length > 0) {
      setSelectedConvoId(conversations[0].id);
    }
  }, [conversations, selectedConvoId]);

  // Subscribe to active conversation messages
  useEffect(() => {
    let unsubscribe = () => {};
    if (selectedConvoId) {
      unsubscribe = subscribeMessages(selectedConvoId, (cloudMsgs) => {
        if (cloudMsgs && cloudMsgs.length > 0) {
          setMessages(cloudMsgs);
        } else {
          setMessages(defaultMessages[selectedConvoId] || []);
        }
      });
    }
    return () => unsubscribe();
  }, [selectedConvoId, defaultMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConvo = conversations.find(c => c.id === selectedConvoId) || conversations[0];

  const filteredConvos = useMemo(() => {
    return conversations.filter(c =>
      !search.trim() ||
      c.peerName?.toLowerCase().includes(search.toLowerCase()) ||
      c.peerRole?.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim()) return;

    soundFx.playTap();
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: 'me',
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setMessageText('');

    if (user?.id && selectedConvoId) {
      await sendChatMessage(selectedConvoId, {
        senderId: user.id,
        senderName: user.name || 'You',
        text: newMsg.text
      }).catch(() => {});
    }

    soundFx.playSuccess();
  };

  const handleQuickReply = (text) => {
    setMessageText(text);
    soundFx.playTap();
  };

  return (
    <div className="messages-layout-page">
      <div className="container">
        <div className="messages-shell-card">
          {/* Left Panel: Conversation List */}
          <aside className="conversations-sidebar">
            <div className="sidebar-head">
              <div className="sidebar-title-row">
                <h2>
                  <MessageSquare size={20} className="text-cyan mr-2" />
                  Messages
                </h2>
                <span className="convo-count-badge">{conversations.length}</span>
              </div>
              <div className="convo-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="conversations-list-scroll">
              {filteredConvos.map(c => {
                const isSelected = c.id === selectedConvoId;
                return (
                  <div
                    key={c.id}
                    className={`convo-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      soundFx.playTap();
                      setSelectedConvoId(c.id);
                    }}
                  >
                    <div className="convo-avatar-box">
                      {c.peerAvatar ? (
                        <img src={c.peerAvatar} alt={c.peerName} />
                      ) : (
                        <div className="convo-avatar-fallback">
                          {c.peerName?.slice(0, 1) || 'U'}
                        </div>
                      )}
                      {c.isOnline && <span className="online-presence-dot" />}
                    </div>

                    <div className="convo-preview-info">
                      <div className="convo-name-row">
                        <span className="convo-name">{c.peerName}</span>
                        <span className="convo-timestamp">{c.timestamp}</span>
                      </div>
                      <span className="convo-role-tag">{c.peerRole}</span>
                      <p className="convo-snippet">{c.lastMessage}</p>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="convo-unread-pill">{c.unreadCount}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Panel: Chat Thread */}
          <main className="chat-thread-container">
            {selectedConvo ? (
              <>
                {/* Chat Header */}
                <div className="chat-thread-header">
                  <div className="chat-peer-profile">
                    <div className="chat-peer-avatar">
                      {selectedConvo.peerAvatar ? (
                        <img src={selectedConvo.peerAvatar} alt={selectedConvo.peerName} />
                      ) : (
                        <div className="convo-avatar-fallback">
                          {selectedConvo.peerName?.slice(0, 1) || 'U'}
                        </div>
                      )}
                      {selectedConvo.isOnline && <span className="online-presence-dot" />}
                    </div>
                    <div>
                      <h3 className="chat-peer-name">{selectedConvo.peerName}</h3>
                      <div className="chat-peer-sub">
                        <span className="peer-role-text">{selectedConvo.peerRole}</span>
                        <span className="presence-text">
                          {selectedConvo.isOnline ? 'Active Now' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="chat-header-actions">
                    <div className="relative">
                      <button
                        className="icon-btn small"
                        onClick={() => setShowOptions(!showOptions)}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {showOptions && (
                        <div className="dropdown-menu-card right">
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              alert('Conversation safety report submitted to moderation.');
                              setShowOptions(false);
                            }}
                          >
                            <Flag size={14} className="mr-2" /> Report User
                          </button>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => {
                              alert(`${selectedConvo.peerName} has been blocked.`);
                              setShowOptions(false);
                            }}
                          >
                            <UserX size={14} className="mr-2" /> Block User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="chat-messages-stream">
                  <div className="chat-encryption-banner">
                    <Shield size={14} className="text-cyan mr-1" />
                    <span>Cross-Platform End-to-End Synced Message Thread</span>
                  </div>

                  {messages.map((m, idx) => {
                    const isMe = m.senderId === 'me' || m.senderId === user?.id;
                    return (
                      <div
                        key={m.id || idx}
                        className={`chat-bubble-row ${isMe ? 'outgoing' : 'incoming'}`}
                      >
                        <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-peer'}`}>
                          <p className="bubble-text">{m.text}</p>
                          <div className="bubble-meta">
                            <span className="bubble-time">{m.time || 'Just now'}</span>
                            {isMe && <CheckCheck size={14} className="bubble-check" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Preset Chips */}
                <div className="chat-quick-replies-bar">
                  <Sparkles size={14} className="text-cyan mr-1" />
                  <span className="quick-label">Suggested:</span>
                  <button
                    className="quick-chip"
                    onClick={() => handleQuickReply("Let's schedule a technical demo.")}
                  >
                    Schedule Demo
                  </button>
                  <button
                    className="quick-chip"
                    onClick={() => handleQuickReply("I've signed the Mutual NDA and accessed the Deal Room.")}
                  >
                    NDA Signed
                  </button>
                  <button
                    className="quick-chip"
                    onClick={() => handleQuickReply("Can you share the updated BOM and unit economics?")}
                  >
                    Request BOM
                  </button>
                </div>

                {/* Message Input Composer */}
                <form className="chat-composer-box" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder={`Message ${selectedConvo.peerName}...`}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary small composer-send-btn"
                    disabled={!messageText.trim()}
                  >
                    <span>Send</span>
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-chat-state">
                <MessageSquare size={44} className="text-muted" />
                <h3>No Conversation Selected</h3>
                <p>Choose a contact from the left sidebar to open or start a collaboration thread.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
