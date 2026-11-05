"use client";

import Image from "next/image";
import VoiceMode from "@/components/VoiceMode";

import { Mic } from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  deleteConversation,
  getConversationMessages,
  getConversations,
  logout,
  sendChatMessage,
  uploadDocument,
  getDocuments,
  deleteDocument,
  type ConversationSummary,
  type KnowledgeDocument,
} from "@/lib/api";
import {
  searchResearchRecommendations,
  type RecommendationCategory,
  type ResearchRecommendation,
} from "@/lib/api";
import {
  Activity,
  ArrowUp,
  Bot,
  BookOpen,
  CheckCircle2,
  FileText,
  FileUp,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Moon,
  Send,
  Paperclip,
  Code2,
  Database,
  ExternalLink,
  Sparkles,
  Trash2,
  UploadCloud,
  Workflow,
  X,
} from "lucide-react";

type SourceCitation = {
  filename: string;
  chunk_index: number;
  excerpt: string;
  score: number;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
};

type NavigationItem = {
  label: string;
  icon: ReactNode;
};

const navigation: NavigationItem[] = [
  { label: "AI Workspace", icon: <LayoutDashboard size={18} /> },
  { label: "Voice Mode", icon: <Mic size={18} /> },
  { label: "Knowledge Base", icon: <BookOpen size={18} /> },
  { label: "AI Agents", icon: <Workflow size={18} /> },
  { label: "Analytics", icon: <Activity size={18} /> },
  { label: "Research Intelligence", icon: <BookOpen size={18} /> },
];

const suggestions = [
  {
    icon: <Search size={19} />,
    title: "Research with sources",
    description: "Explore a topic and organize your findings.",
    prompt:
      "Help me research a topic and organize the sources I should verify.",
  },
  {
    icon: <FileText size={19} />,
    title: "Understand documents",
    description: "Prepare questions for your knowledge base.",
    prompt:
      "How should I analyze documents and get answers with source citations?",
  },
  {
    icon: <Workflow size={19} />,
    title: "Design an AI workflow",
    description: "Turn a complex task into clear steps.",
    prompt:
      "Help me design a reliable AI agent workflow for a business task.",
  },
  {
    icon: <Activity size={19} />,
    title: "Analyze information",
    description: "Plan useful metrics and visualizations.",
    prompt:
      "Help me choose meaningful metrics and graphs for an analytics dashboard.",
  },
];

const panelStyle = {
  border: "1px solid var(--border)",
  borderRadius: 16,
  background: "var(--surface-card)",
} as const;

const mutedStyle = {
  color: "var(--muted)",
  fontSize: 12,
} as const;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(name: string) {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function formatConversationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function getConversationTitle(conversation: ConversationSummary) {
  const title = conversation.title?.trim();

  if (title && title.toLowerCase() !== "new conversation") {
    return title;
  }

  return `Conversation ${conversation.id.slice(0, 8)}`;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;

    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key} className="markdown-inline-code">{part.slice(1, -1)}</code>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return <a key={key} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="markdown-link">{linkMatch[1]}</a>;
    }
    return <span key={key}>{part}</span>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre className="markdown-code-block" key={`code-${blocks.length}`}>
          {language && <span className="markdown-code-language">{language}</span>}
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const children = renderInlineMarkdown(heading[2], `heading-${index}`);
      const style = { margin: "16px 0 7px", lineHeight: 1.35, fontWeight: 700 } as const;
      if (level === 1) blocks.push(<h2 key={`h-${index}`} style={{ ...style, fontSize: 21 }}>{children}</h2>);
      else if (level === 2) blocks.push(<h3 key={`h-${index}`} style={{ ...style, fontSize: 18 }}>{children}</h3>);
      else blocks.push(<h4 key={`h-${index}`} style={{ ...style, fontSize: 15 }}>{children}</h4>);
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        const itemText = lines[index].replace(/^\s*[-*+]\s+/, "");
        items.push(<li key={`ul-${index}`}>{renderInlineMarkdown(itemText, `ul-${index}`)}</li>);
        index += 1;
      }
      blocks.push(<ul key={`ul-block-${blocks.length}`} className="markdown-list">{items}</ul>);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        const itemText = lines[index].replace(/^\s*\d+[.)]\s+/, "");
        items.push(<li key={`ol-${index}`}>{renderInlineMarkdown(itemText, `ol-${index}`)}</li>);
        index += 1;
      }
      blocks.push(<ol key={`ol-block-${blocks.length}`} className="markdown-list">{items}</ol>);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${blocks.length}`} className="markdown-quote">{quoteLines.map((quoteLine, i) => <span key={i}>{i > 0 && <br />}{renderInlineMarkdown(quoteLine, `quote-${blocks.length}-${i}`)}</span>)}</blockquote>);
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^```/.test(lines[index].trim()) && !/^(#{1,3})\s+/.test(lines[index]) && !/^\s*[-*+]\s+/.test(lines[index]) && !/^\s*\d+[.)]\s+/.test(lines[index]) && !/^>\s?/.test(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`p-${blocks.length}`} className="markdown-paragraph">{paragraphLines.map((paragraphLine, i) => <span key={i}>{i > 0 && <br />}{renderInlineMarkdown(paragraphLine, `p-${blocks.length}-${i}`)}</span>)}</p>);
  }

  return <div className="markdown-content">{blocks}</div>;
}

function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="feature-page">
      <div className="feature-icon">{icon}</div>
      <span className="feature-eyebrow">NEXORA AI WORKSPACE</span>
      <h1 className="feature-title">{title}</h1>
      <p className="feature-description">{description}</p>

      <div className="feature-notice">
        <Sparkles size={17} />
        <div>
          <strong>Coming in a future milestone</strong>
          <p>
            This section is not connected to a backend yet. We will implement
            and test it before marking it as complete.
          </p>
        </div>
      </div>
    </section>
  );
}

