import { useRef, useState } from 'react'
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClientDocument } from '@/types'

interface DocumentsTabProps {
  documents: ClientDocument[]
  loading: boolean
  error: string | null
  onUpload: (file: File) => Promise<void>
  onDelete: (doc: ClientDocument) => Promise<void>
  getDocumentUrl: (filePath: string) => Promise<string>
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsTab({ documents, loading, error, onUpload, onDelete, getDocumentUrl }: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setActionError(null)
    try {
      // Upload sequentially so a mid-batch failure leaves a clear state.
      for (const file of Array.from(files)) {
        await onUpload(file)
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleOpen(doc: ClientDocument) {
    setBusyId(doc.id)
    setActionError(null)
    try {
      const url = await getDocumentUrl(doc.filePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not open document')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(doc: ClientDocument) {
    setBusyId(doc.id)
    setActionError(null)
    try {
      await onDelete(doc)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not delete document')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
        />
        {uploading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Drop files or <span className="text-indigo-500 underline underline-offset-2">browse</span>
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Stored privately · up to 25&nbsp;MB each</p>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {[formatBytes(doc.sizeBytes), new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={busyId === doc.id}
                onClick={() => handleOpen(doc)}
                aria-label="Download document"
              >
                {busyId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={busyId === doc.id}
                onClick={() => handleDelete(doc)}
                aria-label="Delete document"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
