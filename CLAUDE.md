# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhatsApp Group Analytics Dashboard — a React + D3 application that parses WhatsApp chat exports (.txt, .json, .csv) and displays interactive visualizations with cross-filtering, theme toggle, and PDF export. UI is in Portuguese (PT-PT).

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint (flat config, TS/React rules)
npm run preview      # Serve production build locally
```

There is no test suite. Validate changes with `npm run build` (runs `tsc -b` then Vite build) and `npm run lint`.

## Architecture

### Context Providers (src/context/)

The app uses three React contexts nested in `App.tsx` in this order (nesting matters — inner contexts can consume outer ones):
1. **ThemeProvider** → light/dark mode with localStorage persistence
2. **DataSourceProvider** → manages dataset loading (sample `public/cr.txt` or user-imported), parsing, progress, errors, and `datasetId` for cache invalidation
3. **FilterProvider** → global user selection with memoized callbacks (prevents infinite loops) and localStorage persistence

### Data Flow

1. **Import**: `DataSourceContext` accepts files via `importFile()`, detects format, stores raw data in localStorage (`whatsapp-analytics-data-source-v1`), and calls parsers
2. **Parse**: `src/utils/importParsers.ts` routes to format-specific parsers; TXT uses `parseWhatsAppChat()` from `parser.ts`
3. **Aggregate**: `useChartData` hook reads filter context and computes summary, userStats, heatmap, wordFrequencies via `useMemo`
4. **Render**: Dashboard passes aggregated data to D3-based chart components

### Filtering nuance in useChartData

`summary` and `userStats` are computed from **all** messages (unfiltered). `heatmap` and `wordFrequencies` use the filtered subset. `filteredUserStats` is derived by filtering the pre-computed `userStats` array (not by recomputing stats from filtered messages). This means summary stats always reflect the full dataset, while charts reflect the user selection.

### Dataset switch flow

When the dataset changes, `DataSourceContext` generates a new `datasetId` (timestamp-based). `Dashboard` watches `datasetId` and calls `clearFilters()` on change, so stale user selections don't persist across datasets.

### D3 chart pattern

All chart components (`TopContributors`, `ActivityHeatmap`, `WordCloud`, etc.) use the imperative D3 pattern: a `useRef` for the SVG container and a `useEffect` that calls D3 to render/update. The PDF export (`ExportPDF`) captures the `<main id="dashboard-content">` element via html2canvas + jspdf.

### Key Files

| Path | Purpose |
|------|---------|
| `src/utils/parser.ts` | WhatsApp TXT parser, user stats, heatmap, word cloud calculations; contains `PHONE_TO_NAME` and `USER_ALIASES` maps |
| `src/utils/importParsers.ts` | Format detection + JSON/CSV parsers + group name extraction |
| `src/utils/dateUtils.ts` | Date parsing (4 WhatsApp format patterns), PT-PT formatting, time unit helpers |
| `src/utils/colorScale.ts` | Deterministic per-user color assignment via module-level `Map` cache (persists across re-renders, resets on page reload); D3 heatmap color scale |
| `src/hooks/useChartData.ts` | Central aggregation hook used by Dashboard — applies filters then computes all chart data |
| `src/types/index.ts` | Shared TypeScript interfaces (Message, UserStats, HeatmapCell, etc.) |
| `src/hooks/useWhatsAppParser.ts` | Legacy hook (superseded by DataSourceContext) — only fetches+parses a URL, no import/persistence |

### Parsing Details

- `parser.ts` has `PHONE_TO_NAME` and `USER_ALIASES` maps to normalize sender names — update these when adding new datasets
- System messages (group creation, additions, etc.) are detected via `SYSTEM_PATTERNS` regex array (Portuguese patterns like `criou o grupo`, `adicionou`)
- Mentions use WhatsApp's LRM-marked format `@⁨Name⁩`; plain `@` is not matched to avoid email false positives
- Date parsing in `dateUtils.ts` handles DD/MM/YY, DD-MM-YYYY, YYYY-MM-DD, and bracket-wrapped `[DD/MM/YY]` formats
- Portuguese stopwords in `src/utils/stopwords-pt.ts`

### localStorage Keys

| Key | Used By |
|-----|---------|
| `whatsapp-analytics-data-source-v1` | DataSourceContext — persists imported file raw data |
| `whatsapp-analytics-filters` | FilterContext — persists selected user filters |
| `theme` | ThemeContext — persists light/dark preference |

## Tailwind Configuration

Dark mode uses `class` strategy. Theme toggling adds/removes `dark` class on `<html>`.
