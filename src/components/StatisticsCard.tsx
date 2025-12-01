interface StatisticItemProps {
  label: string
  value: string | number
}

function StatisticItem({ label, value }: StatisticItemProps) {
  return (
    <div className="p-4 bg-gray-700 rounded">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
    </div>
  )
}

interface StatisticsCardProps {
  totalMatches: number
  bceLoss: number
}

export function StatisticsCard({ totalMatches, bceLoss }: StatisticsCardProps) {
  const averageBceLoss = totalMatches > 0 ? bceLoss / totalMatches : 0
  const impliedWinProbability = totalMatches > 0 ? Math.exp(-averageBceLoss) : 0

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatisticItem label="Total Matches" value={totalMatches} />
        <StatisticItem label="Total BCE Loss" value={bceLoss.toFixed(2)} />
        <StatisticItem label="Average BCE Loss" value={averageBceLoss.toFixed(4)} />
        <StatisticItem label="Implied Win Probability" value={`${(impliedWinProbability * 100).toFixed(2)}%`} />
      </div>
    </div>
  )
}
