import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Users, Home, FileText, Briefcase, ChevronRight, ChevronLeft, Upload, X, Search, BedDouble, Bath, Square } from 'lucide-react'
import { searchMlsListings, type MlsSearchResult } from '@/services/mls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
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
} from '@/components/ui/dialog'
import { fetchAgents } from '@/services/agents'
import type { Agent, Property } from '@/types'

interface ListingFormProps {
  open: boolean
  onClose: () => void
  property: Property | null
  onSave: (id: string | null, data: Omit<Property, 'id'>, imageFiles: File[]) => Promise<void>
}

const STEPS = [
  {
    id: 'listing',
    title: 'Listing Information',
    description: 'Basic listing details',
    icon: Briefcase,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Agent and office details',
    icon: Users,
  },
  {
    id: 'location',
    title: 'Location Details',
    description: 'Address and location info',
    icon: MapPin,
  },
  {
    id: 'details',
    title: 'Property Details',
    description: 'Features and specifications',
    icon: Home,
  },
  {
    id: 'description',
    title: 'Description & Media',
    description: 'Property description and images',
    icon: FileText,
  },
  {
    id: 'preview',
    title: 'Review Listing',
    description: 'Verify all details before submitting',
    icon: FileText,
  },
]

export function ListingForm({ open, onClose, property, onSave }: ListingFormProps) {
  const [formData, setFormData] = useState<Partial<Property>>({})
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageFilePreviews, setImageFilePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [mlsSearching, setMlsSearching] = useState(false)
  const [mlsResults, setMlsResults] = useState<MlsSearchResult[] | null>(null)
  const [mlsSearchError, setMlsSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormData(property ?? {})
      setImageFiles([])
      setError(null)
      setCurrentStep(0)
      setMlsSearching(false)
      setMlsResults(null)
      setMlsSearchError(null)
    }
  }, [open, property])

  useEffect(() => {
    const urls = imageFiles.map(f => URL.createObjectURL(f))
    setImageFilePreviews(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [imageFiles])

  function updateField<K extends keyof Property>(key: K, value: Property[K]) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  async function handleMlsSearch(query: string) {
    if (!query.trim()) return
    setMlsSearching(true)
    setMlsResults(null)
    setMlsSearchError(null)
    try {
      const results = await searchMlsListings(query.trim())
      setMlsResults(results)
    } catch (e) {
      setMlsSearchError(e instanceof Error ? e.message : 'MLS search failed')
    } finally {
      setMlsSearching(false)
    }
  }

  function handleMlsSelect(result: MlsSearchResult) {
    setFormData(prev => ({
      ...prev,
      ...Object.fromEntries(Object.entries(result.data).filter(([, v]) => v !== undefined && v !== null && v !== '')),
    }))
    setMlsResults(null)
    setMlsSearchError(null)
  }

  const isLastStep = currentStep === STEPS.length - 1

  function isStepValid(): boolean {
    switch (currentStep) {
      case 0: // Listing Info
        return !!(formData.status && formData.listPrice && formData.mlsNumber)
      case 1: // Contact Info
        return !!(formData.agent1Id && formData.agent1Name && formData.mlsAgentName && formData.listingOffice)
      case 2: // Location
        return !!(formData.address && formData.city && formData.state && formData.zipCode)
      case 3: // Details
        return !!(formData.beds !== undefined && formData.baths !== undefined && formData.sqft && formData.acreage !== undefined)
      case 4: // Description
        return !!(formData.description?.trim()) && (imageFiles.length + (formData.imageUrls?.length ?? 0)) >= 1
      case 5: // Preview
        return true // No validation needed
      default:
        return false
    }
  }

  async function handleSubmit() {

    setLoading(true)
    try {
      if (!formData.status) throw new Error('Status is required')
      if (!formData.listPrice) throw new Error('List Price is required')
      if (!formData.mlsNumber) throw new Error('MLS Number is required')
      if (!formData.agent1Id) throw new Error('Agent 1 is required')
      if (!formData.mlsAgentName) throw new Error('MLS Agent Name is required')
      if (!formData.listingOffice) throw new Error('Listing Office is required')
      if (!formData.address) throw new Error('Street Address is required')
      if (!formData.city) throw new Error('City is required')
      if (!formData.state) throw new Error('State is required')
      if (!formData.zipCode) throw new Error('Zip Code is required')
      if (!formData.sqft) throw new Error('SQ Feet is required')
      if (!formData.acreage && formData.acreage !== 0) throw new Error('Acreage is required')
      if (!formData.description?.trim()) throw new Error('Property description is required')
      if (imageFiles.length + (formData.imageUrls?.length ?? 0) < 1) throw new Error('At least one property image is required')

      await onSave(property?.id ?? null, formData as Omit<Property, 'id'>, imageFiles)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isFirstStep = currentStep === 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose() }}>
      <DialogContent className="w-[70vw]! max-h-[90vh] overflow-y-auto flex flex-col p-0 bg-background max-w-none!">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-medium leading-tight text-foreground">
                {property ? 'Edit Listing' : 'Create Listing'}
              </h1>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center">
              {STEPS.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-1">
                  {idx === currentStep ? (
                    <div className="flex items-center gap-2 bg-foreground text-background rounded-full px-3 py-1.5 shrink-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold whitespace-nowrap">{s.title}</span>
                    </div>
                  ) : (
                    <div
                      className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                        idx < currentStep
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  )}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all ${
                        idx < currentStep
                          ? 'bg-foreground'
                          : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-6xl mx-auto [&_input]:border-0 [&_input]:border-b [&_input]:border-border [&_input]:rounded-none [&_input]:px-0 [&_input]:bg-transparent [&_input]:shadow-none [&_input]:ring-0 [&_input]:focus-visible:ring-0 [&_input]:focus-visible:border-indigo-500 [&_input]:placeholder:text-muted-foreground/30 [&_input]:placeholder:italic [&_textarea]:border-0 [&_textarea]:border-b [&_textarea]:border-border [&_textarea]:rounded-none [&_textarea]:px-0 [&_textarea]:bg-transparent [&_textarea]:shadow-none [&_textarea]:resize-none [&_textarea]:placeholder:text-muted-foreground/30 [&_textarea]:placeholder:italic">
            {/* Step Content */}
            <div className="space-y-6 mb-8">
              {currentStep === 0 && (
                <ListingInfoFields
                  formData={formData}
                  updateField={updateField}
                  onMlsSearch={handleMlsSearch}
                  onMlsSelect={handleMlsSelect}
                  mlsSearching={mlsSearching}
                  mlsResults={mlsResults}
                  mlsSearchError={mlsSearchError}
                  onMlsDismiss={() => setMlsResults(null)}
                />
              )}
              {currentStep === 1 && <ContactInfoFields formData={formData} updateField={updateField} />}
              {currentStep === 2 && <LocationFields formData={formData} updateField={updateField} />}
              {currentStep === 3 && <DetailsFields formData={formData} updateField={updateField} />}
              {currentStep === 4 && <DescriptionFields formData={formData} updateField={updateField} imageFiles={imageFiles} setImageFiles={setImageFiles} imageFilePreviews={imageFilePreviews} />}
              {currentStep === 5 && <PreviewFields formData={formData} imageFilePreviews={imageFilePreviews} />}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 justify-between pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={isFirstStep || loading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {property ? 'Update Listing' : 'Create Listing'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  if (isStepValid()) {
                    setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))
                  }
                }}
                disabled={loading || !isStepValid()}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-8"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step Components
function ListingInfoFields({
  formData,
  updateField,
  onMlsSearch,
  onMlsSelect,
  onMlsDismiss,
  mlsSearching,
  mlsResults,
  mlsSearchError,
}: {
  formData: Partial<Property>
  updateField: <K extends keyof Property>(key: K, value: Property[K]) => void
  onMlsSearch: (query: string) => Promise<void>
  onMlsSelect: (result: MlsSearchResult) => void
  onMlsDismiss: () => void
  mlsSearching: boolean
  mlsResults: MlsSearchResult[] | null
  mlsSearchError: string | null
}) {
  return (
    <>
      <FormField label="Status" required>
        <Select value={formData.status ?? 'available'} onValueChange={(v) => updateField('status', v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="List Price" required>
        <Input
          type="number"
          min={1}
          value={formData.listPrice ?? ''}
          onChange={e => updateField('listPrice', Number(e.target.value))}
          placeholder="500000"
        />
      </FormField>

      <FormField label="MLS Number" required>
        <div className="flex items-center gap-2">
          <Input
            value={formData.mlsNumber ?? ''}
            onChange={e => { updateField('mlsNumber', e.target.value); onMlsDismiss() }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onMlsSearch(String(formData.mlsNumber ?? '')) } }}
            placeholder="Enter MLS number or address…"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => onMlsSearch(String(formData.mlsNumber ?? '').trim())}
            disabled={!String(formData.mlsNumber ?? '').trim() || mlsSearching}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-muted hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mlsSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {mlsSearching ? 'Searching…' : 'Search MLS'}
          </button>
        </div>

        {/* Results panel */}
        {mlsResults && mlsResults.length > 0 && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden shadow-lg bg-background">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{mlsResults.length} result{mlsResults.length > 1 ? 's' : ''} — select one to fill the form</span>
              <button type="button" onClick={onMlsDismiss} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="divide-y divide-border max-h-72 overflow-y-auto">
              {mlsResults.map(result => (
                <li key={result.mlsId}>
                  <button
                    type="button"
                    onClick={() => onMlsSelect(result)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent transition-colors text-left"
                  >
                    {result.thumbnail ? (
                      <img src={result.thumbnail} alt="" className="h-14 w-20 object-cover rounded-md shrink-0" />
                    ) : (
                      <div className="h-14 w-20 rounded-md bg-muted shrink-0 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{result.address}</p>
                      <p className="text-xs text-muted-foreground">{result.city}, {result.state} · MLS# {result.mlsId}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {result.listPrice != null && <span className="font-semibold text-foreground">${result.listPrice.toLocaleString()}</span>}
                        {result.beds != null && <span className="flex items-center gap-0.5"><BedDouble className="h-3 w-3" />{result.beds}</span>}
                        {result.baths != null && <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{result.baths}</span>}
                        {result.sqft != null && <span className="flex items-center gap-0.5"><Square className="h-3 w-3" />{result.sqft.toLocaleString()} sqft</span>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mlsSearchError && (
          <p className="mt-1.5 text-xs text-red-500">{mlsSearchError}</p>
        )}
      </FormField>
    </>
  )
}

function ContactInfoFields({
  formData,
  updateField,
}: {
  formData: Partial<Property>
  updateField: <K extends keyof Property>(key: K, value: Property[K]) => void
}) {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    fetchAgents().then(setAgents).catch(() => {})
  }, [])

  function selectAgent(agentId: string, slot: 1 | 2) {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return
    if (slot === 1) {
      updateField('agent1Id', agent.id as any)
      updateField('agent1Name', agent.name)
    } else {
      updateField('agent2Id', agent.id as any)
      updateField('agent2Name', agent.name)
    }
  }

  return (
    <>
      <FormField label="Agent 1" required>
        <Select value={formData.agent1Id ?? ''} onValueChange={v => selectAgent(v, 1)}>
          <SelectTrigger>
            <SelectValue placeholder="Select agent…" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <CheckboxField
        label="Add Second Agent"
        checked={formData.agent2Id !== undefined}
        onChange={(checked) => {
          if (!checked) {
            updateField('agent2Id', undefined as any)
            updateField('agent2Name', undefined as any)
          } else {
            updateField('agent2Id', '' as any)
          }
        }}
      />

      {formData.agent2Id !== undefined && (
        <FormField label="Agent 2">
          <Select value={formData.agent2Id ?? ''} onValueChange={v => selectAgent(v, 2)}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent…" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      <FormField label="MLS Agent Name" required>
        <Input
          value={formData.mlsAgentName ?? ''}
          onChange={e => updateField('mlsAgentName', e.target.value)}
          placeholder="Robert Johnson"
        />
      </FormField>

      <FormField label="Listing Office" required>
        <Input
          value={formData.listingOffice ?? ''}
          onChange={e => updateField('listingOffice', e.target.value)}
          placeholder="Phoenix Realty"
        />
      </FormField>

      <FormField label="Seller">
        <Input
          value={formData.seller ?? ''}
          onChange={e => updateField('seller', e.target.value)}
          placeholder="Seller Name"
        />
      </FormField>
    </>
  )
}

function LocationFields({
  formData,
  updateField,
}: {
  formData: Partial<Property>
  updateField: <K extends keyof Property>(key: K, value: Property[K]) => void
}) {
  return (
    <>
      <FormField label="Street Address" required>
        <Input
          value={formData.address ?? ''}
          onChange={e => updateField('address', e.target.value)}
          placeholder="123 Main Street"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="City" required>
          <Input
            value={formData.city ?? ''}
            onChange={e => updateField('city', e.target.value)}
            placeholder="Phoenix"
          />
        </FormField>
        <FormField label="State" required>
          <Input
            value={formData.state ?? ''}
            onChange={e => updateField('state', e.target.value)}
            placeholder="AZ"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Zip Code" required>
          <Input
            value={formData.zipCode ?? ''}
            onChange={e => updateField('zipCode', e.target.value)}
            placeholder="85001"
          />
        </FormField>
        <FormField label="Country">
          <Input
            value={formData.country ?? ''}
            onChange={e => updateField('country', e.target.value)}
            placeholder="USA"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Area">
          <Input
            value={formData.area ?? ''}
            onChange={e => updateField('area', e.target.value)}
            placeholder="Downtown"
          />
        </FormField>
        <FormField label="Sub Area">
          <Input
            value={formData.subArea ?? ''}
            onChange={e => updateField('subArea', e.target.value)}
            placeholder="Historic District"
          />
        </FormField>
      </div>

      <FormField label="Community Name">
        <Input
          value={formData.communityName ?? ''}
          onChange={e => updateField('communityName', e.target.value)}
          placeholder="Sunset Estates"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="School District">
          <Input
            value={formData.schoolDistrict ?? ''}
            onChange={e => updateField('schoolDistrict', e.target.value)}
            placeholder="Phoenix USD"
          />
        </FormField>
        <FormField label="High School">
          <Input
            value={formData.highSchool ?? ''}
            onChange={e => updateField('highSchool', e.target.value)}
            placeholder="Central High"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Jr. High School">
          <Input
            value={formData.jrHighSchool ?? ''}
            onChange={e => updateField('jrHighSchool', e.target.value)}
            placeholder="Lincoln Jr. High"
          />
        </FormField>
        <FormField label="Elementary School">
          <Input
            value={formData.elementarySchool ?? ''}
            onChange={e => updateField('elementarySchool', e.target.value)}
            placeholder="Roosevelt Elementary"
          />
        </FormField>
      </div>

      <div className="space-y-3 pt-2">
        <div className="text-sm font-medium text-foreground">Special Features</div>
        <CheckboxField
          label="View"
          checked={formData.view ? true : false}
          onChange={(checked) => updateField('view', checked ? 'yes' : undefined as any)}
        />
        <CheckboxField
          label="Waterfront"
          checked={formData.waterfront ?? false}
          onChange={(checked) => updateField('waterfront', checked)}
        />
        <CheckboxField
          label="Golf Course"
          checked={formData.golfCourse ?? false}
          onChange={(checked) => updateField('golfCourse', checked)}
        />
      </div>
    </>
  )
}

function DetailsFields({
  formData,
  updateField,
}: {
  formData: Partial<Property>
  updateField: <K extends keyof Property>(key: K, value: Property[K]) => void
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Beds" required>
          <Input
            type="number"
            min={0}
            value={formData.beds ?? ''}
            onChange={e => updateField('beds', Number(e.target.value))}
          />
        </FormField>
        <FormField label="Baths" required>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={formData.baths ?? ''}
            onChange={e => updateField('baths', Number(e.target.value))}
          />
        </FormField>
        <FormField label="Garage">
          <Input
            type="number"
            min={0}
            value={formData.garage ?? ''}
            onChange={e => updateField('garage', Number(e.target.value))}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="SQ Feet" required>
          <Input
            type="number"
            min={1}
            value={formData.sqft ?? ''}
            onChange={e => updateField('sqft', Number(e.target.value))}
            placeholder="3500"
          />
        </FormField>
        <FormField label="Acreage" required>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={formData.acreage ?? ''}
            onChange={e => updateField('acreage', Number(e.target.value))}
            placeholder="0.50"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Stories">
          <Input
            type="number"
            min={1}
            value={formData.stories ?? ''}
            onChange={e => updateField('stories', Number(e.target.value))}
          />
        </FormField>
        <FormField label="Year Built">
          <Input
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            value={formData.yearBuilt ?? ''}
            onChange={e => updateField('yearBuilt', Number(e.target.value))}
          />
        </FormField>
      </div>

      <div className="space-y-3">
        <CheckboxField
          label="Cart Port"
          checked={formData.cartPort ? true : false}
          onChange={(checked) => updateField('cartPort', checked ? 1 : undefined as any)}
        />
        <CheckboxField
          label="Pool"
          checked={formData.pool ?? false}
          onChange={(checked) => updateField('pool', checked)}
        />
        <CheckboxField
          label="Basement"
          checked={formData.basement ?? false}
          onChange={(checked) => updateField('basement', checked)}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Building Name">
          <Input
            value={formData.buildingName ?? ''}
            onChange={e => updateField('buildingName', e.target.value)}
          />
        </FormField>
        <FormField label="Unit/Floor">
          <Input
            value={formData.unitFloor ?? ''}
            onChange={e => updateField('unitFloor', e.target.value)}
          />
        </FormField>
      </div>

      <CheckboxField
        label="HOA"
        checked={formData.hoa ?? false}
        onChange={(checked) => updateField('hoa', checked)}
      />

      {formData.hoa && (
        <FormField label="HOA Dues">
          <Input
            type="number"
            min={0}
            value={formData.hoaDues ?? ''}
            onChange={e => updateField('hoaDues', Number(e.target.value))}
            placeholder="500"
          />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Style">
          <Input
            value={formData.style ?? ''}
            onChange={e => updateField('style', e.target.value)}
            placeholder="Contemporary"
          />
        </FormField>
        <FormField label="Sub Type/Category">
          <Input
            value={formData.subType ?? ''}
            onChange={e => updateField('subType', e.target.value)}
            placeholder="Single Family"
          />
        </FormField>
      </div>
    </>
  )
}

function DescriptionFields({
  formData,
  updateField,
  imageFiles,
  setImageFiles,
  imageFilePreviews,
}: {
  formData: Partial<Property>
  updateField: <K extends keyof Property>(key: K, value: Property[K]) => void
  imageFiles: File[]
  setImageFiles: (files: File[]) => void
  imageFilePreviews: string[]
}) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | null) {
    if (!files) return
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (images.length) setImageFiles([...imageFiles, ...images])
  }

  function removeFile(idx: number) {
    setImageFiles(imageFiles.filter((_, i) => i !== idx))
  }

  function removeExistingUrl(url: string) {
    updateField('imageUrls', (formData.imageUrls ?? []).filter(u => u !== url) as any)
  }

  const totalImages = imageFiles.length + (formData.imageUrls?.length ?? 0)

  return (
    <>
      <FormField label="Property Description" required>
        <Textarea
          value={formData.description ?? ''}
          onChange={e => updateField('description', e.target.value)}
          placeholder="Add a detailed description of the property..."
          rows={6}
          className="resize-none"
        />
      </FormField>

      <div className="flex flex-col gap-2 pb-1">
        <label className="text-xs font-medium text-muted-foreground uppercase">
          Property Images
          <span className="text-red-500 ml-1">*</span>
          <span className="ml-2 normal-case font-normal text-muted-foreground/70">
            — {totalImages} image{totalImages !== 1 ? 's' : ''} added
          </span>
        </label>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setIsDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
              : 'border-border hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-muted/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = '' }}
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop images here or <span className="text-indigo-500 underline-offset-2 underline">browse files</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP · Multiple images supported</p>
        </div>

        {/* Thumbnail grid */}
        {totalImages > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-2">
            {(formData.imageUrls ?? []).map((url, i) => (
              <div key={`existing-${i}`} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeExistingUrl(url) }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {imageFilePreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 text-[9px] bg-indigo-500 text-white px-1 py-0.5 rounded">NEW</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(i) }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function PreviewFields({
  formData,
  imageFilePreviews,
}: {
  formData: Partial<Property>
  imageFilePreviews: string[]
}) {
  const allPreviews = [...(formData.imageUrls ?? []), ...imageFilePreviews]
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      {allPreviews.length > 0 && (
        <div className="space-y-2">
          {/* Main image */}
          <div className="relative rounded-lg overflow-hidden bg-black border border-border aspect-video group">
            <img
              src={allPreviews[activeIndex]}
              alt={formData.address}
              className="w-full h-full object-contain"
            />
            {allPreviews.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveIndex((p) => (p - 1 + allPreviews.length) % allPreviews.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((p) => (p + 1) % allPreviews.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeIndex + 1} / {allPreviews.length}
                </div>
              </>
            )}
          </div>
          {/* Thumbnail strip */}
          {allPreviews.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allPreviews.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    i === activeIndex
                      ? 'border-indigo-500 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing Info */}
      <div className="bg-muted/40 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
          <p className="text-sm font-medium text-foreground mt-1 capitalize">{formData.status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">List Price</p>
          <p className="text-lg font-semibold text-foreground mt-1">${(formData.listPrice ?? 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">MLS Number</p>
          <p className="text-sm font-medium text-foreground mt-1">{formData.mlsNumber}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-t border-border pt-4">
        <h4 className="font-semibold text-foreground mb-3">Contact Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Agent 1</p>
            <p className="text-foreground mt-1">{formData.agent1Name}</p>
          </div>
          {formData.agent2Name && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Agent 2</p>
              <p className="text-foreground mt-1">{formData.agent2Name}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">MLS Agent</p>
            <p className="text-foreground mt-1">{formData.mlsAgentName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Office</p>
            <p className="text-foreground mt-1">{formData.listingOffice}</p>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="border-t border-border pt-4">
        <h4 className="font-semibold text-foreground mb-3">Location</h4>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Address</p>
            <p className="text-foreground mt-1">{formData.address}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">City</p>
              <p className="text-foreground mt-1">{formData.city}, {formData.state} {formData.zipCode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Area</p>
              <p className="text-foreground mt-1">{formData.area || formData.communityName || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="border-t border-border pt-4">
        <h4 className="font-semibold text-foreground mb-3">Property Details</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Beds</p>
            <p className="text-lg font-semibold text-foreground mt-1">{formData.beds}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Baths</p>
            <p className="text-lg font-semibold text-foreground mt-1">{formData.baths}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">SQ Feet</p>
            <p className="text-lg font-semibold text-foreground mt-1">{(formData.sqft ?? 0).toLocaleString()}</p>
          </div>
        </div>
        {formData.pool && (
          <div className="mt-3 text-xs">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded">Pool</span>
          </div>
        )}
      </div>

      {/* Description */}
      {formData.description && (
        <div className="border-t border-border pt-4">
          <h4 className="font-semibold text-foreground mb-2">Description</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{formData.description}</p>
        </div>
      )}
    </div>
  )
}

// Helper Components
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pb-1">
      <label className="text-xs font-medium text-muted-foreground uppercase">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={label} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={label} className="text-sm font-medium cursor-pointer text-foreground">
        {label}
      </label>
    </div>
  )
}
