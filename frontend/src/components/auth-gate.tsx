"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import {
  ApiError,
  getCurrentUser,
  login,
  logout,
  register,
  type AuthUser,
} from "@/lib/api_old";

type Mode = "login" | "signup";

type AuthGateProps = {
  children: ReactNode;
  initialMode?: Mode;
};

export default function AuthGate({
  children,
  initialMode = "login",
}: AuthGateProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("nexora-auth-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    setMode(initialMode);
    setError("");
  }, [initialMode]);

  useEffect(() => {
    window.localStorage.setItem("nexora-auth-theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const response =
        mode === "signup"
          ? await register({
              email: normalizedEmail,
              password,
            })
          : await login({
              email: normalizedEmail,
              password,
            });

      setUser(response.user);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="nexora-auth-loading">
        <div className="nexora-auth-spinner" />
        <span>Securing your workspace…</span>

        <style jsx>{`
          .nexora-auth-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background: #0b0d19;
            color: #aeb3c9;
            font: 13px Arial, sans-serif;
          }

          .nexora-auth-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid #292d46;
            border-top-color: #8985ff;
            border-radius: 50%;
            animation: nspin 0.8s linear infinite;
          }

          @keyframes nspin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <main
      className={`nexora-auth ${
        theme === "light" ? "light-theme" : "dark-theme"
      }`}
      data-theme={theme}
    >
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="auth-layout">
        <aside className="auth-story">
          <div className="brand">
            <span className="brand-mark">
              <Sparkles size={21} />
            </span>
            <span>
              NEXORA<span className="brand-ai"> AI</span>
            </span>
          </div>

          <div className="story-copy">
            <div className="story-kicker">
              <span />
              YOUR INTELLIGENT WORKSPACE
            </div>

            <h1>
              One space.
              <br />
              <span>Infinite possibilities.</span>
            </h1>

            <p>
              Bring your ideas, conversations, documents and AI workflows
              together. Pick up exactly where you left off, every time.
            </p>

            <div className="story-points">
              <div>
                <span className="point-icon">
                  <LockKeyhole size={17} />
                </span>
                <div>
                  <b>Private by design</b>
                  <small>Your workspace belongs to your account.</small>
                </div>
              </div>

              <div>
                <span className="point-icon mint">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <b>Your work stays with you</b>
                  <small>Return to your saved chats and files anytime.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="story-footer">
            INTELLIGENCE, CONNECTED <span>•</span> NEXORA AI
          </div>
        </aside>

        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-toolbar">
              <span className="toolbar-label">NEXORA AI ACCOUNT</span>

              <button
                type="button"
                className="theme-toggle"
                onClick={() =>
                  setTheme((current) =>
                    current === "dark" ? "light" : "dark"
                  )
                }
                aria-label={`Switch to ${
                  theme === "dark" ? "light" : "dark"
                } mode`}
              >
                {theme === "dark" ? (
                  <Sun size={16} />
                ) : (
                  <Moon size={16} />
                )}

                <span>
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
              </button>
            </div>

            <div className="mobile-brand">
              <span className="brand-mark">
                <Sparkles size={19} />
              </span>
              <b>
                NEXORA<span className="brand-ai"> AI</span>
              </b>
            </div>

            <div className="card-eyebrow">
              {mode === "login" ? "WELCOME BACK" : "START YOUR JOURNEY"}
            </div>

            <h2>
              {mode === "login"
                ? "Sign in to Nexora"
                : "Create your account"}
            </h2>

            <p className="card-subtitle">
              {mode === "login"
                ? "Your workspace is ready when you are."
                : "Create your personal AI workspace in seconds."}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>

              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <label htmlFor="nexora-email">Email address</label>

              <div className="field">
                <Mail size={17} />

                <input
                  id="nexora-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="label-row">
                <label htmlFor="nexora-password">Password</label>
                {mode === "login" && <span>Secure sign in</span>}
              </div>

              <div className="field">
                <LockKeyhole size={17} />

                <input
                  id="nexora-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              {mode === "signup" && (
                <>
                  <label htmlFor="nexora-confirm">Confirm password</label>

                  <div className="field">
                    <LockKeyhole size={17} />

                    <input
                      id="nexora-confirm"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter your password again"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      minLength={8}
                      maxLength={128}
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              <button
                className="submit-button"
                type="submit"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <span className="button-spinner" />
                    {mode === "login"
                      ? "Signing you in…"
                      : "Creating your account…"}
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Sign in to workspace"
                      : "Create my account"}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="secure-note">
              <ShieldCheck size={15} />
              Your account and workspace data are protected.
            </div>

            <p className="switch-mode">
              {mode === "login"
                ? "New to Nexora AI?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setMode((current) =>
                    current === "login" ? "signup" : "login"
                  );
                  setError("");
                }}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="copyright">
            © 2026 Nexora AI. Intelligence, connected.
          </p>
        </section>
      </section>

      <style jsx>{`
        .nexora-auth {
          --bg: #0b0d19;
          --panel: #121629;
          --line: #292e48;
          --muted: #9299b3;
          min-height: 100vh;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 42px 5vw;
          background:
            radial-gradient(
              ellipse at 15% 15%,
              rgba(105, 91, 238, 0.16),
              transparent 38%
            ),
            radial-gradient(
              ellipse at 85% 85%,
              rgba(57, 211, 184, 0.09),
              transparent 35%
            ),
            var(--bg);
          color: #f5f6ff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .auth-glow {
          position: absolute;
          z-index: -1;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .auth-glow-one {
          width: 380px;
          height: 380px;
          left: -170px;
          top: 20%;
          background: #6256e7;
          opacity: 0.14;
        }

        .auth-glow-two {
          width: 340px;
          height: 340px;
          right: -140px;
          bottom: 4%;
          background: #31c8a8;
          opacity: 0.1;
        }

        .auth-layout {
          width: min(1120px, 100%);
          min-height: 650px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid rgba(146, 151, 190, 0.17);
          border-radius: 28px;
          overflow: hidden;
          background: rgba(17, 21, 39, 0.75);
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.36);
          backdrop-filter: blur(18px);
        }

        .auth-story {
          padding: 48px 54px;
          display: flex;
          flex-direction: column;
          background: linear-gradient(
            145deg,
            rgba(119, 117, 248, 0.12),
            rgba(17, 20, 38, 0.15) 55%,
            rgba(98, 230, 199, 0.055)
          );
          border-right: 1px solid rgba(146, 151, 190, 0.13);
        }

        .brand,
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          font-size: 16px;
        }

        .brand-mark {
          width: 39px;
          height: 39px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          color: #fff;
          background: linear-gradient(135deg, #7775f8, #5c58d6);
          box-shadow: 0 8px 25px rgba(119, 117, 248, 0.28);
        }

        .brand-ai {
          color: #8c89ff;
        }

        .story-copy {
          margin: auto 0;
          max-width: 450px;
        }

        .story-kicker,
        .card-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.19em;
          color: #9c9aff;
        }

        .story-kicker {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .story-kicker span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #62e6c7;
          box-shadow: 0 0 12px #62e6c7;
        }

        .story-copy h1 {
          font-size: clamp(39px, 4.2vw, 56px);
          line-height: 1.08;
          letter-spacing: -0.055em;
          margin: 24px 0 20px;
          font-weight: 750;
        }

        .story-copy h1 span {
          background: linear-gradient(100deg, #a4a0ff, #65e8cc);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .story-copy > p {
          font-size: 14px;
          line-height: 1.9;
          color: #a6acc4;
          max-width: 410px;
        }

        .story-points {
          display: grid;
          gap: 20px;
          margin-top: 44px;
        }

        .story-points > div {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .point-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(141, 137, 255, 0.25);
          border-radius: 12px;
          color: #aaa7ff;
          background: rgba(119, 117, 248, 0.09);
        }

        .point-icon.mint {
          color: #62e6c7;
          border-color: rgba(98, 230, 199, 0.2);
          background: rgba(98, 230, 199, 0.07);
        }

        .story-points b,
        .story-points small {
          display: block;
        }

        .story-points b {
          font-size: 12px;
        }

        .story-points small {
          font-size: 11px;
          color: #858da9;
          margin-top: 5px;
        }

        .story-footer {
          font-size: 9px;
          letter-spacing: 0.17em;
          color: #737b98;
        }

        .story-footer span {
          color: #62e6c7;
          padding: 0 8px;
        }

        .auth-card-wrap {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 42px;
        }

        .auth-card {
          width: min(390px, 100%);
        }

        .auth-card-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .toolbar-label {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #8d95b3;
          font-weight: 800;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border: 1px solid #343b5b;
          border-radius: 30px;
          background: #171d34;
          color: #d9dcf2;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .theme-toggle:hover {
          border-color: #9c83ff;
          color: #fff;
        }

        .mobile-brand {
          display: none;
          margin-bottom: 34px;
        }

        .card-eyebrow {
          color: #62e6c7;
        }

        .auth-card h2 {
          font-size: 30px;
          letter-spacing: -0.045em;
          margin: 12px 0 8px;
        }

        .card-subtitle {
          font-size: 13px;
          color: #9299b3;
          margin: 0;
          line-height: 1.6;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 4px;
          background: #0d1121;
          border: 1px solid #252b43;
          border-radius: 12px;
          margin: 30px 0 25px;
        }

        .auth-tabs button {
          border: 0;
          border-radius: 8px;
          padding: 11px 8px;
          color: #8f97b2;
          background: transparent;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .auth-tabs button.active {
          color: #fff;
          background: #252a46;
          box-shadow: 0 2px 9px rgba(0, 0, 0, 0.2);
        }

        .auth-form {
          display: grid;
          gap: 10px;
        }

        .auth-form label {
          font-size: 11px;
          font-weight: 700;
          color: #d9dcef;
          margin-top: 4px;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }

        .label-row span {
          font-size: 10px;
          color: #737c9b;
        }

        .field {
          height: 49px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 14px;
          border: 1px solid #2b314c;
          border-radius: 11px;
          background: rgba(9, 13, 27, 0.62);
          color: #858eae;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field:focus-within {
          border-color: #7775f8;
          box-shadow: 0 0 0 3px rgba(119, 117, 248, 0.12);
        }

        .field input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #f4f5ff;
          font-size: 12px;
        }

        .field input::placeholder {
          color: #68718d;
        }

        .show-password {
          border: 0;
          background: transparent;
          color: #858eae;
          display: grid;
          place-items: center;
          cursor: pointer;
          padding: 4px;
        }

        .auth-error {
          padding: 11px 12px;
          border: 1px solid rgba(255, 111, 130, 0.25);
          border-radius: 9px;
          background: rgba(135, 39, 57, 0.15);
          color: #ffabb8;
          font-size: 11px;
          line-height: 1.5;
          margin-top: 3px;
        }

        .submit-button {
          height: 49px;
          margin-top: 10px;
          border: 0;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #fff;
          background: linear-gradient(100deg, #7775f8, #625ee0);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 9px 25px rgba(105, 99, 232, 0.23);
          transition: transform 0.2s, filter 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .submit-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .button-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: nspin 0.7s linear infinite;
        }

        .secure-note {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          color: #7f89a6;
          font-size: 10px;
          margin-top: 23px;
        }

        .secure-note svg {
          color: #62e6c7;
        }

        .switch-mode {
          text-align: center;
          color: #8991ac;
          font-size: 11px;
          margin: 27px 0 0;
        }

        .switch-mode button {
          border: 0;
          background: transparent;
          color: #a5a2ff;
          font-weight: 800;
          cursor: pointer;
          margin-left: 4px;
        }

        .copyright {
          font-size: 9px;
          color: #66708d;
          margin: 32px 0 0;
        }

        .nexora-auth :global(button:focus-visible),
        .nexora-auth :global(input:focus-visible) {
          outline: 2px solid #62e6c7;
          outline-offset: 3px;
        }

        @keyframes nspin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 850px) {
          .auth-layout {
            grid-template-columns: 1fr;
            max-width: 520px;
            min-height: 0;
          }

          .auth-story {
            display: none;
          }

          .auth-card-wrap {
            padding: 38px 28px;
          }

          .mobile-brand {
            display: flex;
          }

          .copyright {
            margin-top: 25px;
          }
        }

        @media (max-width: 420px) {
          .nexora-auth {
            padding: 15px;
          }

          .auth-layout {
            border-radius: 20px;
          }

          .auth-card-wrap {
            padding: 30px 20px;
          }

          .auth-card h2 {
            font-size: 26px;
          }
        }
      `}</style>
    </main>
  );
}