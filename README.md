# pi-insights

Beautiful analytics reports for your [pi coding agent](https://pi.dev) sessions.

`pi-insights` is a Pi extension that adds an `/insights` command. It scans your local Pi session history and generates a self-contained HTML dashboard with usage, model, project, session, and “rage” analytics.

## Features

- **Overview** — Activity calendar, sessions/tokens/cost per day, activity by hour, and top tools
- **Models** — Token distribution, per-model breakdown, thinking levels, and stop reasons
- **Projects** — Per-project sessions, messages, tokens, and cost with sortable bars
- **Sessions** — Searchable/filterable session table by project name or date
- **Rage 🤬** — Profanity analytics: swear rate, filthiest model, peak hour, top words, and project breakdown
- **Portable report** — Single self-contained HTML file; no server required, works from `file://`

## Install

### From npm

```bash
pi install npm:@ygncode/pi-insights
```

### From GitHub

```bash
pi install git:github.com/ygncode/pi-insights
```

### Try without installing

```bash
pi -e npm:@ygncode/pi-insights
# or
pi -e git:github.com/ygncode/pi-insights
```

## Usage

Inside Pi, run:

```text
/insights
```

The report opens automatically and is written to:

```text
~/.pi/agent/insights-reports/pi-insights.html
```

Each run overwrites the same report file.

## What gets analyzed?

`pi-insights` reads local Pi session JSONL files from:

```text
~/.pi/agent/sessions/
```

No data is uploaded by this extension. The generated report is local HTML.

## Package metadata

This repo is a Pi package. `package.json` declares:

```json
{
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./index.ts"]
  }
}
```

That allows users to install it with `pi install` from npm, GitHub, or a local path.

## pi.dev package gallery

This package is prepared for the [Pi package gallery](https://pi.dev/packages):

- npm package name: `@ygncode/pi-insights`
- GitHub repo: `https://github.com/ygncode/pi-insights`
- Pi package keyword: `pi-package`
- Pi extension manifest: `pi.extensions = ["./index.ts"]`

After publishing to npm, submit or list the package on <https://pi.dev/packages> using the npm package URL/name.

## Development

```bash
npm install
npm run build        # build the React frontend into dist/
npm test             # run all tests
npm run test:watch   # watch mode
npm run test:coverage
```

`dist/` is intentionally included in the package so Pi can run the extension immediately after npm/git installation without requiring users to build the frontend.

## Architecture

```text
index.ts          — Extension entry point; registers the /insights command
lib/
  parser.ts       — Parses JSONL session files into ParsedSession objects
  analytics.ts    — Computes aggregate stats from parsed sessions
  rage.ts         — Profanity detection
  types.ts        — Shared TypeScript interfaces
src/
  App.tsx         — React frontend
  utils.ts        — Formatting helpers
  components/
    ContributionCalendar.tsx
tests/
  lib/            — Unit tests for parser, analytics, rage
  src/            — Unit tests for frontend utils
```

## Tech stack

- React 19 + TypeScript 6 + Vite 8
- Recharts 3
- Vitest 4

## License

MIT
