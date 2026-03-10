import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Info, Layers } from 'lucide-react'
import { statusData } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function StatusAnalysisChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base">Status Analysis</CardTitle>
          <Info className="h-4 w-4 text-muted-foreground" />
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
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={statusData} cx={95} cy={95} innerRadius={58} outerRadius={88}
                  dataKey="value" startAngle={90} endAngle={-270} strokeWidth={2} stroke="var(--card)">
                  {statusData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex items-center justify-center w-10 h-10 rounded-full bg-muted">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {statusData.map((slice) => (
              <div key={slice.label} className="flex items-center gap-2.5">
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <div className="flex flex-col leading-none">
                  <span className="text-xs text-muted-foreground">{slice.label}</span>
                  <span className="text-sm font-bold text-foreground">{slice.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
