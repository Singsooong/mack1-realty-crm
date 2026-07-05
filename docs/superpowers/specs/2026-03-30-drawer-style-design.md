# Drawer Style Upgrade — Design Spec
**Date:** 2026-03-30
**Project:** databrain-dark

---

## Overview

Apply a polished "Gradient Header" visual treatment to all add/edit Sheet drawers in the app. Delete confirmation dialogs are intentionally left unchanged — they are destructive confirmations and should remain plain and focused.

---

## Scope

**Files modified:**
- `src/components/listings/PropertyDrawer.tsx`
- `src/components/agents/AgentDrawer.tsx`

**Files NOT modified:**
- `src/components/listings/DeleteConfirmDialog.tsx`
- `src/components/agents/DeleteAgentDialog.tsx`
- All other dialogs or modals

---

## Visual Changes

### 1. SheetHeader — Gradient Panel

Replace the plain `SheetHeader` background with a gradient panel:

- Background: `bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]`
- Bottom border: `border-b border-[#2a2a3e]`
- Subtle radial glow: absolute-positioned `div` in the top-right corner using `bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]`
- `SheetTitle` text color: `text-[#e8e8f0]`
- Padding: `p-6 pb-5`

### 2. Icon Badge

Above the title, render a small rounded icon box:

- Size: `h-9 w-9 rounded-lg`
- Background: `bg-indigo-500/10`
- Border: `border border-indigo-500/25`
- Icon color: `text-indigo-400`
- Icon size: `h-4 w-4`
- Margin below: `mb-3`

**Icon per context:**
| Drawer | Add mode | Edit mode |
|--------|----------|-----------|
| AgentDrawer | `UserPlus` | `UserCog` |
| PropertyDrawer | `Building2` | `PenLine` |

All icons imported from `lucide-react`.

### 3. Subtitle Line

Below `SheetTitle`, add a `<p>` with a contextual subtitle:

| Drawer | Add subtitle | Edit subtitle |
|--------|-------------|---------------|
| AgentDrawer | `"Create a login account for a new team member"` | `"Update this agent's profile and access"` |
| PropertyDrawer | `"Fill in the details to add a new listing"` | `"Update the details for this listing"` |

Styling: `text-xs text-[#6b6b80] mt-1`

### 4. Field Labels — ALL-CAPS

All `<label>` elements in the form body get:

```
text-xs font-medium uppercase tracking-wide text-muted-foreground
```

This replaces the previous `text-sm font-medium` style.

---

## What Does NOT Change

- Form field inputs, selects, and their values
- Form submission logic, error handling, loading states
- Footer buttons (Cancel / Save)
- SheetContent width and overflow settings
- Any props or TypeScript interfaces

---

## Token Usage

All values use either Tailwind utility classes or CSS color literals that match the existing dark theme palette (`#1a1a2e`, `#16213e`, `#2a2a3e`, indigo-500 variants). No new design tokens or CSS files introduced.
