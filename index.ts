/**
 * Pi Insights Extension
 * Generates beautiful analytics reports for pi sessions
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { parseSessionFile } from "./lib/parser.js";
import { computeAnalytics } from "./lib/analytics.js";
import type { Analytics } from "./lib/types.js";

const execAsync = promisify(exec);
const extensionDir = path.dirname(fileURLToPath(import.meta.url));

// ── Report Generator ──────────────────────────────────────────────────

async function ensureBuilt(extensionDir: string): Promise<void> {
  const distDir = path.join(extensionDir, "dist");
  const indexHtml = path.join(distDir, "index.html");

  try {
    await fs.access(indexHtml);
    return;
  } catch {
    // Need to build
  }

  const nodeModules = path.join(extensionDir, "node_modules");
  try {
    await fs.access(nodeModules);
  } catch {
    await execAsync("npm install", { cwd: extensionDir });
  }

  await execAsync("npm run build", { cwd: extensionDir });
}

async function generateReport(
  extensionDir: string,
  analytics: Analytics,
  reportDir: string
): Promise<string> {
  const distDir = path.join(extensionDir, "dist");
  const reportPath = path.join(reportDir, "pi-insights.html");

  const indexPath = path.join(distDir, "index.html");
  let html = await fs.readFile(indexPath, "utf8");

  // Inline the favicon as a data URI so it works from file://
  const faviconPath = path.join(distDir, "favicon.svg");
  try {
    const faviconSvg = await fs.readFile(faviconPath, "utf8");
    const faviconDataUri = "data:image/svg+xml;base64," + Buffer.from(faviconSvg).toString("base64");
    html = html.replace(/href="\.\/favicon\.svg"/, `href="${faviconDataUri}"`);
  } catch { /* no favicon, skip */ }

  // Inline the JS bundle so the file works from file:// without CORS issues
  const jsMatch = html.match(/<script[^>]*src="\.\/assets\/([^"]*)\.js"[^>]*><\/script>/);
  if (jsMatch) {
    const jsFile = path.join(distDir, "assets", jsMatch[1] + ".js");
    try {
      const js = await fs.readFile(jsFile, "utf8");
      // Escape </ so the HTML parser doesn't exit the script block early
      const safeJs = js.replace(/<\//g, "<\\/");
      html = html.replace(jsMatch[0], "");
      html = html.replace(
        "<div id=\"root\"></div>",
        () => `<div id="root"></div>\n  <script>\n${safeJs}\n  </script>`
      );
    } catch { /* keep original if not found */ }
  }

  // Escape </ in the JSON data for the same reason
  const safeData = JSON.stringify(analytics).replace(/<\//g, "<\\/");
  html = html.replace("<head>", () => `<head>\n  <script>window.__ANALYTICS_DATA__ = ${safeData};</script>`);

  await fs.writeFile(reportPath, html, "utf8");
  return reportPath;
}

// ── Main Extension ────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.registerCommand("insights", {
    description: "Generate insights report for pi sessions",
    getArgumentCompletions: () => null,
    handler: async (_args, ctx) => {
      const reportDir = path.join(os.homedir(), ".pi", "agent", "insights-reports");
      await fs.mkdir(reportDir, { recursive: true });

      ctx.ui.notify("📊 Building UI (first run may take a minute)...", "info");

      try {
        await ensureBuilt(extensionDir);
      } catch (err) {
        ctx.ui.notify("❌ Build failed: " + (err as Error).message, "error");
        return;
      }

      ctx.ui.notify("📁 Scanning sessions...", "info");

      const sessionsDir = path.join(os.homedir(), ".pi", "agent", "sessions");
      const sessionFiles: string[] = [];

      try {
        const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const subEntries = await fs.readdir(path.join(sessionsDir, entry.name));
            for (const sub of subEntries) {
              if (sub.endsWith(".jsonl")) {
                sessionFiles.push(path.join(sessionsDir, entry.name, sub));
              }
            }
          }
        }
      } catch {
        ctx.ui.notify("❌ Could not find sessions directory", "error");
        return;
      }

      ctx.ui.notify(`📁 Found ${sessionFiles.length} session files`, "info");

      const sessions = [];
      let parsed = 0;
      for (const file of sessionFiles) {
        const sess = await parseSessionFile(file);
        if (sess) sessions.push(sess);
        parsed++;
        if (parsed % 50 === 0) {
          ctx.ui.setStatus("insights", `Parsed ${parsed}/${sessionFiles.length}...`);
        }
      }

      if (sessions.length === 0) {
        ctx.ui.notify("❌ No valid sessions found", "error");
        return;
      }

      ctx.ui.notify(`✅ Parsed ${sessions.length} sessions, generating report...`, "info");

      const analytics = computeAnalytics(sessions);

      try {
        const reportPath = await generateReport(extensionDir, analytics, reportDir);
        ctx.ui.notify(`🎉 Report ready!`, "info");
        ctx.ui.setStatus("insights", undefined);
        try {
          await execAsync(`open "${reportPath}"`);
        } catch {
          ctx.ui.notify("Open manually: " + reportPath, "info");
        }
      } catch (err) {
        ctx.ui.notify("❌ Report generation failed: " + (err as Error).message, "error");
      }
    },
  });
}
