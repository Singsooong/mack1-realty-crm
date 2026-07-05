import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from '@/lib/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusFilterChips, type StatusFilterValue } from '@/components/esign/StatusFilterChips'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FileSignature, Eye, Download, MoreHorizontal, Loader2, RefreshCw, ExternalLink, FileText, AlertCircle, Search } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { useAgents } from '@/hooks/useAgents'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { TablePagination } from '@/components/shared/TablePagination'
import { SendDocumentDrawer } from '@/components/esign/SendDocumentDrawer'
import { openSignedPdf } from '@/services/esign'
import { ESignPageSkeleton } from '@/components/esign/ESignPageSkeleton'
import type { Document } from '@/types'

const STATUS_STYLES: Record<Document['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  signed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function isExternalPdfUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.origin !== window.location.origin && (parsed.protocol === 'https:' || parsed.protocol === 'http:')
  } catch {
    return false
  }
}

// SignWell blocks embedding its signed-document URL in an iframe (X-Frame-Options), so
// instead of an inline preview we open the PDF in a new tab via our access-controlled proxy.
function SignedDocumentPreview({ doc }: { doc: Document }) {
  const [opening, setOpening] = useState(false)

  async function handleOpen() {
    setOpening(true)
    try {
      await openSignedPdf(doc.id)
    } catch (e) {
      toast.error('Could not open PDF', {
        description: e instanceof Error ? e.message : 'Failed to open the signed document',
      })
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/20 py-12 px-6 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950">
        <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">Document signed</p>
        <p className="text-xs text-muted-foreground mt-1">Open the signed PDF in a new tab</p>
      </div>
      <Button onClick={handleOpen} disabled={opening} className="gap-2">
        {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
        View PDF
      </Button>
    </div>
  )
}

function DocumentPreview({ doc }: { doc: Document }) {
  if (doc.status === 'signed' && doc.downloadUrl) {
    return <SignedDocumentPreview doc={doc} />
  }

  if (doc.status === 'sent' && doc.signingUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/20 py-12 px-6 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">Document sent — awaiting signature</p>
          <p className="text-xs text-muted-foreground mt-1">
            The signing link was sent to <span className="font-medium text-foreground">{doc.clientEmail}</span>
          </p>
        </div>
        <a
          href={doc.signingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Preview signing page
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 py-10 px-6 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No preview available for this document</p>
    </div>
  )
}

export function ESignPage() {
  const { documents, loading, error, sendDocument, download, refresh } = useDocuments()
  const { agents } = useAgents()
  const { agentRecord } = useAuth()
  const { params, navigate } = useRouter()
  const [viewDoc, setViewDoc] = useState<Document | null>(null)

  // Deep-link: a notification click lands here with ?doc=<id>. Open that
  // document's View dialog once documents have loaded, then strip the param so
  // closing the dialog doesn't immediately re-open it.
  useEffect(() => {
    const docId = params.doc
    if (!docId || documents.length === 0) return
    const target = documents.find(d => d.id === docId)
    if (target) {
      setViewDoc(target)
      navigate('esign')
    }
  }, [params.doc, documents, navigate])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusTab, setStatusTab] = useState<StatusFilterValue>('all')
  const [search, setSearch] = useState('')

  const agentNameById = useMemo(
    () => new Map(agents.map(a => [a.id, a.name])),
    [agents],
  )

  const statusCounts = useMemo<Record<StatusFilterValue, number>>(() => {
    const counts = { all: documents.length, draft: 0, sent: 0, signed: 0, expired: 0 }
    for (const doc of documents) counts[doc.status]++
    return counts
  }, [documents])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return documents.filter(doc => {
      if (statusTab !== 'all' && doc.status !== statusTab) return false
      if (!term) return true
      const agentName = doc.agentId ? agentNameById.get(doc.agentId) ?? '' : ''
      return [doc.title, doc.clientName, doc.clientEmail, doc.property ?? '', agentName]
        .some(field => field.toLowerCase().includes(term))
    })
  }, [documents, statusTab, search, agentNameById])

  const { page, pageCount, pageItems, total, pageSize, next, prev } = usePagination(visible)

  async function handleDownload(doc: Document) {
    setDownloadingId(doc.id)
    try {
      await download(doc.id, doc.title)
      toast.success('Download started', { description: doc.title })
    } catch (e) {
      toast.error('Download failed', {
        description: e instanceof Error ? e.message : 'Could not download the signed PDF',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return <ESignPageSkeleton />

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  // Prefer the full recipient list; fall back to the legacy single-client columns.
  const viewSigners = viewDoc
    ? (viewDoc.recipients.length > 0
        ? viewDoc.recipients
        : [{ name: viewDoc.clientName, email: viewDoc.clientEmail, phone: viewDoc.clientPhone ?? '' }])
    : []

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-foreground">E-Sign</h1>
          <p className="text-sm text-muted-foreground">Records found: {visible.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setDrawerOpen(true)}>
            <FileSignature className="h-4 w-4" /> New Document
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterChips value={statusTab} onChange={setStatusTab} counts={statusCounts} />
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Document name, agent, recipient name or email…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-10 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow className="hover:bg-transparent border-border">
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map(doc => (
                <TableRow key={doc.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <Badge className={`shrink-0 capitalize ${STATUS_STYLES[doc.status]}`}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.agentId ? agentNameById.get(doc.agentId) ?? '—' : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                        <FileSignature className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground text-sm leading-tight max-w-64 truncate" title={doc.title}>
                        {doc.title}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">
                      {doc.clientName}
                      {doc.recipients.length > 1 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">+{doc.recipients.length - 1}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.clientEmail}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <p><span className="font-medium text-foreground">Sent:</span> {formatDate(doc.createdAt)}</p>
                    <p><span className="font-medium text-foreground">Completed:</span> {formatDate(doc.completedAt)}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-56 truncate" title={doc.property ?? ''}>
                    {doc.property ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewDoc(doc)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        {doc.status === 'signed' && isExternalPdfUrl(doc.downloadUrl) && (
                          <DropdownMenuItem
                            disabled={downloadingId === doc.id}
                            onClick={() => handleDownload(doc)}
                          >
                            {downloadingId === doc.id
                              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              : <Download className="mr-2 h-4 w-4" />}
                            Download
                          </DropdownMenuItem>
                        )}
                        {doc.status === 'sent' && doc.signingUrl && (
                          <DropdownMenuItem asChild>
                            <a href={doc.signingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> Open Signing Link
                            </a>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPrev={prev}
          onNext={next}
        />
      </div>

      {/* View dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex-1 truncate">{viewDoc?.title}</DialogTitle>
              {viewDoc && (
                <Badge className={`capitalize shrink-0 ${STATUS_STYLES[viewDoc.status]}`}>{viewDoc.status}</Badge>
              )}
            </div>
          </DialogHeader>

          {viewDoc && (
            <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              {/* Document preview */}
              <DocumentPreview doc={viewDoc} />

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-border pt-4">
                {viewDoc.property && (
                  <>
                    <span className="text-muted-foreground">Property</span>
                    <span className="text-foreground font-medium">{viewDoc.property}</span>
                  </>
                )}
                <span className="text-muted-foreground">{viewSigners.length > 1 ? 'Signers' : 'Client'}</span>
                <span className="text-foreground flex flex-col gap-1">
                  {viewSigners.map((s, i) => (
                    <span key={i}>
                      {s.name}
                      <span className="text-muted-foreground"> · {s.email}</span>
                      {s.phone && <span className="text-muted-foreground"> · {s.phone}</span>}
                    </span>
                  ))}
                </span>
                <span className="text-muted-foreground">Sent</span>
                <span className="text-foreground">{formatDate(viewDoc.createdAt)}</span>
                <span className="text-muted-foreground">Completed</span>
                <span className="text-foreground">{formatDate(viewDoc.completedAt)}</span>
                {viewDoc.expiresAt && (
                  <>
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-foreground">{formatDate(viewDoc.expiresAt)}</span>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="shrink-0 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setViewDoc(null)}>Close</Button>
            {viewDoc?.status === 'sent' && viewDoc.signingUrl && (
              <Button variant="outline" asChild>
                <a href={viewDoc.signingUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Open Signing Link
                </a>
              </Button>
            )}
            {viewDoc?.status === 'signed' && isExternalPdfUrl(viewDoc.downloadUrl) && (
              <Button
                disabled={downloadingId === viewDoc.id}
                onClick={() => handleDownload(viewDoc)}
                className="gap-2"
              >
                {downloadingId === viewDoc.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendDocumentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        agentId={agentRecord?.id ?? ''}
        onSend={async (payload) => {
          await sendDocument(payload)
          const who = payload.signers.length === 1
            ? payload.signers[0].name
            : `${payload.signers.length} signers`
          toast.success('Document sent', {
            description: `${payload.title} sent to ${who} for signature`,
          })
        }}
      />
    </div>
  )
}
