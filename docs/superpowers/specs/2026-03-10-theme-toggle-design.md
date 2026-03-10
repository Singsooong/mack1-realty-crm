# Theme Toggle — Design Spec
_Date: 2026-03-10_

## Summary

Add a light/dark theme toggle to the dashboard. The current design is dark-only (class hard-coded in `main.tsx`). This feature introduces a proper theme system with user preference persisted to `localStorage`.

## Decisions Made

| Question | Decision |
|---|---|
| Placement | Header, top-right (between Settings icon and user avatar) |
| Toggle style | Pill toggle — ☀️ slider 🌙 |
| State management | React Context + localStorage persistence |
| Default theme | `dark` (matches current design) |

## Architecture

### New file: `src/lib/theme.tsx`

- `ThemeContext` holding `{ isDark: boolean, toggleTheme: () => void }`
- `ThemeProvider` component:
  - Reads initial value from `localStorage` key `"theme"`, defaults to `"dark"`
  - On mount: applies/removes `.dark` class on `document.documentElement`
  - On toggle: flips state, updates `document.documentElement.classList`, writes to `localStorage`
- `useTheme()` hook that consumes the context (throws if used outside provider)

### Modified: `src/main.tsx`

- Remove `document.documentElement.classList.add('dark')` — `ThemeProvider` handles this now

### Modified: `src/App.tsx`

- Wrap app with `<ThemeProvider>` (outermost wrapper, outside `RouterProvider`)

### Modified: `src/components/shared/Header.tsx`

- Import `useTheme` hook
- Add pill toggle between the Settings button and the vertical separator
- Pill: `☀️` icon | sliding div | `🌙` icon
- Active icon is full opacity; inactive icon is 50% opacity
- Track color: indigo (`bg-primary` / `bg-muted`) depending on mode
- Thumb: white in dark mode, indigo in light mode

## Component Design

```tsx
// Pill toggle inside Header
<button onClick={toggleTheme} className="...pill styles...">
  <Sun className={isDark ? 'opacity-40' : 'opacity-100'} />
  <div className="track">
    <div className="thumb" />
  </div>
  <Moon className={isDark ? 'opacity-100' : 'opacity-40'} />
</button>
```

## Data Flow

```
localStorage ("theme") → ThemeProvider (initial state)
                              ↓
                    document.documentElement.classList
                              ↓
                    CSS variables (:root / .dark)
                              ↓
                    All Tailwind color tokens
```

## Files Changed

| File | Change |
|---|---|
| `src/lib/theme.tsx` | **NEW** — ThemeContext, ThemeProvider, useTheme |
| `src/App.tsx` | Wrap with `<ThemeProvider>` |
| `src/components/shared/Header.tsx` | Add pill toggle UI using `useTheme()` |
| `src/main.tsx` | Remove hard-coded `.dark` class |
