import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ClientNote } from '@/types'

interface NotesTabProps {
  notes: ClientNote[]
  loading: boolean
  error: string | null
  onAdd: (body: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function NotesTab({ notes, loading, error, onAdd, onRemove }: NotesTabProps) {
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = body.trim()
    if (!trimmed) return
    setSaving(true)
    setActionError(null)
    try {
      await onAdd(trimmed)
      setBody('')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a note or remark about this client…"
          className="min-h-20"
        />
        <div className="flex items-center justify-between">
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : <span />}
          <Button onClick={handleAdd} disabled={saving || !body.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notes…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map(note => (
            <li key={note.id} className="group rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{note.body}</p>
                <button
                  type="button"
                  onClick={() => onRemove(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {note.authorName ?? 'Unknown'} · {formatTimestamp(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
