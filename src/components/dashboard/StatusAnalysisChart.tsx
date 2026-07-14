import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Info, Layers } from 'lucide-react'
import type { StatusSlice } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatusAnalysisChartProps {
  title?: string
  data: StatusSlice[]
}

export function StatusAnalysisChart({ title = 'Lead Pipeline', data }: StatusAnalysisChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-xs font-medium leading-normal uppercase text-muted-foreground">{title}</CardTitle>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No leads yet
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={data} cx={95} cy={95} innerRadius={58} outerRadius={88}
                    dataKey="value" startAngle={90} endAngle={-270} strokeWidth={2} stroke="var(--card)">
                    {data.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <Layers className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-lg font-bold text-foreground leading-none">{total.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">total</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {data.map((slice) => (
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
        )}
      </CardContent>
    </Card>
  )
}
