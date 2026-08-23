// Shared Domain Types across ai-workflow-utils Monorepo

export interface ApiResponse<T = any> {
  success?: boolean;
  status?: string | number;
  data?: T;
  error?: string | null;
  message?: string;
  timestamp?: string;
}

// Jira Types
export interface JiraIssue {
  id?: string;
  key: string;
  summary: string;
  description?: string;
  status?: string;
  priority?: string;
  issueType?: string;
  assignee?: string;
  reporter?: string;
  created?: string;
  updated?: string;
  labels?: string[];
  components?: string[];
  customFields?: Record<string, any>;
  [key: string]: any;
}

export interface JiraCreateIssuePayload {
  projectKey: string;
  issueType: string;
  summary: string;
  description?: string;
  priority?: string;
  labels?: string[];
  components?: string[];
  customFields?: Record<string, any>;
}

// PR Types
export interface PullRequestPayload {
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  repository?: string;
  reviewers?: string[];
  jiraId?: string;
  diffSummary?: string;
  [key: string]: any;
}

// Chat Types
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string | number;
  sender?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  status?: 'sending' | 'sent' | 'error';
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  model?: string;
  provider?: string;
}

// Voice Types
export interface VoiceSessionConfig {
  sessionId: string;
  sampleRate?: number;
  voiceName?: string;
  instructions?: string;
  modalities?: ('AUDIO' | 'TEXT')[];
}

export interface VoiceEventData {
  sessionId: string;
  type: string;
  payload?: any;
  text?: string;
  audioData?: string;
  mimeType?: string;
  error?: string;
}

// Dashboard Models
export interface DashboardTile {
  id: string;
  title: string;
  type: 'notes' | 'todos' | 'reminders' | 'stats' | 'quick-actions' | 'custom';
  grid: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
  config?: Record<string, any>;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  description?: string;
  dueAt: string;
  triggered?: boolean;
  dismissed?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  read?: boolean;
  timestamp: string;
  source?: string;
}

// Environment & Config
export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  category?: string;
  isSecret?: boolean;
  description?: string;
}

export interface EnvironmentGroup {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  isActive?: boolean;
}

// Template Types
export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  template: string;
  variables: string[];
  systemPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

// MCP Types
export interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  autoApprove?: string[];
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, any>;
  serverName?: string;
}

// Build Types
export interface BuildScript {
  id: string;
  name: string;
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface BuildLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  scriptId?: string;
}
