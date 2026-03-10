# Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent light/dark theme toggle pill (☀️ slider 🌙) to the dashboard header, replacing the hard-coded dark class with a proper ThemeContext backed by localStorage.

**Architecture:** A new `ThemeContext` owns the `isDark` boolean and `toggleTheme` action. On every toggle it updates `document.documentElement.classList` (which drives all Tailwind dark-variant tokens) and writes to `localStorage` so the preference survives refresh. `ThemeProvider` wraps the entire app so any component can call `useTheme()`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React icons, shadcn/ui tokens, localStorage

---

## Chunk 1: Theme context + wire-up

### Task 1: Add flash-of-wrong-theme guard to `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add inline theme script to `index.html`**

Add a `<script>` tag inside `<head>` *before* any stylesheets so the `dark` class is applied synchronously before first paint:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>databrain-dark</title>
    <script>
      (function() {
        var theme = localStorage.getItem('theme');
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: prevent flash of wrong theme on initial load"
```

---

### Task 2: Create ThemeContext

**Files:**
- Create: `src/lib/theme.tsx`

- [ ] **Step 1: Create `src/lib/theme.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type ThemeContextValue = {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : true // default to dark
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
```

- [ ] **Step 2: Remove hard-coded dark class from `src/main.tsx`**

Delete line 6: `document.documentElement.classList.add('dark')`

Result:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Wrap app with `ThemeProvider` in `src/App.tsx`**

```tsx
import { RouterProvider } from '@/lib/router'
import { AppLayout } from '@/components/shared/AppLayout'
import { PageRouter } from '@/components/shared/PageRouter'
import { ThemeProvider } from '@/lib/theme'

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AppLayout>
          <PageRouter />
        </AppLayout>
      </RouterProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
npx tsc -b --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.tsx src/main.tsx src/App.tsx
git commit -m "feat: add ThemeContext with localStorage persistence"
```

---

### Task 2: Add pill toggle to Header

**Files:**
- Modify: `src/components/shared/Header.tsx`

- [ ] **Step 1: Update `src/components/shared/Header.tsx`**

Add `Sun`, `Moon` to the lucide imports and import `useTheme`. Add the pill toggle between the Settings button and the `Separator`.

Full file:
```tsx
import { Bell, Settings, Mic, Search, Sun, Moon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { adminUser } from '@/lib/mock-data'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function Header() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="flex items-center justify-between px-6 h-[72px] bg-background border-b border-border shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search properties, agents..." className="pl-9 w-72 bg-muted/40 border-border" />
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <Mic className="h-4 w-4" />
          AI Assistant
        </Button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>

        {/* Theme toggle pill */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 transition-colors hover:bg-muted"
        >
          <Sun className={cn('h-3.5 w-3.5 transition-opacity', isDark ? 'opacity-40' : 'opacity-100')} />
          <div className={cn(
            'relative h-[18px] w-[34px] rounded-full transition-colors',
            isDark ? 'bg-indigo-500' : 'bg-slate-200'
          )}>
            <div className={cn(
              'absolute top-[2px] h-[14px] w-[14px] rounded-full shadow-sm transition-all duration-200',
              isDark ? 'translate-x-[16px] bg-white' : 'translate-x-[2px] bg-indigo-500'
            )} />
          </div>
          <Moon className={cn('h-3.5 w-3.5 transition-opacity', isDark ? 'opacity-100' : 'opacity-40')} />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
            <AvatarFallback>{adminUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">{adminUser.name}</span>
            <span className="text-xs text-muted-foreground">{adminUser.role}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc -b --noEmit
```

Expected: no errors

- [ ] **Step 3: Run dev server and verify manually**

```bash
npm run dev
```

Manual checks:
1. App loads in dark mode (same as before)
2. The pill toggle appears in the header between Settings and user avatar
3. Clicking the toggle switches to light mode — full app background goes light
4. Clicking again returns to dark mode
5. Refreshing the page preserves whichever mode was last set
6. Sun icon is bright in light mode, dimmed in dark mode (and vice versa for Moon)
7. Thumb slides left (light) / right (dark) with smooth transition

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/Header.tsx
git commit -m "feat: add theme toggle pill to header"
```
