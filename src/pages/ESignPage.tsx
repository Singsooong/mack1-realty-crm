import { useState } from 'react'
import { documentsData } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FileSignature, Clock, Users, Calendar, Send, Eye, Download, MoreHorizontal } from 'lucide-react'
import type { Document } from '@/types'

const STATUS_STYLES: Record<Document['status'], string> = {
  draft: 'bg-zinc-800 text-zinc-300',
  sent: 'bg-blue-950 text-blue-400',
  signed: 'bg-emerald-950 text-emerald-400',
  expired: 'bg-red-950 text-red-400',
}

function DocumentCard({ doc, onView }: { doc: Document; onView: (doc: Document) => void }) {
  return (
    <Card className="hover:border-zinc-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0 mt-0.5">
              <FileSignature className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm leading-tight">{doc.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{doc.property}</p>
            </div>
          </div>
          <Badge className={`shrink-0 capitalize ${STATUS_STYLES[doc.status]}`}>{doc.status}</Badge>
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{doc.parties.join(' · ')}</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Created {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Expires {new Date(doc.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => onView(doc)}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          {doc.status === 'draft' && (
            <Button size="sm" className="flex-1 gap-1.5 text-xs">
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          )}
          {doc.status === 'signed' && (
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          )}
          {(doc.status === 'sent' || doc.status === 'expired') && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ESignPage() {
  const [viewDoc, setViewDoc] = useState<Document | null>(null)
  const byStatus = (status: Document['status']) => documentsData.filter(d => d.status === status)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">E-Sign</h1>
          <p className="text-sm text-muted-foreground">{documentsData.length} documents</p>
        </div>
        <Button size="sm" className="gap-2"><FileSignature className="h-4 w-4" /> New Document</Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({documentsData.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({byStatus('sent').length})</TabsTrigger>
          <TabsTrigger value="signed">Signed ({byStatus('signed').length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({byStatus('draft').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentsData.map(doc => <DocumentCard key={doc.id} doc={doc} onView={setViewDoc} />)}
          </div>
        </TabsContent>
        <TabsContent value="sent" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byStatus('sent').map(doc => <DocumentCard key={doc.id} doc={doc} onView={setViewDoc} />)}
          </div>
        </TabsContent>
        <TabsContent value="signed" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byStatus('signed').map(doc => <DocumentCard key={doc.id} doc={doc} onView={setViewDoc} />)}
          </div>
        </TabsContent>
        <TabsContent value="draft" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byStatus('draft').map(doc => <DocumentCard key={doc.id} doc={doc} onView={setViewDoc} />)}
          </div>
        </TabsContent>
      </Tabs>

      {/* View dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewDoc?.title}</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`capitalize ${STATUS_STYLES[viewDoc.status]}`}>{viewDoc.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Property</span>
                <span className="text-foreground font-medium">{viewDoc.property}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Parties</span>
                <span className="text-foreground">{viewDoc.parties.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{new Date(viewDoc.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="text-foreground">{new Date(viewDoc.expiresAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground text-center">
                Document preview would render here
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDoc(null)}>Close</Button>
            {viewDoc?.status === 'signed' && <Button><Download className="h-4 w-4 mr-2" />Download</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
