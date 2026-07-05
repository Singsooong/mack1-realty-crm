import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Info } from 'lucide-react'
import type { LeadsByMonthPoint } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-none shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-none bg-foreground" />
        Leads: <span className="font-semibold text-foreground">{payload[0].value}</span>
      </p>
    </div>
  )
}

export function LeadsTrendChart({ data }: { data: LeadsByMonthPoint[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-caption-sm uppercase text-muted-foreground">Leads Over Time</CardTitle>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">Last 6 months</span>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={32} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0 0 0 / 5%)' }} />
              {/* Single series → ink, not color. Nike: color only where it carries meaning. */}
              <Bar dataKey="leads" fill="var(--foreground)" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
