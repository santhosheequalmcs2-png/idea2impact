import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Sparkles, Lightbulb, Boxes, Code2, Smartphone, Gamepad2,
  Package, Palette, Globe2, Menu, X, Search, Plus, Heart, SlidersHorizontal,
  MessageCircle, Compass, Users, ChartNoAxesCombined, ShieldCheck, Zap, Sun, Moon,
  Send, Check, Layers, Building2, BriefcaseBusiness, LockKeyhole, TrendingUp,
  ChevronRight, LogOut, Bell, Filter, Edit3, Trash2, UploadCloud, UserCircle,
  ExternalLink, Image as ImageIcon, MessageSquare, DollarSign, FileText, CheckCircle2,
  MapPin, Award, Handshake, Trophy, Flame, Coffee, Crown, Shield, Lock, Eye, Download, Printer, BarChart3
} from 'lucide-react';
import Orb from './components/Orb';
import AICopilot from './components/AICopilot';
import Prototype3DViewer from './components/Prototype3DViewer';
import DigitalNDAModal from './components/DigitalNDAModal';
import IPCertificateModal from './components/IPCertificateModal';
import MicroBackingModal from './components/MicroBackingModal';
import { api, demoAI, uploadImage, setAuthToken, getAuthToken } from './services/api';

const defaultCategoryMeta = [
  ['Ideas', Lightbulb, 'Concepts ready for their next chapter', 'ideas'],
  ['Inventions', Zap, 'New solutions to real problems', 'inventions'],
  ['Physical Products', Package, 'Objects made to make life better', 'physical-products'],
  ['Websites', Globe2, 'Digital experiences and platforms', 'websites'],
  ['Mobile Apps', Smartphone, 'Apps built around people', 'mobile-apps'],
  ['Games', Gamepad2, 'Playful worlds and mechanics', 'games'],
  ['Software', Code2, 'Tools that move work forward', 'software'],
  ['Creative Designs', Palette, 'Visual thinking made tangible', 'creative-designs']
];

function App() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('i2i_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
      return false; // Default to Light Mode for first-time visitors
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('i2i_user') || 'null');
    } catch {
      return null;
    }
  });
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';

  const activeInnovationId = location.pathname.startsWith('/innovation/') ? location.pathname.split('/innovation/')[1] : null;
  const activeContextItem = useMemo(() => {
    return items.find(it => it.id === activeInnovationId) || null;
  }, [items, activeInnovationId]);

  // Sync theme
  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('i2i_theme', theme);
    } catch (e) {}
  }, [dark]);

  // Load user session from backend if token exists
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api('/auth/me')
        .then(res => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('i2i_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          setAuthToken(null);
          setUser(null);
          localStorage.removeItem('i2i_user');
        });
    }
  }, []);

  // Fetch innovations and categories from backend
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, catRes] = await Promise.all([
        api('/innovations').catch(() => ({ items: [] })),
        api('/categories').catch(() => ({ categories: [] }))
      ]);

      if (invRes.items) setItems(invRes.items);
      if (catRes.categories && catRes.categories.length > 0) setCategories(catRes.categories);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const auth = (u, token) => {
    setUser(u);
    localStorage.setItem('i2i_user', JSON.stringify(u));
    if (token) setAuthToken(token);
    refreshData();
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem('i2i_user');
      refreshData();
    }
  };

  return (
    <>
      <header className={`nav ${!dark ? 'light-nav' : ''} ${!dark && isHome ? 'home-nav' : ''}`}>
        <Link to="/" className="brand">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span>IDEA<span className="brand-blue">2</span>IMPACT</span>
        </Link>
        <nav className={menu ? 'nav-links open' : 'nav-links'}>
          <Link to="/marketplace" onClick={() => setMenu(false)}>Explore Ideas</Link>
          <Link to="/talents" onClick={() => setMenu(false)}>Talent & Partners</Link>
          <Link to="/ai-studio" onClick={() => setMenu(false)}>AI Studio</Link>
          <Link to="/pricing" onClick={() => setMenu(false)}>Pricing</Link>
          <a href="/#how" onClick={() => setMenu(false)}>How it works</a>
        </nav>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            aria-label={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onClick={() => setDark(!dark)}
          >
            <span className={`theme-toggle-option ${!dark ? 'active' : ''}`} title="Light Mode">
              <Sun size={15} />
            </span>
            <span className={`theme-toggle-option ${dark ? 'active' : ''}`} title="Dark Mode">
              <Moon size={15} />
            </span>
          </button>
          {user ? (
            <>
              <Link className="nav-user" to="/dashboard" title="Go to Dashboard">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user.name?.slice(0, 1)?.toUpperCase() || 'U'
                )}
              </Link>
              <button className="btn btn-ghost small logout" onClick={logout}>
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link className="login-link" to="/login">Log in</Link>
              <Link className="btn btn-primary small" to="/signup">
                Get started <ArrowUpRight size={15} />
              </Link>
            </>
          )}
          <button className="icon-btn mobile-menu" onClick={() => setMenu(!menu)}>
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home items={items} categories={categories} dark={dark} />} />
        <Route path="/marketplace" element={<Marketplace items={items} categories={categories} onRefresh={refreshData} user={user} />} />
        <Route path="/talents" element={<TalentDirectory />} />
        <Route path="/innovation/:id" element={<Detail user={user} onRefresh={refreshData} />} />
        <Route path="/login" element={<Auth mode="login" onAuth={auth} />} />
        <Route path="/signup" element={<Auth mode="signup" onAuth={auth} />} />
        <Route path="/dashboard/*" element={<Dashboard user={user} onRefresh={refreshData} onUpdateUser={setUser} />} />
        <Route path="/ai-studio" element={<AIStudio />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<Home items={items} categories={categories} dark={dark} />} />
      </Routes>

      <Footer isHome={isHome} dark={dark} />
      <AICopilot activeContext={activeContextItem} />
    </>
  );
}

