export interface SessionEvent {
  type: string;
  timestamp?: string;
  id?: string;
  parentId?: string;
  [key: string]: unknown;
}

export interface SessionMessage {
  role: "user" | "assistant" | "tool";
  content?: Array<{ type: string; text?: string }>;
  usage?: {
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
  };
  model?: string;
  provider?: string;
  api?: string;
  thinkingLevel?: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  stopReason?: string;
}

export interface ParsedSession {
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
  sessions: ParsedSession[];
  rageStats: RageStats;
}

export interface RageStats {
  total: number;
  messagesWithSwears: number;
  byModel: { name: string; count: number }[];
  byHour: { hour: number; count: number }[];
  byProject: { name: string; count: number }[];
  topWords: { word: string; group: string; count: number }[];
}