function KnowledgeBase() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDocuments();
      setDocuments(result);
      setNotice("");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not load your documents.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function uploadSelectedFiles(selectedFiles: File[]) {
    if (selectedFiles.length === 0 || isUploading) return;

    const allowedExtensions = ["pdf", "docx", "txt"];
    const validFiles = selectedFiles.filter((file) =>
      allowedExtensions.includes(file.name.split(".").pop()?.toLowerCase() ?? ""),
    );
    const rejectedFiles = selectedFiles
      .filter((file) => !validFiles.includes(file))
      .map((file) => file.name);

    if (rejectedFiles.length > 0) {
      setNotice(
        `Unsupported file type: ${rejectedFiles.join(", ")}. Use PDF, DOCX, or TXT.`,
      );
    } else {
      setNotice("");
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    let uploadedCount = 0;
    const failedFiles: string[] = [];

    try {
      for (const file of validFiles) {
        try {
          await uploadDocument(file);
          uploadedCount++;
        } catch (error) {
          failedFiles.push(
            `${file.name}: ${
              error instanceof Error ? error.message : "Upload failed"
            }`,
          );
        }
      }

      await loadDocuments();

      if (failedFiles.length > 0) {
        setNotice(
          [
            uploadedCount > 0
              ? `${uploadedCount} document(s) uploaded successfully.`
              : "",
            ...failedFiles,
          ]
            .filter(Boolean)
            .join(" "),
        );
      } else if (uploadedCount > 0) {
        setNotice(`${uploadedCount} document(s) uploaded and saved successfully.`);
      }
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    void uploadSelectedFiles(selectedFiles);
  }

  async function removeDocument(document: KnowledgeDocument) {
    if (!window.confirm(`Delete "${document.filename}" permanently?`)) return;

    setDeletingId(document.id);
    setNotice("");
    try {
      await deleteDocument(document.id);
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      );
      setNotice("Document deleted successfully.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not delete the document.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalBytes = documents.reduce(
    (total, item) => total + (Number(item.size_bytes) || 0),
    0,
  );
  const filteredDocuments = documents
    .filter((item) => {
      const matchesSearch = item.filename
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      const extension = item.filename.split(".").pop()?.toLowerCase() ?? "";
      const matchesType = typeFilter === "all" || extension === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOrder === "name") {
        return a.filename.localeCompare(b.filename);
      }
      if (sortOrder === "largest") {
        return (b.size_bytes || 0) - (a.size_bytes || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const recentDocuments = [...documents]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  const extensionColor = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "#fb7185";
    if (extension === "docx") return "#60a5fa";
    return "#c084fc";
  };

  const fileIcon = (filename: string, size = 25) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension === "pdf" ? (
      <FileText size={size} />
    ) : extension === "docx" ? (
      <FileText size={size} />
    ) : (
      <FileText size={size} />
    );
  };

  const cardStyle = {
    border: "1px solid var(--border)",
    borderRadius: 15,
    background: "var(--surface-card)",
  } as const;

  const smallButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 37,
    padding: "0 12px",
    border: "1px solid var(--border)",
    borderRadius: 9,
    color: "var(--foreground)",
    background: "var(--surface-card)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  } as const;

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
        padding: "clamp(16px, 2.5vw, 30px)",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        multiple
        onChange={handleFileSelection}
        style={{ display: "none" }}
        aria-label="Choose documents to upload"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div>
          <div className="eyebrow">
            <BookOpen size={15} />
            KNOWLEDGE MANAGEMENT
          </div>
          <h1
            style={{
              margin: "9px 0 5px",
              fontSize: "clamp(24px, 3vw, 32px)",
              letterSpacing: "-1px",
              lineHeight: 1.2,
            }}
          >
            Your knowledge library
          </h1>
          <p style={{ ...mutedStyle, margin: 0, lineHeight: 1.6 }}>
            Upload, organize, and manage the documents connected to your AI workspace.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <button
            type="button"
            style={smallButtonStyle}
            onClick={() => void loadDocuments()}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            className="new-chat"
            style={{ width: "auto", minHeight: 38, padding: "0 15px" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {isUploading ? "Uploading..." : "Add documents"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            ...cardStyle,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            marginBottom: 16,
            color: "var(--muted)",
            fontSize: 12,
            lineHeight: 1.6,
            overflowWrap: "anywhere",
          }}
        >
          <CheckCircle2
            size={16}
            color="var(--mint)"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <span style={{ flex: 1 }}>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
            style={{
              border: 0,
              color: "var(--muted)",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(255px, 310px) minmax(0, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
        className="knowledge-library-layout"
      >
        <aside style={{ ...cardStyle, padding: 15, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
              Upload documents
            </h2>
            <span style={{ ...mutedStyle, fontSize: 10 }}>
              {documents.length} saved
            </span>
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              void uploadSelectedFiles(Array.from(event.dataTransfer.files));
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              minHeight: 175,
              padding: 18,
              border: `1px dashed ${
                isDragging ? "var(--mint)" : "rgba(119, 117, 248, 0.55)"
              }`,
              borderRadius: 12,
              color: "var(--foreground)",
              background: isDragging
                ? "rgba(98,230,199,0.09)"
                : "linear-gradient(145deg, rgba(119,117,248,0.10), rgba(98,230,199,0.035))",
              cursor: isUploading ? "wait" : "pointer",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 45,
                height: 45,
                marginBottom: 12,
                borderRadius: 14,
                color: "var(--accent-text)",
                background: "var(--surface-accent)",
              }}
            >
              {isUploading ? (
                <LoaderCircle size={23} className="animate-spin" />
              ) : (
                <UploadCloud size={23} />
              )}
            </span>
            <strong style={{ fontSize: 12 }}>
              {isUploading
                ? "Uploading your files..."
                : isDragging
                  ? "Drop files to upload"
                  : "Drag or upload your files"}
            </strong>
            <span
              style={{
                ...mutedStyle,
                marginTop: 7,
                fontSize: 10,
                lineHeight: 1.65,
              }}
            >
              Add documents to your Nexora AI knowledge base
            </span>
            <span
              style={{
                ...smallButtonStyle,
                minHeight: 31,
                marginTop: 12,
                padding: "0 12px",
              }}
            >
              <FileUp size={13} />
              Browse files
            </span>
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              margin: "20px 0 10px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>
              Recent uploads
            </h3>
            <span style={{ ...mutedStyle, fontSize: 10 }}>
              {recentDocuments.length} files
            </span>
          </div>

          {recentDocuments.length === 0 ? (
            <p style={{ ...mutedStyle, fontSize: 11, lineHeight: 1.7 }}>
              Your recently uploaded documents will appear here.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 3 }}>
              {recentDocuments.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "9px 4px",
                    borderBottom: "1px solid var(--border)",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 30,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: 8,
                      color: extensionColor(item.filename),
                      background: `${extensionColor(item.filename)}18`,
                    }}
                  >
                    {fileIcon(item.filename, 16)}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {item.filename}
                    </span>
                    <span style={{ ...mutedStyle, fontSize: 9 }}>
                      {formatFileSize(item.size_bytes)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 20,
              padding: 13,
              border: "1px solid var(--border)",
              borderRadius: 11,
              background: "var(--surface-input)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Database size={15} color="var(--mint)" />
              Library storage
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 12,
              }}
            >
              <strong style={{ fontSize: 18 }}>
                {formatFileSize(totalBytes)}
              </strong>
              <span style={{ ...mutedStyle, fontSize: 9 }}>
                {documents.length} documents
              </span>
            </div>
            <div
              style={{
                height: 5,
                marginTop: 10,
                overflow: "hidden",
                borderRadius: 99,
                background: "var(--border)",
              }}
            >
              <div
                style={{
                  width: documents.length ? "100%" : "0%",
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, #7775F8, #62E6C7)",
                }}
              />
            </div>
            <p style={{ ...mutedStyle, margin: "9px 0 0", fontSize: 9 }}>
              Total size of your uploaded files. No storage quota is assumed.
            </p>
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 15,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Your documents
              </h2>
              <p style={{ ...mutedStyle, margin: "5px 0 0", fontSize: 10 }}>
                {filteredDocuments.length} of {documents.length} documents
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  minHeight: 36,
                  padding: "0 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  background: "var(--surface-card)",
                }}
              >
                <Search size={14} color="var(--muted)" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search files..."
                  aria-label="Search documents"
                  style={{
                    width: 135,
                    maxWidth: "35vw",
                    border: 0,
                    outline: 0,
                    color: "var(--foreground)",
                    background: "transparent",
                    fontSize: 10,
                  }}
                />
              </label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter by file type"
                style={{
                  ...smallButtonStyle,
                  padding: "0 9px",
                  fontWeight: 500,
                }}
              >
                <option value="all">All types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
              </select>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-label="Sort documents"
                style={{
                  ...smallButtonStyle,
                  padding: "0 9px",
                  fontWeight: 500,
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name</option>
                <option value="largest">Largest</option>
              </select>
              <div
                style={{
                  display: "flex",
                  padding: 3,
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  background: "var(--surface-card)",
                }}
              >
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 29,
                    height: 28,
                    border: 0,
                    borderRadius: 6,
                    color: viewMode === "grid" ? "var(--foreground)" : "var(--muted)",
                    background: viewMode === "grid" ? "var(--surface-accent)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <LayoutDashboard size={14} />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  onClick={() => setViewMode("list")}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 29,
                    height: 28,
                    border: 0,
                    borderRadius: 6,
                    color: viewMode === "list" ? "var(--foreground)" : "var(--muted)",
                    background: viewMode === "list" ? "var(--surface-accent)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <FileText size={14} />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div
              style={{
                ...cardStyle,
                minHeight: 230,
                display: "grid",
                placeItems: "center",
                color: "var(--muted)",
                fontSize: 12,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <LoaderCircle size={18} className="animate-spin" />
                Loading your documents...
              </span>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  viewMode === "grid"
                    ? "repeat(auto-fill, minmax(min(100%, 185px), 1fr))"
                    : "minmax(0, 1fr)",
                gap: 12,
              }}
            >
              {filteredDocuments.map((item) => (
                <article
                  key={item.id}
                  style={{
                    ...cardStyle,
                    minWidth: 0,
                    overflow: "hidden",
                    transition: "border-color 160ms ease, transform 160ms ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: viewMode === "grid" ? "column" : "row",
                      alignItems: viewMode === "grid" ? "center" : "center",
                      gap: 12,
                      minWidth: 0,
                      padding: viewMode === "grid" ? "20px 14px 15px" : "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: viewMode === "grid" ? 76 : 43,
                        height: viewMode === "grid" ? 76 : 43,
                        flexShrink: 0,
                        borderRadius: 16,
                        color: extensionColor(item.filename),
                        background: `${extensionColor(item.filename)}18`,
                      }}
                    >
                      {fileIcon(item.filename, viewMode === "grid" ? 34 : 21)}
                    </div>
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                        width: viewMode === "grid" ? "100%" : "auto",
                        textAlign: viewMode === "grid" ? "center" : "left",
                      }}
                    >
                      <strong
                        title={item.filename}
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: viewMode === "grid" ? "nowrap" : "normal",
                          overflowWrap: "anywhere",
                          fontSize: 11,
                          fontWeight: 650,
                        }}
                      >
                        {item.filename}
                      </strong>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 8,
                          padding: "3px 8px",
                          border: "1px solid var(--border)",
                          borderRadius: 99,
                          color: "var(--muted)",
                          fontSize: 9,
                        }}
                      >
                        {getFileExtension(item.filename)} · {formatFileSize(item.size_bytes)}
                      </span>
                    </div>
                    {viewMode === "list" && (
                      <span style={{ ...mutedStyle, fontSize: 10, whiteSpace: "nowrap" }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => void removeDocument(item)}
                      aria-label={`Delete ${item.filename}`}
                      title="Delete document"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--danger-text)",
                        background: "transparent",
                        cursor: deletingId === item.id ? "wait" : "pointer",
                      }}
                    >
                      {deletingId === item.id ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                  {viewMode === "grid" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "10px 12px",
                        borderTop: "1px solid var(--border)",
                        color: "var(--muted)",
                        fontSize: 9,
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <CheckCircle2 size={11} color="var(--mint)" />
                        Saved to library
                      </span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                ...cardStyle,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "48px 22px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  color: "var(--accent-text)",
                  background: "var(--surface-accent)",
                  marginBottom: 15,
                }}
              >
                {searchQuery || typeFilter !== "all" ? (
                  <Search size={23} />
                ) : (
                  <FolderOpen size={23} />
                )}
              </div>
              <h3 style={{ margin: "0 0 7px", fontSize: 15 }}>
                {searchQuery || typeFilter !== "all"
                  ? "No matching documents"
                  : "Your library is empty"}
              </h3>
              <p
                style={{
                  ...mutedStyle,
                  maxWidth: 350,
                  margin: "0 0 17px",
                  lineHeight: 1.7,
                }}
              >
                {searchQuery || typeFilter !== "all"
                  ? "Try a different search or file type filter."
                  : "Upload your first PDF, DOCX, or TXT file to start building your knowledge library."}
              </p>
              <button
                type="button"
                className="new-chat"
                style={{ width: "auto", padding: "0 15px" }}
                onClick={() => {
                  if (searchQuery || typeFilter !== "all") {
                    setSearchQuery("");
                    setTypeFilter("all");
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Plus size={15} />
                {searchQuery || typeFilter !== "all" ? "Clear filters" : "Upload a document"}
              </button>
            </div>
          )}

          <div
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 14,
              marginTop: 16,
            }}
          >
            <Sparkles
              size={17}
              color="var(--mint)"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <strong style={{ fontSize: 11 }}>Connected to your Nexora AI knowledge base</strong>
              <p style={{ ...mutedStyle, margin: "5px 0 0", lineHeight: 1.7, fontSize: 10 }}>
                Uploaded documents are stored through your existing backend. Their extracted
                content can be used by document-aware conversations and source citations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 850px) {
          .knowledge-library-layout {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}

type AIAgent = {
  id: string;
  name: string;
  instructions: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type AgentRunRecord = {
  id: string;
  task: string;
  result: string;
  created_at?: string | null;
};

function AIAgentsDashboard() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [task, setTask] = useState("");
  const [result, setResult] = useState("");
  const [runs, setRuns] = useState<AgentRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const apiRequest = useCallback(async (path: string, init: RequestInit = {}) => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    const token = typeof window !== "undefined" ? window.localStorage.getItem("nexora_access_token") : null;
    if (!token) throw new Error("Please log in again to manage your agents.");
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof body.detail === "string" ? body.detail : typeof body.message === "string" ? body.message : "The request could not be completed.";
      throw new Error(message);
    }
    return body;
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await apiRequest("/api/agents");
      const items = Array.isArray(body?.agents) ? body.agents as AIAgent[] : [];
      setAgents(items);
      setSelectedId((current) => items.some((agent) => agent.id === current) ? current : (items[0]?.id || ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load agents.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  const loadRuns = useCallback(async (agentId: string) => {
    if (!agentId) { setRuns([]); return; }
    try {
      const body = await apiRequest(`/api/agents/${encodeURIComponent(agentId)}/runs`);
      setRuns(Array.isArray(body?.runs) ? body.runs as AgentRunRecord[] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load run history.");
    }
  }, [apiRequest]);

  useEffect(() => { void loadAgents(); }, [loadAgents]);
  useEffect(() => { if (selectedId) void loadRuns(selectedId); else setRuns([]); }, [selectedId, loadRuns]);

  async function createAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const body = await apiRequest("/api/agents", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), instructions: instructions.trim() }),
      });
      setAgents((current) => [body as AIAgent, ...current]);
      setSelectedId((body as AIAgent).id);
      setName(""); setInstructions(""); setNotice("Agent created and saved to your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the agent.");
    } finally { setSaving(false); }
  }

  async function runSelectedAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setRunning(true); setError(""); setNotice(""); setResult("");
    try {
      const body = await apiRequest(`/api/agents/${encodeURIComponent(selectedId)}/run`, {
        method: "POST", body: JSON.stringify({ task: task.trim() }),
      });
      setResult(typeof body?.result === "string" ? body.result : "The agent completed without returning text.");
      setTask(""); setNotice("Agent run completed and saved to history.");
      await loadRuns(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The agent could not complete the task.");
    } finally { setRunning(false); }
  }

  async function removeAgent(agentId: string) {
    if (!window.confirm("Delete this agent and its saved run history?")) return;
    setError(""); setNotice("");
    try {
      await apiRequest(`/api/agents/${encodeURIComponent(agentId)}`, { method: "DELETE" });
      const remaining = agents.filter((agent) => agent.id !== agentId);
      setAgents(remaining);
      if (selectedId === agentId) { setSelectedId(remaining[0]?.id || ""); setResult(""); }
      setNotice("Agent deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the agent.");
    }
  }

  const fieldStyle = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 13px", background: "var(--surface-input)", color: "var(--foreground)", font: "inherit", outlineOffset: 2 } as const;
  const buttonStyle = { border: "1px solid rgba(124, 109, 255, 0.55)", borderRadius: 10, padding: "10px 14px", background: "rgba(103, 87, 230, 0.18)", color: "var(--foreground)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 } as const;

  return (
    <section style={{ width: "100%", maxWidth: 1120, margin: "0 auto", padding: "clamp(20px, 3vw, 36px)" }}>
      <div className="eyebrow"><Workflow size={16} /> YOUR AI WORKFLOWS</div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
        <div><h1 className="feature-title">AI Agents</h1><p className="feature-description">Create reusable AI assistants with your own instructions, run tasks, and review saved results.</p></div>
        <button type="button" onClick={() => void loadAgents()} disabled={loading} style={buttonStyle}><RefreshCw size={16} /> Refresh</button>
      </div>
      {error && <div role="alert" style={{ ...panelStyle, padding: 13, marginTop: 18, borderColor: "rgba(248, 113, 113, .5)", color: "var(--danger-text)" }}>{error}</div>}
      {notice && <div role="status" style={{ ...panelStyle, padding: 13, marginTop: 18, borderColor: "rgba(94, 234, 212, .35)", color: "var(--success-text)" }}>{notice}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 18, marginTop: 24 }}>
        <div style={{ ...panelStyle, padding: 22, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}><span className="feature-icon" style={{ width: 40, height: 40, margin: 0 }}><Plus size={19} /></span><div><h2 style={{ margin: 0, fontSize: 17 }}>Create an agent</h2><p style={{ ...mutedStyle, margin: "4px 0 0" }}>Define its role and behavior.</p></div></div>
          <form onSubmit={createAgent} style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 600 }}>Agent name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required placeholder="e.g. Resume Reviewer" style={fieldStyle} /></label>
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 600 }}>Instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} minLength={10} maxLength={5000} required rows={5} placeholder="Explain the agent's role, goals, constraints, and preferred output format..." style={{ ...fieldStyle, resize: "vertical" }} /></label>
            <button type="submit" disabled={saving} style={{ ...buttonStyle, justifySelf: "start", opacity: saving ? 0.65 : 1 }}>{saving ? <LoaderCircle size={16} /> : <Plus size={16} />}{saving ? "Saving..." : "Create agent"}</button>
          </form>
        </div>
        <div style={{ ...panelStyle, padding: 22, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}><span className="feature-icon" style={{ width: 40, height: 40, margin: 0 }}><Bot size={19} /></span><div><h2 style={{ margin: 0, fontSize: 17 }}>Run an agent</h2><p style={{ ...mutedStyle, margin: "4px 0 0" }}>Give your selected agent a task.</p></div></div>
          {loading ? <p style={mutedStyle}>Loading your agents...</p> : agents.length === 0 ? <p style={{ ...mutedStyle, lineHeight: 1.8 }}>Create your first agent to start running tasks.</p> : <>
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Choose agent<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setResult(""); }} style={fieldStyle}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            {selectedId && <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}><span style={mutedStyle}>{agents.find((agent) => agent.id === selectedId)?.instructions}</span><button type="button" aria-label="Delete selected agent" title="Delete agent" onClick={() => void removeAgent(selectedId)} style={{ ...buttonStyle, padding: 8, color: "var(--danger-text)", borderColor: "rgba(248, 113, 113, .35)" }}><Trash2 size={16} /></button></div>}
            <form onSubmit={runSelectedAgent} style={{ display: "grid", gap: 12 }}><label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 600 }}>Task<textarea value={task} onChange={(event) => setTask(event.target.value)} minLength={1} maxLength={10000} required rows={4} placeholder="Describe what you want the agent to do..." style={{ ...fieldStyle, resize: "vertical" }} /></label><button type="submit" disabled={running || !selectedId} style={{ ...buttonStyle, justifySelf: "start", opacity: running ? 0.65 : 1 }}>{running ? <LoaderCircle size={16} /> : <Sparkles size={16} />}{running ? "Running..." : "Run agent"}</button></form>
          </>}
        </div>
      </div>
      {result && <div style={{ ...panelStyle, padding: 22, marginTop: 18 }}><h2 style={{ margin: "0 0 12px", fontSize: 17 }}>Latest result</h2><div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.8, fontSize: 14 }}>{result}</div></div>}
      <div style={{ ...panelStyle, padding: 22, marginTop: 18 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 17 }}>Recent run history</h2><span style={mutedStyle}>Latest 20 runs</span></div>
        {!selectedId ? <p style={mutedStyle}>Select or create an agent to see its run history.</p> : runs.length === 0 ? <p style={mutedStyle}>No runs yet. Submit a task to see results here.</p> : <div style={{ display: "grid", gap: 12 }}>{runs.map((run) => <article key={run.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}><p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 13 }}>{run.task}</p><p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7, fontSize: 13, color: "var(--muted)" }}>{run.result}</p><p style={{ ...mutedStyle, margin: "8px 0 0" }}>{run.created_at ? new Date(run.created_at).toLocaleString() : "Saved run"}</p></article>)}</div>}
      </div>
      <p style={{ ...mutedStyle, marginTop: 16, lineHeight: 1.7 }}>Agents currently generate responses using their saved instructions. They do not have browser access or permission to execute external actions.</p>
    </section>
  );
}


