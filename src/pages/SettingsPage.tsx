import { useEffect, useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { updateAgent, uploadAgentAvatar } from '@/services/agents'
import { toast } from 'sonner'

export function SettingsPage() {
  const { agentRecord, refreshAgentRecord } = useAuth()

  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(agentRecord?.name ?? '')
    setAvatarPreview(agentRecord?.avatarUrl ?? '')
    setAvatarFile(undefined)
  }, [agentRecord])

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
    setAvatarPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!agentRecord) return
    setLoading(true)
    try {
      let avatarUrl = agentRecord.avatarUrl ?? ''
      if (avatarFile) {
        avatarUrl = await uploadAgentAvatar(avatarFile)
      } else if (!avatarPreview) {
        avatarUrl = ''
      }
      await updateAgent(agentRecord.id, { name, avatarUrl })
      await refreshAgentRecord()
      toast.success('Profile updated')
      setAvatarFile(undefined)
    } catch (err) {
      toast.error('Failed to save', { description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const isDirty =
    name !== (agentRecord?.name ?? '') ||
    !!avatarFile ||
    avatarPreview !== (agentRecord?.avatarUrl ?? '')

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-heading-xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase text-muted-foreground">Profile Photo</label>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault()
                  setIsDragging(false)
                  handleAvatarFile(e.dataTransfer.files[0] ?? null)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`h-20 w-20 rounded-full border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden ${
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
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p>Drag &amp; drop or click to upload.</p>
              <p className="mt-0.5">PNG, JPG, WEBP · Max 5 MB</p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase text-muted-foreground">Full Name</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            required
          />
        </div>

        {/* Email — read-only */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase text-muted-foreground">Email</label>
          <Input value={agentRecord?.email ?? ''} disabled />
          <p className="text-xs text-muted-foreground">Email cannot be changed. Contact an admin.</p>
        </div>

        <div className="flex gap-3 pt-2 border-t border-border">
          <Button type="submit" disabled={loading || !isDirty}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName(agentRecord?.name ?? '')
                setAvatarPreview(agentRecord?.avatarUrl ?? '')
                setAvatarFile(undefined)
              }}
              disabled={loading}
            >
              Discard
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
