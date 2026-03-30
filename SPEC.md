# SPEC — Simplify to Fixed Dataset ("Our Class")

## Goal

Strip the app down to a single hardcoded group ("Our Class"). Remove all file-import capability and the context/component scaffolding that supported it. Wire name resolution through `contacts.json`. The result is a read-only analytics dashboard for one group, with no user-configurable data source.

---

## Deletions

### Components (delete files entirely)
| File | Reason |
|------|--------|
| `src/components/DataImportPanel.tsx` | Import UI — gone |
| `src/components/FileDropzone.tsx` | Drag-and-drop import — gone |
| `src/components/MappingTable.tsx` | Sender mapping editor — gone |
| `src/components/GroupAvatar.tsx` | Only existed for import flow |
| `src/components/LoadingProgress.tsx` | Import-specific progress UI; replaced by a simpler spinner |

### Contexts (delete files entirely)
| File | Reason |
|------|--------|
| `src/context/DataSourceContext.tsx` | Replaced by a simple `useCrData()` hook |
| `src/context/NameMappingContext.tsx` | Mapping moves into `useChartData`; no UI layer needed |
| `src/context/FilterContext.tsx` | Global filter state removed; re-wired locally in Dashboard |

### Utilities (delete files entirely)
| File | Reason |
|------|--------|
| `src/utils/nameMapping.ts` | `analyzeSenders()` was only needed for the mapping UI |
| `src/utils/nameMapping.test.ts` | Tests for the above |

### Inside `src/utils/parser.ts`
- Delete the `PHONE_TO_NAME` map.
- Delete the `USER_ALIASES` map.
- All phone→name resolution moves to `useChartData` via `contacts.json`.

### localStorage
Remove all read/write for these keys:
- `whatsapp-analytics-data-source-v1` (DataSourceContext)
- `whatsapp-analytics-filters` (FilterContext)
- `whatsapp-analytics-name-mappings` (NameMappingContext)

Keep only the `theme` key (ThemeContext — unchanged).

---

## New Code

### `src/hooks/useCrData.ts`
Replaces `DataSourceContext`. Simple hook that fetches and parses `public/cr.txt` on mount.

```ts
// Shape returned
{
  messages: Message[];
  groupName: string;
  isLoading: boolean;
  error: string | null;
}
```

- Fetch `/cr.txt` with the native `fetch` API.
- Parse with `parseWhatsAppChat()` from `parser.ts`.
- No localStorage. No `datasetId`. No `importFile()`.
- On error: set `error` to a human-readable Portuguese message (e.g. `"Erro ao carregar os dados do grupo."`).

### `src/components/NavBar.tsx`
New component. Header strip at the top of the page. Contains (left to right):

1. **Group name** — "A Nossa Turma" (or "Our Class" — confirm final PT-PT string with user before coding).
2. **Member count pill** — derived from unique non-system senders in `messages`; e.g. `"18 membros"`.
3. **Help button** — `?` icon (Lucide `CircleHelp`) that opens `HelpModal`.
4. **Theme toggle** — existing `ThemeToggle` component, unchanged.
5. **Export PDF button** — existing `ExportPDF` component moved here from wherever it was in `Dashboard`.

Props: `{ messages: Message[]; }` (for computing member count).

---

## Modified Code

### `src/App.tsx`
New nesting — three providers instead of five:

```tsx
<ThemeProvider>
  <App shell — fetches data via useCrData(), renders spinner/error/Dashboard />
</ThemeProvider>
```

Concretely:

```tsx
function App() {
  const { messages, groupName, isLoading, error } = useCrData();

  if (isLoading) return <FullScreenSpinner />;
  if (error)    return <FullScreenError message={error} />;

  return (
    <ThemeProvider>
      <NavBar messages={messages} />
      <Dashboard messages={messages} groupName={groupName} />
    </ThemeProvider>
  );
}
```

> `FullScreenSpinner` and `FullScreenError` — small inline components in `App.tsx`, not separate files.

### `src/hooks/useChartData.ts`

**Name resolution** — at the very top of the hook, before any computation, remap `message.sender` for every message using the `contacts.json` lookup:

