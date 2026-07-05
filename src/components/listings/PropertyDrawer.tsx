import { useEffect, useState } from 'react'
import { Building2, Loader2, PenLine, ChevronLeft, ChevronRight, MapPin, DollarSign, Ruler } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { Property } from '@/types'

interface PropertyDrawerProps {
  open: boolean
  onClose: () => void
  property: Property | null  // null = Add mode, non-null = Edit mode
  onSave: (id: string | null, data: Omit<Property, 'id'>) => Promise<void>
}

export function PropertyDrawer({ open, onClose, property, onSave }: PropertyDrawerProps) {
  const [step, setStep] = useState(1)
  const [name, setName]           = useState('')
  const [city, setCity]           = useState('')
  const [stateField, setStateField] = useState('')
  const [price, setPrice]         = useState(0)
  const [beds, setBeds]           = useState(0)
  const [baths, setBaths]         = useState(0)
  const [sqft, setSqft]           = useState(0)
  const [imageUrl, setImageUrl]   = useState('')
  const [status, setStatus]       = useState<Property['status']>('available')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const totalSteps = 7

  // Pre-fill form when opening in Edit mode; blank form for Add mode
  useEffect(() => {
    if (open) {
      setStep(1)
      setName(property?.name ?? '')
      setCity(property?.location?.city ?? property?.city ?? '')
      setStateField(property?.location?.state ?? property?.state ?? '')
      setPrice(property?.price ?? 0)
      setBeds(property?.beds ?? 0)
      setBaths(property?.baths ?? 0)
      setSqft(property?.sqft ?? 0)
      setImageUrl(property?.imageUrl ?? '')
      setStatus(property?.status ?? 'available')
      setError(null)
    }
  }, [open, property])

  function canProceedToNextStep(): boolean {
    switch (step) {
      case 1: return !!name
      case 2: return !!city && !!stateField
      case 3: return price > 0
      case 4: return beds >= 0 && baths >= 0 && sqft > 0
      case 5: return !!imageUrl
      case 6: return true
      default: return true
    }
  }

  function handleNext() {
    if (canProceedToNextStep()) {
      setStep(step + 1)
      setError(null)
    } else {
      setError('Please fill in all required fields')
    }
  }

  function handlePrev() {
    setStep(step - 1)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(property?.id ?? null, {
        name,
        price,
        beds,
        baths,
        sqft,
        imageUrl,
        status,
        location: { city, state: stateField },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose() }}>
      <DialogContent className="!w-[70vw] !max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-[#2a2a3e]">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_70%)] pointer-events-none" />

        <DialogHeader className="relative z-10">
          <div className="flex gap-3 items-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 mt-1">
              {property ? <PenLine className="h-4 w-4 text-indigo-400" /> : <Building2 className="h-4 w-4 text-indigo-400" />}
            </div>
            <div>
              <DialogTitle className="text-[#e8e8f0]">{property ? 'Edit Listing' : 'Add Listing'}</DialogTitle>
              <p className="text-xs text-[#6b6b80] mt-1">
                {property ? 'Update the details for this listing' : 'Fill in the details to add a new listing'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative z-10 space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-[#6b6b80]">
              <span>Step {step} of {totalSteps}</span>
              <span className="text-[10px]">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Property Name */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8f0]">Property Name</h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase text-[#6b6b80]">Name</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Sunset Villa, Modern Apartment"
                    className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8f0] flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-400" /> Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase text-[#6b6b80]">City</label>
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Phoenix"
                      className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase text-[#6b6b80]">State</label>
                    <Input
                      value={stateField}
                      onChange={e => setStateField(e.target.value)}
                      placeholder="AZ"
                      className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Price */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8f0] flex items-center gap-2"><DollarSign className="h-4 w-4 text-indigo-400" /> Monthly Price</h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase text-[#6b6b80]">Price / Month</label>
                  <Input
                    type="number"
                    min={1}
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    placeholder="2500"
                    className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 4: Property Details */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8f0] flex items-center gap-2"><Ruler className="h-4 w-4 text-indigo-400" /> Property Details</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase text-[#6b6b80]">Bedrooms</label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={beds}
                      onChange={e => setBeds(Number(e.target.value))}
                      placeholder="3"
                      className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase text-[#6b6b80]">Bathrooms</label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={baths}
                      onChange={e => setBaths(Number(e.target.value))}
                      placeholder="2"
                      className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase text-[#6b6b80]">Square Feet</label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={sqft}
                      onChange={e => setSqft(Number(e.target.value))}
                      placeholder="2500"
                      className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Image */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8f0]">Property Image</h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase text-[#6b6b80]">Image URL</label>
                  <Input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]"
                    required
                  />
                </div>
                {imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden bg-[#222232] border border-[#2a2a3e]">
                    <img src={imageUrl} alt="Preview" className="w-full h-64 object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Status */}
            {step === 6 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8f0]">Listing Status</h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase text-[#6b6b80]">Status</label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Property['status'])}>
                    <SelectTrigger className="bg-[#222232] border-[#2a2a3e] text-[#e8e8f0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {step === 7 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-[#e8e8f0]">Review Your Listing</h3>

                <div className="border border-[#2a2a3e] rounded-lg overflow-hidden bg-[#222232]">
                  {imageUrl && (
                    <div className="w-full h-64 overflow-hidden bg-[#1a1a2e]">
                      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#e8e8f0]">{name}</h2>
                      <p className="text-sm text-[#6b6b80] mt-1">{city}, {stateField}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase text-[#6b6b80]">Price</p>
                        <p className="text-lg font-semibold text-indigo-400 mt-1">${price.toLocaleString()}<span className="text-sm text-[#6b6b80]">/mo</span></p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-[#6b6b80]">Status</p>
                        <p className="text-lg font-semibold text-indigo-400 mt-1 capitalize">{status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-[#2a2a3e]">
                      <div>
                        <p className="text-xs font-medium uppercase text-[#6b6b80]">Bedrooms</p>
                        <p className="text-lg font-semibold text-[#e8e8f0] mt-1">{beds}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-[#6b6b80]">Bathrooms</p>
                        <p className="text-lg font-semibold text-[#e8e8f0] mt-1">{baths}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-[#6b6b80]">Square Feet</p>
                        <p className="text-lg font-semibold text-[#e8e8f0] mt-1">{sqft.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </div>

        <DialogFooter className="flex justify-between bg-[#1a1a2e]/50 border-t border-[#2a2a3e]">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1 || loading}
            className="border-[#2a2a3e] text-[#e8e8f0] hover:bg-[#222232]"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {step < 7 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceedToNextStep() || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-[#2a2a3e] text-[#e8e8f0] hover:bg-[#222232]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {property ? 'Update Listing' : 'Create Listing'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
