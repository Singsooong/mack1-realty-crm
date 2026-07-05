import { useEffect, useRef, useState } from 'react'
import { BookUser, Loader2, Upload, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { uploadContactAvatar } from '@/services/contacts'
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_ORDER } from '@/lib/clientStatus'
import type { Client } from '@/types'

type ClientFormData = Pick<Client, 'name' | 'email' | 'phone' | 'avatarUrl' | 'type' | 'status' | 'lastContact' | 'birthDate'>

interface ClientDrawerProps {
  open: boolean
  onClose: () => void
  client: Client | null
  onSave: (id: string | null, data: ClientFormData) => Promise<void>
}

export function ClientDrawer({ open, onClose, client, onSave }: ClientDrawerProps) {
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [avatarUrl, setAvatarUrl]     = useState('')
  const [avatarFile, setAvatarFile]   = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isDragging, setIsDragging]   = useState(false)
  const [type, setType]               = useState<Client['type']>('buyer')
  const [status, setStatus]           = useState<Client['status']>('new-inquiry')
  const [lastContact, setLastContact] = useState('')
  const [birthDate, setBirthDate]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(client?.name ?? '')
      setEmail(client?.email ?? '')
      setPhone(client?.phone ?? '')
      setAvatarUrl(client?.avatarUrl ?? '')
      setAvatarFile(null)
      setType(client?.type ?? 'buyer')
      setStatus(client?.status ?? 'new-inquiry')
      setLastContact(client?.lastContact ? client.lastContact.split('T')[0] : new Date().toISOString().split('T')[0])
      setBirthDate(client?.birthDate ? client.birthDate.split('T')[0] : '')
      setError(null)
    }
  }, [open, client])

  // Manage blob URL lifetime for the selected file preview
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('')
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  function handleFilePick(files: FileList | null) {
    if (!files) return
    const img = Array.from(files).find(f => f.type.startsWith('image/'))
    if (img) setAvatarFile(img)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        finalAvatarUrl = await uploadContactAvatar(avatarFile)
      }
      await onSave(client?.id ?? null, { name, email, phone, avatarUrl: finalAvatarUrl, type, status, lastContact, birthDate: birthDate || undefined })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const displayImage = avatarPreview || avatarUrl

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v && !loading) onClose() }}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="relative overflow-hidden bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-[#2a2a3e] p-6 pb-5">
          <div className="absolute top-0 right-0 h-32 w-32 bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 mb-3">
            {client ? <BookUser className="h-4 w-4 text-indigo-400" /> : <UserPlus className="h-4 w-4 text-indigo-400" />}
          </div>
          <SheetTitle className="text-[#e8e8f0]">{client ? 'Edit Client' : 'Add New Client'}</SheetTitle>
          <p className="text-xs text-[#6b6b80] mt-1">
            {client ? 'Update this client\'s information' : 'Add a new buyer, seller, or investor to your CRM'}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          {/* Avatar uploader */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Photo</label>
            <div className="flex items-center gap-4">
              {/* Circle preview */}
              <div className="relative shrink-0">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                  {displayImage ? (
                    <img src={displayImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                {displayImage && (
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarUrl('') }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault()
                  setIsDragging(false)
                  handleFilePick(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { handleFilePick(e.target.files); e.target.value = '' }}
                />
                <p className="text-xs text-muted-foreground">
                  Drop a photo or{' '}
                  <span className="text-indigo-500 underline underline-offset-2">browse</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">JPG, PNG, WEBP</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Email Address</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Phone Number</label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Type</label>
              <Select value={type} onValueChange={v => setType(v as Client['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Status</label>
              <Select value={status} onValueChange={v => setStatus(v as Client['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUS_ORDER.map(s => (
                    <SelectItem key={s} value={s}>{CLIENT_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Last Contact Date</label>
              <Input type="date" value={lastContact} onChange={e => setLastContact(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Birthdate</label>
              <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
