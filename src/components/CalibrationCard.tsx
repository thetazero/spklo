import type { MatchAnalysis } from '../engine/main'
import { computeCalibrationBuckets } from '../eval/metrics'
import { Table } from './Table'

interface CalibrationCardProps {
  matches: MatchAnalysis[]
  numBuckets?: number
}

export function CalibrationCard({ matches, numBuckets = 10 }: CalibrationCardProps) {
  const buckets = computeCalibrationBuckets(matches, numBuckets)

  const columns = [
    { header: 'Probability Range', type: 'string' as const },
    { header: 'Predicted', type: 'number' as const },
    { header: 'Observed', type: 'number' as const },
    { header: 'Difference', type: 'number' as const },
    { header: 'Count', type: 'number' as const }
  ]

  const rows = buckets.map((bucket) => {
    const relativeDifference = (bucket.predictedWinRate / bucket.observedWinRate - 1) * 100
    const diffColor ='text-gray-400'

    return [
      {
        simple: `${(bucket.minProb * 100).toFixed(0)}%-${(bucket.maxProb * 100).toFixed(0)}%`,
        rendered: `${(bucket.minProb * 100).toFixed(0)}% - ${(bucket.maxProb * 100).toFixed(0)}%`
      },
      {
        simple: bucket.predictedWinRate,
        rendered: `${(bucket.predictedWinRate * 100).toFixed(1)}%`
      },
      {
        simple: bucket.observedWinRate,
        rendered: `${(bucket.observedWinRate * 100).toFixed(1)}%`
      },
      {
        simple: relativeDifference,
        rendered: (
          <span className={`font-semibold ${diffColor}`}>
            {relativeDifference > 0 ? '+' : ''}{relativeDifference.toFixed(1)}%
          </span>
        )
      },
      {
        simple: bucket.count,
        rendered: <span className="text-gray-400">{bucket.count}</span>
      }
    ]
  })

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Model Calibration</h2>
      <Table columns={columns} rows={rows} />
    </div>
  )
}
