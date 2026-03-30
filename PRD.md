# PRD: Modernize import UI, dynamic name mapping, and group avatar navbar

## Problem Statement

The current WhatsApp Analytics Dashboard has three UX problems:

1. **The file import UI is dated and cluttered** — it's always visible as a row of buttons at the top of the dashboard, with no drag-and-drop support. It wastes space and doesn't match modern upload patterns.

2. **Phone-to-name mapping is hardcoded** — the `PHONE_TO_NAME` and `USER_ALIASES` maps in `parser.ts` only work for one specific group ("Ribadouro 30 anos"). Any other WhatsApp export shows raw phone numbers in charts, making them unreadable. Users have no way to assign display names.

3. **There's no way to see who's who** — once charts render, there's no reference table showing which number belongs to which person, and no group identity in the navbar beyond a text label.

## Solution

Replace the import section with a modern collapsible drag-and-drop dropzone. After parsing, transform it in-place into an editable name mapping table where users assign display names to phone numbers before charts render. Add a letter-based group avatar to the navbar that opens a modal with the mapping table for later edits.

## User Stories

1. As a user, I want to drag and drop a WhatsApp export file onto a dropzone, so that importing feels modern and intuitive.
2. As a user, I want to click the dropzone to select a file via the system picker, so that I have an alternative to drag-and-drop.
3. As a user, I want the dropzone to show visual feedback when I drag a file over it, so that I know where to drop.
4. As a user, I want the import section to be collapsed by default when data is loaded, so that the dashboard isn't cluttered.
5. As a user, I want a thin collapsed bar with a chevron indicating the import section can be expanded, so that I know it exists.
6. As a user, I want an "Importar" button (icon + text) in the navbar to toggle the import section open, so that I can re-import anytime.
7. As a user, I want the import section to auto-expand on first visit when no data exists, so that I know to upload a file.
8. As a user, I want to see an editable mapping table after parsing a file, so that I can assign readable names to phone numbers before charts load.
9. As a user, I want phone-number senders to appear with empty display name fields in the mapping table, so that I know which ones need names.
10. As a user, I want non-phone senders to appear pre-filled with their name in the mapping table, so that I can edit aliases if needed.
11. As a user, I want to see the message count per sender in the mapping table, so that I can identify who a phone number belongs to based on activity.
12. As a user, I want to click "Confirmar" to apply mappings and render charts, so that the flow is explicit.
13. As a user, I want unfilled phone numbers to appear as-is in charts (not blocked), so that I'm not forced to identify everyone.
14. As a user, I want my name mappings to persist in localStorage, so that they survive page reloads.
15. As a user, I want mappings to be cleared when I re-import a new file, so that stale mappings from a different group don't carry over.
16. As a user, I want to see a letter-based group avatar (first 2 letters) in the navbar, so that the group has a visual identity.
17. As a user, I want the avatar's background color to be deterministic based on the group name, so that it's consistent across sessions.
18. As a user, I want to click the group avatar to open a modal showing the full editable mapping table, so that I can correct names at any time.
19. As a user, I want edits in the mapping modal to re-render charts immediately, so that I see the effect of my changes.
20. As a user, I want all labels and buttons in Portuguese (PT-PT), so that the UI language is consistent.
21. As a user, I want the mapping table to transform in-place where the dropzone was (not a separate section), so that the flow feels linear.
22. As a user, I want the import section to collapse after I confirm mappings, so that the dashboard is clean.

## Implementation Decisions

### New Modules

- **NameMappingContext**: New React context managing `Record<string, string>` (original sender → display name). Persists to localStorage under `whatsapp-analytics-name-mappings`. Exposes `mappings`, `setMapping()`, `setMappings()`, `clearMappings()`. Nested between DataSourceProvider and FilterProvider in the context tree (App.tsx).

