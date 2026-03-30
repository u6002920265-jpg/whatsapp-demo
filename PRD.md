# PRD: Redesign dashboard — remove 5 charts, add least-active podium, least participative bars, message intervals

## Problem Statement

The current dashboard has several visualizations (Activity Heatmap, Word Cloud, User Details Panel, Response Time, Conversation Threads) that do not provide actionable insights for the group administrators. Meanwhile, there is no way to identify the least active members or understand messaging cadence patterns — information that matters for community engagement.

## Solution

Redesign the dashboard by removing 5 underused components and replacing them with 3 new visualizations focused on low-participation insights:

1. **"Pódio dos Menos Ativos"** — A humorous podium for the 3 least active users, with custom "anti-medals" (Papelão, Ferrugem, Barro Cru)
2. **"Menos Participativos"** — A horizontal bar chart showing the bottom 10 users by message count
3. **"Intervalo Médio entre Mensagens"** — A horizontal bar chart showing the top 10 users with the longest average gap between their own consecutive messages

The existing Summary Stats, Top Contributors, and "Pódio dos Mais Ativos" are kept.

## User Stories

1. As a group admin, I want to see which members participate the least, so that I can encourage them to engage more
2. As a group admin, I want a playful podium highlighting the 3 least active members, so that the dashboard has a lighthearted tone that matches group chat culture
3. As a group admin, I want to see each user's average time gap between their own messages, so that I can understand individual messaging cadence
4. As a group member, I want the interval chart to only show users with 2+ messages, so that single-message users don't skew the data
5. As a group member, I want users with 0 messages excluded from the least-active podium, so that non-existent participants don't appear
6. As a group admin, I want a cleaner dashboard without the heatmap, word cloud, user details panel, and thread flow, so that the remaining charts are more focused
7. As a group member, I want the least participative chart to show 10 users, so that I can see a meaningful slice of the bottom contributors
8. As a group member, I want the message interval chart to display formatted time labels (e.g., "2h 34m", "14m"), so that the data is easy to read
9. As a group admin, I want all new charts to respect the user filter selection, so that cross-filtering remains consistent
10. As a group member, I want the anti-medals to use distinct colors (cardboard brown, rust red, raw clay tan), so that the least-active podium is visually distinguishable from the most-active podium
11. As a group admin, I want the dashboard layout to place the two podiums side-by-side and the two bar charts side-by-side, so that comparisons are intuitive
12. As a group member, I want the interval chart to sort by largest interval first, so that the slowest responders are most prominent
13. As a group member, I want the dashboard to remain fully functional in both light and dark mode after the redesign

## Implementation Decisions

### Components to remove
- `ActivityHeatmap` — full component deletion
- `WordCloud` — full component deletion
- `UserDetailsPanel` — full component deletion
- All dead code from these removals: heatmap calculation, word frequency calculation, Portuguese stopwords file, and unused TypeScript types (`HeatmapCell`, `WordFrequency`, `ResponseTimeData`, `ThreadFlow`)

### New components
- **`InactivePodium`** — standalone component (does NOT reuse `OlympicPodium`). Three custom medal tiers:
  - 1st (least messages): "Medalha de Papelão" — color `#A0826D` (cardboard brown)
  - 2nd: "Medalha de Ferrugem" — color `#B7410E` (rust orange-red)
  - 3rd: "Medalha de Barro Cru" — color `#8B7355` (clay tan)
  - Excludes users with 0 messages
- **`LeastParticipative`** — horizontal bar chart mirroring the `TopContributors` D3 pattern, sorted by `messageCount` ascending, showing bottom 10 users
- **`MessageIntervals`** — horizontal bar chart (same D3 pattern), showing top 10 users by largest average interval between their own consecutive messages. Only users with 2+ messages. Time labels formatted as human-readable durations

### Data layer changes
- New function `calculateMessageIntervals(messages)` in `parser.ts` — groups messages by sender (sorted by timestamp), computes gaps between consecutive messages per user, returns average interval per user
- New type `MessageIntervalData` with `name` and `avgInterval` (in seconds) fields
- `useChartData` hook: remove `heatmap` and `wordFrequencies` computations, add `messageIntervals` computation from filtered messages
- The least participative chart reuses the existing `userStats` data (sorted ascending) — no new calculation needed

### Dashboard layout (top to bottom)
1. DataImportPanel + FilterControls (unchanged)
2. SummaryStats — full width
3. Grid row: `OlympicPodium` (1 col) | `InactivePodium` (1 col) — side by side
4. Grid row: `TopContributors` (1 col) | `LeastParticipative` (1 col) — side by side
5. `MessageIntervals` — full width

### PT-PT section titles
- Existing podium: **"Pódio dos Mais Ativos"**
- New podium: **"Pódio dos Menos Ativos"**
- Least participative bars: **"Menos Participativos"**
- Message intervals bars: **"Intervalo Médio entre Mensagens"**

## Testing Decisions

There is no test suite in this project. Validation will be done via:
- `npm run build` — TypeScript type checking + Vite production build (catches type errors, missing imports, dead references)
- `npm run lint` — ESLint with TypeScript and React rules (catches unused imports, hook violations)
- Manual visual verification in both light and dark mode

A good test for this project would verify external behavior: given a known set of messages, the computed `messageIntervals` output matches expected values. However, adding a test framework is out of scope for this change.

## Out of Scope

- Adding a test framework or writing automated tests
- Changing the existing `OlympicPodium` component (it stays as-is)
- Modifying the parser's phone-to-name mapping or alias resolution
- PDF export adjustments (html2canvas will capture the new layout automatically)
- Responsive/mobile layout refinements beyond what the current Tailwind grid provides
- Any new data import formats or parser changes beyond the interval calculation

## Further Notes

- The `ExportPDF` component captures `<main id="dashboard-content">` — the new layout will be captured automatically without changes
- The `colorScale.ts` utility assigns deterministic colors per user and will work for the new charts without modification
- The existing `TopContributors` component is the reference implementation for the D3 horizontal bar pattern — `LeastParticipative` and `MessageIntervals` should follow it closely
- The `OlympicPodium` component serves as a visual reference for `InactivePodium`, but the new component should be independently authored with its own medal styles
