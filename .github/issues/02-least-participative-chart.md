# Issue 2: Add "Menos Participativos" horizontal bar chart

## Parent PRD

See `PRD.md` in project root.

## What to build

A new `LeastParticipative` component — a horizontal bar chart showing the bottom 10 users by `messageCount`. Mirrors the existing `TopContributors` D3 pattern (useRef + useEffect + D3 imperative rendering) but sorted ascending.

- Title: "Menos Participativos"
- Uses existing `userStats` data from `useChartData` (sorted ascending, sliced to 10)
- Respects user filter selection
- Supports light and dark mode
- Uses `getUserColor()` from `colorScale.ts` for bar colors
- Wire into Dashboard temporarily (final layout in Issue 5)

## Acceptance criteria

- [ ] `LeastParticipative.tsx` component exists and renders a horizontal bar chart
- [ ] Shows bottom 10 users sorted by messageCount ascending
- [ ] Follows the same D3 pattern as `TopContributors`
- [ ] Respects `selectedUsers` filter (dims/highlights bars)
- [ ] Works in both light and dark mode
- [ ] Section title is "Menos Participativos"
- [ ] Component is rendered in Dashboard
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

## Blocked by

- Blocked by Issue 1 (dead component removal must be done first)

## User stories addressed

- User story 1: see which members participate the least
- User story 7: show 10 users in the least participative chart
- User story 9: respects user filter selection
- User story 13: works in light and dark mode
