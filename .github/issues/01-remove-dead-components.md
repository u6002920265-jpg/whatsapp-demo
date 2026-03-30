# Issue 1: Remove dead components and clean up data layer

## Parent PRD

See `PRD.md` in project root.

## What to build

Remove 5 components from the dashboard and all their backing dead code, leaving a compilable intermediate state with only SummaryStats, OlympicPodium, and TopContributors.

Specifically:
- Delete component files: `ActivityHeatmap.tsx`, `WordCloud.tsx`, `UserDetailsPanel.tsx`
- Delete `src/utils/stopwords-pt.ts`
- Remove types from `src/types/index.ts`: `HeatmapCell`, `WordFrequency`, `ResponseTimeData`, `ThreadFlow`
- Remove `calculateHeatmap` and `calculateWordFrequencies` from `parser.ts` and their exports
- Remove `heatmap` and `wordFrequencies` from `useChartData.ts`
- Remove all imports and JSX references from `Dashboard.tsx`
- Clean up any unused imports across touched files

## Acceptance criteria

- [ ] `ActivityHeatmap.tsx`, `WordCloud.tsx`, `UserDetailsPanel.tsx` are deleted
- [ ] `stopwords-pt.ts` is deleted
- [ ] `HeatmapCell`, `WordFrequency`, `ResponseTimeData`, `ThreadFlow` types are removed
- [ ] `calculateHeatmap` and `calculateWordFrequencies` are removed from `parser.ts`
- [ ] `useChartData` no longer computes or returns `heatmap` or `wordFrequencies`
- [ ] Dashboard renders with only SummaryStats, OlympicPodium, and TopContributors
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

## Blocked by

None - can start immediately.

## User stories addressed

- User story 6: cleaner dashboard without heatmap, word cloud, user details panel, and thread flow