type AnalyticsData = {
  conversations: number;
  messages: number;
  documents: number;
  document_bytes: number;
  daily_activity: { date: string; messages: number }[];
};

function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
      const token = typeof window !== "undefined"
        ? window.localStorage.getItem("nexora_access_token")
        : null;
      if (!token) throw new Error("Please log in again to view your analytics.");

      const response = await fetch(`${baseUrl}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.detail === "string" ? body.detail : "Could not load analytics.");
      }
      setData(body as AnalyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAnalytics(); }, [loadAnalytics]);

  const cardStyle = {
    ...panelStyle,
    padding: 20,
    minWidth: 0,
  } as const;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const metrics = [
    { label: "Conversations", value: data?.conversations ?? 0, icon: <MessageSquare size={19} /> },
    { label: "Messages", value: data?.messages ?? 0, icon: <Activity size={19} /> },
    { label: "Knowledge documents", value: data?.documents ?? 0, icon: <FileText size={19} /> },
    { label: "Document storage", value: formatBytes(data?.document_bytes ?? 0), icon: <FolderOpen size={19} /> },
  ];

  const maxActivity = Math.max(1, ...(data?.daily_activity.map((day) => day.messages) ?? [0]));

  return (
    <section style={{ width: "100%", maxWidth: 1120, margin: "0 auto", padding: "clamp(24px, 4vw, 44px)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <div>
          <div className="eyebrow"><Activity size={15} /> YOUR WORKSPACE INSIGHTS</div>
          <h1 className="feature-title" style={{ marginTop: 12 }}>Analytics overview</h1>
          <p className="feature-description">A live summary of activity saved to your Nexora AI account.</p>
        </div>
        <button type="button" className="new-chat" onClick={() => void loadAnalytics()} disabled={loading} style={{ width: "auto", padding: "0 16px" }}>
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh data
        </button>
      </div>

      {error && <div role="alert" style={{ ...panelStyle, padding: 15, marginBottom: 20, color: "var(--danger-text)", fontSize: 12 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 22 }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, color: "var(--muted)", fontSize: 12 }}>
              {metric.label}
              <span style={{ color: "var(--accent-text)" }}>{metric.icon}</span>
            </div>
            <div style={{ marginTop: 17, fontSize: 29, fontWeight: 750, letterSpacing: "-1px", overflowWrap: "anywhere" }}>
              {loading && !data ? "—" : metric.value}
            </div>
            <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 11 }}>Based on your saved account data</div>
          </div>
        ))}
      </div>

      <div style={{ ...panelStyle, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Message activity</h2>
            <p style={{ ...mutedStyle, margin: "7px 0 0", lineHeight: 1.6 }}>Messages saved over the last seven days.</p>
          </div>
          <span style={{ color: "var(--mint)", fontSize: 11 }}>Last 7 days</span>
        </div>
        {loading && !data ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--muted)", fontSize: 12 }}><LoaderCircle size={18} className="animate-spin" /> Loading activity…</div>
        ) : data?.daily_activity?.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", alignItems: "end", gap: 10, minHeight: 190 }}>
            {data.daily_activity.map((day) => {
              const height = Math.max(6, (day.messages / maxActivity) * 125);
              return (
                <div key={day.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "end", gap: 9, minWidth: 0, height: 190 }}>
                  <span style={{ color: "var(--muted)", fontSize: 10 }}>{day.messages}</span>
                  <div title={`${day.date}: ${day.messages} messages`} style={{ width: "min(100%, 42px)", height, borderRadius: "7px 7px 3px 3px", background: "linear-gradient(180deg, #8b7cff, #5eead4)", opacity: day.messages ? 1 : 0.25, transition: "height 180ms ease" }} />
                  <span style={{ color: "var(--muted)", fontSize: 10 }}>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>No message activity yet. Start a conversation and your analytics will update here.</div>
        )}
      </div>

      <p style={{ ...mutedStyle, marginTop: 16, lineHeight: 1.7 }}>
        These metrics reflect records currently saved in your database. They do not yet measure model latency, token usage, cost, or response quality.
      </p>
    </section>
  );
}


function ResearchIntelligenceDashboard({
  onAskInChat,
}: {
  onAskInChat: (prompt: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("All resources");
  const [includeRecent, setIncludeRecent] = useState(true);

  const categories = [
    { label: "All resources", icon: <Sparkles size={15} /> },
    { label: "Research papers", icon: <FileText size={15} /> },
    { label: "Websites", icon: <Search size={15} /> },
    { label: "GitHub projects", icon: <Code2 size={15} /> },
    { label: "Datasets", icon: <Database size={15} /> },
    { label: "Documentation", icon: <BookOpen size={15} /> },
  ];

  function submitResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = topic.trim();
    if (!value) return;
    const freshness = includeRecent ? " Prioritize recent and up-to-date sources." : "";
    const scope = category === "All resources" ? "research papers, trustworthy websites, GitHub projects, datasets, and official documentation" : category.toLowerCase();
    onAskInChat(`Research the topic: ${value}. Recommend relevant ${scope}. For every result, provide its real title, author or organization, publication date when available, a working source URL, DOI where applicable, and a short explanation of relevance. Do not invent sources or citations.${freshness}`);
  }

  return (
    <section style={{ width: "100%", maxWidth: 1180, margin: "0 auto", padding: "clamp(22px, 3vw, 38px)" }}>
      <div className="eyebrow"><Sparkles size={16} /> NEXORA RESEARCH INTELLIGENCE</div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginTop: 12 }}>
        <div style={{ maxWidth: 720 }}>
          <h1 className="feature-title" style={{ margin: 0 }}>Find knowledge. <span style={{ background: "linear-gradient(90deg, #9184ff, #62e6c7)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Discover what matters.</span></h1>
          <p className="feature-description" style={{ marginTop: 12 }}>Explore academic papers, trusted websites, open-source projects, datasets and technical documentation from one research workspace.</p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", background: "var(--surface-card)", color: "var(--muted)", borderRadius: 999, padding: "8px 12px", fontSize: 11 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--mint)" }} /> Research workspace</div>
      </div>

      <form onSubmit={submitResearch} style={{ ...panelStyle, padding: 18, marginTop: 25, background: "var(--surface-card)", boxShadow: "0 18px 55px rgba(70, 75, 150, 0.08)" }}>
        <label htmlFor="research-topic" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>What would you like to research?</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 340px", minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", borderRadius: 12, padding: "0 13px" }}>
            <Search size={18} color="var(--muted)" />
            <input id="research-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Retrieval-Augmented Generation for healthcare" style={{ width: "100%", minWidth: 0, border: 0, outline: 0, background: "transparent", color: "var(--text)", padding: "14px 0", fontSize: 13 }} />
          </div>
          <button type="submit" disabled={!topic.trim()} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 18px", border: 0, borderRadius: 11, color: "white", background: "linear-gradient(110deg, #7964f4, #5865d9)", fontSize: 12, fontWeight: 700, cursor: topic.trim() ? "pointer" : "not-allowed", opacity: topic.trim() ? 1 : 0.55 }}><Search size={15} /> Explore research <ArrowUp size={14} style={{ transform: "rotate(45deg)" }} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {categories.map((item) => <button type="button" key={item.label} onClick={() => setCategory(item.label)} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${category === item.label ? "rgba(125, 105, 255, .55)" : "var(--border)"}`, background: category === item.label ? "var(--surface-accent)" : "transparent", color: category === item.label ? "var(--accent-text)" : "var(--muted)", borderRadius: 999, padding: "7px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{item.icon}{item.label}</button>)}
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 11, cursor: "pointer" }}><input type="checkbox" checked={includeRecent} onChange={(event) => setIncludeRecent(event.target.checked)} /> Prefer recent sources</label>
        </div>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))", gap: 13, marginTop: 20 }}>
        {[
          { title: "Academic papers", detail: "Discover papers, abstracts, authors and DOI links.", icon: <FileText size={19} />, tint: "#9b8cff" },
          { title: "Trusted websites", detail: "Find useful articles, tutorials and technical resources.", icon: <Globe2 size={19} />, tint: "#62e6c7" },
          { title: "Open-source projects", detail: "Explore relevant GitHub repositories and implementations.", icon: <Code2 size={19} />, tint: "#72baff" },
          { title: "Datasets & docs", detail: "Locate datasets, API references and official guides.", icon: <Database size={19} />, tint: "#e0a4ff" },
        ].map((item) => <div key={item.title} style={{ ...panelStyle, padding: 17, minHeight: 126 }}><div style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 11, color: item.tint, background: `${item.tint}1c`, marginBottom: 13 }}>{item.icon}</div><div style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</div><p style={{ ...mutedStyle, lineHeight: 1.6, margin: "6px 0 0" }}>{item.detail}</p></div>)}
      </div>

      <div style={{ ...panelStyle, marginTop: 20, padding: "clamp(18px, 3vw, 25px)", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", margin: "0 auto 12px", borderRadius: 15, color: "var(--accent-text)", background: "var(--surface-accent)" }}><BookOpen size={22} /></div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 750 }}>Your research starts here</h2>
        <p style={{ maxWidth: 560, margin: "8px auto 16px", color: "var(--muted)", fontSize: 12, lineHeight: 1.7 }}>Enter a topic above to ask Nexora AI to discover and organize relevant resources. Recommendations will appear in your conversation with source details so you can verify them.</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
          {["AI-powered traffic management", "Large language models", "Computer vision in healthcare"].map((example) => <button type="button" key={example} onClick={() => setTopic(example)} style={{ border: "1px solid var(--border)", borderRadius: 999, background: "var(--surface)", color: "var(--muted)", padding: "8px 11px", fontSize: 10, cursor: "pointer" }}>{example}</button>)}
        </div>
      </div>
      <p style={{ ...mutedStyle, marginTop: 15, lineHeight: 1.6 }}>Source integrity matters: Nexora should provide real source links and clearly distinguish verified publication details from AI-generated summaries.</p>
      <style jsx>{`@media (max-width: 620px) { .feature-title { font-size: clamp(28px, 8vw, 40px); line-height: 1.12; } }`}</style>
    </section>
  );
}