```ts
import contactsData from '../data/contacts.json';

// Build lookup once (outside hook, module-level)
const contactMap = new Map<string, string>(
  contactsData.mappings
    .filter(e => e.number)
    .map(e => [normalizePhone(e.number), e.name])
);

function normalizePhone(p: string) { return p.replace(/[\s\-()]/g, ''); }

// Inside hook:
const resolvedMessages = useMemo(
  () => messages.map(m => ({
    ...m,
    sender: contactMap.get(normalizePhone(m.sender)) ?? m.sender,
  })),
  [messages]
);
// Use resolvedMessages for all downstream computations
```

**Filter state** — remove all references to `FilterContext` (`useFilter`, `selectedUsers`, `clearFilters`). Accept `selectedUsers: string[]` as a prop/parameter instead (passed down from Dashboard).

Signature change:
```ts
// Before
export function useChartData(): ChartData

// After
export function useChartData(messages: Message[], selectedUsers: string[]): ChartData
```

### `src/components/Dashboard.tsx`

- Remove `DataSourceContext` usage.
- Remove `FilterContext` usage.
- Accept `messages: Message[]` and `groupName: string` as props.
- Own the filter state locally:
  ```ts
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  ```
- Pass `selectedUsers` / `setSelectedUsers` as props to `FilterControls`.
- Pass `selectedUsers` into `useChartData(messages, selectedUsers)`.
- Remove `datasetId` watch + `clearFilters()` call (single dataset, never needs clearing).
- Move `ExportPDF` out of Dashboard body and into `NavBar`.

### `src/components/FilterControls.tsx`

- Remove `useFilter()` / `FilterContext` dependency.
- Become a fully controlled component:
  ```ts
  interface Props {
    allUsers: string[];
    selectedUsers: string[];
    onSelectionChange: (users: string[]) => void;
  }
  ```

### `src/components/HelpModal.tsx`

- Remove import-format help content (TXT/JSON/CSV instructions).
- Replace with explanations of each chart and what its metrics mean:
  - SummaryStats — what the top-level numbers represent
  - TopContributors — how the ranking works
  - LeastParticipative — definition of "least participative"
  - InactivePodium — what counts as inactive
  - MessageIntervals — how intervals are computed
- Keep modal shell, close button, and trigger mechanism unchanged.
- Trigger is now the `?` button in `NavBar` — `HelpModal` receives `isOpen` / `onClose` props from `NavBar` (or App-level state if NavBar doesn't own modal state).

---

## Data Flow After Changes

```
App.tsx
  useCrData()
    fetch /cr.txt → parseWhatsAppChat() → Message[]
  ↓
  NavBar (messages) → member count pill, PDF export, help trigger, theme toggle
  Dashboard (messages, groupName)
    useState: selectedUsers[]
    FilterControls (allUsers, selectedUsers, onSelectionChange)
    useChartData(messages, selectedUsers)
      contactMap.get(sender) → resolved names
      → summary, userStats, filteredUserStats, heatmap, wordFrequencies
    → chart components (TopContributors, LeastParticipative, InactivePodium, MessageIntervals, SummaryStats)
```

---

## What Does NOT Change

- `src/context/ThemeContext.tsx` — untouched.
- `src/components/ThemeToggle.tsx` — untouched.
- `src/components/ExportPDF.tsx` — moved to NavBar, internal logic unchanged.
- All chart components (`TopContributors`, `LeastParticipative`, `InactivePodium`, `MessageIntervals`, `SummaryStats`, `OlympicPodium`) — internal logic untouched.
- `src/utils/parser.ts` — only the `PHONE_TO_NAME` and `USER_ALIASES` maps are deleted; all parsing logic stays.
- `src/utils/importParsers.ts` — kept as-is (used by parser.ts indirectly and may be needed later).
- `src/utils/dateUtils.ts`, `src/utils/colorScale.ts`, `src/utils/stopwords-pt.ts` — untouched.
- `src/data/contacts.json` — used directly by `useChartData`; assumed fully populated with all group members.
- `src/types/index.ts` — untouched.
- `public/cr.txt` — the fixed dataset; never replaced by user action.
- Tailwind dark-mode strategy (`class` on `<html>`) — unchanged.
- `vercel.json` SPA rewrite rule — unchanged.

---

## Open Questions Before Implementation

1. **NavBar group name string** — "A Nossa Turma" or "Our Class" or something else in PT-PT?
2. **HelpModal modal state ownership** — does `NavBar` own `isHelpOpen` state and render `HelpModal`, or does `App`/`Dashboard` own it?
3. **`contacts.json` at project root vs `src/data/contacts.json`** — are these the same file or does the root one need to be copied/synced to `src/data/` before building?
