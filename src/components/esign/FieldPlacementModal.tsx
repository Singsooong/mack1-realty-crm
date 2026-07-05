import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Loader2, MousePointerClick, PenLine, Calendar, CheckSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { FieldType, PlacedField, Signer } from '@/types'

// pdfjs needs a web worker; Vite resolves the bundled worker via the ?url import above.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// Max width (CSS px) a page can grow to inside the modal. Pages are fluid up to this cap.
const RENDER_WIDTH = 820

// SignWell interprets field x/y/size as 96-DPI px while pdf-lib/pdfjs report points (72-DPI).
const PT_TO_SW = 96 / 72

// SignWell px box sizes — MUST mirror FIELD_SIZE in the signwell-send-document edge
// function so each preview box matches where the field actually lands on the signed PDF.
const FIELD_SIZE: Record<FieldType, { w: number; h: number }> = {
  signature: { w: 140, h: 36 },
  date: { w: 110, h: 28 },
  checkbox: { w: 18, h: 18 },
}

const FIELD_META: Record<FieldType, { label: string; icon: typeof PenLine }> = {
  signature: { label: 'Signature', icon: PenLine },
  date: { label: 'Date', icon: Calendar },
  checkbox: { label: 'Checkbox', icon: CheckSquare },
}

const FIELD_TYPES = Object.keys(FIELD_META) as FieldType[]

// One colour per signer index (cycles for 6+ signers). Each field is tinted by its
// signer so the agent can see at a glance who fills what.
const SIGNER_COLORS = [
  { border: 'border-indigo-500', bg: 'bg-indigo-500/20', text: 'text-indigo-300', dot: 'bg-indigo-500' },
  { border: 'border-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-500' },
  { border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-500' },
  { border: 'border-rose-500', bg: 'bg-rose-500/20', text: 'text-rose-300', dot: 'bg-rose-500' },
  { border: 'border-sky-500', bg: 'bg-sky-500/20', text: 'text-sky-300', dot: 'bg-sky-500' },
  { border: 'border-fuchsia-500', bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', dot: 'bg-fuchsia-500' },
]
function signerColor(i: number) { return SIGNER_COLORS[i % SIGNER_COLORS.length] }

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), Math.max(min, max))
}

interface Props {
  open: boolean
  file: File | null
  signers: Signer[]
  initialFields: PlacedField[]
  onClose: () => void
  onConfirm: (fields: PlacedField[]) => void
}

