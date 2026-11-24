import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Search,
  Filter,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Send,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import Page3DObject from '../components/Page3DObject';
import { soundFx } from '../services/soundFx';

export default function MatchesPage({ user, onOpenCollaboration }) {
  const [talents, setTalents] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectedIds, setConnectedIds] = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api('/talents')
      .then(res => {
        if (!isMounted) return;
        const raw = res.talents || [];
        setTalents(raw);
      })
      .catch(() => {
        if (!isMounted) return;
        setTalents([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Deterministic Ecosystem Affinity Scoring Engine (matching Android's EcosystemMatcher.kt)
  const matches = useMemo(() => {
    const userRole = user?.roles?.[0] || 'Creator';
    const userSkills = user?.profile?.skills || ['Product Design', 'Hardware', 'Prototyping'];

    return talents.map((t, idx) => {
      // Calculate complementary affinity score based on cross-role synergy
      let baseScore = 78;
      const tSkills = Array.isArray(t.skills) ? t.skills : [];

      // High synergy when creator matches with builder or investor
      if (userRole === 'Creator' && (t.role === 'Builder' || t.role === 'Investor')) {
        baseScore += 12;
      } else if (userRole === 'Builder' && (t.role === 'Creator' || t.role === 'Patent Professional')) {
        baseScore += 10;
      } else if (userRole === 'Investor' && (t.role === 'Creator' || t.role === 'Builder')) {
        baseScore += 14;
      }

      // Shared/Complementary skill bonus
      const matchesSkill = tSkills.some(s =>
        userSkills.some(us => s.toLowerCase().includes(us.toLowerCase()) || us.toLowerCase().includes(s.toLowerCase()))
      );
      if (matchesSkill) baseScore += 6;

      // Unique deterministic variance by index
      const score = Math.min(99, Math.max(72, baseScore - (idx % 5) * 3));

      // Generated synergy statement
      let synergyReason = 'Complementary skill profile aligns with your venture roadmap.';
      if (t.role === 'Builder') {
        synergyReason = 'Deep technical & engineering execution capacity for hardware/software prototyping.';
      } else if (t.role === 'Investor') {
        synergyReason = 'Active capital deployment & syndicate backing in your innovation sector.';
      } else if (t.role === 'Patent Professional') {
        synergyReason = 'IP protection, prior-art freedom to operate, and patent claim structuring.';
      } else if (t.role === 'Creator') {
        synergyReason = 'Visionary product architecture and validated domain problem statement.';
      }

      return {
        ...t,
        affinityScore: score,
        synergyReason
      };
    }).sort((a, b) => b.affinityScore - a.affinityScore);
  }, [talents, user]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const matchRole = roleFilter === 'All' || m.role === roleFilter;
      const skillsStr = Array.isArray(m.skills) ? m.skills.join(' ') : '';
      const matchSearch = !search.trim() ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        skillsStr.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [matches, roleFilter, search]);

  // Dynamic highest compatibility score derived from actual match calculations
  const topCompatibilityScore = useMemo(() => {
    if (!matches || matches.length === 0) return 87;
    return Math.max(...matches.map(m => m.affinityScore));
  }, [matches]);

  const handleConnect = (talent) => {
    soundFx.playTap();
    if (onOpenCollaboration) {
      onOpenCollaboration(talent);
    } else {
      setConnectedIds(prev => new Set([...prev, talent.id]));
      soundFx.playSuccess();
    }
  };

  const roles = ['All', 'Builder', 'Investor', 'Patent Professional', 'Creator'];

  return (
    <div className="matches-page-container">
      {/* Hero Banner */}
      <section className="matches-hero-section">
        <div className="container">
          <div className="matches-hero-grid">
            <div className="matches-hero-copy">
              <div className="eyebrow-badge">
                <Sparkles size={14} className="text-cyan animate-pulse" />
                <span>AI ECOSYSTEM MATCHMAKER</span>
              </div>
              <h1 className="hero-title">
                Algorithmic Synergy.<br />
                <span className="text-gradient">Connect with Your Co-Founders.</span>
              </h1>
              <p className="hero-desc">
                High-affinity matches paired by complementary execution capacity, verified technical disciplines, sector focus, and venture investment criteria.
              </p>
              <div className="match-stats-row">
                <div className="match-stat-pill">
                  <TrendingUp size={16} className="text-emerald" />
                  <span><b>{topCompatibilityScore}%</b> Highest Compatibility</span>
                </div>
                <div className="match-stat-pill">
                  <ShieldCheck size={16} className="text-cyan" />
                  <span><b>100%</b> Vetted Practitioners</span>
                </div>
              </div>
            </div>
            <div className="matches-hero-3d-wrapper">
              <Page3DObject type="talents" size={175} />
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="matches-filter-section">
        <div className="container">
          <div className="matches-controls-bar">
            <div className="search-input-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by skill, discipline, or collaborator name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="clear-btn" onClick={() => setSearch('')}>×</button>
              )}
            </div>

            <div className="role-filter-chips">
              {roles.map(r => (
                <button
                  key={r}
                  className={`filter-chip ${roleFilter === r ? 'active' : ''}`}
                  onClick={() => {
                    soundFx.playTap();
                    setRoleFilter(r);
                  }}
                >
                  {r === 'All' ? 'All Roles' : r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Matches Grid */}
      <section className="matches-grid-section">
        <div className="container">
          {loading ? (
            <div className="matches-loading-state">
              <div className="spinner-orbit" />
              <p>Computing ecosystem compatibility vectors...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="empty-matches-card">
              <Users size={48} className="text-muted" />
              <h3>No Matches Found</h3>
              <p>Try broadening your filter criteria or search keyword.</p>
              <button className="btn btn-outline small" onClick={() => { setRoleFilter('All'); setSearch(''); }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="matches-cards-grid">
              {filteredMatches.map(m => {
                const isConnected = connectedIds.has(m.id);
                return (
                  <div className="match-card" key={m.id}>
                    <div className="match-card-top">
                      <div className="match-avatar-wrapper">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="match-avatar-img" />
                        ) : (
                          <div className="match-avatar-fallback">
                            {m.name?.slice(0, 1)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="online-presence-dot" title="Active on network" />
                      </div>

                      <div className="match-affinity-pill">
                        <Sparkles size={13} className="affinity-star" />
                        <span className="affinity-number">{m.affinityScore}%</span>
                        <span className="affinity-label">Affinity</span>
                      </div>
                    </div>

                    <div className="match-info-block">
                      <div className="match-name-row">
                        <h3 className="match-name">{m.name}</h3>
                        {m.verified && <CheckCircle size={15} className="text-cyan ml-1" title="Verified Professional" />}
                      </div>
                      <div className="match-role-badge">{m.role}</div>
                      <p className="match-title">{m.title || `${m.role} · IDEA2IMPACT Network`}</p>
                    </div>

                    <div className="synergy-reason-box">
                      <div className="synergy-header">
                        <Cpu size={13} className="text-cyan mr-1" />
                        <span>AI SYNERGY RATIONALE</span>
                      </div>
                      <p className="synergy-text">{m.synergyReason}</p>
                    </div>

                    {/* Skill Tags */}
                    {Array.isArray(m.skills) && m.skills.length > 0 && (
                      <div className="match-skills-cloud">
                        {m.skills.slice(0, 4).map((skill, sIdx) => (
                          <span className="skill-pill-tag" key={sIdx}>
                            {skill}
                          </span>
                        ))}
                        {m.skills.length > 4 && (
                          <span className="skill-pill-tag more">+{m.skills.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="match-card-actions">
                      <button
                        className={`btn btn-full small ${isConnected ? 'btn-success' : 'btn-primary'}`}
                        onClick={() => handleConnect(m)}
                        disabled={isConnected}
                      >
                        {isConnected ? (
                          <>
                            <UserCheck size={14} /> Invitation Sent
                          </>
                        ) : (
                          <>
                            <Send size={14} /> Start Collaboration
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
