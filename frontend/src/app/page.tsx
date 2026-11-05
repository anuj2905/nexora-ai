
"use client";

import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  FileSearch,
  LockKeyhole,
  MessageSquareText,
  Network,
  Sparkles,
  Workflow,
  Zap,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: MessageSquareText,
    title: "AI Chat",
    text: "Ask questions, explore ideas, and get intelligent answers from your AI assistant.",
    tag: "CONVERSATIONS",
  },
  {
    icon: FileSearch,
    title: "Document Intelligence",
    text: "Upload documents, understand their content, and find answers from your files.",
    tag: "KNOWLEDGE",
  },
  {
    icon: Network,
    title: "AI Agents",
    text: "Work with specialized AI assistants to handle complex, multi-step tasks.",
    tag: "AUTOMATION",
  },
  {
    icon: AudioLines,
    title: "Voice Mode",
    text: "Experience a more natural way to interact with your AI workspace.",
    tag: "VOICE",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Analytics",
    text: "Understand workspace activity through meaningful insights and analytics.",
    tag: "INSIGHTS",
  },
  {
    icon: Workflow,
    title: "Workflows",
    text: "Connect your conversations, documents, and intelligent agent workflows.",
    tag: "PRODUCTIVITY",
  },
];

const robots = [
  {
    name: "Nexa Chat",
    role: "YOUR AI COMPANION",
    text: "Your intelligent companion for learning, brainstorming, and everyday questions.",
    image: "/robots/nexa-chat.png",
    tone: "violet",
    icon: MessageSquareText,
    number: "01",
  },
  {
    name: "DocuMind",
    role: "DOCUMENT EXPERT",
    text: "Understand your documents and extract important information in seconds.",
    image: "/robots/documind.png",
    tone: "mint",
    icon: FileSearch,
    number: "02",
  },
  {
    name: "Agent Forge",
    role: "WORKFLOW BUILDER",
    text: "Create intelligent workflows and automate repetitive tasks with AI.",
    image: "/robots/agent-forge.png",
    tone: "purple",
    icon: Network,
    number: "03",
  },
  {
    name: "InsightBot",
    role: "DATA & INSIGHTS",
    text: "Turn workspace activity and information into meaningful insights.",
    image: "/robots/insightbot.png",
    tone: "blue",
    icon: ChartNoAxesCombined,
    number: "04",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    text: "Sign up and get access to your personal AI workspace.",
  },
  {
    number: "02",
    title: "Choose your AI tools",
    text: "Chat with AI, upload documents, and explore specialized agents.",
  },
  {
    number: "03",
    title: "Get things done",
    text: "Analyze information, automate tasks, and improve productivity.",
  },
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="nexora-landing">
      {/* Navigation */}
      <header className="landing-header">
        <div className="header-inner">
          <Link href="/" className="landing-brand">
            <span className="brand-symbol">
              <Sparkles size={22} />
            </span>
            <span>
              Nexora <b>AI</b>
            </span>
          </Link>

          <nav className={`landing-nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#robots" onClick={() => setMobileMenuOpen(false)}>AI Robots</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>

            <div className="mobile-nav-actions">
              <Link href="/login" className="mobile-login">Log In</Link>
              <Link href="/login?mode=signup" className="mobile-signup">
                Sign Up Free <ArrowRight size={16} />
              </Link>
            </div>
          </nav>

          <div className="header-actions">
            <Link href="/login" className="nav-login">
              Log In
            </Link>
            <Link href="/login?mode=signup" className="nav-signup">
              Sign Up Free <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero" id="home">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-kicker">
              <Sparkles size={15} />
              YOUR INTELLIGENT AI WORKSPACE
            </div>

            <h1>
              One workspace.
              <br />
              <span>Infinite intelligence.</span>
            </h1>

            <h2>
              Chat <i>•</i> Analyze <i>•</i> Automate <i>•</i> Create
            </h2>

            <p>
              Bring conversations, documents, intelligent agents, and
              automation together in one powerful AI workspace.
            </p>

            <div className="hero-buttons">
              <Link href="/login?mode=signup" className="primary-cta">
                Get Started Free <ArrowRight size={18} />
              </Link>

              <Link href="/login" className="outline-cta">
                <LockKeyhole size={16} />
                Log In
              </Link>
            </div>

            <div className="hero-assurances">
              <span><ShieldCheck size={16} /> Secure Workspace</span>
              <span><Check size={16} /> Intelligent AI</span>
              <span><Zap size={16} /> Built for Productivity</span>
            </div>

            <div className="hero-stats">
              <div>
                <strong>01</strong>
                <span>Connected workspace</span>
              </div>
              <div>
                <strong>04</strong>
                <span>Specialized AI robots</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>Possibilities</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />
            <div className="visual-label">
              <span className="live-dot" />
              MEET YOUR AI TEAM
            </div>

            <img
              className="hero-image"
              src="/robots/hero-robots.png"
              alt="Nexora AI assistant robots"
            />

            <div className="floating-card floating-card-chat">
              <span className="floating-icon chat-icon">
                <MessageSquareText size={19} />
              </span>
              <div>
                <b>AI Conversations</b>
                <small>Think smarter with AI</small>
              </div>
            </div>

            <div className="floating-card floating-card-doc">
              <span className="floating-icon doc-icon">
                <FileSearch size={19} />
              </span>
              <div>
                <b>Document AI</b>
                <small>Your knowledge, connected</small>
              </div>
            </div>

            <div className="floating-card floating-card-agent">
              <span className="floating-icon agent-icon">
                <Network size={19} />
              </span>
              <div>
                <b>AI Agents</b>
                <small>Workflows made intelligent</small>
              </div>
            </div>

            <div className="visual-bottom-label">
              <Sparkles size={15} />
              Intelligence, connected.
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="capability-section">
        <div className="capability-inner">
          <span className="capability-heading">ONE CONNECTED ENVIRONMENT</span>
          <div className="capability-item">AI CHAT</div>
          <div className="capability-item">DOCUMENT INTELLIGENCE</div>
          <div className="capability-item">AGENT WORKFLOWS</div>
          <div className="capability-item">VOICE MODE</div>
          <div className="capability-item">ANALYTICS</div>
        </div>
      </section>

      {/* AI Robots */}
      <section className="robots-section section-container" id="robots">
        <div className="section-heading">
          <div className="section-eyebrow">MEET YOUR DIGITAL TEAM</div>
          <h2>
            Meet your <span>AI Robots.</span>
          </h2>
          <p>
            Four specialized AI assistants. One intelligent workspace.
          </p>
        </div>

        <div className="robot-grid">
          {robots.map((robot) => {
            const Icon = robot.icon;

            return (
              <article
                className={`robot-card ${robot.tone}`}
                key={robot.name}
              >
                <div className="robot-card-top">
                  <span className="robot-number">{robot.number}</span>
                  <span className="robot-status">
                    <span />
                    AI ASSISTANT
                  </span>
                </div>

                <div className="robot-image">
                  <img
                    src={robot.image}
                    alt={`${robot.name} AI robot`}
                    loading="lazy"
                  />
                </div>

                <div className="robot-details">
                  <div className="robot-title">
                    <span className="robot-icon">
                      <Icon size={19} />
                    </span>
                    <h3>{robot.name}</h3>
                  </div>

                  <div className="robot-role">{robot.role}</div>
                  <p>{robot.text}</p>
                </div>

                <div className="robot-card-glow" />
              </article>
            );
          })}
        </div>
      </section>

      {/* Platform highlights */}
      <section className="platform-section" id="about">
        <div className="platform-inner">
          <div className="platform-heading">
            <div className="section-eyebrow">WHY NEXORA AI</div>
            <h2>
              Everything connected.
              <br />
              <span>Nothing complicated.</span>
            </h2>
            <p>
              A unified environment designed to bring your AI-powered work
              together without switching between multiple tools.
            </p>
          </div>

          <div className="platform-highlights">
            <article className="highlight-card">
              <span className="highlight-icon violet-icon">
                <BrainCircuit size={25} />
              </span>
              <div>
                <h3>Multimodal AI</h3>
                <p>Work with conversations, documents, and more.</p>
              </div>
            </article>

            <article className="highlight-card">
              <span className="highlight-icon mint-icon">
                <LockKeyhole size={25} />
              </span>
              <div>
                <h3>Your Data, Your Control</h3>
                <p>Keep your workspace and information protected.</p>
              </div>
            </article>

            <article className="highlight-card">
              <span className="highlight-icon blue-icon">
                <Workflow size={25} />
              </span>
              <div>
                <h3>All-in-One Workspace</h3>
                <p>Bring chat, tools, agents, and analytics together.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section section-container" id="features">
        <div className="section-heading">
          <div className="section-eyebrow">POWERFUL TOOLS, ONE WORKSPACE</div>
          <h2>
            Everything you need to <span>move forward.</span>
          </h2>
          <p>Explore the capabilities available inside Nexora AI.</p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="feature-card" key={feature.title}>
                <div className="feature-card-top">
                  <span className="feature-icon">
                    <Icon size={23} />
                  </span>
                  <span className="feature-tag">{feature.tag}</span>
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <div className="feature-arrow">
                  <ArrowRight size={17} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how">
        <div className="section-container">
          <div className="section-heading">
            <div className="section-eyebrow">GET STARTED IN THREE STEPS</div>
            <h2>
              From idea to <span>action.</span>
            </h2>
            <p>Your intelligent workspace is only a few steps away.</p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <div className="step-number">{step.number}</div>
                <div className="step-line" />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-orb cta-orb-one" />
        <div className="cta-orb cta-orb-two" />

        <div className="cta-content">
          <div className="section-eyebrow">YOUR NEXT IDEA STARTS HERE</div>
          <h2>
            Make room for
            <br />
            <span>what's possible.</span>
          </h2>
          <p>
            Bring your conversations, knowledge, and AI workflows together.
          </p>

          <Link href="/login?mode=signup" className="primary-cta">
            Create Your Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link href="/" className="landing-brand">
              <span className="brand-symbol">
                <Sparkles size={19} />
              </span>
              <span>
                Nexora <b>AI</b>
              </span>
            </Link>
            <p>Intelligence, connected.</p>
          </div>

          <div className="footer-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#robots">AI Robots</a>
            <a href="#how">How it Works</a>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Nexora AI. All rights reserved.</span>
            <span>Built with intelligence.</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .nexora-landing {
          --background: #080b18;
          --surface: #11172a;
          --text: #f7f7ff;
          --muted: #a6afc9;
          --purple: #9a6bff;
          --cyan: #35dce5;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          color: var(--text);
          background:
            radial-gradient(ellipse at 5% 12%, rgba(105, 49, 165, .22), transparent 35%),
            radial-gradient(ellipse at 95% 24%, rgba(0, 134, 183, .14), transparent 32%),
            var(--background);
          font-family: Arial, Helvetica, sans-serif;
        }

        .landing-header {
          width: 100%;
          position: relative;
          z-index: 20;
          background: rgba(8, 11, 24, .78);
          border-bottom: 1px solid rgba(160, 147, 255, .11);
          backdrop-filter: blur(18px);
        }

        .header-inner {
          width: min(1500px, calc(100% - 100px));
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
        }

        .landing-brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          color: #fff;
          text-decoration: none;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -.05em;
          white-space: nowrap;
        }

        .landing-brand b {
          color: #a98aff;
        }

        .brand-symbol {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(140deg, #a64dff, #625dff);
          box-shadow: 0 0 28px rgba(139, 77, 255, .35);
        }

        .landing-nav {
          display: flex;
          align-items: center;
          gap: clamp(20px, 3vw, 45px);
        }

        .landing-nav a,
        .nav-login {
          color: #c6cbe0;
          font-size: 14px;
          text-decoration: none;
          transition: color .2s;
        }

        .landing-nav a:hover,
        .nav-login:hover {
          color: var(--cyan);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        /* Header authentication buttons: explicit anchor styles prevent
           global link styles from making them look like plain text. */
        :global(a.nav-login) {
          min-height: 43px !important;
          padding: 0 20px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px solid rgba(177, 145, 255, .75) !important;
          border-radius: 999px !important;
          color: #ffffff !important;
          background: rgba(119, 117, 248, .12) !important;
          text-decoration: none !important;
          font-size: 13px !important;
          font-weight: 750 !important;
          line-height: 1 !important;
          transition: background .2s, border-color .2s, transform .2s !important;
        }

        :global(a.nav-login:hover) {
          border-color: #45dce5 !important;
          background: rgba(119, 117, 248, .24) !important;
          transform: translateY(-2px);
        }

        :global(a.nav-signup) {
          min-height: 43px !important;
          padding: 0 21px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          border: 1px solid rgba(198, 157, 255, .55) !important;
          border-radius: 999px !important;
          color: #ffffff !important;
          background: linear-gradient(100deg, #a23df1, #6958ff 65%, #05bfd1) !important;
          text-decoration: none !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          box-shadow: 0 7px 25px rgba(124, 54, 255, .32) !important;
          transition: transform .2s, filter .2s, box-shadow .2s !important;
        }

        :global(a.nav-signup:hover) {
          transform: translateY(-2px);
          filter: brightness(1.12);
          box-shadow: 0 10px 30px rgba(124, 54, 255, .42) !important;
        }

        /* Hero and final call-to-action buttons.
           Use explicit global anchor rules so inherited/global link styles
           cannot strip the button background, border, padding, or shape. */
        :global(a.primary-cta) {
          min-height: 52px !important;
          padding: 0 26px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 11px !important;
          border: 1px solid rgba(211, 170, 255, .42) !important;
          border-radius: 999px !important;
          color: #ffffff !important;
          background: linear-gradient(105deg, #b43df0 0%, #7651f5 58%, #08bfd0 100%) !important;
          box-shadow: 0 10px 30px rgba(133, 60, 255, .34) !important;
          text-decoration: none !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          transition: transform .2s ease, filter .2s ease, box-shadow .2s ease !important;
        }

        :global(a.primary-cta:hover) {
          transform: translateY(-3px);
          filter: brightness(1.12);
          box-shadow: 0 14px 36px rgba(133, 60, 255, .46) !important;
        }

        :global(a.outline-cta) {
          min-height: 52px !important;
          padding: 0 26px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 11px !important;
          border: 1px solid rgba(186, 130, 255, .82) !important;
          border-radius: 999px !important;
          color: #ffffff !important;
          background: rgba(16, 19, 43, .92) !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .035), 0 8px 22px rgba(0, 0, 0, .18) !important;
          text-decoration: none !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          transition: transform .2s ease, border-color .2s ease, background .2s ease !important;
        }

        :global(a.outline-cta:hover) {
          transform: translateY(-3px);
          border-color: #45dce5 !important;
          background: rgba(30, 41, 72, .98) !important;
        }

        .nav-signup:hover,
        .primary-cta:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
        }

        .mobile-menu-button,
        .mobile-nav-actions {
          display: none;
        }

        /* HERO */

        .landing-hero {
          position: relative;
          width: 100%;
          min-height: 620px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(157, 119, 255, .2);
          background:
            radial-gradient(ellipse at 70% 45%, rgba(62, 53, 169, .18), transparent 45%),
            linear-gradient(110deg, rgba(29, 16, 53, .45), rgba(7, 21, 43, .25));
        }

        .hero-inner {
          width: min(1500px, calc(100% - 100px));
          margin: 0 auto;
          padding: 60px 0 55px;
          display: grid;
          grid-template-columns: .95fr 1.05fr;
          align-items: center;
          gap: 40px;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          max-width: 660px;
        }

        .hero-kicker,
        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #d8c6ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .16em;
        }

        .hero-kicker {
          padding: 11px 16px;
          border: 1px solid rgba(171, 109, 255, .55);
          border-radius: 30px;
          background: rgba(89, 41, 133, .19);
        }

        .hero-kicker svg {
          color: #e2a3ff;
        }

        .hero-copy h1 {
          margin: 30px 0 18px;
          font-size: clamp(64px, 6.3vw, 94px);
          line-height: 1.04;
          letter-spacing: -.075em;
          font-weight: 900;
        }

        .hero-copy h1 span,
        .section-heading h2 span,
        .platform-heading h2 span,
        .final-cta h2 span {
          background: linear-gradient(100deg, #bd73ff, #8166ff 50%, #27dbe1);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .hero-copy h2 {
          margin: 0 0 18px;
          color: #e4e7f7;
          font-size: clamp(17px, 1.65vw, 23px);
          font-weight: 650;
        }

        .hero-copy h2 i {
          padding: 0 5px;
          color: #c77cff;
          font-style: normal;
        }

        .hero-copy > p {
          max-width: 535px;
          color: #b8c1d9;
          font-size: 16px;
          line-height: 1.85;
          margin: 0;
        }

        .hero-buttons {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 32px;
        }

        .primary-cta,
        .outline-cta {
          min-height: 52px;
          padding: 0 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          border-radius: 30px;
          color: white;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition: transform .2s, filter .2s;
        }

        .primary-cta {
          background: linear-gradient(100deg, #c03ef2, #754eff 62%, #05c7d5);
          box-shadow: 0 9px 30px rgba(133, 60, 255, .34);
        }

        .outline-cta {
          border: 1px solid rgba(186, 130, 255, .7);
          background: rgba(11, 15, 34, .65);
        }

        .outline-cta:hover {
          border-color: #4de2e7;
          background: rgba(30, 41, 72, .75);
        }

        .hero-assurances {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 25px;
          color: #c5cce0;
          font-size: 11px;
        }

        .hero-assurances span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .hero-assurances svg {
          color: #4de4ce;
        }

        .hero-stats {
          display: flex;
          gap: 35px;
          flex-wrap: wrap;
          margin-top: 42px;
          padding-top: 23px;
          border-top: 1px solid rgba(158, 147, 220, .2);
        }

        .hero-stats div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-stats strong {
          font-size: 24px;
          color: #fff;
          letter-spacing: -.04em;
        }

        .hero-stats span {
          color: #929fbd;
          font-size: 10px;
        }

        /* HERO VISUAL */

        .hero-visual {
          min-width: 0;
          min-height: 480px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .visual-glow {
          position: absolute;
          width: 75%;
          height: 70%;
          border-radius: 50%;
          background: #773bff;
          filter: blur(115px);
          opacity: .19;
        }

        .hero-image {
          position: relative;
          z-index: 1;
          display: block;
          width: 115%;
          max-width: none;
          height: 490px;
          object-fit: contain;
          filter: drop-shadow(0 22px 45px rgba(94, 50, 216, .35));
        }

        .visual-label {
          position: absolute;
          z-index: 3;
          top: 10px;
          left: 8%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 14px;
          border: 1px solid rgba(113, 130, 210, .3);
          border-radius: 30px;
          background: rgba(12, 20, 47, .85);
          color: #d7e2ff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .13em;
          backdrop-filter: blur(12px);
        }

        .live-dot,
        .robot-status > span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4be5cf;
          box-shadow: 0 0 10px #4be5cf;
        }

        .floating-card {
          position: absolute;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 190px;
          padding: 12px 14px;
          border: 1px solid rgba(155, 133, 255, .35);
          border-radius: 14px;
          background: rgba(13, 19, 43, .88);
          box-shadow: 0 12px 35px rgba(0, 0, 0, .25);
          backdrop-filter: blur(14px);
          animation: floating 4s ease-in-out infinite;
        }

        .floating-card-chat {
          top: 22%;
          right: -2%;
        }

        .floating-card-doc {
          left: -5%;
          bottom: 24%;
          animation-delay: .8s;
        }

        .floating-card-agent {
          right: 0;
          bottom: 8%;
          animation-delay: 1.4s;
        }

        .floating-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
        }

        .chat-icon {
          color: #c6a0ff;
          background: rgba(152, 94, 255, .17);
        }

        .doc-icon {
          color: #4de5dc;
          background: rgba(42, 209, 192, .13);
        }

        .agent-icon {
          color: #68bfff;
          background: rgba(58, 145, 242, .15);
        }

        .floating-card b,
        .floating-card small {
          display: block;
        }

        .floating-card b {
          color: #f5f5ff;
          font-size: 11px;
        }

        .floating-card small {
          margin-top: 4px;
          color: #8f9aba;
          font-size: 9px;
        }

        .visual-bottom-label {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          color: #bca5ff;
          font-size: 10px;
          letter-spacing: .12em;
          white-space: nowrap;
        }

        .visual-bottom-label svg {
          color: #4be3e0;
        }

        @keyframes floating {
          50% {
            transform: translateY(-10px);
          }
        }

        /* CAPABILITY BAR */

        .capability-section {
          width: 100%;
          border-bottom: 1px solid rgba(152, 130, 230, .16);
          background: rgba(13, 19, 39, .65);
        }

        .capability-inner {
          width: min(1450px, calc(100% - 100px));
          min-height: 78px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .capability-heading {
          color: #e3d8ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .capability-item {
          color: #aab6d1;
          font-size: 10px;
          letter-spacing: .08em;
        }

        .capability-item::before {
          content: "";
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 10px;
          border-radius: 50%;
          background: #38dedc;
          box-shadow: 0 0 10px #38dedc;
          vertical-align: middle;
        }

        /* COMMON SECTIONS */

        .section-container {
          width: min(1400px, calc(100% - 100px));
          margin: 0 auto;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 48px;
        }

        .section-eyebrow {
          color: #c59cff;
        }

        .section-heading h2 {
          margin: 15px 0 12px;
          color: #f7f7ff;
          font-size: clamp(34px, 4vw, 49px);
          line-height: 1.15;
          letter-spacing: -.06em;
        }

        .section-heading > p {
          margin: 0;
          color: #aab4d0;
          font-size: 15px;
          line-height: 1.7;
        }

        /* ROBOTS */

        .robots-section {
          padding-top: 105px;
          padding-bottom: 110px;
        }

        .robot-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }

        .robot-card {
          min-width: 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(162, 113, 255, .43);
          border-radius: 23px;
          padding: 19px;
          background: linear-gradient(160deg, #21183e, #11182f 75%);
          box-shadow: 0 15px 40px rgba(0, 0, 0, .19);
          transition: transform .25s, border-color .25s, box-shadow .25s;
        }

        .robot-card:hover {
          transform: translateY(-7px);
          border-color: #b78bff;
          box-shadow: 0 22px 50px rgba(120, 72, 255, .17);
        }

        .robot-card.mint {
          border-color: rgba(45, 223, 197, .45);
          background: linear-gradient(160deg, #0d3942, #101b31 75%);
        }

        .robot-card.purple {
          border-color: rgba(160, 91, 255, .5);
          background: linear-gradient(160deg, #291747, #11182f 75%);
        }

        .robot-card.blue {
          border-color: rgba(53, 175, 244, .5);
          background: linear-gradient(160deg, #103451, #11182f 75%);
        }

        .robot-card-top {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .robot-number {
          color: rgba(202, 190, 255, .65);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .robot-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #9daac6;
          font-size: 8px;
          letter-spacing: .09em;
        }

        .robot-status > span {
          width: 6px;
          height: 6px;
        }

        .robot-image {
          height: 205px;
          margin: 3px -12px 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .robot-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 8px 18px rgba(34, 214, 234, .2));
          transition: transform .3s;
        }

        .robot-card:hover .robot-image img {
          transform: scale(1.07);
        }

        .robot-details {
          position: relative;
          z-index: 2;
          padding-top: 14px;
          border-top: 1px solid rgba(190, 183, 255, .15);
        }

        .robot-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .robot-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #d4a6ff;
          background: rgba(160, 105, 255, .15);
        }

        .mint .robot-icon {
          color: #4ce8d0;
          background: rgba(42, 218, 192, .12);
        }

        .blue .robot-icon {
          color: #68caff;
          background: rgba(56, 159, 230, .13);
        }

        .robot-title h3 {
          margin: 0;
          color: #f8f7ff;
          font-size: 19px;
        }

        .robot-role {
          margin: 12px 0 8px;
          color: #c6a0ff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .mint .robot-role {
          color: #59e5d0;
        }

        .blue .robot-role {
          color: #6dcaff;
        }

        .robot-details p {
          min-height: 64px;
          margin: 0;
          color: #c0c9df;
          font-size: 14px;
          line-height: 1.7;
        }

        .robot-card-glow {
          position: absolute;
          width: 170px;
          height: 170px;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: rgba(130, 80, 255, .1);
          filter: blur(55px);
          pointer-events: none;
        }

        /* PLATFORM */

        .platform-section {
          padding: 90px 0;
          border-top: 1px solid rgba(150, 130, 230, .15);
          border-bottom: 1px solid rgba(150, 130, 230, .15);
          background:
            radial-gradient(ellipse at 12% 50%, rgba(116, 63, 204, .16), transparent 40%),
            linear-gradient(110deg, #10172e, #11172b);
        }

        .platform-inner {
          width: min(1400px, calc(100% - 100px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 80px;
          align-items: center;
        }

        .platform-heading h2 {
          margin: 18px 0;
          font-size: clamp(35px, 4vw, 49px);
          line-height: 1.14;
          letter-spacing: -.06em;
        }

        .platform-heading > p {
          max-width: 470px;
          color: #b8c2dc;
          font-size: 15px;
          line-height: 1.9;
        }

        .platform-highlights {
          display: grid;
          gap: 15px;
        }

        .highlight-card {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 20px 22px;
          border: 1px solid rgba(154, 144, 219, .2);
          border-radius: 17px;
          background: rgba(20, 28, 54, .8);
          transition: transform .2s, border-color .2s;
        }

        .highlight-card:hover {
          transform: translateX(5px);
          border-color: rgba(157, 125, 255, .7);
        }

        .highlight-icon {
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: white;
        }

        .violet-icon {
          background: linear-gradient(140deg, #8d53e9, #5d50c9);
        }

        .mint-icon {
          background: linear-gradient(140deg, #12a997, #087a83);
        }

        .blue-icon {
          background: linear-gradient(140deg, #377ed5, #3c50aa);
        }

        .highlight-card h3 {
          margin: 0 0 7px;
          font-size: 17px;
        }

        .highlight-card p {
          margin: 0;
          color: #b3bfd9;
          font-size: 14px;
          line-height: 1.6;
        }

        /* FEATURES */

        .features-section {
          padding-top: 110px;
          padding-bottom: 105px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .feature-card {
          position: relative;
          min-height: 215px;
          padding: 25px;
          border: 1px solid rgba(135, 132, 210, .23);
          border-radius: 19px;
          background: linear-gradient(145deg, rgba(28, 34, 66, .9), rgba(14, 22, 43, .95));
          transition: transform .23s, border-color .23s, background .23s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(175, 125, 255, .7);
          background: linear-gradient(145deg, #24224d, #101d38);
        }

        .feature-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 23px;
        }

        .feature-icon {
          width: 47px;
          height: 47px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(175, 133, 255, .22);
          border-radius: 14px;
          color: #c6a3ff;
          background: rgba(130, 78, 225, .15);
        }

        .feature-tag {
          color: #8999b9;
          font-size: 9px;
          letter-spacing: .13em;
        }

        .feature-card h3 {
          margin: 0 0 10px;
          font-size: 19px;
        }

        .feature-card p {
          max-width: 330px;
          margin: 0;
          color: #b8c3dc;
          font-size: 14px;
          line-height: 1.8;
        }

        .feature-arrow {
          position: absolute;
          right: 24px;
          bottom: 22px;
          color: #9e8cff;
          opacity: .75;
        }

        /* HOW IT WORKS */

        .how-section {
          padding: 85px 0 115px;
          border-top: 1px solid rgba(153, 135, 226, .13);
          background: rgba(13, 20, 39, .65);
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .step-card {
          position: relative;
          padding: 28px;
          border: 1px solid rgba(145, 137, 207, .24);
          border-radius: 19px;
          background: #121a31;
        }

        .step-number {
          color: #66dfdf;
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -.05em;
        }

        .step-line {
          width: 45px;
          height: 3px;
          margin: 20px 0;
          border-radius: 4px;
          background: linear-gradient(90deg, #ad68ff, #2edddd);
        }

        .step-card h3 {
          margin: 0 0 10px;
          font-size: 19px;
        }

        .step-card p {
          margin: 0;
          color: #b8c3dc;
          font-size: 14px;
          line-height: 1.8;
        }

        /* CTA */

        .final-cta {
          position: relative;
          overflow: hidden;
          padding: 105px 25px;
          text-align: center;
          border-top: 1px solid rgba(167, 117, 255, .25);
          border-bottom: 1px solid rgba(167, 117, 255, .2);
          background:
            radial-gradient(ellipse at 50% 100%, rgba(116, 61, 213, .25), transparent 65%),
            #0d1227;
        }

        .cta-content {
          position: relative;
          z-index: 2;
        }

        .cta-orb {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: .19;
        }

        .cta-orb-one {
          top: -220px;
          left: 15%;
          background: #a244ff;
        }

        .cta-orb-two {
          right: 12%;
          bottom: -240px;
          background: #04bfcf;
        }

        .final-cta h2 {
          margin: 18px 0 15px;
          font-size: clamp(38px, 5vw, 62px);
          line-height: 1.1;
          letter-spacing: -.06em;
        }

        .final-cta > .cta-content > p {
          margin: 0 0 30px;
          color: #b4bfd9;
          font-size: 14px;
        }

        /* FOOTER */

        .landing-footer {
          padding: 35px 0 20px;
          background: #080b18;
        }

        .footer-inner {
          width: min(1400px, calc(100% - 100px));
          margin: 0 auto;
        }

        .footer-brand .landing-brand {
          font-size: 19px;
        }

        .footer-brand .brand-symbol {
          width: 36px;
          height: 36px;
        }

        .footer-brand > p {
          margin: 12px 0 0 48px;
          color: #8894b2;
          font-size: 11px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
          margin: 28px 0;
        }

        .footer-links a {
          color: #b8c2d9;
          font-size: 13px;
          text-decoration: none;
          transition: color .2s;
        }

        .footer-links a:hover {
          color: #55e0e2;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          padding-top: 20px;
          border-top: 1px solid rgba(155, 143, 220, .15);
          color: #929db8;
          font-size: 12px;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {
          .header-inner,
          .hero-inner,
          .capability-inner,
          .section-container,
          .platform-inner,
          .footer-inner {
            width: calc(100% - 60px);
          }

          .hero-inner {
            gap: 20px;
          }

          .hero-copy h1 {
            font-size: clamp(55px, 6vw, 75px);
          }

          .hero-image {
            width: 120%;
          }

          .robot-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .robot-image {
            height: 230px;
          }

          .platform-inner {
            gap: 35px;
          }

          .capability-inner {
            justify-content: center;
            padding: 20px 0;
          }
        }

        @media (max-width: 760px) {
          .header-inner {
            min-height: 72px;
          }

          .landing-nav {
            display: none;
            position: absolute;
            top: 72px;
            left: 0;
            right: 0;
            padding: 22px 30px;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            background: #10162a;
            border-bottom: 1px solid rgba(165, 132, 255, .25);
            box-shadow: 0 15px 30px rgba(0, 0, 0, .3);
          }

          .landing-nav.mobile-open {
            display: flex;
          }

          .landing-nav a {
            padding: 13px 0;
            border-bottom: 1px solid rgba(150, 150, 190, .12);
          }

          .header-actions {
            display: none;
          }

          .mobile-menu-button {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(150, 135, 240, .3);
            border-radius: 12px;
            color: #fff;
            background: #171d35;
          }

          .mobile-nav-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding-top: 18px;
          }

          .mobile-login,
          .mobile-signup {
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            color: #fff;
            text-decoration: none;
            font-size: 13px;
          }

          .mobile-login {
            border: 1px solid #7775f8;
          }

          .mobile-signup {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            background: linear-gradient(100deg, #a23df1, #6958ff);
          }

          .hero-inner {
            grid-template-columns: 1fr;
            padding-top: 55px;
            padding-bottom: 45px;
            gap: 5px;
          }

          .hero-copy {
            max-width: 100%;
          }

          .hero-copy h1 {
            font-size: clamp(53px, 11vw, 75px);
          }

          .hero-copy > p {
            font-size: 15px;
          }

          .hero-visual {
            min-height: 390px;
          }

          .hero-image {
            width: 110%;
            height: 390px;
          }

          .floating-card {
            min-width: 155px;
            padding: 9px;
          }

          .floating-card-chat {
            right: -1%;
          }

          .floating-card-doc {
            left: -1%;
          }

          .floating-card-agent {
            right: -1%;
          }

          .visual-label {
            left: 0;
          }

          .capability-inner {
            justify-content: flex-start;
            gap: 15px 22px;
          }

          .capability-heading {
            width: 100%;
          }

          .section-container,
          .platform-inner,
          .footer-inner,
          .header-inner,
          .hero-inner,
          .capability-inner {
            width: calc(100% - 40px);
          }

          .robots-section,
          .features-section {
            padding-top: 75px;
            padding-bottom: 75px;
          }

          .robot-grid {
            gap: 14px;
          }

          .robot-image {
            height: 190px;
          }

          .platform-section {
            padding: 75px 0;
          }

          .platform-inner {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }

          .how-section {
            padding: 75px 0;
          }
        }

        @media (max-width: 520px) {
          .landing-brand {
            font-size: 19px;
          }

          .brand-symbol {
            width: 38px;
            height: 38px;
          }

          .hero-copy h1 {
            font-size: 52px;
          }

          .hero-copy h2 {
            font-size: 16px;
          }

          .hero-buttons {
            gap: 10px;
          }

          .primary-cta,
          .outline-cta {
            min-height: 48px;
            padding: 0 17px;
            font-size: 12px;
          }

          .hero-assurances {
            gap: 12px;
            font-size: 10px;
          }

          .hero-stats {
            gap: 19px;
          }

          .hero-stats strong {
            font-size: 21px;
          }

          .hero-stats span {
            font-size: 9px;
          }

          .hero-visual {
            min-height: 315px;
          }

          .hero-image {
            height: 320px;
          }

          .floating-card {
            min-width: 135px;
            gap: 7px;
          }

          .floating-card b {
            font-size: 9px;
          }

          .floating-card small {
            font-size: 8px;
          }

          .floating-icon {
            width: 29px;
            height: 29px;
          }

          .floating-icon svg {
            width: 15px;
            height: 15px;
          }

          .robot-grid,
          .feature-grid {
            grid-template-columns: 1fr;
          }

          .robot-image {
            height: 225px;
          }

          .robot-details p {
            min-height: auto;
            font-size: 14px;
          }

          .section-heading {
            margin-bottom: 32px;
          }

          .section-heading h2 {
            font-size: 34px;
          }

          .section-heading > p,
          .platform-heading > p {
            font-size: 14px;
          }

          .feature-card p,
          .step-card p,
          .highlight-card p {
            font-size: 14px;
          }

          .platform-heading h2 {
            font-size: 37px;
          }

          .feature-card {
            min-height: 190px;
          }

          .final-cta {
            padding: 75px 20px;
          }

          .final-cta h2 {
            font-size: 40px;
          }

          .footer-links {
            gap: 15px;
          }

          .footer-bottom {
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nexora-landing *,
          .nexora-landing *::before,
          .nexora-landing *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
