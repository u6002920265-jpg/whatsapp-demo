# Issue 4: Add "Intervalo Médio entre Mensagens" chart with data calculation

## Parent PRD

See `PRD.md` in project root.

## What to build

End-to-end vertical slice: new data calculation + new type + new component + hook wiring.

**Data layer:**
- New type `MessageIntervalData` in `types/index.ts` with `name: string` and `avgInterval: number` (seconds)
- New function `calculateMessageIntervals(messages: Message[])` in `parser.ts` — groups messages by sender, sorts each group by timestamp, computes gaps between consecutive messages, returns average interval per user. Only includes users with 2+ messages.
- Add `messageIntervals` to `useChartData` return value (computed from filtered messages)

**Component:**
- New `MessageIntervals` component — horizontal bar chart (same D3 pattern as `TopContributors`)
- Shows top 10 users by largest average interval (sorted descending)
- Bar labels show human-readable durations (e.g., "2h 34m", "3d 12h", "14m")
- Title: "Intervalo Médio entre Mensagens"
- Respects user filter selection
- Supports light and dark mode
- Wire into Dashboard temporarily (final layout in Issue 5)

## Acceptance criteria

- [ ] `MessageIntervalData` type exists in `types/index.ts`
- [ ] `calculateMessageIntervals()` exists in `parser.ts` and correctly computes per-user average gaps
- [ ] Only users with 2+ messages are included in the calculation
- [ ] `useChartData` returns `messageIntervals` computed from filtered messages
- [ ] `MessageIntervals.tsx` component renders a horizontal bar chart
- [ ] Shows top 10 users sorted by largest interval
- [ ] Time labels are human-readable (hours, minutes, days as appropriate)
- [ ] Respects `selectedUsers` filter
- [ ] Works in both light and dark mode
- [ ] Section title is "Intervalo Médio entre Mensagens"
- [ ] Component is rendered in Dashboard
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

## Blocked by

- Blocked by Issue 1 (dead component removal must be done first)

## User stories addressed

- User story 3: see each user's average time gap
- User story 4: only users with 2+ messages
- User story 8: formatted time labels
- User story 9: respects user filter selection
- User story 12: sorted by largest interval first
- User story 13: works in light and dark mode
