import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, FileSignature, Upload, X, Paperclip, MousePointerClick, Info, Plus, Trash2, PenLine, Calendar, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { useContacts } from '@/hooks/useContacts'
import { useProperties } from '@/hooks/useProperties'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { FieldType, PlacedField, SendDocumentPayload, Signer } from '@/types'

// Lazy so pdfjs (~1.7 MB) only downloads when an agent actually opens the placement modal.
const FieldPlacementModal = lazy(() =>
  import('./FieldPlacementModal').then(m => ({ default: m.FieldPlacementModal })),
)

const FIELD_ICON: Record<FieldType, typeof PenLine> = {
  signature: PenLine,
  date: Calendar,
  checkbox: CheckSquare,
}

interface Props {
  open: boolean
  onClose: () => void
  agentId: string
  onSend: (payload: SendDocumentPayload) => Promise<void>
}

function emptySigner(): Signer {
  return { name: '', email: '', phone: '' }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// The send-time gate: returns an error string to block sending (shown to the agent),
// or null to allow it. A signer with no signature can't actually sign, and SignWell
// rejects recipients that have no fields — so we require ≥1 signature per signer.
function validateBeforeSend(signers: Signer[], fields: PlacedField[], docFile: File | null): string | null {
  if (!docFile) return 'Please attach a document PDF.'
  if (signers.length === 0) return 'Add at least one signer.'
  for (let i = 0; i < signers.length; i++) {
    if (!signers[i].name.trim() || !signers[i].email.trim()) {
      return `Signer ${i + 1} needs both a name and an email.`
    }
  }
  const missing = signers
    .map((s, i) => ({ label: s.name.trim() || `Signer ${i + 1}`, i }))
    .filter(({ i }) => !fields.some(f => f.signerIndex === i && f.type === 'signature'))
  if (missing.length > 0) {
    return `Place at least one signature for: ${missing.map(m => m.label).join(', ')}.`
  }
  return null
}

export function SendDocumentDrawer({ open, onClose, agentId, onSend }: Props) {
  const [title, setTitle]       = useState('')
  const [property, setProperty] = useState('')
  const [signers, setSigners]   = useState<Signer[]>([emptySigner()])
  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [docFile, setDocFile]   = useState<File | null>(null)
  const [fields, setFields]     = useState<PlacedField[]>([])
  const [placeOpen, setPlaceOpen] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const docInputRef = useRef<HTMLInputElement>(null)

  // Bind property + signer-name fields to existing CRM records (free typing still allowed).
  const { contacts, loading: contactsLoading } = useContacts()
  const { properties, loading: propertiesLoading } = useProperties()

  const propertyOptions = useMemo<ComboboxOption[]>(() =>
    properties.map(p => {
      const label = p.address || p.name || 'Untitled property'
      const description = [p.city, p.state].filter(Boolean).join(', ') || undefined
      return { value: label, label, description }
    }), [properties])

  const contactOptions = useMemo<ComboboxOption[]>(() =>
    contacts.map(c => ({ value: c.name, label: c.name, description: c.email })), [contacts])

  useEffect(() => {
    if (open) {
      setTitle(''); setProperty('')
      setSigners([emptySigner()])
      setSubject(''); setMessage('')
      setDocFile(null); setError(null)
      setFields([]); setPlaceOpen(false)
    }
  }, [open])

  function updateSigner(i: number, patch: Partial<Signer>) {
    setSigners(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function addSigner() {
    setSigners(prev => [...prev, emptySigner()])
  }

  // Removing a signer drops their placed fields and re-indexes fields for later signers
  // so every field still points at the right person.
  function removeSigner(i: number) {
    setFields(prev => prev
      .filter(f => f.signerIndex !== i)
      .map(f => (f.signerIndex > i ? { ...f, signerIndex: f.signerIndex - 1 } : f)))
    setSigners(prev => prev.filter((_, idx) => idx !== i))
  }

  // The placer needs fully-specified signers so each can be assigned fields.
  const signersReady = signers.length > 0 && signers.every(s => s.name.trim() && s.email.trim())
  const canPlace = !!docFile && signersReady

  // Attaching a PDF resets any prior placement and, when the signers are ready, opens the
  // placer straight away so fields can be dropped immediately (no extra click).
  function handleDocSelected(file: File | null) {
    setDocFile(file)
    setFields([])
    if (file && signersReady) setPlaceOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateBeforeSend(signers, fields, docFile)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)
    try {
      const fileBase64 = await fileToBase64(docFile!)
      await onSend({
        title,
        property,
        signers,
        fileBase64,
        fileName: docFile!.name,
        agentId,
        fields,
        subject: subject.trim() || undefined,
        message: message.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-[480px] flex flex-col">
        <SheetHeader className="relative overflow-hidden bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-[#2a2a3e] p-6 pb-5">
          <div className="absolute top-0 right-0 h-32 w-32 bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 mb-3">
            <FileSignature className="h-4 w-4 text-indigo-400" />
          </div>
          <SheetTitle className="text-[#e8e8f0]">New Document</SheetTitle>
          <p className="text-xs text-[#6b6b80] mt-1">Attach a PDF, add signers, and place their fields</p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-y-auto px-6 py-5">
          {/* Document details */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Document</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Title *</label>
              <Input placeholder="e.g. Purchase Agreement" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Property</label>
              <Combobox
                value={property}
                onValueChange={setProperty}
                options={propertyOptions}
                loading={propertiesLoading}
                placeholder="Select a listing or type an address"
              />
            </div>
          </div>

          {/* Signers — one or more clients, all able to sign simultaneously */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase">Signers *</p>
              <button type="button" onClick={addSigner} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add signer
              </button>
            </div>

            {signers.map((s, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Signer {i + 1}</span>
                  {signers.length > 1 && (
                    <button type="button" onClick={() => removeSigner(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Combobox
                  value={s.name}
                  onValueChange={v => updateSigner(i, { name: v })}
                  options={contactOptions}
                  loading={contactsLoading}
                  placeholder="Full name *"
                  // Picking a contact pulls in their email + phone; matched by the unique email.
                  onSelectOption={opt => {
                    const c = contacts.find(c => c.email === opt.description)
                    if (c) updateSigner(i, { email: c.email, phone: c.phone })
                  }}
                />
                <Input type="email" placeholder="Email *" value={s.email} onChange={e => updateSigner(i, { email: e.target.value })} />
                <Input type="tel" placeholder="Phone" value={s.phone} onChange={e => updateSigner(i, { phone: e.target.value })} />
              </div>
            ))}
          </div>

          {/* Email to clients — overrides the default SignWell subject/body when filled in */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Email to clients</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Input placeholder="Defaults to the document title" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Add a personal note. Leave blank to use the default request to review and sign."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          </div>

          {/* File upload */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Attachment</p>
            <input ref={docInputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => handleDocSelected(e.target.files?.[0] ?? null)} />
            <button type="button"
              onClick={() => docInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm text-left w-full">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              {docFile
                ? <span className="truncate text-foreground">{docFile.name}</span>
                : <span className="text-muted-foreground">Attach document PDF *</span>}
              {docFile && (
                <button type="button" className="ml-auto shrink-0" onClick={e => { e.stopPropagation(); handleDocSelected(null) }}>
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </button>
          </div>

          {/* Field placement — drop signature / date / checkbox fields for each signer */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Fields *</p>

            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                Attach a PDF and fill in every signer first, then place each person's
                <span className="font-medium text-foreground"> signature, date and checkbox</span> fields on the document.
              </span>
            </div>

            {fields.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2.5 text-xs">
                {signers.map((s, i) => {
                  const own = fields.filter(f => f.signerIndex === i)
                  if (own.length === 0) return null
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{s.name?.trim() || `Signer ${i + 1}`}</span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        {(['signature', 'date', 'checkbox'] as FieldType[]).map(type => {
                          const n = own.filter(f => f.type === type).length
                          if (n === 0) return null
                          const Icon = FIELD_ICON[type]
                          return <span key={type} className="flex items-center gap-0.5"><Icon className="h-3 w-3" />{n}</span>
                        })}
                      </span>
                    </div>
                  )
                })}
                <button type="button" onClick={() => setPlaceOpen(true)} className="self-start text-primary hover:underline">
                  Edit fields
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { if (canPlace) setPlaceOpen(true) }}
                disabled={!canPlace}
                title={canPlace ? undefined : 'Attach a PDF and complete every signer (name + email) first'}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {canPlace ? 'Place signer fields' : 'Attach a PDF and complete every signer first'}
                </span>
              </button>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {placeOpen && (
          <Suspense fallback={null}>
            <FieldPlacementModal
              open={placeOpen}
              file={docFile}
              signers={signers}
              initialFields={fields}
              onClose={() => setPlaceOpen(false)}
              onConfirm={(placed) => { setFields(placed); setPlaceOpen(false); setError(null) }}
            />
          </Suspense>
        )}

        <SheetFooter className="px-6 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit as never} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Send to Clients
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
