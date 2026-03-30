# Issue 5: Rewire Dashboard layout — side-by-side grids

## Parent PRD

See `PRD.md` in project root.

## What to build

Final layout pass on `Dashboard.tsx` to arrange all components in the agreed grid structure:

1. DataImportPanel + FilterControls (unchanged)
2. SummaryStats — full width
3. Grid row: `OlympicPodium` (1 col) | `InactivePodium` (1 col) — side by side
4. Grid row: `TopContributors` (1 col) | `LeastParticipative` (1 col) — side by side
5. `MessageIntervals` — full width

Ensure the existing podium title reads "Pódio dos Mais Ativos" (update if needed).

## Acceptance criteria

- [ ] Two podiums render side-by-side on desktop (stacked on mobile)
- [ ] Two bar charts render side-by-side on desktop (stacked on mobile)
- [ ] MessageIntervals renders full width below the bar charts
- [ ] OlympicPodium title is "Pódio dos Mais Ativos"
- [ ] Layout works in both light and dark mode
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

## Blocked by

- Blocked by Issue 2 (LeastParticipative)
- Blocked by Issue 3 (InactivePodium)
- Blocked by Issue 4 (MessageIntervals)

## User stories addressed

- User story 11: podiums side-by-side, bar charts side-by-side for intuitive comparison
