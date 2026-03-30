# Issue 3: Add "Pódio dos Menos Ativos" with anti-medals

## Parent PRD

See `PRD.md` in project root.

## What to build

A new standalone `InactivePodium` component — a podium displaying the 3 least active users (by messageCount) with humorous anti-medals. Does NOT reuse `OlympicPodium`; is an independently authored component with its own medal styles.

Medal tiers (least messages first):
- 1st place: "Medalha de Papelão" — color `#A0826D` (cardboard brown)
- 2nd place: "Medalha de Ferrugem" — color `#B7410E` (rust orange-red)
- 3rd place: "Medalha de Barro Cru" — color `#8B7355` (clay tan)

Rules:
- Excludes users with 0 messages (they don't exist in the data)
- Title: "Pódio dos Menos Ativos"
- Respects user filter selection
- Supports light and dark mode
- Wire into Dashboard temporarily (final layout in Issue 5)

## Acceptance criteria

- [ ] `InactivePodium.tsx` component exists as a standalone component
- [ ] Shows the 3 users with the lowest messageCount (excluding 0-message users)
- [ ] Displays medal names: Papelão, Ferrugem, Barro Cru
- [ ] Uses the specified colors for each medal tier
- [ ] Section title is "Pódio dos Menos Ativos"
- [ ] Respects `selectedUsers` filter
- [ ] Works in both light and dark mode
- [ ] Component is rendered in Dashboard
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

## Blocked by

- Blocked by Issue 1 (dead component removal must be done first)

## User stories addressed

- User story 2: playful podium for least active members
- User story 5: users with 0 messages excluded
- User story 10: distinct anti-medal colors
- User story 13: works in light and dark mode
