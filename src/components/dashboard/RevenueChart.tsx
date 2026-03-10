import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Info } from 'lucide-react'
import { revenueData } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function formatYAxis(value: number): string {
  if (value === 0) return '0'
  if (value >= 1000000) return `$${value / 1000000}M`
  if (value >= 1000) return `$${value / 1000}k`
  return `$${value}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; fill: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: entry.fill }} />
          {entry.name === 'deals' ? 'Deals' : 'Deal value'}:{' '}
          <span className="font-semibold text-foreground">{formatYAxis(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function RevenueChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base">Revenue Generation</CardTitle>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-muted-foreground/60" />Deals
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-muted-foreground/30" />Deal value
            </span>
          </div>
          <Select defaultValue="2025">
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={48} ticks={[0, 100000, 200000, 400000, 600000, 700000]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0 0 0 / 5%)' }} />
              <Bar dataKey="deals" fill="oklch(0.35 0 0)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="dealValue" fill="oklch(0.55 0 0)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
