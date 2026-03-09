import { LineChart, Line, BarChart, Bar, ResponsiveContainer } from 'recharts'

interface MiniSparklineProps {
  data: number[]
  color: string
  variant: 'line' | 'bar'
}

export function MiniSparkline({ data, color, variant }: MiniSparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }))

  if (variant === 'line') {
    return (
      <div className="w-24 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-24 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barSize={6}>
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
