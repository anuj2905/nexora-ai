
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type VoiceModeProps = {
  onClose?: () => void;
};

type RealtimeEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
  response?: {
    status?: string;
    status_details?: { error?: { message?: string } };
  };
};

type VoiceHistoryItem = {
  id: string;
  title: string;
  transcript: string;
  date: string;
};

type Screen = "home" | "history" | "detail";

const HISTORY_KEY = "nexora_voice_history";

export default function VoiceMode({ onClose }: VoiceModeProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [status, setStatus] = useState("Ready to connect");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [history, setHistory] = useState<VoiceHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedHistory, setSelectedHistory] =
    useState<VoiceHistoryItem | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef("");

  // Follow the theme selected in Nexora AI.
  useEffect(() => {
    const updateTheme = () => {
      const selected = document.documentElement.dataset.theme;
      setTheme(selected === "light" ? "light" : "dark");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const appendTranscript = useCallback((text: string) => {
    if (!text) return;
    transcriptRef.current += text;
    setTranscript(transcriptRef.current);
  }, []);

  const saveConversation = useCallback(() => {
    const text = transcriptRef.current.trim();
    if (!text) return;

    const firstLine = text
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean);

    const item: VoiceHistoryItem = {
      id: `${Date.now()}`,
      title: firstLine?.slice(0, 55) || "Voice conversation",
      transcript: text,
      date: new Date().toISOString(),
    };

    setHistory((previous) => {
      const updated = [item, ...previous].slice(0, 50);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore browser storage errors.
      }

      return updated;
    });
  }, []);

  const stopVoice = useCallback(
    (notify = true) => {
      saveConversation();

      channelRef.current?.close();
      channelRef.current = null;

      if (peerRef.current) {
        peerRef.current.ontrack = null;
        peerRef.current.onconnectionstatechange = null;
        peerRef.current.close();
        peerRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
        audioRef.current = null;
      }

      setConnected(false);
      setMuted(false);
      setBusy(false);
      setStatus("Voice session ended");
      setScreen("home");

      if (notify) onClose?.();
    },
    [onClose, saveConversation]
  );

  useEffect(() => {
    return () => {
      channelRef.current?.close();
      peerRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
      }
    };
  }, []);

  async function startVoice() {
    if (busy || connected) return;

    setBusy(true);
    setError("");
    transcriptRef.current = "";
    setTranscript("");
    setStatus("Preparing your voice session...");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone access requires localhost or an HTTPS website."
        );
      }

      const token = localStorage.getItem("nexora_access_token");

      if (!token) {
        throw new Error("Please log in to Nexora AI first.");
      }

      const baseUrl = (
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      ).replace(/\/$/, "");

      const tokenResponse = await fetch(
        `${baseUrl}/api/voice/session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const tokenData = await tokenResponse.json().catch(() => ({}));

      if (!tokenResponse.ok || !tokenData.client_secret) {
        throw new Error(
          tokenData.detail || "Could not create a voice session."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      audioRef.current = audio;

      peer.ontrack = async (event) => {
        audio.srcObject =
          event.streams?.[0] ?? new MediaStream([event.track]);

        try {
          await audio.play();
          setStatus("Connected — speak naturally");
        } catch {
          setError("Audio playback was blocked by your browser.");
        }
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setConnected(true);
          setStatus("Voice assistant is ready");
        } else if (peer.connectionState === "failed") {
          setError("Voice connection failed. Please try again.");
          setStatus("Connection failed");
        } else if (peer.connectionState === "disconnected") {
          setStatus("Connection interrupted");
        }
      };

      stream.getAudioTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;

      channel.onopen = () => {
        setConnected(true);
        setStatus("Listening — speak naturally");

        channel.send(
          JSON.stringify({
            type: "session.update",
            session: {
              type: "realtime",
              model: "gpt-realtime",
              output_modalities: ["audio"],
              audio: {
                input: {
                  turn_detection: {
                    type: "server_vad",
                    create_response: true,
                    interrupt_response: true,
                  },
                },
                output: {
                  voice: "marin",
                },
              },
              instructions:
                "You are Nexora AI, a helpful voice assistant. Listen to the user and respond naturally and conversationally. Speak your answers aloud. Keep answers clear and concise unless the user asks for detail.",
            },
          })
        );
      };

      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;

          switch (data.type) {
            case "input_audio_buffer.speech_started":
              setStatus("Listening...");
              break;

            case "input_audio_buffer.speech_stopped":
              setStatus("Thinking...");
              break;

            case "response.created":
              setStatus("Nexora AI is speaking...");
              break;

            case "response.output_audio_transcript.delta":
            case "response.output_text.delta":
            case "conversation.item.input_audio_transcription.delta":
              appendTranscript(data.delta || "");
              break;

            case "response.output_audio_transcript.done":
            case "conversation.item.input_audio_transcription.completed":
              if (data.transcript) {
                appendTranscript(`\n${data.transcript}\n`);
              }
              break;

            case "response.done":
              if (data.response?.status === "failed") {
                setError(
                  data.response.status_details?.error?.message ||
                    "The assistant could not generate a response."
                );
              } else {
                setStatus("Listening — speak when you're ready");
              }
              break;

            case "error":
              setError(data.error?.message || "Voice session error.");
              break;

            default:
              break;
          }
        } catch {
          // Ignore invalid messages.
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      if (peer.iceGatheringState !== "complete") {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => {
            peer.removeEventListener(
              "icegatheringstatechange",
              checkState
            );
            reject(new Error("Timed out preparing the voice connection."));
          }, 12000);

          const checkState = () => {
            if (peer.iceGatheringState === "complete") {
              window.clearTimeout(timeout);
              peer.removeEventListener(
                "icegatheringstatechange",
                checkState
              );
              resolve();
            }
          };

          peer.addEventListener(
            "icegatheringstatechange",
            checkState
          );
          checkState();
        });
      }

      const sdp = peer.localDescription?.sdp;

      if (!sdp) throw new Error("Could not create the WebRTC offer.");

      const answerResponse = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.client_secret}`,
            "Content-Type": "application/sdp",
          },
          body: sdp,
        }
      );

      const answerSdp = await answerResponse.text();

      if (!answerResponse.ok) {
        throw new Error(
          answerSdp || "Could not establish the OpenAI voice connection."
        );
      }

      await peer.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setStatus("Connecting audio...");
    } catch (err) {
      stopVoice(false);
      setError(
        err instanceof Error ? err.message : "Voice connection failed."
      );
      setStatus("Unable to connect");
    } finally {
      setBusy(false);
    }
  }

  function toggleMute() {
    const nextMuted = !muted;

    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setMuted(nextMuted);
    setStatus(nextMuted ? "Microphone muted" : "Listening — speak naturally");
  }

  function deleteHistory(id: string) {
    setHistory((previous) => {
      const updated = previous.filter((item) => item.id !== id);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors.
      }

      return updated;
    });

    if (selectedHistory?.id === id) {
      setSelectedHistory(null);
      setScreen("history");
    }
  }

  const filteredHistory = history.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const isActive = connected || busy;

  return (
    <main className={`voice-shell ${theme === "light" ? "light-mode" : "dark-mode"}`}>
      <div className="voice-background-glow" />

      <section className="voice-app">
        <header className="topbar">
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              if (screen === "detail") setScreen("history");
              else if (screen === "history") setScreen("home");
              else onClose?.();
            }}
            aria-label="Go back"
          >
            ‹
          </button>

          <button
            type="button"
            className="model-pill"
            onClick={() => setScreen("home")}
          >
            <span>Nexora Voice</span>
            <span className="model-beta">LIVE</span>
            <span>⌄</span>
          </button>

          <button
            type="button"
            className="icon-button history-button"
            onClick={() => setScreen("history")}
            aria-label="Chat history"
          >
            ◷
          </button>
        </header>

        {screen === "home" && (
          <div className="home-screen">
            <div className="home-copy">
              <div className="eyebrow">
                <span className="live-indicator" />
                {isActive ? "NEXORA IS HERE FOR YOU" : "YOUR PERSONAL AI COMPANION"}
              </div>

              <h1>
                {connected
                  ? "I'm Listening"
                  : busy
                    ? "Getting Ready..."
                    : "Just speak. I've got you."}
              </h1>

              <p>
                {connected
                  ? "Speak naturally. I'm right here."
                  : busy
                    ? "Preparing your secure voice connection."
                    : "Your ideas, questions and tasks — let's make them happen."}
              </p>
            </div>

            <div className={`robot-stage ${isActive ? "robot-stage-active" : ""}`}>
              <div className="robot-orbit robot-orbit-one" />
              <div className="robot-orbit robot-orbit-two" />
              <span className="robot-spark robot-spark-one">✦</span>
              <span className="robot-spark robot-spark-two">✧</span>
              <span className="robot-spark robot-spark-three">·</span>
              <div className="robot-speech-bubble">
                {connected ? "I'm listening!\nTell me what's on your mind." : "Hey there! 👋\nWhat shall we explore today?"}
              </div>
              <svg className="nexora-robot" viewBox="0 0 360 330" role="img" aria-label="Nexora AI friendly robot mascot">
                <defs>
                  <linearGradient id="robotBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="48%" stopColor="#dce3ff" />
                    <stop offset="100%" stopColor="#8997d9" />
                  </linearGradient>
                  <linearGradient id="robotBlue" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#b7a0ff" />
                    <stop offset="55%" stopColor="#7860e8" />
                    <stop offset="100%" stopColor="#4932ad" />
                  </linearGradient>
                  <linearGradient id="robotGlass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#26335d" />
                    <stop offset="100%" stopColor="#080d25" />
                  </linearGradient>
                  <filter id="robotShadow" x="-30%" y="-30%" width="160%" height="170%">
                    <feDropShadow dx="0" dy="13" stdDeviation="12" floodColor="#6c4bd0" floodOpacity=".24" />
                  </filter>
                </defs>
                <ellipse cx="180" cy="304" rx="91" ry="13" fill="#8b75d9" opacity=".16" />
                <g className="robot-arm robot-arm-left" filter="url(#robotShadow)">
                  <path d="M104 194 L68 157 L51 119" fill="none" stroke="#7c83bd" strokeWidth="22" strokeLinecap="round" />
                  <path d="M104 194 L68 157 L51 119" fill="none" stroke="#e9edff" strokeWidth="11" strokeLinecap="round" />
                  <circle cx="67" cy="157" r="15" fill="url(#robotBlue)" stroke="#e8eaff" strokeWidth="5" />
                  <path d="M36 120 L22 97 M51 119 L48 91 M64 126 L77 105" stroke="#7b65df" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="51" cy="119" r="11" fill="#f5f6ff" stroke="#8c79eb" strokeWidth="5" />
                </g>
                <g className="robot-arm robot-arm-right" filter="url(#robotShadow)">
                  <path d="M256 194 L292 157 L309 119" fill="none" stroke="#7c83bd" strokeWidth="22" strokeLinecap="round" />
                  <path d="M256 194 L292 157 L309 119" fill="none" stroke="#e9edff" strokeWidth="11" strokeLinecap="round" />
                  <circle cx="293" cy="157" r="15" fill="url(#robotBlue)" stroke="#e8eaff" strokeWidth="5" />
                  <path d="M324 120 L338 97 M309 119 L312 91 M296 126 L283 105" stroke="#7b65df" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="309" cy="119" r="11" fill="#f5f6ff" stroke="#8c79eb" strokeWidth="5" />
                </g>
                <g filter="url(#robotShadow)">
                  <path d="M118 206 Q180 178 242 206 L228 279 Q180 312 132 279 Z" fill="url(#robotBlue)" stroke="#d9dcff" strokeWidth="5" />
                  <path d="M139 211 Q180 197 221 211 L211 247 Q180 264 149 247 Z" fill="#c8c0ff" opacity=".65" />
                  <rect x="153" y="270" width="54" height="17" rx="8.5" fill="#4537a6" opacity=".5" />
                  <rect x="160" y="184" width="40" height="26" rx="12" fill="#7c70d7" />
                  <rect x="83" y="55" width="194" height="151" rx="65" fill="url(#robotBody)" stroke="#ffffff" strokeWidth="7" />
                  <rect x="101" y="83" width="158" height="91" rx="35" fill="url(#robotGlass)" stroke="#aeb9f2" strokeWidth="5" />
                  <path d="M118 95 Q180 69 241 96" fill="none" stroke="#ffffff" strokeWidth="6" opacity=".34" strokeLinecap="round" />
                  <g className="robot-eyes" fill="#a9fffa">
                    <rect x="139" y="119" width="16" height="22" rx="7" />
                    <rect x="205" y="119" width="16" height="22" rx="7" />
                  </g>
                  <path d="M153 151 Q180 171 207 151" fill="none" stroke="#9dfff4" strokeWidth="5" strokeLinecap="round" />
                  <path d="M83 111 Q56 104 51 80 Q49 58 72 53 Q93 50 100 72" fill="url(#robotBlue)" stroke="#f1efff" strokeWidth="6" />
                  <path d="M277 111 Q304 104 309 80 Q311 58 288 53 Q267 50 260 72" fill="url(#robotBlue)" stroke="#f1efff" strokeWidth="6" />
                  <circle cx="75" cy="79" r="10" fill="#a8fff6" opacity=".85" />
                  <circle cx="285" cy="79" r="10" fill="#a8fff6" opacity=".85" />
                  <path d="M167 48 L180 31 L193 48" fill="none" stroke="#8c6ce8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="180" cy="26" r="8" fill="#7b5de3" stroke="#ffffff" strokeWidth="3" />
                </g>
                <path d="M149 204 L149 215 M211 204 L211 215" stroke="#a9fff6" strokeWidth="5" strokeLinecap="round" />
              </svg>
              <div className="robot-caption"><span className="robot-caption-dot" /> NEXORA AI ASSISTANT</div>
            </div>

            <div className="voice-composer">
              <div className="composer-prompt">
                <div className="composer-prompt-copy">
                  <span className="composer-spark">✦</span>
                  <span>
                    {connected
                      ? muted
                        ? "Microphone muted — tap the mic to resume"
                        : "Go ahead, I'm listening to you..."
                      : busy
                        ? "Connecting to Nexora Voice..."
                        : "Speak or start a voice conversation..."}
                  </span>
                </div>
                <button
                  type="button"
                  className={`composer-mic-button ${isActive ? "composer-mic-active" : ""}`}
                  onClick={() => {
                    if (connected) toggleMute();
                    else if (!busy) void startVoice();
                  }}
                  disabled={busy}
                  aria-label={
                    connected
                      ? muted
                        ? "Unmute microphone"
                        : "Mute microphone"
                      : "Start voice conversation"
                  }
                  title={
                    connected
                      ? muted
                        ? "Resume microphone"
                        : "Mute microphone"
                      : "Start voice conversation"
                  }
                >
                  {busy ? (
                    <span className="button-spinner" />
                  ) : connected && !muted ? (
                    <span className="composer-mic-live">Ⅱ</span>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="2" width="6" height="13" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0" />
                      <path d="M12 18v4M9 22h6" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="composer-shortcuts" aria-label="Voice assistant capabilities">
                <span>✧ AI Assistant</span>
                <span>⌁ Smart answers</span>
                <span>◈ Ideas & research</span>
                <span>✦ Creative help</span>
              </div>
            </div>

            <div className="voice-status-pill" role="status">
              <span
                className={`status-indicator ${
                  connected ? "status-connected" : ""
                } ${busy ? "status-busy" : ""}`}
              />
              {status}
            </div>

            {error && (
              <div className="voice-error" role="alert">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <div className="bottom-controls">
              <div className="control-row control-row-secondary">
                <button
                  type="button"
                  className="round-control"
                  onClick={() => setScreen("history")}
                  aria-label="Conversation history"
                  title="Conversation history"
                >
                  ◷
                </button>
                <span className="secondary-control-label">
                  {connected
                    ? "Voice session in progress"
                    : busy
                      ? "Connecting securely"
                      : "Ready when you are"}
                </span>
                <button
                  type="button"
                  className="round-control"
                  onClick={() => {
                    if (connected || busy) stopVoice(false);
                    else onClose?.();
                  }}
                  aria-label={connected || busy ? "End conversation" : "Close voice mode"}
                  title={connected || busy ? "End conversation" : "Close voice mode"}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "history" && (
          <div className="history-screen">
            <div className="history-heading">
              <div>
                <span className="eyebrow">YOUR CONVERSATIONS</span>
                <h1>Chat History</h1>
                <p>Revisit your previous voice conversations.</p>
              </div>
              <span className="history-count">{history.length} saved</span>
            </div>

            <div className="history-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search conversations..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search conversations"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  ×
                </button>
              )}
            </div>

            {filteredHistory.length === 0 ? (
              <div className="history-empty">
                <div className="empty-icon">◷</div>
                <h2>
                  {history.length === 0
                    ? "No conversations yet"
                    : "No matching conversations"}
                </h2>
                <p>
                  {history.length === 0
                    ? "Your voice conversations will appear here after you finish a session."
                    : "Try another search keyword."}
                </p>
                <button
                  type="button"
                  className="start-from-history"
                  onClick={() => setScreen("home")}
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              <div className="history-list">
                {filteredHistory.map((item) => (
                  <article className="history-item" key={item.id}>
                    <button
                      type="button"
                      className="history-item-main"
                      onClick={() => {
                        setSelectedHistory(item);
                        setScreen("detail");
                      }}
                    >
                      <div className="history-avatar">N</div>
                      <div className="history-item-content">
                        <strong>{item.title}</strong>
                        <span>
                          {new Date(item.date).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <p>{item.transcript.slice(0, 85)}</p>
                      </div>
                      <span className="history-arrow">›</span>
                    </button>

                    <button
                      type="button"
                      className="history-delete"
                      onClick={() => deleteHistory(item.id)}
                      aria-label={`Delete ${item.title}`}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            )}

            <button
              type="button"
              className="new-conversation-button"
              onClick={() => setScreen("home")}
            >
              ＋ New conversation
            </button>
          </div>
        )}

        {screen === "detail" && selectedHistory && (
          <div className="detail-screen">
            <div className="detail-heading">
              <span className="eyebrow">SAVED CONVERSATION</span>
              <h1>{selectedHistory.title}</h1>
              <p>{new Date(selectedHistory.date).toLocaleString()}</p>
            </div>

            <div className="detail-transcript">
              {selectedHistory.transcript}
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="detail-button"
                onClick={() => {
                  void navigator.clipboard?.writeText(
                    selectedHistory.transcript
                  );
                }}
              >
                Copy transcript
              </button>

              <button
                type="button"
                className="detail-button detail-button-primary"
                onClick={() => setScreen("home")}
              >
                New conversation
              </button>
            </div>
          </div>
        )}

        <footer className="voice-footer">
          <span className="footer-logo">N</span>
          <span>Powered by Nexora AI</span>
          <span className="footer-secure">✦ Secure voice session</span>
        </footer>
      </section>

      <style jsx>{`
        /* Shared layout */
        .voice-shell {
          --accent: #a66aff;
          --accent-strong: #8d4be8;
          --accent-soft: rgba(166, 106, 255, 0.16);
          --text: #f8f5ff;
          --muted: #92899e;
          --surface: rgba(37, 27, 49, 0.72);
          --border: rgba(192, 154, 255, 0.12);
          position: relative;
          isolation: isolate;
          min-height: 100%;
          width: 100%;
          overflow: hidden;
          padding: 22px;
          display: flex;
          justify-content: center;
          align-items: stretch;
          color: var(--text);
          background: #08060d;
          font-family: inherit;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .voice-background-glow {
          position: absolute;
          z-index: -1;
          width: 520px;
          height: 520px;
          left: 50%;
          top: 28%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(113, 53, 184, 0.15),
            rgba(48, 23, 93, 0.06) 45%,
            transparent 72%
          );
          filter: blur(28px);
          pointer-events: none;
        }

        .voice-app {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 760px;
          min-height: 690px;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 30px;
          background:
            radial-gradient(
              ellipse at 50% 35%,
              rgba(80, 35, 126, 0.12),
              transparent 48%
            ),
            #08070c;
          box-shadow: 0 25px 100px rgba(0, 0, 0, 0.4);
          transition: background 0.3s ease, border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        /* LIGHT THEME: a deliberately different visual identity */
        .light-mode {
          --accent: #8051d6;
          --accent-strong: #7040c5;
          --accent-soft: rgba(128, 81, 214, 0.1);
          --text: #29213b;
          --muted: #82758f;
          --surface: rgba(255, 255, 255, 0.78);
          --border: rgba(124, 91, 166, 0.15);
          background:
            radial-gradient(ellipse at 12% 12%, #f4eaff 0%, transparent 38%),
            radial-gradient(ellipse at 90% 80%, #e9e5ff 0%, transparent 38%),
            #f8f6fc;
        }

        .light-mode .voice-background-glow {
          width: 600px;
          height: 600px;
          background: radial-gradient(
            circle,
            rgba(174, 135, 242, 0.19),
            rgba(219, 201, 255, 0.12) 45%,
            transparent 72%
          );
        }

        .light-mode .voice-app {
          border-color: rgba(139, 106, 184, 0.16);
          background:
            radial-gradient(
              ellipse at 50% 25%,
              rgba(218, 199, 255, 0.35),
              transparent 50%
            ),
            linear-gradient(145deg, #ffffff, #fbf9ff 58%, #f5f1fc);
          box-shadow:
            0 25px 75px rgba(75, 49, 112, 0.09),
            0 3px 12px rgba(75, 49, 112, 0.04);
        }

        .light-mode .icon-button {
          border-color: rgba(131, 94, 184, 0.16);
          background: #fff;
          color: #654795;
          box-shadow: 0 3px 12px rgba(91, 63, 132, 0.07);
        }

        .light-mode .model-pill {
          border-color: rgba(131, 94, 184, 0.16);
          background: rgba(255, 255, 255, 0.85);
          color: #45345e;
          box-shadow: 0 3px 12px rgba(91, 63, 132, 0.05);
        }

        .light-mode .model-beta {
          background: #eee5ff;
          color: #7448b9;
        }

        .light-mode .model-chevron {
          color: #8d7ba4;
        }

        .light-mode .home-copy h1 {
          color: #302344;
        }

        .light-mode .home-copy p {
          color: #82748f;
        }

        .light-mode .eyebrow {
          color: #805eaa;
        }

        .light-mode .live-indicator {
          background: #9565d9;
          box-shadow: 0 0 9px rgba(149, 101, 217, 0.5);
        }

        .light-mode .voice-status-pill {
          border-color: rgba(129, 92, 178, 0.15);
          background: rgba(255, 255, 255, 0.8);
          color: #76658b;
          box-shadow: 0 4px 14px rgba(91, 63, 132, 0.04);
        }

        .light-mode .control-hint {
          color: #57446f;
        }

        .light-mode .bottom-caption {
          color: #9889a7;
        }

        .light-mode .round-control {
          border-color: rgba(131, 94, 184, 0.15);
          background: #fff;
          color: #7652a4;
          box-shadow: 0 5px 17px rgba(91, 63, 132, 0.09);
        }

        .light-mode .round-control:hover {
          background: #f0e8ff;
        }

        .light-mode .mic-control {
          border-color: rgba(255, 255, 255, 0.95);
          background: linear-gradient(145deg, #b78bff, #8750d9 58%, #7041c7);
          box-shadow:
            0 0 0 7px rgba(145, 91, 219, 0.1),
            0 12px 32px rgba(126, 75, 198, 0.28),
            inset 0 0 15px rgba(255, 255, 255, 0.3);
        }

        .light-mode .mic-control-inner {
          background: linear-gradient(145deg, #c49bff, #9562e6);
        }

        .light-mode .history-heading h1,
        .light-mode .detail-heading h1 {
          color: #302344;
        }

        .light-mode .history-heading p,
        .light-mode .detail-heading p {
          color: #84768f;
        }

        .light-mode .history-count {
          border-color: #e5d8f6;
          background: #f3ecff;
          color: #7751a7;
        }

        .light-mode .history-search {
          border-color: #e7dff0;
          background: rgba(255, 255, 255, 0.88);
          color: #806b9b;
          box-shadow: 0 4px 15px rgba(91, 63, 132, 0.04);
        }

        .light-mode .history-search input {
          color: #3e3151;
        }

        .light-mode .history-search input::placeholder {
          color: #a194ae;
        }

        .light-mode .history-search button {
          color: #795a9d;
        }

        .light-mode .history-item {
          border-color: #e9e1f1;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 5px 17px rgba(91, 63, 132, 0.045);
        }

        .light-mode .history-item:hover {
          border-color: #c8afe9;
          box-shadow: 0 8px 22px rgba(91, 63, 132, 0.09);
        }

        .light-mode .history-item-content strong {
          color: #413251;
        }

        .light-mode .history-item-content span {
          color: #927fa5;
        }

        .light-mode .history-item-content p {
          color: #91859e;
        }

        .light-mode .history-arrow {
          color: #9b83b4;
        }

        .light-mode .history-delete {
          color: #9c8aaa;
        }

        .light-mode .history-delete:hover {
          background: #fff0f2;
          color: #d84f70;
        }

        .light-mode .history-avatar {
          border-color: #ddc8fa;
          background: radial-gradient(circle at 30% 25%, #d2b6ff, #9464d0 60%, #7044a4);
        }

        .light-mode .history-empty h2 {
          color: #413251;
        }

        .light-mode .history-empty p {
          color: #8b7d98;
        }

        .light-mode .empty-icon {
          border-color: #e4d6f5;
          background: #f3ecff;
          color: #8b61c3;
        }

        .light-mode .start-from-history {
          border-color: #ddc8f5;
          background: #f4edff;
          color: #7650a7;
        }

        .light-mode .new-conversation-button {
          border-color: #ddc8f5;
          background: linear-gradient(100deg, #eee4ff, #f8f2ff);
          color: #7049a5;
        }

        .light-mode .detail-transcript {
          border-color: #e6ddef;
          background: rgba(255, 255, 255, 0.9);
          color: #493b59;
          box-shadow: 0 5px 17px rgba(91, 63, 132, 0.04);
        }

        .light-mode .detail-button {
          border-color: #e3d7ee;
          background: #fff;
          color: #70548e;
        }

        .light-mode .detail-button-primary {
          border-color: #9163d2;
          background: linear-gradient(110deg, #9567db, #7143bd);
          color: white;
        }

        .light-mode .voice-footer {
          border-top-color: #ece4f3;
          color: #94869f;
        }

        .light-mode .footer-secure {
          color: #8c73a6;
        }

        /* Header */
        .topbar {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: 44px 1fr 44px;
          align-items: center;
          gap: 12px;
          padding: 23px 25px;
        }

        .icon-button {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border: 1px solid var(--border);
          border-radius: 50%;
          background: var(--surface);
          color: var(--text);
          font-size: 25px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .icon-button:hover {
          transform: scale(1.05);
        }

        .model-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          justify-self: center;
          min-height: 36px;
          padding: 0 15px;
          border: 1px solid var(--border);
          border-radius: 30px;
          background: var(--surface);
          color: var(--text);
          font-size: 12px;
          cursor: pointer;
        }

        .model-beta {
          padding: 3px 6px;
          border-radius: 5px;
          color: #d9b7ff;
          background: rgba(159, 100, 229, 0.2);
          font-size: 8px;
          letter-spacing: 0.08em;
        }

        .history-button {
          justify-self: end;
        }

        /* Voice home */
        .home-screen {
          display: flex;
          flex: 1;
          min-height: 570px;
          flex-direction: column;
          align-items: center;
          padding: 8px 25px 18px;
        }

        .orb-area {
          position: relative;
          display: grid;
          place-items: center;
          width: min(310px, 70vw);
          height: 275px;
          margin-top: 10px;
        }

        .orb-halo {
          position: absolute;
          width: 172px;
          height: 172px;
          border: 1px solid rgba(175, 119, 255, 0.58);
          border-radius: 50%;
          box-shadow:
            0 0 20px rgba(143, 80, 255, 0.28),
            inset 0 0 20px rgba(125, 83, 255, 0.12);
          animation: halo-breathe 4s ease-in-out infinite;
        }

        .orb-halo::before,
        .orb-halo::after {
          position: absolute;
          content: "";
          inset: -9px;
          border: 1px solid rgba(103, 180, 255, 0.22);
          border-radius: 50%;
        }

        .orb-halo::after {
          inset: -18px;
          border-color: rgba(183, 101, 255, 0.12);
        }

        .light-mode .orb-halo {
          border-color: rgba(133, 92, 210, 0.55);
          box-shadow:
            0 0 24px rgba(139, 92, 210, 0.2),
            inset 0 0 20px rgba(139, 92, 210, 0.1);
        }

        .light-mode .orb-halo::before {
          border-color: rgba(79, 155, 231, 0.3);
        }

        .light-mode .orb-halo::after {
          border-color: rgba(156, 103, 224, 0.22);
        }

        .orb-halo-active {
          animation-duration: 1.6s;
        }

        .orb {
          position: relative;
          width: 145px;
          height: 145px;
          overflow: hidden;
          border: 1px solid rgba(191, 162, 255, 0.85);
          border-radius: 50%;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(160, 231, 255, 0.9), transparent 24%),
            radial-gradient(ellipse at 73% 72%, #9d27f5 0%, #4510a6 26%, transparent 55%),
            radial-gradient(ellipse at 40% 40%, #102a69 0%, #070a21 53%, #03030b 78%);
          box-shadow:
            0 0 25px rgba(113, 89, 255, 0.55),
            0 0 70px rgba(112, 42, 220, 0.22),
            inset -12px -12px 28px rgba(0, 0, 0, 0.75),
            inset 8px 7px 18px rgba(255, 255, 255, 0.17);
          animation: orb-float 5s ease-in-out infinite;
        }

        .light-mode .orb {
          border-color: rgba(255, 255, 255, 0.95);
          background:
            radial-gradient(ellipse at 30% 20%, #d5f5ff 0%, transparent 26%),
            radial-gradient(ellipse at 72% 70%, #bc8aff 0%, #7947d9 30%, transparent 59%),
            radial-gradient(ellipse at 40% 40%, #5d70c8 0%, #222b69 53%, #10122e 78%);
          box-shadow:
            0 0 20px rgba(132, 90, 219, 0.45),
            0 0 55px rgba(151, 104, 220, 0.2),
            inset -12px -12px 28px rgba(14, 16, 49, 0.45),
            inset 8px 7px 18px rgba(255, 255, 255, 0.4);
        }

        .orb-inner {
          position: absolute;
          width: 125%;
          height: 70%;
          left: -18%;
          top: 45%;
          transform: rotate(-30deg);
          border-radius: 50%;
          background: linear-gradient(
            120deg,
            transparent 5%,
            rgba(41, 191, 255, 0.12) 22%,
            rgba(160, 73, 255, 0.55) 48%,
            rgba(30, 83, 255, 0.16) 66%,
            transparent 85%
          );
          filter: blur(7px);
        }

        .orb-shine {
          position: absolute;
          top: 9%;
          left: 12%;
          width: 77%;
          height: 40%;
          transform: rotate(-26deg);
          border-top: 2px solid rgba(166, 226, 255, 0.66);
          border-radius: 50%;
          filter: blur(2px);
        }

        .orb-core {
          position: absolute;
          width: 90%;
          height: 90%;
          top: 7%;
          left: 5%;
          border-radius: 50%;
          background: radial-gradient(
            ellipse at 45% 40%,
            transparent 40%,
            rgba(1, 1, 12, 0.18) 73%,
            rgba(0, 0, 0, 0.55) 100%
          );
        }

        .light-mode .orb-core {
          background: radial-gradient(
            ellipse at 45% 40%,
            transparent 40%,
            rgba(14, 16, 49, 0.12) 73%,
            rgba(14, 16, 49, 0.35) 100%
          );
        }

        .orb-active {
          animation-duration: 1.8s;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #cba5ff;
          box-shadow: 0 0 10px #a75cff;
        }

        .particle-one {
          top: 34px;
          left: 48px;
        }

        .particle-two {
          right: 42px;
          top: 92px;
          width: 2px;
          height: 2px;
        }

        .particle-three {
          left: 75px;
          bottom: 25px;
          width: 2px;
          height: 2px;
        }

        .light-mode .particle {
          background: #8e5ed2;
          box-shadow: 0 0 9px rgba(142, 94, 210, 0.45);
        }

        .home-copy {
          width: 100%;
          max-width: 430px;
          margin-top: 3px;
          text-align: center;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #b79bd2;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
        }

        .live-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #b58cff;
        }

        .home-copy h1 {
          margin: 15px 0 9px;
          color: var(--text);
          font-size: clamp(27px, 4vw, 36px);
          font-weight: 500;
          letter-spacing: -0.045em;
          line-height: 1.2;
        }

        .home-copy p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .voice-status-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 33px;
          margin-top: 20px;
          padding: 0 13px;
          border: 1px solid var(--border);
          border-radius: 30px;
          background: var(--surface);
          color: var(--muted);
          font-size: 11px;
          text-align: center;
        }

        .status-indicator {
          width: 6px;
          height: 6px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #9a83b0;
        }

        .status-connected {
          background: #35b88b;
          box-shadow: 0 0 10px rgba(53, 184, 139, 0.5);
        }

        .status-busy {
          background: #b67ce8;
          animation: pulse 1s infinite;
        }

        .voice-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          max-width: 460px;
          margin-top: 14px;
          padding: 12px;
          border: 1px solid rgba(255, 110, 130, 0.25);
          border-radius: 12px;
          background: rgba(110, 24, 42, 0.2);
          color: #ffb8c2;
          font-size: 12px;
          line-height: 1.6;
        }

        .light-mode .voice-error {
          border-color: #f0c9d0;
          background: #fff0f2;
          color: #a83b55;
        }

        .voice-error span {
          display: grid;
          place-items: center;
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          border: 1px solid currentColor;
          border-radius: 50%;
          font-weight: 700;
        }

        .voice-error p {
          margin: 0;
          overflow-wrap: anywhere;
        }

        .bottom-controls {
          width: 100%;
          margin-top: auto;
          padding-top: 26px;
          text-align: center;
        }

        .control-hint {
          margin: 0 0 22px;
          color: var(--text);
          font-size: 12px;
        }

        .control-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 25px;
        }

        .round-control {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border: 1px solid var(--border);
          border-radius: 50%;
          background: var(--surface);
          color: var(--text);
          font-size: 25px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .round-control:hover {
          transform: translateY(-2px);
        }

        .mic-control {
          display: grid;
          place-items: center;
          width: 83px;
          height: 83px;
          border: 1px solid rgba(226, 197, 255, 0.85);
          border-radius: 50%;
          background: linear-gradient(145deg, #f4dcff, #a65cff 52%, #7542ed);
          color: #fff;
          box-shadow:
            0 0 0 7px rgba(175, 111, 255, 0.13),
            0 0 30px rgba(166, 88, 255, 0.5);
          cursor: pointer;
          transition: 0.2s ease;
        }

        .mic-control:hover:not(:disabled) {
          transform: scale(1.06);
        }

        .mic-control:disabled {
          cursor: wait;
          opacity: 0.8;
        }

        .mic-control-inner {
          display: grid;
          place-items: center;
          width: 65px;
          height: 65px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          background: linear-gradient(145deg, #c08aff, #8d48ed);
          font-size: 27px;
        }

        .mic-control-active .mic-control-inner {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .button-spinner {
          width: 23px;
          height: 23px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .bottom-caption {
          margin: 19px 0 0;
          color: var(--muted);
          font-size: 10px;
        }

        /* History and transcript */
        .history-screen,
        .detail-screen {
          display: flex;
          flex: 1;
          min-height: 570px;
          flex-direction: column;
          padding: 18px 30px 28px;
        }

        .history-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          margin: 8px 0 23px;
        }

        .history-heading h1,
        .detail-heading h1 {
          margin: 9px 0 6px;
          color: var(--text);
          font-size: 29px;
          font-weight: 550;
          letter-spacing: -0.04em;
        }

        .history-heading p,
        .detail-heading p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .history-count {
          flex: 0 0 auto;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--accent);
          background: var(--accent-soft);
          font-size: 10px;
        }

        .history-search {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 45px;
          padding: 0 14px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--surface);
        }

        .history-search > span {
          font-size: 22px;
        }

        .history-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text);
          font: inherit;
          font-size: 12px;
        }

        .history-search input::placeholder {
          color: var(--muted);
        }

        .history-search button {
          border: 0;
          background: transparent;
          color: var(--accent);
          font-size: 20px;
          cursor: pointer;
        }

        .history-list {
          display: grid;
          gap: 10px;
          margin-top: 20px;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          transition: 0.2s ease;
        }

        .history-item:hover {
          border-color: var(--accent);
          transform: translateY(-1px);
        }

        .history-item-main {
          display: flex;
          flex: 1;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .history-avatar {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          border: 1px solid rgba(196, 151, 255, 0.28);
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, #c18cff, #6135a4 60%, #21132e);
          color: #fff;
          font-size: 17px;
          font-weight: 700;
        }

        .history-item-content {
          display: grid;
          flex: 1;
          min-width: 0;
          gap: 4px;
        }

        .history-item-content strong {
          overflow: hidden;
          color: var(--text);
          font-size: 12px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-item-content span {
          color: var(--muted);
          font-size: 10px;
        }

        .history-item-content p {
          overflow: hidden;
          margin: 0;
          color: var(--muted);
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-arrow {
          color: var(--muted);
          font-size: 23px;
        }

        .history-delete {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--muted);
          font-size: 19px;
          cursor: pointer;
        }

        .history-empty {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 35px 15px;
          text-align: center;
        }

        .empty-icon {
          display: grid;
          place-items: center;
          width: 65px;
          height: 65px;
          border: 1px solid var(--border);
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 29px;
        }

        .history-empty h2 {
          margin: 18px 0 7px;
          color: var(--text);
          font-size: 17px;
          font-weight: 550;
        }

        .history-empty p {
          max-width: 300px;
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .start-from-history {
          margin-top: 20px;
          padding: 10px 15px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 11px;
          cursor: pointer;
        }

        .new-conversation-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 45px;
          margin-top: auto;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .new-conversation-button span {
          font-size: 18px;
        }

        .detail-heading {
          margin: 10px 0 20px;
        }

        .detail-transcript {
          flex: 1;
          min-height: 180px;
          max-height: 390px;
          overflow-y: auto;
          padding: 19px;
          border: 1px solid var(--border);
          border-radius: 17px;
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .detail-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .detail-button {
          min-height: 42px;
          padding: 0 15px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: var(--surface);
          color: var(--text);
          font-size: 11px;
          cursor: pointer;
        }

        .detail-button-primary {
          border-color: #9163d2;
          background: linear-gradient(110deg, #9567db, #7143bd);
          color: white;
        }

        .voice-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 54px;
          margin-top: auto;
          border-top: 1px solid var(--border);
          color: var(--muted);
          font-size: 9px;
        }

        .footer-logo {
          display: grid;
          place-items: center;
          width: 17px;
          height: 17px;
          border-radius: 5px;
          background: linear-gradient(140deg, #c28aff, #7140c1);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
        }

        .footer-secure {
          margin-left: 10px;
          color: var(--muted);
        }

        /* Animations */
        @keyframes orb-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(3deg); }
        }

        @keyframes halo-breathe {
          0%, 100% { transform: scale(0.96); opacity: 0.72; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(0.96); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 900px) {
          .voice-shell { padding: 28px; }
          .voice-app { min-height: 730px; }
          .home-screen { min-height: 600px; }
          .orb-area { margin-top: 25px; height: 290px; }
        }

        @media (max-width: 600px) {
          .voice-shell { min-height: 100%; padding: 0; }
          .voice-app {
            min-height: 100%;
            border: 0;
            border-radius: 0;
          }
          .topbar { padding: 17px; }
          .home-screen {
            min-height: 590px;
            padding: 5px 18px 22px;
          }
          .orb-area {
            height: 250px;
            margin-top: 15px;
          }
          .orb { width: 132px; height: 132px; }
          .orb-halo { width: 157px; height: 157px; }
          .home-copy h1 {
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
            font-size: 29px;
          }
          .bottom-controls { padding-bottom: 15px; }
          .history-screen,
          .detail-screen {
            min-height: 590px;
            padding: 15px 17px 22px;
          }
          .history-heading h1,
          .detail-heading h1 { font-size: 25px; }
          .control-row { gap: 22px; }
        }

        @media (max-width: 370px) {
          .home-copy h1 { font-size: 26px; }
          .mic-control { width: 74px; height: 74px; }
          .mic-control-inner { width: 58px; height: 58px; }
          .round-control { width: 43px; height: 43px; }
        }

        /* Nexora robot-inspired voice home */
        .voice-shell {
          --text: #202044;
          --muted: #777493;
          --surface: rgba(255,255,255,.56);
          --border: rgba(126,105,204,.19);
          background:
            radial-gradient(ellipse at 18% 18%, rgba(188,160,255,.32), transparent 38%),
            radial-gradient(ellipse at 86% 70%, rgba(255,196,150,.25), transparent 34%),
            linear-gradient(135deg, #f7f4ff 0%, #f1edff 48%, #fff8f1 100%);
        }
        .voice-shell.dark-mode {
          --text: #f7f3ff;
          --muted: #b5abc9;
          --surface: rgba(35,27,56,.62);
          --border: rgba(193,166,255,.19);
          background:
            radial-gradient(ellipse at 18% 18%, rgba(113,72,190,.28), transparent 38%),
            radial-gradient(ellipse at 86% 70%, rgba(125,76,154,.2), transparent 34%),
            linear-gradient(135deg, #100d1b 0%, #171127 52%, #21152a 100%);
        }
        .voice-app {
          max-width: 1050px;
          min-height: 690px;
          border-radius: 28px;
          background: rgba(255,255,255,.34);
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 80px rgba(82,61,143,.13);
        }
        .dark-mode .voice-app { background: rgba(20,15,34,.48); }
        .topbar { border-bottom-color: var(--border); }
        .home-screen {
          min-height: 590px;
          padding: 25px clamp(18px, 5vw, 58px) 28px;
          justify-content: flex-start;
          gap: 0;
        }
        .home-copy { order: 0; margin: 5px 0 0; }
        .home-copy h1 {
          max-width: 690px;
          font-size: clamp(30px, 4vw, 43px);
          letter-spacing: -.045em;
          font-weight: 750;
        }
        .home-copy p { font-size: 13px; }
        .robot-stage {
          position: relative;
          display: grid;
          place-items: center;
          width: min(100%, 590px);
          height: 300px;
          margin: 0 auto 0;
          isolation: isolate;
        }
        .robot-orbit {
          position: absolute;
          left: 50%; top: 49%;
          width: 270px; height: 270px;
          border: 1px solid rgba(148,112,235,.2);
          border-radius: 50%;
          transform: translate(-50%,-50%);
          box-shadow: 0 0 45px rgba(145,111,236,.1), inset 0 0 40px rgba(145,111,236,.08);
          animation: robot-orbit 9s linear infinite;
        }
        .robot-orbit-two { width: 220px; height: 220px; border-style: dashed; animation-direction: reverse; animation-duration: 15s; }
        .nexora-robot {
          position: relative;
          z-index: 2;
          width: min(360px, 74vw);
          height: 300px;
          overflow: visible;
          filter: drop-shadow(0 20px 22px rgba(92,70,160,.18));
          animation: robot-hover 4.5s ease-in-out infinite;
        }
        .robot-arm { transform-box: fill-box; transform-origin: center; }
        .robot-arm-left { animation: robot-wave-left 3.8s ease-in-out infinite; }
        .robot-arm-right { animation: robot-wave-right 3.8s ease-in-out infinite; }
        .robot-eyes { animation: robot-blink 5s ease-in-out infinite; }
        .robot-speech-bubble {
          position: absolute; z-index: 3; top: 28px; right: max(3%, calc(50% - 245px));
          padding: 12px 15px; border: 1px solid rgba(133,111,203,.18);
          border-radius: 16px 16px 4px 16px; background: rgba(255,255,255,.83);
          color: #363052; box-shadow: 0 12px 30px rgba(91,72,145,.12);
          font-size: 11px; line-height: 1.55; white-space: pre-line;
          backdrop-filter: blur(12px);
        }
        .dark-mode .robot-speech-bubble { background: rgba(48,38,70,.9); color: #f7f2ff; border-color: rgba(193,166,255,.2); }
        .robot-spark { position: absolute; z-index: 1; color: #9574f4; font-size: 24px; animation: sparkle 3s ease-in-out infinite; }
        .robot-spark-one { left: 20%; top: 28%; }
        .robot-spark-two { right: 19%; top: 54%; animation-delay: .8s; }
        .robot-spark-three { left: 27%; bottom: 20%; font-size: 35px; animation-delay: 1.4s; }
        .robot-caption { position: absolute; bottom: 0; display: flex; align-items: center; gap: 7px; color: #8a70d4; font-size: 9px; font-weight: 800; letter-spacing: .19em; }
        .robot-caption-dot { width: 6px; height: 6px; border-radius: 50%; background: #8d6af0; box-shadow: 0 0 10px #9c7bff; }
        .robot-stage-active .nexora-robot { animation-duration: 1.7s; }
        .robot-stage-active .robot-orbit { border-color: rgba(135,99,239,.48); box-shadow: 0 0 55px rgba(145,111,236,.22); }
        .voice-composer {
          width: min(100%, 680px); margin: 6px auto 13px; padding: 15px 17px 12px;
          border: 1px solid rgba(137,117,202,.2); border-radius: 20px;
          background: rgba(255,255,255,.48); box-shadow: 0 12px 35px rgba(88,69,146,.08);
          backdrop-filter: blur(18px);
        }
        .dark-mode .voice-composer { background: rgba(39,30,58,.68); }
        .composer-prompt { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 12px; }
        .composer-spark { color: #8c6be8; font-size: 17px; }
        .composer-shortcuts { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 15px; }
        .composer-shortcuts span { padding: 7px 10px; border: 1px solid rgba(137,117,202,.16); border-radius: 20px; background: rgba(255,255,255,.42); color: var(--muted); font-size: 9px; }
        .dark-mode .composer-shortcuts span { background: rgba(255,255,255,.05); }
        .voice-status-pill { margin: 0 auto 10px; }
        .bottom-controls { padding: 3px 0 0; }
        .control-hint { margin-bottom: 12px; }
        .mic-control { box-shadow: 0 0 0 9px rgba(151,111,239,.09), 0 13px 32px rgba(105,70,190,.25); }
        .voice-footer { border-top-color: var(--border); }
        @keyframes robot-hover { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes robot-wave-left { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-5deg); } }
        @keyframes robot-wave-right { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(5deg); } }
        @keyframes robot-orbit { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes robot-blink { 0%,46%,50%,100% { opacity: 1; } 48% { opacity: .2; } }
        @keyframes sparkle { 0%,100% { opacity: .45; transform: scale(.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(18deg); } }
        @media (min-width: 900px) {
          .home-screen { min-height: 600px; }
          .robot-stage { height: 300px; }
        }
        @media (max-width: 600px) {
          .home-screen { min-height: 620px; padding: 17px 17px 22px; }
          .home-copy h1 { font-size: 29px; }
          .robot-stage { height: 250px; }
          .nexora-robot { height: 250px; }
          .robot-orbit { width: 210px; height: 210px; }
          .robot-orbit-two { width: 170px; height: 170px; }
          .robot-speech-bubble { top: 8px; right: 0; font-size: 9px; padding: 9px 11px; }
          .composer-shortcuts span { font-size: 8px; padding: 6px 8px; }
          .voice-composer { padding: 13px; }
        }
        /* Final polish: larger content canvas and a single aligned control toolbar */
        .voice-app {
          width: min(100%, 1120px);
          max-width: 1120px;
          min-height: min(790px, calc(100vh - 105px));
          border: 1px solid rgba(255,255,255,.72);
        }
        .home-screen {
          min-height: min(700px, calc(100vh - 190px));
          padding: 28px clamp(22px, 5vw, 66px) 26px;
          justify-content: flex-start;
        }
        .home-copy { margin-top: 8px; }
        .home-copy h1 {
          max-width: 760px;
          font-size: clamp(34px, 4.1vw, 48px);
          line-height: 1.12;
        }
        .home-copy p { margin-top: 9px; font-size: 14px; }
        .robot-stage {
          width: min(100%, 650px);
          height: clamp(275px, 34vh, 340px);
          margin-top: 3px;
        }
        .nexora-robot { width: min(390px, 75vw); height: 100%; }
        .robot-orbit { width: 300px; height: 300px; }
        .robot-orbit-two { width: 245px; height: 245px; }
        .robot-speech-bubble {
          top: 23px;
          right: max(2%, calc(50% - 270px));
          padding: 13px 16px;
          font-size: 12px;
        }
        .voice-composer {
          width: min(100%, 740px);
          margin: 9px auto 13px;
          padding: 17px 20px 14px;
          border-radius: 22px;
        }
        .composer-prompt { min-height: 25px; font-size: 13px; }
        .composer-shortcuts { gap: 9px; margin-top: 13px; }
        .composer-shortcuts span { padding: 8px 12px; font-size: 10px; }
        .voice-status-pill { margin: 0 auto 15px; }
        .bottom-controls {
          width: 100%;
          margin: 0 auto;
          padding: 0;
          text-align: center;
        }
        .control-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 17px;
          min-height: 82px;
        }
        .control-row .round-control {
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          border: 1px solid rgba(137,117,202,.2);
          background: rgba(255,255,255,.86);
          box-shadow: 0 7px 20px rgba(91,63,132,.08);
          color: #7555c7;
          font-size: 22px;
        }
        .control-row .mic-control {
          flex: 0 0 76px;
          width: 76px;
          height: 76px;
          margin: 0;
        }
        .control-row .mic-control-inner { width: 61px; height: 61px; }
        .control-inline-hint {
          display: inline-flex;
          align-items: center;
          min-height: 38px;
          max-width: 235px;
          padding: 0 13px;
          border: 1px solid rgba(137,117,202,.16);
          border-radius: 12px;
          background: rgba(255,255,255,.48);
          color: var(--muted);
          font-size: 11px;
          line-height: 1.4;
          text-align: left;
          white-space: normal;
        }
        .dark-mode .control-row .round-control { background: rgba(48,38,70,.8); color: #c8b4ff; border-color: rgba(193,166,255,.2); }
        .dark-mode .control-inline-hint { background: rgba(48,38,70,.55); border-color: rgba(193,166,255,.18); }
        .control-hint, .bottom-caption { display: none !important; }
        @media (max-width: 650px) {
          .voice-app { min-height: auto; }
          .home-screen { min-height: 620px; padding: 20px 16px 24px; }
          .home-copy h1 { font-size: 30px; }
          .home-copy p { font-size: 12px; }
          .robot-stage { height: 245px; }
          .nexora-robot { width: min(320px, 80vw); }
          .robot-orbit { width: 220px; height: 220px; }
          .robot-orbit-two { width: 180px; height: 180px; }
          .robot-speech-bubble { top: 5px; right: 0; max-width: 145px; font-size: 9px; }
          .voice-composer { padding: 13px; }
          .composer-shortcuts { gap: 5px; }
          .composer-shortcuts span { padding: 6px 8px; font-size: 8px; }
          .control-row { gap: 9px; flex-wrap: wrap; }
          .control-row .round-control { flex-basis: 42px; width: 42px; height: 42px; }
          .control-row .mic-control { flex-basis: 68px; width: 68px; height: 68px; }
          .control-row .mic-control-inner { width: 55px; height: 55px; }
          .control-inline-hint { max-width: 155px; padding: 0 9px; font-size: 9px; }
        }


        /* Single primary microphone action lives inside the voice composer bar */
        .composer-prompt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          min-height: 48px;
        }
        .composer-prompt-copy {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1 1 auto;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.45;
        }
        .composer-prompt-copy > span:last-child {
          overflow-wrap: anywhere;
        }
        .composer-mic-button {
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.85);
          border-radius: 14px;
          color: #fff;
          background: linear-gradient(145deg, #a98aff, #7650df 65%, #613bc5);
          box-shadow: 0 7px 20px rgba(112,76,202,.27), inset 0 1px 0 rgba(255,255,255,.4);
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        }
        .composer-mic-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(112,76,202,.34), inset 0 1px 0 rgba(255,255,255,.45);
          filter: saturate(1.08);
        }
        .composer-mic-button:focus-visible {
          outline: 3px solid rgba(151,119,255,.42);
          outline-offset: 3px;
        }
        .composer-mic-button:disabled { opacity: .72; cursor: wait; }
        .composer-mic-active {
          background: linear-gradient(145deg, #5edfc4, #21a98f);
          box-shadow: 0 7px 20px rgba(33,169,143,.24);
        }
        .composer-mic-live { font-size: 20px; font-weight: 800; }
        .dark-mode .composer-mic-button {
          border-color: rgba(210,194,255,.2);
          box-shadow: 0 7px 22px rgba(113,78,207,.3), inset 0 1px 0 rgba(255,255,255,.24);
        }
        .control-row-secondary {
          gap: 13px;
          min-height: 52px;
        }
        .control-row-secondary .round-control {
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
        }
        .secondary-control-label {
          color: var(--muted);
          font-size: 11px;
          letter-spacing: .01em;
        }
        .control-inline-hint { display: none !important; }
        .control-row .mic-control { display: none !important; }
        @media (max-width: 600px) {
          .composer-prompt { gap: 9px; }
          .composer-prompt-copy { font-size: 11px; }
          .composer-mic-button { flex-basis: 42px; width: 42px; height: 42px; border-radius: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nexora-robot, .robot-arm, .robot-eyes, .robot-orbit, .robot-spark { animation: none !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      
        /* ===== Nexora Voice: balanced viewport layout ===== */
        .voice-shell {
          box-sizing: border-box;
          height: 100%;
          min-height: 0;
          padding: clamp(10px, 1.25vw, 20px);
          align-items: center;
          overflow: auto;
        }
        .voice-shell *,
        .voice-shell *::before,
        .voice-shell *::after { box-sizing: border-box; }
        .voice-app {
          width: min(100%, 1160px);
          height: min(100%, 810px);
          min-height: 0;
          max-height: calc(100vh - 105px);
          border-radius: 26px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .topbar {
          flex: 0 0 64px;
          min-height: 64px;
          padding: 0 24px;
        }
        .home-screen {
          flex: 1 1 auto;
          min-height: 0;
          height: 100%;
          padding: clamp(16px, 2.2vh, 24px) clamp(18px, 4vw, 48px) 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: clamp(7px, 1.2vh, 13px);
          overflow: auto;
        }
        .home-copy {
          order: 0;
          flex: 0 0 auto;
          width: 100%;
          margin: 0;
          text-align: center;
        }
        .home-copy .eyebrow {
          margin-bottom: 9px;
          font-size: 9px;
          letter-spacing: .2em;
        }
        .home-copy h1 {
          max-width: 760px;
          margin: 0 auto;
          font-size: clamp(30px, 3.1vw, 42px);
          line-height: 1.08;
          letter-spacing: -.045em;
        }
        .home-copy p {
          margin: 8px auto 0;
          font-size: clamp(11px, 1vw, 13px);
          line-height: 1.45;
        }
        .robot-stage {
          order: 1;
          flex: 0 1 clamp(205px, 29vh, 265px);
          width: min(100%, 590px);
          height: clamp(205px, 29vh, 265px);
          min-height: 190px;
          margin: 0 auto;
          overflow: visible;
          isolation: isolate;
        }
        .nexora-robot {
          width: auto;
          height: 100%;
          max-width: min(340px, 58vw);
          object-fit: contain;
          overflow: visible;
        }
        .robot-orbit { width: clamp(185px, 24vh, 245px); height: clamp(185px, 24vh, 245px); }
        .robot-orbit-two { width: clamp(155px, 20vh, 205px); height: clamp(155px, 20vh, 205px); }
        .robot-speech-bubble {
          top: 8%;
          right: max(2%, calc(50% - 255px));
          max-width: 190px;
          padding: 10px 13px;
          font-size: 10px;
          line-height: 1.45;
        }
        .robot-caption {
          bottom: 1px;
          font-size: 8px;
          letter-spacing: .16em;
        }
        .robot-spark-one { left: 18%; top: 28%; }
        .robot-spark-two { right: 17%; top: 55%; }
        .voice-composer {
          order: 2;
          flex: 0 0 auto;
          width: min(100%, 760px);
          margin: 0 auto;
          padding: 12px 16px 11px;
          border-radius: 18px;
        }
        .composer-prompt {
          min-height: 42px;
          gap: 14px;
          font-size: 12px;
        }
        .composer-prompt-copy {
          font-size: 12px;
          gap: 9px;
        }
        .composer-mic-button {
          width: 42px;
          height: 42px;
          flex-basis: 42px;
          border-radius: 13px;
        }
        .composer-shortcuts {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 8px;
        }
        .composer-shortcuts span {
          padding: 6px 9px;
          font-size: 9px;
        }
        .voice-status-pill {
          order: 3;
          flex: 0 0 auto;
          min-height: 30px;
          margin: 0 auto;
          padding: 0 12px;
          font-size: 10px;
        }
        .voice-error {
          order: 4;
          flex: 0 0 auto;
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
        }
        .bottom-controls {
          order: 5;
          flex: 0 0 auto;
          width: 100%;
          margin: 0 auto;
          padding: 0;
        }
        .control-row-secondary {
          min-height: 44px;
          gap: 12px;
        }
        .control-row-secondary .round-control {
          width: 38px;
          height: 38px;
          flex-basis: 38px;
          font-size: 18px;
        }
        .secondary-control-label {
          font-size: 10px;
          letter-spacing: .015em;
        }
        .voice-footer {
          flex: 0 0 34px;
          min-height: 34px;
          padding: 7px 14px;
        }

        /* Compact laptop / shorter viewport: preserve all controls without overlap */
        @media (max-height: 780px) and (min-width: 700px) {
          .voice-shell { padding: 8px 14px; }
          .voice-app { max-height: calc(100vh - 92px); }
          .topbar { flex-basis: 56px; min-height: 56px; }
          .home-screen { gap: 6px; padding-top: 12px; padding-bottom: 10px; }
          .home-copy .eyebrow { margin-bottom: 6px; }
          .home-copy h1 { font-size: clamp(27px, 3vw, 36px); }
          .robot-stage { flex-basis: 205px; height: 205px; min-height: 180px; }
          .nexora-robot { max-width: 265px; }
          .voice-composer { padding: 9px 13px; }
          .composer-prompt { min-height: 36px; }
          .composer-mic-button { width: 38px; height: 38px; flex-basis: 38px; }
          .composer-shortcuts { margin-top: 5px; }
          .composer-shortcuts span { padding: 5px 8px; }
          .voice-footer { flex-basis: 30px; min-height: 30px; }
        }
        @media (max-width: 699px) {
          .voice-shell {
            height: auto;
            min-height: 100%;
            padding: 0;
            overflow: visible;
          }
          .voice-app {
            width: 100%;
            height: auto;
            min-height: 0;
            max-height: none;
            border-radius: 0;
            overflow: visible;
          }
          .topbar { flex-basis: 58px; min-height: 58px; padding: 0 14px; }
          .home-screen {
            height: auto;
            min-height: 0;
            padding: 22px 16px 24px;
            gap: 12px;
            overflow: visible;
          }
          .home-copy h1 { font-size: clamp(27px, 7vw, 34px); }
          .home-copy p { max-width: 340px; font-size: 11px; }
          .robot-stage {
            flex: 0 0 235px;
            width: 100%;
            height: 235px;
            min-height: 235px;
          }
          .nexora-robot { max-width: 285px; }
          .robot-orbit { width: 205px; height: 205px; }
          .robot-orbit-two { width: 170px; height: 170px; }
          .robot-speech-bubble { top: 2%; right: 0; max-width: 145px; font-size: 9px; }
          .voice-composer { padding: 11px 12px; }
          .composer-prompt-copy { font-size: 10px; }
          .composer-shortcuts { gap: 5px; }
          .composer-shortcuts span { padding: 5px 7px; font-size: 8px; }
          .voice-status-pill { margin-top: 1px; }
          .bottom-controls { padding-top: 2px; }
          .voice-footer { flex-basis: 34px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nexora-robot, .robot-arm, .robot-eyes, .robot-orbit, .robot-spark {
            animation: none !important;
          }
        }
      `}
</style>
    </main>
  );
}
