export interface SessionEvent {
  type: string;
  timestamp?: string;
  id?: string;
  parentId?: string;
  [key: string]: unknown;
}

export interface ContentItem {
  type: string;
  text?: string;
  name?: string;
  isError?: boolean;
}

export interface TokenUsage {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  totalTokens?: number;
  cost?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
    total?: number;
  };
}

export interface SessionMessage {
  role: "user" | "assistant" | "tool";
  content?: ContentItem[];
  usage?: TokenUsage;
  model?: string;
  provider?: string;
  api?: string;
  thinkingLevel?: string;
  toolCalls?: Array<{ name?: string }>;
  toolResults?: Array<{ isError?: boolean }>;
  stopReason?: string;
}

export interface RageHit {
  word: string;
  group: string;
  hour: number;
  model: string;
  msgIndex: number;
}

export interface ParsedSession {
  id: string;
  cwd: string;
  projectName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  toolCallCount: number;
  tokenUsage: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
  models: Record<string, { count: number; tokens: number; cost: number }>;
  providers: Record<string, number>;
  thinkingLevels: Record<string, number>;
  toolUsage: Record<string, number>;
  stopReasons: Record<string, number>;
  toolCallErrors: number;
  hasError: boolean;
  rageHits: RageHit[];
}

export interface DailyStats {
  date: string;
  sessions: number;
  messages: number;
  tokens: number;
  cost: number;
}

export interface ProjectStats {
  name: string;
  sessions: number;
  messages: number;
  tokens: number;
  cost: number;
  duration: number;
}

export interface ModelStats {
  name: string;
  count: number;
  tokens: number;
  cost: number;
  avgDuration: number;
}

export interface RageStats {
  total: number;
  messagesWithSwears: number;
  byModel: { name: string; count: number }[];
  byHour: { hour: number; count: number }[];
  byProject: { name: string; count: number }[];
  topWords: { word: string; group: string; count: number }[];
}

export interface Analytics {
  totalSessions: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  totalDuration: number;
  avgSessionDuration: number;
  avgMessagesPerSession: number;
  dateRange: { start: string; end: string };
  dailyStats: DailyStats[];
  projectStats: ProjectStats[];
  modelStats: ModelStats[];
  topTools: { name: string; count: number }[];
  thinkingLevelDistribution: { name: string; count: number }[];
  stopReasonDistribution: { name: string; count: number }[];
  hourlyDistribution: { hour: number; count: number }[];
  modelSwitchCount: number;
  rageStats: RageStats;
  sessions: Array<{
    id: string;
    cwd: string;
    projectName: string;
    startTime: string;
    endTime: string;
    duration: number;
    messageCount: number;
    userMessageCount: number;
    assistantMessageCount: number;
    toolCallCount: number;
    tokenUsage: ParsedSession["tokenUsage"];
    cost: ParsedSession["cost"];
    models: ParsedSession["models"];
    providers: ParsedSession["providers"];
    thinkingLevels: ParsedSession["thinkingLevels"];
    toolUsage: ParsedSession["toolUsage"];
    stopReasons: ParsedSession["stopReasons"];
    toolCallErrors: number;
    hasError: boolean;
  }>;
}
