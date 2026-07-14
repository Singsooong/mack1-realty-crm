import { useState } from 'react'
import { ChevronLeft, ChevronRight, BedDouble, Bath, Square, MapPin, Car, User, Users, TreePine, Layers } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Property } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-700 text-white',
  sold: 'bg-zinc-500 text-white',
  pending: 'bg-amber-600 text-white',
}

interface ListingPreviewModalProps {
  property: Property | null
  open: boolean
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? '—'}</span>
    </div>
  )
}

function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value?: number | string; label: string }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      <span>{label}</span>
    </div>
  )
}

/** Badge labels derived from a property's truthy amenity flags. */
function getFeatureTags(property: Property): string[] {
  const tags: string[] = []
  if (property.pool) tags.push('Pool')
  if (property.waterfront) tags.push('Waterfront')
  if (property.golfCourse) tags.push('Golf Course')
  if (property.basement) tags.push('Basement')
  if (property.garage) tags.push(property.garage === 1 ? '1-Car Garage' : `${property.garage}-Car Garage`)
  if (property.view) tags.push(property.view)
  // HOA shows monthly dues inline when we have them, otherwise just the flag.
  if (property.hoa) tags.push(property.hoaDues ? `HOA · $${property.hoaDues}/mo` : 'HOA')
  return tags
}

export function ListingPreviewModal({ property, open, onClose }: ListingPreviewModalProps) {
  const [imageIndex, setImageIndex] = useState(0)

  if (!property) return null

  const images = (property.imageUrls && property.imageUrls.length > 0)
    ? property.imageUrls
    : property.imageUrl ? [property.imageUrl] : []

  const name = property.name || property.address || 'Untitled Property'
  const city = property.location?.city || property.city
  const state = property.location?.state || property.state
  const price = property.price || property.listPrice || 0
  const status = property.status || 'available'
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const featureTags = getFeatureTags(property)


  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setImageIndex(0) } }}>
      <DialogContent style={{ width: '980px', maxWidth: '980px' }} className="p-0 gap-0 overflow-hidden h-[92vh] max-h-[92vh]">
        <div className="grid grid-cols-1 md:grid-cols-[520px_1fr] h-full min-h-0">

          {/* ── Left: Image Gallery ── */}
          <div className="flex flex-col border-r border-border min-h-0">
            {/* Main image — black bg, object-contain so portrait images don't crop */}
            <div className="relative flex-1 min-h-[320px] md:min-h-0 overflow-hidden group bg-black">
              {images.length > 0 ? (
                <img
                  src={images[imageIndex]}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                  No image available
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setImageIndex((p) => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto shrink-0 bg-black border-t border-white/10">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      idx === imageIndex
                        ? 'border-foreground opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Property Details ── */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex flex-col gap-5 p-6 shrink-0">

              {/* Name + Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-medium text-foreground uppercase leading-tight">
                    {name}
                  </h2>
                  {(city || state) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{[city, state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
                <Badge className={`shrink-0 text-xs font-medium capitalize mt-0.5 ${STATUS_STYLES[status]}`}>
                  {statusLabel}
                </Badge>
              </div>

              {/* Tags row */}
              {(property.subType || property.style || property.sqft) && (
                <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                  {property.subType && (
                    <>
                      <span className="font-medium text-foreground">{property.subType}</span>
                      <span className="text-border">|</span>
                    </>
                  )}
                  {property.style && (
                    <>
                      <span>{property.style}</span>
                      <span className="text-border">|</span>
                    </>
                  )}
                  {property.sqft && (
                    <span>Size: {property.sqft.toLocaleString()} sqft</span>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {price > 0 ? `$${price.toLocaleString()}` : '—'}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                {property.listPrice && property.price && property.listPrice !== property.price && (
                  <p className="text-sm text-muted-foreground">
                    List price: <span className="font-medium text-foreground">${property.listPrice.toLocaleString()}</span>
                  </p>
                )}
              </div>

              {/* Key Specs */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 py-3 border-y border-border">
                <StatPill icon={BedDouble} value={property.beds} label="Beds" />
                <StatPill icon={Bath} value={property.baths} label="Baths" />
                <StatPill icon={Square} value={property.sqft?.toLocaleString()} label="sqft" />
                <StatPill icon={Car} value={property.garage} label="Garage" />
                <StatPill icon={Layers} value={property.stories} label="Stories" />
                {property.pool && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TreePine className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium text-foreground">Pool</span>
                  </div>
                )}
              </div>

              {/* Feature Tags */}
              {featureTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {featureTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}


            </div>

            {/* ── Tabs: Details / Features / Location / Schools ── */}
            <div className="border-t border-border">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 gap-0">
                  {[
                    { value: 'details', label: 'Details' },
                    { value: 'features', label: 'Features' },
                    { value: 'location', label: 'Location' },
                    { value: 'schools', label: 'Schools' },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="p-5 m-0 h-[369px] flex-none overflow-y-auto">
                  {property.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {property.description}
                    </p>
                  )}
                  <div className="flex flex-col">
                    <DetailRow label="Year Built" value={property.yearBuilt} />
                    <DetailRow label="Style" value={property.style} />
                    <DetailRow label="Sub-Type" value={property.subType} />
                    <DetailRow label="Stories" value={property.stories} />
                    <DetailRow label="Garage Spaces" value={property.garage} />
                    <DetailRow label="Acreage" value={property.acreage ? `${property.acreage} ac` : null} />
                    <DetailRow label="View" value={property.view} />
                    <DetailRow label="Building Name" value={property.buildingName} />
                    <DetailRow label="Unit Floor" value={property.unitFloor} />
                    <DetailRow label="HOA Dues" value={property.hoaDues ? `$${property.hoaDues}/mo` : null} />
                    {property.basement !== undefined && (
                      <DetailRow label="Basement" value={property.basement ? 'Yes' : 'No'} />
                    )}
                  </div>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="p-5 m-0 h-[369px] flex-none overflow-y-auto">
                  {featureTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {featureTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs font-normal py-1 px-2.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <DetailRow label="MLS #" value={property.mlsNumber} />
                    <DetailRow label="Listing Office" value={property.listingOffice} />
                    <DetailRow label="MLS Agent" value={property.mlsAgentName} />
                    <DetailRow label="Seller" value={property.seller} />
                    {property.agent1Name && (
                      <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Primary Agent</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {property.agent1Name}
                        </div>
                      </div>
                    )}
                    {property.agent2Name && (
                      <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Co-Agent</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {property.agent2Name}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="p-5 m-0 h-[369px] flex-none overflow-y-auto">
                  <div className="flex flex-col">
                    <DetailRow label="Address" value={property.address} />
                    <DetailRow label="City" value={city} />
                    <DetailRow label="State" value={state} />
                    <DetailRow label="Zip Code" value={property.zipCode} />
                    <DetailRow label="Country" value={property.country} />
                    <DetailRow label="Community" value={property.communityName} />
                    <DetailRow label="Area" value={property.area} />
                    <DetailRow label="Sub-Area" value={property.subArea} />
                    <DetailRow label="School District" value={property.schoolDistrict} />
                  </div>
                </TabsContent>

                {/* Schools Tab */}
                <TabsContent value="schools" className="p-5 m-0 h-[369px] flex-none overflow-y-auto">
                  <div className="flex flex-col">
                    <DetailRow label="High School" value={property.highSchool} />
                    <DetailRow label="Jr. High School" value={property.jrHighSchool} />
                    <DetailRow label="Elementary School" value={property.elementarySchool} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
