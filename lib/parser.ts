import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import type { ParsedSession, SessionEvent, SessionMessage } from "./types.js";
import { detectRage } from "./rage.js";

export async function parseSessionFile(filePath: string): Promise<ParsedSession | null> {
  try {
    const stream = createReadStream(filePath, { encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    let sessionId = "";
    let cwd = "";
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let userMessages = 0;
    let assistantMessages = 0;
    let toolCallCount = 0;
    let toolCallErrors = 0;
    let totalInput = 0;
    let totalOutput = 0;
    let totalCacheRead = 0;
    let totalCacheWrite = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let costInput = 0;
    let costOutput = 0;
    let costCacheRead = 0;
    let costCacheWrite = 0;
    const models: Record<string, { count: number; tokens: number; cost: number }> = {};
    const providers: Record<string, number> = {};
    const thinkingLevels: Record<string, number> = {};
    const toolUsage: Record<string, number> = {};
    const stopReasons: Record<string, number> = {};
    let currentModel = "unknown";
    const rageHits: ParsedSession["rageHits"] = [];

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as SessionEvent;

        if (!startTime && event.timestamp) startTime = new Date(event.timestamp);
        if (event.timestamp) endTime = new Date(event.timestamp);

        if (event.type === "session" || event.type === "session_info") {
          const data = event as unknown as { id?: string; cwd?: string };
          if (data.id) sessionId = data.id;
          if (data.cwd) cwd = data.cwd;
        }

        if (event.type === "model_change") {
          const data = event as unknown as { modelId?: string; provider?: string };
          if (data.modelId) {
            models[data.modelId] = models[data.modelId] ?? { count: 0, tokens: 0, cost: 0 };
            models[data.modelId].count++;
            currentModel = data.modelId;
          }
          if (data.provider) {
            providers[data.provider] = (providers[data.provider] ?? 0) + 1;
          }
        }

        if (event.type === "thinking_level_change") {
          const data = event as unknown as { thinkingLevel?: string };
          if (data.thinkingLevel) {
            thinkingLevels[data.thinkingLevel] = (thinkingLevels[data.thinkingLevel] ?? 0) + 1;
          }
        }

        if (event.type === "message") {
          const msg = (event as unknown as { message: SessionMessage }).message;

          if (msg.role === "user") {
            userMessages++;
            // Collect rage hits with the message index for accurate per-message dedup
            const textParts: string[] = [];
            if (msg.content) {
              for (const item of msg.content) {
                if (item.type === "text" && item.text) textParts.push(item.text);
              }
            }
            const text = textParts.join(" ");
            if (text) {
              const hour = event.timestamp ? new Date(event.timestamp).getHours() : -1;
              for (const hit of detectRage(text)) {
                rageHits.push({ ...hit, hour, model: currentModel, msgIndex: userMessages });
              }
            }
          } else if (msg.role === "assistant") {
            assistantMessages++;

            if (msg.usage) {
              const input = msg.usage.input ?? 0;
              const output = msg.usage.output ?? 0;
              const cacheRead = msg.usage.cacheRead ?? 0;
              const cacheWrite = msg.usage.cacheWrite ?? 0;
              const tokens = msg.usage.totalTokens ?? (input + output + cacheRead);
              const cost = msg.usage.cost?.total ?? 0;

              totalInput += input;
              totalOutput += output;
              totalCacheRead += cacheRead;
              totalCacheWrite += cacheWrite;
              totalTokens += tokens;
              totalCost += cost;
              costInput += msg.usage.cost?.input ?? 0;
              costOutput += msg.usage.cost?.output ?? 0;
              costCacheRead += msg.usage.cost?.cacheRead ?? 0;
              costCacheWrite += msg.usage.cost?.cacheWrite ?? 0;

              if (msg.model) {
                models[msg.model] = models[msg.model] ?? { count: 0, tokens: 0, cost: 0 };
                models[msg.model].tokens += tokens;
                models[msg.model].cost += cost;
              }
            }

            if (msg.stopReason) {
              stopReasons[msg.stopReason] = (stopReasons[msg.stopReason] ?? 0) + 1;
            }
          }

          if (msg.content) {
            for (const item of msg.content) {
              if (item.type === "toolCall" && item.name) {
                toolCallCount++;
                toolUsage[item.name] = (toolUsage[item.name] ?? 0) + 1;
              }
              if (item.type === "toolResult" && item.isError) {
                toolCallErrors++;
              }
            }
          }

          if (msg.toolCalls) {
            toolCallCount += msg.toolCalls.length;
            for (const tc of msg.toolCalls) {
              if (tc.name) toolUsage[tc.name] = (toolUsage[tc.name] ?? 0) + 1;
            }
          }

          if (msg.toolResults) {
            for (const tr of msg.toolResults) {
              if (tr.isError) toolCallErrors++;
            }
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    if (!startTime) return null;
    if (!endTime) endTime = startTime;

    const duration = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
    const projectName = cwd ? path.basename(cwd) : "unknown";

    return {
      id: sessionId || path.basename(filePath, ".jsonl"),
      cwd,
      projectName,
      startTime,
      endTime,
      duration,
      messageCount: userMessages + assistantMessages,
      userMessageCount: userMessages,
      assistantMessageCount: assistantMessages,
      toolCallCount,
      tokenUsage: { input: totalInput, output: totalOutput, cacheRead: totalCacheRead, cacheWrite: totalCacheWrite, total: totalTokens },
      cost: { input: costInput, output: costOutput, cacheRead: costCacheRead, cacheWrite: costCacheWrite, total: totalCost },
      models,
      providers,
      thinkingLevels,
      toolUsage,
      stopReasons,
      toolCallErrors,
      hasError: toolCallErrors > 0,
      rageHits,
    };
  } catch {
    return null;
  }
}