const recommendationCategories: Array<{
  value: RecommendationCategory | "all";
  label: string;
}> = [
  { value: "all", label: "All resources" },
  { value: "research_papers", label: "Research papers" },
  { value: "useful_websites", label: "Useful websites" },
  { value: "github_repositories", label: "GitHub repositories" },
  { value: "ai_ml_tools", label: "AI/ML tools" },
  { value: "datasets", label: "Datasets" },
  { value: "courses_documentation", label: "Courses & docs" },
];

const recommendationIconButtonStyle: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: 5, width: 31, height: 31, padding: 0,
  border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--muted)", background: "transparent", cursor: "pointer",
};

const recommendationActionButtonStyle: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: 6, minHeight: 32, padding: "0 10px",
  border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--foreground)", background: "var(--surface-card)",
  fontSize: 10, fontWeight: 650, cursor: "pointer",
};

function RecommendationSidebar({
  latestUserPrompt,
}: {
  latestUserPrompt: string;
}) {
  const [items, setItems] = useState<ResearchRecommendation[]>([]);
  const [category, setCategory] = useState<RecommendationCategory | "all">("all");
  const [topic, setTopic] = useState(latestUserPrompt);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [searchedTopic, setSearchedTopic] = useState("");
  const requestIdRef = useRef(0);

  const searchRecommendations = useCallback(async (searchTopic: string) => {
    const selectedCategories: RecommendationCategory[] =
      category === "all"
        ? recommendationCategories
            .filter((item) => item.value !== "all")
            .map((item) => item.value as RecommendationCategory)
        : [category];
    const cleanTopic = searchTopic.trim();
    if (cleanTopic.length < 2) {
      setItems([]);
      setSearchedTopic("");
      setError("");
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const response = await searchResearchRecommendations({
        topic: cleanTopic,
        categories: selectedCategories,
      });
      if (requestId !== requestIdRef.current) return;
      setItems(response.recommendations);
      setSearchedTopic(response.topic);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "Could not retrieve live recommendations. Please try again.",
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (!latestUserPrompt.trim()) {
      setItems([]);
      setTopic("");
      setSearchedTopic("");
      setError("");
      setLoading(false);
      return;
    }
    setTopic(latestUserPrompt);
    void searchRecommendations(latestUserPrompt);
  }, [latestUserPrompt, searchRecommendations]);

  const handleManualSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void searchRecommendations(topic);
  };

  return (
    <>
      {expanded && (
        <button
          type="button"
          aria-label="Close expanded recommendations"
          onClick={() => setExpanded(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 999, border: 0,
            background: "rgba(3, 6, 18, .68)", cursor: "default",
          }}
        />
      )}
      <aside
        aria-label="Live recommendation hub"
        style={{
          ...panelStyle,
          position: expanded ? "fixed" : "relative",
          inset: expanded ? 14 : undefined,
          zIndex: expanded ? 1000 : "auto",
          width: expanded ? "auto" : "100%",
          maxWidth: expanded ? "none" : undefined,
          height: expanded ? "auto" : "min(760px, calc(100vh - 155px))",
          maxHeight: expanded ? "none" : 760,
          minHeight: expanded ? 0 : 420,
          display: "flex", flexDirection: "column",
          padding: expanded ? "clamp(18px, 3vw, 30px)" : 17,
          overflow: "hidden",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          boxShadow: expanded
            ? "0 28px 90px rgba(15, 23, 42, .28)"
            : "0 10px 30px rgba(31, 45, 75, .06)",
          transition: "background .2s ease, border-color .2s ease, box-shadow .2s ease",
        }}
      >
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 9, marginBottom: 13,
          flex: "0 0 auto",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              color: "var(--accent-text)", fontSize: 10, fontWeight: 750,
              letterSpacing: ".11em",
            }}>
              <Sparkles size={14} /> NEXORA INTELLIGENCE
            </div>
            <h2 style={{
              margin: "8px 0 4px", color: "var(--foreground)",
              fontSize: 18, fontWeight: 760, letterSpacing: "-.45px",
            }}>
              Recommendation Hub
            </h2>
            <p style={{
              ...mutedStyle, margin: 0, lineHeight: 1.55,
              color: "var(--muted)", fontSize: 11,
            }}>
              Discover useful resources from your conversation
            </p>
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => void searchRecommendations(topic)}
              disabled={loading || topic.trim().length < 2}
              title="Refresh live recommendations"
              aria-label="Refresh live recommendations"
              style={recommendationIconButtonStyle}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button" onClick={() => setExpanded((value) => !value)}
              title={expanded ? "Exit expanded view" : "Expand recommendations"}
              aria-label={expanded ? "Exit expanded view" : "Expand recommendations"}
              style={recommendationIconButtonStyle}
            >
              {expanded ? <X size={15} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        <form onSubmit={handleManualSearch} style={{
          display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 7, marginBottom: 10, flex: "0 0 auto",
        }}>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Search a topic or resource..."
            aria-label="Recommendation search topic"
            maxLength={500}
            style={{
              width: "100%", minWidth: 0, boxSizing: "border-box",
              border: "1px solid var(--border-strong)", borderRadius: 10,
              padding: "11px 12px", color: "var(--foreground)",
              background: "var(--surface-input)", font: "inherit", fontSize: 12,
              outlineColor: "var(--orchid)",
            }}
          />
          <button
            type="submit"
            disabled={loading || topic.trim().length < 2}
            style={{
              ...recommendationActionButtonStyle,
              color: "#fff", borderColor: "transparent",
              background: "linear-gradient(115deg, #6962d8, #5c70c9)",
              borderRadius: 10, minHeight: 40, padding: "0 13px",
              opacity: loading || topic.trim().length < 2 ? .6 : 1,
            }}
          >
            <Search size={13} /> Search
          </button>
        </form>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, margin: "2px 0 10px", padding: "8px 10px",
          border: "1px solid var(--border)", borderRadius: 10,
          background: "var(--panel-2)",
          flex: "0 0 auto",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            color: "var(--muted)", fontSize: 10, fontWeight: 600,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: 99,
              background: loading ? "var(--orchid)" : "var(--success)",
              boxShadow: loading ? "0 0 0 3px var(--orchid-soft)" : "0 0 0 3px color-mix(in srgb, var(--success) 14%, transparent)",
            }} />
            {loading ? "Finding resources" : "Conversation-aware discovery"}
          </span>
          <span style={{
            color: "var(--muted)", fontSize: 9, whiteSpace: "nowrap",
          }}>
            {category === "all" ? "All categories" : recommendationCategories.find((entry) => entry.value === category)?.label}
          </span>
        </div>

        <div style={{
          display: "flex", flex: "0 0 auto", gap: 6,
          overflowX: "auto", overflowY: "hidden",
          whiteSpace: "nowrap", minHeight: 39,
          padding: "1px 0 8px", marginBottom: 8,
          scrollbarWidth: "thin",
        }}>
          {recommendationCategories.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              style={{
                flexShrink: 0,
                border: `1px solid ${category === item.value ? "var(--orchid)" : "var(--border)"}`,
                borderRadius: 999, padding: "7px 11px",
                color: category === item.value ? "var(--accent-text)" : "var(--muted)",
                background: category === item.value ? "var(--surface-accent)" : "var(--panel-2)",
                fontSize: 10, fontWeight: category === item.value ? 700 : 560,
                cursor: "pointer", transition: "all .16s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" style={{
            padding: 9, marginBottom: 9,
            border: "1px solid rgba(248,113,113,.35)",
            borderRadius: 9, color: "var(--danger-text)",
            fontSize: 10, lineHeight: 1.6,
          }}>
            {error}
          </div>
        )}

        <div style={{
          flex: "1 1 0%", minHeight: 0, overflowY: "auto",
          overscrollBehavior: "contain",
          display: "grid", alignContent: "start", gap: 9, paddingRight: 4,
        }}>
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, minHeight: 130, color: "var(--muted)", fontSize: 11,
            }}>
              <LoaderCircle size={16} className="animate-spin" />
              Finding relevant resources...
            </div>
          ) : items.length === 0 ? (
            <div style={{
              display: "grid", justifyItems: "center", textAlign: "center",
              padding: expanded ? "9vh 20px" : "28px 10px",
            }}>
              <div style={{
                display: "grid", placeItems: "center", width: 42, height: 42,
                borderRadius: 13, color: "var(--accent-text)",
                background: "var(--surface-accent)", marginBottom: 11,
              }}>
                <BookOpen size={19} />
              </div>
              <strong style={{ fontSize: 12 }}>
                {error ? "Recommendations unavailable" : "Ask a question to get resources"}
              </strong>
              <p style={{
                ...mutedStyle, maxWidth: 280, margin: "7px 0 0",
                lineHeight: 1.7, fontSize: 10,
              }}>
                {error
                  ? "Check that the Nexora backend is running, then try searching again."
                  : "After you send a message, Nexora searches for related papers, websites, GitHub projects, AI tools, datasets, and courses."}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} style={{
                padding: 14, border: "1px solid var(--border)",
                borderRadius: 13, background: "var(--panel-2)", minWidth: 0,
                boxShadow: "0 3px 12px rgba(31, 45, 75, .035)",
                transition: "transform .16s ease, border-color .16s ease, box-shadow .16s ease",
              }}>
                <div style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: 8,
                }}>
                  <span style={{
                    color: "var(--accent-text)", fontSize: 9, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: ".04em",
                  }}>
                    {recommendationCategories.find((entry) => entry.value === item.category)?.label ?? item.category}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: 9 }}>
                    {item.source_name || "External source"}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "flex-start", gap: 5,
                    marginTop: 8, color: "var(--link, #2563eb)", fontSize: 13,
                    lineHeight: 1.5, fontWeight: 700,
                    textDecoration: "underline",
                    textDecorationColor: "color-mix(in srgb, var(--link, #2563eb) 55%, transparent)",
                    textUnderlineOffset: 3, textDecorationThickness: "1px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.title}
                  <ExternalLink size={11} style={{
                    flexShrink: 0, marginTop: 2, color: "var(--mint)",
                  }} />
                </a>
                {item.description && (
                  <p style={{
                    margin: "7px 0 0", color: "var(--muted)", fontSize: 11,
                    lineHeight: 1.65, overflowWrap: "anywhere",
                  }}>
                    {item.description}
                  </p>
                )}
                {(item.authors?.length || item.published_at || item.doi) && (
                  <p style={{
                    margin: "7px 0 0", color: "var(--muted)",
                    fontSize: 9, lineHeight: 1.55, overflowWrap: "anywhere",
                  }}>
                    {item.authors?.length ? item.authors.join(", ") : ""}
                    {item.published_at ? ` · ${item.published_at}` : ""}
                    {item.doi ? ` · DOI: ${item.doi}` : ""}
                  </p>
                )}
              </article>
            ))
          )}
        </div>

        <div style={{
          paddingTop: 12, marginTop: 11, borderTop: "1px solid var(--border)",
          color: "var(--muted)", fontSize: 10, lineHeight: 1.6,
          flex: "0 0 auto",
        }}>
          {items.length} live result{items.length === 1 ? "" : "s"}
          {searchedTopic ? ` for “${searchedTopic}”` : ""}
          {" · "}Temporary results — not saved to your account
        </div>
      </aside>
    </>
  );
}