/** Renders one PDF page to a canvas, drops new fields on click, and previews placed ones. */
function PdfPageCanvas({
  pdf,
  pageNumber,
  fields,
  activeType,
  onPlace,
  onMove,
  onRemove,
}: {
  pdf: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  fields: PlacedField[]
  activeType: FieldType
  onPlace: (page: number, xRatio: number, yRatio: number) => void
  onMove: (id: string, xRatio: number, yRatio: number) => void
  onRemove: (id: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  // Page geometry in points — needed to size preview boxes as a fraction of the page.
  const [dims, setDims] = useState<{ wPt: number; hPt: number } | null>(null)
  // After a drag, the cursor can end up off the box; swallow the click that follows
  // so it doesn't drop a brand-new field where the drag happened to finish.
  const suppressClick = useRef(false)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    void (async () => {
      const page = await pdf.getPage(pageNumber)
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const scale = RENDER_WIDTH / base.width
      const dpr = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: scale * dpr })

      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = '100%'
      canvas.style.height = 'auto'

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      await page.render({ canvasContext: ctx, viewport }).promise
      if (!cancelled) setDims({ wPt: base.width, hPt: base.height })
    })()

    return () => { cancelled = true }
  }, [pdf, pageNumber])

  // A field's box size as a 0–1 fraction of the page, so we can keep the whole box
  // (and its remove button) on the page when placing or dragging — matching the
  // identical clamp the edge function applies, so the preview is WYSIWYG.
  function boxRatio(type: FieldType) {
    if (!dims) return { w: 0, h: 0 }
    return {
      w: FIELD_SIZE[type].w / (dims.wPt * PT_TO_SW),
      h: FIELD_SIZE[type].h / (dims.hPt * PT_TO_SW),
    }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressClick.current) { suppressClick.current = false; return }
    const rect = e.currentTarget.getBoundingClientRect()
    const { w, h } = boxRatio(activeType)
    const xRatio = clamp((e.clientX - rect.left) / rect.width, 0, 1 - w)
    const yRatio = clamp((e.clientY - rect.top) / rect.height, 0, 1 - h)
    onPlace(pageNumber, xRatio, yRatio)
  }

  // Drag an existing box to fine-tune its spot, preserving the cursor's grab offset so
  // the box doesn't jump on first move. Position is clamped to keep it fully on-page.
  function startDrag(e: React.PointerEvent, field: PlacedField) {
    e.stopPropagation()
    e.preventDefault()
    const wrap = wrapRef.current
    if (!wrap || !dims) return
    const rect = wrap.getBoundingClientRect()
    const { w, h } = boxRatio(field.type)
    const grabDX = (e.clientX - rect.left) / rect.width - field.xRatio
    const grabDY = (e.clientY - rect.top) / rect.height - field.yRatio
    let moved = false

    function onPointerMove(ev: PointerEvent) {
      moved = true
      const xr = clamp((ev.clientX - rect.left) / rect.width - grabDX, 0, 1 - w)
      const yr = clamp((ev.clientY - rect.top) / rect.height - grabDY, 0, 1 - h)
      onMove(field.id, xr, yr)
    }
    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      if (moved) suppressClick.current = true
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const pageFields = fields.filter(f => f.page === pageNumber)

  return (
    <div
      ref={wrapRef}
      onClick={handleClick}
      className="relative mx-auto w-full cursor-crosshair shadow-sm ring-1 ring-border"
      style={{ maxWidth: RENDER_WIDTH }}
    >
      <canvas ref={canvasRef} className="block" />
      {dims && pageFields.map(f => {
        const c = signerColor(f.signerIndex)
        const size = FIELD_SIZE[f.type]
        const wPct = (size.w / (dims.wPt * PT_TO_SW)) * 100
        const hPct = (size.h / (dims.hPt * PT_TO_SW)) * 100
        const Icon = FIELD_META[f.type].icon
        return (
          <div
            key={f.id}
            onPointerDown={e => startDrag(e, f)}
            // stopPropagation so clicking an existing box doesn't drop a new one underneath it.
            onClick={e => e.stopPropagation()}
            className={`group absolute flex cursor-move touch-none select-none items-center justify-center rounded-sm border-2 ${c.border} ${c.bg}`}
            style={{ left: `${f.xRatio * 100}%`, top: `${f.yRatio * 100}%`, width: `${wPct}%`, height: `${hPct}%` }}
            title={`${FIELD_META[f.type].label} · Signer ${f.signerIndex + 1} · drag to move`}
          >
            <Icon className={`h-3 w-3 ${c.text}`} />
            <button
              type="button"
              // Don't let a click on the remove button start a drag.
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onRemove(f.id) }}
              className="absolute -right-2 -top-2 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-white group-hover:flex"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function FieldPlacementModal({ open, file, signers, initialFields, onClose, onConfirm }: Props) {
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState<PlacedField[]>(initialFields)
  const [activeSigner, setActiveSigner] = useState(0)
  const [activeType, setActiveType] = useState<FieldType>('signature')

  // Seed the working set from whatever was placed before, each time the modal opens.
  useEffect(() => {
    if (open) {
      setFields(initialFields)
      setActiveSigner(0)
      setActiveType('signature')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || !file) return
    let cancelled = false
    let loaded: pdfjsLib.PDFDocumentProxy | null = null

    setLoading(true); setError(null); setPdf(null); setNumPages(0)
    void (async () => {
      try {
        const buf = await file.arrayBuffer()
        const doc = await pdfjsLib.getDocument({ data: buf }).promise
        if (cancelled) { void doc.destroy(); return }
        loaded = doc
        setPdf(doc)
        setNumPages(doc.numPages)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not open PDF')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true; void loaded?.destroy() }
  }, [open, file])

  function place(page: number, xRatio: number, yRatio: number) {
    setFields(prev => [
      ...prev,
      { id: crypto.randomUUID(), signerIndex: activeSigner, type: activeType, page, xRatio, yRatio },
    ])
  }

  function remove(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  function moveField(id: string, xRatio: number, yRatio: number) {
    setFields(prev => prev.map(f => (f.id === id ? { ...f, xRatio, yRatio } : f)))
  }

  // Per-signer field tallies for the toolbar badges. A signer with no signature is the
  // common mistake, so we surface that count next to their chip.
  const countFor = (i: number, type?: FieldType) =>
    fields.filter(f => f.signerIndex === i && (!type || f.type === type)).length

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="w-[96vw] max-w-4xl sm:max-w-4xl max-h-[94vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MousePointerClick className="h-4 w-4" /> Place fields for each signer
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar: pick the active signer + field type, then click the document to drop it. */}
        <div className="flex flex-col gap-3 border-b border-border px-6 py-3 bg-muted/20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">Signer</span>
            {signers.map((s, i) => {
              const c = signerColor(i)
              const selected = i === activeSigner
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSigner(i)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    selected ? `${c.border} ${c.bg} text-foreground` : 'border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  {s.name?.trim() || `Signer ${i + 1}`}
                  <span className="text-[10px] text-muted-foreground">· {countFor(i)}</span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">Field</span>
            {FIELD_TYPES.map(type => {
              const { label, icon: Icon } = FIELD_META[type]
              const selected = type === activeType
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/30 px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Rendering document…
            </div>
          )}
          {error && <p className="py-20 text-center text-sm text-destructive">{error}</p>}
          {pdf && !error && (
            <div className="flex flex-col gap-4">
              {Array.from({ length: numPages }, (_, i) => (
                <div key={i + 1} className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Page {i + 1}</span>
                  <PdfPageCanvas
                    pdf={pdf}
                    pageNumber={i + 1}
                    fields={fields}
                    activeType={activeType}
                    onPlace={place}
                    onMove={moveField}
                    onRemove={remove}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border sm:justify-between">
          <span className="text-xs text-muted-foreground self-center">
            {fields.length === 0
              ? `Click the document to drop a ${FIELD_META[activeType].label.toLowerCase()} for ${signers[activeSigner]?.name?.trim() || `Signer ${activeSigner + 1}`}.`
              : `${fields.length} field${fields.length === 1 ? '' : 's'} placed · drag to reposition, hover to remove.`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onConfirm(fields)} disabled={fields.length === 0}>Done</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