- **Name mapping utility** (`nameMapping.ts`): Pure function that takes parsed messages, groups senders, counts messages per sender, classifies each as phone number (regex: starts with `+` followed by digits) or named sender, and returns a structured array for the mapping table. Pre-fills display names for non-phone senders. No UI dependency — testable in isolation.

- **FileDropzone component**: Drag-and-drop upload area with click fallback. Handles `onDragOver`/`onDragLeave`/`onDrop` events. Accepts `.txt`, `.json`, `.csv`. Shows cloud upload icon, "Escolher ficheiros ou arrastar" text, and visual highlight on drag-over. Calls `importFile()` from DataSourceContext.

- **MappingTable component**: Reusable editable table with columns: Original Name/Number | Display Name (text input) | Messages (count). Used in two places: inline after import (with "Confirmar" button) and inside the navbar avatar modal. Receives mappings + sender stats as props, calls back on changes.

- **GroupAvatar component**: Renders a circle with first 2 letters of the group name. Background color derived deterministically using the existing `colorScale.ts` pattern. Accepts an `onClick` prop for opening the mapping modal.

### Modified Modules

- **parser.ts**: Delete `PHONE_TO_NAME` and `USER_ALIASES` hardcoded maps. Remove `normalizeUserName` function (or make it identity). Raw sender names pass through parsing untouched. Name resolution moves downstream.

- **useChartData hook**: Reads from NameMappingContext. Applies display name mapping to messages before computing userStats, heatmap, wordFrequencies, and other aggregations. All chart data uses mapped names.

- **DataImportPanel**: Major rewrite. Becomes collapsible (thin bar with expand chevron when collapsed). Contains FileDropzone which transforms in-place into MappingTable after parsing completes. Linear flow: dropzone → mapping review → collapse.

- **Dashboard**: Header gains GroupAvatar (next to group name), "Importar" icon+text button, and mapping modal trigger. Manages collapsed/expanded state for import section. Auto-expands on first visit when no data loaded.

### Key Architectural Decisions

- Name mapping is applied at the `useChartData` level, not during parsing. This keeps the parser pure (raw data in, raw data out) and makes mappings editable without re-parsing.
- The mapping modal (opened from navbar avatar) is for name editing only — no import functionality inside it. Import and mapping are kept as separate concerns.
- The "load sample data" button ("Grupo Riba") is removed entirely.
- Mappings are cleared on re-import (no carry-over between different files).
- Context nesting order: ThemeProvider → DataSourceProvider → NameMappingProvider → FilterProvider.

## Testing Decisions

- **Good tests verify external behavior**: given inputs, assert outputs. No mocking of internal functions or testing private implementation details.
- **Name mapping utility** (`nameMapping.ts`) will have unit tests: phone number detection regex, message counting, pre-fill logic for named senders, edge cases (empty messages, senders with mixed formats). Prior art: `src/utils/parser.test.ts` using vitest with the same pattern of helper factory functions and `describe`/`it` blocks.
- **No component tests** — there is no component testing setup (no jsdom, no React Testing Library). Build + lint validation is sufficient for UI components.

## Out of Scope

- Group image upload (avatar is generated from letters, not a user-provided image)
- Auto-detection of phone-to-name associations from system messages (e.g., "changed their name to...")
- Hide/exclude toggle for individual senders in the mapping table (existing filter system handles this)
- Mapping carry-over between different file imports
- Comprehensive test coverage for UI components
- Any backend or API changes (app remains fully client-side)

## Further Notes

- All UI text must be in Portuguese (PT-PT), consistent with the rest of the app. Key terms: "Importar", "Escolher ficheiros ou arrastar", "Nome Original", "Nome a Exibir", "Mensagens", "Confirmar", "Mapeamento de Nomes".
- The sample dataset (`public/cr.txt`) will show raw names after removing the hardcoded maps. This is acceptable — the mapping flow handles it like any other import.
- The `colorScale.ts` module already has a deterministic color assignment pattern that should be reused for the group avatar background color.
