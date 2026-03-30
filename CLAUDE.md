# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhatsApp Group Analytics Dashboard — a React 18 + D3 + Vite application that parses WhatsApp chat exports (.txt, .json, .csv) and displays interactive visualizations with cross-filtering, theme toggle, and PDF export. UI is in Portuguese (PT-PT). Fully client-side, no backend.

## Commands

```bash
npm run dev          # Vite dev server at localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run test         # vitest run (all tests)
npx vitest run src/utils/parser.test.ts   # run a single test file
```

There is no comprehensive test suite — only `src/utils/parser.test.ts` exists. Validate changes with `npm run build` and `npm run lint`.

## Architecture

### Context Providers (src/context/)

The app uses four React contexts nested in `App.tsx` in this order (nesting matters — inner contexts can consume outer ones):
1. **ThemeProvider** → light/dark mode with localStorage persistence
2. **DataSourceProvider** → manages dataset loading (sample `public/cr.txt` or user-imported), parsing, progress, errors, and `datasetId` for cache invalidation
3. **NameMappingProvider** → maps raw sender names/phone numbers to display names; auto-populated from `src/data/contacts.json` via `applyContactDefaults()`; persisted to localStorage
4. **FilterProvider** → global user selection with memoized callbacks (prevents infinite loops) and localStorage persistence

### Data Flow

1. **Import**: `DataSourceContext` accepts files via `importFile()`, detects format, stores raw data in localStorage, and calls parsers
2. **Parse**: `src/utils/importParsers.ts` routes to format-specific parsers; TXT uses `parseWhatsAppChat()` from `parser.ts`
3. **Aggregate**: `useChartData` hook reads filter context and computes summary, userStats, heatmap, wordFrequencies via `useMemo`
4. **Render**: Dashboard passes aggregated data to D3-based chart components

### Filtering nuance in useChartData

`summary` and `userStats` are computed from **all** messages (unfiltered). `heatmap` and `wordFrequencies` use the filtered subset. `filteredUserStats` is derived by filtering the pre-computed `userStats` array (not by recomputing stats from filtered messages). This means summary stats always reflect the full dataset, while charts reflect the user selection.

### Dataset switch flow

When the dataset changes, `DataSourceContext` generates a new `datasetId` (timestamp-based). `Dashboard` watches `datasetId` and calls `clearFilters()` on change, so stale user selections don't persist across datasets.

### D3 chart pattern

All chart components use the imperative D3 pattern: a `useRef` for the SVG container and a `useEffect` that calls D3 to render/update. The PDF export (`ExportPDF`) captures the `<main id="dashboard-content">` element via html2canvas + jspdf.

### Key Files

| Path | Purpose |
|------|---------|
| `src/utils/parser.ts` | WhatsApp TXT parser, user stats, heatmap, word cloud, message interval calculations; contains `PHONE_TO_NAME` and `USER_ALIASES` maps |
| `src/utils/importParsers.ts` | Format detection + JSON/CSV parsers + group name extraction |
| `src/utils/dateUtils.ts` | Date parsing (4 WhatsApp format patterns), PT-PT formatting, time unit helpers |
| `src/utils/colorScale.ts` | Deterministic per-user color assignment via module-level `Map` cache (persists across re-renders, resets on page reload); D3 heatmap color scale |
| `src/hooks/useChartData.ts` | Central aggregation hook used by Dashboard — applies filters then computes all chart data |
| `src/types/index.ts` | Shared TypeScript interfaces (Message, UserStats, HeatmapCell, etc.) |
| `src/hooks/useWhatsAppParser.ts` | Legacy hook (superseded by DataSourceContext) — only fetches+parses a URL, no import/persistence |
| `src/utils/nameMapping.ts` | `analyzeSenders()` — detects which senders are phone numbers vs. named contacts and returns sorted `SenderInfo[]` |
| `src/data/contacts.json` | Static phone→name lookup table (format: `{ mappings: [{ number, name }] }`) loaded at module init by `NameMappingContext` |
| `src/components/FileDropzone.tsx` | Drag-and-drop file import UI |
| `src/components/MappingTable.tsx` | Editable table for reviewing/overriding sender→display-name mappings |
| `src/components/GroupAvatar.tsx` | Avatar display for group identity |

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
| `whatsapp-analytics-name-mappings` | NameMappingContext — persists sender→display-name overrides |
| `theme` | ThemeContext — persists light/dark preference |

## Deployment

Deployed on Vercel. `vercel.json` has a single rewrite rule (`/(.*)` → `/index.html`) for SPA client-side routing. No environment variables required — the app is fully client-side.

## Planned Changes

`SPEC.md` in project root tracks upcoming feature removals (User Details Panel, Activity Heatmap, Response Time, Word Cloud, Conversation Threads) and additions (least participative users chart, message interval analysis, inactive user podium). Some of these are already implemented (`LeastParticipative`, `MessageIntervals`, `InactivePodium` components exist). Consult SPEC.md before major refactors.

## Tailwind Configuration

Dark mode uses `class` strategy. Theme toggling adds/removes `dark` class on `<html>`.
