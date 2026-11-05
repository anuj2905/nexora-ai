
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const TOKEN_KEY = "nexora_access_token";

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "user" | string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// The register endpoint returns the same payload as login and creates
// an authenticated session immediately (email verification is disabled).
export type RegisterResponse = AuthResponse;

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface CreateManagedUserRequest {
  email: string;
  password: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  reply: string;
  conversation_id: string;
  sources?: SourceCitation[];
}

export interface SourceCitation {
  filename: string;
  chunk_index: number;
  excerpt: string;
  score: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationMessage {
  id: number;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: SourceCitation[];
}

export interface ConversationMessagesResponse {
  conversation_id: string;
  title: string;
  messages: ConversationMessage[];
}

export interface KnowledgeDocument {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

// --------------------------------------------------
// API Error
// --------------------------------------------------

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfter: number | null;

  constructor(
    message: string,
    status: number,
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

// --------------------------------------------------
// Access Token
// --------------------------------------------------

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

// --------------------------------------------------
// Base API Request
// --------------------------------------------------

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options?.headers);

  if (
    options?.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status}).`;
    let retryAfter: number | null = null;

    const retryHeader = response.headers.get("Retry-After");

    if (retryHeader) {
      const parsed = Number.parseInt(retryHeader, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        retryAfter = parsed;
      }
    }

    try {
      const body = (await response.json()) as {
        detail?: string | Array<{ msg?: string }>;
        error?: string;
        message?: string;
        retry_after?: number;
      };

      if (response.status === 429) {
        detail =
          body.message ||
          body.error ||
          (typeof body.detail === "string" ? body.detail : detail);

        if (
          retryAfter === null &&
          typeof body.retry_after === "number"
        ) {
          retryAfter = Math.max(1, Math.ceil(body.retry_after));
        }
      } else if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail
          .map((item) => item.msg ?? "Invalid input")
          .join(", ");
      } else if (body.message) {
        detail = body.message;
      } else if (body.error) {
        detail = body.error;
      }
    } catch {
      // Keep the default error message.
    }

    throw new ApiError(detail, response.status, retryAfter);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// --------------------------------------------------
// Authentication
// --------------------------------------------------

export async function login(
  payload: LoginRequest,
): Promise<AuthResponse> {
  const response = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    }),
  });

  saveAccessToken(response.access_token);
  return response;
}

export async function register(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await request<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    }),
  });

  // Save the JWT exactly as the login flow does. Analytics, AI Agents,
  // conversations and document requests all read this same token.
  saveAccessToken(response.access_token);
  return response;
}

export function verifyEmail(
  token: string,
): Promise<VerifyEmailResponse> {
  return request<VerifyEmailResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerificationEmail(
  email: string,
): Promise<ResendVerificationResponse> {
  return request<ResendVerificationResponse>(
    "/api/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
    },
  );
}

export function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>("/api/auth/me");
}

export function logout(): void {
  clearAccessToken();
}

// --------------------------------------------------
// Admin User Management
// --------------------------------------------------

export function getManagedUsers(): Promise<ManagedUser[]> {
  return request<ManagedUser[]>("/api/admin/users");
}

export function createManagedUser(
  payload: CreateManagedUserRequest,
): Promise<ManagedUser> {
  return request<ManagedUser>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    }),
  });
}

export function deleteManagedUser(userId: string): Promise<void> {
  return request<void>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

// --------------------------------------------------
// AI Chat
// --------------------------------------------------

export function sendChatMessage(
  payload: ChatRequest,
): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --------------------------------------------------
// Conversation History
// --------------------------------------------------

export function getConversations(): Promise<ConversationSummary[]> {
  return request<ConversationSummary[]>("/api/conversations");
}

export function getConversationMessages(
  conversationId: string,
): Promise<ConversationMessagesResponse> {
  return request<ConversationMessagesResponse>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
}

export function deleteConversation(
  conversationId: string,
): Promise<void> {
  return request<void>(
    `/api/conversations/${encodeURIComponent(conversationId)}`,
    { method: "DELETE" },
  );
}


// --------------------------------------------------
// Research Intelligence / Live Recommendations
// --------------------------------------------------

export type RecommendationCategory =
  | "research_papers"
  | "useful_websites"
  | "github_repositories"
  | "ai_ml_tools"
  | "datasets"
  | "courses_documentation";

export interface ResearchRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  url: string;
  source_name?: string | null;
  authors?: string[] | null;
  published_at?: string | null;
  doi?: string | null;
  topic?: string | null;
  is_bookmarked?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface SearchResearchRecommendationsRequest {
  topic: string;
  categories: RecommendationCategory[];
}

export interface SearchResearchRecommendationsResponse {
  topic: string;
  recommendations: ResearchRecommendation[];
  total: number;
  persisted: false;
}

/**
 * Search public research and resource providers on demand.
 * Results are temporary and are not stored in the database.
 */
export function searchResearchRecommendations(
  payload: SearchResearchRecommendationsRequest,
): Promise<SearchResearchRecommendationsResponse> {
  return request<SearchResearchRecommendationsResponse>(
    "/api/recommendations/search",
    {
      method: "POST",
      body: JSON.stringify({
        topic: payload.topic.trim(),
        categories: payload.categories,
      }),
    },
  );
}

// --------------------------------------------------
// Knowledge Base
// --------------------------------------------------

export async function uploadDocument(
  file: File,
): Promise<KnowledgeDocument> {
  const token = getAccessToken();
  const formData = new FormData();

  formData.append("file", file);

  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Unable to upload the document. Please check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    let detail = `Upload failed (${response.status}).`;

    try {
      const body = (await response.json()) as {
        detail?: string | Array<{ msg?: string }>;
        message?: string;
      };

      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail
          .map((item) => item.msg ?? "Invalid input")
          .join(", ");
      } else if (body.message) {
        detail = body.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as KnowledgeDocument;
}

export function getDocuments(): Promise<KnowledgeDocument[]> {
  return request<KnowledgeDocument[]>("/api/documents");
}

export function deleteDocument(
  documentId: string,
): Promise<void> {
  return request<void>(
    `/api/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}