function OriginalDarkHome({ items, displayCategories }) {
  return (
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse" /> THE INNOVATION ECOSYSTEM <span className="eyebrow-line" />
          </div>
          <h1>Every great innovation<br />starts with <span className="gradient-text">an idea.</span></h1>
          <p className="hero-sub">
            Showcase your creativity, discover opportunities, connect with experts and transform your ideas into real-world innovations.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace" className="btn btn-primary">
              Explore innovations <ArrowUpRight size={17} />
            </Link>
            <Link to="/talents" className="btn btn-outline">
              Find Partners & Builders <Users size={16} />
            </Link>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack">
              <i>MC</i><i>MV</i><i>DB</i><i>ER</i><i>+</i>
            </div>
            <span>
              <b>Ideas move further together.</b>
              <small>Built for creators, builders & believers</small>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-glow" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <Orb />
          <div className="float-card float-top">
            <span className="float-icon"><Sparkles size={15} /></span>
            <span><b>AI opportunity match</b><small>94% compatibility</small></span>
            <span className="live-dot" />
          </div>
          <div className="float-card float-bottom">
            <span className="float-icon cyan"><TrendingUp size={16} /></span>
            <span><b>Idea → Impact</b><small>Your next step starts here</small></span>
          </div>
          <div className="visual-caption">IDEAS <span>↗</span> BUILD <span>↗</span> GROW</div>
        </div>
      </section>

      <div className="trust-strip wrap">
        <span>ONE SPACE. INFINITE POSSIBILITIES.</span>
        <div><b>01</b> Discover <i /> <b>02</b> Collaborate <i /> <b>03</b> Launch</div>
      </div>

      <section className="section wrap" id="how">
        <div className="section-head">
          <div>
            <div className="eyebrow">FROM THOUGHT TO THING</div>
            <h2>Big ideas need a <span className="gradient-text">next step.</span></h2>
          </div>
          <p>One connected journey to turn a spark of creativity into something the world can use.</p>
        </div>
        <div className="steps-grid">
          {[
            ['01', 'Showcase', 'Put your idea, invention or product out into the world.'],
            ['02', 'Evaluate', 'Get an AI-assisted view of your concept and its potential.'],
            ['03', 'Match', 'Find relevant buyers, companies, investors and talent.'],
            ['04', 'Connect', 'Bring the right people together to build what’s next.'],
            ['05', 'Grow', 'Explore sales, licensing and collaboration pathways.']
          ].map(([n, t, d]) => (
            <article className="step-card" key={n}>
              <span className="step-no">{n}</span>
              <div className="step-arrow"><ArrowUpRight size={17} /></div>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section categories-section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">EXPLORE THE POSSIBLE</div>
              <h2>Ideas come in <span className="gradient-text">many forms.</span></h2>
            </div>
            <Link to="/marketplace" className="text-link">Explore marketplace <ArrowUpRight size={16} /></Link>
          </div>
          <div className="category-grid">
            {displayCategories.map(([name, Icon, desc, count], i) => (
              <Link to={`/marketplace?category=${encodeURIComponent(name)}`} className="category-card" key={name}>
                <div className={`category-icon ci-${i % 8}`}><Icon size={22} /></div>
                <div className="category-count">{count} <ArrowUpRight size={13} /></div>
                <h3>{name}</h3>
                <p>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Innovation Leaderboard */}
      {items.length > 0 && (
        <section className="section wrap leaderboard-section">
          <div className="leaderboard-banner">
            <div className="leaderboard-head">
              <div>
                <span className="leaderboard-badge">
                  <Trophy size={14} /> TODAY'S LEADERBOARD
                </span>
                <h2 style={{ margin: '8px 0 4px', fontSize: '28px' }}>
                  Ranked by Community <span className="gradient-text">Upvotes & Velocity</span>
                </h2>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  The most promising concepts, inventions, and prototypes voted by inventors and investors today.
                </p>
              </div>
              <Link to="/marketplace" className="text-link">
                View all rankings <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="leaderboard-grid">
              {items[0] && (
                <div className="leader-card-champion">
                  <div className="crown-tag">
                    <Crown size={13} /> #1 IDEA OF THE DAY
                  </div>
                  <div className="card-meta" style={{ marginTop: '10px' }}>
                    <span className="badge-tag">{items[0].category}</span>
                    <span>Velocity: +42% today</span>
                  </div>
                  <h3 className="leader-title">
                    <Link to={`/innovation/${items[0].id}`}>{items[0].title}</Link>
                  </h3>
                  <p className="leader-desc">{items[0].desc || items[0].description}</p>
                  <div className="leader-bottom">
                    <span className="card-author" style={{ border: 0, padding: 0 }}>
                      <span className="mini-avatar">
                        {items[0].creator?.profile?.avatar ? (
                          <img src={items[0].creator.profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          items[0].author?.slice(0, 1)?.toUpperCase() || 'C'
                        )}
                      </span>
                      <span>{items[0].author || 'Creator'}</span>
                    </span>
                    <Link to={`/innovation/${items[0].id}`} className="upvote-pill">
                      <Flame size={14} /> {(items[0].likeCount || 0) + 12} Upvotes
                    </Link>
                  </div>
                </div>
              )}

              {items[1] && (
                <div className="leader-card-runner">
                  <span className="runner-rank">#2</span>
                  <div className="card-meta">
                    <span className="badge-tag">{items[1].category}</span>
                  </div>
                  <h3 className="leader-title">
                    <Link to={`/innovation/${items[1].id}`}>{items[1].title}</Link>
                  </h3>
                  <p className="leader-desc">{items[1].desc || items[1].description}</p>
                  <div className="leader-bottom">
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>By {items[1].author || 'Creator'}</span>
                    <Link to={`/innovation/${items[1].id}`} className="upvote-pill">
                      <Flame size={13} /> {(items[1].likeCount || 0) + 7}
                    </Link>
                  </div>
                </div>
              )}

              {items[2] && (
                <div className="leader-card-runner">
                  <span className="runner-rank">#3</span>
                  <div className="card-meta">
                    <span className="badge-tag">{items[2].category}</span>
                  </div>
                  <h3 className="leader-title">
                    <Link to={`/innovation/${items[2].id}`}>{items[2].title}</Link>
                  </h3>
                  <p className="leader-desc">{items[2].desc || items[2].description}</p>
                  <div className="leader-bottom">
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>By {items[2].author || 'Creator'}</span>
                    <Link to={`/innovation/${items[2].id}`} className="upvote-pill">
                      <Flame size={13} /> {(items[2].likeCount || 0) + 4}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">FRESH FROM THE COMMUNITY</div>
            <h2>Ideas worth a <span className="gradient-text">closer look.</span></h2>
          </div>
          <Link to="/marketplace" className="text-link">View all innovations <ArrowUpRight size={16} /></Link>
        </div>
        <div className="listing-grid">
          {items.slice(0, 3).map(x => (
            <InnovationCard item={x} key={x.id} />
          ))}
        </div>
      </section>

      <section className="section wrap">
        <div className="ai-banner">
          <div className="ai-banner-orb"><Sparkles size={42} /></div>
          <div className="ai-banner-copy">
            <div className="eyebrow">AI-POWERED EXPLORATION</div>
            <h2>Supercharge your concept with built-in intelligence.</h2>
            <p>From evaluating patentability and finding buyers to calculating TAM and building pitch decks — let AI accelerate your roadmap.</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/ai-studio" className="btn btn-primary">
                Launch AI Studio <Sparkles size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap cta-inner">
          <div className="eyebrow">THE NEXT CHAPTER IS YOURS</div>
          <h2>Your idea could be the<br /><span className="gradient-text">next big innovation.</span></h2>
          <p>Start with what you have. Find the people and momentum to take it further.</p>
          <Link to="/signup" className="btn btn-primary">Get started today <ArrowUpRight size={17} /></Link>
          <div className="cta-orbit" />
        </div>
      </section>
    </main>
  );
}

function LightHome({ items, displayCategories, featuredWorkmen }) {
  return (
    <div className="home-brand-theme">
      {/* 1. Hero Section */}
      <section className="home-hero wrap">
        <div className="home-hero-copy">
          <div className="home-eyebrow">
            <span className="home-pulse-dot" />
            <span>GLOBAL INNOVATION EXCHANGE</span>
            <span className="home-eyebrow-line" />
          </div>

          <h1 className="home-hero-title">
            Where breakthrough ideas meet{' '}
            <span className="home-gradient-text">global capital & elite builders.</span>
          </h1>

          <p className="home-hero-sub">
            The international innovation marketplace connecting visionary creators, robotics architects, and angel funds. Turn raw concepts into protected, funded, high-impact reality.
          </p>

          <div className="home-hero-actions">
            <Link to="/marketplace" className="home-btn home-btn-primary">
              Explore Innovations <ArrowUpRight size={17} />
            </Link>
            <Link to="/talents" className="home-btn home-btn-secondary">
              Meet Elite Builders <Users size={16} />
            </Link>
          </div>

          <div className="home-hero-proof">
            <div className="home-avatar-stack">
              {featuredWorkmen.map((w, idx) => (
                <img key={idx} src={w.avatar} alt={w.name} className="home-proof-avatar" />
              ))}
              <span className="home-proof-badge">+2.4k</span>
            </div>
            <div className="home-proof-text">
              <b>Backed by 2,400+ innovators across 18 countries</b>
              <small>From provisional patent filings to $4.2M in seed tranche flow</small>
            </div>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-visual-glow" />
          <div className="home-orbit home-orbit-one" />
          <div className="home-orbit home-orbit-two" />
          <Orb />

          {/* Floating Glassmorphic Cards */}
          <div className="home-float-card home-float-top">
            <span className="home-float-icon purple">
              <Sparkles size={16} />
            </span>
            <div className="home-float-info">
              <b>AI Opportunity & IP Match</b>
              <small>98% Compatibility · CleanTech</small>
            </div>
            <span className="home-live-pulse" />
          </div>

          <div className="home-float-card home-float-bottom">
            <span className="home-float-icon blue">
              <TrendingUp size={16} />
            </span>
            <div className="home-float-info">
              <b>Provisional Patent Secured</b>
              <small>USPTO Priority Date Locked</small>
            </div>
            <span className="home-verified-check">✓</span>
          </div>

          <div className="home-float-card home-float-right">
            <span className="home-float-icon purple">
              <ShieldCheck size={16} />
            </span>
            <div className="home-float-info">
              <b>Mutual NDA Protected</b>
              <small>Zero-knowledge encrypted deal rooms</small>
            </div>
          </div>

          <div className="home-visual-caption">
            <span>INVENT</span> ✦ <span>PROTECT</span> ✦ <span>FUND</span> ✦ <span>SCALE</span>
          </div>
        </div>
      </section>

      {/* 2. Ecosystem Stats Strip */}
      <section className="wrap">
        <div className="home-stats-strip">
          <div className="home-stat-tile">
            <div className="home-stat-num">32+</div>
            <div className="home-stat-label">Verified Inventions & Tech</div>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-tile">
            <div className="home-stat-num blue">$4.2M</div>
            <div className="home-stat-label">Private Seed Flow Deployed</div>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-tile">
            <div className="home-stat-num">10</div>
            <div className="home-stat-label">Specialist Builders & Legal Pros</div>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-tile">
            <div className="home-stat-num blue">100%</div>
            <div className="home-stat-label">Cryptographic Timestamp Proof</div>
          </div>
        </div>
      </section>

      {/* 3. The 5-Step Pipeline (How it works) */}
      <section className="home-section wrap" id="how">
        <div className="home-section-head">
          <div>
            <div className="home-eyebrow">
              <span className="home-pulse-dot" />
              <span>FROM THOUGHT TO THING</span>
            </div>
            <h2 className="home-section-title">
              A frictionless journey from <span className="home-gradient-text">concept to global scale.</span>
            </h2>
          </div>
          <p className="home-section-desc">
            One unified innovation runway: register intellectual property, test market viability with AI, and partner with qualified builders and investors.
          </p>
        </div>

        <div className="home-steps-grid">
          {[
            ['01', 'Showcase & Timestamp', 'Register your invention or concept with cryptographic SHA-256 date-stamped verification.'],
            ['02', 'AI Copilot Diagnostic', 'Evaluate patentability, forecast TAM market sizing, and generate investor pitch decks in seconds.'],
            ['03', 'Confidential Deal Rooms', 'Share proprietary CAD blueprints and financial cap tables securely under 1-click digital NDAs.'],
            ['04', 'Match with Builders', 'Partner with robotics engineers, industrial designers, and registered patent attorneys.'],
            ['05', 'Fund & Scale', 'Negotiate formal equity investment, milestone-based micro-grants, or enterprise licensing deals.']
          ].map(([n, t, d]) => (
            <article className="home-step-card" key={n}>
              <div className="home-step-top">
                <span className="home-step-no">{n}</span>
                <span className="home-step-arrow"><ArrowUpRight size={16} /></span>
              </div>
              <h3 className="home-step-title">{t}</h3>
              <p className="home-step-text">{d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Innovation Sectors (Categories) */}
      <section className="home-section home-categories-band">
        <div className="wrap">
          <div className="home-section-head">
            <div>
              <div className="home-eyebrow">
                <span className="home-pulse-dot" />
                <span>EXPLORE THE POSSIBLE</span>
              </div>
              <h2 className="home-section-title">
                Breakthroughs across <span className="home-gradient-text">eight dynamic sectors.</span>
              </h2>
            </div>
            <Link to="/marketplace" className="home-text-link">
              Explore All Sectors <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="home-category-grid">
            {displayCategories.map(([name, Icon, desc, count], i) => (
              <Link to={`/marketplace?category=${encodeURIComponent(name)}`} className="home-category-card" key={name}>
                <div className={`home-category-icon hci-${i % 8}`}>
                  <Icon size={22} />
                </div>
                <div className="home-category-count">
                  <span>{count} ideas</span>
                  <ArrowUpRight size={13} />
                </div>
                <h3 className="home-cat-title">{name}</h3>
                <p className="home-cat-desc">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Today's Innovation Leaderboard */}
      {items.length > 0 && (
        <section className="home-section wrap">
          <div className="home-leaderboard-banner">
            <div className="home-leaderboard-head">
              <div>
                <span className="home-leaderboard-tag">
                  <Trophy size={14} /> TODAY'S LEADERBOARD
                </span>
                <h2 className="home-leaderboard-title">
                  Ranked by Community <span className="home-gradient-text">Upvotes & Velocity</span>
                </h2>
                <p className="home-leaderboard-sub">
                  The most promising concepts, inventions, and prototypes voted by creators, builders, and investors today.
                </p>
              </div>
              <Link to="/marketplace" className="home-text-link">
                View All Leaderboards <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="home-leaderboard-grid">
              {/* #1 Champion */}
              {items[0] && (
                <div className="home-leader-card home-champion-card">
                  <div className="home-crown-tag">
                    <Crown size={13} /> #1 IDEA OF THE DAY
                  </div>
                  <div className="home-card-meta">
                    <span className="home-badge-tag">{items[0].category}</span>
                    <span className="home-velocity-text">Velocity: +42% today</span>
                  </div>
                  <h3 className="home-leader-item-title">
                    <Link to={`/innovation/${items[0].id}`}>{items[0].title}</Link>
                  </h3>
                  <p className="home-leader-item-desc">{items[0].desc || items[0].description}</p>
                  <div className="home-leader-item-footer">
                    <span className="home-card-author">
                      <span className="home-mini-avatar">
                        {items[0].creator?.profile?.avatar ? (
                          <img src={items[0].creator.profile.avatar} alt="" />
                        ) : (
                          items[0].author?.slice(0, 1)?.toUpperCase() || 'C'
                        )}
                      </span>
                      <span>{items[0].author || 'Creator'}</span>
                    </span>
                    <Link to={`/innovation/${items[0].id}`} className="home-upvote-pill">
                      <Flame size={14} /> {(items[0].likeCount || 0) + 12} Upvotes
                    </Link>
                  </div>
                </div>
              )}

              {/* #2 Runner-up */}
              {items[1] && (
                <div className="home-leader-card home-runner-card">
                  <span className="home-runner-rank">#2</span>
                  <div className="home-card-meta">
                    <span className="home-badge-tag">{items[1].category}</span>
                  </div>
                  <h3 className="home-leader-item-title">
                    <Link to={`/innovation/${items[1].id}`}>{items[1].title}</Link>
                  </h3>
                  <p className="home-leader-item-desc">{items[1].desc || items[1].description}</p>
                  <div className="home-leader-item-footer">
                    <span className="home-card-sub-author">By {items[1].author || 'Creator'}</span>
                    <Link to={`/innovation/${items[1].id}`} className="home-upvote-pill secondary">
                      <Flame size={13} /> {(items[1].likeCount || 0) + 7}
                    </Link>
                  </div>
                </div>
              )}

              {/* #3 Runner-up */}
              {items[2] && (
                <div className="home-leader-card home-runner-card">
                  <span className="home-runner-rank">#3</span>
                  <div className="home-card-meta">
                    <span className="home-badge-tag">{items[2].category}</span>
                  </div>
                  <h3 className="home-leader-item-title">
                    <Link to={`/innovation/${items[2].id}`}>{items[2].title}</Link>
                  </h3>
                  <p className="home-leader-item-desc">{items[2].desc || items[2].description}</p>
                  <div className="home-leader-item-footer">
                    <span className="home-card-sub-author">By {items[2].author || 'Creator'}</span>
                    <Link to={`/innovation/${items[2].id}`} className="home-upvote-pill secondary">
                      <Flame size={13} /> {(items[2].likeCount || 0) + 4}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. Fresh Community Innovations */}
      <section className="home-section wrap">
        <div className="home-section-head">
          <div>
            <div className="home-eyebrow">
              <span className="home-pulse-dot" />
              <span>FRESH FROM THE PIPELINE</span>
            </div>
            <h2 className="home-section-title">
              Inventions worth a <span className="home-gradient-text">closer look.</span>
            </h2>
          </div>
          <Link to="/marketplace" className="home-text-link">
            View All Innovations <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="home-listing-grid">
          {items.slice(0, 3).map((x) => (
            <InnovationCard item={x} key={x.id} />
          ))}
        </div>
      </section>

      {/* 7. Elite Builders & Patent Specialists Spotlight */}
      <section className="home-section wrap">
        <div className="home-talent-spotlight-card">
          <div className="home-talent-spotlight-head">
            <div>
              <div className="home-eyebrow">
                <span className="home-pulse-dot" />
                <span>ELITE TALENT NETWORK</span>
              </div>
              <h2 className="home-section-title">
                Work with specialists who <span className="home-gradient-text">turn blueprints into reality.</span>
              </h2>
            </div>
            <Link to="/talents" className="home-btn home-btn-secondary">
              Browse All Specialists <Users size={16} />
            </Link>
          </div>

          <div className="home-talent-grid">
            {featuredWorkmen.map((t, idx) => (
              <div className="home-workman-card" key={idx}>
                <div className="home-workman-header">
                  <div className="home-workman-avatar">
                    <img src={t.avatar} alt={t.name} />
                  </div>
                  <div>
                    <span className="home-workman-badge">{t.badge}</span>
                    <h4 className="home-workman-name">{t.name}</h4>
                    <span className="home-workman-role">{t.role}</span>
                  </div>
                </div>
                <p className="home-workman-bio">{t.headline}</p>
                <div className="home-workman-footer">
                  <Link to="/talents" className="home-connect-link">
                    Connect & Collaborate <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. AI Creative Co-Pilot Banner (Dark Deep Purple section) */}
      <section className="home-section wrap">
        <div className="home-ai-banner">
          <div className="home-ai-banner-left">
            <div className="home-eyebrow white">
              <Sparkles size={14} />
              <span>AUTONOMOUS INNOVATION INTELLIGENCE</span>
            </div>
            <h2 className="home-ai-title">
              Meet the AI Copilot that <span className="home-gradient-text-light">accelerates every stage.</span>
            </h2>
            <p className="home-ai-sub">
              Instantaneous patentability novelty scans, total addressable market (TAM) sizing, and 5-slide executive pitch deck generation — built directly into your workflow.
            </p>
            <div className="home-ai-actions">
              <Link to="/ai-studio" className="home-btn home-btn-ai">
                Launch AI Studio <Sparkles size={16} />
              </Link>
            </div>
          </div>

          <div className="home-ai-banner-features">
            <div className="home-ai-feat-card">
              <div className="home-ai-feat-icon blue"><ShieldCheck size={20} /></div>
              <div>
                <b>AI Patent & Prior-Art Radar</b>
                <small>Checks novelty score & potential claims in 30 seconds.</small>
              </div>
            </div>
            <div className="home-ai-feat-card">
              <div className="home-ai-feat-icon purple"><BarChart3 size={20} /></div>
              <div>
                <b>TAM & Market Sizing Engine</b>
                <small>Calculates TAM, SAM, SOM & 5-year CAGR growth rate.</small>
              </div>
            </div>
            <div className="home-ai-feat-card">
              <div className="home-ai-feat-icon blue"><FileText size={20} /></div>
              <div>
                <b>1-Minute Executive Pitch Deck</b>
                <small>Generates investor-ready 5-slide summary ready to export.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action (Dark Deep Purple section) */}
      <section className="home-cta-section">
        <div className="wrap home-cta-inner">
          <div className="home-eyebrow white centered">
            <Sparkles size={13} />
            <span>THE NEXT CHAPTER IS YOURS</span>
          </div>
          <h2 className="home-cta-title">
            Ready to turn your spark into <span className="home-gradient-text-light">real-world impact?</span>
          </h2>
          <p className="home-cta-sub">
            Join visionary inventors, deep-tech architects, and angel funds on the world's most modern innovation runway.
          </p>
          <div className="home-cta-actions">
            <Link to="/signup" className="home-btn home-btn-primary large">
              Get Started Free <ArrowUpRight size={17} />
            </Link>
            <Link to="/marketplace" className="home-btn home-btn-outline-white large">
              Explore Innovations <Search size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Home({ items, categories, dark }) {
  const displayCategories = useMemo(() => {
    return defaultCategoryMeta.map(([name, Icon, desc, slug]) => {
      const match = categories.find(c => c.slug === slug || c.name.toLowerCase() === name.toLowerCase());
      const count = match ? match.count : 0;
      return [name, Icon, desc, count > 0 ? String(count) : '✦'];
    });
  }, [categories]);

  // Featured workmen for the homepage spotlight banner
  const featuredWorkmen = [
    {
      name: 'Maya Chen',
      role: 'CleanTech IoT Founder',
      headline: 'Embedded sensor telemetry & hardware design',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      badge: 'Creator'
    },
    {
      name: 'Marcus Vance',
      role: 'Venture Partner @ Apex Horizons',
      headline: 'Angel investor in hardware, robotics & climate',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      badge: 'Investor'
    },
    {
      name: 'Devon Brooks',
      role: 'Principal Robotics Architect',
      headline: 'Autonomous drone stacks, ROS2 & bionics',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      badge: 'Builder'
    },
    {
      name: 'David S. Miller, Esq.',
      role: 'Registered Patent Attorney',
      headline: 'Provisional filings, USPTO & IP licensing',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      badge: 'Patent Pro'
    }
  ];

  if (dark) {
    return <OriginalDarkHome items={items} displayCategories={displayCategories} />;
  }

  return (
    <LightHome
      items={items}
      displayCategories={displayCategories}
      featuredWorkmen={featuredWorkmen}
    />
  );
}

function InnovationImage({ src, alt, category, isDetail = false }) {
  const [imgError, setImgError] = useState(false);

  // High-reliability verified fallback images for each category
  const fallbackMap = {
    'Physical Products': 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80',
    'Robotics': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    'Inventions': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    'CleanTech': 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
    'Software': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    'Energy': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'MedTech': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    'AgriTech': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    'Games': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    'Creative Designs': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    'Mobile Apps': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    'Spatial Computing': 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80'
  };

  const colorMap = {
    'Inventions': 'mint',
    'Mobile Apps': 'purple',
    'Software': 'blue',
    'Physical Products': 'orange',
    'Ideas': 'blue',
    'Websites': 'mint',
    'Games': 'purple',
    'Creative Designs': 'orange'
  };
  const color = colorMap[category] || 'blue';
  const resolvedCategoryFallback = fallbackMap[category] || fallbackMap['Inventions'];

  // Intercept known broken Unsplash IDs and fall back cleanly
  let imageSource = src;
  if (!imageSource || imageSource.includes('photo-1581092335397')) {
    imageSource = resolvedCategoryFallback;
  }

  const containerClass = isDetail ? "detail-art-img" : "product-art-img";

  if (imgError) {
    return (
      <div className={`${isDetail ? 'detail-art' : 'product-art'} art-${color}`}>
        <span className="art-symbol">✶</span>
        <span className="art-tag">{category}</span>
        {!isDetail && <span className="art-spark">✦</span>}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <img
        src={imageSource}
        alt={alt}
        loading="lazy"
        onError={(e) => {
          if (e.target.src !== resolvedCategoryFallback) {
            e.target.src = resolvedCategoryFallback;
          } else {
            setImgError(true);
          }
        }}
      />
      <span className="art-tag">{category}</span>
    </div>
  );
}

function InnovationCard({ item }) {
  return (
    <Link to={`/innovation/${item.id}`} className="innovation-card">
      <InnovationImage src={item.imageUrl} alt={item.title} category={item.category} />
      <div className="card-content">
        <div className="card-meta">
          <span>{item.category}</span>
          <span>{item.price > 0 ? `$${item.price}` : 'Open to connect'}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.desc || item.description}</p>
        <div className="card-author">
          <span className="mini-avatar">
            {item.creator?.profile?.avatar ? (
              <img src={item.creator.profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              item.author?.slice(0, 1)?.toUpperCase() || 'C'
            )}
          </span>
          <span>{item.author || 'Creator'}</span>
          <span className="card-open">View details <ArrowUpRight size={14} /></span>
        </div>
        <div className="card-stats">
          <span className={`card-stat-item ${item.isLiked ? 'active' : ''}`}>
            <Heart size={13} fill={item.isLiked ? 'currentColor' : 'none'} />
            {item.likeCount || 0}
          </span>
          <span className="card-stat-item">
            <MessageCircle size={13} />
            {item.commentCount || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TalentDirectory() {
  const [talents, setTalents] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api('/talents')
      .then(res => setTalents(res.talents || []))
      .catch(() => setTalents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return talents.filter(t => {
      const matchRole = roleFilter === 'All' || t.role === roleFilter;
      const matchSearch = !search.trim() ||
        `${t.name} ${t.headline} ${t.bio} ${t.skills.join(' ')} ${t.location}`.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [talents, roleFilter, search]);

  const roles = ['All', 'Creator', 'Builder', 'Investor', 'Patent Professional'];

  return (
    <main className="page wrap">
      <div className="page-top">
        <div className="eyebrow">CREATOR & BUILDER ECOSYSTEM</div>
        <h1>Meet the <span className="gradient-text">Makers & Believers.</span></h1>
        <p>Discover skilled roboticists, patent attorneys, angel investors, and industrial designers ready to collaborate.</p>
      </div>

      <div className="market-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search by skill (e.g. IoT, PyTorch, Patent, Robotics, Seed Funding)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="select-wrap">
          <Filter size={16} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Sparkles className="pulse" size={32} />
          <p style={{ marginTop: '14px' }}>Loading innovator profiles...</p>
        </div>
      ) : (
        <div className="talent-grid">
          {filtered.map(t => (
            <div className="talent-card" key={t.id}>
              <div className="talent-header">
                <div className="talent-avatar">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#8ff2ff', fontWeight: 'bold' }}>
                      {t.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="talent-meta">
                  <span className={`talent-role-badge role-${t.role.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}>
                    {t.role}
                  </span>
                  <div className="talent-name">{t.name}</div>
                  <div className="talent-headline">{t.headline}</div>
                </div>
              </div>

              <p className="talent-bio">{t.bio}</p>

              <div className="talent-skills">
                {t.skills.map(s => (
                  <span className="skill-chip" key={s}>{s}</span>
                ))}
              </div>

              <div className="talent-footer">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {t.location}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--cyan)' }}>
                  <Layers size={13} /> {t.projectsCount} {t.projectsCount === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Marketplace({ items, categories, onRefresh, user }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || 'All';

  const [query, setQuery] = useState('');
  const [cat, setCat] = useState(initialCategory);
  const [sort, setSort] = useState('Newest');

  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat) setCat(paramCat);
  }, [location.search]);

  const list = useMemo(() => {
    return items
      .filter(x => {
        const matchesCat = cat === 'All' || x.category === cat || x.categorySlug === cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const searchTarget = `${x.title} ${x.desc || x.description} ${x.category} ${x.author || ''}`.toLowerCase();
        const matchesQuery = !query.trim() || searchTarget.includes(query.toLowerCase());
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        if (sort === 'Price: low to high') return (a.price || 0) - (b.price || 0);
        if (sort === 'Price: high to low') return (b.price || 0) - (a.price || 0);
        if (sort === 'Most Popular') return (b.likeCount || 0) - (a.likeCount || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [items, cat, query, sort]);

  const categoryList = useMemo(() => {
    return [
      { name: 'All', count: items.length },
      ...defaultCategoryMeta.map(([name]) => ({
        name,
        count: items.filter(x => x.category === name).length
      }))
    ];
  }, [items]);

  return (
    <main className="page wrap">
      <div className="page-top">
        <div className="eyebrow">THE INNOVATION MARKETPLACE</div>
        <h1>Discover what’s <span className="gradient-text">next.</span></h1>
        <p>Explore bold ideas, useful inventions and digital creations from independent innovators.</p>
      </div>

      <div className="market-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search innovations, categories, creators..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="select-wrap">
          <SlidersHorizontal size={16} />
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option>Newest</option>
            <option>Most Popular</option>
            <option>Price: low to high</option>
            <option>Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="market-layout">
        <aside className="filter-panel">
          <h3><Filter size={16} /> Categories</h3>
          {categoryList.map(c => (
            <button
              className={cat === c.name ? 'filter-active' : ''}
              onClick={() => setCat(c.name)}
              key={c.name}
            >
              {c.name}
              <span>{c.count}</span>
            </button>
          ))}
          <div className="filter-note">
            <ShieldCheck size={17} />
            <p>Creators choose how their work is shared. Private submissions stay out of public discovery.</p>
          </div>
        </aside>

        <div className="market-results">
          <div className="results-head">
            <span><b>{list.length}</b> innovations found</span>
            <span>Curated possibilities <Sparkles size={14} /></span>
          </div>

          {list.length ? (
            <div className="listing-grid">
              {list.map(x => (
                <InnovationCard item={x} key={x.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <h3>No matches yet</h3>
              <p>Try another keyword or category.</p>
              <button className="btn btn-outline" onClick={() => { setQuery(''); setCat('All'); }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Detail({ user, onRefresh }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Proposal modal state
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalType, setProposalType] = useState('Investment');
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalContact, setProposalContact] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalNotice, setProposalNotice] = useState('');

  // Pitch Deck state
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [deck, setDeck] = useState(null);
  const [loadingDeck, setLoadingDeck] = useState(false);

  // NDA, Certificate & Micro-Backing state
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showBackingModal, setShowBackingModal] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api(`/innovations/${id}`);
      if (res.item) {
        setItem(res.item);
        setIsLiked(res.item.isLiked);
        setLikeCount(res.item.likeCount || 0);
        setIsSaved(res.item.isSaved);
        setComments(res.item.comments || []);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
      setError(err.message || 'Innovation not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  const toggleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api(`/innovations/${id}/like`, { method: 'POST' });
      setIsLiked(res.liked);
      setLikeCount(res.likeCount);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update like');
    }
  };

  const toggleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api(`/innovations/${id}/save`, { method: 'POST' });
      setIsSaved(res.saved);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update bookmark');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentText.trim() || postingComment) return;

    try {
      setPostingComment(true);
      const res = await api(`/innovations/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentText.trim() })
      });
      if (res.comment) {
        setComments(prev => [...prev, res.comment]);
        setCommentText('');
        onRefresh();
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api(`/innovations/${id}/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== commentId));
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const submitProposal = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setSubmittingProposal(true);
      await api(`/innovations/${id}/proposal`, {
        method: 'POST',
        body: JSON.stringify({
          proposalType,
          amount: proposalAmount.trim() || undefined,
          message: proposalMessage.trim(),
          contactInfo: proposalContact.trim() || undefined
        })
      });
      setProposalNotice('Your proposal has been delivered to the creator!');
      setProposalMessage('');
      setProposalAmount('');
      setTimeout(() => {
        setShowProposalModal(false);
        setProposalNotice('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to send proposal');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const generatePitchDeck = async () => {
    try {
      setLoadingDeck(true);
      setShowDeckModal(true);
      const res = await api(`/innovations/${id}/pitch-deck`, { method: 'POST' });
      if (res.deck) setDeck(res.deck);
    } catch (err) {
      alert(err.message || 'Failed to generate pitch summary');
    } finally {
      setLoadingDeck(false);
    }
  };

  if (loading) {
    return (
      <main className="page wrap detail-page">
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Sparkles className="pulse" size={32} />
          <p style={{ marginTop: '16px' }}>Loading innovation details...</p>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="page wrap detail-page">
        <Link to="/marketplace" className="back-link">← Back to marketplace</Link>
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <Search size={32} />
          <h2>Innovation Not Found</h2>
          <p>{error || 'The innovation you requested does not exist or is private.'}</p>
          <Link to="/marketplace" className="btn btn-primary">Browse Marketplace</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page wrap detail-page">
      <Link to="/marketplace" className="back-link">← Back to marketplace</Link>

      <div className="detail-grid">
        <div>
          <InnovationImage src={item.imageUrl} alt={item.title} category={item.category} isDetail={true} />

          {/* Development Lifecycle Tracker */}
          <div className="milestone-container">
            <div className="milestone-head">
              <span>Innovation Lifecycle</span>
              <span>Active Stage</span>
            </div>
            <div className="milestone-track">
              <div className="milestone-step done">
                <div className="milestone-dot"><Check size={12} /></div>
                <span>Concept</span>
              </div>
              <div className="milestone-step done">
                <div className="milestone-dot"><Check size={12} /></div>
                <span>Prototype</span>
              </div>
              <div className="milestone-step active">
                <div className="milestone-dot">3</div>
                <span>IP / Patent</span>
              </div>
              <div className="milestone-step">
                <div className="milestone-dot">4</div>
                <span>Scale & Deal</span>
              </div>
            </div>
          </div>

          <div className="detail-description">
            <div className="eyebrow">THE CONCEPT</div>
            <h2>About this innovation</h2>
            <p>{item.desc || item.description}</p>
            <p>
              This listing is verified on the IDEA2IMPACT production marketplace. Connect with the creator below to discuss direct collaboration, seed investment, technical co-founding, or licensing rights.
            </p>

            <div className="protection-note">
              <ShieldCheck />
              <span>
                <b>Share thoughtfully</b>
                <small>
                  Public previews do not establish patent rights or legal protection. Use the "Make an Offer" feature to initiate formal agreements and NDAs before exchanging sensitive technical blueprints.
                </small>
              </span>
            </div>

            {/* Interactive 3D CAD & Prototype Explorer */}
            <Prototype3DViewer title={item.title} category={item.category} />

            {/* Confidential Deal Room Banner */}
            <div className="deal-room-banner">
              <div className="deal-room-left">
                <div className="deal-room-badge-icon">
                  <Lock size={20} />
                </div>
                <div>
                  <div className="deal-room-title">Confidential Deal Room & Technical IP</div>
                  <div className="deal-room-desc">Full schematics, CAD models & pro-forma cap table protected under Mutual NDA.</div>
                </div>
              </div>
              <button className="btn btn-primary small" onClick={() => setShowNDAModal(true)}>
                <ShieldCheck size={14} /> Request Access & Sign NDA
              </button>
            </div>

            {/* Comments Section */}
            <div className="comments-section">
              <div className="comments-head">
                <h3>
                  <MessageSquare size={18} /> Discussion & Feedback
                  <span className="comments-count-badge">{comments.length}</span>
                </h3>
              </div>

              {user ? (
                <form className="comment-form" onSubmit={submitComment}>
                  <textarea
                    rows={3}
                    placeholder="Share feedback, ask technical questions, or connect with the creator..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <div className="comment-form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary small"
                      disabled={postingComment || !commentText.trim()}
                    >
                      {postingComment ? 'Posting...' : 'Post comment'} <Send size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="comment-form" style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ margin: '0 0 10px' }}>Sign in to join the conversation and leave feedback for the creator.</p>
                  <Link to="/login" className="btn btn-outline small" style={{ display: 'inline-flex' }}>
                    Log in to comment
                  </Link>
                </div>
              )}

              <div className="comment-list">
                {comments.length > 0 ? (
                  comments.map(c => (
                    <div className="comment-card" key={c.id}>
                      <div className="comment-card-top">
                        <div className="comment-author-info">
                          <div className="comment-avatar">
                            {c.author?.avatar ? (
                              <img src={c.author.avatar} alt={c.author.name} />
                            ) : (
                              c.author?.name?.slice(0, 1)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <div className="comment-author-name">{c.author?.name || 'Community Member'}</div>
                            <span className="comment-date">
                              {new Date(c.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        {(user?.id === c.author?.id || user?.id === item.creator?.id) && (
                          <button
                            className="btn-delete-comment"
                            title="Delete comment"
                            onClick={() => deleteComment(c.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="comment-body">{c.body}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="detail-aside">
          <span className="status-pill"><i /> Public listing</span>
          <h1>{item.title}</h1>
          <p className="detail-sub">{item.category} · Creator showcase</p>

          <div className="detail-price">
            {item.price > 0 ? `$${item.price}` : 'Open to connect'}
            <small>
              {item.price > 0 ? 'Indicative asking price · negotiation welcome' : 'Contact creator for details'}
            </small>
          </div>

          <div className="creator-box">
            <span className="creator-avatar">
              {item.creator?.profile?.avatar ? (
                <img src={item.creator.profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                item.author?.slice(0, 1)?.toUpperCase() || 'C'
              )}
            </span>
            <span>
              <small>CREATED BY</small>
              <b>{item.author || 'Creator'}</b>
              {item.creator?.profile?.headline && (
                <small style={{ color: 'var(--muted)', display: 'block' }}>{item.creator.profile.headline}</small>
              )}
            </span>
            <span className="verified">✦</span>
          </div>

          <div className="detail-actions-bar">
            <button
              className={`btn-like ${isLiked ? 'liked' : ''}`}
              onClick={toggleLike}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </button>
            <button
              className={`btn-like ${isSaved ? 'liked' : ''}`}
              onClick={toggleSave}
              title={isSaved ? 'Remove bookmark' : 'Bookmark'}
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Make an Offer Button */}
          <button className="btn btn-primary full" onClick={() => setShowProposalModal(true)}>
            <Handshake size={16} /> Make an Offer / Partner
          </button>

          {/* AI Investor One-Pager Button */}
          <button className="btn btn-outline full" onClick={generatePitchDeck} style={{ marginTop: '8px' }}>
            <FileText size={16} /> AI Investor One-Pager
          </button>

          {/* Micro-Backing Pledge Button */}
          <button className="btn btn-outline full" onClick={() => setShowBackingModal(true)} style={{ marginTop: '8px' }}>
            <Coffee size={16} /> Back this Inventor ($5 - $100)
          </button>

          {/* Cryptographic IP Certificate Button */}
          <button className="btn btn-ghost full small" onClick={() => setShowCertificateModal(true)} style={{ marginTop: '8px' }}>
            <Award size={15} /> View Cryptographic IP Certificate
          </button>

          <p className="detail-disclaimer">
            <LockKeyhole size={14} /> Direct encrypted communication. Proposals and negotiations are delivered privately to the creator's workspace.
          </p>
        </aside>
      </div>

      {/* Make an Offer Modal */}
      {showProposalModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Submit Proposal / Offer</h2>
              <button className="modal-close-btn" onClick={() => setShowProposalModal(false)}>
                <X size={20} />
              </button>
            </div>

            {proposalNotice && <div className="success-note">{proposalNotice}</div>}

            <form onSubmit={submitProposal}>
              <label>
                Proposal Type
                <select value={proposalType} onChange={e => setProposalType(e.target.value)}>
                  <option>Investment</option>
                  <option>Licensing</option>
                  <option>Co-founder</option>
                  <option>Acquisition</option>
                  <option>Collaboration</option>
                </select>
              </label>

              <label>
                Proposed Amount / Budget ($)
                <input
                  value={proposalAmount}
                  onChange={e => setProposalAmount(e.target.value)}
                  placeholder="e.g. $25,000 seed tranche or 5% royalty"
                />
              </label>

              <label>
                Message & Scope
                <textarea
                  rows={4}
                  required
                  value={proposalMessage}
                  onChange={e => setProposalMessage(e.target.value)}
                  placeholder="Introduce yourself, your background, and describe your proposed terms or partnership vision..."
                />
              </label>

              <label>
                Your Contact Email or Phone
                <input
                  value={proposalContact}
                  onChange={e => setProposalContact(e.target.value)}
                  placeholder="you@fund.com or +1 415-..."
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingProposal}>
                  {submittingProposal ? 'Sending...' : 'Send Offer to Creator'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowProposalModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Pitch Deck Modal */}
      {showDeckModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2>
                <Sparkles size={20} style={{ color: 'var(--cyan)' }} />
                Investor One-Pager Executive Summary
              </h2>
              <button className="modal-close-btn" onClick={() => setShowDeckModal(false)}>
                <X size={20} />
              </button>
            </div>

            {loadingDeck || !deck ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Sparkles className="pulse" size={28} />
                <p style={{ marginTop: '12px' }}>Synthesizing investor thesis...</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{deck.title}</h3>
                    <small style={{ color: 'var(--muted)' }}>Lead: {deck.creator} · {deck.creatorTitle}</small>
                  </div>
                  <span className="status-pill">{deck.suggestedTranche}</span>
                </div>

                <div className="deck-card">
                  <h4>The Problem & Opportunity</h4>
                  <p>{deck.problemStatement}</p>
                </div>

                <div className="deck-card">
                  <h4>Proprietary Innovation & Advantage</h4>
                  <p>{deck.solutionAdvantage}</p>
                </div>

                <div className="deck-card">
                  <h4>Target Market</h4>
                  <p>{deck.marketOpportunity}</p>
                </div>

                <div className="deck-card">
                  <h4>Execution Milestones</h4>
                  {deck.milestones.map((m, i) => (
                    <div key={i} style={{ marginBottom: '8px', fontSize: '12px' }}>
                      <b style={{ color: 'var(--cyan)' }}>{m.phase}:</b> {m.detail}
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-outline full"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(deck, null, 2));
                    alert('Executive one-pager summary copied to clipboard!');
                  }}
                >
                  Copy Summary Text
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1-Click Digital Mutual NDA Modal */}
      {showNDAModal && (
        <DigitalNDAModal
          innovation={item}
          user={user}
          onClose={() => setShowNDAModal(false)}
        />
      )}

      {/* Cryptographic IP Proof of Creation Certificate Modal */}
      {showCertificateModal && (
        <IPCertificateModal
          innovation={item}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {/* Micro-Backing / Buy Coffee Modal */}
      {showBackingModal && (
        <MicroBackingModal
          innovation={item}
          user={user}
          onClose={() => setShowBackingModal(false)}
          onPledged={() => {
            fetchDetail();
            onRefresh();
          }}
        />
      )}
    </main>
  );
}

function Auth({ mode, onAuth }) {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Creator');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { name, email, password, role };

      const data = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (data.user) {
        onAuth(data.user, data.token);
        nav('/dashboard');
      } else {
        throw new Error('Authentication response invalid');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand">
          <span className="brand-mark"><Sparkles size={18} /></span>
          IDEA<span className="brand-blue">2</span>IMPACT
        </Link>
        <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Make your idea matter.'}</h1>
        <p>{mode === 'login' ? 'Pick up where your ideas left off.' : 'Join a community built to move good ideas forward.'}</p>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Your full name
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maya Chen"
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength="8"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          {mode === 'signup' && (
            <label>
              Your primary role
              <select value={role} onChange={e => setRole(e.target.value)}>
                {['Creator', 'Customer / Buyer', 'Company', 'Investor', 'Builder', 'Patent Professional'].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <small className="muted">You can customize your role and skills anytime in your profile.</small>
            </label>
          )}

          {error && <div className="error-note">{error}</div>}

          <button className="btn btn-primary full" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (mode === 'login' ? 'Log in' : 'Create free account')}{' '}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>New to IDEA2IMPACT? <Link to="/signup">Create an account</Link></>
          ) : (
            <>Already have an account? <Link to="/login">Log in</Link></>
          )}
        </div>
      </div>
    </main>
  );
}

function Dashboard({ user, onRefresh, onUpdateUser }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState({
    myInnovationsCount: 0,
    savedCount: 0,
    totalLikesReceived: 0,
    totalCommentsReceived: 0,
    profileStrength: 85
  });
  const [myInnovations, setMyInnovations] = useState([]);
  const [savedInnovations, setSavedInnovations] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Idea Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Ideas');
  const [price, setPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit Idea Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Ideas');
  const [editPrice, setEditPrice] = useState(0);
  const [editImageUrl, setEditImageUrl] = useState('');

  // Profile Edit State
  const [headline, setHeadline] = useState(user?.profile?.headline || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [skillsStr, setSkillsStr] = useState(user?.profile?.skills?.join(', ') || '');
  const [location, setLocation] = useState(user?.profile?.location || '');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const [statsRes, myRes, savedRes, propRes] = await Promise.all([
        api('/dashboard/stats').catch(() => ({ stats: {}, recentActivity: [] })),
        api('/dashboard/my-innovations').catch(() => ({ items: [] })),
        api('/dashboard/saved').catch(() => ({ items: [] })),
        api('/dashboard/proposals').catch(() => ({ proposals: [] }))
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (statsRes.recentActivity) setRecentActivity(statsRes.recentActivity);
      if (myRes.items) setMyInnovations(myRes.items);
      if (savedRes.items) setSavedInnovations(savedRes.items);
      if (propRes.proposals) setProposals(propRes.proposals);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    try {
      setUploadingImage(true);
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      alert(`Image upload error: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const createInnovation = async () => {
    if (!title.trim() || !desc.trim() || submitting) return;

    try {
      setSubmitting(true);
      await api('/innovations', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: desc.trim(),
          category,
          price: Number(price) || 0,
          imageUrl: imageUrl || null,
          ownershipConfirmed: true,
          visibility: 'PUBLIC'
        })
      });

      setTitle('');
      setDesc('');
      setImageUrl('');
      setImageFile(null);
      setImagePreview('');
      setNotice('Your innovation was successfully published to the online marketplace!');
      setTab('My innovations');
      loadDashboardData();
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to publish innovation');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDesc(item.desc || item.description);
    setEditCategory(item.category);
    setEditPrice(item.price || 0);
    setEditImageUrl(item.imageUrl || '');
  };

  const saveEdit = async () => {
    if (!editingItem || !editTitle.trim() || !editDesc.trim()) return;

    try {
      await api(`/innovations/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          category: editCategory,
          price: Number(editPrice) || 0,
          imageUrl: editImageUrl || null
        })
      });

      setEditingItem(null);
      setNotice('Innovation updated successfully!');
      loadDashboardData();
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update innovation');
    }
  };

  const deleteInnovation = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this innovation?')) return;

    try {
      await api(`/innovations/${id}`, { method: 'DELETE' });
      setNotice('Innovation deleted permanently.');
      loadDashboardData();
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete innovation');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          headline: headline.trim(),
          bio: bio.trim(),
          skills,
          location: location.trim()
        })
      });

      if (res.user) {
        onUpdateUser(res.user);
        localStorage.setItem('i2i_user', JSON.stringify(res.user));
        setNotice('Profile updated successfully!');
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const role = user?.roles?.[0] || 'Creator';
  const sections = ['Overview', 'My innovations', 'Upload innovation', 'Proposals & Offers', 'Saved opportunities', 'Profile / Settings'];

  return (
    <main className="dashboard wrap">
      <aside className="dash-side">
        <div className="dash-user">
          <div className="dash-avatar">
            {user?.profile?.avatar ? (
              <img src={user.profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.name?.slice(0, 1)?.toUpperCase() || 'U'
            )}
          </div>
          <span>
            <b>{user?.name || 'Your workspace'}</b>
            <small>{role}</small>
          </span>
        </div>

        <div className="dash-label">WORKSPACE</div>
        {sections.map((s, i) => {
          const icons = [Compass, Layers, Plus, Handshake, Heart, SlidersHorizontal];
          const I = icons[i] || Compass;
          return (
            <button
              key={s}
              className={tab === s ? 'dash-active' : ''}
              onClick={() => { setTab(s); setNotice(''); }}
            >
              <I size={17} />
              {s}
              {s === 'My innovations' && myInnovations.length > 0 && (
                <i className="nav-count">{myInnovations.length}</i>
              )}
              {s === 'Proposals & Offers' && proposals.length > 0 && (
                <i className="nav-count" style={{ background: '#5ce9c1', color: '#04111b' }}>{proposals.length}</i>
              )}
            </button>
          );
        })}

        <div className="dash-side-bottom">
          <ShieldCheck size={17} />
          <span>Built for ideas<br />that move forward.</span>
        </div>
      </aside>

      <section className="dash-main">
        <div className="dash-heading">
          <div>
            <div className="eyebrow">YOUR WORKSPACE / {role.toUpperCase()}</div>
            <h1>{tab === 'Overview' ? 'Good things start here.' : tab}</h1>
            <p>Keep your ideas moving. Your next step is just a click away.</p>
          </div>
          <Link to="/marketplace" className="btn btn-outline small">
            Explore Marketplace <ArrowUpRight size={15} />
          </Link>
        </div>

        {notice && <div className="success-note">{notice}</div>}

        {/* Overview Tab */}
        {tab === 'Overview' && (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <span>My innovations</span>
                <b>{stats.myInnovationsCount || myInnovations.length}</b>
                <small><Layers size={14} /> Published on marketplace</small>
              </div>
              <div className="stat-card">
                <span>Offers & Proposals</span>
                <b>{proposals.length}</b>
                <small><Handshake size={14} /> Partnership requests</small>
              </div>
              <div className="stat-card">
                <span>Total likes received</span>
                <b>{stats.totalLikesReceived || 0}</b>
                <small><Heart size={14} /> Community appreciation</small>
              </div>
              <div className="stat-card">
                <span>Comments & Feedback</span>
                <b>{stats.totalCommentsReceived || 0}</b>
                <small><MessageCircle size={14} /> Creator discussions</small>
              </div>
            </div>

            <div className="dash-columns">
              <div className="dash-panel">
                <div className="panel-title">
                  <h3>Recent innovations</h3>
                  <button onClick={() => setTab('My innovations')}>View all <ArrowRight size={14} /></button>
                </div>
                {myInnovations.slice(0, 4).map(x => (
                  <div className="recent-row" key={x.id}>
                    <span className="recent-icon art-blue">✳</span>
                    <span>
                      <b>{x.title}</b>
                      <small>{x.category} · {x.likeCount || 0} likes · {x.commentCount || 0} comments</small>
                    </span>
                    <span className="status-pill">Public</span>
                  </div>
                ))}
                {myInnovations.length === 0 && (
                  <p style={{ color: 'var(--muted)', padding: '20px 0' }}>
                    You have not published any innovations yet. Click "Upload innovation" to get started!
                  </p>
                )}
              </div>

              <div className="dash-panel next-panel">
                <div className="panel-title">
                  <h3>Recent Activity</h3>
                </div>
                <div className="activity-feed">
                  {recentActivity.length > 0 ? (
                    recentActivity.map(act => (
                      <div className="activity-row" key={act.id}>
                        <div className={`activity-icon-badge ${act.type}`}>
                          {act.type === 'comment' ? <MessageCircle size={14} /> : <Heart size={14} />}
                        </div>
                        <div>
                          <div className="activity-text">{act.message}</div>
                          <span className="activity-date">
                            {new Date(act.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
                      No recent likes or comments yet. As the community interacts with your ideas, activity will appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* My Innovations Tab */}
        {tab === 'My innovations' && (
          <div className="listing-grid">
            {myInnovations.length > 0 ? (
              myInnovations.map(x => (
                <div className="dash-item-card" key={x.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
                  {x.imageUrl && (
                    <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                      <img src={x.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="card-meta">
                    <span>{x.category}</span>
                    <span>{x.price > 0 ? `$${x.price}` : 'Free'}</span>
                  </div>
                  <h3 style={{ margin: '8px 0', fontSize: '16px' }}>{x.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>
                    {x.desc?.slice(0, 120)}{x.desc?.length > 120 ? '...' : ''}
                  </p>
                  <div className="card-stats">
                    <span className="card-stat-item"><Heart size={13} /> {x.likeCount || 0}</span>
                    <span className="card-stat-item"><MessageCircle size={13} /> {x.commentCount || 0}</span>
                    <span className="status-pill" style={{ marginLeft: 'auto' }}>Published</span>
                  </div>
                  <div className="dash-card-actions">
                    <button className="btn btn-outline small" onClick={() => startEdit(x)}>
                      <Edit3 size={13} /> Edit
                    </button>
                    <button className="btn btn-danger small" onClick={() => deleteInnovation(x.id)}>
                      <Trash2 size={13} /> Delete
                    </button>
                    <Link to={`/innovation/${x.id}`} className="btn btn-ghost small" style={{ flex: 'none' }}>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <Lightbulb size={32} />
                <h3>Your next idea belongs here.</h3>
                <p>Publish a concept to start building your innovation portfolio permanently in the database.</p>
                <button className="btn btn-primary" onClick={() => setTab('Upload innovation')}>
                  Upload innovation <Plus size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Proposals & Offers Tab */}
        {tab === 'Proposals & Offers' && (
          <div>
            {proposals.length > 0 ? (
              proposals.map(p => (
                <div className="proposal-card" key={p.id}>
                  <div className="proposal-top">
                    <div className="proposal-sender">
                      <div className="proposal-avatar">
                        {p.sender.avatar ? (
                          <img src={p.sender.avatar} alt={p.sender.name} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#8ff2ff', fontWeight: 'bold' }}>
                            {p.sender.name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div>
                        <b>{p.sender.name}</b>
                        <small style={{ display: 'block', color: 'var(--muted)' }}>{p.sender.headline} · {p.sender.location}</small>
                      </div>
                    </div>
                    <span className="proposal-badge">Pending Review</span>
                  </div>
                  <div className="proposal-message">{p.message}</div>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--muted)' }}>
                    Sent on {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {p.sender.email && <span> · Contact: <a href={`mailto:${p.sender.email}`} style={{ color: 'var(--cyan)' }}>{p.sender.email}</a></span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Handshake size={32} />
                <h3>No incoming proposals yet</h3>
                <p>When investors, builders or companies submit partnership offers on your innovations, they will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Upload Innovation Tab */}
        {tab === 'Upload innovation' && (
          <div className="dash-panel form-panel">
            <h3>Publish an innovation to the marketplace.</h3>
            <p className="muted">
              Your concept will be saved permanently in the Neon PostgreSQL database and discoverable by buyers, builders, and investors.
            </p>

            <label>
              Innovation Title
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. EcoCharge — Kinetic Portable Charger"
                required
              />
            </label>

            <label>
              Category
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {defaultCategoryMeta.map(c => (
                  <option key={c[0]}>{c[0]}</option>
                ))}
              </select>
            </label>

            <label>
              Estimated Price / Valuation ($)
              <input
                type="number"
                min="0"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                placeholder="0 for open to connect / free"
              />
            </label>

            <label>
              What does it do?
              <textarea
                rows={5}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Describe the problem you are solving, your approach, technical specifications, and who it helps..."
                required
              />
            </label>

            <div className="file-upload-container">
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>
                Upload Project Image (JPEG, PNG, WebP)
              </span>
              <label className="file-upload-input-wrap">
                <UploadCloud size={24} style={{ color: 'var(--cyan)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', fontWeight: '600' }}>
                  {uploadingImage ? 'Uploading image...' : 'Click to select an image from your computer'}
                </div>
                <small className="muted">Up to 5MB file size</small>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />
              </label>

              <span style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>or provide an Image URL</span>
              <input
                value={imageUrl}
                onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); }}
                placeholder="https://images.unsplash.com/..."
              />

              {imagePreview && (
                <div className="file-preview-wrap">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-img"
                    onClick={() => { setImageUrl(''); setImageFile(null); setImagePreview(''); }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <label className="checkline">
              <input type="checkbox" defaultChecked />
              I confirm I have the right to share this innovation publicly.
            </label>

            <button
              className="btn btn-primary"
              onClick={createInnovation}
              disabled={submitting || !title.trim() || !desc.trim()}
            >
              {submitting ? 'Publishing...' : 'Publish innovation'} <ArrowUpRight size={16} />
            </button>
          </div>
        )}

        {/* Saved Opportunities Tab */}
        {tab === 'Saved opportunities' && (
          <div className="listing-grid">
            {savedInnovations.length > 0 ? (
              savedInnovations.map(x => (
                <InnovationCard item={x} key={x.id} />
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <Heart size={32} />
                <h3>No bookmarked ideas yet</h3>
                <p>Browse the marketplace and click the heart icon to save innovations you are interested in.</p>
                <Link to="/marketplace" className="btn btn-primary">Browse Marketplace</Link>
              </div>
            )}
          </div>
        )}

        {/* Profile / Settings Tab */}
        {tab === 'Profile / Settings' && (
          <div className="dash-panel form-panel">
            <h3>Your Innovator Profile</h3>
            <p className="muted">Customize how your public identity appears on innovations and comments.</p>

            <form className="settings-form" onSubmit={saveProfile}>
              <label>
                Professional Headline
                <input
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. CleanTech Founder & Hardware Architect"
                />
              </label>

              <label>
                Short Bio
                <textarea
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell other builders, investors and buyers about your journey and experience..."
                />
              </label>

              <label>
                Skills (comma-separated)
                <input
                  value={skillsStr}
                  onChange={e => setSkillsStr(e.target.value)}
                  placeholder="IoT, Product Design, Rapid Prototyping, React, Machine Learning"
                />
              </label>

              <label>
                Location
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                />
              </label>

              <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                {profileSaving ? 'Saving profile...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Edit Innovation Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Innovation</h2>
              <button className="modal-close-btn" onClick={() => setEditingItem(null)}>
                <X size={20} />
              </button>
            </div>

            <label>
              Title
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
              />
            </label>

            <label>
              Category
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {defaultCategoryMeta.map(c => (
                  <option key={c[0]}>{c[0]}</option>
                ))}
              </select>
            </label>

            <label>
              Price ($)
              <input
                type="number"
                min="0"
                value={editPrice}
                onChange={e => setEditPrice(Number(e.target.value))}
              />
            </label>

            <label>
              Description
              <textarea
                rows={5}
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                required
              />
            </label>

            <label>
              Image URL
              <input
                value={editImageUrl}
                onChange={e => setEditImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveEdit}>
                Save Changes
              </button>
              <button className="btn btn-outline" onClick={() => setEditingItem(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AIStudio() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hey! I’m your IDEA2IMPACT creative co-pilot. Tell me what you’re working on, or pick a prompt below. I can help shape a concept, plan a prototype or think through your audience.\n\nI’m in clearly labelled demo mode until an AI API key is configured.'
    }
  ]);
  const [busy, setBusy] = useState(false);

  const send = async (value = prompt) => {
    if (!value.trim() || busy) return;
    setMessages(m => [...m, { role: 'user', text: value }]);
    setPrompt('');
    setBusy(true);
    const res = await demoAI(value);
    setMessages(m => [...m, { role: 'assistant', text: res.reply, mode: res.mode || 'demo' }]);
    setBusy(false);
  };

  return (
    <main className="page wrap ai-page">
      <div className="page-top">
        <div className="eyebrow">IDEA2IMPACT INTELLIGENCE</div>
        <h1>Make space for <span className="gradient-text">better ideas.</span></h1>
        <p>A creative co-pilot for brainstorming, planning and finding your next useful step.</p>
      </div>

      <div className="chat-shell">
        <aside className="chat-aside">
          <div className="chat-brand">
            <span className="brand-mark"><Sparkles /></span>
            <b>Idea assistant</b>
            <span className="demo-badge">DEMO MODE</span>
          </div>
          <p>What are we thinking through today?</p>
          {[
            'Help me improve my idea pitch',
            'Create a simple prototype roadmap',
            'Who could be my first customers?',
            'What skills does my project need?',
            'Explain licensing in simple terms'
          ].map(x => (
            <button key={x} onClick={() => send(x)}>
              {x} <ArrowUpRight size={14} />
            </button>
          ))}
          <div className="chat-safety">
            <ShieldCheck size={16} /> AI responses are starting points, not legal, patent, investment or market advice.
          </div>
        </aside>

        <section className="chat-main">
          <div className="chat-top">
            <span><i className="live-dot" /> Assistant online</span>
            <span>IDEA2IMPACT / AI STUDIO</span>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div className={`chat-message ${m.role}`} key={i}>
                <div className="chat-avatar">
                  {m.role === 'assistant' ? <Sparkles size={16} /> : 'Y'}
                </div>
                <div>
                  <div className="message-label">
                    {m.role === 'assistant' ? 'IDEA ASSISTANT' : 'YOU'} {m.mode && <span>· {m.mode.toUpperCase()}</span>}
                  </div>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {busy && <div className="typing">Thinking through it<span> · · ·</span></div>}
          </div>
          <div className="chat-input">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Tell me about the idea you're exploring..."
              rows={2}
            />
            <button className="send-btn" onClick={() => send()} disabled={busy || !prompt.trim()}>
              <Send size={17} />
            </button>
          </div>
          <div className="chat-foot">Enter to send · Shift + Enter for a new line</div>
        </section>
      </div>
    </main>
  );
}

function Pricing() {
  const plans = [
    ['FREE', '$0', 'For curious minds', ['Browse innovations', 'Basic profile', 'Save opportunities', 'Community access'], 'Get started'],
    ['CREATOR PRO', '$12', 'For makers moving forward', ['Enhanced creator profile', 'Advanced listing insights', 'Featured listing eligibility', 'More creator tools'], 'Coming soon'],
    ['COMPANY', '$39', 'For teams seeking new ideas', ['Company profile', 'Advanced discovery', 'Collaboration opportunities', 'Team workspace'], 'Coming soon'],
    ['INVESTOR PRO', '$29', 'For opportunity explorers', ['Advanced opportunity discovery', 'Saved opportunities', 'Enhanced matching', 'Creator connections'], 'Coming soon']
  ];

  return (
    <main className="page wrap pricing-page">
      <div className="page-top centered">
        <div className="eyebrow">SIMPLE PLANS. BIG POSSIBILITIES.</div>
        <h1>Find your way to <span className="gradient-text">what’s next.</span></h1>
        <p>Start free. Grow into the tools that fit your journey.</p>
        <span className="demo-badge">HACKATHON DEMO · NO PAYMENTS</span>
      </div>
      <div className="pricing-grid">
        {plans.map(([name, price, desc, features, cta], i) => (
          <div className={`price-card ${i === 1 ? 'featured-price' : ''}`} key={name}>
            <div className="price-top">
              <span>{name}</span>
              {i === 1 && <b>POPULAR</b>}
            </div>
            <h2>{price}<small>{i ? ' / month' : ''}</small></h2>
            <p>{desc}</p>
            <div className="price-divider" />
            {features.map(f => (
              <div className="price-feature" key={f}>
                <Check size={16} />{f}
              </div>
            ))}
            {i === 0 ? (
              <Link to="/signup" className="btn btn-outline full">{cta} <ArrowRight size={15} /></Link>
            ) : (
              <button className="btn btn-outline full" disabled>{cta}</button>
            )}
          </div>
        ))}
      </div>
      <p className="pricing-note">All paid plans are illustrative and coming soon. No billing or subscriptions are active in this demo.</p>
    </main>
  );
}

function Footer({ isHome, dark }) {
  return (
    <footer className={`footer ${!dark ? 'home-footer' : ''}`}>
      <div className="wrap">
        <div className="footer-main">
          <div>
            <Link to="/" className="brand">
              <span className="brand-mark"><Sparkles size={18} /></span>
              IDEA<span className="brand-blue">2</span>IMPACT
            </Link>
            <p>A platform where ideas<br />find their next step.</p>
          </div>
          <div className="footer-links">
            <div>
              <b>EXPLORE</b>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/talents">Talent & Builders</Link>
              <Link to="/ai-studio">AI Studio</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div>
              <b>PLATFORM</b>
              <a href="/#how">How it works</a>
              <Link to="/signup">Join the community</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
            <div>
              <b>LEGAL & SUPPORT</b>
              <a href="mailto:hello@idea2impact.example">Contact</a>
              <a href="#privacy">Privacy policy</a>
              <a href="#terms">Terms & conditions</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 IDEA2IMPACT. Built for ideas that move the world.</span>
          <span>DESIGNED FOR THE NEXT BIG THING <span className="gradient-text">✦</span></span>
        </div>
      </div>
    </footer>
  );
}

export default App;
