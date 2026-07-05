import { useEffect, useRef, useState } from 'react'
import { Loader2, UserCog, UserPlus, Eye, EyeOff, Upload, X } from 'lucide-react'
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
import type { Agent } from '@/types'

type AgentFormData = Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>

interface AgentDrawerProps {
  open: boolean
  onClose: () => void
  agent: Agent | null  // null = Add mode, non-null = Edit mode
  onSave: (id: string | null, data: AgentFormData, password?: string, avatarFile?: File) => Promise<void>
}

export function AgentDrawer({ open, onClose, agent, onSave }: AgentDrawerProps) {
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [specialty, setSpecialty]   = useState('')
  const [avatarUrl, setAvatarUrl]   = useState('')
  const [status, setStatus]         = useState<Agent['status']>('active')
  const [role, setRole]             = useState<Agent['role']>('agent')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-fill in Edit mode; clear in Add mode
  useEffect(() => {
    if (open) {
      setName(agent?.name ?? '')
      setEmail(agent?.email ?? '')
      setPhone(agent?.phone ?? '')
      setSpecialty(agent?.specialty ?? '')
      setAvatarUrl(agent?.avatarUrl ?? '')
      setStatus(agent?.status ?? 'active')
      setRole(agent?.role ?? 'agent')
      setPassword('')
      setAvatarFile(undefined)
      setAvatarPreview(agent?.avatarUrl ?? '')
      setError(null)
    }
  }, [open, agent])

  useEffect(() => {
    if (!avatarFile) return
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  function handleAvatarFile(file: File | null) {
    if (!file || !file.type.startsWith('image/')) return
    setAvatarFile(file)
  }

  function clearAvatar() {
    setAvatarFile(undefined)
    setAvatarUrl('')
    setAvatarPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(agent?.id ?? null, { name, email, phone, specialty, avatarUrl, status, role }, password || undefined, avatarFile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v && !loading) onClose() }}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="relative overflow-hidden bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-[#2a2a3e] p-6 pb-5">
          <div className="absolute top-0 right-0 h-32 w-32 bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 mb-3">
            {agent ? <UserCog className="h-4 w-4 text-indigo-400" /> : <UserPlus className="h-4 w-4 text-indigo-400" />}
          </div>
          <SheetTitle className="text-[#e8e8f0]">{agent ? 'Edit Agent' : 'Add New Agent'}</SheetTitle>
          <p className="text-xs text-[#6b6b80] mt-1">
            {agent ? 'Update this agent\'s profile and access' : 'Create a login account for a new team member'}
          </p>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              disabled={!!agent}
            />
            {agent && (
              <p className="text-xs text-muted-foreground">Email cannot be changed after creation.</p>
            )}
          </div>
          {!agent && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Password (Optional)</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank for auto-generated"
              />
              <p className="text-xs text-muted-foreground">If left blank, a temporary password will be generated and shown after creation.</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Phone</label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Specialty</label>
            <Input
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="Residential"
            />
          </div>
          {agent && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase text-muted-foreground">Reset Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-muted rounded"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter new temporary password"
              />
              <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Profile Photo</label>
            <div className="flex justify-center pt-1 pb-2">
              <div className="relative">
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragging(false)
                    handleAvatarFile(e.dataTransfer.files[0] ?? null)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-24 w-24 rounded-full border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : avatarPreview
                        ? 'border-transparent'
                        : 'border-border hover:border-indigo-400 hover:bg-muted/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { handleAvatarFile(e.target.files?.[0] ?? null); e.target.value = '' }}
                  />
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <p className="text-[10px] text-muted-foreground text-center leading-tight px-2">
                        Drop photo<br />or click
                      </p>
                    </>
                  )}
                </div>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={clearAvatar}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">PNG, JPG, WEBP · Single image</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Status</label>
              <Select value={status} onValueChange={v => setStatus(v as Agent['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Role</label>
              <Select value={role} onValueChange={v => setRole(v as Agent['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
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