export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeNav, setActiveNav] = useState("AI Workspace");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    [],
  );
  const [historyError, setHistoryError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const isSendingRef = useRef(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("nexora-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("nexora-theme", theme);
  }, [theme]);

  const loadConversations = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError("");

    try {
      const result = await getConversations();
      setConversations(result);
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Could not load conversation history.",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  function startNewChat() {
    setMessages([]);
    setInput("");
    setConversationId(null);
    setActiveNav("AI Workspace");
    setSidebarOpen(false);
    setActionError("");
  }

  function navigateTo(label: string) {
    setActiveNav(label);
    setSidebarOpen(false);
  }

  async function openConversation(id: string) {
    if (isSendingRef.current || isLoadingMessages) return;

    setIsLoadingMessages(true);
    setActionError("");
    setActiveNav("AI Workspace");
    setSidebarOpen(false);

    try {
      const result = await getConversationMessages(id);

      setConversationId(result.conversation_id);
      const savedMessages = result.messages as Array<
        (typeof result.messages)[number] & { sources?: SourceCitation[] }
      >;
      setMessages(
        savedMessages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          sources: message.sources ?? [],
        })),
      );
      setInput("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not open this conversation.",
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function handleDeleteConversation(
    event: MouseEvent<HTMLButtonElement>,
    conversation: ConversationSummary,
  ) {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${getConversationTitle(conversation)}"? This permanently deletes its saved messages.`,
    );

    if (!confirmed) return;

    setDeletingId(conversation.id);
    setActionError("");

    try {
      await deleteConversation(conversation.id);

      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id),
      );

      if (conversationId === conversation.id) {
        setMessages([]);
        setConversationId(null);
        setInput("");
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not delete this conversation.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function sendMessage(text = input) {
    const content = text.trim();

    if (!content || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsSending(true);
    setActionError("");
    setActiveNav("AI Workspace");
    setInput("");

    const temporaryId = Date.now();

    setMessages((current) => [
      ...current,
      { id: temporaryId, role: "user", content },
    ]);

    try {
      const response = await sendChatMessage({
        message: content,
        ...(conversationId ? { conversation_id: conversationId } : {}),
      });

      setConversationId(response.conversation_id);

      const responseWithSources = response as typeof response & {
        sources?: SourceCitation[];
      };
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          role: "assistant",
          content: response.reply,
          sources: responseWithSources.sources ?? [],
        },
      ]);

      // Reload the sidebar so newly created and recently updated chats appear.
      try {
        const result = await getConversations();
        setConversations(result);
        setHistoryError("");
      } catch (error) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Could not refresh conversation history.",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while contacting the backend.";

      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          role: "assistant",
          content: `I couldn't complete your request. ${errorMessage} Check that the backend is running at ${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}.`,
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  function renderPage() {
    switch (activeNav) {
      case "Voice Mode":
        return <VoiceMode />;

      case "Knowledge Base":
        return <KnowledgeBase />;

      case "AI Agents":
        return <AIAgentsDashboard />;

      case "Analytics":
        return <AnalyticsDashboard />;

      case "Research Intelligence":
        return (
          <ResearchIntelligenceDashboard
            onAskInChat={(prompt) => {
              setActiveNav("AI Workspace");
              void sendMessage(prompt);
            }}
          />
        );

      case "Settings":
        return (
          <section
            style={{
              width: "100%",
              maxWidth: 850,
              margin: "0 auto",
              padding: "clamp(24px, 4vw, 44px)",
            }}
          >
            <div className="eyebrow">
              <Settings size={16} />
              PERSONAL SETTINGS
            </div>
            <h1 className="feature-title" style={{ marginTop: 14 }}>
              Account settings
            </h1>
            <p className="feature-description">
              Manage your Nexora AI session and account access.
            </p>

            <div
              style={{
                ...panelStyle,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 20,
                marginTop: 24,
              }}
            >
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  color: "var(--accent-text)",
                  background: "var(--surface-accent)",
                }}
              >
                <Settings size={21} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 14 }}>Sign out of Nexora AI</strong>
                <p
                  style={{
                    ...mutedStyle,
                    lineHeight: 1.7,
                    margin: "6px 0 0",
                  }}
                >
                  Your saved conversations remain in the database. You can log
                  back in with the same account to access them again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    "Are you sure you want to log out of Nexora AI?",
                  );

                  if (!confirmed) return;

                  logout();
                  window.location.reload();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  flexShrink: 0,
                  padding: "10px 14px",
                  border: "1px solid rgba(255, 120, 140, 0.35)",
                  borderRadius: 10,
                  color: "var(--danger-text)",
                  background: "rgba(255, 120, 140, 0.08)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </section>
        );

      default:
        return (
          <div
            className="workspace-chat-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(290px, 340px)",
              gap: 16,
              alignItems: "start",
              width: "100%",
              minWidth: 0,
              padding: "0 clamp(12px, 2vw, 22px) 22px",
            }}
          >
          <div className="content" style={{ minWidth: 0, width: "100%" }}>
            {actionError && (
              <div
                role="alert"
                style={{
                  ...panelStyle,
                  padding: 12,
                  marginBottom: 16,
                  color: "var(--danger-text)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {actionError}
              </div>
            )}

            {isLoadingMessages ? (
              <div
                style={{
                  minHeight: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: "var(--muted)",
                }}
              >
                <LoaderCircle size={20} className="animate-spin" />
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <section className="welcome">
                <div className="hero-layout">
                  <div className="hero-copy">
                    <div className="eyebrow">
                      <Sparkles size={16} />
                      A new kind of AI workspace
                    </div>

                    <h1 className="hero-title">
                      Think beyond.
                      <br />
                      <span className="gradient-text">
                        Build with intelligence.
                      </span>
                    </h1>

                    <p className="hero-description">
                      Explore ideas, work with knowledge, build AI agents, and
                      design intelligent workflows in one thoughtfully designed
                      workspace.
                    </p>

                    <div className="hero-actions">
                      <button
                        type="button"
                        className="hero-primary"
                        onClick={() => document.getElementById("nexora-composer")?.focus()}
                      >
                        <MessageSquare size={16} />
                        Get started
                        <ArrowUp size={16} className="hero-arrow" />
                      </button>
                      <button
                        type="button"
                        className="hero-secondary"
                        onClick={() => navigateTo("Knowledge Base")}
                      >
                        <BookOpen size={16} />
                        View knowledge base
                      </button>
                    </div>
                  </div>

                  <div className="hero-visual" aria-hidden="true">
                    <div className="robot-orbit robot-orbit-one" />
                    <div className="robot-orbit robot-orbit-two" />
                    <div className="robot-glow" />
                    <Image
                      src="/robot-mascot.png"
                      alt=""
                      fill
                      priority
                      sizes="(max-width: 760px) 70vw, 42vw"
                      className="robot-image"
                    />
                    <div className="robot-float-icon robot-icon-document"><FileText size={21} /></div>
                    <div className="robot-float-icon robot-icon-workflow"><Workflow size={21} /></div>
                    <div className="robot-float-icon robot-icon-data"><Activity size={21} /></div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="conversation" aria-live="polite">

                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`message ${message.role}`}
                  >
                    <span className="message-role">
                      {message.role === "user" ? "You" : "Nexora AI"}
                    </span>
                    {message.role === "assistant" ? (
                      <MarkdownContent content={message.content} />
                    ) : (
                      <div className="user-message-content">{message.content}</div>
                    )}
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: 13,
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          background: "var(--surface-card)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            marginBottom: 10,
                            color: "var(--mint)",
                            fontSize: 12,
                            fontWeight: 650,
                          }}
                        >
                          <BookOpen size={15} />
                          Sources ({message.sources.length})
                        </div>
                        <div style={{ display: "grid", gap: 9 }}>
                          {message.sources.map((source, sourceIndex) => (
                            <div
                              key={`${source.filename}-${source.chunk_index}-${sourceIndex}`}
                              style={{
                                paddingTop: sourceIndex === 0 ? 0 : 9,
                                borderTop: sourceIndex === 0 ? 0 : "1px solid var(--border)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                                <FileText size={14} color="var(--mint)" />
                                <strong style={{ fontSize: 12, overflowWrap: "anywhere" }}>
                                  {source.filename}
                                </strong>
                                <span style={{ ...mutedStyle, marginLeft: "auto", flexShrink: 0 }}>
                                  Chunk {source.chunk_index + 1}
                                </span>
                              </div>
                              <p style={{ margin: 0, color: "var(--muted)", fontSize: 11, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                                {source.excerpt}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}

                {isSending && (
                  <article className="message assistant" aria-live="polite">
                    <span className="message-role">Nexora AI</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <LoaderCircle size={15} className="animate-spin" />
                      Thinking...
                    </span>
                  </article>
                )}
              </section>
            )}

            {!isLoadingMessages && messages.length === 0 && (
              <section
                className="suggestion-grid"
                aria-label="Suggested prompts"
              >
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    className="suggestion"
                    onClick={() => setInput(suggestion.prompt)}
                  >
                    <span className="suggestion-icon">{suggestion.icon}</span>
                    <span>
                      <span
                        className="suggestion-title"
                        style={{ display: "block" }}
                      >
                        {suggestion.title}
                      </span>
                      <span className="suggestion-description">
                        {suggestion.description}
                      </span>
                    </span>
                  </button>
                ))}
              </section>
            )}

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <textarea
                id="nexora-composer"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask a question, explore an idea, or describe a task..."
                aria-label="Message Nexora AI"
                rows={2}
                disabled={isLoadingMessages}
              />

              <div className="composer-footer">
                <div className="composer-tools">
                  <button
                    type="button"
                    className="tool-button composer-tool-button"
                    onClick={() => navigateTo("Knowledge Base")}
                    title="Open Knowledge Base to upload and manage documents"
                  >
                    <Paperclip size={14} />
                    Upload
                  </button>
                  <button
                    type="button"
                    className="tool-button composer-tool-button"
                    onClick={() => navigateTo("Knowledge Base")}
                  >
                    <BookOpen size={14} />
                    Knowledge Base
                  </button>
                  <button
                    type="button"
                    className="tool-button composer-tool-button"
                    onClick={() => navigateTo("AI Agents")}
                  >
                    <Sparkles size={14} />
                    AI Agents
                  </button>
                  <button
                    type="button"
                    className="tool-button composer-tool-button voice-mode-launcher"
                    onClick={() => navigateTo("Voice Mode")}
                    title="Open the dedicated Nexora AI Voice Mode"
                    aria-label="Open Voice Mode"
                  >
                    <Mic size={14} />
                    Voice Mode
                  </button>
                </div>

                <div className="composer-actions">
                  <span className="workspace-caption">Enter to send</span>
                  <button
                    type="submit"
                    className="send-button"
                    aria-label="Send message"
                    disabled={
                      !input.trim() || isSending || isLoadingMessages
                    }
                  >
                    <Send size={17} />
                  </button>
                </div>
              </div>
            </form>

            {messages.length === 0 && (
              <section className="quick-actions" aria-label="Quick actions">
                <div className="quick-actions-heading">
                  <Sparkles size={15} />
                  Quick actions
                </div>
                <div className="quick-actions-row">
                  <button type="button" onClick={() => navigateTo("Knowledge Base")} className="quick-action quick-action-mint">
                    <FileText size={15} /> Summarize a document
                  </button>
                  <button type="button" onClick={() => setInput("Help me write and review a code solution.")} className="quick-action quick-action-purple">
                    <Code2 size={15} /> Write code
                  </button>
                  <button type="button" onClick={() => navigateTo("Analytics")} className="quick-action quick-action-blue">
                    <Activity size={15} /> Analyze data
                  </button>
                  <button type="button" onClick={() => navigateTo("AI Agents")} className="quick-action quick-action-violet">
                    <Workflow size={15} /> Create an AI agent
                  </button>
                  <button type="button" onClick={() => setInput("Help me design an AI workflow for this task: ")} className="quick-action quick-action-teal">
                    <Database size={15} /> Build a workflow
                  </button>
                </div>
              </section>
            )}

            <p className="disclaimer">
              Connected to the Nexora AI backend. Saved conversations are
              stored in your configured database.
            </p>
          </div>
          <RecommendationSidebar
            latestUserPrompt={
              [...messages].reverse().find((message) => message.role === "user")?.content ?? ""
            }
          />
          <style jsx>{`

                  .markdown-content { overflow-wrap: anywhere; line-height: 1.75; font-size: 13px; }
                  .markdown-paragraph { margin: 0 0 11px; }
                  .markdown-paragraph:last-child { margin-bottom: 0; }
                  .markdown-content strong { color: var(--foreground, #f8fafc); font-weight: 700; }
                  .markdown-content h2, .markdown-content h3, .markdown-content h4 { color: var(--foreground, #f8fafc); }
                  .markdown-list { margin: 7px 0 13px; padding-left: 22px; }
                  .markdown-list li { padding-left: 3px; margin: 4px 0; }
                  .markdown-quote { margin: 10px 0; padding: 8px 12px; border-left: 3px solid var(--mint, #5eead4); color: var(--muted, #aab2cc); background: rgba(94, 234, 212, 0.05); border-radius: 0 8px 8px 0; }
                  .markdown-inline-code { padding: 2px 5px; border-radius: 5px; background: rgba(148, 163, 184, 0.16); font-size: 0.92em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
                  .markdown-code-block { position: relative; margin: 10px 0 14px; padding: 14px; overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; background: rgba(5, 8, 20, 0.7); font-size: 12px; line-height: 1.65; }
                  .markdown-code-block code { white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
                  .markdown-code-language { display: block; margin-bottom: 8px; color: var(--mint, #5eead4); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
                  .markdown-link { color: var(--mint, #5eead4); text-decoration: underline; text-underline-offset: 3px; }
                  .user-message-content { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.65; }
                

            @media (max-width: 1080px) {
              .workspace-chat-layout {
                grid-template-columns: minmax(0, 1fr) !important;
              }
            }
          .composer-tools .voice-mode-launcher {
            border-color: rgba(124, 92, 231, .28);
            background: linear-gradient(135deg, rgba(124, 92, 231, .12), rgba(98, 230, 199, .10));
            color: var(--orchid, #6d5ce7);
            font-weight: 700;
            box-shadow: inset 0 0 0 1px rgba(124, 92, 231, .04);
          }
          .composer-tools .voice-mode-launcher:hover {
            border-color: rgba(124, 92, 231, .5);
            background: linear-gradient(135deg, rgba(124, 92, 231, .19), rgba(98, 230, 199, .15));
            transform: translateY(-1px);
          }
          `}
</style>
          </div>
        );
    }
  }

  function renderConversationHistory() {
    return (
      <div style={{ marginTop: 25 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 9px",
            marginBottom: 10,
          }}
        >
          <div className="sidebar-label" style={{ margin: 0 }}>
            Recent conversations
          </div>

          <button
            type="button"
            onClick={() => void loadConversations()}
            disabled={isLoadingHistory}
            aria-label="Refresh conversation history"
            title="Refresh history"
            style={{
              display: "grid",
              placeItems: "center",
              width: 28,
              height: 28,
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--muted)",
              background: "transparent",
              cursor: isLoadingHistory ? "wait" : "pointer",
            }}
          >
            <RefreshCw
              size={13}
              className={isLoadingHistory ? "animate-spin" : ""}
            />
          </button>
        </div>

        {isLoadingHistory && conversations.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px",
              color: "var(--muted)",
              fontSize: 11,
            }}
          >
            <LoaderCircle size={14} className="animate-spin" />
            Loading chats...
          </div>
        ) : historyError && conversations.length === 0 ? (
          <div style={{ padding: "8px 9px" }}>
            <p
              style={{
                color: "var(--danger-text)",
                fontSize: 11,
                lineHeight: 1.6,
                margin: "0 0 9px",
              }}
            >
              {historyError}
            </p>
            <button
              type="button"
              onClick={() => void loadConversations()}
              style={{
                border: 0,
                background: "transparent",
                color: "var(--mint)",
                fontSize: 11,
                padding: 0,
              }}
            >
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              padding: "9px",
              color: "var(--muted)",
              fontSize: 11,
              lineHeight: 1.7,
            }}
          >
            No saved chats yet. Start a conversation to see it here.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxHeight: 280,
              overflowY: "auto",
              paddingRight: 2,
            }}
          >
            {conversations.map((conversation) => {
              const selected = conversationId === conversation.id;
              const deleting = deletingId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    borderRadius: 10,
                    background: selected
                      ? "rgba(119, 117, 248, 0.13)"
                      : "transparent",
                    border: selected
                      ? "1px solid rgba(119, 117, 248, 0.25)"
                      : "1px solid transparent",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                    disabled={isSending || isLoadingMessages || deleting}
                    title={getConversationTitle(conversation)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 9,
                      flex: 1,
                      minWidth: 0,
                      padding: "10px 8px",
                      textAlign: "left",
                      border: 0,
                      borderRadius: 9,
                      color: selected ? "var(--foreground)" : "var(--muted)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <MessageSquare
                      size={15}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />

                    <span style={{ display: "block", flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          fontWeight: selected ? 650 : 500,
                        }}
                      >
                        {getConversationTitle(conversation)}
                      </span>

                      <span
                        style={{
                          display: "block",
                          marginTop: 5,
                          color: "var(--muted)",
                          fontSize: 9,
                        }}
                      >
                        {conversation.message_count} messages
                        {conversation.updated_at
                          ? ` · ${formatConversationDate(conversation.updated_at)}`
                          : ""}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(event) =>
                      void handleDeleteConversation(event, conversation)
                    }
                    disabled={deleting || isSending}
                    title="Delete conversation"
                    aria-label={`Delete ${getConversationTitle(conversation)}`}
                    style={{
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      width: 30,
                      height: 30,
                      marginRight: 4,
                      border: 0,
                      borderRadius: 7,
                      color: deleting ? "var(--mint)" : "#9299b5",
                      background: "transparent",
                      cursor: deleting ? "wait" : "pointer",
                    }}
                  >
                    {deleting ? (
                      <LoaderCircle size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {historyError && conversations.length > 0 && (
          <p
            role="status"
            style={{
              padding: "5px 9px",
              color: "var(--danger-text)",
              fontSize: 10,
              lineHeight: 1.6,
            }}
          >
            Refresh warning: {historyError}
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            ✳
          </div>
          <div>
            <div className="brand-name">Nexora AI</div>
            <div className="brand-caption">Intelligence. Connected.</div>
          </div>
        </div>

        <button
          type="button"
          className="new-chat"
          onClick={startNewChat}
          disabled={isSending}
        >
          <Plus size={17} />
          New conversation
        </button>

        <div className="sidebar-label">Workspace</div>

        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`nav-item ${activeNav === item.label ? "active" : ""}`}
              aria-current={activeNav === item.label ? "page" : undefined}
              onClick={() => navigateTo(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {renderConversationHistory()}

        <div className="sidebar-label" style={{ marginTop: 24 }}>
          Personal
        </div>

        <button
          type="button"
          className={`nav-item ${activeNav === "Settings" ? "active" : ""}`}
          aria-current={activeNav === "Settings" ? "page" : undefined}
          onClick={() => navigateTo("Settings")}
        >
          <span className="nav-icon">
            <Settings size={18} />
          </span>
          Settings
        </button>

        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-title">Your AI workspace</div>
            <p className="plan-description">
              Your personal environment for intelligent conversations and
              knowledge workflows.
            </p>
            <span className="plan-link">Preview environment</span>
          </div>

          <div className="profile">
            <div className="avatar">NA</div>
            <div>
              <div className="profile-name">Nexora User</div>
              <div className="profile-caption">Local preview</div>
            </div>
          </div>
        </div>
      </aside>

      <section className="main-area">
        {/* Keep workspace content anchored below the fixed-height header.
            Upload status/preview changes must not vertically recenter the page. */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button mobile-menu"
              aria-label={sidebarOpen ? "Hide navigation" : "Show navigation"}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? <X size={19} /> : <span>☰</span>}
            </button>

            <div>
              <div className="workspace-title">{activeNav}</div>
              <div className="workspace-caption">
                Your intelligent workspace
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="status">
              <span className="status-dot" />
              Backend API
            </div>

            <div className="theme-switch" role="group" aria-label="Color theme">
              <button
                type="button"
                className={`theme-option ${theme === "light" ? "selected" : ""}`}
                onClick={() => setTheme("light")}
                aria-label="Switch to light mode"
                aria-pressed={theme === "light"}
                title="Light mode"
              >
                <Sun size={15} />
              </button>
              <button
                type="button"
                className={`theme-option ${theme === "dark" ? "selected" : ""}`}
                onClick={() => setTheme("dark")}
                aria-label="Switch to dark mode"
                aria-pressed={theme === "dark"}
                title="Dark mode"
              >
                <Moon size={15} />
              </button>
            </div>

            <button
              type="button"
              className="icon-button"
              aria-label="Start a new conversation"
              onClick={startNewChat}
              disabled={isSending}
            >
              <Plus size={19} />
            </button>
          </div>
        </header>

        {sidebarOpen && (
          <nav className="mobile-navigation" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <button
                type="button"
                key={item.label}
                className={`nav-item ${activeNav === item.label ? "active" : ""}`}
                onClick={() => navigateTo(item.label)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}

            <div style={{ padding: "0 12px" }}>
              {renderConversationHistory()}
            </div>

            <button
              type="button"
              className={`nav-item ${activeNav === "Settings" ? "active" : ""}`}
              onClick={() => navigateTo("Settings")}
            >
              <span className="nav-icon">
                <Settings size={18} />
              </span>
              Settings
            </button>
          </nav>
        )}

        {renderPage()}
      </section>
    </main>
  );
}
