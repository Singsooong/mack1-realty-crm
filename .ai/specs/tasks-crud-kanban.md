# Tasks CRUD Kanban

## Why

The Tasks page is read-only with a simple checkbox toggle. Users need to create, edit, and delete tasks, and visualize work across three stages via a drag-and-drop kanban board.

## What

A fully functional kanban board on the Tasks page with three columns (PENDING, IN-PROGRESS, COMPLETED), drag-and-drop to change status, and a Sheet drawer for add/edit with a confirm dialog for delete. Done when tasks persist status changes to Supabase on drop.

## Context

**Relevant files:**
- `src/pages/TasksPage.tsx` — current list view to replace with kanban
- `src/types/index.ts` — `Task` interface with `completed: boolean` to migrate to `status`
- `src/services/tasks.ts` — Supabase queries; has `updateTask`, missing `deleteTask`
- `src/hooks/useTasks.ts` — state layer; exposes `createTask`, `toggleTaskComplete`, missing `updateTask`/`deleteTask`
- `src/components/agents/AgentDrawer.tsx` — Sheet drawer pattern to replicate for tasks
- `src/components/agents/DeleteAgentDialog.tsx` — confirm dialog pattern to replicate

**Patterns to follow:**
- Sheet-based drawer for add/edit: `src/components/agents/AgentDrawer.tsx`
- Confirm delete dialog: `src/components/agents/DeleteAgentDialog.tsx`
- Page-level state + handler functions: `src/pages/AgentsPage.tsx`
- Optimistic updates in hook: `src/hooks/useTasks.ts` (see `handleToggleComplete`)

**Key decisions already made:**
- Use `@hello-pangea/dnd` for drag-and-drop (maintained react-beautiful-dnd fork, works with React 19)
- Status values: `'pending' | 'in-progress' | 'completed'` (lowercase, hyphenated)
- Replace `completed: boolean` entirely — derive display from `status === 'completed'`
- CRUD is available to all users (no admin gate, unlike agents)

## Constraints

**Must:**
- Follow the AgentDrawer/DeleteAgentDialog component pattern
- Use optimistic updates for drag-and-drop (same pattern as `toggleTaskComplete`)
- Group schema + type + service changes in T1 (they break together)

**Must not:**
- Add any new dependencies beyond `@hello-pangea/dnd`
- Modify unrelated pages or components
- Refactor existing service functions — only add `deleteTask`, add `status` support

**Out of scope:**
- Task filtering or sorting UI
- Assigning tasks during drag
- Real-time sync (Supabase subscriptions)

## Tasks

### T1: Schema + type + service migration (completed → status)

**Do:**
1. Supabase migration: add `status text not null default 'pending'` to `tasks` table; set `status = 'completed'` where `completed = true`; set `status = 'pending'` where `completed = false`; drop `completed` column
2. Update `Task` in `src/types/index.ts`: remove `completed: boolean`, add `status: 'pending' | 'in-progress' | 'completed'`
3. Update `transformTask` in `src/services/tasks.ts`: map `row.status` → `task.status`; remove `completed` mapping
4. Update `createTask` in `src/services/tasks.ts`: insert `status` instead of `completed`
5. Update `updateTask` in `src/services/tasks.ts`: handle `status` field
6. Add `deleteTask(id: string)` to `src/services/tasks.ts`
7. Update `useTasks.ts`: remove `toggleTaskComplete`, add `updateTask(id, data)` and `deleteTask(id)` hooks
8. Fix `TasksPage.tsx` to remove references to `completed` and `toggleTaskComplete` (minimal: just remove broken refs, leave placeholder "TODO: kanban" if needed)

**Files:** `src/types/index.ts`, `src/services/tasks.ts`, `src/hooks/useTasks.ts`, `src/pages/TasksPage.tsx`

**Verify:** `npm run build` passes with no TypeScript errors

---

### T2: TaskDrawer + DeleteTaskDialog components

**Do:**
1. Create `src/components/tasks/TaskDrawer.tsx` — Sheet form with fields: title (text), description (textarea), category (select), priority (select), status (select: pending/in-progress/completed), dueDate (date input), assignedAgentId (select populated from `useAgents()`)
2. Create `src/components/tasks/DeleteTaskDialog.tsx` — AlertDialog confirming deletion, same pattern as `DeleteAgentDialog`

**Files:** `src/components/tasks/TaskDrawer.tsx`, `src/components/tasks/DeleteTaskDialog.tsx`

**Verify:** `npm run build` passes; Manual: open drawer in isolation via Storybook or by temporarily rendering it in TasksPage

---

### T3: Kanban board with drag-and-drop

**Do:**
1. `npm install @hello-pangea/dnd`
2. Rewrite `src/pages/TasksPage.tsx`:
   - Three columns: PENDING, IN-PROGRESS, COMPLETED
   - Each column is a `<Droppable>` containing `<Draggable>` task cards
   - On `onDragEnd`: if destination column differs from source, call `updateTask(id, { status: destinationColumn })` optimistically
   - Wire "+ New Task" button → open TaskDrawer (add mode)
   - Task cards: show title, priority badge, category badge, due date, assigned agent name; clicking card opens TaskDrawer (edit mode)
   - Three-dot menu on each card → Edit / Delete (opens DeleteTaskDialog)

**Files:** `src/pages/TasksPage.tsx`, `src/components/tasks/TaskDrawer.tsx`, `src/components/tasks/DeleteTaskDialog.tsx`

**Verify:** `npm run build` passes; Manual: drag a card from PENDING → IN-PROGRESS, reload page, confirm status persisted

---

## Done

End-to-end verification after all tasks:

- [ ] `npm run build` passes with no errors
- [ ] Manual: Create a new task via "+ New Task" — appears in PENDING column
- [ ] Manual: Edit a task title — change persists after reload
- [ ] Manual: Drag task PENDING → IN-PROGRESS → COMPLETED — status updates in DB
- [ ] Manual: Delete a task — confirm dialog appears, task removed from board
- [ ] No regressions: AgentsPage, ListingsPage still load and function
