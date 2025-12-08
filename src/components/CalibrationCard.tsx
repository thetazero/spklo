import type { MatchAnalysis } from '../engine/main'
import { Table } from './Table'

interface CalibrationBucket {
  minProb: number
  maxProb: number
  predictedWinRate: number
  observedWinRate: number
  count: number
}

interface CalibrationCardProps {
  matches: MatchAnalysis[]
  numBuckets?: number
}

function calculateCalibrationBuckets(matches: MatchAnalysis[], numBuckets: number): CalibrationBucket[] {
  const bucketSize = 0.5 / numBuckets  // Only 50-100% range
  const buckets: CalibrationBucket[] = []

  // Create data points for both wins and losses (inverted probabilities)
  const dataPoints: Array<{ probability: number; won: boolean }> = []

  for (const match of matches) {
    // Add the win with its predicted probability
    dataPoints.push({
      probability: match.expectedWinProbability,
      won: true
    })

    // Add the corresponding loss with inverted probability
    dataPoints.push({
      probability: 1 - match.expectedWinProbability,
      won: false
    })
  }

  for (let i = numBuckets - 1; i >= 0; i--) {
    const minProb = 0.5 + i * bucketSize
    const maxProb = 0.5 + (i + 1) * bucketSize

    const pointsInBucket = dataPoints.filter(
      p => p.probability >= minProb && p.probability < maxProb
    )

    // For the last bucket (highest range), include 1.0 probability
    if (i === numBuckets - 1) {
      pointsInBucket.push(
        ...dataPoints.filter(p => p.probability === 1.0)
      )
    }

    if (pointsInBucket.length > 0) {
      const totalPredicted = pointsInBucket.reduce((sum, p) => sum + p.probability, 0)
      const predictedWinRate = totalPredicted / pointsInBucket.length

      const wins = pointsInBucket.filter(p => p.won).length
      const observedWinRate = wins / pointsInBucket.length

      buckets.push({
        minProb,
        maxProb,
        predictedWinRate,
        observedWinRate,
        count: pointsInBucket.length
      })
    }
  }

  return buckets
}

export function CalibrationCard({ matches, numBuckets = 10 }: CalibrationCardProps) {
  const buckets = calculateCalibrationBuckets(matches, numBuckets)

  const columns = [
    { header: 'Probability Range', type: 'string' as const },
    { header: 'Predicted', type: 'number' as const },
    { header: 'Observed', type: 'number' as const },
    { header: 'Difference', type: 'number' as const },
    { header: 'Count', type: 'number' as const }
  ]

  // Calculate overall statistics for "All" row
  const totalCount = buckets.reduce((sum, b) => sum + b.count, 0)

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
