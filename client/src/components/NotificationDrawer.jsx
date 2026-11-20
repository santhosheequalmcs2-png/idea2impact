import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle,
  FileText,
  DollarSign,
  Users,
  MessageSquare,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

export default function NotificationDrawer({ isOpen, onClose, user, onNavigate }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      type: 'PROPOSAL',
      title: 'New Collaboration Proposal Received',
      body: 'Alex Chen (Seed Syndicate) submitted an offer on your Bio-Photonic Optical Scanner.',
      time: '12m ago',
      read: false,
      link: '/dashboard?tab=proposals'
    },
    {
      id: 'notif_2',
      type: 'NDA',
      title: 'Mutual NDA Executed (v2.4)',
      body: 'Dr. Elena Rostova signed the Mutual Non-Disclosure Agreement for confidential Deal Room access.',
      time: '1h ago',
      read: false,
      link: '/innovation/1'
    },
    {
      id: 'notif_3',
      type: 'TASK',
      title: 'Kanban Task Assigned',
      body: 'Marcus Vance assigned "Low-Power Sleep Firmware Optimization" to your sprint backlog.',
      time: '3h ago',
      read: true,
      link: '/collaborations'
    },
    {
      id: 'notif_4',
      type: 'PLEDGE',
      title: 'Micro-Backing Pledge Received',
      body: 'An anonymous early adopter pledged $100 in community support for your prototype launch.',
      time: 'Yesterday',
      read: true,
      link: '/dashboard'
    }
  ]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    soundFx.playTap();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    soundFx.playSuccess();
  };

  const handleClickItem = (n) => {
    soundFx.playTap();
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    if (onNavigate && n.link) {
      onNavigate(n.link);
    }
    onClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'PROPOSAL': return <DollarSign size={16} className="text-cyan" />;
      case 'NDA': return <ShieldCheck size={16} className="text-gold" />;
      case 'TASK': return <CheckCircle size={16} className="text-purple" />;
      case 'PLEDGE': return <Sparkles size={16} className="text-emerald" />;
      default: return <Bell size={16} className="text-cyan" />;
    }
  };

  const displayedList = filter === 'UNREAD' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="notification-drawer-card" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title-box">
            <Bell size={20} className="text-cyan mr-2" />
            <h3>Notification Center</h3>
            {unreadCount > 0 && <span className="drawer-unread-pill">{unreadCount} New</span>}
          </div>
          <button className="icon-btn small" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="drawer-filter-bar">
          <div className="drawer-filter-buttons">
            <button
              className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => { soundFx.playTap(); setFilter('ALL'); }}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'UNREAD' ? 'active' : ''}`}
              onClick={() => { soundFx.playTap(); setFilter('UNREAD'); }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button className="mark-read-btn" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="drawer-notifications-list">
          {displayedList.length === 0 ? (
            <div className="empty-drawer-state">
              <Bell size={36} className="text-muted" />
              <p>You're all caught up! No unread alerts.</p>
            </div>
          ) : (
            displayedList.map(n => (
              <div
                key={n.id}
                className={`drawer-notification-item ${!n.read ? 'unread' : ''}`}
                onClick={() => handleClickItem(n)}
              >
                <div className="notif-icon-circle">
                  {getIcon(n.type)}
                </div>
                <div className="notif-body-content">
                  <div className="notif-title-row">
                    <h4>{n.title}</h4>
                    <span className="notif-time">{n.time}</span>
                  </div>
                  <p className="notif-text">{n.body}</p>
                </div>
                {!n.read && <span className="unread-dot-indicator" />}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
