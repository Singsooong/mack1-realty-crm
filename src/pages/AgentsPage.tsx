import { useAgents } from '@/hooks/useAgents'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Phone, Mail, TrendingUp } from 'lucide-react'

export function AgentsPage() {
  const { agents, loading, error } = useAgents()

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading agents…</div>
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground">{agents.length} agents on your team</p>
        </div>
        <Button size="sm">+ Invite Agent</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <Card key={agent.id} className="hover:border-border transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                    <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.specialty}</p>
                  </div>
                </div>
                <Badge variant={agent.status === 'active' ? 'secondary' : 'outline'} className={agent.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950' : ''}>
                  {agent.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{agent.listings}</p>
                  <p className="text-xs text-muted-foreground">Listings</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{agent.sales}</p>
                  <p className="text-xs text-muted-foreground">Sales</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{agent.revenue}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{agent.rating} rating</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />Top performer</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" /> Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
